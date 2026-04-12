'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import type { SiteData, Image } from '@/lib/data'
import styles from './AdminPanel.module.css'

const CAT_LABEL: Record<string, string> = {
  landscape: 'Paisaje',
  street: 'Urbana',
  portrait: 'Retrato',
}

const HERO_MAX = 5

export default function AdminPanel({ data: initialData }: { data: SiteData }) {
  const [hero, setHero] = useState<Image[]>(initialData.hero)
  const [portfolio, setPortfolio] = useState<Image[]>(initialData.portfolio)
  const [social, setSocial] = useState(initialData.social)
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')

  // Edit modal (portfolio only)
  const [editImage, setEditImage] = useState<Image | null>(null)

  // Add modal
  const [showAdd, setShowAdd] = useState(false)
  const [addSection, setAddSection] = useState<'hero' | 'portfolio'>('portfolio')
  const [addFile, setAddFile] = useState<File | null>(null)
  const [addPreview, setAddPreview] = useState<string | null>(null)
  const [addTitle, setAddTitle] = useState('')
  const [addCat, setAddCat] = useState<Image['cat']>('landscape')
  const [addLoc, setAddLoc] = useState('Montevideo')
  const [uploading, setUploading] = useState(false)

  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  // ── Reorder helpers ────────────────────────────────────────────────────────
  const move = (
    arr: Image[],
    setArr: React.Dispatch<React.SetStateAction<Image[]>>,
    from: number,
    to: number
  ) => {
    setArr(prev => {
      const next = [...prev]
      const [item] = next.splice(from, 1)
      next.splice(to, 0, item)
      return next
    })
  }

  // ── Save all ───────────────────────────────────────────────────────────────
  const save = async () => {
    setSaving(true)

    const photos = [
      ...hero.map((img, i) => ({ id: img._id, title: img.title, cat: img.cat, loc: img.loc, section: 'hero' as const, order: i })),
      ...portfolio.map((img, i) => ({ id: img._id, title: img.title, cat: img.cat, loc: img.loc, section: 'portfolio' as const, order: i })),
    ]

    const [r1, r2] = await Promise.all([
      fetch('/api/photos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photos }),
      }),
      fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ social }),
      }),
    ])

    setSaving(false)
    setSaveMsg(r1.ok && r2.ok ? '✓ Guardado' : '✗ Error al guardar')
    setTimeout(() => setSaveMsg(''), 3000)
  }

  // ── Logout ─────────────────────────────────────────────────────────────────
  const logout = async () => {
    await fetch('/api/admin', { method: 'DELETE' })
    router.push('/')
  }

  // ── Delete ─────────────────────────────────────────────────────────────────
  const deleteImage = async (id: string, section: 'hero' | 'portfolio') => {
    if (!confirm('¿Eliminar esta foto?')) return
    const res = await fetch(`/api/photos/${id}`, { method: 'DELETE' })
    if (res.ok) {
      if (section === 'hero') setHero(prev => prev.filter(i => i._id !== id))
      else setPortfolio(prev => prev.filter(i => i._id !== id))
    } else {
      alert('Error al eliminar la foto.')
    }
  }

  // ── Edit (portfolio) ───────────────────────────────────────────────────────
  const saveEdit = () => {
    if (!editImage) return
    setPortfolio(prev => prev.map(p => p._id === editImage._id ? editImage : p))
    setEditImage(null)
  }

  // ── Upload ─────────────────────────────────────────────────────────────────
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setAddFile(f)
    setAddPreview(URL.createObjectURL(f))
  }

  const openAddModal = (section: 'hero' | 'portfolio') => {
    setAddSection(section)
    setShowAdd(true)
  }

  const resetAddForm = () => {
    setAddFile(null)
    setAddPreview(null)
    setAddTitle('')
    setAddCat('landscape')
    setAddLoc('Montevideo')
    if (fileRef.current) fileRef.current.value = ''
  }

  const submitAdd = async () => {
    if (!addFile) { alert('Elegí una imagen primero.'); return }
    if (addSection === 'hero' && hero.length >= HERO_MAX) {
      alert(`El hero ya tiene ${HERO_MAX} fotos (máximo permitido).`)
      return
    }

    setUploading(true)
    const fd = new FormData()
    fd.append('file', addFile)
    fd.append('section', addSection)
    fd.append('title', addTitle || '')
    fd.append('cat', addCat)
    fd.append('loc', addLoc)

    const res = await fetch('/api/photos', { method: 'POST', body: fd })
    if (res.ok) {
      const { image } = await res.json()
      if (addSection === 'hero') setHero(prev => [...prev, image])
      else setPortfolio(prev => [...prev, image])
      setShowAdd(false)
      resetAddForm()
    } else {
      const err = await res.json().catch(() => ({}))
      alert(err.error || 'Error al subir la foto.')
    }
    setUploading(false)
  }

  return (
    <div className={styles.wrap}>

      {/* HEADER */}
      <div className={styles.header}>
        <a href="/" className={styles.backLink}>← Portfolio</a>
        <span className={styles.title}>Admin</span>
        <div className={styles.headerRight}>
          {saveMsg && <span className={styles.saveMsg}>{saveMsg}</span>}
          <button className={`${styles.btn} ${styles.primary}`} onClick={save} disabled={saving}>
            {saving ? 'Guardando…' : 'Guardar todo'}
          </button>
          <button className={styles.btn} onClick={logout}>Cerrar sesión</button>
        </div>
      </div>

      <div className={styles.body}>

        {/* PORTADA (HERO) */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <p className={styles.sectionLabel}>
              Portada — {hero.length}/{HERO_MAX} imágenes
            </p>
            <button
              className={`${styles.btn} ${styles.primary}`}
              onClick={() => openAddModal('hero')}
              disabled={hero.length >= HERO_MAX}
            >
              + Agregar portada
            </button>
          </div>

          {hero.length === 0 ? (
            <p className={styles.hint}>No hay imágenes de portada. Agregá hasta {HERO_MAX}.</p>
          ) : (
            <div className={styles.coversGrid}>
              {hero.map((img, i) => (
                <div key={img._id} className={styles.coverItem}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.url} alt={img.title || `Portada ${i + 1}`} />
                  <span className={styles.coverNum}>{i + 1}</span>
                  <div className={styles.coverActions}>
                    {i > 0 && (
                      <button className={styles.coverBtn} onClick={() => move(hero, setHero, i, i - 1)}>↑</button>
                    )}
                    {i < hero.length - 1 && (
                      <button className={styles.coverBtn} onClick={() => move(hero, setHero, i, i + 1)}>↓</button>
                    )}
                    <button
                      className={`${styles.coverBtn}`}
                      style={{ color: '#e05555', borderColor: '#5a2222', marginTop: '4px' }}
                      onClick={() => deleteImage(img._id, 'hero')}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <p className={styles.hint}>Usá las flechas para cambiar el orden. Guardá para aplicar.</p>
        </section>

        {/* PORTAFOLIO */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <p className={styles.sectionLabel}>Portafolio — {portfolio.length} {portfolio.length === 1 ? 'foto' : 'fotos'}</p>
            <button className={`${styles.btn} ${styles.primary}`} onClick={() => openAddModal('portfolio')}>
              + Agregar foto
            </button>
          </div>

          {portfolio.length === 0 ? (
            <p className={styles.hint}>No hay fotos en el portafolio todavía.</p>
          ) : (
            <div className={styles.photoGrid}>
              {portfolio.map((p, i) => (
                <div key={p._id} className={styles.photoItem}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.url} alt={p.title} loading="lazy" />
                  <div className={styles.photoInfo}>
                    <span className={styles.photoTitle}>{p.title || '—'}</span>
                    <span className={styles.photoCat}>{CAT_LABEL[p.cat]}</span>
                    <span className={styles.photoLoc}>{p.loc}</span>
                  </div>
                  <div className={styles.photoActions}>
                    <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                      {i > 0 && (
                        <button className={styles.actionBtn} onClick={() => move(portfolio, setPortfolio, i, i - 1)}>↑</button>
                      )}
                      {i < portfolio.length - 1 && (
                        <button className={styles.actionBtn} onClick={() => move(portfolio, setPortfolio, i, i + 1)}>↓</button>
                      )}
                    </div>
                    <button className={styles.actionBtn} onClick={() => setEditImage({ ...p })}>Editar</button>
                    <button className={`${styles.actionBtn} ${styles.del}`} onClick={() => deleteImage(p._id, 'portfolio')}>Eliminar</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* REDES SOCIALES */}
        <section className={styles.section}>
          <p className={styles.sectionLabel}>Redes sociales</p>
          <div className={styles.socialForm}>
            {(['instagram', 'linkedin', 'vsco'] as const).map(key => (
              <div className={styles.socialField} key={key}>
                <label>{key.charAt(0).toUpperCase() + key.slice(1)}</label>
                <input
                  type="url"
                  value={social[key]}
                  onChange={e => setSocial(s => ({ ...s, [key]: e.target.value }))}
                  placeholder={`https://${key}.com/...`}
                />
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* EDIT MODAL */}
      {editImage && (
        <div className={styles.overlay} onClick={e => { if (e.target === e.currentTarget) setEditImage(null) }}>
          <div className={styles.modal}>
            <h3>Editar foto</h3>
            <div className={styles.modalField}>
              <label>Título</label>
              <input
                value={editImage.title}
                onChange={e => setEditImage(p => p && ({ ...p, title: e.target.value }))}
              />
            </div>
            <div className={styles.modalField}>
              <label>Categoría</label>
              <select
                value={editImage.cat}
                onChange={e => setEditImage(p => p && ({ ...p, cat: e.target.value as Image['cat'] }))}
              >
                <option value="landscape">Paisaje</option>
                <option value="street">Urbana</option>
                <option value="portrait">Retrato</option>
              </select>
            </div>
            <div className={styles.modalField}>
              <label>Ubicación</label>
              <input
                value={editImage.loc}
                onChange={e => setEditImage(p => p && ({ ...p, loc: e.target.value }))}
              />
            </div>
            <div className={styles.modalActions}>
              <button className={`${styles.btn} ${styles.primary}`} onClick={saveEdit}>Guardar</button>
              <button className={styles.btn} onClick={() => setEditImage(null)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* ADD MODAL */}
      {showAdd && (
        <div className={styles.overlay} onClick={e => { if (e.target === e.currentTarget) { setShowAdd(false); resetAddForm() } }}>
          <div className={styles.modal}>
            <h3>{addSection === 'hero' ? 'Agregar portada' : 'Agregar foto'}</h3>

            {/* Section selector */}
            <div className={styles.modalField}>
              <label>Sección</label>
              <select
                value={addSection}
                onChange={e => setAddSection(e.target.value as 'hero' | 'portfolio')}
              >
                <option value="hero" disabled={hero.length >= HERO_MAX}>
                  Portada{hero.length >= HERO_MAX ? ' (llena)' : ` (${hero.length}/${HERO_MAX})`}
                </option>
                <option value="portfolio">Portafolio</option>
              </select>
            </div>

            {/* Image picker */}
            <div
              className={styles.uploadZone}
              onClick={() => fileRef.current?.click()}
              style={addPreview ? { padding: 0, overflow: 'hidden' } : undefined}
            >
              {addPreview
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={addPreview} alt="preview" style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
                : <p>Hacé click para elegir una imagen</p>
              }
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={onFileChange}
              />
            </div>

            {/* Metadata fields — always shown, required for portfolio */}
            <div className={styles.modalField}>
              <label>Título{addSection === 'portfolio' ? '' : ' (opcional)'}</label>
              <input
                value={addTitle}
                onChange={e => setAddTitle(e.target.value)}
                placeholder="Sin título"
              />
            </div>

            {addSection === 'portfolio' && (
              <>
                <div className={styles.modalField}>
                  <label>Categoría</label>
                  <select value={addCat} onChange={e => setAddCat(e.target.value as Image['cat'])}>
                    <option value="landscape">Paisaje</option>
                    <option value="street">Urbana</option>
                    <option value="portrait">Retrato</option>
                  </select>
                </div>
                <div className={styles.modalField}>
                  <label>Ubicación</label>
                  <input
                    value={addLoc}
                    onChange={e => setAddLoc(e.target.value)}
                    placeholder="Montevideo"
                  />
                </div>
              </>
            )}

            <div className={styles.modalActions}>
              <button
                className={`${styles.btn} ${styles.primary}`}
                onClick={submitAdd}
                disabled={uploading}
              >
                {uploading ? 'Subiendo…' : 'Agregar'}
              </button>
              <button className={styles.btn} onClick={() => { setShowAdd(false); resetAddForm() }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
