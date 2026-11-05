import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { createClient } from '@supabase/supabase-js'
import type { Session } from '@supabase/supabase-js'
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  CalendarCheck,
  CalendarDays,
  Check,
  ChevronRight,
  CircleUserRound,
  Clock3,
  Compass,
  ExternalLink,
  Heart,
  LockKeyhole,
  LogOut,
  Mail,
  MapPin,
  QrCode,
  Search,
  Share2,
  SlidersHorizontal,
  Sparkles,
  Ticket,
  UsersRound,
  X,
} from 'lucide-react'
import './App.css'

type RawRow = Record<string, unknown>
type Screen = 'explore' | 'registrations' | 'profile'
type AuthMode = 'sign-in' | 'sign-up'

interface EventItem {
  id: string
  title: string
  category: string
  date: string
  location: string
  description: string
  image: string
  organizer: string
  attendees?: number
  capacity?: number
  seatsLeft?: number
  status: string
  requirements: string[]
}

interface Registration {
  id: string
  eventId: string
}

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? ''
const pageLoadTime = Date.now()
const photoGallery = [
  'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1400&q=85',
  'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1400&q=85',
  'https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1400&q=85',
  'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1400&q=85',
]
const eventDetails = (raw: RawRow, index = 0): EventItem => {
  const value = (...keys: string[]) => {
    for (const key of keys) {
      const item = raw[key]
      if (typeof item === 'string' || typeof item === 'number') {
        const text = String(item).trim()
        if (text) return text
      }
    }
    return ''
  }
  const numeric = (...keys: string[]) => {
    for (const key of keys) {
      const item = raw[key]
      if (typeof item === 'number' && Number.isFinite(item)) return item
      if (typeof item === 'string' && item.trim() && Number.isFinite(Number(item))) return Number(item)
    }
    return undefined
  }
  const capacity = numeric('capacity', 'max_attendees', 'seat_limit', 'registration_limit')
  const attendeeCount = numeric('attendee_count', 'registration_count', 'registrations_count', 'confirmed_count')
  const directSeats = numeric('seats_left', 'available_seats', 'spots_remaining')
  const requirements = raw.requirements

  return {
    id: value('id', 'event_id'),
    title: value('title', 'name', 'event_name') || 'Campus event',
    category: value('category', 'category_name', 'type') || 'Campus',
    date: value('starts_at', 'start_at', 'start_time', 'event_date', 'date'),
    location: value('venue', 'location', 'venue_name') || 'Campus venue',
    description: value('description', 'details', 'about') || 'Meet new people, learn something new, and connect with your campus community.',
    image: value('image_url', 'banner_url', 'cover_image', 'image') || photoGallery[index % photoGallery.length],
    organizer: value('organizer_name', 'organizer', 'host') || 'Campus community',
    attendees: attendeeCount,
    capacity,
    seatsLeft: directSeats ?? (capacity !== undefined && attendeeCount !== undefined ? capacity - attendeeCount : undefined),
    status: value('status').toLowerCase(),
    requirements: Array.isArray(requirements) ? requirements.filter((item): item is string => typeof item === 'string') : [],
  }
}

const unavailableMessage = (event: EventItem) => {
  if (event.status === 'cancelled' || event.status === 'canceled') return 'This event has been cancelled.'
  if (event.status === 'completed') return 'This event has ended.'
  if (event.status === 'closed') return 'Registration is closed for this event.'
  if (event.status === 'full' || (event.seatsLeft !== undefined && event.seatsLeft <= 0)) return 'This event is full. Check back for a waitlist.'
  return ''
}

const formatDate = (value: string) => {
  if (!value) return 'Date to be announced'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(date)
}

const formatTime = (value: string) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('en', { hour: 'numeric', minute: '2-digit' }).format(date)
}

