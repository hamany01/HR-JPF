import { 
  LayoutDashboard, 
  Briefcase, 
  Users, 
  Settings, 
  ChevronRight, 
  ChevronLeft,
  GraduationCap,
  MessageSquare,
  Command,
  LogOut,
  User as UserIcon,
  ShieldAlert
} from 'lucide-react';
import { cn } from '../lib/utils';
import { User } from 'firebase/auth';

interface SidebarProps {
  isOpen: boolean;
  currentView: string;
  onViewChange: (view: string) => void;
  setIsOpen: (open: boolean) => void;
  user?: User | null;
  onLogOut?: () => void;
}

export function Sidebar({ isOpen, currentView, onViewChange, setIsOpen, user, onLogOut }: SidebarProps) {
  const items = [
    { id: 'dashboard', label: 'الرئيسية', icon: LayoutDashboard },
    { id: 'jobs', label: 'الوظائف', icon: Briefcase },
    { id: 'candidates', label: 'المرشحون', icon: Users },
    { id: 'templates', label: 'قوالب الرسائل', icon: MessageSquare },
    { id: 'settings', label: 'إعدادات المنصة', icon: Command },
  ];

  return (
    <aside 
      className={cn(
        "transition-all duration-300 flex flex-col z-40 frosted-sidebar",
        isOpen ? "w-64" : "w-16"
      )}
    >
      <div className="h-16 flex items-center px-4 border-b border-white/40 shrink-0">
        <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-indigo-100">
          <GraduationCap size={22} />
        </div>
        {isOpen && (
          <span className="mr-3 font-bold bg-clip-text text-transparent bg-gradient-to-l from-indigo-600 to-slate-900 text-lg tracking-tight">SmartHire Pro</span>
        )}
      </div>

      <nav className="flex-1 py-6 px-2 space-y-1 overflow-y-auto">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group",
              currentView === item.id 
                ? "bg-indigo-50 text-indigo-700" 
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
            )}
          >
            <item.icon size={20} className={cn(
              "shrink-0",
              currentView === item.id ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600"
            )} />
            {isOpen && <span>{item.label}</span>}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-100 space-y-2">
        {user && isOpen && (
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 mb-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="" className="w-full h-full rounded-full" />
                ) : (
                  <UserIcon size={14} />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black text-slate-800 truncate">{user.displayName || 'مدير النظام'}</p>
                <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
              </div>
            </div>
            <button 
              onClick={onLogOut}
              className="w-full mt-3 flex items-center justify-center gap-2 py-2 px-3 bg-white text-red-500 text-[10px] font-black rounded-xl border border-red-50 hover:bg-red-50 transition-all"
            >
              <LogOut size={12} />
              <span>تسجيل الخروج</span>
            </button>
          </div>
        )}
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="w-full h-10 flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-all font-black text-[10px]"
        >
          {isOpen ? (
             <div className="flex items-center gap-2">
               <ChevronRight size={20} />
               <span>طي القائمة</span>
             </div>
          ) : <ChevronLeft size={20} />}
        </button>
      </div>
    </aside>
  );
}
