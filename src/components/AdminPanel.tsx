'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import type { SiteData, Photo } from '@/lib/data'
import styles from './AdminPanel.module.css'

const CAT_LABEL: Record<string, string> = {
  landscape: 'Paisaje',
  street: 'Urbana',
  portrait: 'Retrato',
}

export default function AdminPanel({ data: initialData }: { data: SiteData }) {
  const [data, setData] = useState<SiteData>(initialData)
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const [editPhoto, setEditPhoto] = useState<Photo | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [addFile, setAddFile] = useState<File | null>(null)
  const [addPreview, setAddPreview] = useState<string | null>(null)
  const [addTitle, setAddTitle] = useState('')
  const [addCat, setAddCat] = useState<Photo['cat']>('landscape')
  const [addLoc, setAddLoc] = useState('Montevideo')
  const [uploading, setUploading] = useState(false)
  // Cover upload
  const [uploadingCover, setUploadingCover] = useState(false)
  const coverFileRef = useRef<HTMLInputElement>(null)
  // Drag reorder for photos
  const dragPhotoId = useRef<string | null>(null)
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  // ── Save all data ──────────────────────────────────────────────────────────
  const save = async () => {
    setSaving(true)
    const res = await fetch('/api/photos', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    setSaving(false)
    setSaveMsg(res.ok ? '✓ Guardado' : '✗ Error al guardar')
    setTimeout(() => setSaveMsg(''), 3000)
  }

  // ── Logout ─────────────────────────────────────────────────────────────────
  const logout = async () => {
    await fetch('/api/admin', { method: 'DELETE' })
    router.push('/')
  }

  // ── Delete photo ───────────────────────────────────────────────────────────
  const deletePhoto = (id: string) => {
    if (!confirm('¿Eliminar esta foto?')) return
    setData(d => ({ ...d, photos: d.photos.filter(p => p.id !== id) }))
  }

  // ── Edit photo ─────────────────────────────────────────────────────────────
  const saveEdit = () => {
    if (!editPhoto) return
    setData(d => ({
      ...d,
      photos: d.photos.map(p => p.id === editPhoto.id ? editPhoto : p),
    }))
    setEditPhoto(null)
  }

  // ── Add photo ──────────────────────────────────────────────────────────────
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setAddFile(f)
    setAddPreview(URL.createObjectURL(f))
  }

  const submitAdd = async () => {
    if (!addFile) { alert('Elegí una imagen primero.'); return }
    setUploading(true)
    const fd = new FormData()
    fd.append('file', addFile)
    fd.append('title', addTitle || 'Sin título')
    fd.append('cat', addCat)
    fd.append('loc', addLoc)
    const res = await fetch('/api/photos', { method: 'POST', body: fd })
    if (res.ok) {
      const { photo } = await res.json()
      setData(d => ({ ...d, photos: [...d.photos, photo] }))
      setShowAdd(false)
      setAddFile(null); setAddPreview(null); setAddTitle(''); setAddLoc('Montevideo')
    } else {
      alert('Error al subir la foto.')
    }
    setUploading(false)
  }

  // ── Cover: upload new ─────────────────────────────────────────────────────
  const addCover = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    if (data.covers.length >= 5) { alert('Máximo 5 portadas.'); return }
    setUploadingCover(true)
    const fd = new FormData()
    fd.append('file', f)
    fd.append('title', 'Portada')
    fd.append('cat', 'landscape')
    fd.append('loc', '')
    fd.append('isCover', 'true')
    const res = await fetch('/api/photos', { method: 'POST', body: fd })
    if (res.ok) {
      const { photo } = await res.json()
      setData(d => ({ ...d, covers: [...d.covers, photo.file] }))
    } else {
      alert('Error al subir la portada.')
    }
    setUploadingCover(false)
    // reset input so same file can be re-selected
    if (coverFileRef.current) coverFileRef.current.value = ''
  }

  // ── Cover: delete ──────────────────────────────────────────────────────────
  const deleteCover = (i: number) => {
    if (data.covers.length <= 1) { alert('Tiene que quedar al menos una portada.'); return }
    if (!confirm('¿Eliminar esta portada?')) return
    setData(d => ({ ...d, covers: d.covers.filter((_, idx) => idx !== i) }))
  }

  // ── Photo grid drag reorder ────────────────────────────────────────────────
  const onDragStart = (id: string) => { dragPhotoId.current = id }
  const onDragOver  = (e: React.DragEvent) => { e.preventDefault() }
  const onDrop      = (targetId: string) => {
    const from = dragPhotoId.current
    if (!from || from === targetId) return
    setData(d => {
      const photos = [...d.photos]
      const fi = photos.findIndex(p => p.id === from)
      const ti = photos.findIndex(p => p.id === targetId)
      const [item] = photos.splice(fi, 1)
      photos.splice(ti, 0, item)
      return { ...d, photos }
    })
    dragPhotoId.current = null
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

        {/* COVERS */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <p className={styles.sectionLabel}>
              Portadas — {data.covers.length} / 5
            </p>
            {data.covers.length < 5 && (
              <button
                className={`${styles.btn} ${styles.primary}`}
                onClick={() => coverFileRef.current?.click()}
                disabled={uploadingCover}
              >
                {uploadingCover ? 'Subiendo…' : '+ Agregar portada'}
              </button>
            )}
            <input
              ref={coverFileRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={addCover}
            />
          </div>
          <div className={styles.coversGrid}>
            {data.covers.map((src, i) => (
              <div key={src + i} className={styles.coverItem}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt={`Portada ${i + 1}`} />
                <span className={styles.coverNum}>{i + 1}</span>
                <div className={styles.coverActions}>
                  <button
                    className={styles.coverBtn}
                    onClick={() => {
                      const covers = [...data.covers]
                      const [item] = covers.splice(i, 1)
                      covers.splice(Math.max(0, i - 1), 0, item)
                      setData(d => ({ ...d, covers }))
                    }}
                    disabled={i === 0}
                    title="Mover antes"
                  >←</button>
                  <button
                    className={styles.coverBtn}
                    onClick={() => {
                      const covers = [...data.covers]
                      const [item] = covers.splice(i, 1)
                      covers.splice(Math.min(covers.length, i + 1), 0, item)
                      setData(d => ({ ...d, covers }))
                    }}
                    disabled={i === data.covers.length - 1}
                    title="Mover después"
                  >→</button>
                  <button
                    className={`${styles.coverBtn} ${styles.coverDel}`}
                    onClick={() => deleteCover(i)}
                    title="Eliminar portada"
                  >✕</button>
                </div>
              </div>
            ))}
          </div>
          <p className={styles.hint}>
            Entre 1 y 5 portadas. Usá las flechas para reordenar. Guardá para aplicar.
          </p>
        </section>

        {/* SOCIAL LINKS */}
        <section className={styles.section}>
          <p className={styles.sectionLabel}>Redes sociales</p>
          <div className={styles.socialForm}>
            {(['instagram', 'linkedin', 'vsco'] as const).map(key => (
              <div className={styles.socialField} key={key}>
                <label>{key.charAt(0).toUpperCase() + key.slice(1)}</label>
                <input
                  type="url"
                  value={data.social[key]}
                  onChange={e => setData(d => ({ ...d, social: { ...d.social, [key]: e.target.value } }))}
                  placeholder={`https://${key}.com/...`}
                />
              </div>
            ))}
          </div>
        </section>

        {/* PHOTOS */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <p className={styles.sectionLabel}>Fotos ({data.photos.length}) — arrastrá para reordenar</p>
            <button className={`${styles.btn} ${styles.primary}`} onClick={() => setShowAdd(true)}>
              + Agregar foto
            </button>
          </div>
          <div className={styles.photoGrid}>
            {data.photos.map(p => (
              <div
                key={p.id}
                className={styles.photoItem}
                draggable
                onDragStart={() => onDragStart(p.id)}
                onDragOver={onDragOver}
                onDrop={() => onDrop(p.id)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.file} alt={p.title} loading="lazy" />
                <div className={styles.dragHandle} title="Arrastrá para reordenar">⠿</div>
                <div className={styles.photoInfo}>
                  <span className={styles.photoTitle}>{p.title}</span>
                  <span className={styles.photoCat}>{CAT_LABEL[p.cat]}</span>
                  <span className={styles.photoLoc}>{p.loc}</span>
                </div>
                <div className={styles.photoActions}>
                  <button className={styles.actionBtn} onClick={() => setEditPhoto({ ...p })}>Editar</button>
                  <button className={`${styles.actionBtn} ${styles.del}`} onClick={() => deletePhoto(p.id)}>Eliminar</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* EDIT MODAL */}
      {editPhoto && (
        <div className={styles.overlay} onClick={e => { if (e.target === e.currentTarget) setEditPhoto(null) }}>
          <div className={styles.modal}>
            <h3>Editar foto</h3>
            <div className={styles.modalField}>
              <label>Título</label>
              <input value={editPhoto.title} onChange={e => setEditPhoto(p => p && ({ ...p, title: e.target.value }))} />
            </div>
            <div className={styles.modalField}>
              <label>Categoría</label>
              <select value={editPhoto.cat} onChange={e => setEditPhoto(p => p && ({ ...p, cat: e.target.value as Photo['cat'] }))}>
                <option value="landscape">Paisaje</option>
                <option value="street">Urbana</option>
                <option value="portrait">Retrato</option>
              </select>
            </div>
            <div className={styles.modalField}>
              <label>Ubicación</label>
              <input value={editPhoto.loc} onChange={e => setEditPhoto(p => p && ({ ...p, loc: e.target.value }))} />
            </div>
            <div className={styles.modalActions}>
              <button className={`${styles.btn} ${styles.primary}`} onClick={saveEdit}>Guardar</button>
              <button className={styles.btn} onClick={() => setEditPhoto(null)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* ADD MODAL */}
      {showAdd && (
        <div className={styles.overlay} onClick={e => { if (e.target === e.currentTarget) setShowAdd(false) }}>
          <div className={styles.modal}>
            <h3>Agregar foto</h3>
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
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onFileChange} />
            </div>
            <div className={styles.modalField}>
              <label>Título</label>
              <input value={addTitle} onChange={e => setAddTitle(e.target.value)} placeholder="Sin título" />
            </div>
            <div className={styles.modalField}>
              <label>Categoría</label>
              <select value={addCat} onChange={e => setAddCat(e.target.value as Photo['cat'])}>
                <option value="landscape">Paisaje</option>
                <option value="street">Urbana</option>
                <option value="portrait">Retrato</option>
              </select>
            </div>
            <div className={styles.modalField}>
              <label>Ubicación</label>
              <input value={addLoc} onChange={e => setAddLoc(e.target.value)} placeholder="Montevideo" />
            </div>
            <div className={styles.modalActions}>
              <button className={`${styles.btn} ${styles.primary}`} onClick={submitAdd} disabled={uploading}>
                {uploading ? 'Subiendo…' : 'Agregar'}
              </button>
              <button className={styles.btn} onClick={() => setShowAdd(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
