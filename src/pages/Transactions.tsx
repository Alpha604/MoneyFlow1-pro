import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { 
  Plus, Search, Filter, ArrowUpRight, ArrowDownRight,
  ShoppingCart, Coffee, Tv, Car, Home, Receipt, DollarSign, Wallet, Trash2,
  Utensils, ArrowRightLeft, HeartPulse, Dumbbell, Plane, Gift, PiggyBank, GraduationCap, RefreshCw, Smartphone, MonitorPlay, Zap, Droplet, Flame, Bus
} from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useFirebaseData } from '../hooks/useFirebaseData';

interface Transaction {
  id: string;
  userId: string;
  label: string;
  category: string;
  amount: number;
  date: string;
  type: 'expense' | 'income' | 'transfer';
  sourceId?: string;
  sourceType?: 'account' | 'card' | 'goal';
  destinationId?: string;
  destinationType?: 'account' | 'card' | 'goal';
  createdAt: string;
  updatedAt: string;
}

interface Account {
  id: string;
  name: string;
  balance: number;
}

interface CardModel {
  id: string;
  name: string;
  last4: string;
}

interface Budget {
  id: string;
  label: string;
}

interface Goal {
  id: string;
  name: string;
  target: number;
  current: number;
}

const defaultCategories = ['Shopping', 'Alimentation', 'Logement', 'Transport', 'Loisirs', 'Revenus', 'Remboursement', 'Transfert', 'Autre'];

const getIconForCategory = (category: string) => {
  const norm = category.toLowerCase();
  if (norm.includes('shopping') || norm.includes('achat') || norm.includes('vetement') || norm.includes('vêtements')) return ShoppingCart;
  if (norm.includes('aliment') || norm.includes('nourri') || norm.includes('restau') || norm.includes('course')) return Utensils;
  if (norm.includes('logement') || norm.includes('loyer') || norm.includes('maison')) return Home;
  if (norm.includes('transport') || norm.includes('voiture') || norm.includes('essence') || norm.includes('auto')) return Car;
  if (norm.includes('bus') || norm.includes('train') || norm.includes('metro') || norm.includes('métro')) return Bus;
  if (norm.includes('loisir') || norm.includes('divertisse') || norm.includes('cinema') || norm.includes('cinéma')) return Tv;
  if (norm.includes('revenu') || norm.includes('salaire') || norm.includes('prime')) return DollarSign;
  if (norm.includes('transfert') || norm.includes('virement')) return ArrowRightLeft;
  if (norm.includes('santé') || norm.includes('medical') || norm.includes('pharmacie') || norm.includes('medecin')) return HeartPulse;
  if (norm.includes('sport') || norm.includes('gym')) return Dumbbell;
  if (norm.includes('voyage') || norm.includes('avion') || norm.includes('vacance') || norm.includes('hotel')) return Plane;
  if (norm.includes('abonnement') || norm.includes('facture') || norm.includes('internet')) return Receipt;
  if (norm.includes('cadeau') || norm.includes('don')) return Gift;
  if (norm.includes('épargne') || norm.includes('economie') || norm.includes('epargne') || norm.includes('investissement')) return PiggyBank;
  if (norm.includes('scolarité') || norm.includes('ecole') || norm.includes('etude') || norm.includes('formation')) return GraduationCap;
  if (norm.includes('café') || norm.includes('bar')) return Coffee;
  if (norm.includes('remboursement')) return RefreshCw;
  if (norm.includes('telephone') || norm.includes('téléphone') || norm.includes('mobile')) return Smartphone;
  if (norm.includes('jeu') || norm.includes('gaming') || norm.includes('console')) return MonitorPlay;
  if (norm.includes('electricité') || norm.includes('électricité') || norm.includes('energie')) return Zap;
  if (norm.includes('eau') || norm.includes('water')) return Droplet;
  if (norm.includes('gaz')) return Flame;
  
  return Receipt;
};

