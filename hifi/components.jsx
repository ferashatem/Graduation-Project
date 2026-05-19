// ── UniSys Component Library ────────────────────────────────────────────────
// Shared color palette shorthand
const C = {
  p950:'#060d14', p900:'#0d1b2a', p800:'#122234', p700:'#1e3a5f',
  p600:'#245180', p500:'#2e86ab', p400:'#4ba3c7', p300:'#7fc0da',
  p100:'#d6e8f7', p50:'#edf5fb',
  success:'#10b981', successBg:'#d1fae5', successText:'#065f46',
  warning:'#f59e0b', warningBg:'#fef3c7', warningText:'#92400e',
  danger:'#ef4444',  dangerBg:'#fee2e2',  dangerText:'#991b1b',
  info:'#3b82f6',    infoBg:'#dbeafe',    infoText:'#1e40af',
  ai1:'#7c3aed', ai2:'#2e86ab',
  surface:'#f0f4f8', white:'#ffffff', border:'#e2e8f0', borderD:'#cbd5e1',
  text:'#1a1a2e', textSec:'#64748b', textMute:'#94a3b8', textInv:'#ffffff',
};
window.C = C;

// ── Button ──────────────────────────────────────────────────────────────────
function Btn({ children, variant='primary', size='md', icon, iconPos='right',
                disabled, onClick, style, ...rest }) {
  const base = {
    display:'inline-flex', alignItems:'center', gap:6, borderRadius:8,
    fontFamily:'inherit', fontWeight:600, cursor: disabled?'not-allowed':'pointer',
    transition:'all 150ms ease', whiteSpace:'nowrap', border:'1.5px solid transparent',
    opacity: disabled ? 0.55 : 1,
  };
  const sizes = {
    sm: { fontSize:12, padding:'5px 12px' },
    md: { fontSize:14, padding:'8px 18px' },
    lg: { fontSize:15, padding:'11px 24px' },
  };
  const variants = {
    primary:   { background:C.p700, borderColor:C.p700, color:C.textInv },
    secondary: { background:C.white, borderColor:C.border, color:C.text },
    ghost:     { background:'transparent', borderColor:'transparent', color:C.p500 },
    danger:    { background:C.danger, borderColor:C.danger, color:C.textInv },
    outline:   { background:'transparent', borderColor:C.p500, color:C.p500 },
    ai:        { background:`linear-gradient(135deg,${C.ai1},${C.ai2})`, color:C.textInv },
  };
  return (
    <button onClick={disabled ? undefined : onClick}
      style={{ ...base, ...sizes[size], ...variants[variant], ...style }} {...rest}>
      {iconPos === 'right' && icon}
      {children}
      {iconPos === 'left' && icon}
    </button>
  );
}

// ── Badge ───────────────────────────────────────────────────────────────────
function Badge({ children, variant='default', dot, style }) {
  const variants = {
    default: { bg:'#f1f5f9', color:C.textSec },
    success: { bg:C.successBg, color:C.successText },
    warning: { bg:C.warningBg, color:C.warningText },
    danger:  { bg:C.dangerBg,  color:C.dangerText  },
    info:    { bg:C.infoBg,    color:C.infoText    },
    navy:    { bg:C.p100,      color:C.p700        },
    ai:      { bg:'#ede9fe',   color:C.ai1         },
  };
  const v = variants[variant] || variants.default;
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:5,
      padding:'2px 10px', borderRadius:9999, fontSize:12, fontWeight:600,
      background:v.bg, color:v.color, ...style,
    }}>
      {dot && <span style={{ width:6,height:6,borderRadius:'50%',background:v.color,flexShrink:0 }}/>}
      {children}
    </span>
  );
}

// ── Card ────────────────────────────────────────────────────────────────────
function Card({ children, style, padding=20, shadow='sm', ...rest }) {
  const shadows = { sm:'0 1px 3px rgba(0,0,0,.08)', md:'0 4px 12px rgba(0,0,0,.10)', none:'none' };
  return (
    <div style={{
      background:C.white, borderRadius:12, padding,
      boxShadow:shadows[shadow], border:`1px solid ${C.border}`,
      ...style,
    }} {...rest}>
      {children}
    </div>
  );
}

