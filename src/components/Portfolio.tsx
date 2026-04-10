'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import type { SiteData, Photo } from '@/lib/data'
import styles from './Portfolio.module.css'

const CAT_LABEL: Record<string, string> = {
  landscape: 'Paisaje',
  street: 'Urbana',
  portrait: 'Retrato',
}

export default function Portfolio({ data }: { data: SiteData }) {
  const { covers, photos, social } = data

  // Hero slideshow
  const [heroIdx, setHeroIdx] = useState(0)
  const heroTimer = useRef<ReturnType<typeof setInterval>>()

  const goHero = useCallback((idx: number) => {
    setHeroIdx(idx)
    clearInterval(heroTimer.current)
    heroTimer.current = setInterval(() => {
      setHeroIdx(i => (i + 1) % covers.length)
    }, 5000)
  }, [covers.length])

  useEffect(() => {
    heroTimer.current = setInterval(() => {
      setHeroIdx(i => (i + 1) % covers.length)
    }, 5000)
    return () => clearInterval(heroTimer.current)
  }, [covers.length])

  // Gallery filter
  const [filter, setFilter] = useState('all')
  const visible = filter === 'all' ? photos : photos.filter(p => p.cat === filter)

  // Lightbox
  const [lbIdx, setLbIdx] = useState<number | null>(null)
  const openLb = (i: number) => { setLbIdx(i); document.body.style.overflow = 'hidden' }
  const closeLb = () => { setLbIdx(null); document.body.style.overflow = '' }
  const navLb = (d: number) => setLbIdx(i => i === null ? 0 : (i + d + visible.length) % visible.length)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (lbIdx === null) return
      if (e.key === 'Escape') closeLb()
      if (e.key === 'ArrowRight') navLb(1)
      if (e.key === 'ArrowLeft') navLb(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lbIdx, visible.length])

  // Touch swipe on lightbox
  const touchX = useRef(0)

  // Mobile nav
  const [menuOpen, setMenuOpen] = useState(false)

  // Admin shortcut
  const adminSeq = useRef('')
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      adminSeq.current = (adminSeq.current + e.key).slice(-6)
      if (adminSeq.current.toLowerCase().endsWith('admin')) {
        window.location.href = '/admin'
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <>
      {/* NAV */}
      <nav className={styles.nav}>
        <a href="#" className={styles.navLogo}>Francisco Carbajal</a>
        <ul className={styles.navLinks}>
          <li><a href="#gallery">Trabajo</a></li>
          <li><a href="#about">Sobre mí</a></li>
          <li><a href="#contact">Contacto</a></li>
        </ul>
        <button
          className={`${styles.hamburger} ${menuOpen ? styles.open : ''}`}
          onClick={() => setMenuOpen(v => !v)}
          aria-label="Menú"
        >
          <span /><span /><span />
        </button>
      </nav>

      {/* MOBILE MENU */}
      <div className={`${styles.mobMenu} ${menuOpen ? styles.open : ''}`}>
        {['#gallery', '#about', '#contact'].map((href, i) => (
          <a key={href} href={href} onClick={() => setMenuOpen(false)}>
            {['Trabajo', 'Sobre mí', 'Contacto'][i]}
          </a>
        ))}
      </div>

      {/* HERO */}
      <section id="hero" className={styles.hero}>
        {covers.map((src, i) => (
          <div
            key={src}
            className={`${styles.heroSlide} ${i === heroIdx ? styles.active : ''}`}
            style={{ backgroundImage: `url(${src})` }}
          />
        ))}
        <div className={styles.heroVignette} />
        <div className={styles.heroContent}>
          <div className={styles.heroDots}>
            {covers.map((_, i) => (
              <button
                key={i}
                className={`${styles.heroDot} ${i === heroIdx ? styles.active : ''}`}
                onClick={() => goHero(i)}
                aria-label={`Portada ${i + 1}`}
              />
            ))}
          </div>
          <h1 className={styles.heroName}>
            Francisco<br /><em>Carbajal</em>
          </h1>
          <p className={styles.heroSub}>Paisaje · Urbana · Retrato · Montevideo</p>
          <div className={styles.heroSocials}>
            <a href={social.instagram} target="_blank" rel="noopener noreferrer" className={styles.socialLink}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="2" y="2" width="20" height="20" rx="5"/>
                <circle cx="12" cy="12" r="4"/>
                <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" stroke="none"/>
              </svg>
              Instagram
            </a>
            <div className={styles.socialSep} />
            <a href={social.linkedin} target="_blank" rel="noopener noreferrer" className={styles.socialLink}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6z"/>
                <rect x="2" y="9" width="4" height="12"/>
                <circle cx="4" cy="4" r="2"/>
              </svg>
              LinkedIn
            </a>
            <div className={styles.socialSep} />
            <a href={social.vsco} target="_blank" rel="noopener noreferrer" className={styles.socialLink}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10"/>
                <circle cx="12" cy="12" r="4"/>
                <line x1="12" y1="2" x2="12" y2="5"/>
                <line x1="12" y1="19" x2="12" y2="22"/>
                <line x1="2" y1="12" x2="5" y2="12"/>
                <line x1="19" y1="12" x2="22" y2="12"/>
              </svg>
              VSCO
            </a>
          </div>
        </div>
      </section>

      {/* GALLERY */}
      <section id="gallery" className={styles.gallery}>
        <div className={styles.filterRow}>
          {['all', 'landscape', 'street', 'portrait'].map(f => (
            <button
              key={f}
              className={`${styles.filterBtn} ${filter === f ? styles.active : ''}`}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? 'Todos' : CAT_LABEL[f]}
            </button>
          ))}
        </div>
        <div className={styles.grid}>
          {photos.map(p => (
            <div
              key={p.id}
              className={`${styles.gridItem} ${filter !== 'all' && p.cat !== filter ? styles.hidden : ''}`}
              onClick={() => {
                const idx = visible.findIndex(x => x.id === p.id)
                if (idx >= 0) openLb(idx)
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.file} alt={p.title} loading="lazy" />
              <div className={styles.itemOverlay}>
                <div className={styles.itemTitle}>{p.title}</div>
                <div className={styles.itemCat}>{CAT_LABEL[p.cat]}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* LIGHTBOX */}
      {lbIdx !== null && (
        <div
          className={styles.lb}
          onClick={e => { if (e.target === e.currentTarget) closeLb() }}
          onTouchStart={e => { touchX.current = e.touches[0].clientX }}
          onTouchEnd={e => {
            const d = e.changedTouches[0].clientX - touchX.current
            if (Math.abs(d) > 50) navLb(d < 0 ? 1 : -1)
          }}
        >
          <span className={styles.lbCount}>{lbIdx + 1} / {visible.length}</span>
          <button className={styles.lbClose} onClick={closeLb}>✕</button>
          <button className={`${styles.lbNav} ${styles.lbPrev}`} onClick={() => navLb(-1)}>←</button>
          <div className={styles.lbImg}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={visible[lbIdx].file} alt={visible[lbIdx].title} />
          </div>
          <button className={`${styles.lbNav} ${styles.lbNext}`} onClick={() => navLb(1)}>→</button>
          <div className={styles.lbInfo}>
            <span className={styles.lbTitle}>{visible[lbIdx].title}</span>
            <span className={styles.lbMeta}>{CAT_LABEL[visible[lbIdx].cat]} · {visible[lbIdx].loc}</span>
          </div>
        </div>
      )}

      {/* ABOUT */}
      <section id="about" className={styles.about}>
        <div className={styles.aboutPhoto}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/photos/profile.jpg" alt="Fran Carbajal" />
        </div>
        <div>
          <p className={styles.aboutLabel}>Sobre mí</p>
          <p className={styles.aboutText}>
            Me llamo Juan Francisco, pero prefiero <em>Fran</em>.<br /><br />
            Estudiante de Ingeniería de Software en Montevideo. La cámara la heredé de mi padre
            — y desde entonces trato de <em>encontrar otra visión en las cosas</em>.
          </p>
        </div>
      </section>

      {/* CONTACT */}
      <ContactSection />

      {/* FOOTER */}
      <footer className={styles.footer}>
        <span onDoubleClick={() => { window.location.href = '/admin' }} style={{ cursor: 'default' }}>
          © 2026 Francisco Carbajal
        </span>
        <div style={{ display: 'flex', gap: '20px' }}>
          <a href={social.instagram} target="_blank" rel="noopener noreferrer">Instagram</a>
          <a href={social.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn</a>
          <a href={social.vsco} target="_blank" rel="noopener noreferrer">VSCO</a>
        </div>
      </footer>
    </>
  )
}

function ContactSection() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'ok' | 'err'>('idle')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [msg, setMsg] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const e: Record<string, string> = {}
    if (!name.trim()) e.name = 'Nombre requerido'
    if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Email inválido'
    if (!msg.trim()) e.msg = 'Mensaje requerido'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setStatus('sending')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message: msg }),
      })
      setStatus(res.ok ? 'ok' : 'err')
    } catch {
      setStatus('err')
    }
  }

  return (
    <section id="contact" className={styles.contact}>
      <p className={styles.contactLabel}>Contacto</p>
      <h2 className={styles.contactHeading}>Hablemos de<br />tu <em>proyecto</em></h2>
      {status === 'ok' ? (
        <p className={styles.formOk}>Gracias. Te escribo pronto.</p>
      ) : (
        <form className={styles.form} onSubmit={submit} noValidate>
          <div className={`${styles.field} ${errors.name ? styles.err : ''}`}>
            <label>Nombre</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Tu nombre" />
            {errors.name && <span className={styles.fieldErr}>{errors.name}</span>}
          </div>
          <div className={`${styles.field} ${errors.email ? styles.err : ''}`}>
            <label>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@email.com" />
            {errors.email && <span className={styles.fieldErr}>{errors.email}</span>}
          </div>
          <div className={`${styles.field} ${errors.msg ? styles.err : ''}`}>
            <label>Mensaje</label>
            <textarea rows={3} value={msg} onChange={e => setMsg(e.target.value)} placeholder="Contame sobre tu proyecto…" />
            {errors.msg && <span className={styles.fieldErr}>{errors.msg}</span>}
          </div>
          {status === 'err' && <p className={styles.fieldErr}>Hubo un error. Intentá de nuevo.</p>}
          <button type="submit" className={styles.formSend} disabled={status === 'sending'}>
            {status === 'sending' ? <span className={styles.spinner} /> : 'Enviar'}
            {status !== 'sending' && <span className={styles.arr}>→</span>}
          </button>
        </form>
      )}
    </section>
  )
}
