// ── Main Screens: Login · Dashboard · Students · Doctors · Complaints ────────

// ════════════════════════════════════════════════════════════════════════════
// LOGIN SCREEN
// ════════════════════════════════════════════════════════════════════════════
function LoginScreen({ onLogin }) {
  const [email, setEmail] = React.useState('admin@unisys.edu');
  const [pass,  setPass]  = React.useState('••••••••');
  const [role,  setRole]  = React.useState('admin');
  const roles = [
    {v:'admin',   l:'أدمن',    icon:<Icons.Shield size={18}/>  },
    {v:'doctor',  l:'دكتور',   icon:<Icons.User size={18}/>    },
    {v:'student', l:'طالب',    icon:<Icons.Graduate size={18}/>},
  ];

  return (
    <div style={{ display:'flex', height:'100vh', fontFamily:'inherit' }}>
      {/* ── Left Panel: Visual ── */}
      <div style={{
        flex:1, background:`linear-gradient(145deg, ${C.p900} 0%, ${C.p700} 50%, ${C.p500} 100%)`,
        display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
        padding:48, position:'relative', overflow:'hidden',
      }}>
        {/* Geometric pattern */}
        <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', opacity:0.08 }}
          viewBox="0 0 600 700" preserveAspectRatio="xMidYMid slice">
          {[...Array(6)].map((_,i)=>(
            <circle key={i} cx={300+i*80-200} cy={350+i*60-150}
              r={80+i*40} fill="none" stroke="#fff" strokeWidth={1.5}/>
          ))}
          {[...Array(5)].map((_,i)=>(
            <line key={'l'+i} x1={i*120} y1={0} x2={i*120+100} y2={700}
              stroke="#fff" strokeWidth={1}/>
          ))}
        </svg>

        {/* Content */}
        <div style={{ position:'relative', textAlign:'center', color:'#fff' }}>
          <div style={{
            width:80, height:80, borderRadius:20,
            background:'rgba(255,255,255,0.15)', backdropFilter:'blur(10px)',
            display:'flex', alignItems:'center', justifyContent:'center',
            margin:'0 auto 24px', border:'1px solid rgba(255,255,255,0.2)',
          }}>
            <Icons.Graduate size={40} color="#fff" />
          </div>
          <h1 style={{ fontSize:36, fontWeight:900, marginBottom:12, letterSpacing:'-0.02em' }}>
            UniSys
          </h1>
          <p style={{ fontSize:18, opacity:0.8, marginBottom:48, fontWeight:400 }}>
            نظام إدارة جامعي ذكي
          </p>

          {/* Feature Pills */}
          {[
            { icon:<Icons.Sparkle size={15}/>, text:'مدعوم بالذكاء الاصطناعي' },
            { icon:<Icons.Users size={15}/>,   text:'4 أدوار مختلفة' },
            { icon:<Icons.Activity size={15}/>,text:'تحليلات متقدمة' },
            { icon:<Icons.Bell size={15}/>,    text:'إشعارات فورية' },
          ].map(f=>(
            <div key={f.text} style={{
              display:'inline-flex', alignItems:'center', gap:8, padding:'8px 16px',
              background:'rgba(255,255,255,0.1)', borderRadius:24,
              border:'1px solid rgba(255,255,255,0.15)', margin:4,
              fontSize:13, color:'rgba(255,255,255,0.9)',
            }}>
              {f.icon}{f.text}
            </div>
          ))}
        </div>
      </div>

      {/* ── Right Panel: Form ── */}
      <div style={{
        width:480, background:C.white, display:'flex', flexDirection:'column',
        alignItems:'center', justifyContent:'center', padding:'48px 48px',
      }}>
        <div style={{ width:'100%', maxWidth:380 }}>
          {/* Logo */}
          <div style={{ marginBottom:36, textAlign:'right' }}>
            <div style={{ fontSize:24, fontWeight:900, color:C.p900 }}>مرحباً بك 👋</div>
            <div style={{ fontSize:14, color:C.textSec, marginTop:4 }}>
              سجّل دخولك للمتابعة إلى نظام UniSys
            </div>
          </div>

          {/* Role Switcher */}
          <div style={{ marginBottom:24 }}>
            <div style={{ fontSize:13, fontWeight:600, color:C.text, marginBottom:8 }}>
              نوع الحساب
            </div>
            <div style={{ display:'flex', gap:8 }}>
              {roles.map(r=>(
                <button key={r.v} onClick={()=>setRole(r.v)} style={{
                  flex:1, padding:'9px 0', borderRadius:8,
                  border:`1.5px solid ${role===r.v ? C.p500 : C.border}`,
                  background: role===r.v ? C.p50 : C.white,
                  color: role===r.v ? C.p700 : C.textSec,
                  fontSize:12, fontWeight:600, cursor:'pointer',
                  display:'flex', alignItems:'center', justifyContent:'center', gap:5,
                  transition:'all 150ms',
                }}>
                  {r.icon}{r.l}
                </button>
              ))}
            </div>
          </div>

          {/* Email */}
          <div style={{ marginBottom:16 }}>
            <Input label="البريد الإلكتروني" value={email} onChange={e=>setEmail(e.target.value)}
              placeholder="example@unisys.edu" icon={<Icons.User size={15}/>}
              style={{ width:'100%' }} />
          </div>

          {/* Password */}
          <div style={{ marginBottom:8 }}>
            <Input label="كلمة المرور" type="password" value={pass}
              onChange={e=>setPass(e.target.value)}
              placeholder="أدخل كلمة المرور" icon={<Icons.Key size={15}/>}
              style={{ width:'100%' }} />
          </div>

          {/* Forgot */}
          <div style={{ textAlign:'left', marginBottom:24 }}>
            <span style={{ fontSize:13, color:C.p500, cursor:'pointer', fontWeight:500 }}>
              نسيت كلمة المرور؟
            </span>
          </div>

          {/* Submit */}
          <button onClick={()=>onLogin&&onLogin(role)} style={{
            width:'100%', padding:'12px', borderRadius:10, border:'none',
            background:`linear-gradient(135deg, ${C.p700}, ${C.p500})`,
            color:'#fff', fontSize:16, fontWeight:700, cursor:'pointer',
            boxShadow:`0 4px 16px rgba(30,58,95,0.35)`,
            transition:'all 150ms',
          }}>
            تسجيل الدخول
          </button>

          {/* Info */}
          <div style={{ marginTop:32, padding:16, borderRadius:10,
            background:C.p50, border:`1px solid ${C.p100}` }}>
            <div style={{ fontSize:12, color:C.textSec, textAlign:'right', lineHeight:1.7 }}>
              <strong style={{ color:C.p700 }}>للتجربة: </strong>
              اختر الدور أعلاه ثم اضغط تسجيل الدخول
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// ADMIN DASHBOARD SCREEN
// ════════════════════════════════════════════════════════════════════════════
function AdminDashboardScreen({ onNavigate }) {
  const activities = [
    { user:'أحمد محمد',   action:'سجّل في مادة قواعد البيانات', time:'منذ 5 دقائق',  type:'success' },
    { user:'سارة علي',    action:'رفعت شكوى جديدة',             time:'منذ 12 دقيقة', type:'warning' },
    { user:'د. خالد عمر', action:'أضاف امتحاناً بالذكاء الاصطناعي', time:'منذ 22 دقيقة', type:'ai' },
    { user:'محمد يوسف',   action:'أكمل امتحان الميدترم',        time:'منذ ساعة',     type:'info'    },
    { user:'نور إبراهيم', action:'تم تحديث درجتها في الفيزياء', time:'منذ ساعتين',   type:'success' },
  ];
  const typeColors = { success:C.success, warning:C.warning, ai:C.ai1, info:C.p500 };

  return (
    <MainLayout role="admin" activePage="dashboard" title="لوحة التحكم"
      onNavigate={onNavigate} userName="فراس حاتم" userRole="أدمن" notifCount={3}>

      {/* KPI Row */}
      <div style={{ display:'flex', gap:16, marginBottom:24, flexWrap:'wrap' }}>
        <KPICard title="إجمالي الطلاب" value="1,248" sub="في 6 كليات" trend={8}
          trendLabel="+94 هذا الفصل"
          icon={<Icons.Graduate size={22} color={C.p500}/>} iconBg={C.p50} />
        <KPICard title="الدكاترة" value="87" sub="نشط هذا الفصل" trend={5}
          trendLabel="+4 جدد"
          icon={<Icons.User size={22} color={C.success}/>} iconBg={C.successBg} />
        <KPICard title="المواد الدراسية" value="312" sub="عرض فعّال" trend={12}
          trendLabel="زيادة ملحوظة"
          icon={<Icons.Book size={22} color={C.warning}/>} iconBg={C.warningBg} />
        <KPICard title="الشكاوى المعلقة" value="5" sub="تحتاج مراجعة" trend={-60}
          trendLabel="تحسّن ممتاز"
          icon={<Icons.AlertCircle size={22} color={C.danger}/>} iconBg={C.dangerBg} />
      </div>

      {/* Charts Row */}
      <div style={{ display:'flex', gap:16, marginBottom:24, flexWrap:'wrap' }}>
        {/* Bar Chart */}
        <Card style={{ flex:2, minWidth:300 }} padding={20}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
            <Btn variant="secondary" size="sm" icon={<Icons.Download size={13}/>}>تصدير</Btn>
            <div style={{ fontSize:15, fontWeight:700, color:C.text }}>توزيع الطلاب بالكلية</div>
          </div>
          <BarChart color={C.p500} height={160} data={[
            {label:'هندسة',  value:320},
            {label:'علوم',   value:210},
            {label:'طب',     value:180},
            {label:'أدب',    value:145},
            {label:'تجارة',  value:240},
            {label:'حقوق',   value:153},
          ]} />
        </Card>

        {/* Donuts */}
        <Card style={{ flex:1, minWidth:200 }} padding={20}>
          <div style={{ fontSize:15, fontWeight:700, color:C.text, marginBottom:20, textAlign:'center' }}>
            المؤشرات الدائرية
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:16, alignItems:'center' }}>
            <DonutChart value={78} total={100} color={C.success} size={110} label="معدّل الحضور" />
            <DonutChart value={64} total={100} color={C.p500}    size={110} label="إتمام المهام" />
          </div>
        </Card>
      </div>

      {/* Bottom Row */}
      <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
        {/* Recent Activity */}
        <Card style={{ flex:2, minWidth:300 }} padding={0}>
          <div style={{ padding:'16px 20px', borderBottom:`1px solid ${C.border}`,
            display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <Btn variant="ghost" size="sm">عرض الكل</Btn>
            <div style={{ fontSize:15, fontWeight:700, color:C.text }}>آخر النشاطات</div>
          </div>
          <div style={{ padding:'8px 0' }}>
            {activities.map((a,i)=>(
              <div key={i} style={{
                display:'flex', alignItems:'center', gap:12, padding:'12px 20px',
                borderBottom: i < activities.length-1 ? `1px solid ${C.border}` : 'none',
              }}>
                <div style={{ fontSize:11, color:C.textSec, whiteSpace:'nowrap' }}>{a.time}</div>
                <div style={{ flex:1, textAlign:'right' }}>
                  <span style={{ fontSize:13, fontWeight:600, color:C.text }}>{a.user} </span>
                  <span style={{ fontSize:13, color:C.textSec }}>{a.action}</span>
                </div>
                <div style={{ width:8, height:8, borderRadius:'50%', background:typeColors[a.type], flexShrink:0 }}/>
              </div>
            ))}
          </div>
        </Card>

        {/* Quick Stats */}
        <Card style={{ flex:1, minWidth:200 }} padding={20}>
          <div style={{ fontSize:15, fontWeight:700, color:C.text, marginBottom:16, textAlign:'right' }}>
            إجراءات سريعة
          </div>
          {[
            { icon:<Icons.Plus size={16}/>,     label:'إضافة طالب جديد',    variant:'primary'   },
            { icon:<Icons.Upload size={16}/>,    label:'استيراد طلاب (Excel)',variant:'secondary' },
            { icon:<Icons.Bell size={16}/>,      label:'إرسال إشعار عام',    variant:'outline'   },
            { icon:<Icons.BarChart size={16}/>,  label:'عرض التقارير',       variant:'ghost'     },
            { icon:<Icons.Sparkle size={16}/>,   label:'توليد امتحان ذكي',   variant:'ai'        },
          ].map(a=>(
            <Btn key={a.label} variant={a.variant} size="sm" icon={a.icon}
              style={{ width:'100%', justifyContent:'flex-end', marginBottom:8 }}>
              {a.label}
            </Btn>
          ))}
        </Card>
      </div>
    </MainLayout>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// STUDENTS SCREEN
// ════════════════════════════════════════════════════════════════════════════
function StudentsScreen({ onNavigate }) {
  const [search, setSearch] = React.useState('');
  const [page,   setPage]   = React.useState(1);
  const [modal,  setModal]  = React.useState(false);

  const students = [
    { id:'01HZXY1', name:'أحمد محمد علي',    code:'20210001', dept:'هندسة الحاسوب', year:'الثالثة', group:'A',   gpa:3.7,  status:'active'  },
    { id:'01HZXY2', name:'سارة إبراهيم',     code:'20210045', dept:'علوم البيانات', year:'الثانية', group:'B',   gpa:3.9,  status:'active'  },
    { id:'01HZXY3', name:'محمد يوسف حسن',    code:'20200089', dept:'هندسة الكهرباء',year:'الرابعة', group:'C',   gpa:2.8,  status:'warning' },
    { id:'01HZXY4', name:'نور الدين عبد الله',code:'20210112', dept:'هندسة الحاسوب', year:'الأولى',  group:'A',   gpa:3.5,  status:'active'  },
    { id:'01HZXY5', name:'فاطمة الزهراء',    code:'20190023', dept:'طب',             year:'السادسة', group:'A',   gpa:3.2,  status:'active'  },
    { id:'01HZXY6', name:'عمر خالد سعيد',    code:'20210078', dept:'تجارة',          year:'الثانية', group:'D',   gpa:1.9,  status:'danger'  },
    { id:'01HZXY7', name:'ريم أحمد',         code:'20210099', dept:'أدب عربي',       year:'الثالثة', group:'B',   gpa:3.6,  status:'active'  },
    { id:'01HZXY8', name:'يوسف مصطفى',       code:'20200055', dept:'حقوق',           year:'الرابعة', group:'A',   gpa:3.1,  status:'active'  },
  ];

  const statusMap = {
    active:  <Badge variant="success" dot>نشط</Badge>,
    warning: <Badge variant="warning" dot>تحذير أكاديمي</Badge>,
    danger:  <Badge variant="danger"  dot>خطر إيقاف</Badge>,
  };

  const columns = [
    { key:'actions', label:'إجراءات', render:(_,r)=>(
      <div style={{ display:'flex', gap:4 }}>
        <button style={{ padding:'4px 8px', borderRadius:6, border:`1px solid ${C.border}`,
          background:C.white, cursor:'pointer', display:'flex', alignItems:'center' }}>
          <Icons.Eye size={14} color={C.p500}/>
        </button>
        <button style={{ padding:'4px 8px', borderRadius:6, border:`1px solid ${C.border}`,
          background:C.white, cursor:'pointer', display:'flex', alignItems:'center' }}>
          <Icons.Edit size={14} color={C.textSec}/>
        </button>
        <button style={{ padding:'4px 8px', borderRadius:6, border:`1px solid ${C.dangerBg}`,
          background:C.dangerBg, cursor:'pointer', display:'flex', alignItems:'center' }}>
          <Icons.Trash size={14} color={C.danger}/>
        </button>
      </div>
    )},
    { key:'status',  label:'الحالة',       render: v => statusMap[v] },
    { key:'gpa',     label:'المعدّل',      render: v => (
      <span style={{ fontWeight:700, color: v>=3.5?C.success:v>=2.5?C.p500:C.danger }}>{v.toFixed(1)}</span>
    )},
    { key:'group',   label:'المجموعة' },
    { key:'year',    label:'الفرقة'    },
    { key:'dept',    label:'القسم'     },
    { key:'code',    label:'الكود'     },
    { key:'name',    label:'اسم الطالب', render:(v,r)=>(
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        <span style={{ fontSize:13, fontWeight:600 }}>{v}</span>
        <Avatar name={v} size={28} />
      </div>
    )},
  ];

  const filtered = students.filter(s =>
    s.name.includes(search) || s.code.includes(search) || s.dept.includes(search)
  );

  return (
    <MainLayout role="admin" activePage="students" title="إدارة الطلاب"
      onNavigate={onNavigate} userName="فراس حاتم" userRole="أدمن" notifCount={3}>

      {/* Toolbar */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <div style={{ display:'flex', gap:8 }}>
          <Btn variant="outline" size="sm" icon={<Icons.Download size={14}/>}>تصدير CSV</Btn>
          <Btn variant="secondary" size="sm" icon={<Icons.Upload size={14}/>}>استيراد Excel</Btn>
          <Btn variant="primary" icon={<Icons.Plus size={15}/>} onClick={()=>setModal(true)}>
            إضافة طالب
          </Btn>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <Select placeholder="كل الفرق" options={[
            {value:'1',label:'الأولى'},{value:'2',label:'الثانية'},
            {value:'3',label:'الثالثة'},{value:'4',label:'الرابعة'},
          ]} style={{ width:130 }} />
          <SearchBar placeholder="بحث بالاسم أو الكود..." value={search}
            onChange={e=>setSearch(e.target.value)} style={{ width:260 }} />
        </div>
      </div>

      {/* Stats pills */}
      <div style={{ display:'flex', gap:8, marginBottom:16 }}>
        <Badge variant="navy">الكل: {students.length}</Badge>
        <Badge variant="success" dot>نشط: 6</Badge>
        <Badge variant="warning" dot>تحذير: 1</Badge>
        <Badge variant="danger"  dot>خطر: 1</Badge>
      </div>

      {/* Table */}
      <DataTable columns={columns} rows={filtered} />
      <Pagination page={page} total={248} size={8} onPage={setPage} />

      {/* Add Modal */}
      <Modal open={modal} onClose={()=>setModal(false)} title="إضافة طالب جديد">
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div style={{ display:'flex', gap:12 }}>
            <Input label="الاسم الأول" placeholder="محمد" style={{ flex:1 }} />
            <Input label="اسم العائلة" placeholder="أحمد" style={{ flex:1 }} />
          </div>
          <Input label="البريد الإلكتروني" placeholder="student@unisys.edu"
            icon={<Icons.User size={15}/>} />
          <div style={{ display:'flex', gap:12 }}>
            <Select label="الكلية" placeholder="اختر الكلية" options={[
              {value:'eng',label:'الهندسة'},{value:'sci',label:'العلوم'},
              {value:'med',label:'الطب'},{value:'com',label:'التجارة'},
            ]} style={{ flex:1 }} />
            <Select label="الفرقة" placeholder="اختر الفرقة" options={[
              {value:'1',label:'الأولى'},{value:'2',label:'الثانية'},
              {value:'3',label:'الثالثة'},{value:'4',label:'الرابعة'},
            ]} style={{ flex:1 }} />
          </div>
          <Input label="رقم الهاتف" placeholder="+20 10x xxxx xxxx" />
          <Divider />
          <div style={{ display:'flex', gap:8, justifyContent:'flex-start' }}>
            <Btn variant="secondary" onClick={()=>setModal(false)}>إلغاء</Btn>
            <Btn variant="primary" icon={<Icons.Check size={15}/>}>حفظ الطالب</Btn>
          </div>
        </div>
      </Modal>
    </MainLayout>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// ANALYTICS SCREEN
// ════════════════════════════════════════════════════════════════════════════
function AnalyticsScreen({ onNavigate }) {
  return (
    <MainLayout role="admin" activePage="analytics" title="التحليلات والتقارير"
      onNavigate={onNavigate} userName="فراس حاتم" userRole="أدمن" notifCount={3}>

      <div style={{ display:'flex', gap:16, marginBottom:24, flexWrap:'wrap' }}>
        <KPICard title="متوسط GPA الكلي"    value="3.12"  sub="جميع الكليات"   trend={4}  icon={<Icons.Activity size={22} color={C.p500}/>}   iconBg={C.p50}      />
        <KPICard title="معدّل الحضور"       value="76%"   sub="هذا الفصل"     trend={-2} icon={<Icons.Calendar size={22} color={C.warning}/>}  iconBg={C.warningBg}/>
        <KPICard title="طلاب في خطر"        value="23"    sub="GPA أقل من 2.0" trend={-15} icon={<Icons.AlertCircle size={22} color={C.danger}/>}  iconBg={C.dangerBg} />
        <KPICard title="نسبة الإتمام"       value="88%"   sub="مهام هذا الفصل" trend={6}  icon={<Icons.Check size={22} color={C.success}/>}    iconBg={C.successBg}/>
      </div>

      <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
        <Card style={{ flex:2, minWidth:300 }} padding={20}>
          <div style={{ fontSize:15, fontWeight:700, color:C.text, marginBottom:20, textAlign:'right' }}>
            المعدّل التراكمي بالقسم
          </div>
          <BarChart color={`url(#grad1)`} height={180} data={[
            {label:'هندسة ح',value:31},{label:'علوم',value:35},{label:'طب',value:38},
            {label:'أدب',value:29},{label:'تجارة',value:32},{label:'حقوق',value:33},
          ]} />
          <div style={{ fontSize:11, color:C.textSec, textAlign:'center', marginTop:8 }}>
            * القيم مضروبة × 10 للتوضيح البصري
          </div>
        </Card>

        <div style={{ flex:1, display:'flex', flexDirection:'column', gap:16, minWidth:200 }}>
          <Card padding={20}>
            <div style={{ fontSize:14, fontWeight:700, color:C.text, marginBottom:16, textAlign:'center' }}>
              توزيع الدرجات
            </div>
            <DonutChart value={88} total={100} color={C.success}  size={120} label="A (90–100%)" />
          </Card>
          <Card padding={20}>
            <div style={{ fontSize:14, fontWeight:700, color:C.text, marginBottom:8, textAlign:'right' }}>
              أعلى الأقسام أداءً
            </div>
            {[
              { dept:'طب', gpa:3.8, color:C.success },
              { dept:'علوم', gpa:3.5, color:C.p500 },
              { dept:'هندسة', gpa:3.1, color:C.warning },
            ].map(d=>(
              <div key={d.dept} style={{ marginBottom:10 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                  <span style={{ fontSize:13, fontWeight:700, color:d.color }}>{d.gpa}</span>
                  <span style={{ fontSize:13, color:C.textSec }}>{d.dept}</span>
                </div>
                <div style={{ height:6, borderRadius:3, background:C.border, overflow:'hidden' }}>
                  <div style={{ height:'100%', width:`${(d.gpa/4)*100}%`,
                    background:d.color, borderRadius:3, transition:'width 600ms ease' }}/>
                </div>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// COMPLAINTS SCREEN
// ════════════════════════════════════════════════════════════════════════════
function ComplaintsScreen({ onNavigate }) {
  const complaints = [
    { id:'C001', student:'سارة إبراهيم', type:'أكاديمية', severity:'high',   status:'pending',  ai:'حساس عالي — التوتر والإحباط', date:'2026-05-19' },
    { id:'C002', student:'محمد يوسف',    type:'إدارية',   severity:'medium', status:'resolved', ai:'متوسط — استفسار عن جداول',   date:'2026-05-18' },
    { id:'C003', student:'نور إبراهيم',  type:'تقنية',    severity:'low',    status:'pending',  ai:'منخفض — مشكلة تسجيل دخول',  date:'2026-05-17' },
    { id:'C004', student:'عمر خالد',     type:'أكاديمية', severity:'high',   status:'pending',  ai:'حساس جداً — يهدد بالانسحاب', date:'2026-05-16' },
  ];

  const sevMap = {
    high:   <Badge variant="danger"  dot>عالية</Badge>,
    medium: <Badge variant="warning" dot>متوسطة</Badge>,
    low:    <Badge variant="info"    dot>منخفضة</Badge>,
  };
  const statusMap = {
    pending:  <Badge variant="warning" dot>معلّق</Badge>,
    resolved: <Badge variant="success" dot>محلول</Badge>,
  };

  const columns = [
    { key:'actions', label:'', render:()=>(
      <div style={{ display:'flex', gap:4 }}>
        <Btn variant="primary" size="sm">حل الشكوى</Btn>
        <Btn variant="secondary" size="sm" icon={<Icons.Eye size={13}/>}>عرض</Btn>
      </div>
    )},
    { key:'ai',       label:'تحليل الذكاء الاصطناعي', render:v=>(
      <span style={{ fontSize:12, color:C.textSec, display:'flex', alignItems:'center', gap:4 }}>
        <Icons.Sparkle size={12} color={C.ai1}/>{v}
      </span>
    )},
    { key:'status',   label:'الحالة',     render: v => statusMap[v]  },
    { key:'severity', label:'الخطورة',    render: v => sevMap[v]     },
    { key:'type',     label:'النوع'       },
    { key:'date',     label:'التاريخ'     },
    { key:'student',  label:'الطالب'      },
    { key:'id',       label:'#'           },
  ];

  return (
    <MainLayout role="admin" activePage="complaints" title="إدارة الشكاوى"
      onNavigate={onNavigate} userName="فراس حاتم" userRole="أدمن" notifCount={5}>

      <div style={{ display:'flex', gap:16, marginBottom:24, flexWrap:'wrap' }}>
        <KPICard title="شكاوى معلقة" value="5" icon={<Icons.AlertCircle size={22} color={C.danger}/>} iconBg={C.dangerBg} />
        <KPICard title="خطورة عالية" value="2" icon={<Icons.AlertCircle size={22} color={C.warning}/>} iconBg={C.warningBg} />
        <KPICard title="محلولة هذا الشهر" value="18" trend={25} icon={<Icons.Check size={22} color={C.success}/>} iconBg={C.successBg} />
      </div>

      <Card padding={0}>
        <div style={{ padding:'16px 20px', borderBottom:`1px solid ${C.border}`,
          display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div style={{ display:'flex', gap:8 }}>
            <Badge variant="navy">الكل</Badge>
            <Badge variant="danger" dot>عالية الخطورة: 2</Badge>
            <Badge variant="ai"><Icons.Sparkle size={11}/> مُحلَّل بالذكاء الاصطناعي</Badge>
          </div>
          <div style={{ fontSize:15, fontWeight:700, color:C.text }}>جميع الشكاوى</div>
        </div>
        <div style={{ padding:16 }}>
          <DataTable columns={columns} rows={complaints} />
        </div>
      </Card>
    </MainLayout>
  );
}

// Export
window.LoginScreen          = LoginScreen;
window.AdminDashboardScreen = AdminDashboardScreen;
window.StudentsScreen       = StudentsScreen;
window.AnalyticsScreen      = AnalyticsScreen;
window.ComplaintsScreen     = ComplaintsScreen;
