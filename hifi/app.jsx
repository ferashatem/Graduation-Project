// ── UniSys Hi-Fi App — Root ───────────────────────────────────────────────────

const SCREENS = [
  { id:'design-system',   label:'نظام التصميم',          group:'عام',      emoji:'🎨' },
  { id:'login',           label:'تسجيل الدخول',          group:'عام',      emoji:'🔐' },
  { id:'admin-dashboard', label:'لوحة تحكم الأدمن',      group:'أدمن',     emoji:'🏠' },
  { id:'students',        label:'إدارة الطلاب',          group:'أدمن',     emoji:'🎓' },
  { id:'analytics',       label:'التحليلات',             group:'أدمن',     emoji:'📊' },
  { id:'complaints',      label:'الشكاوى',               group:'أدمن',     emoji:'⚠️'  },
  { id:'notifications',   label:'الإشعارات',             group:'أدمن',     emoji:'🔔' },
  { id:'ai-chat',         label:'المساعد الذكي (AI)',    group:'طالب',     emoji:'🤖' },
  { id:'exam-taking',     label:'صفحة الامتحان',         group:'طالب',     emoji:'📝' },
  { id:'schedule',        label:'الجدول الدراسي',        group:'طالب',     emoji:'📅' },
  { id:'doctor-course',   label:'تفاصيل المادة',         group:'دكتور',    emoji:'📚' },
  { id:'doctor-schedule', label:'جدول الدكتور',          group:'دكتور',    emoji:'🗓️'  },
];

function HiFiApp() {
  const [screen,  setScreen]  = React.useState('login');
  const [loggedAs,setLoggedAs]= React.useState(null);

  const handleLogin = (role) => {
    setLoggedAs(role);
    setScreen(role==='admin' ? 'admin-dashboard'
            : role==='doctor' ? 'doctor-course'
            : 'ai-chat');
  };

  const renderScreen = () => {
    switch(screen) {
      case 'design-system':   return <DesignSystemScreen />;
      case 'login':           return <LoginScreen onLogin={handleLogin} />;
      case 'admin-dashboard': return <AdminDashboardScreen onNavigate={setScreen} />;
      case 'students':        return <StudentsScreen onNavigate={setScreen} />;
      case 'analytics':       return <AnalyticsScreen onNavigate={setScreen} />;
      case 'complaints':      return <ComplaintsScreen onNavigate={setScreen} />;
      case 'notifications':   return <NotificationsScreen onNavigate={setScreen} />;
      case 'ai-chat':         return <AIChatScreen onNavigate={setScreen} />;
      case 'exam-taking':     return <ExamTakingScreen />;
      case 'schedule':        return <ScheduleScreen onNavigate={setScreen} role="student" />;
      case 'doctor-course':   return <DoctorCourseScreen onNavigate={setScreen} />;
      case 'doctor-schedule': return <ScheduleScreen onNavigate={setScreen} role="doctor" />;
      default:                return <AdminDashboardScreen onNavigate={setScreen} />;
    }
  };

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden',
      fontFamily:"'Noto Sans Arabic', system-ui, sans-serif" }}>
      <TweaksPanel screens={SCREENS} current={screen} onChange={setScreen} />
      <DesignCanvas>{renderScreen()}</DesignCanvas>
    </div>
  );
}

// Mount
const root = ReactDOM.createRoot(document.getElementById('hifi-root'));
root.render(<HiFiApp />);
