import React, { useState } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Sidebar, SidebarContent } from './Sidebar';
import { Wallet, Bell, Search, Menu, X } from 'lucide-react';
import { Input } from '../ui/Input';
import { motion, AnimatePresence } from 'motion/react';

export function AppLayout() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <div className="animate-pulse flex items-center gap-2 text-indigo-400">
          <Wallet className="h-8 w-8" />
          <span className="font-bold text-xl tracking-tight">MoneyFlow<span className="text-indigo-500">Pro</span></span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <div className="flex h-screen bg-[#020617] text-slate-100 overflow-hidden font-sans p-0 sm:p-4 gap-0 sm:gap-4">
      <Sidebar />
      
      {/* Mobile Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-[#020617]/80 backdrop-blur-sm z-40 xl:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              className="fixed inset-y-0 left-0 w-72 p-4 z-50 xl:hidden h-full flex flex-col"
            >
              <div className="absolute top-8 right-8 z-50">
                <button 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1 rounded-full bg-slate-800 text-slate-300 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <SidebarContent onClick={() => setIsMobileMenuOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden gap-0 sm:gap-4">
        {/* Topbar */}
        <header className="h-16 sm:h-20 shrink-0 flex items-center justify-between px-4 sm:px-6 bg-white/5 sm:backdrop-blur-xl border-b sm:border border-white/10 sm:rounded-3xl z-10 sticky top-0">
          <div className="flex items-center gap-2 sm:gap-4">
            <button 
              className="xl:hidden p-2 -ml-2 rounded-xl text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex-1 max-w-md hidden md:block">
              <div className="relative border-l border-white/10 pl-6 ml-2">
                <Search className="absolute left-9 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <Input 
                  placeholder="Rechercher (Ctrl+K)" 
                  className="pl-9 h-10 w-full bg-white/5 border-white/10 focus-visible:ring-1 focus-visible:ring-indigo-500 rounded-xl text-sm"
                />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 ml-auto">
            <button className="relative p-2 rounded-full hover:bg-white/5 transition-colors text-slate-400 hover:text-slate-200">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500 border-2 border-[#020617]" />
            </button>
            <div className="flex items-center gap-3 pl-2 sm:pl-4 border-l border-white/10">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold">{user.displayName || 'Utilisateur'}</p>
                <p className="text-[10px] text-indigo-400 font-bold uppercase">Membre Premium</p>
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-800 border border-white/20 overflow-hidden flex items-center justify-center">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-tr from-indigo-500 to-rose-400 flex items-center justify-center font-bold">
                    {user.email?.[0].toUpperCase() || 'U'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 w-full overflow-y-auto px-4 sm:px-0 py-4 sm:py-0 pb-20 sm:pb-8">
          <div className="max-w-7xl mx-auto space-y-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
