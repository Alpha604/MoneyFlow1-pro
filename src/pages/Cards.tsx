import React, { useState } from 'react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Plus, Trash2, CreditCard, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useFirebaseData } from '../hooks/useFirebaseData';

interface CardModel {
  id: string;
  userId: string;
  name: string;
  network: string;
  last4: string;
  expiry: string;
  type?: string;
  color?: string;
  createdAt: string;
  updatedAt: string;
}

export default function Cards() {
  const { data: cards, add, update, remove } = useFirebaseData<CardModel>('cards');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [last4, setLast4] = useState('');
  const [expiry, setExpiry] = useState('');
  const [network, setNetwork] = useState('Visa');

  const resetForm = () => {
    setName('');
    setLast4('');
    setExpiry('');
    setNetwork('Visa');
    setEditingId(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: CardModel) => {
    setName(c.name);
    setLast4(c.last4);
    setExpiry(c.expiry);
    setNetwork(c.network);
    setEditingId(c.id);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !last4 || !expiry) return;

    if (editingId) {
      await update(editingId, { name, last4, expiry, network });
    } else {
      await add({ 
        name, last4, expiry, network, type: 'Debit', 
        color: 'from-emerald-600 to-teal-800' 
      });
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
          <h1 className="text-2xl font-bold text-white tracking-tight">Cartes Bancaires</h1>
          <p className="text-slate-400 text-sm mt-1">Gérez vos moyens de paiement sécurisés.</p>
        </div>
        <Button onClick={handleOpenAdd} className="gap-2">
          <Plus className="h-5 w-5" />
          Ajouter une carte
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {cards.map(card => (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              key={card.id}
              onClick={() => handleOpenEdit(card)}
              className="cursor-pointer group"
            >
              <div className={`relative isolate overflow-hidden rounded-3xl p-6 bg-gradient-to-br ${card.color} shadow-2xl border border-white/20 aspect-[1.58/1] flex flex-col justify-between hover:scale-105 transition-transform duration-300`}>
                <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
                
                <div className="flex justify-between items-start relative z-10">
                  <CreditCard className="h-8 w-8 text-white/80" />
                  <span className="font-bold text-white/90 italic tracking-wider">{card.network}</span>
                </div>

                <div className="relative z-10">
                  <div className="flex items-center gap-2 text-white/80 font-mono text-xl md:text-2xl tracking-[0.2em] mb-4">
                    <span>••••</span>
                    <span>••••</span>
                    <span>••••</span>
                    <span>{card.last4}</span>
                  </div>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-[10px] text-white/60 uppercase tracking-widest mb-1">Titulaire</p>
                      <p className="font-semibold text-white tracking-wide uppercase">{card.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-white/60 uppercase tracking-widest mb-1">Expire le</p>
                      <p className="font-semibold text-white tracking-wide">{card.expiry}</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? "Modifier la carte" : "Ajouter une carte"}>
        <form onSubmit={handleSave} className="space-y-6">
          <div className="flex items-center justify-center p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl mb-4 text-emerald-400 text-sm">
            <ShieldCheck className="w-5 h-5 mr-2" />
            Données chiffrées de bout en bout
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Nom sur la carte</label>
            <Input required value={name} onChange={e => setName(e.target.value)} placeholder="Ex: ROMEO B" uppercase className="uppercase" />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">4 Derniers Chiffres</label>
              <Input required minLength={4} maxLength={4} value={last4} onChange={e => setLast4(e.target.value)} placeholder="1234" className="font-mono text-lg tracking-widest" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Expiration</label>
              <Input required value={expiry} onChange={e => setExpiry(e.target.value)} placeholder="MM/YY" className="font-mono" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Réseau</label>
            <select 
              className="flex h-11 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 backdrop-blur-xl transition-colors appearance-none"
              value={network}
              onChange={(e) => setNetwork(e.target.value)}
            >
              <option value="Visa">Visa</option>
              <option value="Mastercard">Mastercard</option>
              <option value="American Express">American Express</option>
            </select>
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
