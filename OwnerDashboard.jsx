import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import QRCode from 'qrcode'

export default function OwnerDashboard() {
  const [tokens, setTokens] = useState([])
  const [settings, setSettings] = useState({ whatsapp_number: '', avg_wait_minutes: 25, current_token: 0, salon_name: 'Saloon Reserve' })
  const [showSettings, setShowSettings] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const [saved, setSaved] = useState(false)
  const intervalRef = useRef(null)

  useEffect(() => {
    fetchAll()
    intervalRef.current = setInterval(fetchAll, 5000)
    return () => clearInterval(intervalRef.current)
  }, [])

  async function fetchAll() {
    const today = new Date().toISOString().split('T')[0]
    const [{ data: s }, { data: t }] = await Promise.all([
      supabase.from('settings').select('*').eq('id', 1).single(),
      supabase.from('tokens').select('*').eq('date', today).order('token_number', { ascending: true })
    ])
    if (s) {
      setSettings(s)
      const url = `${window.location.origin}/?ref=qr`
      const qr = await QRCode.toDataURL(url, { width: 300, margin: 2, color: { dark: '#0a0a0a', light: '#f0e8dc' } })
      setQrDataUrl(qr)
    }
    if (t) setTokens(t)
    setLoading(false)
  }

  async function nextCustomer() {
    const next = (settings.current_token || 0) + 1
    await supabase.from('settings').update({ current_token: next }).eq('id', 1)
    setSettings(s => ({ ...s, current_token: next }))
  }

  async function saveSettings() {
    await supabase.from('settings').update({
      whatsapp_number: settings.whatsapp_number,
      avg_wait_minutes: parseInt(settings.avg_wait_minutes),
      salon_name: settings.salon_name
    }).eq('id', 1)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    setShowSettings(false)
    fetchAll()
  }

  const today = new Date().toISOString().split('T')[0]
  const waiting = tokens.filter(t => t.token_number > (settings.current_token || 0))
  const currentCustomer = tokens.find(t => t.token_number === settings.current_token)

  if (loading) return <div style={dash.loading}>Loading...</div>

  return (
    <div style={dash.page}>
      {/* Header */}
      <div style={dash.header}>
        <div>
          <div style={dash.brand}>✂ {settings.salon_name}</div>
          <div style={dash.subtitle}>OWNER DASHBOARD</div>
        </div>
        <button style={dash.settingsBtn} onClick={() => setShowSettings(!showSettings)}>⚙ SETTINGS</button>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div style={dash.settingsPanel}>
          <div style={dash.settingsTitle}>Settings</div>
          <label style={dash.label}>Salon Ka Naam</label>
          <input style={dash.input} value={settings.salon_name} onChange={e => setSettings(s => ({ ...s, salon_name: e.target.value }))} />
          <label style={dash.label}>WhatsApp Number (with country code)</label>
          <input style={dash.input} value={settings.whatsapp_number} placeholder="919784619102" onChange={e => setSettings(s => ({ ...s, whatsapp_number: e.target.value }))} />
          <label style={dash.label}>Average Wait Time (minutes)</label>
          <input style={dash.input} type="number" value={settings.avg_wait_minutes} onChange={e => setSettings(s => ({ ...s, avg_wait_minutes: e.target.value }))} />
          <button style={dash.saveBtn} onClick={saveSettings}>{saved ? '✓ Saved!' : 'Save Karo'}</button>
        </div>
      )}

      {/* Now Serving */}
      <div style={dash.servingCard}>
        <div style={dash.servingLabel}>NOW SERVING</div>
        <div style={dash.servingNumber}>#{settings.current_token || 0}</div>
        {currentCustomer && <div style={dash.servingPhone}>📞 +{currentCustomer.phone}</div>}
        <button style={dash.nextBtn} onClick={nextCustomer}>NEXT CUSTOMER →</button>
        <div style={dash.statsRow}>
          <div style={dash.stat}><div style={dash.statLabel}>WAITING</div><div style={dash.statValue}>{waiting.length}</div></div>
          <div style={dash.stat}><div style={dash.statLabel}>AVG WAIT</div><div style={dash.statValue}>{settings.avg_wait_minutes}m</div></div>
        </div>
      </div>

      {/* Queue */}
      <div style={dash.section}>
        <div style={dash.sectionHeader}>
          <span style={dash.sectionTitle}>Queue</span>
          <span style={dash.badge}>{waiting.length} WAITING</span>
        </div>
        {waiting.length === 0 && <div style={dash.empty}>Abhi koi waiting nahi hai 🎉</div>}
        {waiting.map((t, i) => (
          <div key={t.id} style={dash.tokenRow}>
            <div style={dash.tokenBadge}>#{t.token_number}</div>
            <div style={dash.tokenInfo}>
              <div style={dash.tokenPhone}>📞 {t.phone}</div>
              <div style={dash.tokenTime}>Booked {new Date(t.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>
            </div>
            <div style={dash.tokenWait}>
              <div style={dash.tokenWaitLabel}>APPROX</div>
              <div style={dash.tokenWaitValue}>{(i + 1) * settings.avg_wait_minutes}m</div>
            </div>
          </div>
        ))}
      </div>

      {/* QR Code */}
      <div style={dash.qrSection}>
        <div style={dash.sectionTitle}># Customer QR</div>
        <div style={dash.qrDesc}>Yeh QR print karke salon mein lagao. Customer scan karenge aur booking page pe pahunchenge.</div>
        {qrDataUrl && <img src={qrDataUrl} style={dash.qrImg} alt="QR Code" />}
        <div style={dash.qrUrl}>{window.location.origin}</div>
      </div>
    </div>
  )
}