const calendarLink = (event: EventItem) => {
  const start = new Date(event.date)
  if (!event.date || Number.isNaN(start.getTime())) return ''
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000)
  const toCalendarDate = (date: Date) => date.toISOString().replace(/[-:]|\.\d{3}/g, '')
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${toCalendarDate(start)}/${toCalendarDate(end)}`,
    details: event.description,
    location: event.location,
  })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

const readError = async (response: Response) => {
  const body: unknown = await response.json().catch(() => null)
  if (body && typeof body === 'object' && 'error' in body && typeof body.error === 'string') return body.error
  return `Request failed (${response.status}). Please try again.`
}

const configuredSupabase =
  import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
    ? createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY)
    : null

function App() {
  const [screen, setScreen] = useState<Screen>('explore')
  const [events, setEvents] = useState<EventItem[]>([])
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null)
  const [confirmedEvent, setConfirmedEvent] = useState<EventItem | null>(null)
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [session, setSession] = useState<Session | null>(null)
  const [loadingEvents, setLoadingEvents] = useState(true)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [loadingRegistrations, setLoadingRegistrations] = useState(false)
  const [pageError, setPageError] = useState('')
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [savedEvents, setSavedEvents] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('campusconnect-saved-events')
      return saved ? JSON.parse(saved) as string[] : []
    } catch {
      return []
    }
  })
  const [authOpen, setAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState<AuthMode>('sign-in')
  const [authError, setAuthError] = useState('')
  const [authMessage, setAuthMessage] = useState('')
  const [authBusy, setAuthBusy] = useState(false)
  const [pendingRegistration, setPendingRegistration] = useState<string | null>(null)
  const [toast, setToast] = useState('')

  const categories = useMemo(() => {
    const fromEvents = events.map((event) => event.category).filter((category) => category !== 'Campus')
    return ['All', ...new Set(fromEvents.length ? fromEvents : ['AI', 'Robotics', 'Open Source', 'Design & UX'])]
  }, [events])
  const visibleEvents = useMemo(() => {
    const query = search.trim().toLowerCase()
    return events.filter((event) => {
      const matchesCategory = activeCategory === 'All' || event.category.toLowerCase() === activeCategory.toLowerCase()
      const matchesSearch = !query || [event.title, event.description, event.category, event.location].some((item) => item.toLowerCase().includes(query))
      return matchesCategory && matchesSearch
    })
  }, [activeCategory, events, search])

  const loadEvents = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/api/events`)
      if (!response.ok) throw new Error(await readError(response))
      const rows: unknown = await response.json()
      if (!Array.isArray(rows)) throw new Error('The events API returned an unexpected response.')
      setEvents(rows.filter((row): row is RawRow => Boolean(row) && typeof row === 'object').map(eventDetails).filter((event) => event.id))
    } catch (error) {
      setPageError(error instanceof Error ? error.message : 'Unable to load events.')
    } finally {
      setLoadingEvents(false)
    }
  }, [])

  const loadRegistrations = useCallback(async (accessToken: string) => {
    setLoadingRegistrations(true)
    try {
      const response = await fetch(`${API_BASE}/api/me/registrations`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (!response.ok) throw new Error(await readError(response))
      const rows: unknown = await response.json()
      if (!Array.isArray(rows)) throw new Error('The registrations API returned an unexpected response.')
      setRegistrations(rows.filter((row): row is RawRow => Boolean(row) && typeof row === 'object').map((row, index) => ({
        id: String(row.id ?? `registration-${index}`),
        eventId: String(row.event_id ?? ''),
      })).filter((row) => row.eventId))
    } catch (error) {
      setPageError(error instanceof Error ? error.message : 'Unable to load your registrations.')
    } finally {
      setLoadingRegistrations(false)
    }
  }, [])

  useEffect(() => {
    const request = window.setTimeout(() => { void loadEvents() }, 0)
    return () => window.clearTimeout(request)
  }, [loadEvents])

  useEffect(() => {
    if (!configuredSupabase) return
    void configuredSupabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      if (data.session) void loadRegistrations(data.session.access_token)
    })
    const { data: { subscription } } = configuredSupabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      if (nextSession) void loadRegistrations(nextSession.access_token)
      else setRegistrations([])
    })
    return () => subscription.unsubscribe()
  }, [loadRegistrations])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(''), 3500)
    return () => window.clearTimeout(timer)
  }, [toast])

  const showScreen = (nextScreen: Screen) => {
    setPageError('')
    setSelectedEvent(null)
    if (nextScreen !== 'registrations') setConfirmedEvent(null)
    setScreen(nextScreen)
    if (nextScreen === 'registrations' && session?.access_token) {
      setLoadingRegistrations(true)
      void loadRegistrations(session.access_token)
    }
    if (nextScreen === 'registrations' && !session) {
      setAuthMode('sign-in')
      setAuthOpen(true)
      setAuthError('')
    }
  }

  const retryEvents = () => {
    setPageError('')
    setLoadingEvents(true)
    void loadEvents()
  }

  const openEvent = async (event: EventItem) => {
    setScreen('explore')
    setSelectedEvent(event)
    setLoadingDetails(true)
    setPageError('')
    try {
      const response = await fetch(`${API_BASE}/api/events/${encodeURIComponent(event.id)}`)
      if (!response.ok) throw new Error(await readError(response))
      const row: unknown = await response.json()
      if (!row || typeof row !== 'object') throw new Error('The event API returned an unexpected response.')
      setSelectedEvent(eventDetails(row as RawRow, events.indexOf(event)))
    } catch (error) {
      setPageError(error instanceof Error ? error.message : 'Unable to load this event.')
    } finally {
      setLoadingDetails(false)
    }
  }

  const performRegistration = async (eventId: string, accessToken: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/registrations`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_id: eventId }),
      })
      if (!response.ok) throw new Error(await readError(response))
      setConfirmedEvent(events.find((event) => event.id === eventId) ?? (selectedEvent?.id === eventId ? selectedEvent : null))
      setSelectedEvent(null)
      setScreen('registrations')
      setToast('')
      await loadRegistrations(accessToken)
    } catch (error) {
      setToast(error instanceof Error ? error.message : 'Unable to register for this event.')
    }
  }

  const registerForEvent = (event: EventItem) => {
    if (registrations.some((registration) => registration.eventId === event.id)) {
      setToast('You’re already registered for this event.')
      return
    }
    const unavailable = unavailableMessage(event)
    if (unavailable) {
      setToast(unavailable)
      return
    }
    if (!session?.access_token) {
      setPendingRegistration(event.id)
      setAuthMode('sign-in')
      setAuthOpen(true)
      setAuthError('')
      setAuthMessage('')
      return
    }
    void performRegistration(event.id, session.access_token)
  }

  const toggleSaved = (eventId: string) => {
    setSavedEvents((current) => {
      const next = current.includes(eventId) ? current.filter((id) => id !== eventId) : [...current, eventId]
      localStorage.setItem('campusconnect-saved-events', JSON.stringify(next))
      return next
    })
  }

  const handleAuth = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!configuredSupabase) {
      setAuthError('Set SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY in backend/.env to enable sign-in.')
      return
    }
    const formData = new FormData(event.currentTarget)
    const email = String(formData.get('email') ?? '').trim()
    const password = String(formData.get('password') ?? '')
    setAuthBusy(true)
    setAuthError('')
    setAuthMessage('')

    try {
      const result = authMode === 'sign-in'
        ? await configuredSupabase.auth.signInWithPassword({ email, password })
        : await configuredSupabase.auth.signUp({ email, password })
      if (result.error) throw result.error
      if (!result.data.session) {
        setAuthMessage('Check your email to confirm your account, then sign in.')
        return
      }
      setSession(result.data.session)
      setAuthOpen(false)
      setAuthMessage('')
      const registrationEvent = pendingRegistration
      setPendingRegistration(null)
      if (registrationEvent) await performRegistration(registrationEvent, result.data.session.access_token)
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Unable to sign in.')
    } finally {
      setAuthBusy(false)
    }
  }

  const signOut = async () => {
    if (!configuredSupabase) return
    const { error } = await configuredSupabase.auth.signOut()
    if (error) {
      setToast(error.message)
      return
    }
    setSession(null)
    setScreen('explore')
    setToast('You’ve been signed out.')
  }

  const openShare = async () => {
    if (!selectedEvent) return
    const shareData = { title: selectedEvent.title, text: selectedEvent.description, url: window.location.href }
    try {
      if (navigator.share) await navigator.share(shareData)
      else {
        await navigator.clipboard.writeText(`${selectedEvent.title} — ${window.location.href}`)
        setToast('Event link copied.')
      }
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') setToast('Unable to share this event.')
    }
  }

  const registrationEvents = registrations.map((registration) => ({
    registration,
    event: events.find((item) => item.id === registration.eventId),
  }))

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-inner">
          <button className="brand" onClick={() => showScreen('explore')} type="button" aria-label="CampusConnect home">
            <span className="brand-mark"><Compass size={21} strokeWidth={2.2} /></span>
            <span className="brand-copy"><strong>CampusConnect</strong><small>Find your people. Find your place.</small></span>
          </button>
          <nav className="desktop-nav" aria-label="Main navigation">
            <button className={screen === 'explore' ? 'nav-link active' : 'nav-link'} onClick={() => showScreen('explore')} type="button">Explore events</button>
            <button className={screen === 'registrations' ? 'nav-link active' : 'nav-link'} onClick={() => showScreen('registrations')} type="button">My registrations</button>
          </nav>
          <button className="profile-button" onClick={() => showScreen('profile')} type="button" aria-label="Open profile">
            {session?.user.email ? session.user.email.slice(0, 1).toUpperCase() : <CircleUserRound size={22} />}
          </button>
        </div>
      </header>

      <main className={selectedEvent ? 'main-content detail-main' : 'main-content'}>
        {selectedEvent ? (
          <EventDetail
            event={selectedEvent}
            isRegistered={registrations.some((registration) => registration.eventId === selectedEvent.id)}
            isSaved={savedEvents.includes(selectedEvent.id)}
            isLoading={loadingDetails}
            onBack={() => { setSelectedEvent(null); setPageError('') }}
            onRegister={() => registerForEvent(selectedEvent)}
            onSave={() => toggleSaved(selectedEvent.id)}
            onShare={() => void openShare()}
          />
        ) : screen === 'registrations' ? (
          <RegistrationsView
            items={registrationEvents}
            isLoading={loadingRegistrations}
            confirmation={confirmedEvent}
            onDismissConfirmation={() => setConfirmedEvent(null)}
            onExplore={() => showScreen('explore')}
            onOpenEvent={openEvent}
          />
        ) : screen === 'profile' ? (
          <ProfileView
            email={session?.user.email}
            isConfigured={Boolean(configuredSupabase)}
            onSignIn={() => { setAuthMode('sign-in'); setAuthOpen(true); setAuthError('') }}
            onSignOut={() => void signOut()}
          />
        ) : (
          <ExploreView
            events={visibleEvents}
            categories={categories}
            activeCategory={activeCategory}
            search={search}
            isLoading={loadingEvents}
            error={pageError}
            savedEvents={savedEvents}
            onSearch={setSearch}
            onCategory={setActiveCategory}
            onRetry={retryEvents}
            onOpenEvent={openEvent}
            onToggleSaved={toggleSaved}
          />
        )}
      </main>

      {!selectedEvent && (
        <BottomNav screen={screen} onNavigate={showScreen} />
      )}

      {authOpen && (
        <AuthDialog
          mode={authMode}
          error={authError}
          message={authMessage}
          busy={authBusy}
          configured={Boolean(configuredSupabase)}
          onClose={() => { setAuthOpen(false); setPendingRegistration(null) }}
          onModeChange={(mode) => { setAuthMode(mode); setAuthError(''); setAuthMessage('') }}
          onSubmit={handleAuth}
        />
      )}
      {pageError && (selectedEvent || screen !== 'explore') && <div className="inline-error" role="alert">{pageError}</div>}
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  )
}

interface ExploreProps {
  events: EventItem[]
  categories: string[]
  activeCategory: string
  search: string
  isLoading: boolean
  error: string
  savedEvents: string[]
  onSearch: (value: string) => void
  onCategory: (value: string) => void
  onRetry: () => void
  onOpenEvent: (event: EventItem) => void
  onToggleSaved: (id: string) => void
}

function ExploreView(props: ExploreProps) {
  return (
    <div className="explore-page">
      <section className="welcome">
        <span className="eyebrow"><span className="live-dot" /> YOUR CAMPUS, A LITTLE CLOSER</span>
        <h1>Find your next<br className="mobile-break" /> campus experience.</h1>
        <p>Discover workshops, meetups, and big ideas happening right around you.</p>
        <div className="welcome-stats">
          <span><Sparkles size={15} /> Made for campus life</span>
          <span><UsersRound size={15} /> Better together</span>
        </div>
      </section>

      <section className="event-tools" aria-label="Find events">
        <label className="search-field">
          <Search size={19} />
          <input value={props.search} onChange={(event) => props.onSearch(event.target.value)} placeholder="Search events, places, or interests" />
          <SlidersHorizontal className="search-filter-icon" size={17} />
        </label>
        <div className="category-row" aria-label="Event categories">
          {props.categories.map((category, index) => (
            <button key={category} className={props.activeCategory === category ? 'category-chip selected' : 'category-chip'} onClick={() => props.onCategory(category)} type="button">
              {index === 0 ? <Sparkles size={14} /> : <span className="category-dot" />}
              {category}
            </button>
          ))}
        </div>
      </section>

      <section className="events-section">
        <div className="section-heading">
          <div><p className="section-kicker">A GOOD PLACE TO START</p><h2>Coming up on campus</h2></div>
          {!props.isLoading && <span className="event-count">{props.events.length} {props.events.length === 1 ? 'event' : 'events'}</span>}
        </div>
        {props.error ? (
          <div className="state-card error-card"><div className="state-icon"><X size={20} /></div><h3>We couldn’t load events</h3><p>{props.error}</p><button className="button button-outline" onClick={props.onRetry} type="button">Try again</button></div>
        ) : props.isLoading ? (
          <div className="event-grid">{[0, 1, 2].map((item) => <div className="event-skeleton" key={item}><span /><div><i /><i /><i /></div></div>)}</div>
        ) : props.events.length ? (
          <div className="event-grid">
            {props.events.map((event, index) => (
              <EventCard
                event={event}
                key={event.id}
                index={index}
                isSaved={props.savedEvents.includes(event.id)}
                onOpen={() => props.onOpenEvent(event)}
                onToggleSaved={() => props.onToggleSaved(event.id)}
              />
            ))}
          </div>
        ) : (
          <div className="state-card"><div className="state-icon"><Search size={20} /></div><h3>No events found</h3><p>Try a different search or category. Your next favorite thing might be one tap away.</p><button className="button button-outline" onClick={() => { props.onSearch(''); props.onCategory('All') }} type="button">Clear filters</button></div>
        )}
      </section>
      <section className="community-callout">
        <div className="callout-icon"><Heart size={20} /></div>
        <div><strong>Good things happen when we show up.</strong><p>Find your next idea, teammate, or favorite campus memory.</p></div>
        <ArrowRight className="callout-arrow" size={19} />
      </section>
    </div>
  )
}

function EventCard({ event, index, isSaved, onOpen, onToggleSaved }: { event: EventItem; index: number; isSaved: boolean; onOpen: () => void; onToggleSaved: () => void }) {
  const [imageFailed, setImageFailed] = useState(false)
  const time = formatTime(event.date)
  return (
    <article className="event-card">
      <div className="event-image-wrap">
        {imageFailed ? <div className={`event-image-fallback image-tone-${index % 4}`}><Sparkles size={32} /><span>{event.category}</span></div> : <img className="event-image" src={event.image} alt="" onError={() => setImageFailed(true)} />}
        <span className="event-category-label">{event.category}</span>
        <button className={isSaved ? 'save-button saved' : 'save-button'} onClick={onToggleSaved} type="button" aria-label={isSaved ? 'Remove saved event' : 'Save event'}>
          <Bookmark size={17} fill={isSaved ? 'currentColor' : 'none'} />
        </button>
        {event.seatsLeft !== undefined && <span className={event.seatsLeft <= 5 ? 'availability urgent' : 'availability'}>{event.seatsLeft <= 0 ? 'Waitlist only' : `${event.seatsLeft} spots left`}</span>}
      </div>
      <div className="event-card-body">
        <div className="event-meta"><span><CalendarDays size={14} /> {formatDate(event.date)}</span>{time && <span className="meta-time"><Clock3 size={14} /> {time}</span>}</div>
        <h3>{event.title}</h3>
        <p className="event-description">{event.description}</p>
        <div className="event-card-footer">
          <span className="location-meta"><MapPin size={15} /> {event.location}</span>
          {(event.attendees !== undefined || event.capacity !== undefined) && <span className="attendee-meta"><UsersRound size={14} /> {event.attendees ?? `${event.capacity} capacity`}</span>}
        </div>
        <button className="button button-primary event-details-button" onClick={onOpen} type="button">View event <ArrowRight size={16} /></button>
      </div>
    </article>
  )
}

function EventDetail({ event, isRegistered, isSaved, isLoading, onBack, onRegister, onSave, onShare }: {
  event: EventItem
  isRegistered: boolean
  isSaved: boolean
  isLoading: boolean
  onBack: () => void
  onRegister: () => void
  onSave: () => void
  onShare: () => void
}) {
  const [imageFailed, setImageFailed] = useState(false)
  const unavailable = Boolean(unavailableMessage(event))
  const full = event.status === 'full' || (event.seatsLeft !== undefined && event.seatsLeft <= 0)
  let statusLabel = event.status
  if (event.seatsLeft !== undefined) {
    statusLabel = event.seatsLeft > 0 ? `${event.seatsLeft} spots left` : 'Registration is full'
  } else if (event.status === 'full') {
    statusLabel = 'Registration is full'
  } else if (event.status === 'closed') {
    statusLabel = 'Registration closed'
  } else if (event.status === 'cancelled' || event.status === 'canceled') {
    statusLabel = 'Event cancelled'
  } else if (event.status === 'completed') {
    statusLabel = 'Event completed'
  } else if (event.capacity !== undefined) {
    statusLabel = `Capacity: ${event.capacity}`
  } else if (event.status === 'open') {
    statusLabel = 'Registration open'
  }
  return (
    <article className="detail-page">
      <button className="back-link" onClick={onBack} type="button"><ArrowLeft size={17} /> Back to events <ChevronRight className="back-chevron" size={14} /> {event.title}</button>
      <div className="detail-layout">
        <div className="detail-primary">
          <div className="detail-hero">
            {imageFailed ? <div className="detail-image-fallback"><Sparkles size={40} /><span>{event.category}</span></div> : <img src={event.image} alt="" onError={() => setImageFailed(true)} />}
            <div className="detail-image-shade" />
            <span className="detail-event-tag">{event.category}</span>
            <div className="hero-actions">
              <button onClick={onSave} type="button" aria-label={isSaved ? 'Unsave event' : 'Save event'}><Bookmark size={18} fill={isSaved ? 'currentColor' : 'none'} /></button>
              <button onClick={onShare} type="button" aria-label="Share event"><Share2 size={18} /></button>
            </div>
            <div className="hero-image-caption"><span><Sparkles size={14} /> CAMPUS COMMUNITY EVENT</span>{event.attendees !== undefined && <span><UsersRound size={14} /> {event.attendees} going</span>}</div>
          </div>
          <section className="detail-card event-summary">
            <span className="eyebrow"><span className="live-dot" /> A REASON TO GET TOGETHER</span>
            <h1>{event.title}</h1>
            <p className="host-line"><CircleUserRound size={16} /> Hosted by <strong>{event.organizer}</strong></p>
            <div className="detail-pills">
              <span><CalendarDays size={15} /> {formatDate(event.date)}</span>
              {formatTime(event.date) && <span><Clock3 size={15} /> {formatTime(event.date)}</span>}
              <span><MapPin size={15} /> {event.location}</span>
            </div>
            {statusLabel && <span className={full ? 'seats-note urgent' : 'seats-note'}>{statusLabel}</span>}
          </section>
          <section className="detail-card about-card">
            <div className="card-title"><span className="title-icon"><Sparkles size={17} /></span><h2>A little about this one</h2></div>
            <p className="about-copy">{event.description}</p>
            <div className="perks-grid">
              <div><span className="perk-icon mint"><UsersRound size={18} /></span><strong>Good company</strong><small>Meet your campus community</small></div>
              <div><span className="perk-icon lilac"><Sparkles size={18} /></span><strong>New ideas</strong><small>Learn something together</small></div>
              <div><span className="perk-icon peach"><Heart size={18} /></span><strong>Made for you</strong><small>A place to belong</small></div>
            </div>
          </section>
          {event.requirements.length > 0 && (
            <section className="detail-card requirements-card">
              <div className="card-title"><span className="title-icon"><Check size={17} /></span><h2>Before you head out</h2></div>
              <ul>{event.requirements.map((requirement) => <li key={requirement}><span><Check size={14} /></span>{requirement}</li>)}</ul>
            </section>
          )}
          <section className="detail-card venue-card">
            <div className="venue-heading"><div className="card-title"><span className="title-icon"><MapPin size={17} /></span><h2>Where to meet</h2></div><span>{event.location}</span></div>
            <div className="map-placeholder"><span className="map-pin"><MapPin size={24} /></span><span className="map-label">{event.location}</span></div>
            <a className="directions-link" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`} target="_blank" rel="noreferrer">Get directions <ExternalLink size={14} /></a>
          </section>
        </div>
        <aside className="detail-aside">
          <div className="aside-card">
            <div className="aside-status"><span className={full ? 'status-dot full' : 'status-dot'} /> {isRegistered ? 'You’re on the list' : full ? 'Registration is full' : 'Come along'}</div>
            <h2>{isRegistered ? 'Your seat is saved.' : full ? 'Join the waitlist.' : 'Make some plans.'}</h2>
            <p>{isRegistered ? 'You’re all set. We can’t wait to see you there.' : 'Save your spot and bring a friend along.'}</p>
            <button className={`button ${isRegistered ? 'button-success' : unavailable ? 'button-muted' : 'button-primary'} register-button`} onClick={onRegister} disabled={isRegistered || isLoading || unavailable}>
              {isRegistered ? <><Check size={17} /> You’re registered</> : full ? <><CalendarCheck size={17} /> Event full</> : unavailable ? <><CalendarCheck size={17} /> Registration closed</> : isLoading ? 'Loading event…' : <><Ticket size={17} /> Register for free</>}
            </button>
            <div className="aside-details"><span><CalendarDays size={15} /> {formatDate(event.date)}</span><span><MapPin size={15} /> {event.location}</span></div>
          </div>
          <div className="aside-note"><span className="note-icon"><Heart size={16} /></span><p><strong>Plans change.</strong> If you can’t make it, remember to free up your spot for someone else.</p></div>
        </aside>
      </div>
      <div className="mobile-register-bar">
        <div><strong>{full ? 'Waitlist only' : 'Your next good thing'}</strong><span>{event.seatsLeft === undefined ? event.category : `${event.seatsLeft} spots left`}</span></div>
        <button className={`button ${isRegistered ? 'button-success' : unavailable ? 'button-muted' : 'button-primary'}`} disabled={isRegistered || unavailable || isLoading} onClick={onRegister}>{isRegistered ? <><Check size={16} /> Registered</> : full ? <><CalendarCheck size={16} /> Event full</> : unavailable ? <><CalendarCheck size={16} /> Closed</> : <><Ticket size={16} /> Register</>}</button>
      </div>
    </article>
  )
}

