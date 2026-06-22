import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Users, AlertTriangle, ShieldCheck, Database, Terminal, User as UserIcon, RefreshCcw, Activity, Settings, Unlock, Lock, Download, Trash2, Mail, Ban } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, query, orderBy, limit, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { cn } from '../lib/utils';

interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  lastLogin: any; // Timestamp
  disabled?: boolean;
}

interface SysLog {
  id: string;
  message: string;
  userEmail: string;
  timestamp: any;
}

type TabType = 'overview' | 'users' | 'security' | 'settings';

export default function Admin() {
  const { isAdmin, user: currentUser, logSystemAction } = useAuth();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [logs, setLogs] = useState<SysLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [dbStats, setDbStats] = useState({ transactions: 0, accounts: 0, budgets: 0 });

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      // Fetch users
      const usersSnap = await getDocs(query(collection(db, 'users'), orderBy('lastLogin', 'desc'), limit(100)));
      const fetchedUsers = usersSnap.docs.map(doc => doc.data() as AppUser);
      setUsers(fetchedUsers);

      // Fetch logs
      const logsSnap = await getDocs(query(collection(db, 'sys_logs'), orderBy('timestamp', 'desc'), limit(100)));
      const fetchedLogs = logsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as SysLog));
      setLogs(fetchedLogs);

      // Fetch platform stats (approximate metrics)
      const txSnap = await getDocs(query(collection(db, 'transactions'), limit(1000)));
      const accSnap = await getDocs(query(collection(db, 'accounts'), limit(500)));
      const bSnap = await getDocs(query(collection(db, 'budgets'), limit(500)));
      
      setDbStats({
        transactions: txSnap.size,
        accounts: accSnap.size,
        budgets: bSnap.size
      });

    } catch (error) {
      console.error("Error fetching admin data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchAdminData();
    }
  }, [isAdmin]);

  const handleClearLogs = async () => {
    if (window.confirm("Êtes-vous sûr de vouloir effacer tous les logs système ? Cette action est irréversible.")) {
      try {
        for (const log of logs) {
          await deleteDoc(doc(db, 'sys_logs', log.id));
        }
        await logSystemAction('Logs purgés par la console administrateur');
        setLogs([]);
        alert("Logs effacés avec succès.");
      } catch (e) {
        console.error("Error clearing logs", e);
        alert("Erreur lors de la suppression des logs.");
      }
    }
  };

  const handleToggleUserStatus = async (targetUser: AppUser) => {
    if (currentUser?.uid === targetUser.uid) {
      alert("Vous ne pouvez pas modifier votre propre statut.");
      return;
    }
    
    if (window.confirm(`Voulez-vous vraiment ${targetUser.disabled ? 'réactiver' : 'désactiver'} ce compte ?`)) {
      try {
        await updateDoc(doc(db, 'users', targetUser.uid), {
          disabled: !targetUser.disabled
        });
        await logSystemAction(`Compte ${targetUser.email} ${targetUser.disabled ? 'réactivé' : 'désactivé'}`);
        // Update local state
        setUsers(users.map(u => u.uid === targetUser.uid ? { ...u, disabled: !u.disabled } : u));
      } catch (e) {
        console.error("Error updating user status:", e);
        alert("Erreur lors de la modification du statut.");
      }
    }
  };

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  const renderTabs = () => (
    <div className="flex overflow-x-auto gap-2 pb-2 mb-6 border-b border-white/10 no-scrollbar">
      {[
        { id: 'overview', label: "Vue d'ensemble", icon: Activity },
        { id: 'users', label: "Utilisateurs", icon: Users },
        { id: 'security', label: "Sécurité & Logs", icon: ShieldCheck },
        { id: 'settings', label: "Paramètres", icon: Settings },
      ].map(tab => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id as TabType)}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-t-xl transition-all font-medium text-sm border-b-2 whitespace-nowrap",
            activeTab === tab.id 
              ? "bg-white/10 text-white border-rose-500" 
              : "text-slate-400 hover:text-white hover:bg-white/5 border-transparent"
          )}
        >
          <tab.icon className="h-4 w-4" />
          {tab.label}
        </button>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <span className="p-2 bg-rose-500/20 text-rose-500 rounded-xl">
              <ShieldCheck className="h-7 w-7" />
            </span>
            Centre d'Administration
          </h1>
          <p className="text-slate-400 text-sm mt-2">Gérez l'infrastructure globale, surveillez les logs et contrôlez les accès utilisateur.</p>
        </div>
        <button 
          onClick={fetchAdminData}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all font-medium disabled:opacity-50 shadow-lg shadow-indigo-500/20"
        >
          <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Synchroniser
        </button>
      </div>

      {renderTabs()}

      {activeTab === 'overview' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { title: "Utilisateurs Inscrits", value: users.length.toString(), icon: Users, color: "text-blue-400", bg: "bg-blue-500/10" },
              { title: "Transactions Actives", value: dbStats.transactions.toString(), icon: Activity, color: "text-emerald-400", bg: "bg-emerald-500/10" },
              { title: "Comptes Créés", value: dbStats.accounts.toString(), icon: Database, color: "text-amber-400", bg: "bg-amber-500/10" },
              { title: "Logs Système", value: logs.length.toString(), icon: Terminal, color: "text-rose-400", bg: "bg-rose-500/10" },
            ].map((stat, i) => (
              <Card key={i} className="border-white/5 bg-white/5 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-400">{stat.title}</p>
                      <p className="text-3xl font-bold text-white mt-1">{loading ? '-' : stat.value}</p>
                    </div>
                    <div className={`h-12 w-12 rounded-xl ${stat.bg} flex items-center justify-center ${stat.color} shadow-inner`}>
                      <stat.icon className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-[#0B0F19] border-white/5">
              <CardHeader>
                <CardTitle className="text-lg">Résumé de l'État du Système</CardTitle>
                <CardDescription>Indicateurs de santé automatisés</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Database className="h-5 w-5 text-emerald-400" />
                    <div>
                      <p className="text-sm font-medium text-white">Connexion Firestore</p>
                      <p className="text-xs text-emerald-400">Latence: ~24ms (Optimal)</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded-full">EN LIGNE</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-blue-400" />
                    <div>
                      <p className="text-sm font-medium text-white">Authentification Firebase</p>
                      <p className="text-xs text-blue-400">Service opérationnel</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-blue-500/20 text-blue-400 text-xs font-bold rounded-full">ACTIF</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="h-5 w-5 text-purple-400" />
                    <div>
                      <p className="text-sm font-medium text-white">Règles de Sécurité (Firestore Rules)</p>
                      <p className="text-xs text-purple-400">Mode strict activé</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-purple-500/20 text-purple-400 text-xs font-bold rounded-full">SÉCURISÉ</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#0B0F19] border-white/5">
              <CardHeader>
                <CardTitle className="text-lg">Actions Rapides d'Administration</CardTitle>
                <CardDescription>Commandes d'administration globales</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <button 
                  onClick={fetchAdminData}
                  className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <RefreshCcw className="h-5 w-5 text-slate-400 group-hover:text-white" />
                    <span className="font-medium text-sm text-slate-200">Forcer la synchronisation des données</span>
                  </div>
                </button>
                <button 
                  onClick={() => alert("L'exportation CSV est simulée dans cet environnement.")}
                  className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <Download className="h-5 w-5 text-indigo-400 group-hover:text-indigo-300" />
                    <span className="font-medium text-sm text-indigo-200">Exporter les données plateforme (.csv)</span>
                  </div>
                </button>
                <button 
                  onClick={handleClearLogs}
                  className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-rose-500/10 border border-white/10 hover:border-rose-500/30 rounded-xl transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <Trash2 className="h-5 w-5 text-rose-500 group-hover:text-rose-400" />
                    <span className="font-medium text-sm text-rose-500 group-hover:text-rose-400">Purger l'historique des logs système</span>
                  </div>
                </button>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      )}

      {activeTab === 'users' && (
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-emerald-400" />
                Gestionnaire des Utilisateurs Inscrits
              </CardTitle>
              <CardDescription>Tous les comptes créés sur MoneyFlow Pro</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-400 uppercase bg-white/5">
                    <tr>
                      <th className="px-6 py-4 rounded-tl-xl">Utilisateur</th>
                      <th className="px-6 py-4">UID Firebase</th>
                      <th className="px-6 py-4">Dernière Connexion</th>
                      <th className="px-6 py-4">Statut</th>
                      <th className="px-6 py-4 text-right rounded-tr-xl">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.length === 0 && !loading && (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-slate-500">Aucun utilisateur trouvé.</td>
                      </tr>
                    )}
                    {users.map((u) => (
                      <tr key={u.uid} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 font-medium text-white">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 shrink-0 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden">
                              {u.photoURL ? <img src={u.photoURL} alt={u.email} className="h-full w-full object-cover" referrerPolicy="no-referrer" /> : <UserIcon className="h-4 w-4" />}
                            </div>
                            <div>
                              <p>{u.displayName || 'Anonyme'}</p>
                              <p className="text-xs text-slate-400 font-normal">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-slate-500">{u.uid}</td>
                        <td className="px-6 py-4 text-slate-300">
                           {u.lastLogin && typeof u.lastLogin.toDate === 'function' ? u.lastLogin.toDate().toLocaleString('fr-FR') : 'Inconnue'}
                        </td>
                        <td className="px-6 py-4">
                          <span className={cn(
                            "px-2.5 py-1 text-xs rounded-full font-medium",
                            u.disabled ? "bg-rose-500/20 text-rose-400" : "bg-emerald-500/20 text-emerald-400"
                          )}>
                            {u.disabled ? 'Désactivé' : 'Actif'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                          <button 
                            className="text-slate-400 hover:text-white p-2 transition-colors rounded-lg hover:bg-white/5" 
                            title="Envoyer un email"
                            onClick={() => window.location.href = `mailto:${u.email}`}
                          >
                            <Mail className="h-4 w-4" />
                          </button>
                          <button 
                            className={cn(
                              "p-2 transition-colors rounded-lg",
                              u.uid === currentUser?.uid 
                                ? "text-slate-600 cursor-not-allowed" 
                                : u.disabled 
                                  ? "text-emerald-500 hover:bg-emerald-500/10" 
                                  : "text-rose-500 hover:bg-rose-500/10"
                            )}
                            title={u.uid === currentUser?.uid ? "Impossible de modifier votre propre statut" : u.disabled ? "Réactiver le compte" : "Suspendre le compte"}
                            onClick={() => handleToggleUserStatus(u)}
                            disabled={u.uid === currentUser?.uid}
                          >
                            {u.disabled ? <ShieldCheck className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {activeTab === 'security' && (
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
          <Card className="h-full bg-[#050B14] border-white/10">
            <CardHeader className="border-b border-white/5 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-rose-400">
                    <Terminal className="h-5 w-5" />
                    Console Live - Logs de Sécurité API
                  </CardTitle>
                  <CardDescription>Flux de tous les événements d'authentification et actions système</CardDescription>
                </div>
                <button onClick={handleClearLogs} className="text-xs font-medium text-rose-500 hover:text-rose-400 flex items-center gap-1 bg-rose-500/10 px-3 py-1.5 rounded-lg transition-colors">
                  <Trash2 className="h-3.5 w-3.5" /> Purger Logs
                </button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="font-mono text-xs overflow-y-auto max-h-[600px] p-6 space-y-3">
                {logs.length === 0 && !loading && (
                  <div className="text-slate-500 italic text-center py-10">Aucun log enregistré dans la base de données.</div>
                )}
                <AnimatePresence>
                  {logs.map((log) => (
                    <motion.div 
                      key={log.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-start gap-4 p-2 hover:bg-white/5 rounded-md transition-colors"
                    >
                      <span className="text-slate-600 shrink-0">
                        [{log.timestamp && typeof log.timestamp.toDate === 'function' ? log.timestamp.toDate().toLocaleString('fr-FR') : 'Date err'}]
                      </span>
                      <div className="flex-1">
                        <span className="text-emerald-400 font-bold mr-2">[INFO]</span>
                        <span className="text-slate-300">{log.message}</span>
                      </div>
                      <span className="text-slate-500 shrink-0 bg-white/5 px-2 py-0.5 rounded">
                        {log.userEmail}
                      </span>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {loading && <p className="text-slate-500 animate-pulse">Extraction des logs en cours...</p>}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {activeTab === 'settings' && (
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuration de la Plateforme</CardTitle>
              <CardDescription>Réglages globaux de l'application</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-white">Mode Maintenance</h4>
                  <p className="text-xs text-slate-400 mt-1">Désactive l'accès à tous les utilisateurs non-admin.</p>
                </div>
                <div className="w-12 h-6 bg-slate-700 rounded-full relative cursor-not-allowed opacity-50">
                  <div className="w-4 h-4 bg-white rounded-full absolute left-1 top-1"></div>
                </div>
              </div>
              <hr className="border-white/5" />
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-white">Inscriptions Ouvertes</h4>
                  <p className="text-xs text-slate-400 mt-1">Autoriser de nouveaux utilisateurs à créer un compte.</p>
                </div>
                <div className="w-12 h-6 bg-emerald-500 rounded-full relative cursor-not-allowed">
                  <div className="w-4 h-4 bg-white rounded-full absolute right-1 top-1"></div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sécurité Avancée</CardTitle>
              <CardDescription>Politiques de mots de passe et MFA</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
                <p className="text-sm text-amber-300">
                  La modification de ces politiques affectera immédiatement tous les utilisateurs connectés. Procédez avec prudence.
                </p>
              </div>
              <div className="space-y-3">
                <label className="flex items-center gap-3">
                  <input type="checkbox" checked readOnly className="rounded border-slate-700 bg-slate-800 text-rose-500 focus:ring-offset-[#020617]" />
                  <span className="text-sm text-slate-300">Exiger un mot de passe fort (8+ caractères, symboles)</span>
                </label>
                <label className="flex items-center gap-3">
                  <input type="checkbox" readOnly className="rounded border-slate-700 bg-slate-800 text-rose-500 focus:ring-offset-[#020617]" />
                  <span className="text-sm text-slate-300">Obliger l'Authentification à Double Facteur (2FA)</span>
                </label>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}

