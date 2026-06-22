import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Plus, Trash2, PieChart, Activity } from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useFirebaseData } from '../hooks/useFirebaseData';

interface Budget {
  id: string;
  userId: string;
  label: string;
  total: number;
  spent?: number; // Will be computed if missing or unused
  color?: string;
  createdAt: string;
  updatedAt: string;
}

interface Transaction {
  category: string;
  amount: number;
  type: 'income' | 'expense';
  date: string;
}

export default function Budgets() {
  const { data: budgets, add, update, remove } = useFirebaseData<Budget>('budgets');
  const { data: transactions } = useFirebaseData<Transaction>('transactions');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [label, setLabel] = useState('');
  const [total, setTotal] = useState('');

  const resetForm = () => {
    setLabel('');
    setTotal('');
    setEditingId(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (b: Budget) => {
    setLabel(b.label);
    setTotal(b.total.toString());
    setEditingId(b.id);
    setIsModalOpen(true);
  };

  const currentMonthPrefix = new Date().toISOString().substring(0, 7);

  const computedBudgets = useMemo(() => {
    return budgets.map(budget => {
      const spentThisMonth = transactions
        .filter(tx => tx.type === 'expense' && tx.category === budget.label && tx.date.startsWith(currentMonthPrefix))
        .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
      return { ...budget, computedSpent: spentThisMonth };
    });
  }, [budgets, transactions, currentMonthPrefix]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!label || !total) return;

    const t = parseFloat(total);
    const color = 'bg-indigo-500';

    if (editingId) {
      await update(editingId, { label, total: t, color });
    } else {
      await add({ label, total: t, spent: 0, color });
    }
    setIsModalOpen(false);
  };

  const handleDelete = async () => {
    if (editingId) {
      await remove(editingId);
      setIsModalOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Budgets</h1>
          <p className="text-slate-400 text-sm mt-1">Gérez vos limites de dépenses mensuelles.</p>
        </div>
        <Button onClick={handleOpenAdd} className="gap-2">
          <Plus className="h-5 w-5" />
          Nouveau budget
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AnimatePresence mode="popLayout">
          {computedBudgets.map(budget => {
            const percentage = Math.min((budget.computedSpent / budget.total) * 100, 100);
            const isOver = budget.computedSpent > budget.total;
            return (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                key={budget.id}
                onClick={() => handleOpenEdit(budget)}
                className="cursor-pointer group"
              >
                <Card className="hover:border-white/20 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/5 rounded-xl border border-white/10 group-hover:bg-white/10 transition-colors">
                          <PieChart className="h-5 w-5 text-indigo-400" />
                        </div>
                        <h3 className="font-semibold text-white">{budget.label}</h3>
                      </div>
                      <div className="text-right">
                        <span className={cn("text-lg font-bold font-mono", isOver ? "text-rose-400" : "text-white")}>
                          {formatCurrency(budget.computedSpent)}
                        </span>
                        <span className="text-slate-500 text-sm font-mono"> / {formatCurrency(budget.total)}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-medium">
                        <span className={isOver ? "text-rose-400" : "text-slate-400"}>
                          {isOver ? "Dépassement" : "Utilisé (ce mois)"}
                        </span>
                        <span className="text-slate-400 font-mono">{Math.round((budget.computedSpent / budget.total) * 100)}%</span>
                      </div>
                      <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                        <motion.div 
                          className={cn("h-full rounded-full w-full max-w-full", isOver ? "bg-rose-500" : (budget.color || 'bg-indigo-500'))}
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ duration: 0.5, ease: "easeOut" }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? "Modifier le budget" : "Nouveau budget"}>
        <form onSubmit={handleSave} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Catégorie / Libellé</label>
            <Input required value={label} onChange={e => setLabel(e.target.value)} placeholder="Ex: Alimentation" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Budget Limite (€)</label>
            <Input required type="number" step="1" value={total} onChange={e => setTotal(e.target.value)} placeholder="500" />
          </div>

          <div className="pt-2 flex gap-3">
            {editingId && (
              <Button type="button" variant="danger" className="px-4" onClick={handleDelete}>
                <Trash2 className="h-5 w-5" />
              </Button>
            )}
            <Button type="button" variant="ghost" className="flex-1" onClick={() => setIsModalOpen(false)}>Annuler</Button>
            <Button type="submit" className="flex-1">Enregistrer</Button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