// ── Avatar ──────────────────────────────────────────────────────────────────
function Avatar({ name='?', size=36, bg, image, style }) {
  const colors = [C.p700, C.ai1, C.success, '#e11d48', '#d97706', '#0891b2'];
  const initials = name.split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase();
  const hash = name.split('').reduce((a,c)=>a+c.charCodeAt(0),0);
  const bgColor = bg || colors[hash % colors.length];
  return (
    <div style={{
      width:size, height:size, borderRadius:'50%', overflow:'hidden',
      background: image ? 'transparent' : bgColor,
      display:'flex', alignItems:'center', justifyContent:'center',
      color:'#fff', fontWeight:700, fontSize:size*0.38, flexShrink:0,
      ...style,
    }}>
      {image ? <img src={image} style={{width:'100%',height:'100%',objectFit:'cover'}} /> : initials}
    </div>
  );
}

// ── KPI Card ────────────────────────────────────────────────────────────────
function KPICard({ title, value, sub, icon, iconBg, trend, trendLabel }) {
  const trendUp = trend > 0;
  const trendColor = trendUp ? C.success : C.danger;
  return (
    <Card style={{ flex:1, minWidth:180 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
        <div style={{ width:44,height:44,borderRadius:10,background:iconBg||C.p50,
          display:'flex',alignItems:'center',justifyContent:'center' }}>
          {icon}
        </div>
        {trend !== undefined && (
          <div style={{ display:'flex',alignItems:'center',gap:3,
            fontSize:12,fontWeight:600,color:trendColor }}>
            {trendUp
              ? <Icons.TrendUp size={14} color={trendColor} />
              : <Icons.TrendDown size={14} color={trendColor} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div style={{ fontSize:28, fontWeight:800, color:C.text, lineHeight:1 }}>{value}</div>
      <div style={{ marginTop:4, fontSize:13, fontWeight:600, color:C.text }}>{title}</div>
      {sub && <div style={{ marginTop:2, fontSize:12, color:C.textSec }}>{sub}</div>}
      {trendLabel && <div style={{ marginTop:4, fontSize:11, color:trendColor, fontWeight:500 }}>{trendLabel}</div>}
    </Card>
  );
}

// ── Input ───────────────────────────────────────────────────────────────────
function Input({ label, placeholder, type='text', icon, value, onChange, style }) {
  const [focused, setFocused] = React.useState(false);
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:6, ...style }}>
      {label && <label style={{ fontSize:13, fontWeight:600, color:C.text }}>{label}</label>}
      <div style={{ position:'relative' }}>
        {icon && (
          <span style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)',
            color:C.textSec, pointerEvents:'none', display:'flex', alignItems:'center' }}>
            {icon}
          </span>
        )}
        <input type={type} placeholder={placeholder} value={value} onChange={onChange}
          onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)}
          style={{
            width:'100%', padding: icon ? '9px 40px 9px 14px' : '9px 14px',
            borderRadius:8, border:`1.5px solid ${focused ? C.p500 : C.border}`,
            fontSize:14, outline:'none', transition:'border-color 150ms',
            fontFamily:'inherit', color:C.text, background:C.white,
            boxShadow: focused ? `0 0 0 3px ${C.p100}` : 'none',
          }} />
      </div>
    </div>
  );
}

// ── Select ──────────────────────────────────────────────────────────────────
function Select({ label, options=[], value, onChange, placeholder, style }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:6, ...style }}>
      {label && <label style={{ fontSize:13, fontWeight:600, color:C.text }}>{label}</label>}
      <select value={value} onChange={onChange}
        style={{
          width:'100%', padding:'9px 14px', borderRadius:8,
          border:`1.5px solid ${C.border}`, fontSize:14, outline:'none',
          fontFamily:'inherit', color:C.text, background:C.white, cursor:'pointer',
          appearance:'none',
        }}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

// ── Search Bar ──────────────────────────────────────────────────────────────
function SearchBar({ placeholder='بحث...', value, onChange, style }) {
  const [focused, setFocused] = React.useState(false);
  return (
    <div style={{ position:'relative', ...style }}>
      <span style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)',
        color:C.textSec, display:'flex', alignItems:'center', pointerEvents:'none' }}>
        <Icons.Search size={16} />
      </span>
      <input placeholder={placeholder} value={value} onChange={onChange}
        onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)}
        style={{
          width:'100%', padding:'9px 40px 9px 14px',
          borderRadius:8, border:`1.5px solid ${focused ? C.p500 : C.border}`,
          fontSize:14, outline:'none', fontFamily:'inherit', color:C.text,
          background:C.white, boxShadow: focused ? `0 0 0 3px ${C.p100}` : 'none',
          transition:'all 150ms',
        }} />
    </div>
  );
}

