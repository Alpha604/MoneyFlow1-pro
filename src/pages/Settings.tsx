import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Plus, Trash2, Tag } from 'lucide-react';
import { useFirebaseData } from '../hooks/useFirebaseData';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export default function Settings() {
  const { data: customCategories, add, remove } = useFirebaseData<{id: string; label: string}>('categories');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [label, setLabel] = useState('');

  const defaultCategories = ['Shopping', 'Alimentation', 'Logement', 'Transport', 'Loisirs', 'Revenus', 'Remboursement', 'Transfert', 'Autre'];

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) return;
    await add({ label: label.trim() });
    setLabel('');
    setIsModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Supprimer cette catégorie ?")) {
      await remove(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Paramètres</h1>
          <p className="text-slate-400 text-sm mt-1">Gérez vos catégories personnalisées et vos préférences.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5 text-indigo-400" />
              Catégories par défaut
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {defaultCategories.map(cat => (
                <span key={cat} className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-sm text-slate-300">
                  {cat}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5 text-emerald-400" />
              Catégories Personnelles
            </CardTitle>
            <Button onClick={() => setIsModalOpen(true)} className="gap-2 h-8 px-3 text-xs">
              <Plus className="h-3 w-3" />
              Ajouter
            </Button>
          </CardHeader>
          <CardContent>
            {customCategories.length === 0 ? (
              <p className="text-slate-500 text-sm py-4">Aucune catégorie personnalisée.</p>
            ) : (
              <div className="space-y-2">
                <AnimatePresence mode="popLayout">
                  {customCategories.map(cat => (
                    <motion.div
                      key={cat.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5"
                    >
                      <span className="text-sm font-medium text-slate-200">{cat.label}</span>
                      <button
                        onClick={() => handleDelete(cat.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nouvelle Catégorie">
        <form onSubmit={handleSave} className="space-y-4 pt-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Nom de la catégorie</label>
            <Input 
              required 
              value={label} 
              onChange={e => setLabel(e.target.value)} 
              placeholder="Ex: Vacances, Animaux..." 
              autoFocus
            />
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Annuler</Button>
            <Button type="submit">Sauvegarder</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