function RegistrationsView({ items, isLoading, confirmation, onDismissConfirmation, onExplore, onOpenEvent }: {
  items: { registration: Registration; event?: EventItem }[]
  isLoading: boolean
  confirmation: EventItem | null
  onDismissConfirmation: () => void
  onExplore: () => void
  onOpenEvent: (event: EventItem) => void
}) {
  const [filter, setFilter] = useState<'Upcoming' | 'Past'>('Upcoming')
  const filtered = items.filter(({ event }) => {
    if (!event?.date) return filter === 'Upcoming'
    const time = new Date(event.date).getTime()
    if (Number.isNaN(time)) return filter === 'Upcoming'
    return filter === 'Upcoming' ? time >= pageLoadTime : time < pageLoadTime
  })

  return (
    <section className="registrations-page">
      <div className="page-intro"><span className="eyebrow"><Ticket size={14} /> YOUR CAMPUS PLANS</span><h1>My registrations</h1><p>All the good things you’ve got coming up.</p></div>
      {confirmation && (
        <section className="registration-confirmation" aria-label="Registration confirmed">
          <button className="confirmation-dismiss" onClick={onDismissConfirmation} type="button" aria-label="Dismiss confirmation"><X size={16} /></button>
          <span className="confirmation-badge"><Check size={13} /> CONFIRMED &amp; SAVED</span>
          <h2>You’re registered for {confirmation.title}!</h2>
          <p>Your spot is saved. Bring your campus pass and we’ll see you there.</p>
          <div className="confirmation-pass"><span><Ticket size={17} /> Digital campus pass</span><strong>PASS · {confirmation.id.slice(-8).toUpperCase()}</strong></div>
          <div className="confirmation-actions">
            <button className="button button-outline" onClick={() => onOpenEvent(confirmation)} type="button"><CalendarCheck size={15} /> View event</button>
            {calendarLink(confirmation) && <a className="button button-primary" href={calendarLink(confirmation)} target="_blank" rel="noreferrer"><CalendarDays size={15} /> Add to calendar</a>}
          </div>
        </section>
      )}
      <div className="registrations-toolbar"><div><h2>Your event list</h2><span className="count-bubble">{items.length}</span></div><div className="segmented-control">{(['Upcoming', 'Past'] as const).map((value) => <button className={filter === value ? 'selected' : ''} key={value} onClick={() => setFilter(value)} type="button">{value}</button>)}</div></div>
      {isLoading ? <div className="registration-skeleton" /> : filtered.length ? (
        <div className="registration-list">
          {filtered.map(({ registration, event }) => event ? (
            <button className="registration-card" key={registration.id} onClick={() => onOpenEvent(event)} type="button">
              <img src={event.image} alt="" />
              <div className="registration-copy"><span className="registration-badge"><Check size={12} /> Registered <i /> {event.category}</span><h3>{event.title}</h3><p><CalendarDays size={14} /> {formatDate(event.date)}{formatTime(event.date) ? ` · ${formatTime(event.date)}` : ''}</p><p><MapPin size={14} /> {event.location}</p><span className="registration-open">View event <ArrowRight size={14} /></span></div>
              <span className="registration-ticket"><Ticket size={18} /><small>YOUR PASS</small></span>
            </button>
          ) : (
            <div className="registration-card missing-event" key={registration.id}><span className="missing-ticket"><Ticket size={20} /></span><div><h3>Campus event</h3><p>Your registration is saved, but this event is no longer listed.</p></div></div>
          ))}
        </div>
      ) : (
        <div className="state-card empty-registration"><div className="state-icon"><CalendarCheck size={21} /></div><h3>{items.length ? `No ${filter.toLowerCase()} events` : 'Your next adventure is out there'}</h3><p>{items.length ? 'Switch between upcoming and past to see your event history.' : 'Once you register for an event, you’ll find it here.'}</p>{items.length === 0 && <button className="button button-primary" onClick={onExplore} type="button">Explore events <ArrowRight size={16} /></button>}</div>
      )}
      <div className="sync-note"><span><QrCode size={18} /></span><p><strong>Your campus pass is ready.</strong><br />Registered events are linked to your account.</p></div>
    </section>
  )
}