export default function Transactions() {
  const { data: transactions, add, update, remove } = useFirebaseData<Transaction>('transactions');
  const { data: accounts, update: updateAccount } = useFirebaseData<Account>('accounts');
  const { data: cards } = useFirebaseData<CardModel>('cards');
  const { data: budgets } = useFirebaseData<Budget>('budgets');
  const { data: goals, update: updateGoal } = useFirebaseData<Goal>('goals');
  const { data: customCategories } = useFirebaseData<{id: string; label: string}>('categories');
  
  const allCategories = React.useMemo(() => {
    const customLabels = customCategories.map(c => c.label);
    const budgetLabels = budgets.map(b => b.label);
    return Array.from(new Set([...defaultCategories, ...customLabels, ...budgetLabels]));
  }, [budgets, customCategories]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'expense' | 'income' | 'transfer'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [amount, setAmount] = useState('');
  const [label, setLabel] = useState('');
  const [type, setType] = useState<'expense' | 'income' | 'transfer'>('expense');
  const [category, setCategory] = useState(defaultCategories[0]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [sourceId, setSourceId] = useState('');
  const [destinationId, setDestinationId] = useState('');

  // advanced filters
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc'>('date_desc');

  // Default sourceId
  useEffect(() => {
    if (!sourceId && accounts.length > 0) {
      setSourceId(`account:${accounts[0].id}`);
    } else if (!sourceId && cards.length > 0) {
      setSourceId(`card:${cards[0].id}`);
    }
  }, [accounts, cards, sourceId]);

  const filteredTransactions = transactions
    .filter(tx => {
      const matchesSearch = tx.label.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            tx.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'all' ? true : tx.type === filterType;
      const matchesCategory = filterCategory === 'all' ? true : tx.category === filterCategory;
      return matchesSearch && matchesType && matchesCategory;
    })
    .sort((a, b) => {
      if (sortOrder === 'date_desc') return new Date(b.date).getTime() - new Date(a.date).getTime();
      if (sortOrder === 'date_asc') return new Date(a.date).getTime() - new Date(b.date).getTime();
      if (sortOrder === 'amount_desc') return Math.abs(b.amount) - Math.abs(a.amount);
      if (sortOrder === 'amount_asc') return Math.abs(a.amount) - Math.abs(b.amount);
      return 0;
    });

  const totalIncome = transactions.filter(tx => tx.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpense = transactions.filter(tx => tx.type === 'expense').reduce((acc, curr) => acc + Math.abs(curr.amount), 0);

  const resetForm = () => {
    setAmount('');
    setLabel('');
    setType('expense');
    setCategory(allCategories[0]);
    setDate(new Date().toISOString().split('T')[0]);
    setEditingId(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (tx: Transaction) => {
    setAmount(Math.abs(tx.amount).toString());
    setLabel(tx.label);
    setType(tx.type);
    setCategory(tx.category);
    setDate(tx.date);
    setEditingId(tx.id);
    if (tx.sourceId && tx.sourceType) {
      setSourceId(`${tx.sourceType}:${tx.sourceId}`);
    }
    if (tx.destinationId && tx.destinationType) {
      setDestinationId(`${tx.destinationType}:${tx.destinationId}`);
    }
    setIsModalOpen(true);
  };

  const handleSaveTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !label) return;

    let val = Math.abs(parseFloat(amount));
    if (type === 'expense') val = -val;

    const [rawSourceType, rawSourceId] = sourceId.split(':');
    const sType = rawSourceType as 'account' | 'card' | 'goal' | undefined;
    
    let rawDestType, rawDestId, dType;
    if (type === 'transfer' && destinationId) {
      [rawDestType, rawDestId] = destinationId.split(':');
      dType = rawDestType as 'account' | 'card' | 'goal' | undefined;
    }

    const accChanges: Record<string, number> = {};
    const goalChanges: Record<string, number> = {};

    if (editingId) {
      const oldTx = transactions.find(t => t.id === editingId);
      
      // If old was transfer, revert balances
      if (oldTx && oldTx.type === 'transfer') {
        if (oldTx.sourceType === 'account' && oldTx.sourceId) {
          accChanges[oldTx.sourceId] = (accChanges[oldTx.sourceId] || 0) + oldTx.amount;
        }
        if (oldTx.sourceType === 'goal' && oldTx.sourceId) {
          goalChanges[oldTx.sourceId] = (goalChanges[oldTx.sourceId] || 0) + oldTx.amount;
        }
        if (oldTx.destinationType === 'account' && oldTx.destinationId) {
          accChanges[oldTx.destinationId] = (accChanges[oldTx.destinationId] || 0) - oldTx.amount;
        }
        if (oldTx.destinationType === 'goal' && oldTx.destinationId) {
          goalChanges[oldTx.destinationId] = (goalChanges[oldTx.destinationId] || 0) - oldTx.amount;
        }
      } else if (oldTx && oldTx.sourceId) {
        if (oldTx.sourceType === 'account') {
          accChanges[oldTx.sourceId] = (accChanges[oldTx.sourceId] || 0) - oldTx.amount;
        }
        if (oldTx.sourceType === 'goal') {
          goalChanges[oldTx.sourceId] = (goalChanges[oldTx.sourceId] || 0) - oldTx.amount;
        }
      }

      const updateData: Partial<Transaction> = {
        label, category, amount: val, date, type, 
        sourceId: rawSourceId, sourceType: sType 
      };
      if (type === 'transfer') {
        updateData.destinationId = rawDestId;
        updateData.destinationType = dType;
      } else {
        updateData.destinationId = null as any;
        updateData.destinationType = null as any;
      }
      await update(editingId, updateData);

      // Apply new balances
      if (type === 'transfer') {
        if (sType === 'account' && rawSourceId) {
          accChanges[rawSourceId] = (accChanges[rawSourceId] || 0) - val;
        }
        if (sType === 'goal' && rawSourceId) {
          goalChanges[rawSourceId] = (goalChanges[rawSourceId] || 0) - val;
        }
        if (dType === 'account' && rawDestId) {
          accChanges[rawDestId] = (accChanges[rawDestId] || 0) + val;
        }
        if (dType === 'goal' && rawDestId) {
          goalChanges[rawDestId] = (goalChanges[rawDestId] || 0) + val;
        }
      } else if (rawSourceId) {
        if (sType === 'account') accChanges[rawSourceId] = (accChanges[rawSourceId] || 0) + val;
        if (sType === 'goal') goalChanges[rawSourceId] = (goalChanges[rawSourceId] || 0) + val;
      }
    } else {
      const addData: Partial<Transaction> = {
        label, category, amount: val, date, type,
        sourceId: rawSourceId, sourceType: sType
      };
      if (type === 'transfer') {
        addData.destinationId = rawDestId;
        addData.destinationType = dType;
      }
      await add(addData as Transaction);
      
      if (type === 'transfer') {
        if (sType === 'account' && rawSourceId) {
          accChanges[rawSourceId] = (accChanges[rawSourceId] || 0) - val;
        }
        if (sType === 'goal' && rawSourceId) {
          goalChanges[rawSourceId] = (goalChanges[rawSourceId] || 0) - val;
        }
        if (dType === 'account' && rawDestId) {
          accChanges[rawDestId] = (accChanges[rawDestId] || 0) + val;
        }
        if (dType === 'goal' && rawDestId) {
          goalChanges[rawDestId] = (goalChanges[rawDestId] || 0) + val;
        }
      } else if (rawSourceId) {
        if (sType === 'account') accChanges[rawSourceId] = (accChanges[rawSourceId] || 0) + val;
        if (sType === 'goal') goalChanges[rawSourceId] = (goalChanges[rawSourceId] || 0) + val;
      }
    }

    // Apply all account balance modifications
    for (const [accId, diff] of Object.entries(accChanges)) {
      if (diff !== 0) {
        const acc = accounts.find(a => a.id === accId);
        if (acc) {
          await updateAccount(accId, { balance: acc.balance + diff });
        }
      }
    }

    // Apply all goal current value modifications
    for (const [gId, diff] of Object.entries(goalChanges)) {
      if (diff !== 0) {
        const goal = goals.find(g => g.id === gId);
        if (goal) {
          await updateGoal(gId, { current: goal.current + diff });
        }
      }
    }

    setIsModalOpen(false);
  };

  const handleDelete = async () => {
    if (editingId) {
      const oldTx = transactions.find(t => t.id === editingId);
      await remove(editingId);
      
      const accChanges: Record<string, number> = {};
      const goalChanges: Record<string, number> = {};
      
      if (oldTx && oldTx.type === 'transfer') {
        if (oldTx.sourceType === 'account' && oldTx.sourceId) {
          accChanges[oldTx.sourceId] = (accChanges[oldTx.sourceId] || 0) + oldTx.amount;
        }
        if (oldTx.sourceType === 'goal' && oldTx.sourceId) {
          goalChanges[oldTx.sourceId] = (goalChanges[oldTx.sourceId] || 0) + oldTx.amount;
        }
        if (oldTx.destinationType === 'account' && oldTx.destinationId) {
          accChanges[oldTx.destinationId] = (accChanges[oldTx.destinationId] || 0) - oldTx.amount;
        }
        if (oldTx.destinationType === 'goal' && oldTx.destinationId) {
          goalChanges[oldTx.destinationId] = (goalChanges[oldTx.destinationId] || 0) - oldTx.amount;
        }
      } else if (oldTx && oldTx.sourceId) {
        if (oldTx.sourceType === 'account') accChanges[oldTx.sourceId] = (accChanges[oldTx.sourceId] || 0) - oldTx.amount;
        if (oldTx.sourceType === 'goal') goalChanges[oldTx.sourceId] = (goalChanges[oldTx.sourceId] || 0) - oldTx.amount;
      }
      
      // Apply all account balance modifications
      for (const [accId, diff] of Object.entries(accChanges)) {
        if (diff !== 0) {
          const acc = accounts.find(a => a.id === accId);
          if (acc) {
            await updateAccount(accId, { balance: acc.balance + diff });
          }
        }
      }

      for (const [gId, diff] of Object.entries(goalChanges)) {
        if (diff !== 0) {
          const goal = goals.find(g => g.id === gId);
          if (goal) {
            await updateGoal(gId, { current: goal.current + diff });
          }
        }
      }

      setIsModalOpen(false);
    }
  };

  const groupedTransactions = React.useMemo(() => {
    if (sortOrder.startsWith('amount')) {
      return [{ date: 'Toutes les dates', transactions: filteredTransactions }];
    }

    const groups: Record<string, Transaction[]> = {};
    filteredTransactions.forEach(tx => {
      if (!groups[tx.date]) {
        groups[tx.date] = [];
      }
      groups[tx.date].push(tx);
    });

    const sortedDates = Object.keys(groups).sort((a, b) => {
      if (sortOrder === 'date_desc') return new Date(b).getTime() - new Date(a).getTime();
      return new Date(a).getTime() - new Date(b).getTime();
    });

    return sortedDates.map(date => ({
      date,
      transactions: groups[date] 
    }));
  }, [filteredTransactions, sortOrder]);

  const formatDateHeader = (dateStr: string) => {
    if (dateStr === 'Toutes les dates') return dateStr;
    const d = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (d.toDateString() === today.toDateString()) return "Aujourd'hui";
    if (d.toDateString() === yesterday.toDateString()) return "Hier";

    return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: d.getFullYear() !== today.getFullYear() ? 'numeric' : undefined });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Transactions</h1>
          <p className="text-slate-400 text-sm mt-1">Gérez vos dépenses et vos revenus.</p>
        </div>
        <Button onClick={handleOpenAdd} className="gap-2">
          <Plus className="h-5 w-5" />
          Nouvelle transaction
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-400">Total Revenus</p>
              <p className="text-2xl font-bold text-emerald-400 mt-1">{formatCurrency(totalIncome)}</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ArrowUpRight className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-400">Total Dépenses</p>
              <p className="text-2xl font-bold text-rose-400 mt-1">{formatCurrency(totalExpense)}</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <ArrowDownRight className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="p-4 border-b border-white/5 space-y-4 bg-white/5">
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <Input 
                  placeholder="Rechercher..." 
                  className="pl-9 h-10 w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex bg-white/5 p-1 rounded-xl w-full sm:w-auto">
                {(['all', 'expense', 'income', 'transfer'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setFilterType(f)}
                    className={cn(
                      "flex-1 sm:px-4 py-1.5 text-sm font-medium rounded-lg transition-colors capitalize",
                      filterType === f ? "bg-white/10 text-white" : "text-slate-400 hover:text-slate-200"
                    )}
                  >
                    {f === 'all' ? 'Tous' : f === 'expense' ? 'Dépenses' : f === 'income' ? 'Revenus' : 'Transferts'}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <div className="w-full sm:w-auto flex items-center gap-2">
                <Filter className="h-4 w-4 text-slate-500" />
                <select 
                  className="flex-1 sm:flex-none h-9 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 appearance-none"
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                >
                  <option value="all">Toutes Catégories</option>
                  <optgroup label="Vos Budgets" className="bg-slate-900">
                    {budgets.map(b => (
                      <option key={b.id} value={b.label}>{b.label}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Défaut" className="bg-slate-900">
                    {defaultCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </optgroup>
                  {customCategories.length > 0 && (
                    <optgroup label="Personnalisées" className="bg-slate-900">
                      {customCategories.map(cat => (
                        <option key={cat.id} value={cat.label}>{cat.label}</option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>

              <div className="w-full sm:w-auto">
                <select 
                  className="w-full h-9 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 appearance-none"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as any)}
                >
                  <option value="date_desc">Date : Plus récent</option>
                  <option value="date_asc">Date : Plus ancien</option>
                  <option value="amount_desc">Montant : Plus élevé</option>
                  <option value="amount_asc">Montant : Plus bas</option>
                </select>
              </div>
            </div>
          </div>

          <div className="p-2 sm:p-4 min-h-[400px]">
            <AnimatePresence mode="popLayout">
              {groupedTransactions.length > 0 ? (
                <div className="space-y-6">
                  {groupedTransactions.map(group => (
                    <div key={group.date} className="space-y-3">
                      <h3 className="text-sm font-medium text-slate-400 px-2 sticky top-0 bg-[#0B0F19] bg-opacity-90 backdrop-blur-md py-1 z-10 rounded">
                        {formatDateHeader(group.date)}
                      </h3>
                      <div className="space-y-2">
                        {group.transactions.map((tx) => (
                          <motion.div
                            layout
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            key={tx.id}
                            onClick={() => handleOpenEdit(tx)}
                            className="flex items-center justify-between p-3 sm:p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors cursor-pointer group"
                          >
                            <div className="flex items-center gap-4">
                              <div className={cn(
                                "w-12 h-12 rounded-xl flex items-center justify-center border shrink-0 transition-colors",
                                tx.type === 'income' 
                                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 group-hover:bg-emerald-500/20" 
                                  : tx.type === 'transfer'
                                  ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20 group-hover:bg-indigo-500/20"
                                  : "bg-white/5 text-slate-300 border-white/10 group-hover:bg-white/10"
                              )}>
                                {(() => {
                                  const Icon = getIconForCategory(tx.category);
                                  return <Icon className="h-6 w-6" />;
                                })()}
                              </div>
                              <div>
                                <p className="font-semibold text-slate-100 text-sm sm:text-base">{tx.label}</p>
                                <p className="text-xs text-slate-400 mt-0.5">{tx.category} {sortOrder.startsWith('amount') && `• ${tx.date}`}</p>
                              </div>
                            </div>
                            <div className={cn("font-bold text-sm sm:text-base text-right", tx.type === 'income' ? "text-emerald-400" : tx.type === 'transfer' ? "text-indigo-400" : "text-white")}>
                              {tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : ''}{formatCurrency(Math.abs(tx.amount))}
                              {tx.type === 'transfer' && <p className="text-[10px] font-normal text-slate-400 mt-0.5">Transfert</p>}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  className="flex flex-col items-center justify-center p-12 text-slate-500"
                >
                  <Search className="h-12 w-12 mb-4 opacity-50" />
                  <p>Aucune transaction trouvée.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? "Modifier la transaction" : "Ajouter une transaction"}
      >
        <form onSubmit={handleSaveTransaction} className="space-y-6">
          
          <div className="flex p-1 bg-white/5 rounded-xl">
            <button
              type="button"
              onClick={() => setType('expense')}
              className={cn(
                "flex-1 py-3 text-sm font-bold rounded-lg transition-all",
                type === 'expense' ? "bg-rose-500 text-white shadow-lg" : "text-slate-400 hover:text-white"
              )}
            >
              Dépense
            </button>
            <button
              type="button"
              onClick={() => setType('income')}
              className={cn(
                "flex-1 py-3 text-sm font-bold rounded-lg transition-all",
                type === 'income' ? "bg-emerald-500 text-white shadow-lg" : "text-slate-400 hover:text-white"
              )}
            >
              Revenu
            </button>
            <button
              type="button"
              onClick={() => setType('transfer')}
              className={cn(
                "flex-1 py-3 text-sm font-bold rounded-lg transition-all",
                type === 'transfer' ? "bg-indigo-500 text-white shadow-lg" : "text-slate-400 hover:text-white"
              )}
            >
              Transfert
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Montant</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className={cn("font-bold", type === 'income' ? "text-emerald-400" : type === 'expense' ? "text-rose-400" : "text-indigo-400")}>
                  {type === 'income' ? '+' : type === 'expense' ? '-' : '↔'} €
                </span>
              </div>
              <Input 
                type="number" 
                step="0.01" 
                required 
                className="pl-12 text-lg font-mono font-bold"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Libellé</label>
            <Input 
              type="text" 
              required 
              placeholder="Ex: Course Carrefour, Salaire..."
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              {type === 'transfer' ? 'Compte Source' : 'Compte / Carte'}
            </label>
            <select 
              className="flex h-11 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 backdrop-blur-xl transition-colors appearance-none"
              value={sourceId}
              onChange={(e) => setSourceId(e.target.value)}
              required
            >
              <option value="" disabled>Sélectionner...</option>
              {accounts.length > 0 && (
                <optgroup label="Comptes" className="bg-slate-900">
                  {accounts.map(acc => (
                    <option key={`account:${acc.id}`} value={`account:${acc.id}`}>
                      {acc.name} ({formatCurrency(acc.balance)})
                    </option>
                  ))}
                </optgroup>
              )}
              {cards.length > 0 && (
                <optgroup label="Cartes" className="bg-slate-900">
                  {cards.map(card => (
                    <option key={`card:${card.id}`} value={`card:${card.id}`}>
                      {card.name} (••{card.last4})
                    </option>
                  ))}
                </optgroup>
              )}
              {goals.length > 0 && (
                <optgroup label="Objectifs" className="bg-slate-900">
                  {goals.map(goal => (
                    <option key={`goal:${goal.id}`} value={`goal:${goal.id}`}>
                      {goal.name} ({formatCurrency(goal.current)} / {formatCurrency(goal.target)})
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>

          {type === 'transfer' && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Compte Destinataire</label>
              <select 
                className="flex h-11 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 backdrop-blur-xl transition-colors appearance-none"
                value={destinationId}
                onChange={(e) => setDestinationId(e.target.value)}
                required={type === 'transfer'}
              >
                <option value="" disabled>Sélectionner une destination...</option>
                {accounts.length > 0 && (
                  <optgroup label="Comptes" className="bg-slate-900">
                    {accounts.map(acc => (
                      <option key={`account:${acc.id}`} value={`account:${acc.id}`}>
                        {acc.name} ({formatCurrency(acc.balance)})
                      </option>
                    ))}
                  </optgroup>
                )}
                {cards.length > 0 && (
                  <optgroup label="Cartes" className="bg-slate-900">
                    {cards.map(card => (
                      <option key={`card:${card.id}`} value={`card:${card.id}`}>
                        {card.name} (••{card.last4})
                      </option>
                    ))}
                  </optgroup>
                )}
                {goals.length > 0 && (
                  <optgroup label="Objectifs" className="bg-slate-900">
                    {goals.map(goal => (
                      <option key={`goal:${goal.id}`} value={`goal:${goal.id}`}>
                        {goal.name} ({formatCurrency(goal.current)} / {formatCurrency(goal.target)})
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Catégorie</label>
              <select 
                className="flex h-11 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 backdrop-blur-xl transition-colors appearance-none"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <optgroup label="Vos Budgets" className="bg-slate-900">
                  {budgets.map(b => (
                    <option key={b.id} value={b.label}>{b.label}</option>
                  ))}
                </optgroup>
                <optgroup label="Défaut" className="bg-slate-900">
                  {defaultCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </optgroup>
                {customCategories.length > 0 && (
                  <optgroup label="Personnalisées" className="bg-slate-900">
                    {customCategories.map(cat => (
                      <option key={cat.id} value={cat.label}>{cat.label}</option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Date</label>
              <Input 
                type="date" 
                required 
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="appearance-none"
              />
            </div>
          </div>

          <div className="pt-2 flex gap-3">
            {editingId && (
              <Button type="button" variant="danger" className="w-auto px-4" onClick={handleDelete}>
                <Trash2 className="h-5 w-5" />
              </Button>
            )}
            <Button type="button" variant="ghost" className="flex-1" onClick={() => setIsModalOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" className="flex-1 px-8 min-w-[120px]">
              Enregistrer
            </Button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