const dash = {
  page: { minHeight: '100vh', background: '#f5f0eb', color: '#0a0a0a', fontFamily: "'DM Sans', sans-serif" },
  loading: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f0eb', color: '#0a0a0a', fontFamily: 'sans-serif', fontSize: '18px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 20px 0', borderBottom: '1px solid #ddd', paddingBottom: '16px' },
  brand: { fontFamily: "'Bebas Neue', cursive", fontSize: '22px', letterSpacing: '3px' },
  subtitle: { fontSize: '10px', letterSpacing: '2px', color: '#888' },
  settingsBtn: { background: '#fff', border: '1px solid #ddd', borderRadius: '2px', padding: '8px 14px', fontSize: '12px', letterSpacing: '1px', cursor: 'pointer' },
  settingsPanel: { background: '#fff', margin: '16px', borderRadius: '4px', padding: '20px', border: '1px solid #e0d8d0' },
  settingsTitle: { fontFamily: "'Bebas Neue', cursive", fontSize: '24px', marginBottom: '16px' },
  label: { display: 'block', fontSize: '11px', letterSpacing: '1px', color: '#888', marginBottom: '6px', marginTop: '12px' },
  input: { width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '2px', fontSize: '15px', background: '#f9f9f9', outline: 'none' },
  saveBtn: { width: '100%', marginTop: '16px', padding: '12px', background: '#0a0a0a', color: '#f0e8dc', border: 'none', borderRadius: '2px', fontSize: '14px', letterSpacing: '1px', cursor: 'pointer', fontWeight: 600 },
  servingCard: { background: '#0a0a0a', color: '#f0e8dc', margin: '16px', borderRadius: '4px', padding: '24px' },
  servingLabel: { fontSize: '11px', letterSpacing: '3px', color: '#888', marginBottom: '4px' },
  servingNumber: { fontFamily: "'Bebas Neue', cursive", fontSize: '80px', lineHeight: 1, marginBottom: '4px' },
  servingPhone: { fontSize: '14px', color: '#aaa', marginBottom: '16px' },
  nextBtn: { width: '100%', padding: '14px', background: '#e63329', color: '#fff', border: 'none', borderRadius: '2px', fontSize: '14px', letterSpacing: '2px', fontWeight: 700, cursor: 'pointer', marginBottom: '20px' },
  statsRow: { display: 'flex', gap: '16px' },
  stat: { flex: 1, background: 'rgba(255,255,255,0.08)', borderRadius: '2px', padding: '12px' },
  statLabel: { fontSize: '10px', letterSpacing: '2px', color: '#888', marginBottom: '4px' },
  statValue: { fontFamily: "'Bebas Neue', cursive", fontSize: '32px' },
  section: { margin: '0 16px 16px', background: '#fff', borderRadius: '4px', border: '1px solid #e0d8d0', overflow: 'hidden' },
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderBottom: '1px solid #e0d8d0' },
  sectionTitle: { fontFamily: "'Bebas Neue', cursive", fontSize: '20px', letterSpacing: '1px' },
  badge: { fontSize: '10px', letterSpacing: '1px', background: '#f0e8dc', padding: '4px 10px', borderRadius: '20px', color: '#555' },
  empty: { padding: '24px', textAlign: 'center', color: '#888', fontSize: '14px' },
  tokenRow: { display: 'flex', alignItems: 'center', padding: '14px 16px', borderBottom: '1px solid #f0e8dc', gap: '12px' },
  tokenBadge: { fontFamily: "'Bebas Neue', cursive", fontSize: '24px', background: '#f0e8dc', padding: '8px 12px', borderRadius: '2px', minWidth: '60px', textAlign: 'center' },
  tokenInfo: { flex: 1 },
  tokenPhone: { fontSize: '15px', fontWeight: 500 },
  tokenTime: { fontSize: '12px', color: '#888', marginTop: '2px' },
  tokenWait: { textAlign: 'right' },
  tokenWaitLabel: { fontSize: '10px', letterSpacing: '1px', color: '#888' },
  tokenWaitValue: { fontFamily: "'Bebas Neue', cursive", fontSize: '22px' },
  qrSection: { margin: '0 16px 32px', background: '#fff', borderRadius: '4px', border: '1px solid #e0d8d0', padding: '20px', textAlign: 'center' },
  qrDesc: { fontSize: '13px', color: '#666', margin: '8px 0 20px', lineHeight: 1.5 },
  qrImg: { width: '200px', height: '200px', border: '8px solid #f0e8dc', borderRadius: '4px' },
  qrUrl: { fontSize: '11px', color: '#aaa', marginTop: '12px', letterSpacing: '1px', wordBreak: 'break-all' },
}