function ProfileView({ email, isConfigured, onSignIn, onSignOut }: { email?: string; isConfigured: boolean; onSignIn: () => void; onSignOut: () => void }) {
  return (
    <section className="profile-page">
      <div className="page-intro"><span className="eyebrow"><CircleUserRound size={14} /> YOUR SPACE</span><h1>A little about you.</h1><p>Your campus account, all in one place.</p></div>
      <div className="profile-card">
        <span className="profile-avatar"><CircleUserRound size={30} /></span>
        <h2>{email || 'Welcome to CampusConnect'}</h2>
        <p>{email ? 'You’re signed in and ready to find your people.' : 'Sign in to save your spot at the events you love.'}</p>
        {email ? <button className="button button-outline" onClick={onSignOut} type="button"><LogOut size={16} /> Sign out</button> : <button className="button button-primary" onClick={onSignIn} type="button"><LockKeyhole size={16} /> Sign in</button>}
        {!isConfigured && <p className="configuration-note">Add Supabase settings in backend/.env to enable account access.</p>}
      </div>
      <div className="profile-tip"><Sparkles size={18} /><p><strong>Find your next thing.</strong><br />Clubs, workshops, and campus moments are waiting in Explore.</p></div>
    </section>
  )
}

function AuthDialog({ mode, error, message, busy, configured, onClose, onModeChange, onSubmit }: {
  mode: AuthMode
  error: string
  message: string
  busy: boolean
  configured: boolean
  onClose: () => void
  onModeChange: (mode: AuthMode) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}) {
  return (
    <div className="dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section className="auth-dialog" role="dialog" aria-modal="true" aria-labelledby="auth-title">
        <button className="dialog-close" onClick={onClose} type="button" aria-label="Close"><X size={19} /></button>
        <span className="auth-icon"><LockKeyhole size={21} /></span>
        <span className="eyebrow">YOUR CAMPUS COMMUNITY</span>
        <h2 id="auth-title">{mode === 'sign-in' ? 'Good to see you.' : 'Come on in.'}</h2>
        <p className="auth-subtitle">{mode === 'sign-in' ? 'Sign in to save a spot and keep your plans together.' : 'Create an account to find your next campus moment.'}</p>
        <form className="auth-form" onSubmit={(event) => void onSubmit(event)}>
          <label>Email address<span className="input-wrap"><Mail size={16} /><input autoComplete="email" name="email" type="email" placeholder="you@campus.edu" required /></span></label>
          <label>Password<span className="input-wrap"><LockKeyhole size={16} /><input autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'} name="password" type="password" placeholder="At least 6 characters" minLength={6} required /></span></label>
          {error && <p className="form-message error" role="alert">{error}</p>}
          {message && <p className="form-message success" role="status">{message}</p>}
          {!configured && <p className="form-message error">Set SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY in backend/.env to enable sign-in.</p>}
          <button className="button button-primary auth-submit" disabled={busy || !configured} type="submit">{busy ? 'One moment…' : mode === 'sign-in' ? 'Sign in' : 'Create account'} <ArrowRight size={16} /></button>
        </form>
        <p className="auth-switch">{mode === 'sign-in' ? 'New to CampusConnect?' : 'Already have an account?'} <button onClick={() => onModeChange(mode === 'sign-in' ? 'sign-up' : 'sign-in')} type="button">{mode === 'sign-in' ? 'Create account' : 'Sign in'}</button></p>
        <p className="auth-privacy">Your details stay connected to your campus account.</p>
      </section>
    </div>
  )
}

function BottomNav({ screen, onNavigate }: { screen: Screen; onNavigate: (screen: Screen) => void }) {
  return (
    <nav className="bottom-nav" aria-label="Bottom navigation">
      <button className={screen === 'explore' ? 'active' : ''} onClick={() => onNavigate('explore')} type="button"><Compass size={20} /><span>Explore</span></button>
      <button className={screen === 'registrations' ? 'active' : ''} onClick={() => onNavigate('registrations')} type="button"><Ticket size={20} /><span>My plans</span></button>
      <button className={screen === 'profile' ? 'active' : ''} onClick={() => onNavigate('profile')} type="button"><CircleUserRound size={20} /><span>Profile</span></button>
    </nav>
  )
}

export default App
