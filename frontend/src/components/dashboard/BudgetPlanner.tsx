import { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { Budget, EXPENSE_CATEGORIES } from '@/types';
import toast from 'react-hot-toast';
import { FiPlus, FiTrash2 } from 'react-icons/fi';

export default function BudgetPlanner() {
  const [budgets, setBudgets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ category: 'Food', amount: 0, period: 'monthly' as 'weekly' | 'monthly' | 'yearly' });

  const fetchBudgets = async () => {
    try {
      const data = await api.getBudgets();
      setBudgets(data.budgets);
    } catch (err: any) { toast.error(err.message) }
    finally { setLoading(false) }
  };

  useEffect(() => { fetchBudgets() }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createBudget(form);
      toast.success('Budget created');
      setShowAdd(false);
      setForm({ category: 'Food', amount: 0, period: 'monthly' });
      fetchBudgets();
    } catch (err: any) { toast.error(err.message) }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this budget?')) return;
    try { await api.deleteBudget(id); toast.success('Deleted'); fetchBudgets(); }
    catch (err: any) { toast.error(err.message) }
  };

  if (loading) return <div className="animate-pulse space-y-3">{[1,2,3].map(i => <div key={i} className="card h-20" />)}</div>;

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Budget Planner</h2>
        <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-2"><FiPlus className="w-4 h-4" /> Add Budget</button>
      </div>

      {budgets.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-400 mb-4">No budgets set yet</p>
          <button onClick={() => setShowAdd(true)} className="btn-primary">Create Your First Budget</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {budgets.map(b => (
            <div key={b._id} className="card">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary-50 dark:bg-primary-500/20 flex items-center justify-center font-bold text-primary-600">{b.category[0]}</div>
                  <div>
                    <h4 className="font-semibold">{b.category}</h4>
                    <p className="text-xs text-gray-500">{b.period} budget</p>
                  </div>
                </div>
                <button onClick={() => handleDelete(b._id)} className="p-1.5 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-lg text-danger-500">
                  <FiTrash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-gray-500">${(b.spent || 0).toFixed(2)} spent</span>
                <span className="font-medium">${b.amount.toFixed(2)}</span>
              </div>
              <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-500 ${
                  b.percentage >= 100 ? 'bg-danger-500' : b.percentage >= 80 ? 'bg-warning-500' : 'bg-success-500'
                }`} style={{ width: `${b.percentage}%` }} />
              </div>
              <div className="flex justify-between mt-1.5 text-xs">
                <span className={b.percentage >= 100 ? 'text-danger-500' : b.percentage >= 80 ? 'text-warning-500' : 'text-success-500'}>
                  {b.percentage >= 100 ? 'Exceeded' : `${Math.round(b.percentage)}% used`}
                </span>
                <span className="text-gray-500">${(b.remaining || 0).toFixed(2)} remaining</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowAdd(false)}>
          <div className="card w-full max-w-md animate-slide-up" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">Create Budget</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Category</label>
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="input-field">
                  {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Budget Amount ($)</label>
                <input type="number" step="0.01" min="0" value={form.amount} onChange={e => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })} className="input-field" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Period</label>
                <select value={form.period} onChange={e => setForm({ ...form, period: e.target.value as any })} className="input-field">
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowAdd(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1">Create Budget</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
