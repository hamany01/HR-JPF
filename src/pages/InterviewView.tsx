import { useState, useEffect } from 'react';
import { AppDatabase, Candidate, Job, Evaluation, AIAnalysis } from '../types';
import { 
  ChevronRight, 
  Star, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  MessageSquare, 
  FileText,
  ThumbsUp,
  ThumbsDown,
  ExternalLink,
  Smartphone,
  Copy,
  Plus,
  Zap,
  BrainCircuit,
  Sparkles,
  Calendar,
  Video,
  Link
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { analyzeCandidate } from '../services/geminiService';

interface InterviewViewProps {
  db: AppDatabase;
  updateDb: (updates: Partial<AppDatabase>) => void;
  ctx?: { candidate?: Candidate, job?: Job };
  onBack: () => void;
}

export function InterviewView({ db, updateDb, ctx, onBack }: InterviewViewProps) {
  const candidate = ctx?.candidate;
  const job = ctx?.job;

  if (!candidate || !job) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h4 className="text-lg font-black text-slate-800">بيانات مفقودة</h4>
        <button onClick={onBack} className="mt-4 text-indigo-600 font-bold hover:underline">العودة للخلف</button>
      </div>
    );
  }

  const existingEv = db.evaluations[candidate.id];
  const pa = db.preAnswers[candidate.id];
  const aiAnalysis = db.aiAnalyses?.[candidate.id];

  const [scores, setScores] = useState<Record<number, number>>(existingEv?.scores || {});
  const [positives, setPositives] = useState(existingEv?.positives || '');
  const [negatives, setNegatives] = useState(existingEv?.negatives || '');
  const [notes, setNotes] = useState(existingEv?.notes || '');
  const [decision, setDecision] = useState(existingEv?.final_decision || 'pending');
  const [isSaving, setIsSaving] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const totalScore = (Object.values(scores) as number[]).reduce((a, b) => a + b, 0);
  const scorePct = Math.round((totalScore / (job.criteria.length * 5)) * 100) || 0;

  const handleAIAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      const answersText = pa?.is_completed 
        ? job.questions.map((q, i) => `${q}: ${pa.answers[i]}`).join('\n')
        : undefined;
      
      const result = await analyzeCandidate(candidate, job, answersText);
      const newAnalysis: AIAnalysis = {
        candidate_id: candidate.id,
        summary: result.summary,
        skills_score: result.skills_score,
        sentiment: result.sentiment,
        analyzed_at: new Date().toISOString()
      };

      updateDb({
        aiAnalyses: { ...(db.aiAnalyses || {}), [candidate.id]: newAnalysis }
      });
    } catch (error) {
      alert("حدث خطأ أثناء تحليل البيانات بالذكاء الاصطناعي.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSave = () => {
    setIsSaving(true);
    const evaluation: Evaluation = {
      candidate_id: candidate.id,
      job_id: job.id,
      scores,
      positives,
      negatives,
      notes,
      total_score: totalScore,
      score_percentage: scorePct,
      final_decision: decision,
      evaluated_at: new Date().toISOString()
    };

    updateDb({
      evaluations: { ...db.evaluations, [candidate.id]: evaluation },
      candidates: db.candidates.map(c => 
        c.id === candidate.id 
          ? { ...c, status: decision === 'accepted' ? 'accepted' : decision === 'rejected' ? 'rejected' : 'evaluated' } 
          : c
      )
    });

    setTimeout(() => {
      setIsSaving(false);
      onBack();
    }, 800);
  };

  return (
    <div className="space-y-8 pb-32">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-white rounded-xl text-slate-400 hover:text-slate-900 transition-all">
            <ChevronRight size={24} />
          </button>
          <div className="w-16 h-16 rounded-[1.5rem] bg-indigo-600 flex items-center justify-center text-white text-2xl font-black shadow-xl shadow-indigo-100 transition-transform hover:scale-105">
            {candidate.name.substring(0, 1)}
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">{candidate.name}</h2>
            <div className="flex items-center gap-3 mt-1.5">
              <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100 uppercase tracking-widest">{job.title}</span>
              <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
              <span className="text-[10px] font-black text-slate-400 tabular-nums tracking-widest uppercase" dir="ltr">{candidate.phone}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="bg-white/70 backdrop-blur-md px-6 py-4 rounded-[1.5rem] border border-white/60 shadow-xl shadow-slate-200/50 flex flex-col items-center min-w-[120px]">
             <span className="text-3xl font-black text-slate-900 tabular-nums tracking-tighter">{scorePct}%</span>
             <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">نتيجة التقييم</span>
          </div>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className={cn(
              "px-8 py-4 rounded-[1.5rem] font-black text-sm transition-all shadow-xl shadow-indigo-100 flex items-center gap-2",
              isSaving ? "bg-emerald-500 text-white" : "bg-indigo-600 text-white hover:bg-indigo-700"
            )}
          >
            <CheckCircle2 size={18} />
            {isSaving ? 'تم الحفظ ✓' : 'حفظ التقييم النهائي'}
          </button>
        </div>
      </div>

      {/* Interview Schedule Section */}
      {candidate.interview_date && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-amber-100 flex flex-col md:flex-row items-center justify-between gap-8"
        >
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white shadow-lg border border-white/30">
              <Calendar size={32} />
            </div>
            <div>
              <p className="text-white/70 text-[10px] font-black uppercase tracking-[0.2em] mb-1">موعد المقابلة المجدول</p>
              <h3 className="text-2xl font-black tabular-nums">
                {new Date(candidate.interview_date).toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </h3>
              <p className="text-amber-100 text-sm font-bold flex items-center gap-2 mt-1">
                <Clock size={16} />
                {new Date(candidate.interview_date).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
            {candidate.meeting_link && (
              <a 
                href={candidate.meeting_link} 
                target="_blank" 
                rel="noreferrer"
                className="w-full sm:w-auto bg-white text-amber-600 px-8 py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-3 hover:bg-amber-50 transition-all shadow-lg active:scale-95"
              >
                <Video size={18} />
                الانضمام للمقابلة
              </a>
            )}
            <div className="w-full sm:w-auto bg-amber-700/30 backdrop-blur-sm border border-white/20 rounded-2xl px-6 py-4 flex flex-col items-center sm:items-start min-w-[200px]">
              <span className="text-[9px] font-black text-amber-100 uppercase tracking-widest flex items-center gap-2 mb-1">
                <Link size={12} /> رابط الاجتماع
              </span>
              <div className="flex items-center gap-3 w-full">
                <span className="text-[10px] font-bold truncate max-w-[150px] opacity-80" dir="ltr">
                  {candidate.meeting_link || 'لا يوجد رابط متاح'}
                </span>
                {candidate.meeting_link && (
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(candidate.meeting_link!);
                      alert('تم نسخ الرابط بنجاح');
                    }}
                    className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <Copy size={16} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          {/* AI Analysis Section */}
          <section className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="font-black text-slate-800 text-lg flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center"><Sparkles size={18} /></span>
                التحليل الذكي (Gemini AI)
              </h3>
              {!aiAnalysis && (
                <button 
                  onClick={handleAIAnalyze}
                  disabled={isAnalyzing}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl text-xs font-black hover:bg-purple-700 transition-all shadow-lg shadow-purple-100 disabled:opacity-50"
                >
                  {isAnalyzing ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <BrainCircuit size={16} />}
                  {isAnalyzing ? 'جاري التحليل...' : 'بدء التحليل الذكي'}
                </button>
              )}
            </div>

            <div className="bg-gradient-to-br from-purple-50/50 to-white backdrop-blur-lg rounded-[2.5rem] border border-purple-100 shadow-xl shadow-purple-200/20 overflow-hidden p-8 md:p-10">
              {aiAnalysis ? (
                <div className="space-y-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1 space-y-2">
                      <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest leading-loose">ملخص الملف الشخصي</p>
                      <p className="text-slate-800 text-sm font-medium leading-relaxed bg-white/50 p-6 rounded-2xl border border-purple-50 shadow-sm">
                        {aiAnalysis.summary}
                      </p>
                    </div>
                    <div className="flex flex-col gap-4 min-w-[180px]">
                      <div className="bg-white p-6 rounded-2xl border border-purple-50 shadow-sm flex flex-col items-center">
                        <span className="text-3xl font-black text-purple-600 tabular-nums">{aiAnalysis.skills_score}%</span>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">تطابق المهارات</span>
                      </div>
                      <div className="bg-white p-6 rounded-2xl border border-purple-50 shadow-sm flex flex-col items-center">
                        <span className="text-lg font-black text-slate-800">{aiAnalysis.sentiment}</span>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">نبرة الانطباع</span>
                      </div>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-purple-100/50 flex items-center justify-between">
                    <span className="text-[9px] font-bold text-slate-400">تم التحليل بواسطة Gemini Flash 3.0</span>
                    <button 
                      onClick={handleAIAnalyze}
                      disabled={isAnalyzing}
                      className="text-[10px] font-bold text-purple-600 hover:bg-purple-100 px-3 py-1 rounded-lg transition-colors"
                    >
                      إعادة التحليل
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-10 text-center space-y-4">
                  <div className="w-20 h-20 bg-purple-50 border border-purple-100 rounded-[2rem] flex items-center justify-center mx-auto text-purple-300">
                    {isAnalyzing ? <div className="w-10 h-10 border-4 border-purple-100 border-t-purple-600 rounded-full animate-spin"></div> : <BrainCircuit size={40} />}
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-slate-800">{isAnalyzing ? 'جاري قراءة الملف وتحليل الإجابات...' : 'حلل ملف المرشح بذكاء'}</h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">سيقوم الذكاء الاصطناعي بتلخيص خبرات المرشح وقياس مدى توافقه مع متطلبات الوظيفة.</p>
                  </div>
                  {!isAnalyzing && (
                    <button 
                      onClick={handleAIAnalyze}
                      className="mt-4 px-6 py-2.5 bg-purple-600 text-white rounded-xl text-xs font-black hover:bg-purple-700 transition-all"
                    >
                      ابدأ الآن
                    </button>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* Pre-Interview Answers */}
          <section className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="font-black text-slate-800 text-lg flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center"><MessageSquare size={18} /></span>
                إجابات الأسئلة التمهيدية
              </h3>
            </div>
            
            <div className="bg-white/70 backdrop-blur-lg rounded-[2.5rem] border border-white/40 shadow-xl shadow-slate-200/50 overflow-hidden p-8 md:p-10 space-y-8">
              {pa?.is_completed ? (
                job.questions.map((q, i) => (
                  <div key={i} className="space-y-3 group">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-loose group-hover:text-indigo-500 transition-colors">السؤال {i + 1}: {q}</p>
                    <div className="bg-slate-50/50 p-6 rounded-[1.5rem] border border-slate-100 text-slate-800 leading-relaxed text-sm font-medium shadow-sm">
                      {pa.answers[i] || 'لا توجد إجابة.'}
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-20 text-center">
                  <div className="w-24 h-24 bg-slate-50 border border-slate-100 rounded-[2rem] flex items-center justify-center mx-auto mb-8 text-slate-200 shadow-inner">
                    <Clock size={40} />
                  </div>
                  <h4 className="text-xl font-black text-slate-800">لم يتم الإجابة بعد</h4>
                  <p className="text-sm text-slate-500 mt-2 max-w-sm mx-auto leading-relaxed">هذا المرشح لم يكمل جلسة الأسئلة التمهيدية حتى الآن.</p>
                  
                  <div className="mt-10 p-6 bg-indigo-50/50 rounded-[2rem] border border-indigo-100 inline-block text-right shadow-sm">
                    <p className="text-[10px] font-black text-indigo-700 mb-3 uppercase tracking-widest">رابط الأسئلة (للمحاكاة):</p>
                    <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-indigo-200 text-[10px] tabular-nums text-slate-500 font-mono shadow-sm">
                       <span className="truncate max-w-[200px]">{window.location.origin}/?q={candidate.questions_token}</span>
                       <button onClick={() => navigator.clipboard.writeText(`${window.location.origin}/?q=${candidate.questions_token}`)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                          <Copy size={16} />
                       </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Scoring Section */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 px-2">
              <h3 className="font-black text-slate-800 text-lg flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center"><Star size={18} /></span>
                معايير التقييم الأساسية
              </h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {job.criteria.map((c, i) => (
                <div key={i} className="bg-white/70 backdrop-blur-lg p-6 rounded-[2rem] border border-white/40 shadow-xl shadow-slate-200/50 flex flex-col justify-between group hover:border-indigo-200 transition-all hover:-translate-y-1">
                  <span className="text-sm font-bold text-slate-700 mb-5 leading-relaxed">{c}</span>
                  <div className="flex items-center gap-1.5 bg-slate-50/50 p-1.5 rounded-2xl border border-slate-100">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button 
                        key={s}
                        onClick={() => setScores({...scores, [i]: s})}
                        className={cn(
                          "w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black transition-all transform active:scale-95",
                          scores[i] >= s 
                            ? "bg-amber-500 text-white shadow-lg shadow-amber-100" 
                            : "bg-white text-slate-400 hover:text-slate-600"
                        )}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Sidebar Controls */}
        <div className="space-y-8">
          <section className="bg-white/70 backdrop-blur-lg p-8 rounded-[2.5rem] border border-white/40 shadow-xl shadow-slate-200/50 space-y-8 sticky top-24">
            <h3 className="font-black text-slate-900 text-lg border-b border-slate-100/50 pb-4">الانطباع النهائي</h3>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2 px-1">
                  <ThumbsUp size={14} className="text-emerald-500" /> النقاط الإيجابية
                </label>
                <textarea 
                  value={positives}
                  onChange={e => setPositives(e.target.value)}
                  className="w-full bg-slate-50/50 border border-slate-100 rounded-[1.5rem] p-4 text-sm min-h-[100px] focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all font-medium placeholder:text-slate-300 shadow-inner"
                  placeholder="ما الذي أعجبك في هذا المرشح؟"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2 px-1">
                  <ThumbsDown size={14} className="text-red-500" /> النقاط السلبية
                </label>
                <textarea 
                  value={negatives}
                  onChange={e => setNegatives(e.target.value)}
                  className="w-full bg-slate-50/50 border border-slate-100 rounded-[1.5rem] p-4 text-sm min-h-[100px] focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all font-medium placeholder:text-slate-300 shadow-inner"
                  placeholder="ما هي المخاوف أو نقاط الضعف؟"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">ملاحظات إضافية</label>
                <textarea 
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full bg-slate-50/50 border border-slate-100 rounded-[1.5rem] p-4 text-sm min-h-[80px] focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all font-medium placeholder:text-slate-300 shadow-inner"
                  placeholder="أي معلومات أخرى..."
                />
              </div>
            </div>

            <div className="pt-8 border-t border-slate-100/50 flex flex-col gap-4">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-1 text-center">اتخاذ القرار الفوري</p>
               <div className="grid grid-cols-2 gap-3">
                 <button 
                  onClick={() => setDecision('accepted')}
                  className={cn(
                    "flex flex-col items-center gap-3 p-4 rounded-[1.5rem] border transition-all transform active:scale-95 shadow-sm",
                    decision === 'accepted' 
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-100" 
                      : "bg-white text-slate-500 border-slate-100 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-100/50"
                  )}
                 >
                   <ThumbsUp size={22} />
                   <span className="text-[10px] font-black uppercase tracking-widest">قبول</span>
                 </button>
                 <button 
                  onClick={() => setDecision('rejected')}
                  className={cn(
                    "flex flex-col items-center gap-3 p-4 rounded-[1.5rem] border transition-all transform active:scale-95 shadow-sm",
                    decision === 'rejected' 
                      ? "bg-red-600 text-white border-red-600 shadow-lg shadow-red-100" 
                      : "bg-white text-slate-500 border-slate-100 hover:bg-red-50 hover:text-red-600 hover:border-red-100/50"
                  )}
                 >
                   <ThumbsDown size={22} />
                   <span className="text-[10px] font-black uppercase tracking-widest">رفض</span>
                 </button>
               </div>
               <button 
                  onClick={() => setDecision('on_hold')}
                  className={cn(
                    "w-full py-4 rounded-[1.5rem] border font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-sm",
                    decision === 'on_hold' 
                      ? "bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-100" 
                      : "bg-white text-slate-400 border-slate-100 hover:bg-amber-50 hover:text-amber-600 hover:border-amber-100/50"
                  )}
               >
                 قيد المراجعة المطولة
               </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
