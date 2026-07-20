// ── Tweaks Panel ─────────────────────────────────────────────────────────────
// Left sidebar for switching between screens

function TweaksPanel({ screens, current, onChange }) {
  // Group screens
  const groups = screens.reduce((acc, s) => {
    (acc[s.group] = acc[s.group] || []).push(s);
    return acc;
  }, {});

  const groupColors = {
    'عام':   '#64748b',
    'أدمن':  '#1e3a5f',
    'طالب':  '#065f46',
    'دكتور': '#7c3aed',
  };

  return (
    <div style={{
      width:260, height:'100vh', background:'#1a1a24',
      display:'flex', flexDirection:'column', flexShrink:0,
      borderRight:'1px solid rgba(255,255,255,0.06)', overflowY:'auto',
      fontFamily:"'Noto Sans Arabic', system-ui, sans-serif",
    }}>
      {/* Panel Header */}
      <div style={{
        padding:'18px 16px 14px',
        borderBottom:'1px solid rgba(255,255,255,0.08)',
        flexShrink:0,
      }}>
        <div style={{ fontSize:13, fontWeight:800, color:'#fff', letterSpacing:'0.05em',
          textTransform:'uppercase', marginBottom:4 }}>
          UniSys Hi-Fi
        </div>
        <div style={{ fontSize:11, color:'rgba(255,255,255,0.35)' }}>
          {screens.length} شاشة · اضغط للتنقل
        </div>
      </div>

      {/* Screens by group */}
      <div style={{ padding:'8px 8px', flex:1 }}>
        {Object.entries(groups).map(([group, items]) => (
          <div key={group} style={{ marginBottom:16 }}>
            {/* Group label */}
            <div style={{
              fontSize:10, fontWeight:700, letterSpacing:'0.1em',
              color:`${groupColors[group]}cc` || 'rgba(255,255,255,0.3)',
              padding:'6px 8px 4px', textTransform:'uppercase',
              borderRight:`2px solid ${groupColors[group] || '#64748b'}`,
              marginBottom:4,
            }}>
              {group}
            </div>

            {/* Screen items */}
            {items.map(screen => {
              const isActive = current === screen.id;
              return (
                <PanelItem key={screen.id} screen={screen}
                  active={isActive} onClick={()=>onChange(screen.id)} />
              );
            })}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{
        padding:'12px 16px', borderTop:'1px solid rgba(255,255,255,0.06)',
        flexShrink:0,
      }}>
        <div style={{ fontSize:10, color:'rgba(255,255,255,0.2)', textAlign:'center',
          lineHeight:1.6 }}>
          UniSys · مشروع تخرج<br/>
          Hi-Fi Prototype
        </div>
      </div>
    </div>
  );
}

function PanelItem({ screen, active, onClick }) {
  const [hovered, setHovered] = React.useState(false);

  return (
    <div onClick={onClick}
      onMouseEnter={()=>setHovered(true)}
      onMouseLeave={()=>setHovered(false)}
      style={{
        display:'flex', alignItems:'center', gap:8,
        padding:'7px 10px', borderRadius:7, cursor:'pointer', marginBottom:2,
        background: active
          ? 'rgba(46,134,171,0.2)'
          : hovered ? 'rgba(255,255,255,0.05)' : 'transparent',
        border: `1px solid ${active ? 'rgba(46,134,171,0.4)' : 'transparent'}`,
        transition:'all 120ms',
      }}>
      <span style={{ fontSize:14, flexShrink:0 }}>{screen.emoji}</span>
      <span style={{
        fontSize:12, fontWeight: active ? 700 : 400,
        color: active ? '#fff' : hovered ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.45)',
        flex:1, lineHeight:1.3,
      }}>
        {screen.label}
      </span>
      {active && (
        <div style={{ width:6,height:6,borderRadius:'50%',background:'#2e86ab',flexShrink:0 }}/>
      )}
    </div>
  );
}

window.TweaksPanel = TweaksPanel;
