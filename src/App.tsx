import { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './pages/Dashboard';
import { JobsView } from './pages/JobsView';
import { CandidatesView } from './pages/CandidatesView';
import { InterviewView } from './pages/InterviewView';
import { SettingsView } from './pages/SettingsView';
import { PublicQuestionnaire } from './pages/PublicQuestionnaire';
import { WaitingRoom } from './pages/WaitingRoom';
import { AppDatabase, WATemplate } from './types';
import { motion, AnimatePresence } from 'motion/react';
import { Settings } from 'lucide-react';

const DEFAULT_TEMPLATES: WATemplate[] = [
  {
    id: 'assess_invite',
    name: 'دعوة للتذكير بالأسئلة',
    content: `مرحباً {الاسم}، مبروك تجاوزك المرحلة الأولى! 🌟

نود تذكيرك بضرورة إكمال "الأسئلة التمهيدية" لوظيفة ({الوظيفة}) للبدء في إجراءات المرحلة التالية.

يرجى الضغط على الرابط التالي للإجابة:
🔗 {الرابط}

نتمنى لك رحلة موفقة معنا،
فريق إدارة الموارد البشرية`
  },
  {
    id: 'interview_confirm',
    name: 'تأكيد موعد المقابلة',
    content: `مرحباً {الاسم}، يسعدنا تأكيد موعد مقابلتك الشخصية! ✅

تفاصيل الوظيفة: {الوظيفة}
📅 التاريخ: {التاريخ}
⏰ الوقت: {الوقت}

رابط الدخول للمقابلة الرقمية:
🔗 {الرابط}

يرجى التواجد في ساحة الانتظار قبل الموعد بـ 5 دقائق.
تمنياتنا لك بالتوفيق،
فريق إدارة الموارد البشرية`
  },
  {
    id: 'all_in_one',
    name: 'الرسالة الشاملة (الأسئلة + الموعد)',
    content: `مرحباً {الاسم}، يسعدنا اهتمامك بالانضمام لفريقنا في {الوظيفة}! 🚀

لقد تم تحديد موعد مقابلتك الشخصية، ويسعدنا مشاركتك التفاصيل والروابط الهامة:

📍 تفاصيل موعدك:
📅 التاريخ: {التاريخ}
⏰ الوقت: {الوقت}
🎫 رقمك في قائمة الانتظار: {رقم_الانتظار}

📋 الخطوات المطلوبة:
1️⃣ الأسئلة التمهيدية (يرجى إكمالها الآن وقبل الموعد):
🔗 {رابط_الأسئلة}

2️⃣ ساحة الانتظار الذكية (استخدم هذا الرابط وقت المقابلة):
🔗 {رابط_الانتظار}

تمنياتنا لك بكل التوفيق في مسيرتك المهنية،
فريق إدارة الموارد البشرية`
  }
];

const EMPTY_DB: AppDatabase = { 
  jobs: [], 
  candidates: [], 
  evaluations: {}, 
  preAnswers: {}, 
  aiAnalyses: {}, 
  templates: DEFAULT_TEMPLATES,
  notifications: [],
  sessions: {}
};

export default function App() {
  const [db, setDb] = useState<AppDatabase>(() => {
    try {
      const saved = localStorage.getItem('smarthire_pro_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Migration: Ensure new fields exist
        if (!parsed.aiAnalyses) parsed.aiAnalyses = {};
        if (!parsed.notifications) parsed.notifications = [];
        if (!parsed.sessions) parsed.sessions = {};
        return parsed;
      }
      return EMPTY_DB;
    } catch {
      return EMPTY_DB;
    }
  });

  const [view, setView] = useState(() => {
    const hash = window.location.hash.replace('#', '');
    return hash || 'dashboard';
  });
  const [ctx, setCtx] = useState<any>({});
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash && hash !== 'public_q') setView(hash);
    };
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const navigate = (v: string, c: any = {}) => {
    window.location.hash = v;
    setView(v);
    setCtx(c);
  };

  // Handle routing for public pages
  const [publicToken, setPublicToken] = useState<string | null>(null);
  const [waitingToken, setWaitingToken] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const qToken = params.get('q');
    const wToken = params.get('w');
    if (qToken) {
      setPublicToken(qToken);
      setView('public_q');
    } else if (wToken) {
      setWaitingToken(wToken);
      setView('waiting_room');
    }
  }, []);

  const updateDb = useCallback((updates: Partial<AppDatabase>) => {
    setDb(prev => {
      const next = { ...prev, ...updates };
      localStorage.setItem('smarthire_pro_v1', JSON.stringify(next));
      return next;
    });
  }, []);

  if (view === 'public_q' && publicToken) {
    // Priority: search database for THIS SPECIFIC TOKEN
    const candidate = db.candidates.find(c => c.questions_token === publicToken);
    const job = candidate ? db.jobs.find(j => j.id === candidate.job_id) : null;
    return <PublicQuestionnaire candidate={candidate} job={job} onSubmit={(ans) => {
      if (candidate) {
        updateDb({
          preAnswers: { ...db.preAnswers, [candidate.id]: { answers: ans, submitted_at: new Date().toISOString(), is_completed: true } },
          candidates: db.candidates.map(c => c.id === candidate.id ? { ...c, status: 'questioned' } : c)
        });
      }
    }} />;
  }

  if (view === 'waiting_room' && waitingToken) {
    const candidate = db.candidates.find(c => c.questions_token === waitingToken);
    if (candidate) {
       return <WaitingRoom token={waitingToken} db={db} updateDb={updateDb} />;
    }
    // Fallback if candidate not found in this browser's database
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-10 text-center" dir="rtl">
        <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl max-w-md border border-slate-100">
           <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Settings size={40} className="animate-pulse" />
           </div>
           <h2 className="text-2xl font-black text-slate-900 mb-4">الرابط غير صالح أو مفقود</h2>
           <p className="text-slate-500 text-sm leading-relaxed mb-6">عذراً، لم نتمكن من العثور على بيانات المرشح المرتبطة بهذا الرابط في قاعدة البيانات الحالية.</p>
           <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 text-amber-700 text-[10px] font-bold leading-relaxed">
             ملاحظة: البيانات مخزنة محلياً في المتصفح. إذا تم إنشاء الرابط من جهاز آخر أو متصفح آخر، فلن يعمل هذا الرابط إلا إذا تم تصدير واستيراد البيانات.
           </div>
        </div>
      </div>
    );
  }

  const renderView = () => {
    switch (view) {
      case 'dashboard': return <Dashboard db={db} onNavigate={navigate} />;
      case 'jobs': return <JobsView db={db} updateDb={updateDb} onNavigate={navigate} />;
      case 'candidates': return <CandidatesView db={db} updateDb={updateDb} ctx={ctx} onNavigate={navigate} />;
      case 'interview': return <InterviewView db={db} updateDb={updateDb} ctx={ctx} onBack={() => navigate('candidates')} />;
      case 'templates': return <SettingsView db={db} updateDb={updateDb} />;
      case 'settings': return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
           <div className="w-20 h-20 bg-white border border-slate-100 rounded-3xl flex items-center justify-center text-slate-200 mb-6 shadow-sm">
              <Settings size={40} />
           </div>
           <h2 className="text-xl font-black text-slate-900">إعدادات النظام</h2>
           <p className="text-sm text-slate-500 mt-2">قريباً: إدارة المستخدمين، الربط مع Gmail، وتخصيص العلامة التجارية.</p>
        </div>
      );
      default: return <Dashboard db={db} onNavigate={navigate} />;
    }
  };

  return (
    <div dir="rtl" className="flex h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      <Sidebar 
        isOpen={sidebarOpen} 
        currentView={view} 
        onViewChange={(v) => navigate(v)} 
        setIsOpen={setSidebarOpen} 
      />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header 
          view={view} 
          job={ctx?.job} 
          db={db}
          updateDb={updateDb}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} 
        />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={view + (ctx?.job?.id || '')}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="max-w-7xl mx-auto"
            >
              {renderView()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
