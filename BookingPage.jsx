import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function BookingPage() {
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [token, setToken] = useState(null)
  const [settings, setSettings] = useState({ whatsapp_number: '919784619102', avg_wait_minutes: 25, salon_name: 'Saloon Reserve' })
  const [error, setError] = useState('')

  useEffect(() => {
    fetchSettings()
  }, [])

  async function fetchSettings() {
    const { data } = await supabase.from('settings').select('*').eq('id', 1).single()
    if (data) setSettings(data)
  }

  async function handleBook() {
    if (!phone || phone.length < 10) { setError('Sahi phone number daalo'); return }
    setError('')
    setLoading(true)
    try {
      const today = new Date().toISOString().split('T')[0]
      // Check existing token
      const { data: existing } = await supabase.from('tokens').select('*').eq('phone', phone).eq('date', today).single()
      if (existing) { setToken(existing); setLoading(false); return }
      // Get next token number
      const { data: todayTokens } = await supabase.from('tokens').select('token_number').eq('date', today).order('token_number', { ascending: false }).limit(1)
      const nextToken = todayTokens && todayTokens.length > 0 ? todayTokens[0].token_number + 1 : 1
      const { data: newToken, error: insertError } = await supabase.from('tokens').insert({ phone, token_number: nextToken, date: today }).select().single()
      if (insertError) throw insertError
      setToken(newToken)
    } catch (e) {
      setError('Kuch gadbad hui, dobara try karo')
    }
    setLoading(false)
  }

  async function getQueueInfo() {
    if (!token) return { position: 0, wait: 0 }
    const today = new Date().toISOString().split('T')[0]
    const { data: settingsData } = await supabase.from('settings').select('current_token, avg_wait_minutes').eq('id', 1).single()
    const current = settingsData?.current_token || 0
    const avgWait = settingsData?.avg_wait_minutes || 25
    const position = Math.max(0, token.token_number - current)
    return { position, wait: position * avgWait }
  }

  const [queueInfo, setQueueInfo] = useState({ position: 0, wait: 0 })
  useEffect(() => {
    if (token) getQueueInfo().then(setQueueInfo)
  }, [token])

  const formatWait = (mins) => {
    if (mins < 60) return `${mins} min`
    const h = Math.floor(mins / 60), m = mins % 60
    return m > 0 ? `${h} ghante ${m} min` : `${h} ghante`
  }

  if (token) return (
    <div style={styles.page}>
      <div style={styles.bg} />
      <div style={styles.card}>
        <div style={styles.brand}>✂ {settings.salon_name}</div>
        <div style={styles.confirmedBadge}>● CONFIRMED</div>
        <div style={styles.tokenLabel}>AAPKA TOKEN</div>
        <div style={styles.tokenNumber}>#{token.token_number}</div>
        <div style={styles.infoRow}>
          <div style={styles.infoBox}>
            <div style={styles.infoLabel}>POSITION</div>
            <div style={styles.infoValue}>#{queueInfo.position}</div>
          </div>
          <div style={styles.infoBox}>
            <div style={styles.infoLabel}>APPROX WAIT</div>
            <div style={styles.infoValue}>{formatWait(queueInfo.wait)}</div>
          </div>
        </div>
        <div style={styles.callBox}>
          <div style={styles.callLabel}>SLOT TIMING JAANNE KE LIYE CALL KAREIN</div>
          <div style={styles.callNumber}>+{settings.whatsapp_number}</div>
        </div>
        <button style={styles.secondaryBtn} onClick={() => { setToken(null); setPhone('') }}>
          Naya Token Lo
        </button>
        <div style={styles.footer}>Tokens har raat 12 baje reset hote hain</div>
      </div>
    </div>
  )

  return (
    <div style={styles.page}>
      <div style={styles.bg} />
      <div style={styles.card}>
        <div style={styles.brand}>✂ {settings.salon_name}</div>
        <div style={styles.tagline}>WALK-IN BOOKING</div>
        <h1 style={styles.heading}>Apna Token<br />Lo.</h1>
        <p style={styles.subtext}>Apna WhatsApp number daalo aur queue mein jagah pakad lo — bina wait kiye!</p>
        <div style={styles.inputLabel}>WHATSAPP NUMBER</div>
        <div style={styles.inputRow}>
          <span style={styles.prefix}>+91</span>
          <input
            style={styles.input}
            type="tel"
            placeholder="98765 43210"
            value={phone}
            onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
            maxLength={10}
          />
        </div>
        {error && <div style={styles.error}>{error}</div>}
        <button style={styles.primaryBtn} onClick={handleBook} disabled={loading}>
          {loading ? 'Booking...' : 'BOOK MY SLOT →'}
        </button>
        <div style={styles.footer}>No spam. Tokens reset every day at midnight.</div>
      </div>
    </div>
  )
}

