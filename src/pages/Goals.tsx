import React, { useState } from 'react';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Plus, Trash2, Target, Calendar } from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useFirebaseData } from '../hooks/useFirebaseData';

interface Goal {
  id: string;
  userId: string;
  name: string;
  target: number;
  current: number;
  date: string;
  colorGroup?: string;
  createdAt: string;
  updatedAt: string;
}

const colorMaps: Record<string, { bgContainer: string; textIcon: string; barFill: string; }> = {
  indigo: { bgContainer: 'bg-indigo-500/20', textIcon: 'text-indigo-400', barFill: 'bg-indigo-500' },
  emerald: { bgContainer: 'bg-emerald-500/20', textIcon: 'text-emerald-400', barFill: 'bg-emerald-500' },
  sky: { bgContainer: 'bg-sky-500/20', textIcon: 'text-sky-400', barFill: 'bg-sky-500' },
  purple: { bgContainer: 'bg-purple-500/20', textIcon: 'text-purple-400', barFill: 'bg-purple-500' }
};

export default function Goals() {
  const { data: goals, add, update, remove } = useFirebaseData<Goal>('goals');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [current, setCurrent] = useState('');
  const [date, setDate] = useState('');

  const resetForm = () => {
    setName('');
    setTarget('');
    setCurrent('');
    setDate('');
    setEditingId(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (g: Goal) => {
    setName(g.name);
    setTarget(g.target.toString());
    setCurrent(g.current.toString());
    setDate(g.date);
    setEditingId(g.id);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !target) return;

    const t = parseFloat(target);
    const c = parseFloat(current) || 0;

    if (editingId) {
      await update(editingId, { name, target: t, current: c, date });
    } else {
      await add({ name, target: t, current: c, date, colorGroup: 'purple' });
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
          <h1 className="text-2xl font-bold text-white tracking-tight">Objectifs Financiers</h1>
          <p className="text-slate-400 text-sm mt-1">Concrétisez vos projets pas à pas.</p>
        </div>
        <Button onClick={handleOpenAdd} className="gap-2">
          <Plus className="h-5 w-5" />
          Nouvel Objectif
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <AnimatePresence mode="popLayout">
          {goals.map(goal => {
            const percentage = Math.min((goal.current / goal.target) * 100, 100);
            const isCompleted = goal.current >= goal.target;
            const theme = colorMaps[goal.colorGroup || 'indigo'];
            
            return (
              <motion.div
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                key={goal.id}
                onClick={() => handleOpenEdit(goal)}
                className="cursor-pointer group"
              >
                <Card className="hover:bg-white/10 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
                      <div className="flex items-center gap-4">
                        <div className={cn("p-3 rounded-2xl", theme.bgContainer, theme.textIcon)}>
                          <Target className="h-6 w-6" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg text-white">{goal.name}</h3>
                          <div className="flex items-center text-xs text-slate-400 mt-1">
                            <Calendar className="h-3 w-3 mr-1" />
                            {new Date(goal.date).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}
                          </div>
                        </div>
                      </div>
                      <div className="text-left sm:text-right">
                        <p className="text-2xl font-bold font-mono text-white">{formatCurrency(goal.current)}</p>
                        <p className="text-slate-500 text-sm">sur {formatCurrency(goal.target)}</p>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-medium mb-1.5">
                        <span className={isCompleted ? "text-emerald-400" : "text-slate-400"}>
                          {isCompleted ? "Objectif Atteint 🎉" : "Progression"}
                        </span>
                        <span className="text-white font-mono">{percentage.toFixed(1)}%</span>
                      </div>
                      <div className="h-3 w-full bg-slate-900 rounded-full overflow-hidden border border-white/5 shadow-inner">
                        <motion.div 
                          className={cn("h-full rounded-full", isCompleted ? 'bg-emerald-500' : theme.barFill)}
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
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

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? "Modifier l'objectif" : "Nouvel objectif"}>
        <form onSubmit={handleSave} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Nom du projet</label>
            <Input required value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Achat Immobilier" />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Montant Cible (€)</label>
              <Input required type="number" step="0.01" value={target} onChange={e => setTarget(e.target.value)} placeholder="0.00" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Montant Actuel (€)</label>
              <Input type="number" step="0.01" value={current} onChange={e => setCurrent(e.target.value)} placeholder="0.00" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Date limite estimée</label>
            <Input type="date" required value={date} onChange={e => setDate(e.target.value)} className="appearance-none" />
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
