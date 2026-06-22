import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Wallet, TrendingUp, TrendingDown, Target, Zap, CircleDollarSign, ArrowUpRight } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { formatCurrency, cn } from '../lib/utils';
import { motion } from 'motion/react';
import { useFirebaseData } from '../hooks/useFirebaseData';

const getCustomTooltipStyle = () => ({
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  backdropFilter: 'blur(16px)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '0.75rem',
  color: '#f1f5f9',
});

interface Transaction {
  id: string;
  label: string;
  category: string;
  amount: number;
  date: string;
  type: 'expense' | 'income';
}

interface Account {
  id: string;
  balance: number;
}

interface Goal {
  id: string;
  current: number;
}

export default function Dashboard() {
  const { data: accounts } = useFirebaseData<Account>('accounts');
  const { data: transactions } = useFirebaseData<Transaction>('transactions');
  const { data: goals } = useFirebaseData<Goal>('goals');

  const totalBalance = useMemo(() => accounts.reduce((acc, a) => acc + a.balance, 0), [accounts]);
  
  const totalIncome = useMemo(() => 
    transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0), 
  [transactions]);

  const totalExpense = useMemo(() => 
    transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + Math.abs(t.amount), 0), 
  [transactions]);

  const totalSavings = useMemo(() => goals.reduce((acc, g) => acc + g.current, 0), [goals]);

  const recentTransactions = useMemo(() => {
    return [...transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [transactions]);

  // Nouveaux KPIs
  const savingsRate = useMemo(() => {
    if (totalIncome === 0) return 0;
    const rate = ((totalIncome - totalExpense) / totalIncome) * 100;
    return rate > 0 ? rate : 0;
  }, [totalIncome, totalExpense]);

  const topCategory = useMemo(() => {
    const expenses = transactions.filter(t => t.type === 'expense');
    if (expenses.length === 0) return 'Aucune';
    const cats: Record<string, number> = {};
    expenses.forEach(t => {
      cats[t.category] = (cats[t.category] || 0) + Math.abs(t.amount);
    });
    return Object.entries(cats).sort((a, b) => b[1] - a[1])[0][0];
  }, [transactions]);

  const biggestExpense = useMemo(() => {
    const expenses = transactions.filter(t => t.type === 'expense');
    if (expenses.length === 0) return 0;
    return Math.max(...expenses.map(t => Math.abs(t.amount)));
  }, [transactions]);

  const chartData = useMemo(() => {
    const groups: Record<string, { income: number; expenses: number }> = {};
    transactions.forEach(tx => {
      const monthPrefix = tx.date.substring(0, 7);
      if (!groups[monthPrefix]) {
        groups[monthPrefix] = { income: 0, expenses: 0 };
      }
      if (tx.type === 'income') {
        groups[monthPrefix].income += tx.amount;
      } else {
        groups[monthPrefix].expenses += Math.abs(tx.amount);
      }
    });

    const sortedMonths = Object.keys(groups).sort();
    
    if (sortedMonths.length === 0) {
      return [{ name: 'Actuel', balance: totalBalance, expenses: 0, income: 0 }];
    }

    const totalNetChange = transactions.reduce((acc, tx) => {
      return acc + (tx.type === 'income' ? tx.amount : -Math.abs(tx.amount));
    }, 0);

    let runningBalance = totalBalance - totalNetChange;
    
    return sortedMonths.map(month => {
      const { income, expenses } = groups[month];
      runningBalance += (income - expenses);
      
      const dateObj = new Date(month + "-01T00:00:00");
      const monthName = dateObj.toLocaleDateString('fr-FR', { month: 'short' });
      return {
        name: monthName.charAt(0).toUpperCase() + monthName.slice(1),
        fullMonth: month,
        balance: runningBalance,
        income,
        expenses
      };
    });
  }, [transactions, totalBalance]);

  return (
    <div className="space-y-6">
      
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Tableau de bord</h1>
          <p className="text-slate-400 text-sm mt-1">Aperçu financier basé sur vos données en temps réel.</p>
        </div>
        <div className="flex items-center gap-2 bg-indigo-500/10 text-indigo-400 px-4 py-2 rounded-xl text-sm font-medium border border-indigo-500/20">
          <Zap className="h-4 w-4" />
          IA: Vos données sont synchronisées en toute sécurité.
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400">Solde Total</p>
                <p className="text-3xl font-bold text-white mt-1">{formatCurrency(totalBalance)}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-white/10 border border-white/5 flex items-center justify-center text-slate-300">
                <Wallet className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400">Revenus</p>
                <p className="text-3xl font-bold text-white mt-1">{formatCurrency(totalIncome)}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                <TrendingUp className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400">Dépenses</p>
                <p className="text-3xl font-bold text-white mt-1">{formatCurrency(totalExpense)}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-400">
                <TrendingDown className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400">Épargne & Objectifs</p>
                <p className="text-3xl font-bold text-white mt-1">{formatCurrency(totalSavings)}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                <Target className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-indigo-500/10 to-transparent border-indigo-500/20">
          <CardContent className="p-4 sm:p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-indigo-300">Taux d'Épargne</p>
              <p className="text-2xl font-bold text-white mt-1">{savingsRate.toFixed(1)}%</p>
            </div>
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Target className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-rose-500/10 to-transparent border-rose-500/20">
          <CardContent className="p-4 sm:p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-rose-300">Plus grande dépense</p>
              <p className="text-2xl font-bold text-white mt-1">{formatCurrency(biggestExpense)}</p>
            </div>
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-400">
              <TrendingDown className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/10 to-transparent border-amber-500/20">
          <CardContent className="p-4 sm:p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-amber-300">Poste principal</p>
              <p className="text-2xl font-bold text-white mt-1 capitalize truncate max-w-[150px]">{topCategory}</p>
            </div>
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400">
              <Zap className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Charts area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Évolution Historique</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `€${value / 1000}k`} />
                  <Tooltip contentStyle={getCustomTooltipStyle()} itemStyle={{ color: '#6366f1' }} formatter={(value: number) => formatCurrency(value)} />
                  <Area type="monotone" dataKey="balance" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorBalance)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Recent Transactions List inside Dashboard */}
        <Card className="flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle>Dernières Transactions</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto max-h-[300px]">
            <div className="space-y-4 pt-4">
              {recentTransactions.length === 0 ? (
                <p className="text-slate-500 text-sm text-center">Aucune transaction.</p>
              ) : (
                recentTransactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "h-10 w-10 rounded-full flex items-center justify-center border shrink-0",
                        tx.type === 'income' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-white/5 text-slate-300 border-white/10"
                      )}>
                        {tx.type === 'income' ? <TrendingUp className="h-5 w-5" /> : <CircleDollarSign className="h-5 w-5" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-slate-200 text-sm truncate">{tx.label}</p>
                        <p className="text-xs text-slate-500 truncate">{tx.category} • {tx.date}</p>
                      </div>
                    </div>
                    <div className={cn("font-medium text-sm whitespace-nowrap pl-2", tx.type === 'income' ? "text-emerald-400" : "text-white")}>
                      {tx.type === 'income' ? '+' : ''}{formatCurrency(tx.amount)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Second Chart area row */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Flux de trésorerie (Mensuel)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    stroke="#94a3b8" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="#94a3b8" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false}
                    tickFormatter={(value) => `${value / 1000}k`}
                  />
                  <Tooltip 
                    contentStyle={getCustomTooltipStyle()}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Bar name="Revenus" dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} barSize={16} />
                  <Bar name="Dépenses" dataKey="expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

      </div>

    </div>
  );
}
