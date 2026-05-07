import React, { useState, useEffect, type FC, Suspense } from 'react';
import {
  Calendar,
  Package,
  FileText,
  LayoutDashboard,
  Users,
  Target,
  CheckSquare,
} from 'lucide-react';
import { useLocation, useNavigate, Routes, Route, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from './context/AuthContext';
import { Toaster, toast } from 'sonner';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Layout Components
import { Sidebar } from './components/Layout/Sidebar';
import { Header } from './components/Layout/Header';

// Common Components
import { NotificationSystem } from './components/Notifications/NotificationSystem';
import { AppViewSkeleton } from './components/Common/Skeletons';
import { CommandBar } from './components/Navigation/CommandBar';
import { AICopilot } from './components/Common/AICopilot';
import { ShortcutsModal } from './components/Common/ShortcutsModal';

// View Components
import LoginView from './components/Auth/LoginView';

const queryClient = new QueryClient();

// Lazy Views
const DashboardView = React.lazy(() => import('./components/Dashboard/DashboardView'));
const ContactsView = React.lazy(() => import('./components/Contacts/ContactsView'));
const PipelineView = React.lazy(() => import('./components/Pipeline/PipelineView'));
const TasksView = React.lazy(() => import('./components/Tasks/TasksView'));
const CalendarView = React.lazy(() => import('./components/Calendar/CalendarView'));
const ProductsView = React.lazy(() => import('./components/Products/ProductsView'));
const DocumentsView = React.lazy(() => import('./components/Documents/DocumentsView'));
const SettingsView = React.lazy(() => import('./components/Settings/SettingsView'));
const UsersView = React.lazy(() => import('./components/Users/UsersView'));

type View = 'dashboard' | 'contacts' | 'pipeline' | 'tasks' | 'calendar' | 'products' | 'documents' | 'settings' | 'users';

import { useUI } from './hooks/useUI';

const getViewFromPathname = (pathname: string): View => {
  const normalized = (pathname || '/').split('?')[0].split('#')[0];
  const clean = normalized.replace(/\/+$/, '') || '/';
  if (clean === '/' || clean === '/dashboard') return 'dashboard';
  if (clean === '/contacts' || clean === '/clientes') return 'contacts';
  if (clean === '/pipeline') return 'pipeline';
  if (clean === '/tasks' || clean === '/tareas') return 'tasks';
  if (clean === '/calendar' || clean === '/agenda') return 'calendar';
  if (clean === '/products' || clean === '/productos') return 'products';
  if (clean === '/documents' || clean === '/documentos') return 'documents';
  if (clean === '/users' || clean === '/usuarios') return 'users';
  if (clean === '/settings' || clean === '/ajustes') return 'settings';
  return 'dashboard';
};

const getPathnameFromView = (view: View): string => {
  switch (view) {
    case 'dashboard': return '/';
    case 'contacts': return '/contacts';
    case 'pipeline': return '/pipeline';
    case 'tasks': return '/tasks';
    case 'calendar': return '/calendar';
    case 'products': return '/products';
    case 'documents': return '/documents';
    case 'users': return '/users';
    case 'settings': return '/settings';
    default: return '/';
  }
};

const App: FC = () => {
  const { user, logout, loading } = useAuth();
  const { sidebarCollapsed } = useUI();
  const location = useLocation();
  const navigate = useNavigate();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isCommandBarOpen, setIsCommandBarOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark' ||
      (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  const activeView = getViewFromPathname(location.pathname);

  useEffect(() => {
    const keysPressed = new Set<string>();
    const viewLabels: Record<View, string> = {
      dashboard: 'Panel',
      contacts: 'Clientes',
      pipeline: 'Pipeline',
      tasks: 'Tareas',
      calendar: 'Agenda',
      products: 'Productos',
      documents: 'Documentos',
      users: 'Usuarios',
      settings: 'Ajustes',
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase() || '';
      if (tag === 'input' || tag === 'textarea' || tag === 'select' || target?.isContentEditable) return;
      keysPressed.add(e.key?.toLowerCase() || '');
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandBarOpen(true);
      }
      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        setIsShortcutsOpen(prev => !prev);
      }
      if (keysPressed.has('g')) {
        const viewMap: Record<string, View> = {
          'd': 'dashboard', 'c': 'contacts', 'p': 'pipeline', 't': 'tasks', 'a': 'calendar', 's': 'settings', 'u': 'users'
        };
        const targetView = viewMap[e.key?.toLowerCase() || ''];
        if (targetView) {
          e.preventDefault();
          navigate(getPathnameFromView(targetView), { replace: false });
          toast.info(`Navegando a ${viewLabels[targetView]}`, { duration: 800 });
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => { keysPressed.delete(e.key?.toLowerCase() || ''); };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [navigate]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMobileMenuOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isMobileMenuOpen]);



  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-surface-bg">
        <div className="animate-pulse space-y-4 text-center">
          <div className="w-12 h-12 bg-surface-muted-bg rounded-xl mx-auto" />
          <div className="h-2 w-24 bg-surface-muted-bg rounded mx-auto" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginView />;
  }
  const prefetchView = (viewId: string) => {
    const views: Record<string, () => Promise<unknown>> = {
      dashboard: () => import('./components/Dashboard/DashboardView'),
      contacts: () => import('./components/Contacts/ContactsView'),
      pipeline: () => import('./components/Pipeline/PipelineView'),
      tasks: () => import('./components/Tasks/TasksView'),
      calendar: () => import('./components/Calendar/CalendarView'),
      products: () => import('./components/Products/ProductsView'),
      documents: () => import('./components/Documents/DocumentsView'),
      settings: () => import('./components/Settings/SettingsView'),
      users: () => import('./components/Users/UsersView'),
    };
    views[viewId]?.().catch(() => null);
  };

  const navItems = [
    { id: 'dashboard', label: 'Panel', icon: LayoutDashboard },
    { id: 'contacts', label: 'Clientes', icon: Users },
    { id: 'pipeline', label: 'Pipeline', icon: Target },
    { id: 'tasks', label: 'Tareas', icon: CheckSquare },
    { id: 'calendar', label: 'Agenda', icon: Calendar },
    { id: 'products', label: 'Productos', icon: Package },
    { id: 'documents', label: 'Documentos', icon: FileText },
  ];

  if (user?.role === 'admin') {
    navItems.push({ id: 'users', label: 'Usuarios', icon: Users });
  }

  const getViewLabel = (viewId: View) => {
    if (viewId === 'settings') return 'Ajustes';
    return navItems.find(i => i.id === viewId)?.label || 'Panel';
  };

  return (
    <QueryClientProvider client={queryClient}>
      <div className={`min-h-screen bg-surface-bg font-sans selection:bg-primary-500/30 overflow-x-hidden transition-colors duration-200`}>
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-surface-text/40 backdrop-blur-[1px] z-30 lg:hidden"
            />
          )}
        </AnimatePresence>

        <Sidebar
          navItems={navItems}
          activeView={activeView}
          setActiveView={(v) => navigate(getPathnameFromView(v as View))}
          onLogout={logout}
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
          prefetchView={prefetchView}
        />

        <main className={`flex-1 flex flex-col min-w-0 min-h-screen transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'}`}>
          <Header
            title={getViewLabel(activeView)}
            isDarkMode={isDarkMode}
            setIsDarkMode={setIsDarkMode}
            setIsMobileMenuOpen={setIsMobileMenuOpen}
            setIsNotificationsOpen={setIsNotificationsOpen}
            setIsCommandCenterOpen={setIsCommandBarOpen}
            setIsShortcutsOpen={setIsShortcutsOpen}
            userName={user?.name || 'Usuario'}
          />

          <div className="p-4 lg:p-6 flex-1 w-full max-w-[1600px] mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 3 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.12 }}
              >
                <Suspense fallback={<AppViewSkeleton />}>
                  <Routes>
                    <Route path="/" element={<DashboardView />} />
                    <Route path="/dashboard" element={<Navigate to="/" replace />} />
                    <Route path="/contacts" element={<ContactsView />} />
                    <Route path="/clientes" element={<Navigate to="/contacts" replace />} />
                    <Route path="/pipeline" element={<PipelineView />} />
                    <Route path="/tasks" element={<TasksView />} />
                    <Route path="/tareas" element={<Navigate to="/tasks" replace />} />
                    <Route path="/calendar" element={<CalendarView />} />
                    <Route path="/agenda" element={<Navigate to="/calendar" replace />} />
                    <Route path="/products" element={<ProductsView />} />
                    <Route path="/productos" element={<Navigate to="/products" replace />} />
                    <Route path="/documents" element={<DocumentsView />} />
                    <Route path="/documentos" element={<Navigate to="/documents" replace />} />
                    <Route path="/settings" element={<SettingsView />} />
                    <Route path="/ajustes" element={<Navigate to="/settings" replace />} />
                    <Route path="/users" element={<UsersView />} />
                    <Route path="/usuarios" element={<Navigate to="/users" replace />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </Suspense>
              </motion.div>
            </AnimatePresence>
          </div>
        </main>

        <NotificationSystem isOpen={isNotificationsOpen} onClose={() => setIsNotificationsOpen(false)} />
        <CommandBar
          isOpen={isCommandBarOpen}
          onClose={() => setIsCommandBarOpen(false)}
          onNavigate={(view) => navigate(getPathnameFromView(view as View))}
        />
        <ShortcutsModal isOpen={isShortcutsOpen} onClose={() => setIsShortcutsOpen(false)} />
        <AICopilot />
        <Toaster position="bottom-right" richColors closeButton theme={isDarkMode ? 'dark' : 'light'} />
      </div>
    </QueryClientProvider>
  );
};

export default App;
