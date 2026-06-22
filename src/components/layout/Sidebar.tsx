import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, PieChart, Wallet, CreditCard, ArrowRightLeft, Target, Settings, LogOut, ShieldAlert, BarChart3 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../lib/utils';
import { motion } from 'motion/react';

const NAV_ITEMS = [
  { name: 'Dashboard', path: '/', icon: Home },
  { name: 'Transactions', path: '/transactions', icon: ArrowRightLeft },
  { name: 'Statistiques', path: '/stats', icon: BarChart3 },
  { name: 'Budgets', path: '/budgets', icon: PieChart },
  { name: 'Comptes', path: '/accounts', icon: Wallet },
  { name: 'Cartes', path: '/cards', icon: CreditCard },
  { name: 'Objectifs', path: '/goals', icon: Target },
];

export function SidebarContent({ onClick }: { onClick?: () => void }) {
  const { signOut, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
    onClick?.();
  };

  return (
    <div className="flex flex-col flex-1 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden p-6 w-full h-full">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white shrink-0">
          <Wallet className="h-6 w-6" />
        </div>
        <span className="font-bold text-xl text-white tracking-tight">MoneyFlow <span className="text-indigo-400">Pro</span></span>
      </div>

      <nav className="flex-1 overflow-y-auto space-y-2">
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          onClick={onClick}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
              isActive 
                ? "bg-white/10 text-white" 
                : "text-slate-400 hover:bg-white/5 hover:text-white"
            )
          }
        >
          <item.icon className="h-5 w-5" />
          {item.name}
        </NavLink>
      ))}

      {isAdmin && (
        <div className="pt-6 mt-6 border-t border-white/10">
          <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Administration</p>
          <NavLink
            to="/admin"
            onClick={onClick}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 text-rose-400 hover:bg-rose-500/10",
                isActive && "bg-rose-500/10 text-rose-400"
              )
            }
          >
            <ShieldAlert className="h-5 w-5" />
            Admin Center
          </NavLink>
        </div>
      )}
      </nav>

      <div className="mt-auto pt-6 border-t border-white/10">
        <NavLink 
          to="/settings"
          onClick={onClick}
          className={({ isActive }) => cn(
            "flex items-center gap-3 p-3 w-full rounded-xl text-sm font-medium transition-all duration-200",
            isActive 
              ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20" 
              : "text-slate-400 hover:bg-white/5 hover:text-white"
          )}
        >
          <Settings className="h-5 w-5" />
          Paramètres
        </NavLink>
        <button 
          onClick={handleSignOut}
          className="flex items-center gap-3 p-3 w-full mt-1 rounded-xl text-sm font-medium text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 transition-colors"
        >
          <LogOut className="h-5 w-5" />
          Déconnexion
        </button>
      </div>
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className="w-64 hidden xl:flex flex-col shrink-0 gap-4 h-full">
      <SidebarContent />
    </aside>
  );
}
