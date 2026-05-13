import { useState, useEffect, useCallback, useMemo } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './pages/Dashboard';
import { JobsView } from './pages/JobsView';
import { CandidatesView } from './pages/CandidatesView';
import { InterviewView } from './pages/InterviewView';
import { SettingsView } from './pages/SettingsView';
import { PublicQuestionnaire } from './pages/PublicQuestionnaire';
import { WaitingRoom } from './pages/WaitingRoom';
import { AppDatabase, WATemplate, Job, Candidate, AppNotification, InterviewSession, Evaluation, PreAnswers } from './types';
import { motion, AnimatePresence } from 'motion/react';
import { Settings, ShieldCheck, LogIn, Mail } from 'lucide-react';
import { db as fdb, auth, handleFirestoreError, OperationType } from './lib/firebase';
import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged, User, signOut } from 'firebase/auth';
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  deleteDoc, 
  writeBatch,
  query,
  orderBy,
  getDoc
} from 'firebase/firestore';

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
  const [db, setDb] = useState<AppDatabase>(EMPTY_DB);
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [view, setView] = useState(() => {
    const hash = window.location.hash.replace('#', '');
    return hash || 'dashboard';
  });
  const [ctx, setCtx] = useState<any>({});
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Monitor Auth State
  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setIsLoadingAuth(false);
    });
  }, []);

  // Sync with Firebase
  useEffect(() => {
    // PUBLIC LISTENERS (Non-Auth allowed by rules)
    const unsubPublic = [
      onSnapshot(collection(fdb, 'sessions'), (snap) => {
        const sessions: Record<string, InterviewSession> = {};
        snap.docs.forEach(d => sessions[d.id] = d.data() as InterviewSession);
        setDb(prev => ({ ...prev, sessions }));
      }, (err) => handleFirestoreError(err, OperationType.LIST, 'sessions')),
      
      onSnapshot(collection(fdb, 'preAnswers'), (snap) => {
        const preAnswers: Record<string, PreAnswers> = {};
        snap.docs.forEach(d => preAnswers[d.id] = d.data() as PreAnswers);
        setDb(prev => ({ ...prev, preAnswers }));
      }, (err) => handleFirestoreError(err, OperationType.LIST, 'preAnswers')),
      
      onSnapshot(collection(fdb, 'templates'), (snap) => {
        const templates = snap.docs.map(d => d.data() as WATemplate);
        if (templates.length === 0 && user) {
          // Initialize default templates if none exist
          const batch = writeBatch(fdb);
          DEFAULT_TEMPLATES.forEach(t => {
            batch.set(doc(fdb, 'templates', t.id), t);
          });
          batch.commit().catch(e => handleFirestoreError(e, OperationType.WRITE, 'templates-init'));
        } else if (templates.length > 0) {
          setDb(prev => ({ ...prev, templates }));
        }
      }, (err) => handleFirestoreError(err, OperationType.LIST, 'templates'))
    ];

    // AUTHENTICATED LISTENERS (Requires User)
    let unsubAuth: (() => void)[] = [];
    if (user) {
      unsubAuth = [
        onSnapshot(collection(fdb, 'jobs'), (snap) => {
          const jobs = snap.docs.map(d => d.data() as Job);
          setDb(prev => ({ ...prev, jobs }));
        }, (err) => handleFirestoreError(err, OperationType.LIST, 'jobs')),
        
        onSnapshot(collection(fdb, 'candidates'), (snap) => {
          const candidates = snap.docs.map(d => d.data() as Candidate);
          setDb(prev => ({ ...prev, candidates }));
        }, (err) => handleFirestoreError(err, OperationType.LIST, 'candidates')),
        
        onSnapshot(collection(fdb, 'evaluations'), (snap) => {
          const evaluations: Record<string, Evaluation> = {};
          snap.docs.forEach(d => evaluations[d.id] = d.data() as Evaluation);
          setDb(prev => ({ ...prev, evaluations }));
        }, (err) => handleFirestoreError(err, OperationType.LIST, 'evaluations')),
        
        onSnapshot(query(collection(fdb, 'notifications'), orderBy('created_at', 'desc')), (snap) => {
          const notifications = snap.docs.map(d => d.data() as AppNotification);
          setDb(prev => ({ ...prev, notifications }));
        }, (err) => handleFirestoreError(err, OperationType.LIST, 'notifications'))
      ];

      // Migration Logic (only runs once after login)
      const saved = localStorage.getItem('smarthire_pro_v1');
      if (saved && !localStorage.getItem('smarthire_migrated_v1')) {
         const parsed = JSON.parse(saved);
         updateDb(parsed).then(() => {
           localStorage.setItem('smarthire_migrated_v1', 'true');
         }).catch(e => console.error("Migration failed", e));
      }
    }

    return () => {
      unsubPublic.forEach(u => u());
      unsubAuth.forEach(u => u());
    };
  }, [user]);

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

  // Router for public links
  const [publicToken, setPublicToken] = useState<string | null>(null);
  const [waitingToken, setWaitingToken] = useState<string | null>(null);

  // For public users, we fetch exactly what they need by ID
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const qToken = params.get('q');
    const wToken = params.get('w');
    
    const fetchPublicData = async (candidateId: string) => {
      try {
        const { getDoc, doc } = await import('firebase/firestore');
        const cSnap = await getDoc(doc(fdb, 'candidates', candidateId));
        if (cSnap.exists()) {
          const cData = cSnap.data() as Candidate;
          setDb(prev => ({
            ...prev,
            candidates: prev.candidates.some(c => c.id === cData.id) ? prev.candidates : [...prev.candidates, cData]
          }));
          
          const jSnap = await getDoc(doc(fdb, 'jobs', cData.job_id));
          if (jSnap.exists()) {
            const jData = jSnap.data() as Job;
            setDb(prev => ({
              ...prev,
              jobs: prev.jobs.some(j => j.id === jData.id) ? prev.jobs : [...prev.jobs, jData]
            }));
          }
        }
      } catch (e) {
        console.error("Public fetch failed", e);
      }
    };

    if (qToken) {
      setPublicToken(qToken);
      setView('public_q');
      fetchPublicData(qToken);
    } else if (wToken) {
      setWaitingToken(wToken);
      setView('waiting_room');
      fetchPublicData(wToken);
    }
  }, []);

  const updateDb = useCallback(async (updates: Partial<AppDatabase>) => {
    // Bridging with error logging
    try {
      if (updates.jobs && user) {
        // Handle deletions
        const deletedJobs = db.jobs.filter(oldJob => !updates.jobs!.find(newJob => newJob.id === oldJob.id));
        for (const dj of deletedJobs) await deleteDoc(doc(fdb, 'jobs', dj.id));
        // Handle upserts
        for (const job of updates.jobs) await setDoc(doc(fdb, 'jobs', job.id), job);
      }
      
      if (updates.candidates) {
        // IMPORTANT: If public user (candidate), we ONLY allow updating their own entry
        if (!user) {
          const publicUpdates = updates.candidates;
          for (const c of publicUpdates) {
             await setDoc(doc(fdb, 'candidates', c.id), c);
          }
        } else {
          // Admin full sync
          const deletedCandidates = db.candidates.filter(oldC => !updates.candidates!.find(newC => newC.id === oldC.id));
          for (const dc of deletedCandidates) await deleteDoc(doc(fdb, 'candidates', dc.id));
          const batch = writeBatch(fdb);
          updates.candidates.forEach(c => batch.set(doc(fdb, 'candidates', c.id), c));
          await batch.commit();
        }
      }

      if (updates.evaluations && user) {
        const oldKeys = Object.keys(db.evaluations);
        const newKeys = Object.keys(updates.evaluations);
        const deletedKeys = oldKeys.filter(k => !newKeys.includes(k));
        for (const dk of deletedKeys) await deleteDoc(doc(fdb, 'evaluations', dk));
        for (const [id, eval_data] of Object.entries(updates.evaluations)) await setDoc(doc(fdb, 'evaluations', id), eval_data);
      }

      if (updates.preAnswers) {
        // preAnswers are writable by public
        for (const [id, ans] of Object.entries(updates.preAnswers)) await setDoc(doc(fdb, 'preAnswers', id), ans);
      }

      if (updates.templates && user) {
        const deleted = db.templates.filter(ot => !updates.templates!.find(nt => nt.id === ot.id));
        for (const dt of deleted) await deleteDoc(doc(fdb, 'templates', dt.id));
        for (const t of updates.templates) await setDoc(doc(fdb, 'templates', t.id), t);
      }

      if (updates.notifications && user) {
        if (updates.notifications.length === 0 && db.notifications.length > 0) {
          for (const n of db.notifications) await deleteDoc(doc(fdb, 'notifications', n.id));
        } else {
          const latest = updates.notifications[updates.notifications.length - 1];
          if (latest) await setDoc(doc(fdb, 'notifications', latest.id), latest);
        }
      }

      if (updates.sessions) {
        const oldKeys = Object.keys(db.sessions);
        const newKeys = Object.keys(updates.sessions);
        const deletedKeys = oldKeys.filter(k => !newKeys.includes(k));
        for (const dk of deletedKeys) {
           if (user) await deleteDoc(doc(fdb, 'sessions', dk));
        }
        for (const [id, session] of Object.entries(updates.sessions)) await setDoc(doc(fdb, 'sessions', id), session);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'multi-path-bridge');
    }
  }, [db, user]);

  const login = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setDb(EMPTY_DB);
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  if (view === 'public_q' && publicToken) {
    // Priority: search database for THIS SPECIFIC TOKEN
    const candidate = db.candidates.find(c => c.questions_token === publicToken);
    const job = candidate ? db.jobs.find(j => j.id === candidate.job_id) : null;
    
    if (!candidate) {
       return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-10 text-center" dir="rtl">
          <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl max-w-md border border-slate-100">
             <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }}>
                  <Settings size={40} />
                </motion.div>
             </div>
             <h2 className="text-2xl font-black text-slate-900 mb-4">جاري تحميل البيانات...</h2>
             <p className="text-slate-500 text-sm leading-relaxed">يرجى الانتظار بينما نقوم بمزامنة بياناتك مع السحابة.</p>
          </div>
        </div>
      );
    }

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
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-10 text-center" dir="rtl">
        <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl max-w-md border border-slate-100">
           <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }}>
                <Settings size={40} />
              </motion.div>
           </div>
           <h2 className="text-2xl font-black text-slate-900 mb-4">جاري تحميل البيانات...</h2>
           <p className="text-slate-500 text-sm leading-relaxed mb-6">يرجى الانتظار بينما نقوم بمزامنة بياناتك مع السحابة.</p>
        </div>
      </div>
    );
  }

  // Dashboard Login Screen
  if (!user && !isLoadingAuth) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 font-sans" dir="rtl">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-12">
            <div className="w-20 h-20 bg-indigo-600 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-indigo-200">
              <ShieldCheck size={40} className="text-white" />
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-4">نظام السمو الذكي</h1>
            <p className="text-slate-500 font-medium leading-relaxed">بوابة إدارة الموارد البشرية والتوظيف المؤتمت.</p>
          </div>

          <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-indigo-600"></div>
            
            <div className="space-y-6">
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                <p className="text-sm font-bold text-slate-600 leading-relaxed mb-1">يرجى تسجيل الدخول للوصول للوحة التحكم</p>
                <p className="text-[10px] text-slate-400">فقط المستخدمين المصرح لهم يمكنهم الدخول</p>
              </div>

              <button 
                onClick={login}
                className="w-full h-16 bg-white border-2 border-slate-100 hover:border-indigo-600 rounded-2xl flex items-center justify-center gap-4 transition-all group shadow-sm"
              >
                <div className="w-8 h-8 flex items-center justify-center bg-white rounded-lg border border-slate-100 shadow-sm transition-transform group-hover:scale-110">
                   <svg width="20" height="20" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                </div>
                <span className="font-black text-slate-700 tracking-tight">الدخول بواسطة جوجل</span>
              </button>

              <div className="flex items-center gap-4 py-2">
                <div className="flex-1 h-px bg-slate-100"></div>
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">أو</span>
                <div className="flex-1 h-px bg-slate-100"></div>
              </div>

              <div className="text-center">
                 <p className="text-[10px] text-slate-400 font-bold max-w-[200px] mx-auto">عند مواجهة مشاكل في الدخول يرجى التواصل مع فريق الدعم الفني.</p>
              </div>
            </div>
          </div>
          
          <p className="text-center mt-12 text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">SmartHire AI &copy; 2026 • VERSION 3.1</p>
        </motion.div>
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
        user={user}
        onLogOut={logout}
      />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header 
          view={view} 
          job={ctx?.job} 
          db={db}
          updateDb={updateDb}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} 
          user={user}
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

          <footer className="max-w-7xl mx-auto mt-12 border-t border-slate-200/60 pt-8 flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest pb-12">
            <div className="flex items-center gap-4">
              <span>SmartHire AI &copy; 2026 - جميع الحقوق محفوظة</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-px w-8 bg-slate-200"></div>
              <span className="bg-white px-3 py-1.5 rounded-full border border-slate-100 shadow-sm text-indigo-600">Version 3.1</span>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
