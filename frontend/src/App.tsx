import React, { useState, useEffect, type FC, Suspense } from 'react';
import {
  Calendar,
  Package,
  FileText,
  LayoutDashboard,
  Users,
  Target,
  CheckSquare,
  BarChart3,
  Settings,
  LogOut,
  Bell,
  Search,
  Moon,
  Sun,
  Zap,
  Menu,
  Command,
  X as CloseIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from './context/AuthContext';
import { Toaster } from 'sonner';
import { Breadcrumbs } from './components/Common/Breadcrumbs';

// Lazy Components
const DashboardView = React.lazy(() => import('./components/Dashboard/DashboardView'));
const ContactsView = React.lazy(() => import('./components/Contacts/ContactsView'));
const PipelineView = React.lazy(() => import('./components/Pipeline/PipelineView'));
const TasksView = React.lazy(() => import('./components/Tasks/TasksView'));
const CalendarView = React.lazy(() => import('./components/Calendar/CalendarView.js'));
const ProductsView = React.lazy(() => import('./components/Products/ProductsView.js'));
const DocumentsView = React.lazy(() => import('./components/Documents/DocumentsView.js'));
const SettingsView = React.lazy(() => import('./components/Settings/SettingsView'));
const UsersView = React.lazy(() => import('./components/Users/UsersView'));
import LoginView from './components/Auth/LoginView';
import { NotificationSystem } from './components/Notifications/NotificationSystem';
import { AppViewSkeleton } from './components/Common/Skeletons';
import { CommandCenter } from './components/Common/CommandCenter';

type View = 'dashboard' | 'contacts' | 'pipeline' | 'tasks' | 'calendar' | 'products' | 'documents' | 'settings' | 'users';

const App: FC = () => {
  const { isAuthenticated, logout, user } = useAuth();
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isCommandCenterOpen, setIsCommandCenterOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark' ||
      (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandCenterOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  if (!isAuthenticated) return <LoginView />;

  const prefetchView = (viewId: string) => {
    switch (viewId) {
      case 'dashboard': import('./components/Dashboard/DashboardView'); break;
      case 'contacts': import('./components/Contacts/ContactsView'); break;
      case 'pipeline': import('./components/Pipeline/PipelineView'); break;
      case 'tasks': import('./components/Tasks/TasksView'); break;
      case 'calendar': import('./components/Calendar/CalendarView.js').catch(() => null); break;
      case 'products': import('./components/Products/ProductsView.js').catch(() => null); break;
      case 'documents': import('./components/Documents/DocumentsView.js').catch(() => null); break;
      case 'settings': import('./components/Settings/SettingsView'); break;
      case 'users': import('./components/Users/UsersView'); break;
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Panel', icon: LayoutDashboard },
    { id: 'contacts', label: 'Clientes', icon: Users },
    { id: 'pipeline', label: 'Ventas', icon: Target },
    { id: 'tasks', label: 'Tareas', icon: CheckSquare },
    { id: 'calendar', label: 'Agenda', icon: Calendar },
    { id: 'products', label: 'Productos', icon: Package },
    { id: 'documents', label: 'Documentos', icon: FileText },
  ];

  if (user?.role === 'admin') {
    navItems.push({ id: 'users', label: 'Usuarios (Admin)', icon: Users });
  }

  const getViewLabel = (viewId: View) => {
    const item = [...navItems, { id: 'settings', label: 'Configuración' }].find(i => i.id === viewId);
    return item?.label || 'Panel';
  };

  return (
    <div className="flex min-h-screen transition-colors duration-300 bg-slate-50 dark:bg-slate-950 overflow-x-hidden">
      {/* Overlay for mobile menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-30 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`
        w-72 bg-slate-900 dark:bg-slate-950 text-slate-400 flex flex-col fixed h-full z-40 transition-all duration-500 
        lg:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-8">
          <div className="flex items-center justify-between mb-12">
            <div className="flex items-center gap-3 text-white">
              <div className="w-12 h-12 bg-primary-600 rounded-2xl flex items-center justify-center shadow-xl shadow-primary-600/30">
                <BarChart3 size={28} />
              </div>
              <div>
                <span className="font-black text-2xl tracking-tighter block leading-none">PyCRM</span>
                <span className="text-[10px] font-bold text-primary-400 uppercase tracking-widest mt-1 block">Enterprise AI</span>
              </div>
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="lg:hidden p-2 text-slate-500 hover:text-white transition-colors"
            >
              <CloseIcon size={24} />
            </button>
          </div>

          <nav className="space-y-3">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveView(item.id as View);
                  setIsMobileMenuOpen(false);
                }}
                onMouseEnter={() => prefetchView(item.id)}
                className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all duration-300 group ${activeView === item.id
                  ? 'bg-primary-600 text-white shadow-xl shadow-primary-600/30'
                  : 'hover:bg-slate-800 dark:hover:bg-slate-900 hover:text-slate-100'
                  }`}
              >
                <item.icon size={22} className={activeView === item.id ? 'text-white' : 'group-hover:text-primary-400'} />
                <span className="font-bold text-sm tracking-tight">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-auto p-8 border-t border-slate-800/50 space-y-3">
          <button
            onClick={() => {
              setActiveView('settings');
              setIsMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all font-bold text-sm group ${activeView === 'settings'
              ? 'bg-primary-600 text-white shadow-xl shadow-primary-600/30'
              : 'hover:bg-slate-800 dark:hover:bg-slate-900 hover:text-slate-100'
              }`}
          >
            <Settings size={22} className={activeView === 'settings' ? 'text-white' : 'group-hover:text-primary-400'} />
            <span>Configuración</span>
          </button>
          <button
            onClick={logout}
            className="w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl text-rose-400 hover:bg-rose-500/10 transition-all font-bold text-sm"
          >
            <LogOut size={22} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 flex flex-col min-w-0 transition-all duration-500 ${isAuthenticated ? 'lg:ml-72' : ''}`}>
        <header className="h-24 glass flex items-center justify-between px-10 sticky top-0 z-10 border-b border-slate-200/50 dark:border-slate-800/50 transition-all duration-300">
          <div className="flex items-center gap-6">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850 transition-all shadow-sm"
            >
              <Menu size={24} />
            </button>

            <div className="hidden sm:block">
              <Breadcrumbs items={[{ label: getViewLabel(activeView) }]} />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div
              onClick={() => setIsCommandCenterOpen(true)}
              className="relative w-[300px] hidden xl:flex group cursor-pointer"
            >
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-primary-500 transition-colors" size={20} />
              <div className="w-full pl-12 pr-4 py-3.5 bg-slate-100 dark:bg-slate-900/50 border border-transparent hover:border-slate-200 dark:hover:border-slate-800 rounded-2xl flex items-center justify-between transition-all">
                <span className="text-sm font-medium text-slate-400 group-hover:text-slate-500">¿Qué estás buscando?</span>
                <div className="flex items-center gap-1 px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm">
                  <Command size={10} className="text-slate-400" />
                  <span className="text-[10px] font-black text-slate-400">K</span>
                </div>
              </div>
            </div>

            {/* Live Cache Indicator */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full mx-2" title="Conexión en tiempo real con servidor">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest flex items-center gap-1">
                <Zap size={12} className="text-emerald-500" />
                Live Cache
              </span>
            </div>

            <div className="flex items-center bg-slate-100 dark:bg-slate-900/50 p-1.5 rounded-2xl border border-slate-200/50 dark:border-slate-800/50">
              <button
                onClick={() => setIsDarkMode(false)}
                className={`p-2 rounded-xl transition-all ${!isDarkMode ? 'bg-white dark:bg-slate-800 shadow-sm text-amber-500' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <Sun size={18} />
              </button>
              <button
                onClick={() => setIsDarkMode(true)}
                className={`p-2 rounded-xl transition-all ${isDarkMode ? 'bg-white dark:bg-slate-800 shadow-sm text-primary-400' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <Moon size={18} />
              </button>
            </div>

            <button
              onClick={() => setIsNotificationsOpen(true)}
              className="p-3 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900/50 rounded-2xl relative transition-all border border-transparent hover:border-slate-200/50 dark:hover:border-slate-800/50"
            >
              <Bell size={22} />
              <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white dark:border-slate-950 animate-pulse"></span>
            </button>

            <div className="h-10 w-px bg-slate-200 dark:bg-slate-800 mx-1"></div>

            <div className="flex items-center gap-4 group cursor-pointer">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-black text-slate-900 dark:text-white leading-none tracking-tight">{user?.name || 'Usuario'}</p>
                <p className="text-[10px] font-black text-primary-600 dark:text-primary-400 uppercase mt-1 tracking-widest">{user?.role || 'Senior Agent'}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-tr from-primary-600 to-indigo-600 rounded-2xl shadow-xl border-2 border-white dark:border-slate-800 group-hover:scale-105 transition-transform duration-300"></div>
            </div>
          </div>
        </header>

        <div className="p-10 flex-1 max-w-[1600px] mx-auto w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: 'circOut' }}
            >
              <Suspense fallback={<AppViewSkeleton />}>
                {activeView === 'dashboard' && <DashboardView />}
                {activeView === 'contacts' && <ContactsView />}
                {activeView === 'pipeline' && <PipelineView />}
                {activeView === 'tasks' && <TasksView />}
                {activeView === 'calendar' && <CalendarView />}
                {activeView === 'products' && <ProductsView />}
                {activeView === 'documents' && <DocumentsView />}
                {activeView === 'users' && <UsersView />}
                {activeView === 'settings' && <SettingsView />}
              </Suspense>
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
      <NotificationSystem
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
      />
      <CommandCenter
        isOpen={isCommandCenterOpen}
        onClose={() => setIsCommandCenterOpen(false)}
        onNavigate={(viewId: string) => setActiveView(viewId as View)}
      />
      <Toaster position="top-right" richColors theme={isDarkMode ? 'dark' : 'light'} />
    </div>
  );
};

export default App;
