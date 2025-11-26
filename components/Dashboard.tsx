import React, { useMemo } from 'react';
import { Expense, BoardItem, ItemType } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { ArrowLeft, Wallet, CheckCircle } from 'lucide-react';
import { Button } from './UIComponents';

interface DashboardProps {
  items: BoardItem[];
  globalExpenses: Expense[];
  onBack: () => void;
}

const COLORS = ['#0ea5e9', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

export const Dashboard: React.FC<DashboardProps> = ({ items, globalExpenses, onBack }) => {
  
  // Aggregate tasks
  const taskStats = useMemo(() => {
    const tasks = items.filter(i => i.type === ItemType.TASK) as any[];
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const pending = total - completed;
    const byPriority = tasks.reduce((acc: any, t) => {
      acc[t.priority] = (acc[t.priority] || 0) + 1;
      return acc;
    }, {});
    
    return { total, completed, pending, byPriority };
  }, [items]);

  // Aggregate expenses
  const expenseStats = useMemo(() => {
    // Combine widget expenses and global expenses if needed, for now just use global passed in
    // Note: In real app, we might merge board expenses into global state
    
    // Group by Date for line chart
    const byDate = globalExpenses.reduce((acc: any, curr) => {
      acc[curr.date] = (acc[curr.date] || 0) + curr.amount;
      return acc;
    }, {});
    
    const lineData = Object.keys(byDate).map(date => ({ date, amount: byDate[date] })).sort((a,b) => a.date.localeCompare(b.date));

    // Group by Category (simulate category by description keywords for demo)
    const byCat = globalExpenses.reduce((acc: any, curr) => {
      const cat = curr.category || 'General';
      acc[cat] = (acc[cat] || 0) + curr.amount;
      return acc;
    }, {});
    
    const pieData = Object.keys(byCat).map(name => ({ name, value: byCat[name] }));

    const total = globalExpenses.reduce((sum, e) => sum + e.amount, 0);

    return { total, lineData, pieData };
  }, [globalExpenses]);

  return (
    <div className="h-full w-full bg-slate-50 dark:bg-slate-900 overflow-y-auto p-6 animate-fade-in transition-colors duration-200">
      <div className="max-w-6xl mx-auto pb-10">
        <div className="flex items-center mb-8">
          <Button variant="ghost" onClick={onBack} className="mr-4">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Personal Dashboard</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
           <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
             <div className="flex items-center text-slate-500 dark:text-slate-400 mb-2">
               <CheckCircle className="w-4 h-4 mr-2" /> Total Tasks
             </div>
             <div className="text-3xl font-bold text-slate-800 dark:text-slate-100">{taskStats.total}</div>
           </div>
           <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
             <div className="flex items-center text-green-600 dark:text-green-500 mb-2">
               <CheckCircle className="w-4 h-4 mr-2" /> Completed
             </div>
             <div className="text-3xl font-bold text-slate-800 dark:text-slate-100">{taskStats.completed}</div>
           </div>
           <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
             <div className="flex items-center text-slate-500 dark:text-slate-400 mb-2">
               <Wallet className="w-4 h-4 mr-2" /> Total Expenses
             </div>
             <div className="text-3xl font-bold text-slate-800 dark:text-slate-100">${expenseStats.total.toFixed(2)}</div>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 h-80">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">Task Completion</h3>
             <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { name: 'Completed', value: taskStats.completed },
                  { name: 'Pending', value: taskStats.pending }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#475569" />
                  <XAxis dataKey="name" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip cursor={{fill: 'transparent'}} contentStyle={{backgroundColor: '#1e293b', border: 'none', color: '#f1f5f9'}} />
                  <Bar dataKey="value" fill="#0ea5e9" radius={[4,4,0,0]} barSize={60} />
                </BarChart>
             </ResponsiveContainer>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 h-80">
             <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">Expense Trend</h3>
             <ResponsiveContainer width="100%" height="100%">
                <LineChart data={expenseStats.lineData}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#475569" />
                   <XAxis dataKey="date" stroke="#94a3b8" />
                   <YAxis stroke="#94a3b8" />
                   <Tooltip contentStyle={{backgroundColor: '#1e293b', border: 'none', color: '#f1f5f9'}} />
                   <Line type="monotone" dataKey="amount" stroke="#8b5cf6" strokeWidth={3} dot={{r:4}} />
                </LineChart>
             </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};