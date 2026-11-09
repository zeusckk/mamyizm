import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { daysUntil, planById } from './data'
import { setupSteps, useStore } from './store'
import type { ThemeChoice } from './types'

const NAV = [
  { to: '/', label: 'Stüdyo', icon: Spark, end: false },
  { to: '/takvim', label: 'Özel günler', icon: Cal, end: false },
  { to: '/marka', label: 'Marka', icon: Star, end: false },
  { to: '/tasarimlar', label: 'Tasarımlarım', icon: Grid, end: false },
  { to: '/hesap', label: 'Hesap', icon: Card, end: true },
]

export function Shell() {
  const { state, setTheme } = useStore()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const [themeOpen, setThemeOpen] = useState(false)
  const setup = setupSteps(state)
  const plan = planById(state.plan)
  const waiting = state.designs.filter((design) => design.status === 'editor').length
  const days = Math.max(0, daysUntil(state.trialEnds))
  const fill = location.pathname.startsWith('/studio/')
  const title = titleFor(location.pathname)

  useEffect(() => {
    setOpen(false)
    document.title = `${title} · tasarıcom`
  }, [location.pathname, title])

  return (
    <div className={open ? 'shell nav-open' : 'shell'}>
      <aside className="side">
        <NavLink to="/" className="wordmark">
          <span className="mark">t</span>
          <span className="word">tasarıcom</span>
        </NavLink>
        <div className="side-scroll">
          <div className="nav-label">MENÜ</div>
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end || item.to === '/'}
              data-testid={`nav-${item.to === '/' ? 'studio' : item.to.slice(1)}`}
              className={({ isActive }) => {
                const studio = item.to === '/' && location.pathname.startsWith('/studio')
                const brand = item.to === '/marka' && location.pathname.startsWith('/marka')
                return `nav-btn${isActive || studio || brand ? ' on' : ''}`
              }}
            >
              <item.icon />
              {item.label}
            </NavLink>
          ))}
          <div className="nav-label">ATÖLYE</div>
          <NavLink to="/editor" data-testid="nav-editor" className={({ isActive }) => `nav-btn${isActive ? ' on' : ''}`}>
            <Pen />
            Editör kuyruğu
            {waiting > 0 ? <span className="count">{waiting}</span> : null}
          </NavLink>
        </div>
        <div className="side-foot">
          <div className="setup">
            <div className="kicker">BAŞLANGIÇ {setup.done} / {setup.steps.length}</div>
            {setup.next ? (
              <Link to={setup.next.to}>
                <strong>{setup.next.label}</strong>
              </Link>
            ) : (
              <strong>Marka hazır</strong>
            )}
            <div className="bar">
              <span style={{ width: `${(setup.done / setup.steps.length) * 100}%` }} />
            </div>
          </div>
          <div className="pack">
            <div className="kicker">PAKET</div>
            <strong>{plan.name.toLocaleUpperCase('tr-TR')}</strong>
            <div className="muted" style={{ marginTop: 4 }}>
              {state.plan === 'deneme' ? '7 günlük deneme' : `${plan.credits} taslak hakkı`}
            </div>
            <Link to="/planlar" className="btn-line" style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}>
              Paketi seç
            </Link>
          </div>
        </div>
      </aside>
      <button className="backdrop" type="button" aria-label="Menüyü kapat" onClick={() => setOpen(false)} />
      <div className="main">
        <header className="top">
          <button className="menu-btn" type="button" onClick={() => setOpen(true)}>
            <Grid /> Menü
          </button>
          <div className="top-actions">
            <span className="who">mola@tasaricom.com</span>
            <div className="theme-pop">
              <button className="icon-plain" type="button" aria-label="Görünüm" onClick={() => setThemeOpen((value) => !value)}>
                <Sun />
              </button>
              {themeOpen ? (
                <div className="theme-menu">
                  <strong style={{ display: 'block', padding: '6px 8px' }}>Görünüm</strong>
                  {(['system', 'light', 'dark'] as ThemeChoice[]).map((choice) => (
                    <button
                      key={choice}
                      type="button"
                      className={state.theme === choice ? 'on' : ''}
                      onClick={() => {
                        setTheme(choice)
                        setThemeOpen(false)
                      }}
                    >
                      {choice === 'system' ? 'Sistem' : choice === 'light' ? 'Açık' : 'Koyu'}
                    </button>
                  ))}
                  <p>Sistem, cihazının açık / koyu ayarını izler.</p>
                </div>
              ) : null}
            </div>
            <span className="avatar" aria-hidden>
              {(state.brand.name || 'T').slice(0, 1).toLocaleUpperCase('tr-TR')}
            </span>
          </div>
        </header>
        {state.plan === 'deneme' ? (
          <div className="banner">
            <span>Ücretsiz denemenin bitmesine {days} gün kaldı. Kesintisiz kullanmak için paketini yükselt.</span>
            <Link to="/planlar">Paketleri incele</Link>
          </div>
        ) : null}
        <div className={fill ? 'content fill' : 'content'}>
          <Outlet />
        </div>
      </div>
    </div>
  )
}

function titleFor(path: string) {
  if (path.startsWith('/studio/')) return 'Stüdyo'
  if (path.startsWith('/takvim')) return 'Özel günler'
  if (path.startsWith('/marka/kimlik')) return 'Marka kimliği'
  if (path.startsWith('/marka')) return 'Marka'
  if (path.startsWith('/tasarimlar')) return 'Tasarımlarım'
  if (path.startsWith('/hesap')) return 'Hesap'
  if (path.startsWith('/planlar')) return 'Planlar'
  if (path.startsWith('/editor')) return 'Editör kuyruğu'
  return 'Stüdyo'
}

function Spark() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 3l1.6 5.2L19 10l-5.4 1.8L12 17l-1.6-5.2L5 10l5.4-1.8L12 3z" />
    </svg>
  )
}
function Cal() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path d="M8 3v4M16 3v4M4 10h16" />
    </svg>
  )
}
function Star() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 3.5l2.4 5 5.6.8-4 3.9.9 5.6L12 16.8 7.1 18.8l.9-5.6-4-3.9 5.6-.8L12 3.5z" />
    </svg>
  )
}
function Grid() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="4" y="4" width="7" height="7" rx="1.5" />
      <rect x="13" y="4" width="7" height="7" rx="1.5" />
      <rect x="4" y="13" width="7" height="7" rx="1.5" />
      <rect x="13" y="13" width="7" height="7" rx="1.5" />
    </svg>
  )
}
function Card() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <path d="M3 10h18" />
    </svg>
  )
}
function Pen() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 20h4l10-10-4-4L4 16v4z" />
      <path d="M12 6l4 4" />
    </svg>
  )
}
function Sun() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="3.5" />
      <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.5 5.5l1.5 1.5M17 17l1.5 1.5M18.5 5.5L17 7M7 17l-1.5 1.5" />
    </svg>
  )
}
