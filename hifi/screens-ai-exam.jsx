// ── AI Chat · Exam Taking · Schedule · Doctor Dashboard · Notifications ──────

// ════════════════════════════════════════════════════════════════════════════
// AI CHAT SCREEN (Student)
// ════════════════════════════════════════════════════════════════════════════
function AIChatScreen({ onNavigate }) {
  const [input, setInput] = React.useState('');
  const [messages, setMessages] = React.useState([
    {
      role:'assistant',
      text:'أهلاً بك! أنا مساعدك الذكي في UniSys 🎓\nيمكنني مساعدتك في معرفة:\n• جدولك الدراسي ومواعيد الامتحانات\n• معدلك التراكمي والدرجات\n• المواد المسجّلة والمتطلبات\n• تقديم الشكاوى\n\nكيف يمكنني مساعدتك اليوم؟',
      time:'9:00 ص',
    },
    {
      role:'user',
      text:'ما هو معدلي التراكمي الحالي؟',
      time:'9:02 ص',
    },
    {
      role:'assistant',
      text:'بناءً على بيانات الفصل الحالي:\n\n📊 **معدلك التراكمي: 3.7 / 4.0**\n\nتفاصيل الفصل الحالي:\n• قواعد البيانات: A (95)\n• هندسة البرمجيات: A- (91)\n• الشبكات الحاسوبية: B+ (87)\n• الذكاء الاصطناعي: A (93)\n\nأداؤك ممتاز! تحتل المرتبة الثالثة في دفعتك 🌟',
      time:'9:02 ص',
    },
    {
      role:'user',
      text:'متى امتحان مادة الشبكات؟',
      time:'9:05 ص',
    },
    {
      role:'assistant',
      text:'📅 **امتحان الشبكات الحاسوبية**\n\n• التاريخ: الأحد 25 مايو 2026\n• الوقت: 10:00 صباحاً\n• القاعة: D-201، مبنى التقنية\n• المدة: ساعتان\n\n⚠️ تبقّى 6 أيام — لا تنسَ مراجعة فصل OSI Model!\n\nهل تريد مني إنشاء خطة مذاكرة لهذه الأيام الستة؟',
      time:'9:05 ص',
    },
  ]);

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages(m => [...m, { role:'user', text:input, time:'الآن' }]);
    setInput('');
    setTimeout(()=>{
      setMessages(m => [...m, {
        role:'assistant',
        text:'جاري معالجة سؤالك... سأجيبك خلال لحظات 🤖',
        time:'الآن', typing:true,
      }]);
    }, 600);
  };

  const suggestions = ['ما مواعيد امتحاناتي؟','أعطني ملخص موادي','اريد تقديم شكوى','الجدول الدراسي'];

  return (
    <div style={{ display:'flex', flexDirection:'row-reverse', height:'100vh', background:C.surface }}>
      <Sidebar role="student" active="ai-chat" onNavigate={onNavigate} />
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
        {/* Chat Topbar */}
        <div style={{
          height:64, background:C.white, borderBottom:`1px solid ${C.border}`,
          display:'flex', alignItems:'center', padding:'0 24px',
          justifyContent:'space-between', flexShrink:0,
          boxShadow:'0 1px 4px rgba(0,0,0,.05)',
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <Btn variant="ghost" size="sm" icon={<Icons.Refresh size={15}/>}>محادثة جديدة</Btn>
            <Btn variant="ghost" size="sm" icon={<Icons.Clock size={15}/>}>السجل</Btn>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ textAlign:'right' }}>
              <div style={{ fontSize:15, fontWeight:700, color:C.text }}>المساعد الذكي</div>
              <div style={{ fontSize:11, color:C.success, display:'flex', alignItems:'center',
                gap:4, justifyContent:'flex-end' }}>
                <div style={{ width:6,height:6,borderRadius:'50%',background:C.success }}/>
                متصل الآن
              </div>
            </div>
            <div style={{
              width:40, height:40, borderRadius:10,
              background:`linear-gradient(135deg,${C.ai1},${C.ai2})`,
              display:'flex', alignItems:'center', justifyContent:'center',
            }}>
              <Icons.Sparkle size={20} color="#fff" />
            </div>
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex:1, overflowY:'auto', padding:'20px 24px', display:'flex',
          flexDirection:'column', gap:16 }}>
          {messages.map((msg, i) => (
            <div key={i} style={{
              display:'flex', gap:10,
              flexDirection: msg.role==='user' ? 'row' : 'row-reverse',
              alignItems:'flex-end',
            }}>
              {/* Avatar */}
              {msg.role==='assistant' ? (
                <div style={{
                  width:34, height:34, borderRadius:9, flexShrink:0,
                  background:`linear-gradient(135deg,${C.ai1},${C.ai2})`,
                  display:'flex', alignItems:'center', justifyContent:'center',
                }}>
                  <Icons.Sparkle size={16} color="#fff" />
                </div>
              ) : (
                <Avatar name="أحمد محمد" size={34} />
              )}

              {/* Bubble */}
              <div style={{
                maxWidth:'65%',
                padding:'12px 16px',
                borderRadius: msg.role==='user'
                  ? '16px 4px 16px 16px'
                  : '4px 16px 16px 16px',
                background: msg.role==='user'
                  ? `linear-gradient(135deg,${C.p700},${C.p500})`
                  : C.white,
                color: msg.role==='user' ? '#fff' : C.text,
                fontSize:14, lineHeight:1.7,
                boxShadow: msg.role==='user'
                  ? `0 2px 8px rgba(30,58,95,0.3)`
                  : `0 1px 4px rgba(0,0,0,.08)`,
                border: msg.role==='assistant'
                  ? `1px solid ${C.border}`
                  : 'none',
                whiteSpace:'pre-line',
                // AI border glow
                ...(msg.role==='assistant' ? {
                  borderTop:`2px solid ${C.ai1}22`,
                } : {}),
              }}>
                {msg.text}
                {msg.typing && (
                  <span style={{ display:'inline-flex', gap:4, marginRight:6 }}>
                    {[0,1,2].map(i=>(
                      <span key={i} style={{
                        width:6,height:6,borderRadius:'50%',background:C.textSec,
                        display:'inline-block', animation:`bounce 1s ${i*0.15}s infinite`,
                      }}/>
                    ))}
                  </span>
                )}
              </div>

              <div style={{ fontSize:10, color:C.textSec, marginBottom:2, flexShrink:0 }}>
                {msg.time}
              </div>
            </div>
          ))}
        </div>

        {/* Suggestions */}
        <div style={{ padding:'8px 24px 0', display:'flex', gap:6, flexWrap:'wrap',
          justifyContent:'flex-end' }}>
          {suggestions.map(s=>(
            <button key={s} onClick={()=>setInput(s)} style={{
              padding:'5px 12px', borderRadius:16, border:`1px solid ${C.border}`,
              background:C.white, fontSize:12, color:C.textSec, cursor:'pointer',
              transition:'all 150ms',
            }}
              onMouseEnter={e=>{e.target.style.borderColor=C.p500;e.target.style.color=C.p500;}}
              onMouseLeave={e=>{e.target.style.borderColor=C.border;e.target.style.color=C.textSec;}}>
              {s}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div style={{
          padding:'12px 24px 20px', background:C.white,
          borderTop:`1px solid ${C.border}`, flexShrink:0,
        }}>
          <div style={{
            display:'flex', gap:10, alignItems:'flex-end',
            background:C.surface, borderRadius:14, padding:'8px 12px',
            border:`1.5px solid ${C.border}`,
          }}>
            <button onClick={handleSend} style={{
              width:38, height:38, borderRadius:10, flexShrink:0,
              background:`linear-gradient(135deg,${C.ai1},${C.ai2})`,
              border:'none', cursor:'pointer', display:'flex',
              alignItems:'center', justifyContent:'center',
              boxShadow:'0 2px 8px rgba(124,58,237,0.3)',
            }}>
              <Icons.Send size={16} color="#fff" />
            </button>
            <input value={input} onChange={e=>setInput(e.target.value)}
              onKeyDown={e=>e.key==='Enter'&&handleSend()}
              placeholder="اسألني أي شيء عن دراستك..."
              style={{
                flex:1, background:'transparent', border:'none', outline:'none',
                fontSize:14, fontFamily:'inherit', color:C.text, textAlign:'right',
                resize:'none', minHeight:22,
              }} />
          </div>
          <div style={{ textAlign:'center', marginTop:6, fontSize:11, color:C.textSec }}>
            مدعوم بـ Claude AI · يعمل باللغة العربية
          </div>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// EXAM TAKING SCREEN (Student)
// ════════════════════════════════════════════════════════════════════════════
function ExamTakingScreen() {
  const [current,   setCurrent]   = React.useState(0);
  const [answers,   setAnswers]   = React.useState({});
  const [timeLeft,  setTimeLeft]  = React.useState(7200); // 2h in sec
  const [submitted, setSubmitted] = React.useState(false);

  React.useEffect(()=>{
    if (submitted || timeLeft <= 0) return;
    const t = setInterval(()=>setTimeLeft(s=>s-1), 1000);
    return ()=>clearInterval(t);
  }, [submitted, timeLeft]);

  const fmt = s => `${String(Math.floor(s/3600)).padStart(2,'0')}:${String(Math.floor((s%3600)/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
  const urgent = timeLeft < 300;

  const questions = [
    {
      q:'في نموذج OSI، أيّ طبقة مسؤولة عن التوجيه (Routing)؟',
      opts:['طبقة الربط (Data Link)','طبقة الشبكة (Network)','طبقة النقل (Transport)','طبقة التطبيق (Application)'],
      correct:1,
    },
    {
      q:'ما الفرق الرئيسي بين TCP و UDP؟',
      opts:['TCP أسرع من UDP','UDP يضمن وصول البيانات بينما TCP لا يضمن','TCP يضمن الوصول بينما UDP لا يضمن','لا فرق بينهما'],
      correct:2,
    },
    {
      q:'ما هو الـ Subnet Mask الافتراضي لشبكة Class C؟',
      opts:['255.0.0.0','255.255.0.0','255.255.255.0','255.255.255.255'],
      correct:2,
    },
    {
      q:'أيّ بروتوكول يُستخدم لتحويل عناوين IP إلى عناوين MAC؟',
      opts:['DNS','DHCP','ARP','ICMP'],
      correct:2,
    },
    {
      q:'ما هو الـ Port الافتراضي لبروتوكول HTTPS؟',
      opts:['80','21','443','8080'],
      correct:2,
    },
  ];

  const q = questions[current];
  const answered = Object.keys(answers).length;
  const progress = (answered / questions.length) * 100;

  if (submitted) return (
    <div style={{ height:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
      background:`linear-gradient(145deg,${C.p900},${C.p700})`, flexDirection:'column', gap:24 }}>
      <div style={{ width:80,height:80,borderRadius:'50%',background:C.success,
        display:'flex',alignItems:'center',justifyContent:'center',
        boxShadow:`0 0 40px ${C.success}66` }}>
        <Icons.Check size={40} color="#fff" />
      </div>
      <div style={{ color:'#fff', textAlign:'center' }}>
        <div style={{ fontSize:28, fontWeight:900, marginBottom:8 }}>تم تسليم الامتحان!</div>
        <div style={{ fontSize:15, opacity:0.7 }}>أجبت على {answered} من {questions.length} أسئلة</div>
        <div style={{ fontSize:13, opacity:0.5, marginTop:4 }}>ستظهر نتيجتك خلال 24 ساعة</div>
      </div>
    </div>
  );

  return (
    <div style={{ height:'100vh', background:C.surface, display:'flex', flexDirection:'column',
      fontFamily:'inherit' }}>
      {/* Exam Header */}
      <div style={{
        background:C.white, borderBottom:`1px solid ${C.border}`, padding:'0 32px',
        height:64, display:'flex', alignItems:'center', justifyContent:'space-between',
        boxShadow:'0 2px 8px rgba(0,0,0,.06)', flexShrink:0,
      }}>
        {/* Timer */}
        <div style={{
          display:'flex', alignItems:'center', gap:8, padding:'6px 16px',
          borderRadius:8, background: urgent ? C.dangerBg : C.p50,
          border:`1.5px solid ${urgent ? C.danger : C.p200}`,
        }}>
          <Icons.Clock size={16} color={urgent ? C.danger : C.p500} />
          <span style={{ fontSize:20, fontWeight:900, fontFamily:'monospace',
            color: urgent ? C.danger : C.p700, letterSpacing:'0.05em' }}>
            {fmt(timeLeft)}
          </span>
        </div>

        {/* Center: Title */}
        <div style={{ textAlign:'center' }}>
          <div style={{ fontSize:16, fontWeight:700, color:C.text }}>الشبكات الحاسوبية</div>
          <div style={{ fontSize:12, color:C.textSec }}>امتحان نصفي · {questions.length} أسئلة · درجة 50</div>
        </div>

        {/* Progress */}
        <div style={{ textAlign:'left', minWidth:120 }}>
          <div style={{ fontSize:12, color:C.textSec, marginBottom:4 }}>
            {answered} / {questions.length} أُجيب عليها
          </div>
          <div style={{ height:6, borderRadius:3, background:C.border, overflow:'hidden', width:120 }}>
            <div style={{ height:'100%', width:`${progress}%`, borderRadius:3,
              background:`linear-gradient(90deg,${C.p500},${C.ai1})`,
              transition:'width 300ms ease' }}/>
          </div>
        </div>
      </div>

      <div style={{ flex:1, display:'flex', overflow:'hidden' }}>
        {/* Question Grid Sidebar */}
        <div style={{
          width:200, background:C.white, borderLeft:`1px solid ${C.border}`,
          padding:16, overflowY:'auto', flexShrink:0,
        }}>
          <div style={{ fontSize:13, fontWeight:700, color:C.text, marginBottom:12,
            textAlign:'right' }}>خريطة الأسئلة</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:6 }}>
            {questions.map((_,i)=>(
              <button key={i} onClick={()=>setCurrent(i)} style={{
                width:36, height:36, borderRadius:8,
                border:`2px solid ${i===current ? C.p500 : answers[i]!==undefined ? C.success : C.border}`,
                background: i===current ? C.p50 : answers[i]!==undefined ? C.successBg : C.white,
                color: i===current ? C.p700 : answers[i]!==undefined ? C.successText : C.textSec,
                fontSize:13, fontWeight:700, cursor:'pointer', transition:'all 150ms',
              }}>{i+1}</button>
            ))}
          </div>
          <Divider style={{ margin:'16px 0' }} />
          <div style={{ fontSize:11, color:C.textSec, lineHeight:1.8, textAlign:'right' }}>
            <div style={{ display:'flex', gap:6, alignItems:'center', marginBottom:4 }}>
              <div style={{ width:12,height:12,borderRadius:3,background:C.successBg,border:`1px solid ${C.success}` }}/>
              أُجيب عليه
            </div>
            <div style={{ display:'flex', gap:6, alignItems:'center' }}>
              <div style={{ width:12,height:12,borderRadius:3,background:C.p50,border:`1px solid ${C.p500}` }}/>
              الحالي
            </div>
          </div>
        </div>

        {/* Main Question */}
        <div style={{ flex:1, padding:'32px 48px', overflowY:'auto',
          display:'flex', flexDirection:'column', alignItems:'center' }}>
          <div style={{ width:'100%', maxWidth:680 }}>
            {/* Question Number */}
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
              <Badge variant="navy">سؤال {current+1} من {questions.length}</Badge>
              <Badge variant="info">اختيار من متعدد</Badge>
            </div>

            {/* Question Text */}
            <Card shadow="md" padding={28} style={{ marginBottom:24 }}>
              <div style={{ fontSize:18, fontWeight:700, color:C.text, lineHeight:1.7,
                textAlign:'right' }}>
                {q.q}
              </div>
            </Card>

            {/* Options */}
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {q.opts.map((opt, i) => {
                const selected = answers[current] === i;
                return (
                  <div key={i} onClick={()=>setAnswers(a=>({...a,[current]:i}))}
                    style={{
                      padding:'16px 20px', borderRadius:12, cursor:'pointer',
                      border:`2px solid ${selected ? C.p500 : C.border}`,
                      background: selected ? C.p50 : C.white,
                      display:'flex', alignItems:'center', gap:14,
                      transition:'all 150ms',
                      boxShadow: selected ? `0 0 0 3px ${C.p100}` : 'none',
                    }}
                    onMouseEnter={e=>{ if(!selected) e.currentTarget.style.borderColor=C.p200; }}
                    onMouseLeave={e=>{ if(!selected) e.currentTarget.style.borderColor=C.border; }}>
                    {/* Option Marker */}
                    <div style={{
                      width:28, height:28, borderRadius:'50%', flexShrink:0,
                      border:`2px solid ${selected ? C.p500 : C.borderD}`,
                      background: selected ? C.p700 : 'transparent',
                      display:'flex', alignItems:'center', justifyContent:'center',
                    }}>
                      {selected && <Icons.Check size={14} color="#fff" />}
                      {!selected && <span style={{ fontSize:12, fontWeight:700,
                        color:C.textSec }}>{'ABCD'[i]}</span>}
                    </div>
                    <span style={{ fontSize:15, color: selected ? C.p700 : C.text,
                      fontWeight: selected ? 600 : 400, flex:1, textAlign:'right' }}>
                      {opt}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Navigation */}
            <div style={{ display:'flex', justifyContent:'space-between', marginTop:32 }}>
              <div>
                {current < questions.length-1 && (
                  <Btn variant="primary" icon={<Icons.ChevronL size={15}/>} iconPos="left"
                    onClick={()=>setCurrent(c=>c+1)}>
                    السؤال التالي
                  </Btn>
                )}
                {current === questions.length-1 && (
                  <Btn variant="primary" icon={<Icons.Check size={15}/>}
                    onClick={()=>setSubmitted(true)}>
                    تسليم الامتحان
                  </Btn>
                )}
              </div>
              <Btn variant="secondary" icon={<Icons.ChevronR size={15}/>}
                disabled={current===0} onClick={()=>setCurrent(c=>c-1)}>
                السابق
              </Btn>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// SCHEDULE SCREEN
// ════════════════════════════════════════════════════════════════════════════
function ScheduleScreen({ onNavigate, role='student' }) {
  const days = ['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس'];
  const hours = [8,9,10,11,12,13,14,15,16];
  const courseColors = [C.p700,C.ai1,'#0891b2','#059669','#d97706','#dc2626'];

  const schedule = [
    { day:0, start:8,  end:10, title:'قواعد البيانات',       room:'A-101', prof:'د. سارة علي',   color:courseColors[0] },
    { day:1, start:10, end:12, title:'الشبكات الحاسوبية',    room:'B-205', prof:'د. محمد خالد',  color:courseColors[1] },
    { day:2, start:8,  end:10, title:'هندسة البرمجيات',      room:'C-301', prof:'د. أحمد يوسف',  color:courseColors[2] },
    { day:0, start:12, end:14, title:'الذكاء الاصطناعي',     room:'D-110', prof:'د. نور إبراهيم', color:courseColors[3] },
    { day:3, start:9,  end:11, title:'أمن المعلومات',         room:'A-205', prof:'د. عمر سعيد',   color:courseColors[4] },
    { day:4, start:10, end:12, title:'تطوير الويب',           room:'Lab-3', prof:'د. فاطمة علي',  color:courseColors[5] },
    { day:2, start:14, end:16, title:'الشبكات الحاسوبية',    room:'B-205', prof:'د. محمد خالد',  color:courseColors[1] },
    { day:1, start:14, end:16, title:'قواعد البيانات',        room:'Lab-1', prof:'د. سارة علي',   color:courseColors[0] },
  ];

  const slotH = 70;

  return (
    <MainLayout role={role} activePage={role==='student'?'student-schedule':'doctor-schedule'}
      title="الجدول الدراسي" onNavigate={onNavigate}
      userName={role==='student'?'أحمد محمد':'د. سارة علي'}
      userRole={role==='student'?'طالب':'دكتور'} notifCount={2}>

      <Card padding={0} shadow="md">
        {/* Header */}
        <div style={{
          display:'grid', gridTemplateColumns:`64px repeat(${days.length},1fr)`,
          borderBottom:`2px solid ${C.border}`, background:C.surface,
        }}>
          <div style={{ padding:12 }}/>
          {days.map(d=>(
            <div key={d} style={{ padding:'12px 8px', textAlign:'center',
              fontSize:13, fontWeight:700, color:C.text }}>
              {d}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div style={{ position:'relative', overflowX:'auto' }}>
          <div style={{
            display:'grid',
            gridTemplateColumns:`64px repeat(${days.length},1fr)`,
            minWidth:600,
          }}>
            {/* Time Labels */}
            <div style={{ display:'flex', flexDirection:'column' }}>
              {hours.map(h=>(
                <div key={h} style={{
                  height:slotH, display:'flex', alignItems:'flex-start',
                  justifyContent:'flex-end', padding:'6px 8px 0',
                  borderBottom:`1px solid ${C.border}`,
                }}>
                  <span style={{ fontSize:11, color:C.textSec, fontWeight:500 }}>
                    {h}:00
                  </span>
                </div>
              ))}
            </div>

            {/* Day Columns */}
            {days.map((d,di)=>(
              <div key={d} style={{
                position:'relative', borderRight:`1px solid ${C.border}`,
                minHeight:hours.length*slotH,
              }}>
                {/* Hour lines */}
                {hours.map(h=>(
                  <div key={h} style={{ height:slotH, borderBottom:`1px dashed ${C.border}` }}/>
                ))}

                {/* Course blocks */}
                {schedule.filter(s=>s.day===di).map((s,si)=>(
                  <div key={si} style={{
                    position:'absolute',
                    top:(s.start-hours[0])*slotH+2,
                    height:(s.end-s.start)*slotH-4,
                    left:4, right:4,
                    background:s.color, borderRadius:8,
                    padding:'8px 10px', cursor:'pointer',
                    boxShadow:`0 2px 8px ${s.color}44`,
                    overflow:'hidden',
                  }}>
                    <div style={{ fontSize:12, fontWeight:700, color:'#fff',
                      whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                      {s.title}
                    </div>
                    <div style={{ fontSize:10, color:'rgba(255,255,255,0.8)', marginTop:2 }}>
                      {s.prof}
                    </div>
                    <div style={{ fontSize:10, color:'rgba(255,255,255,0.7)', marginTop:1 }}>
                      🏛 {s.room}
                    </div>
                    <div style={{ fontSize:10, color:'rgba(255,255,255,0.7)' }}>
                      {s.start}:00 – {s.end}:00
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Legend */}
      <div style={{ display:'flex', gap:10, marginTop:16, flexWrap:'wrap' }}>
        {[...new Set(schedule.map(s=>s.title))].map((t,i)=>(
          <div key={t} style={{ display:'flex', alignItems:'center', gap:6, fontSize:12,
            color:C.textSec }}>
            <div style={{ width:10,height:10,borderRadius:3,background:courseColors[i%courseColors.length] }}/>
            {t}
          </div>
        ))}
      </div>
    </MainLayout>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// DOCTOR COURSE DETAILS SCREEN
// ════════════════════════════════════════════════════════════════════════════
function DoctorCourseScreen({ onNavigate }) {
  const [tab, setTab] = React.useState('students');

  const tabs = [
    { id:'students', label:'الطلاب' },
    { id:'grades',   label:'الدرجات' },
    { id:'exams',    label:'الامتحانات' },
    { id:'materials',label:'المواد التعليمية' },
    { id:'attendance',label:'الحضور' },
  ];

  const students = [
    { name:'أحمد محمد',   mid:18, works:17, final:0,  platform:9, status:'active'  },
    { name:'سارة إبراهيم',mid:20, works:19, final:0,  platform:10,status:'active'  },
    { name:'محمد يوسف',   mid:14, works:12, final:0,  platform:7, status:'warning' },
    { name:'نور الدين',   mid:17, works:16, final:0,  platform:8, status:'active'  },
  ];

  const columns = [
    { key:'actions', label:'', render:()=>(
      <Btn variant="ghost" size="sm" icon={<Icons.Edit size={13}/>}>تعديل</Btn>
    )},
    { key:'platform', label:'منصة (10)' },
    { key:'final',    label:'نهائي (50)', render:v=>(
      <Badge variant={v===0?'warning':'success'}>{v===0?'لم يُرصد':v}</Badge>
    )},
    { key:'works',  label:'أعمال (20)' },
    { key:'mid',    label:'ميدترم (20)' },
    { key:'name',   label:'اسم الطالب', render:(v)=>(
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        <span style={{ fontWeight:600 }}>{v}</span>
        <Avatar name={v} size={28} />
      </div>
    )},
  ];

  return (
    <MainLayout role="doctor" activePage="my-courses" title="قواعد البيانات — CS301"
      onNavigate={onNavigate} userName="د. سارة علي" userRole="دكتور" notifCount={1}>

      {/* Course Hero */}
      <Card padding={0} style={{ marginBottom:20, overflow:'hidden' }}>
        <div style={{ height:6, background:`linear-gradient(90deg,${C.p700},${C.p500},${C.ai1})` }}/>
        <div style={{ padding:'20px 24px', display:'flex', justifyContent:'space-between',
          alignItems:'center', flexWrap:'wrap', gap:12 }}>
          <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
            <Badge variant="navy">CS301</Badge>
            <Badge variant="info" dot>الفصل الثاني 2025–2026</Badge>
            <Badge variant="success" dot>48 طالب مسجّل</Badge>
            <Badge variant="ai"><Icons.Sparkle size={11}/> AI متاح</Badge>
          </div>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontSize:20, fontWeight:800, color:C.text }}>قواعد البيانات</div>
            <div style={{ fontSize:13, color:C.textSec }}>دفعة 2022 · قسم هندسة الحاسوب</div>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div style={{ display:'flex', gap:16, marginBottom:20, flexWrap:'wrap' }}>
        <KPICard title="متوسط الدرجات" value="17.2/20" icon={<Icons.Activity size={20} color={C.p500}/>} iconBg={C.p50} />
        <KPICard title="معدّل الحضور"  value="82%"     icon={<Icons.Calendar size={20} color={C.success}/>} iconBg={C.successBg} />
        <KPICard title="مهام مرسلة"    value="38/48"   icon={<Icons.Clipboard size={20} color={C.warning}/>} iconBg={C.warningBg} />
        <KPICard title="طلاب في خطر"   value="3"       icon={<Icons.AlertCircle size={20} color={C.danger}/>} iconBg={C.dangerBg} />
      </div>

      {/* Tabs */}
      <Card padding={0}>
        <div style={{ display:'flex', borderBottom:`1px solid ${C.border}`, padding:'0 20px' }}>
          {tabs.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{
              padding:'14px 16px', border:'none', background:'transparent',
              fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit',
              color: tab===t.id ? C.p700 : C.textSec,
              borderBottom: tab===t.id ? `2px solid ${C.p500}` : '2px solid transparent',
              transition:'all 150ms',
            }}>
              {t.label}
            </button>
          ))}
          <div style={{ flex:1 }}/>
          {tab==='exams' && (
            <div style={{ display:'flex', gap:8, alignItems:'center', padding:'8px 0' }}>
              <Btn variant="ai" size="sm" icon={<Icons.Sparkle size={13}/>}>
                توليد امتحان بالذكاء الاصطناعي
              </Btn>
              <Btn variant="primary" size="sm" icon={<Icons.Plus size={13}/>}>
                امتحان يدوي
              </Btn>
            </div>
          )}
        </div>
        <div style={{ padding:20 }}>
          {tab==='students' && (
            <>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:16 }}>
                <Btn variant="secondary" size="sm" icon={<Icons.Download size={13}/>}>تصدير الدرجات</Btn>
                <SearchBar placeholder="بحث عن طالب..." style={{ width:240 }} />
              </div>
              <DataTable columns={columns} rows={students} />
            </>
          )}
          {tab==='grades' && (
            <div style={{ textAlign:'center', padding:40, color:C.textSec }}>
              <Icons.BarChart size={48} color={C.border} />
              <div style={{ marginTop:12, fontSize:14 }}>رصد الدرجات النهائية سيُفتح بعد الامتحان</div>
            </div>
          )}
          {tab==='exams' && (
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {[
                { name:'امتحان ميدترم', date:'20 مار 2026', status:'منتهي',  score:'/ 20' },
                { name:'امتحان نهائي',  date:'25 مايو 2026', status:'قادم',  score:'/ 50' },
              ].map(e=>(
                <div key={e.name} style={{ display:'flex', alignItems:'center', gap:12,
                  padding:16, borderRadius:10, border:`1px solid ${C.border}`,
                  background:C.surface, justifyContent:'space-between' }}>
                  <div style={{ display:'flex', gap:8 }}>
                    <Btn variant="secondary" size="sm">عرض التفاصيل</Btn>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                    <Badge variant={e.status==='منتهي'?'success':'warning'} dot>{e.status}</Badge>
                    <span style={{ fontSize:12, color:C.textSec }}>{e.date}</span>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontSize:14, fontWeight:700, color:C.text }}>{e.name}</div>
                    <div style={{ fontSize:12, color:C.textSec }}>الدرجة {e.score}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {tab==='materials' && (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {[
                { name:'Chapter 1 - مقدمة في قواعد البيانات.pdf', size:'2.4 MB', date:'10 فبراير' },
                { name:'Chapter 2 - نموذج ER.pdf',                 size:'3.1 MB', date:'17 فبراير' },
                { name:'Lab 1 - SQL أساسيات.zip',                  size:'1.8 MB', date:'24 فبراير' },
                { name:'Lecture 5 - Normalization.pptx',           size:'5.2 MB', date:'3 مارس'    },
              ].map(f=>(
                <div key={f.name} style={{ display:'flex', alignItems:'center', gap:12,
                  padding:12, borderRadius:8, border:`1px solid ${C.border}`, background:C.surface,
                  justifyContent:'space-between' }}>
                  <div style={{ display:'flex', gap:6 }}>
                    <Btn variant="ghost" size="sm" icon={<Icons.Download size={13}/>}>تحميل</Btn>
                    <Btn variant="ghost" size="sm" icon={<Icons.Trash size={13}/>} style={{ color:C.danger }}>حذف</Btn>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <span style={{ fontSize:11, color:C.textSec }}>{f.size}</span>
                    <span style={{ fontSize:11, color:C.textSec }}>{f.date}</span>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{ fontSize:13, color:C.text }}>{f.name}</span>
                    <Icons.FileText size={18} color={C.p500} />
                  </div>
                </div>
              ))}
              <Btn variant="outline" icon={<Icons.Upload size={15}/>} style={{ alignSelf:'flex-end' }}>
                رفع ملف جديد
              </Btn>
            </div>
          )}
          {tab==='attendance' && (
            <div style={{ textAlign:'center', padding:40, color:C.textSec }}>
              <Icons.Calendar size={48} color={C.border} />
              <div style={{ marginTop:12, fontSize:14 }}>اضغط "إضافة جلسة" لتسجيل الحضور</div>
              <Btn variant="primary" icon={<Icons.Plus size={15}/>} style={{ margin:'16px auto 0' }}>
                إضافة جلسة حضور
              </Btn>
            </div>
          )}
        </div>
      </Card>
    </MainLayout>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// NOTIFICATIONS SCREEN
// ════════════════════════════════════════════════════════════════════════════
function NotificationsScreen({ onNavigate }) {
  const notifs = [
    { title:'تذكير: امتحان الشبكات',       body:'غداً الساعة 10 ص في قاعة B-205',       time:'منذ 5 دقائق',  type:'warning', read:false },
    { title:'تم رصد درجة جديدة',           body:'قواعد البيانات — ميدترم: 18/20',        time:'منذ ساعة',     type:'success', read:false },
    { title:'شكوى جديدة برتبة عالية',     body:'الطالب عمر خالد — تحتاج مراجعة عاجلة', time:'منذ 3 ساعات',  type:'danger',  read:false },
    { title:'تمت الموافقة على التسجيل',   body:'مادة الذكاء الاصطناعي — CS401',         time:'منذ يوم',      type:'info',    read:true  },
    { title:'إعلان: موعد امتحانات الفصل', body:'ابتداءً من 22 مايو 2026',              time:'منذ يومين',    type:'info',    read:true  },
  ];

  const typeIcon = {
    warning: <Icons.Clock size={18} color={C.warning} />,
    success: <Icons.Check size={18} color={C.success} />,
    danger:  <Icons.AlertCircle size={18} color={C.danger} />,
    info:    <Icons.Bell size={18} color={C.p500} />,
  };
  const typeBg = { warning:C.warningBg, success:C.successBg, danger:C.dangerBg, info:C.infoBg };

  return (
    <MainLayout role="admin" activePage="notifications" title="الإشعارات"
      onNavigate={onNavigate} userName="فراس حاتم" userRole="أدمن" notifCount={3}>

      {/* Send Panel */}
      <Card padding={20} style={{ marginBottom:20 }}>
        <div style={{ fontSize:15, fontWeight:700, color:C.text, marginBottom:16,
          textAlign:'right', display:'flex', alignItems:'center', gap:8 }}>
          <Icons.Bell size={18} color={C.p500} />
          إرسال إشعار جديد
        </div>
        <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
          <Select placeholder="استهداف" style={{ flex:1, minWidth:160 }} options={[
            {value:'all',label:'جميع الطلاب'},{value:'dept',label:'قسم محدد'},
            {value:'year',label:'فرقة محددة'},{value:'course',label:'مادة محددة'},
          ]} />
          <Input placeholder="عنوان الإشعار..." style={{ flex:2, minWidth:200 }} />
          <Btn variant="primary" icon={<Icons.Send size={14}/>}>إرسال الآن</Btn>
        </div>
      </Card>

      {/* Notifications List */}
      <Card padding={0}>
        <div style={{ padding:'16px 20px', borderBottom:`1px solid ${C.border}`,
          display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <Btn variant="ghost" size="sm">تحديد الكل كمقروء</Btn>
          <div style={{ fontSize:15, fontWeight:700, color:C.text }}>
            الإشعارات ({notifs.filter(n=>!n.read).length} غير مقروء)
          </div>
        </div>
        {notifs.map((n,i)=>(
          <div key={i} style={{
            display:'flex', alignItems:'flex-start', gap:14, padding:'16px 20px',
            borderBottom: i<notifs.length-1?`1px solid ${C.border}`:'none',
            background: !n.read ? `${typeBg[n.type]}44` : C.white,
            cursor:'pointer', transition:'background 150ms',
          }}>
            <div style={{ fontSize:12, color:C.textSec, whiteSpace:'nowrap', marginTop:2 }}>
              {n.time}
            </div>
            <div style={{ flex:1, textAlign:'right' }}>
              <div style={{ fontSize:14, fontWeight: n.read?500:700, color:C.text,
                marginBottom:3 }}>{n.title}</div>
              <div style={{ fontSize:13, color:C.textSec }}>{n.body}</div>
            </div>
            <div style={{ width:36, height:36, borderRadius:9, background:typeBg[n.type],
              display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              {typeIcon[n.type]}
            </div>
            {!n.read && <div style={{ width:8,height:8,borderRadius:'50%',
              background:C.danger,flexShrink:0,marginTop:6 }}/>}
          </div>
        ))}
      </Card>
    </MainLayout>
  );
}

// Export all
window.AIChatScreen       = AIChatScreen;
window.ExamTakingScreen   = ExamTakingScreen;
window.ScheduleScreen     = ScheduleScreen;
window.DoctorCourseScreen = DoctorCourseScreen;
window.NotificationsScreen= NotificationsScreen;
