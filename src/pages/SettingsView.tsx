import { useState, useMemo } from 'react';
import { AppDatabase, WATemplate } from '../types';
import { 
  Plus, 
  MessageSquare, 
  Eye, 
  Info,
  Smartphone,
  Save,
  MessageCircle,
  Copy,
  ChevronLeft,
  Settings as SettingsIcon,
  User,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface SettingsViewProps {
  db: AppDatabase;
  updateDb: (updates: Partial<AppDatabase>) => void;
}

export function SettingsView({ db, updateDb }: SettingsViewProps) {
  const [activeTab, setActiveTab] = useState(db.templates[0]?.id || 'assess_invite');
  const [isSaving, setIsSaving] = useState(false);
  const [localTemplates, setLocalTemplates] = useState<WATemplate[]>(db.templates);

  const activeTemplate = localTemplates.find(t => t.id === activeTab) || localTemplates[0];

  // Preview state with example data
  const exampleData = {
    name: 'محمد أحمد',
    job: 'مبرمج تطبيقات',
    date: '2026/05/20',
    time: '10:00 صباحاً',
    link: 'https://smarthire.app/q/SAMPLE'
  };

  const previewContent = useMemo(() => {
    let text = activeTemplate?.content || '';
    Object.entries(exampleData).forEach(([key, val]) => {
      // Handle both {key} and {الاسم} style placeholders
      const placeholderMap: Record<string, string> = {
        name: 'الاسم',
        job: 'الوظيفة',
        date: 'التاريخ',
        time: 'الوقت',
        link: 'الرابط'
      };
      
      text = text.replace(new RegExp(`{${key}}`, 'g'), val);
      if (placeholderMap[key]) {
        text = text.replace(new RegExp(`{${placeholderMap[key]}}`, 'g'), val);
      }
    });
    return text;
  }, [activeTemplate]);

  const handleUpdate = (content: string) => {
    const nextTemplates = localTemplates.map(t => 
      t.id === activeTab ? { ...t, content } : t
    );
    setLocalTemplates(nextTemplates);
  };

  const saveAll = () => {
    setIsSaving(true);
    updateDb({ templates: localTemplates });
    setTimeout(() => {
      setIsSaving(false);
      alert('تم حفظ القوالب بنجاح! سيتم استخدام النصوص المحدثة في جميع الرسائل المرسلة.');
    }, 1000);
  };

  const variableMap = [
    { key: 'name', label: 'الاسم' },
    { key: 'job', label: 'الوظيفة' },
    { key: 'date', label: 'التاريخ' },
    { key: 'time', label: 'الوقت' },
    { key: 'link', label: 'الرابط' },
  ];

  return (
    <div className="space-y-8 pb-32">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-[1.25rem] bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-100">
            <SettingsIcon size={24} />
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">إعدادات القوالب الذكية</h2>
            <p className="text-slate-500 text-sm font-bold mt-1 uppercase tracking-wide">التحكم الكامل في رسائل الواتساب والجدولة</p>
          </div>
        </div>
        <button 
          onClick={saveAll}
          className={cn(
            "px-10 py-4 rounded-[1.5rem] font-black text-sm transition-all shadow-xl flex items-center gap-2",
            isSaving 
              ? "bg-emerald-500 text-white shadow-emerald-100" 
              : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100"
          )}
        >
          <Save size={18} />
          {isSaving ? 'يتم الحفظ...' : 'حفظ التغييرات النهائية'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Templates Sidebar */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white/70 backdrop-blur-lg rounded-[2.5rem] border border-white/40 shadow-xl shadow-slate-200/50 overflow-hidden p-3">
            <h3 className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100/50 mb-3">القوالب النشطة</h3>
            <div className="space-y-1">
              {localTemplates.map(t => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={cn(
                    "w-full flex items-center gap-4 px-5 py-4 rounded-[1.5rem] text-sm font-bold text-right transition-all",
                    activeTab === t.id 
                      ? "bg-white text-indigo-700 shadow-lg shadow-indigo-100/20 border border-indigo-100/50" 
                      : "text-slate-500 hover:bg-white/50 hover:text-slate-900"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                    activeTab === t.id ? "bg-indigo-600 text-white" : "bg-slate-100/50 text-slate-400"
                  )}>
                    <MessageSquare size={20} />
                  </div>
                  <span>{t.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-[2.5rem] p-8 text-white space-y-4 shadow-xl shadow-indigo-100 relative overflow-hidden group">
             <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
             <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                <Info size={24} />
             </div>
             <div>
               <h4 className="font-black text-lg">المتغيرات الذكية</h4>
               <p className="text-xs text-indigo-100/80 leading-relaxed mt-1">سيتم استبدال الكلمات بين الأقواس ببيانات المرشح الحقيقية تلقائياً.</p>
             </div>
             <div className="flex flex-wrap gap-2 pt-2">
                {variableMap.map(v => (
                  <span key={v.key} className="bg-white/10 text-[10px] font-black px-3 py-1.5 rounded-xl border border-white/10 backdrop-blur-sm">{"{" + v.label + "}"}</span>
                ))}
             </div>
          </div>
          
          <div className="bg-white/70 backdrop-blur-lg p-6 rounded-3xl border border-white/40 shadow-sm">
             <div className="flex items-center gap-3 text-emerald-600 mb-3">
                <CheckCircle2 size={20} />
                <h4 className="font-bold text-sm">حالة المزامنة</h4>
             </div>
             <p className="text-[10px] text-slate-400 font-bold leading-relaxed">جميع القوالب مرتبطة مباشرة بنظام الإرسال الذكي في قائمة المرشحين.</p>
          </div>
        </div>

        {/* Editor & Preview */}
        <div className="lg:col-span-9 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-10">
            {/* Editor Area */}
            <div className="md:col-span-3 space-y-6">
              <div className="bg-white/70 backdrop-blur-lg p-10 rounded-[3rem] border border-white/40 shadow-xl shadow-slate-200/50 flex flex-col h-full">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="font-black text-slate-900 text-2xl">محرر المحتوى</h3>
                    <p className="text-[10px] text-slate-400 font-black mt-1 uppercase tracking-widest leading-loose">قم بتصميم رسالة {activeTemplate?.name}</p>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="px-3 py-1.5 bg-indigo-50/50 rounded-xl text-[9px] font-black text-indigo-600 uppercase tracking-widest border border-indigo-100">Live Editor v2.0</span>
                  </div>
                </div>
                
                <textarea
                  value={activeTemplate?.content || ''}
                  onChange={(e) => handleUpdate(e.target.value)}
                  className="flex-1 w-full p-8 text-slate-800 text-base font-medium leading-relaxed bg-slate-50/50 border border-slate-100 rounded-[2.5rem] focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all min-h-[400px] shadow-inner"
                  placeholder="اكتب رسالتك لتبهر المرشحين..."
                  dir="rtl"
                />
                
                <div className="mt-8 bg-white/50 backdrop-blur-sm p-6 rounded-3xl border border-white/60">
                   <p className="text-[10px] font-black text-slate-400 mb-4 uppercase tracking-[0.2em] mr-1">إدراج سريع للمتغيرات:</p>
                   <div className="flex gap-2 flex-wrap">
                     {variableMap.map(v => (
                       <button 
                        key={v.key}
                        onClick={() => handleUpdate((activeTemplate?.content || '') + " {" + v.label + "}")}
                        className="px-5 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-black text-slate-600 hover:border-indigo-400 hover:text-indigo-600 hover:shadow-lg transition-all active:scale-95 flex items-center gap-2"
                       >
                         <Plus size={14} className="text-indigo-500" />
                         <span>{v.label}</span>
                       </button>
                     ))}
                   </div>
                </div>
              </div>
            </div>

            {/* Preview Area (Mobile Mockup) */}
            <div className="md:col-span-2 space-y-8 flex flex-col items-center">
              <div className="flex items-center gap-3 self-start mr-2">
                 <div className="w-10 h-10 bg-emerald-50 text-emerald-500 rounded-xl flex items-center justify-center">
                    <Eye size={20} />
                 </div>
                 <h3 className="font-black text-slate-900 text-xl tracking-tight">معاينة المرشح</h3>
              </div>
              
              <div className="relative w-full max-w-[320px] aspect-[9/18.5] bg-slate-900 rounded-[4rem] border-[10px] border-slate-800 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.4)] p-4 flex flex-col group">
                 {/* Top Bar Indicator */}
                 <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-8 bg-slate-800 rounded-b-[2rem] z-20"></div>
                 
                 {/* WhatsApp Style Interface */}
                 <div className="mt-8 flex-1 bg-[#e5ddd5] rounded-[3rem] overflow-hidden flex flex-col relative shadow-inner">
                    <div className="bg-[#075e54] p-5 flex items-center gap-3 shadow-lg">
                       <ChevronLeft className="text-white h-5 w-5 opacity-70" />
                       <div className="w-10 h-10 rounded-full bg-slate-200 border-2 border-white/20 shadow-sm flex items-center justify-center">
                          <User size={22} className="text-slate-400" />
                       </div>
                       <div className="text-white">
                          <p className="font-black text-[12px] tracking-tight">إدارة التوظيف</p>
                          <p className="opacity-60 text-[9px] font-bold">متصل الآن</p>
                       </div>
                    </div>
                    
                    <div className="flex-1 p-5 overflow-y-auto space-y-4 no-scrollbar">
                       <div className="max-w-[95%] bg-white p-5 rounded-[2rem] rounded-tr-none text-[12px] text-slate-800 shadow-xl leading-relaxed self-start relative border border-white/50">
                          <div className="whitespace-pre-wrap font-bold leading-relaxed">{previewContent}</div>
                          <div className="flex items-center justify-end gap-1 text-[9px] text-slate-400 mt-3">
                             <span className="font-bold tabular-nums">12:30 م</span>
                             <div className="flex items-center text-[#34b7f1]">
                                <CheckCircle2 size={12} className="fill-current" />
                             </div>
                          </div>
                       </div>

                       {activeTab === 'assess_invite' && (
                         <div className="w-full bg-white/60 backdrop-blur-sm p-4 rounded-2xl border border-white shadow-sm flex flex-col items-center gap-3">
                            <div className="w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-indigo-100">
                               <Plus size={24} />
                            </div>
                            <p className="text-[10px] font-black text-slate-500 uppercase">بدء الأسئلة التمهيدية</p>
                         </div>
                       )}
                    </div>
                    
                    <div className="p-4 bg-white/95 backdrop-blur-md flex items-center gap-3 border-t border-slate-200/50">
                       <div className="flex-1 h-10 bg-slate-100 rounded-full border border-slate-200/50 shadow-inner"></div>
                       <div className="w-10 h-10 bg-[#128c7e] rounded-full flex items-center justify-center text-white shadow-lg active:scale-90 transition-all cursor-pointer">
                          <Smartphone size={20} />
                       </div>
                    </div>
                 </div>
              </div>
              
              <div className="bg-amber-50 border border-amber-100 p-6 rounded-[2rem] shadow-sm flex gap-4 max-w-[320px]">
                <div className="w-10 h-10 bg-amber-500 text-white rounded-xl grow-0 shrink-0 flex items-center justify-center shadow-lg shadow-amber-100">
                   <AlertCircle size={20} />
                </div>
                <p className="text-[11px] text-amber-700 font-bold leading-relaxed">
                   تأكد من وجود رابط المقابلة أو رابط الأسئلة في القالب لضمان وصول المرشح للمكان الصحيح.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
