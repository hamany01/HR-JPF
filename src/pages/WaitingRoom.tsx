import { useState, useEffect } from 'react';
import { 
  Clock, 
  Users, 
  Video, 
  MapPin, 
  AlertTriangle, 
  CheckCircle,
  FileText,
  Upload,
  ChevronLeft,
  Smartphone,
  Bell
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AppDatabase, Candidate, Job, InterviewSession } from '../types';
import { cn } from '../lib/utils';

interface WaitingRoomProps {
  token: string;
  db: AppDatabase;
  updateDb: (updates: Partial<AppDatabase>) => void;
}

export function WaitingRoom({ token, db, updateDb }: WaitingRoomProps) {
  const candidate = db.candidates.find(c => c.questions_token === token);
  const job = candidate ? db.jobs.find(j => j.id === candidate.job_id) : null;
  const session = job ? db.sessions[job.id] : null;

  const [isOnline, setIsOnline] = useState(false);
  const [reportSent, setReportSent] = useState(false);
  const [cvFile, setCvFile] = useState<string | null>(null);

  // Sound effects refs
  const playAlert = () => {
    try {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      audio.play();
    } catch (e) {
      console.log('Audio blocked');
    }
  };

  useEffect(() => {
    if (candidate && !candidate.is_online) {
      updateDb({
        candidates: db.candidates.map(c => c.id === candidate.id ? { ...c, is_online: true } : c)
      });
    }
    
    setIsOnline(true);
    
    return () => {
      if (candidate) {
        updateDb({
          candidates: db.candidates.map(c => c.id === candidate.id ? { ...c, is_online: false } : c)
        });
      }
    };
  }, [token]);

  // Alert candidate if it's their turn
  const isMyTurn = session?.current_queue_number === candidate?.queue_number;
  const isClose = session && candidate?.queue_number && (candidate.queue_number - session.current_queue_number <= 2) && (candidate.queue_number > session.current_queue_number);

  useEffect(() => {
    if (isMyTurn) {
      playAlert();
      // Browser notification
      if (Notification.permission === "granted") {
        new Notification("حان دورك الآن!", {
          body: `المقابل بانتظارك لوظيفة ${job?.title}`,
          icon: "/logo.png"
        });
      }
    }
  }, [isMyTurn]);

  const reportProblem = () => {
    if (!candidate || !job) return;
    
    const notification = {
      id: Math.random().toString(36).slice(2, 10),
      title: 'مشكلة تقنية في ساحة الانتظار',
      message: `المرشح ${candidate.name} يواجه مشكلة في الدخول لمقابلة ${job.title}. رقم الجوال: ${candidate.phone}`,
      type: 'error' as const,
      is_read: false,
      created_at: new Date().toISOString()
    };

    updateDb({
      notifications: [...(db.notifications || []), notification]
    });
    setReportSent(true);
    setTimeout(() => setReportSent(false), 5000);
  };

  if (!candidate || !job) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-10">
        <div className="bg-white p-10 rounded-[2.5rem] shadow-xl text-center max-w-sm">
          <AlertTriangle size={48} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-black text-slate-800">الرابط غير صالح</h2>
          <p className="text-slate-500 text-sm mt-2">عذراً، يبدو أن الرابط الذي تحاول الوصول إليه غير موجود أو انتهت صلاحيته.</p>
        </div>
      </div>
    );
  }

  const peopleBefore = session && candidate.queue_number ? Math.max(0, candidate.queue_number - session.current_queue_number) : 0;

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 md:p-10 font-sans" dir="rtl">
      <div className="max-w-xl mx-auto space-y-8">
        {/* Header/Status */}
        <div className="flex items-center justify-between bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                 <Smartphone size={24} />
              </div>
              <div>
                <h1 className="text-lg font-black text-slate-800">ساحة السمو للانتظار الذكية</h1>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                  <span className="text-[10px] font-bold text-slate-400">أنت متصل الآن</span>
                </div>
              </div>
           </div>
           <button 
             onClick={() => {
                if (Notification.permission !== "granted") {
                  Notification.requestPermission();
                }
             }}
             className="p-3 bg-slate-50 text-slate-400 hover:text-indigo-600 rounded-2xl transition-all"
           >
              <Bell size={20} />
           </button>
        </div>

        {/* Main Queue Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "relative overflow-hidden rounded-[3rem] p-1 shadow-2xl transition-all duration-500",
            isMyTurn ? "bg-gradient-to-br from-emerald-400 to-teal-600" : "bg-gradient-to-br from-indigo-500 to-purple-600"
          )}
        >
           <div className="bg-white rounded-[2.8rem] p-8 md:p-12 text-center space-y-8">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">تذكرة الدخول الخاصة بك</p>
              
              <div className="space-y-2">
                <div className={cn(
                   "w-32 h-32 mx-auto rounded-[2.5rem] flex items-center justify-center text-5xl font-black shadow-inner border-4",
                   isMyTurn ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-slate-50 text-slate-800 border-slate-100"
                )}>
                  #{candidate.queue_number || '-'}
                </div>
                <h2 className="text-2xl font-black text-slate-800 mt-4">{candidate.name}</h2>
                <p className="text-slate-500 text-sm font-medium">{job.title}</p>
              </div>

              {/* Progress Bar */}
              <div className="space-y-4">
                <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">
                  <span>البداية</span>
                  <span>رقمك: #{candidate.queue_number}</span>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden relative shadow-inner">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (session?.current_queue_number || 0) / (candidate.queue_number || 1) * 100)}%` }}
                    className="absolute inset-y-0 right-0 bg-indigo-500 rounded-full shadow-lg"
                  />
                </div>
                <p className="text-xs font-bold text-slate-600">
                   {peopleBefore === 0 ? "لقد حان دورك!" : `بانتظار ${peopleBefore} مرشحين قبلك`}
                </p>
              </div>

              {/* Actions */}
              <div className="pt-4">
                {isMyTurn ? (
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => window.open(candidate.meeting_link || '#', '_blank')}
                    className="w-full bg-emerald-600 text-white rounded-[1.8rem] py-6 font-black text-lg shadow-xl shadow-emerald-100 flex items-center justify-center gap-4 animate-bounce"
                  >
                    <Video size={24} />
                    دخول المقابلة الآن
                  </motion.button>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">المقابلة الحالية</p>
                       <p className="text-2xl font-black text-slate-800 tabular-nums">#{session?.current_queue_number || 0}</p>
                    </div>
                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">الوقت المتوقع</p>
                       <p className="text-2xl font-black text-slate-800 tabular-nums">~{peopleBefore * 20}د</p>
                    </div>
                  </div>
                )}
              </div>
           </div>

           {/* Animated blobs */}
           <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
           <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full -ml-16 -mb-16 blur-2xl"></div>
        </motion.div>

        {/* Requirements Card */}
        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 space-y-6">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                 <FileText size={20} />
              </div>
              <h3 className="font-black text-slate-800">تحديث الملف الشخصي</h3>
           </div>
           
           <div className="space-y-4">
              <p className="text-xs text-slate-500 leading-relaxed font-medium">للحرص على اطلاع المقابل على أحدث نسخة من سيرتك الذاتية، يمكنك رفع الملف من هنا:</p>
              
              <div className={cn(
                "border-2 border-dashed rounded-3xl p-8 text-center transition-all cursor-pointer relative",
                candidate.cv_url ? "border-emerald-200 bg-emerald-50/30" : "border-slate-200 hover:border-indigo-300 hover:bg-slate-50"
              )}>
                 <input 
                   type="file" 
                   className="absolute inset-0 opacity-0 cursor-pointer" 
                   onChange={(e) => {
                     const file = e.target.files?.[0];
                     if (file) setCvFile(file.name);
                   }}
                 />
                 {candidate.cv_url || cvFile ? (
                   <div className="flex flex-col items-center gap-2">
                      <CheckCircle size={32} className="text-emerald-500" />
                      <p className="text-sm font-black text-emerald-700">{cvFile || "السيرة الذاتية مرفوعة مسبقاً"}</p>
                      <button className="text-[10px] font-bold text-slate-400 underline">تغيير الملف</button>
                   </div>
                 ) : (
                   <div className="flex flex-col items-center gap-2 text-slate-400">
                      <Upload size={32} />
                      <p className="text-sm font-bold">اضغط هنا لرفع السيرة الذاتية</p>
                      <p className="text-[10px]">PDF, Word (Max 5MB)</p>
                   </div>
                 )}
              </div>
           </div>
        </div>

        {/* Support Section */}
        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center">
                 <AlertTriangle size={24} />
              </div>
              <div>
                <p className="text-sm font-black text-slate-800">تواجه مشكلة في الدخول؟</p>
                <p className="text-[11px] text-slate-500 font-medium">اضغط على الزر ليتم إشعار فريق الدعم الفني فوراً</p>
              </div>
           </div>
           <button 
             onClick={reportProblem}
             disabled={reportSent}
             className={cn(
               "px-8 py-4 rounded-2xl text-xs font-black transition-all",
               reportSent ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600 hover:bg-red-600 hover:text-white"
             )}
           >
              {reportSent ? "تم إرسال الإشعار بنجاح" : "إشعار الإدارة بمشكلة"}
           </button>
        </div>

        {/* Bottom Logo */}
        <div className="text-center pb-10">
           <div className="inline-flex flex-col items-center gap-2 opacity-30 grayscale">
              <span className="font-black text-base tracking-tighter">فريق إدارة الموارد البشرية</span>
              <div className="w-8 h-1 bg-slate-200 rounded-full"></div>
           </div>
        </div>
      </div>
    </div>
  );
}
