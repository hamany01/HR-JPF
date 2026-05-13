import { 
  LayoutDashboard, 
  Briefcase, 
  Users, 
  Settings, 
  ChevronRight, 
  ChevronLeft,
  GraduationCap,
  MessageSquare,
  Command
} from 'lucide-react';
import { cn } from '../lib/utils';

interface SidebarProps {
  isOpen: boolean;
  currentView: string;
  onViewChange: (view: string) => void;
  setIsOpen: (open: boolean) => void;
}

export function Sidebar({ isOpen, currentView, onViewChange, setIsOpen }: SidebarProps) {
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

      <div className="p-2 border-t border-slate-100">
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="w-full h-10 flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-all"
        >
          {isOpen ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>
    </aside>
  );
}
