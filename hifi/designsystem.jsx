// ── Design System Showcase Screen ────────────────────────────────────────────

function DesignSystemScreen() {
  const palette = [
    { name:'Primary 950', hex:'#060d14' },
    { name:'Primary 900', hex:'#0d1b2a' },
    { name:'Primary 700', hex:'#1e3a5f' },
    { name:'Primary 500', hex:'#2e86ab' },
    { name:'Primary 300', hex:'#7fc0da' },
    { name:'Primary 100', hex:'#d6e8f7' },
    { name:'Primary 50',  hex:'#edf5fb' },
  ];
  const semantic = [
    { name:'Success',  hex:C.success,  bg:C.successBg  },
    { name:'Warning',  hex:C.warning,  bg:C.warningBg  },
    { name:'Danger',   hex:C.danger,   bg:C.dangerBg   },
    { name:'Info',     hex:C.info,     bg:C.infoBg     },
    { name:'AI From',  hex:C.ai1,      bg:'#ede9fe'    },
    { name:'AI To',    hex:C.ai2,      bg:C.p100       },
  ];

  return (
    <div style={{ minHeight:'100vh', background:C.surface, padding:40, fontFamily:'inherit' }}>
      {/* Header */}
      <div style={{ marginBottom:40 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:8 }}>
          <div style={{ width:48, height:48, borderRadius:12,
            background:`linear-gradient(135deg,${C.p500},${C.ai1})`,
            display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Icons.Graduate size={26} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize:28, fontWeight:900, color:C.text }}>UniSys Design System</h1>
            <p style={{ color:C.textSec, fontSize:14 }}>نظام التصميم — مشروع التخرج</p>
          </div>
        </div>
      </div>

      {/* Colors */}
      <Section title="الألوان الأساسية — Primary Navy">
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          {palette.map(c => (
            <div key={c.hex} style={{ textAlign:'center' }}>
              <div style={{ width:72, height:72, borderRadius:12, background:c.hex,
                marginBottom:6, boxShadow:'0 2px 8px rgba(0,0,0,0.15)' }}/>
              <div style={{ fontSize:11, fontWeight:600, color:C.text }}>{c.name}</div>
              <div style={{ fontSize:10, color:C.textSec, fontFamily:'monospace' }}>{c.hex}</div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="الألوان الدلالية — Semantic Colors">
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          {semantic.map(c => (
            <div key={c.hex} style={{ textAlign:'center' }}>
              <div style={{ width:72, height:72, borderRadius:12, background:c.hex,
                marginBottom:6, boxShadow:'0 2px 8px rgba(0,0,0,0.15)' }}/>
              <div style={{ fontSize:11, fontWeight:600, color:C.text }}>{c.name}</div>
              <div style={{ fontSize:10, color:C.textSec, fontFamily:'monospace' }}>{c.hex}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* Typography */}
      <Section title="الطباعة — Typography">
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {[
            { label:'Heading 2XL — 32px / 900', size:32, weight:900, text:'نظام إدارة جامعي ذكي' },
            { label:'Heading XL — 24px / 700',  size:24, weight:700, text:'لوحة تحكم الأدمن' },
            { label:'Heading LG — 20px / 700',  size:20, weight:700, text:'قائمة الطلاب والدكاترة' },
            { label:'Body MD — 16px / 500',     size:16, weight:500, text:'إدارة المواد الدراسية والفصول' },
            { label:'Body — 14px / 400',        size:14, weight:400, text:'يستطيع الطالب الاطلاع على جدوله الدراسي ونتائج امتحاناته' },
            { label:'Caption — 12px / 400',     size:12, weight:400, text:'آخر تحديث: 19 مايو 2026' },
          ].map(t => (
            <div key={t.size+t.weight} style={{ display:'flex', alignItems:'baseline',
              gap:16, borderBottom:`1px solid ${C.border}`, paddingBottom:10 }}>
              <span style={{ fontSize:11, color:C.textMute, width:220, flexShrink:0,
                fontFamily:'monospace' }}>{t.label}</span>
              <span style={{ fontSize:t.size, fontWeight:t.weight, color:C.text }}>{t.text}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* Buttons */}
      <Section title="الأزرار — Buttons">
        <div style={{ display:'flex', flexWrap:'wrap', gap:10, marginBottom:16 }}>
          <Btn variant="primary">زر رئيسي</Btn>
          <Btn variant="secondary">ثانوي</Btn>
          <Btn variant="outline">مُحدَّد</Btn>
          <Btn variant="ghost">شفاف</Btn>
          <Btn variant="danger">حذف</Btn>
          <Btn variant="ai" icon={<Icons.Sparkle size={15}/>}>ذكاء اصطناعي</Btn>
        </div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:10 }}>
          <Btn size="sm" variant="primary">صغير</Btn>
          <Btn size="md" variant="primary">متوسط</Btn>
          <Btn size="lg" variant="primary">كبير</Btn>
          <Btn disabled variant="primary">معطّل</Btn>
          <Btn variant="primary" icon={<Icons.Plus size={15}/>}>إضافة طالب</Btn>
          <Btn variant="secondary" icon={<Icons.Download size={15}/>}>تحميل تقرير</Btn>
        </div>
      </Section>

      {/* Badges */}
      <Section title="الشارات — Badges">
        <div style={{ display:'flex', flexWrap:'wrap', gap:8, alignItems:'center' }}>
          <Badge>افتراضي</Badge>
          <Badge variant="success" dot>ناجح</Badge>
          <Badge variant="warning" dot>قيد الانتظار</Badge>
          <Badge variant="danger"  dot>راسب</Badge>
          <Badge variant="info"    dot>معلق</Badge>
          <Badge variant="navy">أدمن</Badge>
          <Badge variant="ai">ذكاء اصطناعي</Badge>
        </div>
      </Section>

      {/* Inputs */}
      <Section title="حقول الإدخال — Inputs">
        <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
          <Input label="الاسم الكامل" placeholder="أدخل الاسم" style={{ flex:1, minWidth:200 }} />
          <Input label="البريد الإلكتروني" placeholder="example@uni.edu"
            icon={<Icons.User size={15}/>} style={{ flex:1, minWidth:200 }} />
          <Input label="كلمة المرور" type="password" placeholder="••••••••"
            icon={<Icons.Key size={15}/>} style={{ flex:1, minWidth:200 }} />
        </div>
        <div style={{ marginTop:12 }}>
          <SearchBar placeholder="بحث عن طالب أو مادة..." style={{ maxWidth:320 }} />
        </div>
      </Section>

      {/* Cards & KPI */}
      <Section title="بطاقات المؤشرات — KPI Cards">
        <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
          <KPICard title="إجمالي الطلاب" value="1,248" sub="في 6 كليات" trend={8}
            trendLabel="مقارنة بالفصل الماضي"
            icon={<Icons.Graduate size={22} color={C.p500}/>} iconBg={C.p50} />
          <KPICard title="الدكاترة" value="87" sub="في 12 قسم" trend={-3}
            trendLabel="انخفاض طفيف"
            icon={<Icons.User size={22} color={C.success}/>} iconBg={C.successBg} />
          <KPICard title="المواد الدراسية" value="312" sub="فصل حالي"
            icon={<Icons.Book size={22} color={C.warning}/>} iconBg={C.warningBg} />
          <KPICard title="الشكاوى المعلقة" value="5" sub="تحتاج مراجعة" trend={-40}
            trendLabel="تحسن ملحوظ"
            icon={<Icons.AlertCircle size={22} color={C.danger}/>} iconBg={C.dangerBg} />
        </div>
      </Section>

      {/* Charts */}
      <Section title="الرسوم البيانية — Charts">
        <div style={{ display:'flex', gap:24, flexWrap:'wrap' }}>
          <Card style={{ flex:2, minWidth:280 }}>
            <div style={{ fontSize:14, fontWeight:700, color:C.text, marginBottom:16 }}>
              توزيع الطلاب بالقسم
            </div>
            <BarChart color={C.p500} data={[
              {label:'هندسة',value:320},{label:'علوم',value:210},{label:'طب',value:180},
              {label:'أدب',value:145},{label:'تجارة',value:240},{label:'حقوق',value:153},
            ]} />
          </Card>
          <Card style={{ flex:1, minWidth:180, display:'flex', flexDirection:'column',
            alignItems:'center', justifyContent:'center', gap:16 }}>
            <div style={{ fontSize:14, fontWeight:700, color:C.text }}>نسبة الحضور</div>
            <DonutChart value={78} total={100} color={C.success} size={130} />
            <DonutChart value={62} total={100} color={C.warning} size={130} label="إتمام المهام" />
          </Card>
        </div>
      </Section>

      {/* Toasts */}
      <Section title="التنبيهات — Toasts">
        <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
          <Toast message="تم حفظ البيانات بنجاح" variant="success" />
          <Toast message="حدث خطأ، حاول مرة أخرى" variant="danger" />
          <Toast message="لديك 3 إشعارات جديدة" variant="info" />
        </div>
      </Section>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom:36 }}>
      <div style={{ fontSize:16, fontWeight:700, color:C.text, marginBottom:16,
        display:'flex', alignItems:'center', gap:8 }}>
        <div style={{ width:4, height:18, background:`linear-gradient(${C.p500},${C.ai1})`,
          borderRadius:2 }}/>
        {title}
      </div>
      <Card padding={20}>{children}</Card>
    </div>
  );
}

window.DesignSystemScreen = DesignSystemScreen;
