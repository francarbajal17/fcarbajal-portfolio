'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import styles from './AdminLogin.module.css'

export default function AdminLogin() {
  const [pwd, setPwd] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pwd }),
    })
    if (res.ok) {
      router.push('/admin')
    } else {
      setError('Contraseña incorrecta.')
      setLoading(false)
      setPwd('')
    }
  }

  return (
    <div className={styles.wrap}>
      <p className={styles.logo}>Francisco Carbajal</p>
      <p className={styles.sub}>Panel de administración</p>
      <form className={styles.form} onSubmit={submit}>
        <div className={styles.field}>
          <input
            type="password"
            value={pwd}
            onChange={e => setPwd(e.target.value)}
            placeholder="Contraseña"
            autoFocus
          />
        </div>
        {error && <p className={styles.err}>{error}</p>}
        <button type="submit" className={styles.btn} disabled={loading}>
          {loading ? <span className={styles.spinner} /> : 'Entrar'}
          {!loading && <span className={styles.arr}>→</span>}
        </button>
      </form>
      <a href="/" className={styles.back}>← Volver al portfolio</a>
    </div>
  )
}
