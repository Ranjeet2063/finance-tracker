import { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { Transaction, INCOME_CATEGORIES } from '@/types';
import toast from 'react-hot-toast';
import { FiPlus, FiTrash2, FiEdit2 } from 'react-icons/fi';

export default function IncomeList() {
  const [incomes, setIncomes] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ amount: 0, category: 'Salary', description: '', date: new Date().toISOString().slice(0, 10) });

  const fetchIncomes = async () => {
    setLoading(true);
    try {
      const data = await api.getIncomes(`page=${page}&limit=20`);
      setIncomes(data.incomes);
      setTotalPages(data.pagination.pages);
    } catch (err: any) { toast.error(err.message) }
    finally { setLoading(false) }
  };

  useEffect(() => { fetchIncomes() }, [page]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editId) { await api.updateIncome(editId, form); toast.success('Income updated'); }
      else { await api.createIncome(form); toast.success('Income added'); }
      setShowModal(false); setEditId(null);
      setForm({ amount: 0, category: 'Salary', description: '', date: new Date().toISOString().slice(0, 10) });
      fetchIncomes();
    } catch (err: any) { toast.error(err.message) }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this income record?')) return;
    try { await api.deleteIncome(id); toast.success('Deleted'); fetchIncomes(); }
    catch (err: any) { toast.error(err.message) }
  };

  const handleEdit = (income: Transaction) => {
    setEditId(income._id);
    setForm({ amount: income.amount, category: income.category, description: income.description || '', date: income.date.slice(0, 10) });
    setShowModal(true);
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Income</h2>
        <button onClick={() => { setEditId(null); setForm({ amount: 0, category: 'Salary', description: '', date: new Date().toISOString().slice(0, 10) }); setShowModal(true); }}
          className="btn-primary flex items-center gap-2"><FiPlus className="w-4 h-4" /> Add Income</button>
      </div>

      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="animate-pulse p-6 space-y-3">{[1,2,3].map(i => <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg" />)}</div>
        ) : incomes.length === 0 ? (
          <p className="text-center text-gray-400 py-12">No income records yet.</p>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {incomes.map(income => (
              <div key={income._id} className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-success-50 dark:bg-success-500/20 flex items-center justify-center text-sm font-bold text-success-600">+</div>
                  <div>
                    <p className="font-medium">{income.description || income.category}</p>
                    <p className="text-xs text-gray-500">{income.category} &middot; {new Date(income.date).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-success-500">+${income.amount.toFixed(2)}</span>
                  <button onClick={() => handleEdit(income)} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg">
                    <FiEdit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(income._id)} className="p-1.5 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-lg text-danger-500">
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowModal(false)}>
          <div className="card w-full max-w-md animate-slide-up" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">{editId ? 'Edit Income' : 'Add Income'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Amount</label>
                <input type="number" step="0.01" min="0" value={form.amount} onChange={e => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })} className="input-field" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Category</label>
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="input-field">
                  {INCOME_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
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
