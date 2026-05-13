import { useState } from 'react';
import { AppDatabase, Job } from '../types';
import { 
  Plus, 
  Search, 
  MoreVertical, 
  MapPin, 
  Clock, 
  UserPlus,
  Edit,
  Trash2,
  Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface JobsViewProps {
  db: AppDatabase;
  updateDb: (updates: Partial<AppDatabase>) => void;
  onNavigate: (view: string, ctx?: any) => void;
}

export function JobsView({ db, updateDb, onNavigate }: JobsViewProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);

  const handleDelete = (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذه الوظيفة؟ سيعتبر كافة المرشحين لها كأنهم بلا وظيفة.')) {
      updateDb({ 
        jobs: db.jobs.filter(j => j.id !== id),
        candidates: db.candidates.filter(c => c.job_id !== id)
      });
    }
  };

  const activeJobs = db.jobs.filter(j => j.status === 'active');
  const otherJobs = db.jobs.filter(j => j.status !== 'active');

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">إدارة الوظائف</h2>
          <p className="text-slate-500 text-sm mt-1">عرض وتحرير كافة الفرص الوظيفية المتاحة.</p>
        </div>
        <button 
          onClick={() => { setEditingJob(null); setIsModalOpen(true); }}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
        >
          <Plus size={18} />
          إضافة وظيفة جديدة
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {activeJobs.length > 0 ? (
            <div className="space-y-4">
              <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest px-1">الوظائف النشطة</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeJobs.map((job) => (
                  <JobCard 
                    key={job.id} 
                    job={job} 
                    candidateCount={db.candidates.filter(c => c.job_id === job.id).length}
                    onEdit={(j) => { setEditingJob(j); setIsModalOpen(true); }}
                    onDelete={() => handleDelete(job.id)}
                    onViewCandidates={() => onNavigate('candidates', { job })}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white p-12 text-center rounded-3xl border border-slate-200 border-dashed">
              <p className="text-slate-400 font-bold">لا يوجد وظائف نشطة حالياً.</p>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="text-indigo-600 font-bold mt-2 hover:underline"
              >
                ابدأ بنشر وظيفتك الأولى الآن
              </button>
            </div>
          )}

          {otherJobs.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest px-1">مسودات ومؤرشفة</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-75">
                {otherJobs.map((job) => (
                  <JobCard 
                    key={job.id} 
                    job={job} 
                    candidateCount={db.candidates.filter(c => c.job_id === job.id).length}
                    onEdit={(j) => { setEditingJob(j); setIsModalOpen(true); }}
                    onDelete={() => handleDelete(job.id)}
                    onViewCandidates={() => onNavigate('candidates', { job })}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="font-black text-slate-800 mb-4">نصائح للنشر</h3>
            <div className="space-y-4 text-sm leading-relaxed text-slate-600">
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">1</div>
                <p>اكتب مسمى وظيفي واضح يجذب المرشحين بدقة.</p>
              </div>
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">2</div>
                <p>حدد المتطلبات بدقة لتقليل احتمالية جذب مرشحين غير مناسبين.</p>
              </div>
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">3</div>
                <p>استخدم الأسئلة التمهيدية (10 دقائق) لفرز المرشحين تقنياً قبل المقابلة.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <JobFormModal 
            existing={editingJob} 
            onClose={() => setIsModalOpen(false)} 
            onSave={(jobData) => {
              const now = new Date().toISOString();
              const newJob: Job = {
                ...jobData,
                id: editingJob?.id || Math.random().toString(36).slice(2, 9),
                created_at: editingJob?.created_at || now,
                updated_at: now
              };
              
              if (editingJob) {
                updateDb({ jobs: db.jobs.map(j => j.id === newJob.id ? newJob : j) });
              } else {
                updateDb({ jobs: [...db.jobs, newJob] });
              }
              setIsModalOpen(false);
            }} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

interface JobCardProps {
  job: Job;
  candidateCount: number;
  onEdit: (j: Job) => void;
  onDelete: () => void;
  onViewCandidates: () => void;
  key?: string | number;
}

function JobCard({ job, candidateCount, onEdit, onDelete, onViewCandidates }: JobCardProps) {
  return (
    <div className="bg-white/70 backdrop-blur-lg p-6 rounded-[2rem] border border-white/60 shadow-xl shadow-slate-200/50 hover:shadow-2xl transition-all group relative overflow-hidden">
      <div className="flex justify-between items-start mb-5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-100 group-hover:scale-105 transition-transform">
            {job.title.substring(0, 1)}
          </div>
          <div>
            <h4 className="font-bold text-slate-800 text-base group-hover:text-indigo-700 transition-colors">{job.title}</h4>
            <div className="flex items-center gap-2 text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1.5">
              <span className="flex items-center gap-1.5"><MapPin size={12} className="text-indigo-400" /> {job.department}</span>
            </div>
          </div>
        </div>
        <StatusTag status={job.status} />
      </div>

      <div className="flex items-center justify-between pt-5 border-t border-slate-100/50">
        <div className="flex items-center gap-2 text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100">
          <UserPlus size={16} />
          <span className="text-sm font-black tabular-nums">{candidateCount}</span>
          <span className="text-[9px] font-black uppercase tracking-widest mr-1">مرشح</span>
        </div>
        
        <div className="flex items-center gap-2 transition-all">
          <button onClick={() => onViewCandidates()} className="px-4 py-2 text-xs font-black text-slate-600 hover:text-indigo-600 hover:bg-white rounded-xl border border-slate-100 shadow-sm transition-all bg-white">المرشحون</button>
          <button onClick={() => onEdit(job)} className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-white border border-slate-100 rounded-xl shadow-sm transition-all bg-white"><Edit size={16} /></button>
          <button onClick={() => onDelete()} className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-white border border-slate-100 rounded-xl shadow-sm transition-all bg-white"><Trash2 size={16} /></button>
        </div>
      </div>
    </div>
  );
}

function StatusTag({ status }: { status: string }) {
  const c: Record<string, string> = {
    active: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    draft: 'bg-slate-100 text-slate-500 border-slate-200',
    paused: 'bg-amber-50 text-amber-600 border-amber-100',
    closed: 'bg-red-50 text-red-600 border-red-100',
  };
  const labels: Record<string, string> = {
    active: 'نشط', draft: 'مسودة', paused: 'موقوفة', closed: 'مغلقة'
  };

  return (
    <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", c[status])}>
      {labels[status]}
    </span>
  );
}

function JobFormModal({ existing, onClose, onSave }: { existing: Job | null, onClose: () => void, onSave: (data: any) => void }) {
  const [form, setForm] = useState<any>(existing || {
    title: '', department: '', description: '', requirements: '',
    criteria: [
      "مهارات التواصل والتعبير", "الخبرة العملية", "المؤهل العلمي", 
      "الشخصية والثقة", "الدافعية والطموح", "المهارات التقنية",
      "العمل الجماعي", "التفكير النقدي", "الالتزام", "التناسب الثقافي"
    ],
    questions: [
      "لماذا تتقدم لهذه الوظيفة؟", "ما هو أكبر تحدي مهني واجهته؟", "ما الذي يميزك عن الآخرين؟"
    ],
    status: 'active'
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <h2 className="text-xl font-black text-slate-900">{existing ? 'تعديل الوظيفة' : 'إضافة وظيفة جديدة'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold">إلغاء</button>
        </div>

        <div className="p-8 overflow-y-auto space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 mr-1">المسمى الوظيفي</label>
              <input 
                defaultValue={form.title} 
                onChange={e => setForm({...form, title: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all font-bold" 
                placeholder="مثال: مطور تطبيقات React"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 mr-1">القسم</label>
              <input 
                defaultValue={form.department} 
                onChange={e => setForm({...form, department: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-slate-800 text-sm focus:outline-none focus:border-indigo-400 transition-all" 
                placeholder="مثال: التقنية"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 mr-1">وصف الوظيفة</label>
            <textarea 
              defaultValue={form.description} 
              onChange={e => setForm({...form, description: e.target.value})}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-slate-800 text-sm min-h-[100px] resize-none focus:outline-none focus:border-indigo-400 transition-all" 
              placeholder="اكتب هنا ملخصاً عاماً عن الوظيفة والمسؤوليات..."
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 mr-1">حالة الوظيفة</label>
            <select 
              defaultValue={form.status}
              onChange={e => setForm({...form, status: e.target.value})}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-slate-800 text-sm focus:outline-none focus:border-indigo-400 transition-all font-bold"
            >
              <option value="active">نشطة</option>
              <option value="draft">مسودة</option>
              <option value="paused">موقوفة</option>
              <option value="closed">مغلقة</option>
            </select>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest">معايير التقييم (اضغط للحذف، أضف بالأسفل)</label>
            </div>
            <div className="flex flex-wrap gap-2">
              {form.criteria.map((c: string, idx: number) => (
                <button 
                  key={idx}
                  onClick={() => {
                    const newCriteria = [...form.criteria];
                    newCriteria.splice(idx, 1);
                    setForm({...form, criteria: newCriteria});
                  }}
                  className="px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-100 rounded-xl text-[10px] font-bold hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all"
                >
                  {c} ×
                </button>
              ))}
              <input 
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const val = (e.target as HTMLInputElement).value;
                    if (val) {
                      setForm({...form, criteria: [...form.criteria, val]});
                      (e.target as HTMLInputElement).value = '';
                    }
                  }
                }}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-[10px] focus:outline-none focus:border-indigo-400"
                placeholder="+ إضافة معيار..."
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest">الأسئلة التمهيدية للمرشح</label>
            </div>
            <div className="space-y-2">
              {form.questions.map((q: string, idx: number) => (
                <div key={idx} className="flex gap-2">
                  <input 
                    value={q}
                    onChange={(e) => {
                      const newQuestions = [...form.questions];
                      newQuestions[idx] = e.target.value;
                      setForm({...form, questions: newQuestions});
                    }}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-800"
                  />
                  <button 
                    onClick={() => {
                      const newQuestions = [...form.questions];
                      newQuestions.splice(idx, 1);
                      setForm({...form, questions: newQuestions});
                    }}
                    className="p-2 text-red-400 hover:bg-red-50 rounded-xl"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              <button 
                onClick={() => setForm({...form, questions: [...form.questions, '']})}
                className="w-full py-2 bg-slate-50 border border-slate-200 border-dashed rounded-xl text-xs font-bold text-slate-400 hover:text-indigo-600 hover:border-indigo-200 transition-all"
              >
                + إضافة سؤال جديد
              </button>
            </div>
          </div>
        </div>

        <div className="px-8 py-6 border-t border-slate-100 flex gap-3 sticky bottom-0 bg-white">
          <button 
            disabled={!form.title}
            onClick={() => onSave(form)}
            className="flex-1 py-3.5 bg-indigo-600 text-white rounded-2xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50"
          >
            حفظ البيانات
          </button>
        </div>
      </motion.div>
    </div>
  );
}
