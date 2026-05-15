import { useState } from 'react'
import { sb } from '../lib/supabase'

export default function Home() {
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [token, setToken] = useState(null)

  async function bookSlot() {
    const ph = phone.replace(/\D/g, '')
    if (!ph || ph.length < 10) { setError('Sahi 10 digit number daalo'); return }
    setError('')
    setLoading(true)
    try {
      const { data: cfgData } = await sb.from('settings').select('*').eq('id', 1).single()
      const cfg = cfgData || { whatsapp_number: '919784619102', avg_wait_minutes: 25, current_token: 0 }
      const today = new Date().toISOString().split('T')[0]
      const { data: ex } = await sb.from('tokens').select('*').eq('phone', ph).eq('date', today).maybeSingle()
      let tok = ex
      if (!tok) {
        const { data: last } = await sb.from('tokens').select('token_number').eq('date', today).order('token_number', { ascending: false }).limit(1)
        const next = last && last.length > 0 ? last[0].token_number + 1 : 1
        const { data: nt, error: e } = await sb.from('tokens').insert({ phone: ph, token_number: next, date: today }).select().single()
        if (e) throw e
        tok = nt
      }
      const pos = Math.max(1, tok.token_number - (cfg.current_token || 0))
      const wait = pos * cfg.avg_wait_minutes
      setToken({
        number: tok.token_number,
        pos,
        wait: wait < 60 ? wait + ' min' : Math.floor(wait / 60) + 'h ' + (wait % 60) + 'm',
        ownerPhone: '+' + cfg.whatsapp_number
      })
    } catch {
      setError('Kuch gadbad hui, dobara try karo')
    }
    setLoading(false)
  }

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.brand}>✂ ARUN SALOON</div>
        {!token ? (
          <>
            <div style={s.tagline}>WALK-IN BOOKING</div>
            <h1 style={s.h1}>Apna Token<br />Lo.</h1>
            <p style={s.subtext}>Apna WhatsApp number daalo aur saloon mein jagah pakad lo!</p>
            <div style={s.inputLabel}>WHATSAPP NUMBER</div>
            <div style={s.inputRow}>
              <span style={s.prefix}>+91</span>
              <input type="tel" placeholder="98765 43210" maxLength={10} value={phone} onChange={e => setPhone(e.target.value)} onKeyPress={e => e.key === 'Enter' && bookSlot()} style={s.input} />
            </div>
            {error && <div style={s.error}>{error}</div>}
            <button onClick={bookSlot} disabled={loading} style={s.primaryBtn}>{loading ? 'Booking...' : 'BOOK MY SLOT →'}</button>
            <p style={s.footerText}>No spam. Tokens reset every day at midnight.</p>
          </>
        ) : (
          <>
            <div style={s.confirmedBadge}>● CONFIRMED</div>
            <div style={s.tokenLabel}>AAPKA TOKEN</div>
            <div style={s.tokenNumber}>#{token.number}</div>
            <div style={s.infoRow}>
              <div style={s.infoBox}><div style={s.infoBoxLabel}>POSITION</div><div style={s.infoBoxValue}>#{token.pos}</div></div>
              <div style={s.infoBox}><div style={s.infoBoxLabel}>APPROX WAIT</div><div style={s.infoBoxValue}>{token.wait}</div></div>
            </div>
            <div style={s.callBox}>
              <div style={s.callBoxLabel}>SLOT TIMING JAANNE KE LIYE CALL KAREIN</div>
              <div style={s.callBoxNumber}>{token.ownerPhone}</div>
            </div>
            <button onClick={() => { setToken(null); setPhone('') }} style={s.secondaryBtn}>Check Your Token</button>
            <p style={s.footerText}>Tokens har raat 12 baje reset hote hain</p>
          </>
        )}
      </div>
    </div>
  )
}

const s = {
  page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'linear-gradient(135deg, #0a0a0a 0%, #1a0808 50%, #0a0a0a 100%)' },
  card: { background: 'rgba(240,232,220,0.97)', color: '#0a0a0a', borderRadius: 4, padding: '36px 28px', maxWidth: 400, width: '100%', boxShadow: '0 40px 80px rgba(0,0,0,0.6)' },
  brand: { fontFamily: "'Bebas Neue', cursive", fontSize: 22, letterSpacing: 3, marginBottom: 24, color: '#333' },
  tagline: { fontSize: 11, letterSpacing: 3, color: '#888', marginBottom: 8 },
  h1: { fontFamily: "'Bebas Neue', cursive", fontSize: 52, lineHeight: 1, marginBottom: 16 },
  subtext: { fontSize: 14, color: '#555', lineHeight: 1.6, marginBottom: 28 },
  inputLabel: { fontSize: 11, letterSpacing: 2, color: '#888', marginBottom: 8 },
  inputRow: { display: 'flex', alignItems: 'center', background: '#fff', border: '1.5px solid #ddd', borderRadius: 2, marginBottom: 8, overflow: 'hidden' },
  prefix: { padding: '14px 12px', fontSize: 15, color: '#555', borderRight: '1px solid #eee', background: '#f9f9f9' },
  input: { flex: 1, padding: '14px 12px', fontSize: 16, border: 'none', outline: 'none', background: 'transparent', color: '#0a0a0a', fontFamily: "'DM Sans', sans-serif" },
  error: { color: '#e63329', fontSize: 13, marginBottom: 8 },
  primaryBtn: { width: '100%', padding: 16, background: '#0a0a0a', color: '#f0e8dc', border: 'none', borderRadius: 2, fontSize: 14, letterSpacing: 2, fontWeight: 600, cursor: 'pointer', marginTop: 8, marginBottom: 16, fontFamily: "'DM Sans', sans-serif" },
  secondaryBtn: { width: '100%', padding: 14, background: 'transparent', color: '#0a0a0a', border: '1.5px solid #ccc', borderRadius: 2, fontSize: 13, cursor: 'pointer', marginTop: 8, marginBottom: 16, fontFamily: "'DM Sans', sans-serif" },
  footerText: { fontSize: 12, color: '#aaa', textAlign: 'center' },
  confirmedBadge: { display: 'inline-flex', alignItems: 'center', gap: 6, background: '#d4edda', color: '#155724', padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, marginBottom: 20 },
  tokenLabel: { fontSize: 11, letterSpacing: 3, color: '#888', marginBottom: 4 },
  tokenNumber: { fontFamily: "'Bebas Neue', cursive", fontSize: 100, lineHeight: 1, marginBottom: 24 },
  infoRow: { display: 'flex', gap: 1, background: '#ddd', marginBottom: 20, borderRadius: 2, overflow: 'hidden' },
  infoBox: { flex: 1, background: '#f0e8dc', padding: 16 },
  infoBoxLabel: { fontSize: 10, letterSpacing: 2, color: '#888', marginBottom: 4 },
  infoBoxValue: { fontFamily: "'Bebas Neue', cursive", fontSize: 28 },
  callBox: { background: '#fff', border: '1px solid #e0d8d0', borderRadius: 2, padding: 16, marginBottom: 16, borderLeft: '4px solid #0a0a0a' },
  callBoxLabel: { fontSize: 10, letterSpacing: 1.5, color: '#888', marginBottom: 6 },
  callBoxNumber: { fontSize: 18, fontWeight: 600 },
  }