// ── Divider ─────────────────────────────────────────────────────────────────
function Divider({ style }) {
  return <div style={{ height:1, background:C.border, margin:'8px 0', ...style }} />;
}

// ── Topbar ──────────────────────────────────────────────────────────────────
function Topbar({ title, userName='فراس حاتم', userRole='أدمن', notifCount=3 }) {
  return (
    <div style={{
      height:64, background:C.white, borderBottom:`1px solid ${C.border}`,
      display:'flex', alignItems:'center', justifyContent:'space-between',
      padding:'0 24px', flexShrink:0, boxShadow:'0 1px 4px rgba(0,0,0,.05)',
    }}>
      {/* Right: Title */}
      <div>
        <div style={{ fontSize:18, fontWeight:700, color:C.text }}>{title}</div>
      </div>
      {/* Left: Actions */}
      <div style={{ display:'flex', alignItems:'center', gap:12 }}>
        {/* Notification Bell */}
        <div style={{ position:'relative', cursor:'pointer' }}>
          <div style={{
            width:38, height:38, borderRadius:9, background:C.surface,
            display:'flex', alignItems:'center', justifyContent:'center',
            border:`1px solid ${C.border}`,
          }}>
            <Icons.Bell size={18} color={C.textSec} />
          </div>
          {notifCount > 0 && (
            <span style={{
              position:'absolute', top:-4, left:-4, width:18, height:18,
              background:C.danger, borderRadius:'50%', fontSize:10, fontWeight:700,
              color:'#fff', display:'flex', alignItems:'center', justifyContent:'center',
              border:`2px solid ${C.white}`,
            }}>{notifCount}</span>
          )}
        </div>
        {/* User */}
        <div style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer',
          padding:'6px 10px', borderRadius:8, border:`1px solid ${C.border}`,
          background:C.surface }}>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontSize:13, fontWeight:700, color:C.text }}>{userName}</div>
            <div style={{ fontSize:11, color:C.textSec }}>{userRole}</div>
          </div>
          <Avatar name={userName} size={32} />
        </div>
      </div>
    </div>
  );
}

// ── Sidebar ─────────────────────────────────────────────────────────────────
function SidebarItem({ icon, label, active, sub, badge, onClick, indent=false }) {
  const [hovered, setHovered] = React.useState(false);
  return (
    <div onClick={onClick} onMouseEnter={()=>setHovered(true)} onMouseLeave={()=>setHovered(false)}
      style={{
        display:'flex', alignItems:'center', gap:10,
        padding: indent ? '7px 12px 7px 20px' : '8px 12px',
        borderRadius:8, cursor:'pointer', marginBottom:1,
        background: active ? `rgba(46,134,171,0.15)` : hovered ? 'rgba(255,255,255,0.06)' : 'transparent',
        borderRight: active ? `3px solid ${C.p500}` : '3px solid transparent',
        transition:'all 150ms',
      }}>
      <span style={{ color: active ? C.p400 : hovered ? C.p300 : 'rgba(255,255,255,0.55)', flexShrink:0 }}>
        {icon}
      </span>
      <span style={{
        flex:1, fontSize: indent ? 13 : 14, fontWeight: active ? 600 : 400,
        color: active ? '#fff' : hovered ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.65)',
        transition:'color 150ms',
      }}>{label}</span>
      {badge && <Badge variant="navy" style={{ background:'rgba(46,134,171,0.25)', color:C.p300, fontSize:10 }}>{badge}</Badge>}
      {sub && <Icons.ChevronD size={14} color="rgba(255,255,255,0.35)" />}
    </div>
  );
}

function SidebarSection({ label, children }) {
  return (
    <div style={{ marginBottom:4 }}>
      <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.08em',
        color:'rgba(255,255,255,0.3)', padding:'10px 12px 4px', textTransform:'uppercase' }}>
        {label}
      </div>
      {children}
    </div>
  );
}

