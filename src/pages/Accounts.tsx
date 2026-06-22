import React, { useState } from 'react';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Plus, Trash2, Wallet, Landmark, CreditCard, Building2 } from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useFirebaseData } from '../hooks/useFirebaseData';

interface Account {
  id: string;
  userId: string;
  name: string;
  bank: string;
  balance: number;
  type: string;
  color?: string;
  iconName?: string;
  createdAt: string;
  updatedAt: string;
}

const getIconFromName = (name?: string) => {
  switch (name) {
    case 'wallet': return Wallet;
    case 'credit-card': return CreditCard;
    case 'building': return Building2;
    default: return Landmark;
  }
};

export default function Accounts() {
  const { data: accounts, add, update, remove } = useFirebaseData<Account>('accounts');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [bank, setBank] = useState('');
  const [balance, setBalance] = useState('');

  const resetForm = () => {
    setName('');
    setBank('');
    setBalance('');
    setEditingId(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (acc: Account) => {
    setName(acc.name);
    setBank(acc.bank);
    setBalance(acc.balance.toString());
    setEditingId(acc.id);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !balance) return;

    const b = parseFloat(balance);

    if (editingId) {
      await update(editingId, { name, bank, balance: b });
    } else {
      await add({ 
        name, 
        bank, 
        balance: b, 
        type: 'checking',
        color: 'text-blue-400 bg-blue-500/10',
        iconName: 'landmark'
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

  const totalBalance = accounts.reduce((acc, curr) => acc + curr.balance, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Comptes</h1>
          <p className="text-slate-400 text-sm mt-1">Patrimoine total: <span className="text-white font-bold">{formatCurrency(totalBalance)}</span></p>
        </div>
        <Button onClick={handleOpenAdd} className="gap-2">
          <Plus className="h-5 w-5" />
          Ajouter un compte
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 md:grid-cols-2 gap-4">
        <AnimatePresence mode="popLayout">
          {accounts.map(acc => {
            const Icon = getIconFromName(acc.iconName);
            return (
              <motion.div
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                key={acc.id}
                onClick={() => handleOpenEdit(acc)}
                className="cursor-pointer group"
              >
                <Card className="hover:bg-white/10 transition-colors h-full">
                  <CardContent className="p-6 flex flex-col h-full">
                    <div className="flex items-center gap-4 mb-6">
                      <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", acc.color || 'text-blue-400 bg-blue-500/10')}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">{acc.name}</h3>
                        <p className="text-xs text-slate-400">{acc.bank}</p>
                      </div>
                    </div>
                    <div className="mt-auto pt-4 border-t border-white/5">
                      <p className="text-slate-400 text-sm mb-1">Solde actuel</p>
                      <p className="text-2xl font-bold font-mono text-white tracking-tight">
                        {formatCurrency(acc.balance)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? "Modifier le compte" : "Ajouter un compte"}>
        <form onSubmit={handleSave} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Nom du compte</label>
            <Input required value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Compte Courant Principal" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Institution (Banque/Plateforme)</label>
            <Input required value={bank} onChange={e => setBank(e.target.value)} placeholder="Ex: Boursorama, Binance..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Solde initial (€)</label>
            <Input required type="number" step="0.01" value={balance} onChange={e => setBalance(e.target.value)} placeholder="0.00" />
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
