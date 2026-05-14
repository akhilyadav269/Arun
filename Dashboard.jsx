import { useState, useEffect } from 'react'
import { sb } from '../lib/supabase'

export default function Dashboard() {
  const [cfg, setCfg] = useState({ whatsapp_number: '919784619102', avg_wait_minutes: 25, current_token: 0, salon_name: 'Arun Saloon' })
  const [waiting, setWaiting] = useState([])
  const [curCust, setCurCust] = useState(null)
  const [showSettings, setShowSettings] = useState(false)
  const [salonName, setSalonName] = useState('Arun Saloon')
  const [sWhatsapp, setSWhatsapp] = useState('')
  const [sAvgWait, setSAvgWait] = useState(25)

  async function loadCfg() {
    const { data } = await sb.from('settings').select('*').eq('id', 1).single()
    if (data) setCfg(data)
    return data
  }

  async function refreshDash() {
    const c = await loadCfg()
    if (!c) return
    const today = new Date().toISOString().split('T')[0]
    const { data: toks } = await sb.from('tokens').select('*').eq('date', today).order('token_number', { ascending: true })
    const cur = c.current_token || 0
    const w = (toks || []).filter(t => t.token_number > cur)
    const cc = (toks || []).find(t => t.token_number === cur)
    setWaiting(w)
    setCurCust(cc)
  }

  async function initDashboard() {
    const c = await loadCfg()
    if (c) {
      const today = new Date().toISOString().split('T')[0]
      if (c.last_reset !== today) {
        await sb.from('settings').update({ current_token: 0, last_reset: today }).eq('id', 1)
      }
      setSalonName(c.salon_name || 'Arun Saloon')
      setSWhatsapp(c.whatsapp_number || '')
      setSAvgWait(c.avg_wait_minutes || 25)
    }
    await refreshDash()
  }

  useEffect(() => {
    initDashboard()
    const id = setInterval(refreshDash, 5000)
    return () => clearInterval(id)
  }, [])

  async function nextCustomer() {
    const next = (cfg.current_token || 0) + 1
    await sb.from('settings').update({ current_token: next }).eq('id', 1)
    await refreshDash()
  }

  async function saveSettings() {
    await sb.from('settings').update({
      salon_name: salonName,
      whatsapp_number: sWhatsapp,
      avg_wait_minutes: parseInt(sAvgWait)
    }).eq('id', 1)
    alert('Saved! ✅')
    setShowSettings(false)
    await refreshDash()
  }

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: '#f5f0eb', color: '#0a0a0a', minHeight: '100vh' }}>
      {/* Header */}
      <div style={s.header}>
        <div>
          <div style={s.brand}>✂ ARUN SALOON</div>
          <div style={s.subtitle}>OWNER DASHBOARD</div>
        </div>
        <button onClick={() => setShowSettings(!showSettings)} style={s.settingsBtn}>⚙ SETTINGS</button>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div style={s.settingsPanel}>
          <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 24, marginBottom: 16 }}>Settings</div>
          <label style={s.sLabel}>Salon Ka Naam</label>
          <input style={s.sInput} value={salonName} onChange={e => setSalonName(e.target.value)} />
          <label style={s.sLabel}>WhatsApp Number</label>
          <input style={s.sInput} value={sWhatsapp} onChange={e => setSWhatsapp(e.target.value)} placeholder="919784619102" />
          <label style={s.sLabel}>Average Wait Time (minutes)</label>
          <input style={s.sInput} type="number" value={sAvgWait} onChange={e => setSAvgWait(e.target.value)} />
          <button onClick={saveSettings} style={s.saveBtn}>Save Karo</button>
        </div>
      )}

      {/* Serving Card */}
      <div style={s.servingCard}>
        <div style={s.servingLabel}>NOW SERVING</div>
        <div style={s.servingNumber}>#{cfg.current_token || 0}</div>
        <div style={s.servingPhone}>{curCust ? '📞 +' + curCust.phone : ''}</div>
        <button onClick={nextCustomer} style={s.nextBtn}>NEXT CUSTOMER →</button>
        <div style={s.statsRow}>
          <div style={s.statBox}><div style={s.statLabel}>WAITING</div><div style={s.statValue}>{waiting.length}</div></div>
          <div style={s.statBox}><div style={s.statLabel}>AVG WAIT</div><div style={s.statValue}>{cfg.avg_wait_minutes}m</div></div>
        </div>
      </div>

      {/* Queue */}
      <div style={s.queueSection}>
        <div style={s.queueHeader}>
          <span style={s.queueTitle}>Queue</span>
          <span style={s.queueBadge}>{waiting.length} WAITING</span>
        </div>
        {waiting.length === 0 ? (
          <div style={s.queueEmpty}>Abhi koi waiting nahi hai 🎉</div>
        ) : (
          waiting.map((t, i) => (
            <div key={t.id} style={s.tokenRow}>
              <div style={s.tokenBadge}>#{t.token_number}</div>
              <div style={{ flex: 1 }}>
                <div style={s.tokenPhone}>📞 {t.phone}</div>
                <div style={s.tokenTime}>{new Date(t.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={s.tokenWaitLabel}>APPROX</div>
                <div style={s.tokenWaitValue}>{(i + 1) * cfg.avg_wait_minutes}m</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

const s = {
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottom: '1px solid #ddd', background: '#f5f0eb' },
  brand: { fontFamily: "'Bebas Neue', cursive", fontSize: 20, letterSpacing: 3 },
  subtitle: { fontSize: 10, letterSpacing: 2, color: '#888' },
  settingsBtn: { background: '#fff', border: '1px solid #ddd', borderRadius: 2, padding: '8px 14px', fontSize: 12, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" },
  settingsPanel: { background: '#fff', margin: 12, borderRadius: 4, padding: 20, border: '1px solid #e0d8d0' },
  sLabel: { display: 'block', fontSize: 11, color: '#888', marginBottom: 6, marginTop: 12 },
  sInput: { width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: 2, fontSize: 15, fontFamily: "'DM Sans', sans-serif", outline: 'none', boxSizing: 'border-box' },
  saveBtn: { width: '100%', marginTop: 16, padding: 12, background: '#0a0a0a', color: '#f0e8dc', border: 'none', borderRadius: 2, fontSize: 14, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontWeight: 600 },
  servingCard: { background: '#0a0a0a', color: '#f0e8dc', margin: 12, borderRadius: 4, padding: 24 },
  servingLabel: { fontSize: 11, letterSpacing: 3, color: '#888', marginBottom: 4 },
  servingNumber: { fontFamily: "'Bebas Neue', cursive", fontSize: 80, lineHeight: 1 },
  servingPhone: { fontSize: 14, color: '#aaa', marginBottom: 16, marginTop: 4 },
  nextBtn: { width: '100%', padding: 14, background: '#e63329', color: '#fff', border: 'none', borderRadius: 2, fontSize: 14, fontWeight: 700, cursor: 'pointer', marginBottom: 20, fontFamily: "'DM Sans', sans-serif", letterSpacing: 2 },
  statsRow: { display: 'flex', gap: 12 },
  statBox: { flex: 1, background: 'rgba(255,255,255,0.08)', borderRadius: 2, padding: 12 },
  statLabel: { fontSize: 10, color: '#888', marginBottom: 4, letterSpacing: 2 },
  statValue: { fontFamily: "'Bebas Neue', cursive", fontSize: 32 },
  queueSection: { margin: '0 12px 32px', background: '#fff', borderRadius: 4, border: '1px solid #e0d8d0', overflow: 'hidden' },
  queueHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderBottom: '1px solid #e0d8d0' },
  queueTitle: { fontFamily: "'Bebas Neue', cursive", fontSize: 20, letterSpacing: 1 },
  queueBadge: { fontSize: 10, background: '#f0e8dc', padding: '4px 10px', borderRadius: 20, color: '#555' },
  queueEmpty: { padding: 24, textAlign: 'center', color: '#888', fontSize: 14 },
  tokenRow: { display: 'flex', alignItems: 'center', padding: '14px 16px', borderBottom: '1px solid #f0e8dc', gap: 12 },
  tokenBadge: { fontFamily: "'Bebas Neue', cursive", fontSize: 24, background: '#f0e8dc', padding: '8px 12px', borderRadius: 2, minWidth: 60, textAlign: 'center' },
  tokenPhone: { fontSize: 15, fontWeight: 500 },
  tokenTime: { fontSize: 12, color: '#888', marginTop: 2 },
  tokenWaitLabel: { fontSize: 10, color: '#888' },
  tokenWaitValue: { fontFamily: "'Bebas Neue', cursive", fontSize: 22 },
}