function Sidebar({ role='admin', active='dashboard', onNavigate }) {
  const adminNav = [
    { section:'الرئيسية', items:[
      { id:'dashboard', icon:<Icons.Home size={18}/>, label:'لوحة التحكم' },
      { id:'analytics', icon:<Icons.BarChart size={18}/>, label:'التحليلات' },
    ]},
    { section:'الهيكل الأكاديمي', items:[
      { id:'colleges',    icon:<Icons.Building size={18}/>, label:'الكليات' },
      { id:'years',       icon:<Icons.Layers size={18}/>,   label:'الفرق الدراسية' },
      { id:'departments', icon:<Icons.Grid size={18}/>,     label:'الأقسام' },
      { id:'batches',     icon:<Icons.Clipboard size={18}/>,label:'الدفعات' },
      { id:'semesters',   icon:<Icons.Calendar size={18}/>, label:'الفصول الدراسية' },
    ]},
    { section:'الأفراد', items:[
      { id:'students', icon:<Icons.Graduate size={18}/>, label:'الطلاب', badge:'1,248' },
      { id:'doctors',  icon:<Icons.User size={18}/>,     label:'الدكاترة', badge:'87' },
    ]},
    { section:'الأنشطة الأكاديمية', items:[
      { id:'subjects',  icon:<Icons.Book size={18}/>,      label:'المواد' },
      { id:'offerings', icon:<Icons.FileText size={18}/>,  label:'العروض الدراسية' },
      { id:'regulations',icon:<Icons.Shield size={18}/>,   label:'اللوائح الأكاديمية' },
    ]},
    { section:'الإدارة', items:[
      { id:'notifications', icon:<Icons.Bell size={18}/>,       label:'الإشعارات' },
      { id:'complaints',    icon:<Icons.AlertCircle size={18}/>, label:'الشكاوى', badge:'5' },
      { id:'schedule',      icon:<Icons.Calendar size={18}/>,    label:'الجداول' },
    ]},
    { section:'المباني', items:[
      { id:'buildings', icon:<Icons.MapPin size={18}/>, label:'الحرم الجامعي' },
    ]},
  ];

  const studentNav = [
    { section:'الرئيسية', items:[
      { id:'student-home',     icon:<Icons.Home size={18}/>,     label:'الرئيسية' },
      { id:'student-courses',  icon:<Icons.Book size={18}/>,     label:'موادي الدراسية' },
      { id:'student-schedule', icon:<Icons.Calendar size={18}/>, label:'جدولي الدراسي' },
      { id:'student-exams',    icon:<Icons.Clipboard size={18}/>,label:'الامتحانات' },
    ]},
    { section:'الذكاء الاصطناعي', items:[
      { id:'ai-chat', icon:<Icons.Sparkle size={18}/>, label:'المساعد الذكي' },
    ]},
    { section:'الأخرى', items:[
      { id:'complaints', icon:<Icons.AlertCircle size={18}/>, label:'شكاواي' },
    ]},
  ];

  const doctorNav = [
    { section:'الرئيسية', items:[
      { id:'doctor-dashboard', icon:<Icons.Home size={18}/>,     label:'لوحة التحكم' },
      { id:'my-courses',       icon:<Icons.Book size={18}/>,     label:'موادي' },
      { id:'materials',        icon:<Icons.FileText size={18}/>, label:'المواد التعليمية' },
      { id:'exams',            icon:<Icons.Clipboard size={18}/>,label:'الامتحانات' },
      { id:'doctor-schedule',  icon:<Icons.Calendar size={18}/>, label:'جدولي' },
    ]},
  ];

  const navMap = { admin:adminNav, student:studentNav, doctor:doctorNav };
  const nav = navMap[role] || adminNav;

  const roleLabel = { admin:'أدمن', student:'طالب', doctor:'دكتور' }[role];
  const roleName  = { admin:'فراس حاتم', student:'أحمد محمد', doctor:'د. سارة علي' }[role];

  return (
    <div style={{
      width:256, height:'100%', background:C.p900,
      display:'flex', flexDirection:'column', flexShrink:0,
      borderLeft:`1px solid rgba(255,255,255,0.06)`,
    }}>
      {/* Logo */}
      <div style={{ padding:'20px 16px 16px', borderBottom:'1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{
            width:38, height:38, borderRadius:10,
            background:`linear-gradient(135deg,${C.p500},${C.ai1})`,
            display:'flex', alignItems:'center', justifyContent:'center',
          }}>
            <Icons.Graduate size={20} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize:16, fontWeight:800, color:'#fff' }}>UniSys</div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.45)' }}>نظام إدارة جامعي</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <div style={{ flex:1, overflowY:'auto', padding:'12px 8px' }}>
        {nav.map(section => (
          <SidebarSection key={section.section} label={section.section}>
            {section.items.map(item => (
              <SidebarItem key={item.id} {...item}
                active={active === item.id}
                onClick={() => onNavigate && onNavigate(item.id)} />
            ))}
          </SidebarSection>
        ))}
      </div>

      {/* User Footer */}
      <div style={{ padding:'12px 8px', borderTop:'1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px',
          borderRadius:8, background:'rgba(255,255,255,0.05)', cursor:'pointer' }}>
          <Avatar name={roleName} size={36} />
          <div style={{ flex:1, overflow:'hidden' }}>
            <div style={{ fontSize:13, fontWeight:700, color:'#fff', whiteSpace:'nowrap',
              overflow:'hidden', textOverflow:'ellipsis' }}>{roleName}</div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.45)' }}>{roleLabel}</div>
          </div>
          <Icons.Logout size={16} color="rgba(255,255,255,0.35)" />
        </div>
      </div>
    </div>
  );
}

