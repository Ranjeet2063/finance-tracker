import { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { Transaction, EXPENSE_CATEGORIES } from '@/types';
import toast from 'react-hot-toast';
import { FiPlus, FiTrash2, FiEdit2, FiSearch, FiUpload, FiMic } from 'react-icons/fi';

export default function ExpenseList() {
  const [expenses, setExpenses] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ amount: 0, category: 'Food', description: '', date: new Date().toISOString().slice(0, 10) });

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: '20' });
      if (search) params.set('search', search);
      if (category) params.set('category', category);
      const data = await api.getExpenses(params.toString());
      setExpenses(data.expenses);
      setTotalPages(data.pagination.pages);
    } catch (err: any) { toast.error(err.message) }
    finally { setLoading(false) }
  };

  useEffect(() => { fetchExpenses() }, [page, category]);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); setPage(1); fetchExpenses(); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editId) {
        await api.updateExpense(editId, form);
        toast.success('Expense updated');
      } else {
        await api.createExpense(form);
        toast.success('Expense added');
      }
      setShowModal(false);
      setEditId(null);
      setForm({ amount: 0, category: 'Food', description: '', date: new Date().toISOString().slice(0, 10) });
      fetchExpenses();
    } catch (err: any) { toast.error(err.message) }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this expense?')) return;
    try { await api.deleteExpense(id); toast.success('Deleted'); fetchExpenses(); }
    catch (err: any) { toast.error(err.message) }
  };

  const handleEdit = (expense: Transaction) => {
    setEditId(expense._id);
    setForm({ amount: expense.amount, category: expense.category, description: expense.description || '', date: expense.date.slice(0, 10) });
    setShowModal(true);
  };

  const openAdd = () => {
    setEditId(null);
    setForm({ amount: 0, category: 'Food', description: '', date: new Date().toISOString().slice(0, 10) });
    setShowModal(true);
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Expenses</h2>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <FiPlus className="w-4 h-4" /> Add Expense
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearch} className="flex-1 relative">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search expenses..." className="input-field pl-10" />
        </form>
        <select value={category} onChange={e => setCategory(e.target.value)} className="input-field w-full sm:w-48">
          <option value="">All Categories</option>
          {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <button className="btn-secondary flex items-center gap-2"><FiMic className="w-4 h-4" /> Voice</button>
        <button className="btn-secondary flex items-center gap-2"><FiUpload className="w-4 h-4" /> Receipt</button>
      </div>

      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="animate-pulse p-6 space-y-3">{[1,2,3,4,5].map(i => <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg" />)}</div>
        ) : expenses.length === 0 ? (
          <p className="text-center text-gray-400 py-12">No expenses yet. Add your first expense!</p>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {expenses.map(expense => (
              <div key={expense._id} className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold ${
                    categoryColors[expense.category] || 'bg-gray-100 dark:bg-gray-700 text-gray-600'
                  }`}>{expense.category[0]}</div>
                  <div>
                    <p className="font-medium">{expense.description || expense.category}</p>
                    <p className="text-xs text-gray-500">{expense.category} &middot; {new Date(expense.date).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-danger-500">-${expense.amount.toFixed(2)}</span>
                  <button onClick={() => handleEdit(expense)} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg">
                    <FiEdit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(expense._id)} className="p-1.5 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-lg text-danger-500">
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => (
            <button key={i} onClick={() => setPage(i + 1)}
              className={`w-10 h-10 rounded-xl text-sm font-medium ${page === i + 1 ? 'bg-primary-600 text-white' : 'bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>{i + 1}</button>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowModal(false)}>
          <div className="card w-full max-w-md animate-slide-up" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">{editId ? 'Edit Expense' : 'Add Expense'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Amount</label>
                <input type="number" step="0.01" min="0" value={form.amount} onChange={e => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })} className="input-field" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Category</label>
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="input-field">
                  {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Description</label>
                <input type="text" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Date</label>
                <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="input-field" />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1">{editId ? 'Update' : 'Add'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const categoryColors: Record<string, string> = {
  Food: 'bg-orange-100 dark:bg-orange-500/20 text-orange-600',
  Transport: 'bg-blue-100 dark:bg-blue-500/20 text-blue-600',
  Shopping: 'bg-pink-100 dark:bg-pink-500/20 text-pink-600',
  Entertainment: 'bg-purple-100 dark:bg-purple-500/20 text-purple-600',
  Bills: 'bg-red-100 dark:bg-red-500/20 text-red-600',
  Education: 'bg-cyan-100 dark:bg-cyan-500/20 text-cyan-600',
  Health: 'bg-green-100 dark:bg-green-500/20 text-green-600',
  Other: 'bg-gray-100 dark:bg-gray-600 text-gray-600'
};
