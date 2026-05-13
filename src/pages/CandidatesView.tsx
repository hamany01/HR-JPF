import { useState, useMemo } from 'react';
import { AppDatabase, Candidate, Job, CandidateStatus, AppNotification } from '../types';
import { 
  Search, 
  Filter, 
  MoreHorizontal, 
  ExternalLink, 
  Calendar, 
  Mail, 
  Smartphone,
  CheckCircle2,
  AlertCircle,
  FileText,
  UserPlus,
  Send,
  Trash2,
  Clock,
  Users,
  Sparkles,
  ChevronLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import * as XLSX from 'xlsx';

interface CandidatesViewProps {
  db: AppDatabase;
  updateDb: (updates: Partial<AppDatabase>) => void;
  ctx?: { job?: Job };
  onNavigate: (view: string, ctx?: any) => void;
}

export function CandidatesView({ db, updateDb, ctx, onNavigate }: CandidatesViewProps) {
  const [activeJobId, setActiveJobId] = useState<string>(ctx?.job?.id || 'all');
  const [statusFilter, setStatusFilter] = useState<CandidateStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [schedulingCandidate, setSchedulingCandidate] = useState<Candidate | null>(null);

  const bulkSchedule = (selectedJobId: string, startDate: string, duration: number, breakTime: number, meetingLink: string, overwriteExisting: boolean) => {
    if (!selectedJobId || !startDate) return;

    // Filter candidates for the SELECTED JOB
    const targetCandidates = db.candidates.filter(c => {
      const matchJob = c.job_id === selectedJobId;
      if (!matchJob) return false;
      if (overwriteExisting) return true; // Include everyone in the job
      return !c.interview_date; // Only those without date
    });

    if (targetCandidates.length === 0) {
      alert("لا يوجد مرشحين بانتظار الجدولة للوظيفة المختارة.");
      return;
    }

    const startDateTime = new Date(startDate);
    if (isNaN(startDateTime.getTime())) {
      alert("التاريخ المختار غير صالح. يرجى التأكد من اختيار تاريخ ووقت صحيح.");
      return;
    }

    let currentTime = new Date(startDateTime);
    const newNotifications: AppNotification[] = [];
    let queueCounter = 1;
    
    const updatedCandidates = db.candidates.map(c => {
      const isTarget = targetCandidates.find(pc => pc.id === c.id);
      if (isTarget) {
        const interviewDate = currentTime.toISOString();
        const currentQueue = queueCounter++;
        
        // Increment time for next interview
        currentTime = new Date(currentTime.getTime() + (duration + breakTime) * 60000);
        
        const job = db.jobs.find(j => j.id === c.job_id);
        newNotifications.push({
          id: Math.random().toString(36).slice(2, 10),
          title: 'تحديث جدولة (تلقائي)',
          message: `تمت جدولة ${c.name} لوظيفة ${job?.title || 'غير معروفة'} في ${new Date(interviewDate).toLocaleString('ar-SA')} (رقم: #${currentQueue})`,
          type: 'info',
          is_read: false,
          created_at: new Date().toISOString()
        });

        return { 
          ...c, 
          interview_date: interviewDate, 
          meeting_link: meetingLink || c.meeting_link, // Keep old link if new one is empty
          status: 'scheduled' as CandidateStatus,
          queue_number: currentQueue
        };
      }
      return c;
    });

    updateDb({ 
      candidates: updatedCandidates,
      notifications: [...(db.notifications || []), ...newNotifications]
    });
    setIsBulkModalOpen(false);
    alert(`تمت جدولة ${targetCandidates.length} مرشح بنجاح.`);
  };

  const filteredCandidates = useMemo(() => {
    return db.candidates.filter(c => {
      const matchJob = activeJobId === 'all' || c.job_id === activeJobId;
      const matchStatus = statusFilter === 'all' || c.status === statusFilter;
      const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || 
                          c.phone.includes(search);
      return matchJob && matchStatus && matchSearch;
    }).sort((a, b) => {
      // Sort by interview date if both have one
      if (a.interview_date && b.interview_date) {
        return new Date(a.interview_date).getTime() - new Date(b.interview_date).getTime();
      }
      // Put candidates with interview dates first
      if (a.interview_date) return -1;
      if (b.interview_date) return 1;
      return 0;
    });
  }, [db.candidates, activeJobId, statusFilter, search]);

  const activeJob = useMemo(() => 
    activeJobId === 'all' ? null : db.jobs.find(j => j.id === activeJobId),
  [activeJobId, db.jobs]);

  const handleStatusChange = (id: string, status: CandidateStatus) => {
    updateDb({
      candidates: db.candidates.map(c => c.id === id ? { ...c, status } : c)
    });
  };

  const deleteCandidate = (id: string) => {
    if (confirm('حذف هذا المرشح؟')) {
      updateDb({
        candidates: db.candidates.filter(c => c.id !== id)
      });
    }
  };

  const stats = [
    { label: 'الكل', value: db.candidates.filter(c => activeJobId === 'all' || c.job_id === activeJobId).length, id: 'all' },
    { label: 'جديد', value: db.candidates.filter(c => (activeJobId === 'all' || c.job_id === activeJobId) && c.status === 'pending').length, id: 'pending' },
    { label: 'مُجدول', value: db.candidates.filter(c => (activeJobId === 'all' || c.job_id === activeJobId) && c.status === 'scheduled').length, id: 'scheduled' },
    { label: 'أجاب', value: db.candidates.filter(c => (activeJobId === 'all' || c.job_id === activeJobId) && c.status === 'questioned').length, id: 'questioned' },
  ];

  const sendWhatsApp = (candidate: Candidate, type: 'questions' | 'interview' | 'all-in-one') => {
    const job = db.jobs.find(j => j.id === candidate.job_id);
    let message = '';

    // Find template focusing on the ID or the purpose
    const templateId = type === 'questions' ? 'assess_invite' : (type === 'interview' ? 'interview_confirm' : 'all_in_one');
    let template = db.templates.find(t => t.id === templateId);
    
    // Fallback if not found in db.templates (e.g. older DB)
    if (!template) {
      if (type === 'all-in-one') {
        message = `مرحباً ${candidate.name}، يسعدنا اهتمامك بالانضمام لفريقنا في (${job?.title || 'شركتنا'})! 🚀

لقد تم تحديد موعد مقابلتك الشخصية، ويسعدنا مشاركتك التفاصيل والروابط الهامة:

📍 تفاصيل موعدك:
📅 التاريخ: ${candidate.interview_date ? new Date(candidate.interview_date).toLocaleDateString('ar-SA') : '-'}
⏰ الوقت: ${candidate.interview_date ? new Date(candidate.interview_date).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }) : '-'}
🎫 رقمك في الانتظار: #${candidate.queue_number || '-'}

📋 الخطوات المطلوبة:
1️⃣ الأسئلة التمهيدية (يرجى إكمالها الآن وقبل الموعد):
🔗 ${window.location.origin}/?q=${candidate.questions_token}

2️⃣ ساحة الانتظار الذكية (استخدم هذا الرابط وقت المقابلة):
🔗 ${window.location.origin}/?w=${candidate.questions_token}

تمنياتنا لك بكل التوفيق،
فريق إدارة الموارد البشرية`;
      } else if (type === 'questions') {
        message = `مرحباً ${candidate.name}، نود تذكيرك بإكمال الأسئلة التمهيدية لوظيفة (${job?.title}) من خلال الرابط: ${window.location.origin}/?q=${candidate.questions_token}
نتمنى لك التوفيق،
فريق إدارة الموارد البشرية`;
      } else {
        message = `مرحباً ${candidate.name}، تم تأكيد موعد مقابلتك لوظيفة (${job?.title}) في تاريخ ${candidate.interview_date ? new Date(candidate.interview_date).toLocaleDateString('ar-SA') : '-'} الساعة ${candidate.interview_date ? new Date(candidate.interview_date).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }) : '-'}. يمكنك الانضمام عبر الرابط: ${candidate.meeting_link || '-'}
فريق إدارة الموارد البشرية`;
      }
    } else {
      message = template.content;
    }
    
    if (message) {
      // Replace placeholders
      message = message.replace(/{الاسم}|{name}/g, candidate.name)
                      .replace(/{الوظيفة}|{job}/g, job?.title || '')
                      .replace(/{التاريخ}|{date}/g, candidate.interview_date ? new Date(candidate.interview_date).toLocaleDateString('ar-SA') : '')
                      .replace(/{الوقت}|{time}/g, candidate.interview_date ? new Date(candidate.interview_date).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }) : '')
                      .replace(/{الرابط}|{link}/g, type === 'questions' 
                        ? `${window.location.origin}/?q=${candidate.questions_token}`
                        : candidate.meeting_link || '')
                      .replace(/{رقم_الانتظار}/g, String(candidate.queue_number || '-'))
                      .replace(/{رابط_الأسئلة}/g, `${window.location.origin}/?q=${candidate.questions_token}`)
                      .replace(/{رابط_الانتظار}/g, `${window.location.origin}/?w=${candidate.questions_token}`);
    }

    if (!message) {
      alert("خطأ: تعذر العثور على نص القالب. يرجى التأكد من إعدادات القوالب.");
      return;
    }

    const phone = candidate.phone.replace(/\D/g, '');
    const cleanPhone = phone.startsWith('0') ? '966' + phone.substring(1) : phone.startsWith('966') ? phone : '966' + phone;
    
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
    
    updateDb({
      candidates: db.candidates.map(c => c.id === candidate.id ? { 
        ...c, 
        status: type === 'questions' ? (c.status === 'pending' ? 'invited' : c.status) : (c.status === 'scheduled' ? 'link_sent' : c.status),
        [type === 'questions' ? 'invitation_sent_at' : 'link_sent_at']: new Date().toISOString()
      } : c)
    });
  };

    return (
      <div className="space-y-6 pb-20">
      {/* Top Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">إدارة المرشحين</h2>
          <p className="text-slate-500 text-sm mt-1">تتبع كافة المرشحين وحالاتهم في الوقت الفعلي.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button 
            onClick={() => {
              const ws = XLSX.utils.json_to_sheet([
                { 'الاسم': 'أحمد محمد', 'الجوال': '0501234567', 'الإيميل': 'ahmad@example.com' },
                { 'الاسم': 'سارة خالد', 'الجوال': '0555555555', 'الإيميل': 'sara@example.com' }
              ]);
              const wb = XLSX.utils.book_new();
              XLSX.utils.book_append_sheet(wb, ws, "المرشحون");
              XLSX.writeFile(wb, "Sample_Candidates.xlsx");
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-500 rounded-xl font-bold text-xs hover:bg-slate-200 transition-all border border-slate-200"
          >
            <FileText size={14} />
            عينة الملف
          </button>
          <label className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all shadow-sm cursor-pointer">
            <Send size={16} />
            استيراد Excel
            <input type="file" accept=".xlsx, .xls" className="hidden" onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = (e) => {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'binary' });
                const sheet = workbook.Sheets[workbook.SheetNames[0]];
                const json = XLSX.utils.sheet_to_json<any>(sheet);
                
                const newCandidates = json.map(row => ({
                  id: Math.random().toString(36).slice(2, 9),
                  name: row.الاسم || row.Name || '',
                  phone: String(row.الجوال || row.Phone || ''),
                  email: row.الإيميل || row.Email || '',
                  job_id: activeJobId !== 'all' ? activeJobId : (db.jobs.length > 0 ? db.jobs[0].id : ''),
                  status: 'pending' as CandidateStatus,
                  interview_date: null,
                  meeting_link: null,
                  questions_token: Math.random().toString(36).slice(2, 10),
                  invitation_sent_at: null,
                  link_sent_at: null,
                  created_at: new Date().toISOString(),
                  cv_url: ''
                })).filter(c => c.name && c.phone);

                updateDb({ candidates: [...db.candidates, ...newCandidates] });
                alert(`تم استيراد ${newCandidates.length} مرشح بنجاح`);
              };
              reader.readAsBinaryString(file);
            }} />
          </label>

          <button 
            onClick={() => setIsBulkModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-amber-600 text-white rounded-xl font-bold text-sm hover:bg-amber-700 transition-all shadow-lg shadow-amber-100"
          >
            <Calendar size={16} />
            جدولة جماعية
          </button>
          <select 
            value={activeJobId}
            onChange={(e) => setActiveJobId(e.target.value)}
            className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          >
            <option value="all">كافة الوظائف</option>
            {db.jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
          </select>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100"
          >
            <UserPlus size={16} />
            إضافة مرشح
          </button>
        </div>
      </div>

      {/* Session Management */}
      {activeJob && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-[2.5rem] p-8 text-white shadow-xl shadow-indigo-100 flex flex-col md:flex-row items-center justify-between gap-8"
        >
           <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-3xl flex items-center justify-center border border-white/30">
                 <Users size={32} />
              </div>
              <div className="text-right">
                <p className="text-indigo-100 text-[10px] font-black uppercase tracking-[0.2em] mb-1">جلسة المقابلات الحية</p>
                <h3 className="text-2xl font-black">{activeJob.title}</h3>
                <div className="flex items-center gap-4 mt-2">
                   <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                      <span className="text-xs font-bold text-indigo-50">{db.candidates.filter(c => c.job_id === activeJob.id && c.is_online).length} متواجدين الآن</span>
                   </div>
                   <div className="w-px h-4 bg-white/20"></div>
                   <span className="text-xs font-bold text-indigo-50">الرقم الحالي: #{db.sessions[activeJob.id]?.current_queue_number || 0}</span>
                </div>
              </div>
           </div>

           <div className="flex items-center gap-3">
              <button 
                onClick={() => {
                  const session = db.sessions[activeJob.id];
                  updateDb({
                    sessions: {
                      ...db.sessions,
                      [activeJob.id]: {
                        job_id: activeJob.id,
                        current_queue_number: Math.max(0, (session?.current_queue_number || 0) - 1),
                        status: 'active',
                        last_updated: new Date().toISOString()
                      }
                    }
                  });
                }}
                className="p-4 bg-white/10 hover:bg-white/20 rounded-2xl transition-all border border-white/10"
              >
                <ChevronLeft size={20} className="rotate-180" />
              </button>

              <div className="bg-white text-indigo-600 px-10 py-4 rounded-2xl flex flex-col items-center min-w-[200px] shadow-lg">
                 <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300">الاستدعاء القادم</span>
                 <span className="text-2xl font-black tabular-nums">#{ (db.sessions[activeJob.id]?.current_queue_number || 0) + 1 }</span>
              </div>

              <button 
                onClick={() => {
                  const session = db.sessions[activeJob.id];
                  const nextNum = (session?.current_queue_number || 0) + 1;
                  updateDb({
                    sessions: {
                      ...db.sessions,
                      [activeJob.id]: {
                        job_id: activeJob.id,
                        current_queue_number: nextNum,
                        status: 'active',
                        last_updated: new Date().toISOString()
                      }
                    }
                  });
                }}
                className="p-4 bg-white text-indigo-600 hover:bg-slate-50 rounded-2xl transition-all shadow-lg"
              >
                <ChevronLeft size={20} />
              </button>
           </div>
        </motion.div>
      )}

      {/* Filters Hub */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-4">
        <div className="flex-1 flex items-center bg-slate-50 rounded-2xl px-4 py-2 border border-slate-100 focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all w-full md:w-auto">
          <Search size={18} className="text-slate-400" />
          <input 
            type="text" 
            placeholder="بحث بالاسم أو رقم الجوال..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent border-none focus:ring-0 text-sm mr-2 w-full text-slate-700"
          />
        </div>
        
        <div className="h-8 w-px bg-slate-200 hidden md:block"></div>
        
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto no-scrollbar pb-2 md:pb-0">
          {stats.map(s => (
            <button 
              key={s.id}
              onClick={() => setStatusFilter(s.id as any)}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap border",
                statusFilter === s.id 
                  ? "bg-slate-900 text-white border-slate-900" 
                  : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
              )}
            >
              <span className="ml-2">{s.label}</span>
              <span className={cn(
                "px-1.5 py-0.5 rounded-md tabular-nums",
                statusFilter === s.id ? "bg-slate-800" : "bg-slate-100"
              )}>{s.value}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Candidates List */}
      <div className="bg-white/70 backdrop-blur-lg rounded-[2.5rem] border border-white/40 shadow-xl shadow-slate-200/50 overflow-hidden min-h-[500px]">
        {filteredCandidates.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-white/50 border-b border-white/40">
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">المرشح</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">الوظيفة</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">الذكاء الاصطناعي</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">الموعد</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">الأسئلة التمهيدية</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">الحالة</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-left whitespace-nowrap">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/50">
                {filteredCandidates.map((c, i) => {
                  const job = db.jobs.find(j => j.id === c.job_id);
                  const pa = db.preAnswers[c.id];
                  
                  return (
                    <motion.tr 
                      key={c.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="hover:bg-white/40 transition-all group"
                    >
                      <td className="px-8 py-6 whitespace-nowrap">
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-12 h-12 rounded-2xl flex items-center justify-center font-black text-base shadow-sm border border-white",
                            i % 4 === 0 ? "bg-indigo-50 text-indigo-600 border-indigo-100/50" : 
                            i % 4 === 1 ? "bg-blue-50 text-blue-600 border-blue-100/50" : 
                            i % 4 === 2 ? "bg-amber-50 text-amber-600 border-amber-100/50" : 
                            "bg-emerald-50 text-emerald-600 border-emerald-100/50"
                          )}>
                            {c.name.substring(0, 1)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 text-base flex items-center gap-2">
                              {c.name}
                              {c.queue_number && (
                                <span className="text-[9px] bg-slate-900 text-white px-1.5 py-0.5 rounded-md">#{c.queue_number}</span>
                              )}
                              {c.is_online && (
                                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" title="متصل الآن"></span>
                              )}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] font-black text-slate-400 tabular-nums tracking-wider" dir="ltr">{c.phone}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap">
                        <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50/50 border border-indigo-100 px-3 py-1.5 rounded-xl uppercase tracking-wider">
                          {job?.title || 'موظف مفقود'}
                        </span>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap">
                        {db.aiAnalyses?.[c.id] ? (
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
                              <Sparkles size={14} />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-black text-slate-700 tabular-nums">{db.aiAnalyses[c.id].skills_score}%</span>
                              <span className="text-[9px] font-bold text-purple-400">تطابق مهارات</span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-[9px] font-bold text-slate-300 italic">بانتظار التحليل</span>
                        )}
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap">
                        {c.interview_date ? (
                          <div className="flex flex-col">
                            <span className="text-sm font-black text-slate-700 tabular-nums">
                              {new Date(c.interview_date).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em] mt-1">
                              {new Date(c.interview_date).toLocaleDateString('ar-SA', { day: 'numeric', month: 'short' })}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-300 font-bold italic opacity-40">غير مجدول</span>
                        )}
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap">
                        {pa?.is_completed ? (
                          <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100 w-fit">
                            <CheckCircle2 size={16} />
                            <span className="text-[10px] font-black uppercase tracking-wider">مكتملة</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-slate-400 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 w-fit">
                            <Clock size={16} />
                            <span className="text-[10px] font-black uppercase tracking-wider">بانتظار الإجابة</span>
                          </div>
                        )}
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap">
                        <div className="flex">
                          <StatusBadge status={c.status} />
                        </div>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap text-left">
                        <div className="flex items-center justify-end gap-2 group-hover:gap-3 transition-all">
                          <button 
                            onClick={() => onNavigate('interview', { candidate: c, job })}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                          >
                            <FileText size={14} />
                            تقييم المرشح
                          </button>
                          
                          <div className="flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => sendWhatsApp(c, 'all-in-one')}
                              className="w-10 h-10 flex items-center justify-center bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100 hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                              title="إرسال الرسالة الشاملة"
                            >
                              <Smartphone size={16} />
                            </button>
                            <button 
                              onClick={() => sendWhatsApp(c, 'questions')}
                              className="w-10 h-10 flex items-center justify-center bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                              title="إرسال الأسئلة"
                            >
                              <Send size={16} />
                            </button>
                            
                            <button 
                              onClick={() => setSchedulingCandidate(c)}
                              className="w-10 h-10 flex items-center justify-center bg-blue-50 text-blue-600 rounded-xl border border-blue-100 hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                              title="جدولة المقابلة"
                            >
                              <Calendar size={16} />
                            </button>
                          </div>

                          <button onClick={() => deleteCandidate(c.id)} className="w-10 h-10 flex items-center justify-center bg-white border border-red-50 text-red-400 hover:text-red-700 hover:bg-red-50 rounded-xl shadow-sm transition-all shadow-red-100/20">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-24 h-24 bg-slate-50 border border-slate-100 rounded-[2rem] flex items-center justify-center text-slate-200 mb-6">
              <Users size={48} />
            </div>
            <h4 className="text-xl font-black text-slate-900">لا يوجد نتائج للبحث</h4>
            <p className="text-slate-500 text-sm mt-2 max-w-sm mx-auto leading-relaxed">جرب تغيير معايير البحث أو القسم لعرض مجموعات أخرى من المرشحين.</p>
            <button onClick={() => { setSearch(''); setStatusFilter('all'); }} className="mt-8 px-6 py-2 bg-white border border-slate-200 rounded-xl text-xs font-black text-indigo-600 hover:bg-indigo-50 transition-all">إلغاء كافة الفلاتر</button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isAddModalOpen && (
          <AddCandidateModal
            jobs={db.jobs}
            initialJobId={activeJobId !== 'all' ? activeJobId : undefined}
            onClose={() => setIsAddModalOpen(false)}
            onAdd={(candidate) => {
              updateDb({ candidates: [...db.candidates, candidate] });
              setIsAddModalOpen(false);
            }}
          />
        )}
        {schedulingCandidate && (
          <ScheduleModal 
            candidate={schedulingCandidate}
            onClose={() => setSchedulingCandidate(null)}
            onSave={(date, link, qNum) => {
              const job = db.jobs.find(j => j.id === schedulingCandidate.job_id);
              const newNotification: AppNotification = {
                id: Math.random().toString(36).slice(2, 10),
                title: 'تعديل موعد مقابلة',
                message: `تم تعديل موعد ${schedulingCandidate.name} ليصبح في ${new Date(date).toLocaleString('ar-SA')}`,
                type: 'success',
                is_read: false,
                created_at: new Date().toISOString()
              };

              updateDb({
                candidates: db.candidates.map(c => c.id === schedulingCandidate.id ? { 
                  ...c, 
                  interview_date: date, 
                  meeting_link: link,
                  queue_number: qNum,
                  status: 'scheduled'
                } : c),
                notifications: [...(db.notifications || []), newNotification]
              });
              setSchedulingCandidate(null);
            }}
          />
        )}
        {isBulkModalOpen && (
          <BulkScheduleModal 
            jobs={db.jobs}
            initialJobId={activeJobId}
            onClose={() => setIsBulkModalOpen(false)}
            onSave={bulkSchedule}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function ScheduleModal({ candidate, onClose, onSave }: { candidate: Candidate, onClose: () => void, onSave: (date: string, link: string, queueNumber?: number) => void }) {
  const [date, setDate] = useState(candidate.interview_date || '');
  const [link, setLink] = useState(candidate.meeting_link || '');
  const [queueNumber, setQueueNumber] = useState(candidate.queue_number || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8"
      >
        <h2 className="text-xl font-black text-slate-900 mb-6">تعديل الجدولة: {candidate.name}</h2>
        
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">رقم الانتظار</label>
              <input 
                type="number"
                value={queueNumber}
                onChange={e => setQueueNumber(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-slate-800 text-sm focus:outline-none focus:border-indigo-400 font-bold tabular-nums"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">تاريخ ووقت المقابلة</label>
              <input 
                type="datetime-local"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-slate-800 text-sm focus:outline-none focus:border-indigo-400 font-bold"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">رابط الاجتماع المخصص</label>
            <input 
              type="text"
              value={link}
              onChange={e => setLink(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-slate-800 text-sm focus:outline-none focus:border-indigo-400"
              placeholder="رابط الاجتماع..."
              dir="ltr"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-10">
          <button onClick={onClose} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold text-sm hover:bg-slate-200 transition-all">إلغاء</button>
          <button 
            disabled={!date}
            onClick={() => onSave(date, link, queueNumber)}
            className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100"
          >
            حفظ التعديلات
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function BulkScheduleModal({ jobs, initialJobId, onClose, onSave }: { jobs: Job[], initialJobId?: string, onClose: () => void, onSave: (jobId: string, start: string, duration: number, breakTime: number, link: string, overwrite: boolean) => void }) {
  const [jobId, setJobId] = useState(initialJobId !== 'all' ? initialJobId : (jobs.length > 0 ? jobs[0].id : ''));
  const [start, setStart] = useState('');
  const [duration, setDuration] = useState(20);
  const [breakTime, setBreakTime] = useState(5);
  const [link, setLink] = useState('');
  const [overwrite, setOverwrite] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl p-10 overflow-y-auto max-h-[90vh]"
      >
        <div className="flex items-center gap-4 mb-8">
           <div className="w-12 h-12 bg-amber-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-amber-100">
              <Calendar size={24} />
           </div>
           <div>
              <h2 className="text-2xl font-black text-slate-900">جدولة جماعية ذكية</h2>
              <p className="text-slate-500 text-sm font-bold mt-0.5">توزيع المواعيد تلقائياً للمرشحين الجدد</p>
           </div>
        </div>
        
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">تحديد الوظيفة المستهدفة</label>
            <select 
              value={jobId}
              onChange={e => setJobId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-slate-800 text-sm focus:outline-none focus:border-indigo-400 font-bold"
            >
              {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">تاريخ ووقت بدء أول مقابلة</label>
            <input 
              type="datetime-local"
              value={start}
              onChange={e => setStart(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-slate-800 text-sm focus:outline-none focus:border-indigo-400 font-bold"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">مدة المقابلة (دقيقة)</label>
              <input 
                type="number"
                value={duration}
                onChange={e => setDuration(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-slate-800 text-sm focus:outline-none focus:border-indigo-400 font-bold tabular-nums"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">الراحة بين المقابلات (دقيقة)</label>
              <input 
                type="number"
                value={breakTime}
                onChange={e => setBreakTime(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-slate-800 text-sm focus:outline-none focus:border-indigo-400 font-bold tabular-nums"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">رابط الاجتماع الموحد</label>
            <input 
              type="text"
              value={link}
              onChange={e => setLink(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-slate-800 text-sm focus:outline-none focus:border-indigo-400"
              placeholder="رابط Zoom أو Google Meet..."
              dir="ltr"
            />
          </div>

          <div className="flex items-center gap-3 bg-amber-50 p-4 rounded-2xl border border-amber-100">
             <input 
               type="checkbox"
               id="overwrite"
               checked={overwrite}
               onChange={e => setOverwrite(e.target.checked)}
               className="w-5 h-5 rounded-lg text-amber-600 focus:ring-amber-500"
             />
             <label htmlFor="overwrite" className="text-xs font-black text-amber-900 cursor-pointer">
                إعادة جدولة المرشحين المجدولين مسبقاً (مسح المواعيد القديمة)
             </label>
          </div>
        </div>

        <div className="flex gap-4 mt-10">
          <button onClick={onClose} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold text-sm hover:bg-slate-200 transition-all">إلغاء</button>
          <button 
            disabled={!start || !jobId}
            onClick={() => {
              if (jobId && start) {
                onSave(jobId, start, duration, breakTime, link, overwrite);
              }
            }}
            className="flex-1 py-4 bg-amber-600 text-white rounded-2xl font-black text-sm hover:bg-amber-700 transition-all shadow-xl shadow-amber-100 disabled:opacity-50"
          >
            بدء التوزيع التلقائي
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function StatusBadge({ status }: { status: CandidateStatus }) {
  const configs: Record<string, { label: string, color: string }> = {
    pending: { label: 'بانتظار الجدولة', color: 'bg-slate-100 text-slate-600 border-slate-200' },
    scheduled: { label: 'مُجدول', color: 'bg-blue-50 text-blue-700 border-blue-100' },
    invited: { label: 'دُعي', color: 'bg-indigo-50 text-indigo-700 border-indigo-100' },
    link_sent: { label: 'أُرسل الرابط', color: 'bg-amber-50 text-amber-700 border-amber-100' },
    questioned: { label: 'أجاب', color: 'bg-cyan-50 text-cyan-700 border-cyan-100' },
    evaluated: { label: 'تم التقييم', color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
    accepted: { label: 'مقبول', color: 'bg-green-50 text-green-700 border-green-100' },
    rejected: { label: 'مرفوض', color: 'bg-red-50 text-red-700 border-red-100' },
  };

  const config = configs[status] || { label: status, color: 'bg-slate-100 text-slate-600 border-slate-200' };

  return (
    <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap", config.color)}>
      {config.label}
    </span>
  );
}

function AddCandidateModal({ jobs, initialJobId, onClose, onAdd }: { jobs: Job[], initialJobId?: string, onClose: () => void, onAdd: (c: Candidate) => void }) {
  const [form, setForm] = useState<any>({
    name: '',
    phone: '',
    email: '',
    job_id: initialJobId || (jobs.length > 0 ? jobs[0].id : '')
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="bg-white w-full max-w-lg rounded-3xl shadow-2xl p-8"
      >
        <h2 className="text-xl font-black text-slate-900 mb-6">إضافة مرشح جديد</h2>
        
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 mr-1">الاسم الكامل</label>
            <input 
              onChange={e => setForm({...form, name: e.target.value})}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-slate-800 text-sm focus:outline-none focus:border-indigo-400 font-bold" 
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 mr-1">رقم الجوال</label>
              <input 
                onChange={e => setForm({...form, phone: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-slate-800 text-sm focus:outline-none focus:border-indigo-400 tabular-nums" 
                dir="ltr"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 mr-1">البريد الإلكتروني</label>
              <input 
                onChange={e => setForm({...form, email: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-slate-800 text-sm focus:outline-none focus:border-indigo-400" 
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 mr-1">الوظيفة المتقدم لها</label>
            <select 
              value={form.job_id}
              onChange={e => setForm({...form, job_id: e.target.value})}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-slate-800 text-sm focus:outline-none focus:border-indigo-400 font-bold"
            >
              {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
            </select>
          </div>
        </div>

        <div className="flex gap-3 mt-8">
          <button onClick={onClose} className="flex-1 py-3.5 bg-slate-100 text-slate-600 rounded-2xl font-bold text-sm hover:bg-slate-200 transition-all">إلغاء</button>
          <button 
            disabled={!form.name || !form.phone || !form.job_id}
            onClick={() => onAdd({
              ...form,
              id: Math.random().toString(36).slice(2, 9),
              status: 'pending',
              interview_date: null,
              meeting_link: null,
              questions_token: Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4),
              invitation_sent_at: null,
              link_sent_at: null,
              created_at: new Date().toISOString(),
              cv_url: ''
            })}
            className="flex-1 py-3.5 bg-indigo-600 text-white rounded-2xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50"
          >
            إضافة المرشح
          </button>
        </div>
      </motion.div>
    </div>
  );
}