// ── Main Layout ──────────────────────────────────────────────────────────────
function MainLayout({ role='admin', activePage='dashboard', title='لوحة التحكم',
                      children, onNavigate, userName, userRole, notifCount }) {
  return (
    <div style={{ display:'flex', flexDirection:'row-reverse', height:'100vh',
      background:C.surface, overflow:'hidden' }}>
      <Sidebar role={role} active={activePage} onNavigate={onNavigate} />
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
        <Topbar title={title} userName={userName} userRole={userRole} notifCount={notifCount} />
        <div style={{ flex:1, overflowY:'auto', padding:24 }}>
          {children}
        </div>
      </div>
    </div>
  );
}

// ── Data Table ───────────────────────────────────────────────────────────────
function DataTable({ columns, rows, loading, emptyMsg='لا توجد بيانات' }) {
  return (
    <div style={{ overflowX:'auto', borderRadius:12, border:`1px solid ${C.border}`,
      boxShadow:'0 1px 3px rgba(0,0,0,.06)' }}>
      <table style={{ width:'100%', borderCollapse:'collapse', background:C.white }}>
        <thead>
          <tr style={{ background:C.surface, borderBottom:`2px solid ${C.border}` }}>
            {columns.map(col => (
              <th key={col.key} style={{
                padding:'12px 16px', textAlign:'right', fontSize:12,
                fontWeight:700, color:C.textSec, whiteSpace:'nowrap',
                letterSpacing:'0.03em', textTransform:'uppercase',
              }}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan={columns.length}
              style={{ textAlign:'center', padding:48, color:C.textSec, fontSize:14 }}>
              {emptyMsg}
            </td></tr>
          ) : rows.map((row, i) => (
            <tr key={i} style={{
              borderBottom:`1px solid ${C.border}`,
              background: i % 2 === 0 ? C.white : '#fafbfc',
              transition:'background 100ms',
            }}
              onMouseEnter={e => e.currentTarget.style.background=C.p50}
              onMouseLeave={e => e.currentTarget.style.background = i%2===0?C.white:'#fafbfc'}>
              {columns.map(col => (
                <td key={col.key} style={{
                  padding:'12px 16px', fontSize:14, color:C.text, textAlign:'right',
                }}>
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Pagination ───────────────────────────────────────────────────────────────
function Pagination({ page=1, total=10, size=20, onPage }) {
  const pages = Math.ceil(total/size);
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
      marginTop:16, fontSize:13, color:C.textSec }}>
      <span>عرض {Math.min((page-1)*size+1, total)}–{Math.min(page*size, total)} من {total} نتيجة</span>
      <div style={{ display:'flex', gap:4 }}>
        {[...Array(Math.min(pages,5))].map((_,i)=>(
          <button key={i+1} onClick={()=>onPage&&onPage(i+1)} style={{
            width:32, height:32, borderRadius:6, border:`1px solid ${i+1===page?C.p500:C.border}`,
            background: i+1===page ? C.p700 : C.white, color: i+1===page?'#fff':C.text,
            fontSize:13, fontWeight:600, cursor:'pointer', transition:'all 150ms',
          }}>{i+1}</button>
        ))}
      </div>
    </div>
  );
}

// ── Modal ────────────────────────────────────────────────────────────────────
function Modal({ open, onClose, title, children, width=520 }) {
  if (!open) return null;
  return (
    <div style={{
      position:'fixed', inset:0, background:'rgba(0,0,0,0.4)',
      display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999,
    }} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{
        background:C.white, borderRadius:16, width, maxWidth:'calc(100vw - 32px)',
        maxHeight:'90vh', overflow:'auto', boxShadow:'0 20px 60px rgba(0,0,0,0.2)',
      }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
          padding:'20px 24px 16px', borderBottom:`1px solid ${C.border}` }}>
          <button onClick={onClose} style={{
            width:32, height:32, borderRadius:8, background:C.surface,
            display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', border:'none',
          }}>
            <Icons.Close size={16} color={C.textSec} />
          </button>
          <div style={{ fontSize:17, fontWeight:700, color:C.text }}>{title}</div>
        </div>
        <div style={{ padding:24 }}>{children}</div>
      </div>
    </div>
  );
}

// ── Bar Chart (SVG) ──────────────────────────────────────────────────────────
function BarChart({ data, height=160, color=C.p500 }) {
  const max = Math.max(...data.map(d=>d.value), 1);
  const barW = Math.floor(300 / data.length) - 8;
  return (
    <svg width="100%" viewBox={`0 0 ${data.length*(barW+8)} ${height+30}`}
      style={{ overflow:'visible' }}>
      {data.map((d, i) => {
        const bh = (d.value / max) * height;
        const x = i * (barW + 8);
        const y = height - bh;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={bh}
              rx={4} fill={color} fillOpacity={0.85} />
            <text x={x + barW/2} y={height + 18} textAnchor="middle"
              fontSize={10} fill={C.textSec} fontFamily="inherit">{d.label}</text>
            <text x={x + barW/2} y={y - 4} textAnchor="middle"
              fontSize={10} fill={C.textSec} fontFamily="inherit">{d.value}</text>
          </g>
        );
      })}
    </svg>
  );
}

// ── Donut Chart (SVG) ────────────────────────────────────────────────────────
function DonutChart({ value=75, total=100, color=C.success, size=120, label }) {
  const pct = value / total;
  const r = 46; const cx = 60; const cy = 60;
  const circ = 2 * Math.PI * r;
  const dash = pct * circ;
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8 }}>
      <svg width={size} height={size} viewBox="0 0 120 120">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={C.border} strokeWidth={14}/>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={14}
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeDashoffset={circ / 4}
          strokeLinecap="round" style={{ transition:'all 600ms ease' }}/>
        <text x={cx} y={cy+2} textAnchor="middle" dominantBaseline="middle"
          fontSize={20} fontWeight={800} fill={C.text} fontFamily="inherit">
          {Math.round(pct*100)}%
        </text>
      </svg>
      {label && <div style={{ fontSize:13, fontWeight:600, color:C.textSec }}>{label}</div>}
    </div>
  );
}

