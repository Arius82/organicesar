import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useLocation, useNavigate, Outlet } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, CheckSquare, Users, Package, ShoppingCart,
  UtensilsCrossed, BarChart3, Trophy, LogOut, Menu, X, ChevronRight, UserCircle
} from 'lucide-react';
import NotificationBell from '@/components/NotificationBell';
import ThemeToggle from '@/components/ThemeToggle';
import InstallBanner from '@/components/InstallBanner';
import { formatCesares } from '@/utils/format';
import logo from '@/assets/logo.png';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, masterOnly: false },
  { path: '/tarefas', label: 'Minhas Tarefas', icon: CheckSquare, masterOnly: false },
  { path: '/usuarios', label: 'Usuários', icon: Users, masterOnly: true },
  { path: '/despensa', label: 'Despensa', icon: Package, masterOnly: false },
  { path: '/compras', label: 'Lista de Compras', icon: ShoppingCart, masterOnly: false },
  { path: '/cardapio', label: 'Cardápio', icon: UtensilsCrossed, masterOnly: false },
  { path: '/relatorios', label: 'Relatórios', icon: BarChart3, masterOnly: true },
  { path: '/recompensas', label: 'Recompensas', icon: Trophy, masterOnly: false },
];

import { useAlarms } from '@/context/AlarmContext';
import { Volume2, VolumeX } from 'lucide-react';

const AppLayout = () => {
  const { currentUser, logout, isMaster } = useApp();
  const { isMuted, toggleMute } = useAlarms();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const filteredNav = navItems.filter(item => !item.masterOnly || isMaster);

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-background via-background to-primary/3">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 gradient-sidebar flex flex-col transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-5 flex items-center gap-3">
          <img src={logo} alt="OrganiCésar" className="w-9 h-9 rounded-xl object-contain" />
          <h1 className="font-display font-bold text-lg text-sidebar-foreground">OrganiCésar</h1>
          <button onClick={() => setSidebarOpen(false)} className="ml-auto lg:hidden text-sidebar-foreground/60">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 space-y-1 mt-2">
          {filteredNav.map(item => {
            const active = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => { navigate(item.path); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  active
                    ? 'bg-sidebar-accent text-sidebar-primary'
                    : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
                }`}
              >
                <item.icon className="w-4.5 h-4.5" />
                {item.label}
                {active && <ChevronRight className="w-3.5 h-3.5 ml-auto" />}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-sm font-bold">
              {currentUser?.nome[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">{currentUser?.nome}</p>
              <p className="text-xs text-sidebar-foreground/50 capitalize">{currentUser?.tipo}</p>
            </div>
          </div>
          <button
            onClick={() => { navigate('/perfil'); setSidebarOpen(false); }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-all"
          >
            <UserCircle className="w-4 h-4" />
            Meu Perfil
          </button>
          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-all"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border px-4 lg:px-6 h-14 flex items-center gap-4">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-foreground">
            <Menu className="w-5 h-5" />
          </button>
          <h2 className="font-display font-semibold text-foreground">
            {filteredNav.find(n => n.path === location.pathname)?.label || 'Dashboard'}
          </h2>
          <div className="ml-auto flex items-center gap-2">
            <button
               onClick={toggleMute}
               className={`p-2 rounded-lg transition-colors ${isMuted ? 'text-destructive bg-destructive/10' : 'text-primary bg-primary/10'}`}
               title={isMuted ? "Sons Silenciados" : "Sons Ativos"}
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
            <ThemeToggle />
            <NotificationBell />
            {currentUser?.tipo === 'simples' && (
              <div className="gradient-reward text-reward-foreground text-xs font-bold px-3 py-1 rounded-full">
                {formatCesares(currentUser.saldo)}
              </div>
            )}
          </div>
        </header>
        <AnimatePresence mode="wait">
          <div key={location.pathname} className="p-4 lg:p-6">
            <Outlet />
          </div>
        </AnimatePresence>
        <InstallBanner />
      </main>
    </div>
  );
};

export default AppLayout;
