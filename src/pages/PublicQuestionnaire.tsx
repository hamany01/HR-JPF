import { useState, useEffect, useRef } from 'react';
import { Candidate, Job } from '../types';
import { 
  Clock, 
  Send, 
  CheckCircle2, 
  GraduationCap,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface PublicQuestionnaireProps {
  candidate: Candidate | null | undefined;
  job: Job | null | undefined;
  onSubmit: (answers: Record<number, string>) => void;
}

export function PublicQuestionnaire({ candidate, job, onSubmit }: PublicQuestionnaireProps) {
  const [step, setStep] = useState<'welcome' | 'questions' | 'success' | 'error'>('welcome');
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});

  useEffect(() => {
    if (!candidate || !job) {
      setStep('error');
    }
  }, [candidate, job]);

  const handleFinalSubmit = () => {
    onSubmit(answers);
    setStep('success');
  };

  const handleNext = () => {
    if (job && currentQ < job.questions.length - 1) {
      setCurrentQ(currentQ + 1);
    } else {
      handleFinalSubmit();
    }
  };

  if (step === 'error') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center" dir="rtl">
        <div className="max-w-md bg-white p-12 rounded-[2rem] shadow-xl border border-slate-200">
           <AlertCircle size={64} className="text-red-500 mx-auto mb-6" />
           <h1 className="text-2xl font-black text-slate-900 mb-2">عذراً، الرابط غير صالح</h1>
           <p className="text-slate-500 text-sm leading-relaxed">يبدو أن الرابط الذي تحاول الوصول إليه منتهي الصلاحية أو غير صحيح. يرجى التواصل مع مسؤول التوظيف.</p>
        </div>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-indigo-600 flex items-center justify-center p-6 text-center" dir="rtl">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md bg-white p-12 rounded-[2rem] shadow-2xl"
        >
           <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={40} />
           </div>
           <h1 className="text-2xl font-black text-slate-900 mb-4">تم تسجيل إجاباتك بنجاح!</h1>
           <p className="text-slate-500 text-sm leading-relaxed mb-8">شكراً لك {candidate?.name} على وقتك. سيقوم فريق التوظيف بمراجعة إجاباتك والتواصل معك قريباً بخصوص موعد المقابلة.</p>
           <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest border-t border-slate-50 pt-6">فريق إدارة الموارد البشرية</p>
        </motion.div>
      </div>
    );
  }

  const progress = job ? Math.round(((currentQ + 1) / job.questions.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans relative overflow-hidden" dir="rtl">
      {/* Dynamic Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-200/20 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-pink-200/20 blur-[120px] rounded-full"></div>

      {/* Top Header */}
      <header className="h-24 bg-white/70 backdrop-blur-xl border-b border-white/60 px-8 flex items-center justify-between sticky top-0 z-20 shadow-sm">
         <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-[1.25rem] bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-100 transition-transform hover:scale-105">
               <GraduationCap size={28} />
            </div>
            <div className="text-right">
               <h1 className="font-black text-slate-900 text-lg leading-none tracking-tight">SmartHire</h1>
               <p className="text-[10px] text-slate-400 mt-1.5 uppercase font-black tracking-[0.2em]">Candidate Assessment Portal</p>
            </div>
         </div>
         
         {step === 'questions' && (
           <div className="px-6 py-3 rounded-[1.5rem] flex items-center gap-3 font-black tabular-nums transition-all border shadow-lg bg-white/90 text-indigo-700 border-white/40 shadow-slate-200/50">
             <Clock size={18} />
             <span className="text-sm">جلسة تقييم مفتوحة</span>
           </div>
         )}
      </header>

      <main className="flex-1 flex items-center justify-center p-6 relative z-10">
        {step === 'welcome' && (
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-xl w-full bg-white/80 backdrop-blur-2xl p-12 md:p-16 rounded-[3.5rem] shadow-2xl border border-white/60 shadow-slate-200/50"
          >
            <div className="text-center space-y-8">
               <div className="inline-block px-5 py-2 bg-indigo-50 text-indigo-700 text-[10px] font-black rounded-full uppercase tracking-[0.2em] border border-indigo-100 shadow-sm">مرحباً بك في شركائنا النجاح</div>
               <h2 className="text-4xl font-black text-slate-900 tracking-tight leading-tight">أهلاً بك، {candidate?.name}</h2>
               <p className="text-slate-500 leading-relaxed text-lg">أنت تتقدم لوظيفة <span className="text-indigo-600 font-black">{job?.title}</span>. نود طرح بضعة أسئلة تمهيدية سريعة لنتعرف عليك بشكل أفضل قبل موعد المقابلة المباشرة.</p>
               
               <div className="grid grid-cols-2 gap-6 py-4">
                 <div className="bg-slate-50/50 p-6 rounded-[2.5rem] border border-slate-100/50 shadow-inner">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">عدد الأسئلة</p>
                    <p className="text-3xl font-black text-slate-900 tabular-nums">{job?.questions.length}</p>
                 </div>
                 <div className="bg-slate-50/50 p-6 rounded-[2.5rem] border border-slate-100/50 shadow-inner">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">الوقت المخصص</p>
                    <p className="text-3xl font-black text-slate-900 tabular-nums">مفتوح</p>
                 </div>
               </div>

               <div className="p-6 bg-amber-50/50 rounded-[2rem] border border-amber-100/50 text-right shadow-sm border-l-4 border-l-amber-400">
                  <p className="text-sm text-amber-800 leading-relaxed font-bold">يمكنك أخذ وقتك الكافي للإجابة على الأسئلة بدقة. سيتم حفظ إجاباتك عند إرسالها.</p>
               </div>

               <button 
                onClick={() => setStep('questions')}
                className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-black text-xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 hover:shadow-indigo-200 flex items-center justify-center gap-4 group"
               >
                 ابدأ الجلسة التقييمية
                 <ChevronRight size={24} className="rotate-180 transition-transform group-hover:translate-x-[-4px]" />
               </button>
            </div>
          </motion.div>
        )}

        {step === 'questions' && job && (
          <div className="max-w-3xl w-full space-y-10">
            <div className="bg-white/80 backdrop-blur-2xl p-12 md:p-20 rounded-[4rem] shadow-2xl border border-white/60 shadow-slate-200/50 relative overflow-hidden">
               <div className="absolute top-0 left-0 right-0 h-2.5 bg-slate-100/50">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    className="h-full bg-indigo-600 shadow-[0_0_15px_rgba(79,70,229,0.5)]"
                  />
               </div>

               <div className="space-y-16">
                  <div className="flex items-center justify-between">
                     <div className="flex flex-col">
                       <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-1">المرحلة الحالية</span>
                       <span className="text-2xl font-black text-slate-900 tracking-tighter">السؤال {currentQ + 1} <span className="text-slate-300 mx-1">/</span> {job.questions.length}</span>
                     </div>
                     <div className="flex flex-col items-end text-left">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">التقدم</span>
                        <span className="text-2xl font-black text-slate-900 tabular-nums tracking-tighter">{progress}%</span>
                     </div>
                  </div>

                  <div className="space-y-10">
                    <h3 className="text-3xl font-black text-slate-900 leading-[1.3] text-center">{job.questions[currentQ]}</h3>
                    <div className="relative group">
                      <textarea 
                        key={currentQ}
                        autoFocus
                        value={answers[currentQ] || ''}
                        onChange={e => setAnswers({...answers, [currentQ]: e.target.value})}
                        className="w-full bg-slate-50/50 border border-slate-100/50 rounded-[3rem] p-10 text-xl text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-500 min-h-[350px] transition-all resize-none shadow-inner leading-relaxed font-medium"
                        placeholder="اكتب إجابتك هنا بتفصيل، نحن مهتمون برؤية طريقة تفكيرك..."
                      />
                      <div className="absolute bottom-8 left-10 text-[10px] font-black text-slate-300 uppercase tracking-widest pointer-events-none group-focus-within:text-indigo-400 transition-colors">
                        Auto-saving...
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-6">
                    <button 
                      onClick={handleNext}
                      className="flex-1 py-6 bg-slate-900 text-white rounded-[2.5rem] font-black text-xl hover:bg-slate-800 transition-all shadow-2xl flex items-center justify-center gap-4 group"
                    >
                      {currentQ < job.questions.length - 1 ? 'السؤال التالي' : 'إرسال الإجابات النهائية'}
                      <ChevronRight size={24} className="rotate-180 transition-transform group-hover:translate-x-[-4px]" />
                    </button>
                  </div>
               </div>
            </div>
          </div>
        )}
      </main>

      <footer className="h-20 bg-white/50 backdrop-blur-md border-t border-white/40 px-8 flex items-center justify-center text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] relative z-20">
         جميع الحقوق محفوظة &copy; {new Date().getFullYear()} - فريق إدارة الموارد البشرية
      </footer>
    </div>
  );
}