const styles = {
  page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', position: 'relative', overflow: 'hidden' },
  bg: { position: 'fixed', inset: 0, background: 'linear-gradient(135deg, #0a0a0a 0%, #1a0a0a 50%, #0a0a0a 100%)', zIndex: 0 },
  card: { position: 'relative', zIndex: 1, background: 'rgba(240,232,220,0.97)', color: '#0a0a0a', borderRadius: '4px', padding: '40px 32px', maxWidth: '400px', width: '100%', boxShadow: '0 40px 80px rgba(0,0,0,0.6)' },
  brand: { fontFamily: "'Bebas Neue', cursive", fontSize: '22px', letterSpacing: '3px', marginBottom: '24px', color: '#333' },
  tagline: { fontSize: '11px', letterSpacing: '3px', color: '#888', marginBottom: '8px' },
  heading: { fontFamily: "'Bebas Neue', cursive", fontSize: '56px', lineHeight: 1, marginBottom: '16px', color: '#0a0a0a' },
  subtext: { fontSize: '14px', color: '#555', lineHeight: 1.6, marginBottom: '28px' },
  inputLabel: { fontSize: '11px', letterSpacing: '2px', color: '#888', marginBottom: '8px' },
  inputRow: { display: 'flex', alignItems: 'center', background: '#fff', border: '1.5px solid #ddd', borderRadius: '2px', marginBottom: '8px', overflow: 'hidden' },
  prefix: { padding: '14px 12px', fontSize: '15px', color: '#555', borderRight: '1px solid #eee', background: '#f9f9f9' },
  input: { flex: 1, padding: '14px 12px', fontSize: '16px', border: 'none', outline: 'none', background: 'transparent', color: '#0a0a0a' },
  error: { color: '#e63329', fontSize: '13px', marginBottom: '8px' },
  primaryBtn: { width: '100%', padding: '16px', background: '#0a0a0a', color: '#f0e8dc', border: 'none', borderRadius: '2px', fontSize: '14px', letterSpacing: '2px', fontWeight: 600, cursor: 'pointer', marginTop: '8px', marginBottom: '16px' },
  secondaryBtn: { width: '100%', padding: '14px', background: 'transparent', color: '#0a0a0a', border: '1.5px solid #ccc', borderRadius: '2px', fontSize: '13px', letterSpacing: '1px', cursor: 'pointer', marginTop: '8px', marginBottom: '16px' },
  footer: { fontSize: '12px', color: '#aaa', textAlign: 'center' },
  confirmedBadge: { display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#d4edda', color: '#155724', padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, letterSpacing: '1px', marginBottom: '20px' },
  tokenLabel: { fontSize: '11px', letterSpacing: '3px', color: '#888', marginBottom: '4px' },
  tokenNumber: { fontFamily: "'Bebas Neue', cursive", fontSize: '100px', lineHeight: 1, color: '#0a0a0a', marginBottom: '24px' },
  infoRow: { display: 'flex', gap: '1px', background: '#ddd', marginBottom: '20px', borderRadius: '2px', overflow: 'hidden' },
  infoBox: { flex: 1, background: '#f0e8dc', padding: '16px' },
  infoLabel: { fontSize: '10px', letterSpacing: '2px', color: '#888', marginBottom: '4px' },
  infoValue: { fontFamily: "'Bebas Neue', cursive", fontSize: '28px', color: '#0a0a0a' },
  callBox: { background: '#fff', border: '1px solid #e0d8d0', borderRadius: '2px', padding: '16px', marginBottom: '16px', borderLeft: '4px solid #0a0a0a' },
  callLabel: { fontSize: '10px', letterSpacing: '1.5px', color: '#888', marginBottom: '6px' },
  callNumber: { fontSize: '18px', fontWeight: 600, color: '#0a0a0a' },
}
