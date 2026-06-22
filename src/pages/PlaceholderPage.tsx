import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { motion } from 'motion/react';
import { Settings, Wrench } from 'lucide-react';

export default function PlaceholderPage({ title }: { title: string }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-6"
    >
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">{title}</h1>
          <p className="text-slate-400 text-sm mt-1">Cette module est en cours de développement.</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-12 flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center border border-white/10">
            <Wrench className="h-10 w-10 text-indigo-400" />
          </div>
          <h2 className="text-xl font-semibold text-white">Bientôt disponible</h2>
          <p className="text-slate-400 max-w-md">
            L'équipe travaille activement sur cette fonctionnalité pour vous offrir la meilleure expérience possible sur MoneyFlow Pro.
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
