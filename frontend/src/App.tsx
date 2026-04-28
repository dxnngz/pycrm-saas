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

const App: FC = () => {
  const { user, logout, loading } = useAuth();
  const { sidebarCollapsed } = useUI();
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isCommandBarOpen, setIsCommandBarOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark' ||
      (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  useEffect(() => {
    const keysPressed = new Set<string>();

    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.add(e.key?.toLowerCase() || '');
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandBarOpen(true);
      }
      if (keysPressed.has('g')) {
        const viewMap: Record<string, View> = {
          'd': 'dashboard', 'c': 'contacts', 'p': 'pipeline', 't': 'tasks', 'a': 'calendar', 's': 'settings', 'u': 'users'
        };
        const targetView = viewMap[e.key?.toLowerCase() || ''];
        if (targetView) {
          e.preventDefault();
          setActiveView(targetView);
          toast.info(`Navigating to ${targetView}`, { duration: 800 });
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
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);



  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-white dark:bg-slate-950">
        <div className="animate-pulse space-y-4 text-center">
          <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-xl mx-auto" />
          <div className="h-2 w-24 bg-slate-50 dark:bg-slate-900 rounded mx-auto" />
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
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'contacts', label: 'Customers', icon: Users },
    { id: 'pipeline', label: 'Pipeline', icon: Target },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'calendar', label: 'Agency', icon: Calendar },
    { id: 'products', label: 'Inventory', icon: Package },
    { id: 'documents', label: 'Vault', icon: FileText },
  ];

  if (user?.role === 'admin') {
    navItems.push({ id: 'users', label: 'Staff Management', icon: Users });
  }

  const getViewLabel = (viewId: View) => {
    if (viewId === 'settings') return 'Settings';
    return navItems.find(i => i.id === viewId)?.label || 'Dashboard';
  };

  return (
    <QueryClientProvider client={queryClient}>
      <div className={`min-h-screen bg-slate-50 dark:bg-slate-950 font-sans selection:bg-primary-500/30 overflow-x-hidden transition-colors duration-200`}>
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-[1px] z-30 lg:hidden"
            />
          )}
        </AnimatePresence>

        <Sidebar
          navItems={navItems}
          activeView={activeView}
          setActiveView={(v) => setActiveView(v as View)}
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
            userName={user?.name || 'User'}
          />

          <div className="p-4 lg:p-6 flex-1 w-full max-w-[1600px] mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeView}
                initial={{ opacity: 0, y: 3 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.12 }}
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

        <NotificationSystem isOpen={isNotificationsOpen} onClose={() => setIsNotificationsOpen(false)} />
        <CommandBar
          isOpen={isCommandBarOpen}
          onClose={() => setIsCommandBarOpen(false)}
          onNavigate={(view) => setActiveView(view)}
        />
        <AICopilot />
        <Toaster position="bottom-right" richColors closeButton theme={isDarkMode ? 'dark' : 'light'} />
      </div>
    </QueryClientProvider>
  );
};

export default App;
