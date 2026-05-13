import { useState } from 'react';
import React from 'react';
import { Menu, Bell, Search, User as UserIcon, X, Trash2, Calendar, Info, CheckCircle, AlertTriangle } from 'lucide-react';
import { Job, AppDatabase, AppNotification } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

import { User } from 'firebase/auth';

interface HeaderProps {
  view: string;
  job?: Job;
  db: AppDatabase;
  updateDb: (updates: Partial<AppDatabase>) => void;
  onToggleSidebar: () => void;
  user?: User | null;
}

export function Header({ view, job, db, updateDb, onToggleSidebar, user }: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const unreadCount = db.notifications?.filter(n => !n.is_read).length || 0;

  const titles: Record<string, string> = {
    dashboard: 'لوحة التحكم',
    jobs: 'إدارة الوظائف',
    candidates: 'قائمة المرشحين',
    interview: 'تقييم المقابلة',
    settings: 'إعدادات الرسائل',
  };

  const markAllAsRead = () => {
    updateDb({
      notifications: db.notifications.map(n => ({ ...n, is_read: true }))
    });
  };

  const clearAllNotifications = () => {
    updateDb({ notifications: [] });
    setShowNotifications(false);
  };

  const deleteNotification = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    updateDb({
      notifications: db.notifications.filter(n => n.id !== id)
    });
  };

  const markAsRead = (id: string) => {
    updateDb({
      notifications: db.notifications.map(n => n.id === id ? { ...n, is_read: true } : n)
    });
  };

  const getIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'success': return <CheckCircle size={16} className="text-emerald-500" />;
      case 'warning': return <AlertTriangle size={16} className="text-amber-500" />;
      case 'error': return <AlertTriangle size={16} className="text-red-500" />;
      default: return <Info size={16} className="text-blue-500" />;
    }
  };

  return (
    <header className="h-16 frosted-header px-4 md:px-8 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <button 
          onClick={onToggleSidebar}
          className="p-2 hover:bg-white/80 rounded-lg text-slate-500 lg:hidden transition-colors"
        >
          <Menu size={20} />
        </button>
        <div>
          <h1 className="font-bold text-slate-800 text-lg">
            {titles[view] || 'الصفحة الرئيسية'}
            {job && <span className="text-slate-400 font-normal mr-2">/ {job.title}</span>}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        <div className="hidden md:flex items-center bg-white/50 backdrop-blur-sm rounded-full px-3 py-1.5 border border-white/60">
          <Search size={16} className="text-slate-400" />
          <input 
            type="text" 
            placeholder="بحث سريع..." 
            className="bg-transparent border-none focus:ring-0 text-sm mr-2 w-48 text-slate-600 placeholder:text-slate-400"
          />
        </div>
        
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className={cn(
              "p-2 rounded-full transition-all relative",
              showNotifications ? "bg-indigo-50 text-indigo-600" : "text-slate-400 hover:text-indigo-600 hover:bg-white/80"
            )}
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-4 h-4 bg-red-500 text-white text-[8px] font-black flex items-center justify-center rounded-full border-2 border-white shadow-sm animate-bounce">
                {unreadCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {showNotifications && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowNotifications(false)}
                />
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute left-0 mt-3 w-80 md:w-96 bg-white rounded-[2rem] shadow-2xl border border-slate-100 z-50 overflow-hidden"
                >
                  <div className="p-5 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                    <h4 className="font-black text-slate-800 text-sm flex items-center gap-2">
                       مركز التنبيهات
                       {unreadCount > 0 && <span className="px-2 py-0.5 bg-indigo-100 text-indigo-600 rounded-full text-[10px]">{unreadCount} جديد</span>}
                    </h4>
                    <div className="flex gap-2">
                      <button onClick={markAllAsRead} className="text-[10px] font-bold text-slate-400 hover:text-indigo-600 transition-colors">قراءة الكل</button>
                      <button onClick={clearAllNotifications} className="text-[10px] font-bold text-slate-400 hover:text-red-600 transition-colors">حذف الكل</button>
                    </div>
                  </div>

                  <div className="max-h-[400px] overflow-y-auto">
                    {db.notifications?.length > 0 ? (
                      <div className="divide-y divide-slate-50">
                        {db.notifications.slice().reverse().map(n => (
                          <div 
                            key={n.id} 
                            onClick={() => markAsRead(n.id)}
                            className={cn(
                              "p-4 transition-all cursor-pointer group hover:bg-slate-50 relative",
                              !n.is_read && "bg-indigo-50/30"
                            )}
                          >
                            <div className="flex gap-3">
                              <div className={cn(
                                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border",
                                n.type === 'success' ? "bg-emerald-50 border-emerald-100" :
                                n.type === 'warning' ? "bg-amber-50 border-amber-100" :
                                n.type === 'error' ? "bg-red-50 border-red-100" : "bg-blue-50 border-blue-100"
                              )}>
                                {getIcon(n.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-black text-slate-800 text-xs truncate mb-1">{n.title}</p>
                                <p className="text-[11px] text-slate-500 leading-relaxed font-medium line-clamp-2">{n.message}</p>
                                <div className="flex items-center gap-2 mt-2">
                                  <span className="text-[9px] font-bold text-slate-300 flex items-center gap-1">
                                    <Calendar size={10} />
                                    {new Date(n.created_at).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                  {!n.is_read && <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></span>}
                                </div>
                              </div>
                              <button 
                                onClick={(e) => deleteNotification(n.id, e)}
                                className="opacity-0 group-hover:opacity-100 p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-20 text-center flex flex-col items-center">
                        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-200 mb-4">
                          <Bell size={32} />
                        </div>
                        <p className="text-xs font-bold text-slate-400">لا توجد تنبيهات حالياً</p>
                      </div>
                    )}
                  </div>

                  {db.notifications?.length > 0 && (
                     <div className="p-3 bg-slate-50/50 border-t border-slate-50 text-center">
                        <button className="text-[10px] font-black text-indigo-600 hover:underline">عرض كافة التنبيهات</button>
                     </div>
                  )}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
        
        <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block"></div>
        
        <div className="flex items-center gap-3 pl-2 group cursor-pointer transition-all">
          <div className="hidden sm:block text-right">
            <p className="text-xs font-black text-slate-800 leading-none truncate max-w-[120px]">
              {user?.displayName || 'مدير النظام'}
            </p>
            <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider font-bold">إدارة الموارد البشرية</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 shadow-sm flex items-center justify-center text-slate-400 group-hover:text-indigo-600 transition-all overflow-hidden relative">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
            ) : (
              <UserIcon size={20} />
            )}
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white"></div>
          </div>
        </div>
      </div>
    </header>
  );
}
