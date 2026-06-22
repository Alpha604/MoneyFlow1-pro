import React from 'react';
import { Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Wallet, ShieldCheck, Mail, Lock, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Login() {
  const { user, signInWithGoogle, userDisabled } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  if (user && !userDisabled) {
    return <Navigate to={from} replace />;
  }

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle();
      // Only navigate if not disabled (the observer in context handles it, but just in case)
      if (!userDisabled) {
        navigate(from, { replace: true });
      }
    } catch (error) {
      console.error("Google sign-in error", error);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-indigo-900/20 blur-[120px] rounded-full mix-blend-screen" />
        <div className="absolute top-[40%] -right-[10%] w-[40%] h-[60%] bg-teal-900/20 blur-[120px] rounded-full mix-blend-screen" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sm:mx-auto sm:w-full sm:max-w-md z-10"
      >
        <div className="flex justify-center flex-col items-center">
          <div className="h-16 w-16 bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center shadow-xl mb-6">
            <Wallet className="h-8 w-8 text-indigo-400" />
          </div>
          <h2 className="text-center text-3xl font-extrabold text-white tracking-tight">
            MoneyFlow<span className="text-indigo-500">Pro</span>
          </h2>
          <p className="mt-2 text-center text-sm text-slate-400">
            Votre patrimoine, propulsé par l'IA.
          </p>
        </div>

        <div className="mt-8 bg-white/5 backdrop-blur-xl py-8 px-4 shadow-2xl sm:rounded-3xl sm:px-10 border border-white/10">
            <AnimatePresence>
              {userDisabled && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl flex items-start gap-3 overflow-hidden"
                >
                  <AlertTriangle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-medium text-rose-400">Compte suspendu</h3>
                    <p className="text-xs text-rose-500/80 mt-1">
                      Votre compte a été désactivé par un administrateur. Veuillez contacter le support pour plus d'informations.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-300">
                  Adresse email
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-500" />
                  </div>
                  <Input 
                    id="email" 
                    name="email" 
                    type="email" 
                    autoComplete="email" 
                    required 
                    className="pl-10"
                    placeholder="nom@exemple.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-300">
                  Mot de passe
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-500" />
                  </div>
                  <Input 
                    id="password" 
                    name="password" 
                    type="password" 
                    autoComplete="current-password" 
                    required 
                    className="pl-10"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input id="remember-me" name="remember-me" type="checkbox" className="h-4 w-4 bg-white/5 border-white/10 rounded text-indigo-500 focus:ring-indigo-500" />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-400">
                    Se souvenir de moi
                  </label>
                </div>
                <div className="text-sm">
                  <a href="#" className="font-medium text-indigo-400 hover:text-indigo-300">Mot de passe oublié ?</a>
                </div>
              </div>

              <Button type="submit" className="w-full h-12 text-base">
                Se connecter
              </Button>
            </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-transparent text-slate-500">Ou continuer avec</span>
              </div>
            </div>

            <div className="mt-6">
              <Button 
                variant="outline" 
                className="w-full h-12 bg-white/5 hover:bg-white/10 border-white/10"
                onClick={handleGoogleLogin}
              >
                <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Google
              </Button>
            </div>
            
            <p className="mt-8 text-center text-xs text-slate-500 flex items-center justify-center gap-1">
              <ShieldCheck className="h-4 w-4" />
              Chiffrement AES-256 de bout en bout
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
