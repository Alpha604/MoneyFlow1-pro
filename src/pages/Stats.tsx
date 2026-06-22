import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, AreaChart, Area } from 'recharts';
import { useFirebaseData } from '../hooks/useFirebaseData';
import { formatCurrency } from '../lib/utils';
import { ArrowUpRight, ArrowDownRight, PieChart as PieIcon, Activity } from 'lucide-react';

interface Transaction {
  id: string;
  category: string;
  amount: number;
  date: string;
  type: 'expense' | 'income' | 'transfer';
}

interface Goal {
  id: string;
  name: string;
  current: number;
  target: number;
}

const COLORS = ['#6366f1', '#10b981', '#f43f5e', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#64748b'];

const getCustomTooltipStyle = () => ({
  backgroundColor: 'rgba(15, 23, 42, 0.9)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '0.75rem',
  color: '#f1f5f9',
});

export default function Stats() {
  const { data: transactions } = useFirebaseData<Transaction>('transactions');
  const { data: accounts } = useFirebaseData<{ id: string, balance: number }>('accounts');
  const { data: goals } = useFirebaseData<Goal>('goals');

  // Total par catégories (Dépenses uniquement)
  const categoryData = useMemo(() => {
    const expenses = transactions.filter(t => t.type === 'expense');
    const grouped = expenses.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + Math.abs(t.amount);
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value: value as number }))
      .sort((a, b) => b.value - a.value);
  }, [transactions]);

  // Total par catégories (Revenus uniquement)
  const incomeCategoryData = useMemo(() => {
    const income = transactions.filter(t => t.type === 'income');
    const grouped = income.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value: value as number }))
      .sort((a, b) => b.value - a.value);
  }, [transactions]);

  const historicalBalanceData = useMemo(() => {
    const sortedTx = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const totalBalance = accounts.reduce((acc, curr) => acc + curr.balance, 0);
    
    // Simpler: Just group by month, calculate net change per month.
    const groups: Record<string, number> = {};
    sortedTx.forEach(tx => {
      const monthPrefix = tx.date.substring(0, 7);
      if (!groups[monthPrefix]) {
        groups[monthPrefix] = 0;
      }
      if (tx.type === 'income') groups[monthPrefix] += tx.amount;
      else if (tx.type === 'expense') groups[monthPrefix] -= Math.abs(tx.amount);
      // For transfer, if we don't know the exact source/dest in this simplified tx model, we just ignore its net effect
    });

    const sortedMonths = Object.keys(groups).sort();
    if (sortedMonths.length === 0) return [];

    const totalNetChange = sortedTx.reduce((acc, tx) => acc + (tx.type === 'income' ? tx.amount : tx.type === 'expense' ? -Math.abs(tx.amount) : 0), 0);
    let runningBalance = totalBalance - totalNetChange;

    return sortedMonths.map(month => {
      runningBalance += groups[month];
      const dateObj = new Date(month + "-01T00:00:00");
      const monthName = dateObj.toLocaleDateString('fr-FR', { month: 'short' });
      return {
        name: monthName.charAt(0).toUpperCase() + monthName.slice(1),
        balance: runningBalance
      };
    });
  }, [transactions, accounts]);

  // Revenus vs Dépenses par mois
  const monthlyData = useMemo(() => {
    const groups: Record<string, { income: number; expenses: number; transfer: number }> = {};
    transactions.forEach(tx => {
      const month = tx.date.substring(0, 7);
      if (!groups[month]) groups[month] = { income: 0, expenses: 0, transfer: 0 };
      if (tx.type === 'income') groups[month].income += tx.amount;
      else if (tx.type === 'expense') groups[month].expenses += Math.abs(tx.amount);
      else if (tx.type === 'transfer') groups[month].transfer += Math.abs(tx.amount);
    });

    return Object.keys(groups)
      .sort()
      .map(month => {
        const dateObj = new Date(month + "-01T00:00:00");
        const monthName = dateObj.toLocaleDateString('fr-FR', { month: 'short' });
        return {
          name: monthName.charAt(0).toUpperCase() + monthName.slice(1),
          income: groups[month].income,
          expenses: groups[month].expenses,
          transfer: groups[month].transfer,
        };
      });
  }, [transactions]);

  // Types de transactions
  const typeDistribution = useMemo(() => {
    const counts = { income: 0, expense: 0, transfer: 0 };
    transactions.forEach(tx => {
       if (tx.type === 'income') counts.income++;
       else if (tx.type === 'expense') counts.expense++;
       else if (tx.type === 'transfer') counts.transfer++;
    });
    return [
      { name: 'Revenus', value: counts.income, fill: '#10b981' },
      { name: 'Dépenses', value: counts.expense, fill: '#f43f5e' },
      { name: 'Transferts', value: counts.transfer, fill: '#6366f1' },
    ].filter(i => i.value > 0);
  }, [transactions]);

  // Dépenses Journalières (30 derniers jours)
  const last30DaysData = useMemo(() => {
    const data = [];
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayExpenses = transactions.filter(t => t.type === 'expense' && t.date === dateStr).reduce((acc, t) => acc + Math.abs(t.amount), 0);
      data.push({
        date: dateStr,
        displayDate: d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
        amount: dayExpenses
      });
    }
    return data;
  }, [transactions]);

  // Dépenses par jour de la semaine
  const weekdayData = useMemo(() => {
    const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    const totals = [0, 0, 0, 0, 0, 0, 0];
    transactions.filter(t => t.type === 'expense').forEach(t => {
      const d = new Date(t.date);
      totals[d.getDay()] += Math.abs(t.amount);
    });
    return days.map((day, i) => ({ name: day, value: totals[i] }));
  }, [transactions]);

  // Objectifs Data
  const goalsChartData = useMemo(() => {
    return goals.map(g => ({
      name: g.name,
      current: g.current,
      target: g.target
    }));
  }, [goals]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Statistiques</h1>
        <p className="text-slate-400 text-sm mt-1">Analysez vos habitudes financières.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Graph 1: Dépenses par catégorie */}
        <Card className="flex flex-col">
          <CardHeader className="flex flex-row items-center gap-2">
            <PieIcon className="h-5 w-5 text-indigo-400" />
            <CardTitle>Dépenses par catégorie</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col items-center justify-center">
            {categoryData.length > 0 ? (
              <>
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip 
                        contentStyle={getCustomTooltipStyle()}
                        formatter={(value: number) => formatCurrency(value)}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-full mt-4 space-y-2">
                  {categoryData.slice(0, 4).map((cat, i) => (
                    <div key={cat.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="text-slate-300">{cat.name}</span>
                      </div>
                      <span className="font-mono text-white">{formatCurrency(cat.value)}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-slate-500 text-sm py-10">Aucune donnée de dépense disponible.</p>
            )}
          </CardContent>
        </Card>

        {/* Graph 2: Revenus par catégorie */}
        <Card className="flex flex-col">
          <CardHeader className="flex flex-row items-center gap-2">
            <PieIcon className="h-5 w-5 text-emerald-400" />
            <CardTitle>Revenus par catégorie</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col items-center justify-center">
            {incomeCategoryData.length > 0 ? (
              <>
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={incomeCategoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {incomeCategoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[(index + 4) % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip 
                        contentStyle={getCustomTooltipStyle()}
                        formatter={(value: number) => formatCurrency(value)}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-full mt-4 space-y-2">
                  {incomeCategoryData.slice(0, 4).map((cat, i) => (
                    <div key={cat.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[(i + 4) % COLORS.length] }} />
                        <span className="text-slate-300">{cat.name}</span>
                      </div>
                      <span className="font-mono text-white">{formatCurrency(cat.value)}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-slate-500 text-sm py-10">Aucune donnée de revenu disponible.</p>
            )}
          </CardContent>
        </Card>

        {/* Graph 3: Evolution historique */}
        <Card className="flex flex-col">
          <CardHeader className="flex flex-row items-center gap-2">
            <Activity className="h-5 w-5 text-indigo-400" />
            <CardTitle>Evolution Historique Balance</CardTitle>
          </CardHeader>
          <CardContent className="flex-1">
            {historicalBalanceData.length > 0 ? (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={historicalBalanceData} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorHist" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
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
                      tickFormatter={(value) => `${value}€`}
                    />
                    <RechartsTooltip 
                      contentStyle={getCustomTooltipStyle()}
                      formatter={(value: number) => formatCurrency(value)}
                    />
                    <Area type="monotone" name="Solde" dataKey="balance" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorHist)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-slate-500 text-sm py-10 text-center">Aucune donnée disponible.</p>
            )}
          </CardContent>
        </Card>

        {/* Graph 4: Mensuel Revenus x Dépenses */}
        <Card className="flex flex-col">
          <CardHeader className="flex flex-row items-center gap-2">
            <Activity className="h-5 w-5 text-emerald-400" />
            <CardTitle>Revenus vs Dépenses (Mensuel)</CardTitle>
          </CardHeader>
          <CardContent className="flex-1">
            {monthlyData.length > 0 ? (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
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
                      tickFormatter={(value) => `${value}€`}
                    />
                    <RechartsTooltip 
                      contentStyle={getCustomTooltipStyle()}
                      cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                      formatter={(value: number) => formatCurrency(value)}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }} />
                    <Bar name="Revenus" dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} barSize={12} stackId="a" />
                    <Bar name="Dépenses" dataKey="expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={12} stackId="b" />
                    <Bar name="Transferts" dataKey="transfer" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={12} stackId="c" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-slate-500 text-sm py-10 text-center">Aucune donnée disponible.</p>
            )}
          </CardContent>
        </Card>

        {/* Graph 5: Distribution des types */}
        <Card className="flex flex-col">
          <CardHeader className="flex flex-row items-center gap-2">
            <PieIcon className="h-5 w-5 text-amber-400" />
            <CardTitle>Répartition des Types</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col items-center justify-center">
            {typeDistribution.length > 0 ? (
              <>
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={typeDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {typeDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <RechartsTooltip 
                        contentStyle={getCustomTooltipStyle()}
                        formatter={(value: number) => [value, 'Transactions']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-full mt-4 space-y-2">
                  {typeDistribution.map((cat, i) => (
                    <div key={cat.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.fill }} />
                        <span className="text-slate-300">{cat.name}</span>
                      </div>
                      <span className="font-mono text-white">{cat.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-slate-500 text-sm py-10">Aucun type de transaction disponible.</p>
            )}
          </CardContent>
        </Card>
        {/* Graph 6: Dépenses des 30 derniers jours */}
        <Card className="flex flex-col lg:col-span-2">
          <CardHeader className="flex flex-row items-center gap-2">
            <Activity className="h-5 w-5 text-rose-400" />
            <CardTitle>Dépenses Quotidiennes (30 derniers jours)</CardTitle>
          </CardHeader>
          <CardContent className="flex-1">
            {last30DaysData.length > 0 ? (
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={last30DaysData} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="color30" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                    <XAxis 
                      dataKey="displayDate" 
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
                      tickFormatter={(value) => `${value}€`}
                    />
                    <RechartsTooltip 
                      contentStyle={getCustomTooltipStyle()}
                      formatter={(value: number) => formatCurrency(value)}
                    />
                    <Area type="monotone" name="Dépenses" dataKey="amount" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#color30)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-slate-500 text-sm py-10 text-center">Aucune donnée disponible.</p>
            )}
          </CardContent>
        </Card>

        {/* Graph 7: Dépenses par jour de la semaine */}
        <Card className="flex flex-col">
          <CardHeader className="flex flex-row items-center gap-2">
            <PieIcon className="h-5 w-5 text-sky-400" />
            <CardTitle>Dépenses par Jour de la Semaine</CardTitle>
          </CardHeader>
          <CardContent className="flex-1">
            {weekdayData.some(d => d.value > 0) ? (
              <div className="h-[250px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weekdayData} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" horizontal={true} vertical={false} />
                    <XAxis 
                      type="number"
                      stroke="#94a3b8" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false}
                      tickFormatter={(value) => `${value}€`}
                    />
                    <YAxis 
                      type="category"
                      dataKey="name" 
                      stroke="#94a3b8" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false}
                    />
                    <RechartsTooltip 
                      contentStyle={getCustomTooltipStyle()}
                      formatter={(value: number) => formatCurrency(value)}
                    />
                    <Bar name="Dépenses" dataKey="value" fill="#38bdf8" radius={[0, 4, 4, 0]} barSize={12} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-slate-500 text-sm py-10 text-center">Aucune donnée disponible.</p>
            )}
          </CardContent>
        </Card>

        {/* Graph 8: Progression des Objectifs */}
        <Card className="flex flex-col">
          <CardHeader className="flex flex-row items-center gap-2">
            <Activity className="h-5 w-5 text-purple-400" />
            <CardTitle>Progression des Objectifs</CardTitle>
          </CardHeader>
          <CardContent className="flex-1">
            {goalsChartData.length > 0 ? (
              <div className="h-[250px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={goalsChartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
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
                      tickFormatter={(value) => `${value}€`}
                    />
                    <RechartsTooltip 
                      contentStyle={getCustomTooltipStyle()}
                      formatter={(value: number) => formatCurrency(value)}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }} />
                    <Bar name="Actuel" dataKey="current" fill="#a855f7" radius={[4, 4, 0, 0]} barSize={12} />
                    <Bar name="Cible" dataKey="target" fill="#334155" radius={[4, 4, 0, 0]} barSize={12} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-slate-500 text-sm py-10 text-center">Aucun objectif défini.</p>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
