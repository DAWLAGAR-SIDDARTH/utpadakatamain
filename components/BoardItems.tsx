import React, { useState } from 'react';
import { NoteItem, TaskItem, ExpenseWidgetItem, GroupItem, TaskPriority, Expense } from '../types';
import { NOTE_COLORS, PRIORITY_COLORS } from '../constants';
import { CheckCircle2, Trash2, Plus, DollarSign, Wand2, Calendar, AlertCircle } from 'lucide-react';
import { generateTaskFromText } from '../services/geminiService';

interface ItemProps<T> {
  item: T;
  isSelected: boolean;
  onUpdate: (id: string, updates: Partial<T>) => void;
  onDelete: (id: string) => void;
}

export const NoteCard: React.FC<ItemProps<NoteItem>> = ({ item, isSelected, onUpdate, onDelete }) => {
  const [isAiLoading, setIsAiLoading] = useState(false);

  const handleAiConvert = async () => {
    if (!item.content) return;
    setIsAiLoading(true);
    const taskData = await generateTaskFromText(item.content);
    if (taskData) {
        onUpdate(item.id, { 
            content: `${item.content}\n\n[AI SUGGESTION]\nTitle: ${taskData.title}\nPriority: ${taskData.priority}` 
        });
    }
    setIsAiLoading(false);
  };

  return (
    <div 
      className={`h-full w-full p-4 flex flex-col shadow-sm transition-shadow rounded-sm ${isSelected ? 'ring-2 ring-brand-500 shadow-lg' : ''}`}
      style={{ backgroundColor: item.color }}
    >
      <textarea
        className="flex-1 bg-transparent resize-none outline-none text-slate-900 placeholder-slate-500 font-medium"
        placeholder="Type a note..."
        value={item.content}
        onChange={(e) => onUpdate(item.id, { content: e.target.value })}
        onPointerDown={(e) => e.stopPropagation()} 
      />
      <div className="flex justify-between items-center mt-2 opacity-0 hover:opacity-100 transition-opacity group-hover:opacity-100">
         <button onClick={handleAiConvert} className="p-1 hover:bg-black/10 rounded text-slate-700" title="Convert to Task with AI">
            <Wand2 className={`w-4 h-4 ${isAiLoading ? 'animate-spin' : ''}`} />
         </button>
         <button onClick={() => onDelete(item.id)} className="p-1 hover:bg-black/10 rounded text-red-600">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export const TaskCard: React.FC<ItemProps<TaskItem>> = ({ item, isSelected, onUpdate, onDelete }) => {
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingDesc, setEditingDesc] = useState(false);

  const isOverdue = item.deadline ? new Date(item.deadline) < new Date() && !item.completed : false;
  const isDueSoon = item.deadline ? new Date(item.deadline).getTime() - new Date().getTime() < 86400000 * 2 && !item.completed : false;

  return (
    <div className={`h-full w-full bg-white dark:bg-slate-800 flex flex-col border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden shadow-sm ${isSelected ? 'ring-2 ring-brand-500 shadow-xl' : ''}`}>
      <div className={`h-1 w-full ${item.completed ? 'bg-green-500' : isOverdue ? 'bg-red-500' : 'bg-brand-500'}`} />
      
      <div className="p-3 flex-1 flex flex-col">
        {/* Header: Checkbox & Title */}
        <div className="flex items-start gap-2 mb-2">
           <button onClick={() => onUpdate(item.id, { completed: !item.completed })} className={`mt-1 ${item.completed ? 'text-green-500' : 'text-slate-300 dark:text-slate-600 hover:text-brand-500'}`}>
            <CheckCircle2 className="w-5 h-5" />
          </button>
          
          <div className="flex-1 min-w-0">
            {editingTitle ? (
              <input
                autoFocus
                className="font-semibold text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-900 outline-none w-full border border-brand-200 rounded px-1"
                value={item.title}
                onChange={(e) => onUpdate(item.id, { title: e.target.value })}
                onBlur={() => setEditingTitle(false)}
                onKeyDown={(e) => e.key === 'Enter' && setEditingTitle(false)}
                onPointerDown={(e) => e.stopPropagation()}
              />
            ) : (
              <h3 
                onDoubleClick={() => setEditingTitle(true)}
                className={`font-semibold text-slate-800 dark:text-slate-100 leading-tight truncate cursor-text ${item.completed ? 'line-through text-slate-400 dark:text-slate-500' : ''}`}
                title="Double click to edit title"
              >
                {item.title}
              </h3>
            )}
          </div>
        </div>
        
        {/* Description */}
        <div className="flex-1 relative mb-2 min-h-[3rem]">
          {editingDesc ? (
            <textarea
               autoFocus
               className="text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 resize-none outline-none w-full h-full border border-brand-200 rounded p-1"
               value={item.description}
               onChange={(e) => onUpdate(item.id, { description: e.target.value })}
               onBlur={() => setEditingDesc(false)}
               onPointerDown={(e) => e.stopPropagation()}
            />
          ) : (
            <p 
              onDoubleClick={() => setEditingDesc(true)}
              className="text-sm text-slate-500 dark:text-slate-400 break-words h-full cursor-text whitespace-pre-wrap"
              title="Double click to edit description"
            >
              {item.description || "Add description..."}
            </p>
          )}
        </div>

        {/* Footer: Date, Priority, Delete */}
        <div className="flex flex-col gap-2 mt-auto pt-2 border-t border-slate-100 dark:border-slate-700">
           
           {/* Deadline Row */}
           <div className="flex items-center text-xs text-slate-500 dark:text-slate-400 gap-1">
             <Calendar className={`w-3 h-3 ${isOverdue ? 'text-red-500' : isDueSoon ? 'text-orange-500' : 'text-slate-400 dark:text-slate-600'}`} />
             <input 
               type="date" 
               className={`bg-transparent outline-none cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 rounded px-1 dark:text-slate-300 ${isOverdue ? 'text-red-600 font-bold' : ''}`}
               value={item.deadline || ''}
               onChange={(e) => onUpdate(item.id, { deadline: e.target.value })}
               onPointerDown={(e) => e.stopPropagation()}
             />
             {isOverdue && <AlertCircle className="w-3 h-3 text-red-500" />}
           </div>

           <div className="flex items-center justify-between">
              <select
                className={`text-xs px-2 py-1 rounded-full font-medium outline-none cursor-pointer appearance-none ${PRIORITY_COLORS[item.priority]}`}
                value={item.priority}
                onChange={(e) => onUpdate(item.id, { priority: e.target.value as TaskPriority })}
                onPointerDown={(e) => e.stopPropagation()}
              >
                {Object.values(TaskPriority).map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>

              <button onClick={() => onDelete(item.id)} className="text-slate-400 hover:text-red-500 p-1">
                 <Trash2 className="w-4 h-4" />
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export const GroupCard: React.FC<ItemProps<GroupItem>> = ({ item, isSelected, onUpdate, onDelete }) => {
  return (
    <div 
      className={`h-full w-full flex flex-col rounded-xl border-2 border-dashed transition-all group
        ${isSelected ? 'border-brand-500 bg-brand-50/10 dark:bg-brand-900/10' : 'border-slate-300 dark:border-slate-600 bg-slate-50/30 dark:bg-slate-800/20'}
      `}
    >
      <div className="p-2 border-b border-transparent group-hover:border-slate-200 dark:group-hover:border-slate-700 flex justify-between items-center">
        <input
            className="bg-transparent font-bold text-slate-500 dark:text-slate-400 placeholder-slate-400 outline-none w-2/3"
            value={item.title}
            onChange={(e) => onUpdate(item.id, { title: e.target.value })}
            onPointerDown={(e) => e.stopPropagation()}
            placeholder="Group Name"
        />
        {/* Show delete button if hovered OR selected (for touch devices) */}
        <button 
          onClick={() => onDelete(item.id)} 
          className={`text-slate-400 hover:text-red-500 transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
          title="Delete Group"
        >
            <Trash2 className="w-4 h-4" />
        </button>
      </div>
      {/* Visual cue that this is a container */}
      <div className="flex-1 w-full flex items-center justify-center pointer-events-none opacity-0 hover:opacity-0">
          <span className="text-slate-200 dark:text-slate-700 text-4xl font-bold uppercase tracking-widest">{item.title}</span>
      </div>
    </div>
  );
};

export const ExpenseWidget: React.FC<ItemProps<ExpenseWidgetItem>> = ({ item, isSelected, onUpdate, onDelete }) => {
  const [newAmount, setNewAmount] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const addExpense = () => {
    if (!newAmount || !newDesc) return;
    const expense: Expense = {
      id: Date.now().toString(),
      amount: parseFloat(newAmount),
      description: newDesc,
      date: new Date().toISOString().split('T')[0],
      category: 'General'
    };
    onUpdate(item.id, { expenses: [expense, ...item.expenses] });
    setNewAmount('');
    setNewDesc('');
  };

  const total = item.expenses.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className={`h-full w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm flex flex-col overflow-hidden ${isSelected ? 'ring-2 ring-brand-500' : ''}`}>
      <div className="bg-slate-50 dark:bg-slate-900 p-3 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
        <div className="flex items-center text-slate-700 dark:text-slate-200 font-semibold">
          <DollarSign className="w-4 h-4 mr-1" />
          {item.title}
        </div>
        <button onClick={() => onDelete(item.id)} className="text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-3 no-scrollbar space-y-2">
        {item.expenses.map(exp => (
          <div key={exp.id} className="flex justify-between items-center text-sm p-2 bg-slate-50 dark:bg-slate-700/50 rounded">
             <span className="text-slate-600 dark:text-slate-300 truncate flex-1 mr-2">{exp.description}</span>
             <span className="font-mono font-medium text-slate-800 dark:text-slate-100">${exp.amount.toFixed(2)}</span>
          </div>
        ))}
        {item.expenses.length === 0 && <div className="text-center text-slate-400 dark:text-slate-500 text-xs mt-4">No expenses recorded</div>}
      </div>

      <div className="p-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-700">
        <div className="flex justify-between items-center mb-2 font-bold text-slate-800 dark:text-slate-200">
          <span>Total</span>
          <span>${total.toFixed(2)}</span>
        </div>
        <div className="flex gap-2">
           <input 
             className="w-1/2 p-1 text-xs border border-slate-200 dark:border-slate-600 rounded outline-none bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200" 
             placeholder="Desc" 
             value={newDesc} 
             onChange={e => setNewDesc(e.target.value)}
             onPointerDown={e => e.stopPropagation()}
            />
           <input 
             className="w-1/3 p-1 text-xs border border-slate-200 dark:border-slate-600 rounded outline-none bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200" 
             type="number" 
             placeholder="$" 
             value={newAmount} 
             onChange={e => setNewAmount(e.target.value)}
             onPointerDown={e => e.stopPropagation()}
            />
           <button onClick={addExpense} className="flex-1 bg-brand-500 text-white rounded flex items-center justify-center hover:bg-brand-600">
             <Plus className="w-4 h-4" />
           </button>
        </div>
      </div>
    </div>
  );
};