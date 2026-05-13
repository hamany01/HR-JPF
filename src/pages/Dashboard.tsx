import React from 'react';
import { 
  Users, 
  Briefcase, 
  Calendar, 
  CheckCircle2, 
  ArrowUpRight,
  Clock,
  Activity,
  BarChart3,
  TrendingUp,
  Target
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { motion } from 'motion/react';
import { AppDatabase, CandidateStatus } from '../types';
import { cn } from '../lib/utils';

interface DashboardProps {
  db: AppDatabase;
  onNavigate: (view: string, ctx?: any) => void;
}

export function Dashboard({ db, onNavigate }: DashboardProps) {
  const activeJobs = db.jobs.filter(j => j.status === 'active').length;
  const totalCandidates = db.candidates.length;
  
  // Data for Chart: Candidate Status Distribution
  const statusCounts = {
    pending: db.candidates.filter(c => c.status === 'pending').length,
    scheduled: db.candidates.filter(c => c.status === 'scheduled').length,
    questioned: db.candidates.filter(c => c.status === 'questioned').length,
    evaluated: db.candidates.filter(c => c.status === 'evaluated').length,
    accepted: db.candidates.filter(c => c.status === 'accepted').length,
  };

  const statusData = [
    { name: 'جديدة', value: statusCounts.pending, color: '#94a3b8' },
    { name: 'مجدولة', value: statusCounts.scheduled, color: '#6366f1' },
    { name: 'أجابوا', value: statusCounts.questioned, color: '#f59e0b' },
    { name: 'تم التقييم', value: statusCounts.evaluated, color: '#0ea5e9' },
    { name: 'مقبولين', value: statusCounts.accepted, color: '#10b981' },
  ];

  const stats = [
    { label: 'وظائف نشطة', value: activeJobs, icon: Briefcase, color: 'text-indigo-600', bg: 'bg-indigo-50', trend: '+2' },
    { label: 'إجمالي المرشحين', value: totalCandidates, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', trend: '+12%' },
    { label: 'مقابلات مجدولة', value: statusCounts.scheduled, icon: Calendar, color: 'text-amber-600', bg: 'bg-amber-50', trend: 'نشط' },
    { label: 'توظيف مكتمل', value: statusCounts.accepted, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', trend: 'هدفنا' },
  ];

  const recentCandidates = [...db.candidates]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  const upcomingToday = db.candidates.filter(c => {
    if (!c.interview_date) return false;
    const date = new Date(c.interview_date);
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }).sort((a, b) => new Date(a.interview_date!).getTime() - new Date(b.interview_date!).getTime());

  return (
    <div className="space-y-10 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">لوحة القيادة الذكية</h2>
          <p className="text-slate-500 font-bold mt-2 text-sm uppercase tracking-[0.2em]">تحليلات التوظيف والأداء الفوري</p>
        </div>
        <div className="flex items-center gap-3 bg-white/50 backdrop-blur-md p-2 rounded-2xl border border-white/40 shadow-sm">
          <div className="px-4 py-2 bg-emerald-500/10 text-emerald-600 rounded-xl text-xs font-black flex items-center gap-2">
            <Activity size={14} />
            النظام يعمل بكفاءة
          </div>
          <div className="w-px h-6 bg-slate-200"></div>
          <button 
            onClick={() => onNavigate('jobs')}
            className="px-5 py-2 bg-indigo-600 text-white rounded-xl font-bold text-xs hover:bg-slate-900 transition-all shadow-lg shadow-indigo-100"
          >
            نشر وظيفة
          </button>
        </div>
      </div>

      {/* Upcoming Reminders */}
      {upcomingToday.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-indigo-100 flex flex-col md:flex-row items-center justify-between gap-8"
        >
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white shadow-lg border border-white/30">
              <Clock size={32} />
            </div>
            <div>
              <p className="text-indigo-100 text-[10px] font-black uppercase tracking-[0.2em] mb-1">يوجد لديك {upcomingToday.length} مقابلات اليوم</p>
              <h3 className="text-2xl font-black">أول مقابلة قادمة: {upcomingToday[0].name}</h3>
              <p className="text-indigo-100 text-sm font-bold flex items-center gap-2 mt-1">
                <Calendar size={16} />
                في تمام الساعة {new Date(upcomingToday[0].interview_date!).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
          <button 
            onClick={() => onNavigate('candidates')}
            className="px-8 py-4 bg-white text-indigo-600 rounded-2xl font-black text-sm hover:bg-indigo-50 transition-all shadow-lg whitespace-nowrap"
          >
            عرض الأجندة
          </button>
        </motion.div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white/80 backdrop-blur-lg p-8 rounded-[2.5rem] border border-white/60 shadow-xl shadow-slate-200/50 group hover:shadow-2xl transition-all duration-300"
          >
            <div className="flex items-start justify-between">
              <div className={cn("p-4 rounded-2xl", stat.bg, stat.color)}>
                <stat.icon size={28} />
              </div>
              <span className="text-[10px] font-black text-slate-400 bg-slate-50 px-2.5 py-1 rounded-full uppercase tracking-wider">{stat.trend}</span>
            </div>
            <div className="mt-8">
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">{stat.label}</p>
              <h3 className="text-4xl font-black text-slate-900 mt-2 tabular-nums">{stat.value}</h3>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Recruitment Funnel Chart */}
        <div className="lg:col-span-8 bg-white/70 backdrop-blur-lg p-10 rounded-[3rem] border border-white/40 shadow-2xl shadow-slate-200/50">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="font-black text-slate-900 text-xl">مسار التوظيف</h3>
              <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-widest">توزيع المرشحين حسب الحالة الحالية</p>
            </div>
          </div>
          
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 900 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 900 }}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '15px' }}
                />
                <Bar 
                  dataKey="value" 
                  radius={[12, 12, 12, 12]} 
                  barSize={50}
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution Pie Chart */}
        <div className="lg:col-span-4 bg-white/70 backdrop-blur-lg p-10 rounded-[3rem] border border-white/40 shadow-2xl shadow-slate-200/50 flex flex-col">
          <h3 className="font-black text-slate-900 text-xl mb-2">توزيع الأداء</h3>
          <p className="text-xs text-slate-400 font-bold mb-8 uppercase tracking-widest">نسبة الإنجاز في التوظيف</p>
          
          <div className="flex-1 min-h-[250px] flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-black text-slate-900">{totalCandidates}</span>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">مرشح كلي</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-8">
            {statusData.map((s, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }}></div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">{s.name}</span>
                  <span className="text-sm font-black text-slate-800 tabular-nums">{s.value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white/70 backdrop-blur-lg p-10 rounded-[3rem] border border-white/40 shadow-2xl shadow-slate-200/50">
        <div className="flex items-center justify-between mb-8">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100">
                 <TrendingUp size={24} />
              </div>
              <h3 className="font-black text-slate-900 text-xl">آخر المرشحين</h3>
           </div>
           <button 
             onClick={() => onNavigate('candidates')}
             className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all"
           >
             كل المرشحين
           </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">المرشح</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">الوظيفة</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">التاريخ</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {recentCandidates.map((c) => {
                const job = db.jobs.find(j => j.id === c.job_id);
                return (
                  <tr key={c.id} className="group hover:bg-slate-50/50 transition-all">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 font-black text-xs">
                            {c.name.substring(0, 1)}
                         </div>
                         <span className="font-bold text-slate-800">{c.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-xs font-bold text-slate-500">{job?.title}</span>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-[10px] font-black text-slate-400 tabular-nums">
                        {new Date(c.created_at).toLocaleDateString('ar-SA')}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <StatusBadge status={c.status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: CandidateStatus }) {
  const configs: Record<string, { label: string, color: string }> = {
    pending: { label: 'جديد', color: 'bg-slate-100 text-slate-600 border-slate-200' },
    scheduled: { label: 'مجدول', color: 'bg-blue-50 text-blue-700 border-blue-100' },
    invited: { label: 'دعي', color: 'bg-indigo-50 text-indigo-700 border-indigo-100' },
    questioned: { label: 'أجاب', color: 'bg-amber-50 text-amber-700 border-amber-100' },
    evaluated: { label: 'تم التقييم', color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
    accepted: { label: 'مقبول', color: 'bg-green-50 text-green-700 border-green-100' },
    rejected: { label: 'مرفوض', color: 'bg-red-50 text-red-700 border-red-100' },
  };

  const config = configs[status] || { label: status, color: 'bg-slate-100 text-slate-600 border-slate-200' };

  return (
    <span className={cn("text-[10px] font-black px-3 py-1 rounded-full border shadow-sm uppercase tracking-wider", config.color)}>
      {config.label}
    </span>
  );
}