// ── Toast (static) ────────────────────────────────────────────────────────────
function Toast({ message, variant='success' }) {
  const v = { success:{bg:C.successBg,color:C.successText,icon:<Icons.Check size={16}/>},
               danger:{bg:C.dangerBg,color:C.dangerText,icon:<Icons.AlertCircle size={16}/>},
               info:{bg:C.infoBg,color:C.infoText,icon:<Icons.Bell size={16}/>} }[variant];
  return (
    <div style={{
      display:'inline-flex', alignItems:'center', gap:8, padding:'10px 16px',
      borderRadius:10, background:v.bg, color:v.color,
      fontSize:13, fontWeight:600, boxShadow:'0 4px 12px rgba(0,0,0,0.1)',
    }}>
      {v.icon}{message}
    </div>
  );
}

// ── Export ────────────────────────────────────────────────────────────────────
window.C = C;
window.Btn = Btn;
window.Badge = Badge;
window.Card = Card;
window.Avatar = Avatar;
window.KPICard = KPICard;
window.Input = Input;
window.Select = Select;
window.SearchBar = SearchBar;
window.Divider = Divider;
window.Topbar = Topbar;
window.Sidebar = Sidebar;
window.SidebarItem = SidebarItem;
window.SidebarSection = SidebarSection;
window.MainLayout = MainLayout;
window.DataTable = DataTable;
window.Pagination = Pagination;
window.Modal = Modal;
window.BarChart = BarChart;
window.DonutChart = DonutChart;
window.Toast = Toast;
