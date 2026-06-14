import { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import toast from 'react-hot-toast';
import { FiDownload } from 'react-icons/fi';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function ReportsView() {
  const [data, setData] = useState<any>(null);
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.getMonthlyReport(year).then(setData).catch(console.error).finally(() => setLoading(false));
  }, [year]);

  if (loading) return <div className="animate-pulse space-y-4">{[1,2].map(i => <div key={i} className="card h-64" />)}</div>;

  const chartData = data?.months ? {
    labels: data.months.map(m => m.monthName),
    datasets: [
      { label: 'Income', data: data.months.map(m => m.income), backgroundColor: 'rgba(34,197,94,0.7)', borderRadius: 6 },
      { label: 'Expenses', data: data.months.map(m => m.expenses), backgroundColor: 'rgba(239,68,68,0.7)', borderRadius: 6 },
      { label: 'Net', data: data.months.map(m => m.net), backgroundColor: 'rgba(99,102,241,0.7)', borderRadius: 6 }
    ]
  } : null;

  const totals = data?.months ? data.months.reduce((acc: any, m: any) => ({
    income: acc.income + m.income,
    expenses: acc.expenses + m.expenses,
    net: acc.net + m.net
  }), { income: 0, expenses: 0, net: 0 }) : null;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Reports</h2>
        <div className="flex items-center gap-3">
          <select value={year} onChange={e => setYear(parseInt(e.target.value))} className="input-field w-32">
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button className="btn-secondary flex items-center gap-2"><FiDownload className="w-4 h-4" /> Export</button>
        </div>
      </div>

      {totals && (
        <div className="grid grid-cols-3 gap-4">
          <div className="card text-center">
            <p className="text-sm text-gray-500">Total Income</p>
            <p className="text-2xl font-bold text-success-500">${totals.income.toFixed(2)}</p>
          </div>
          <div className="card text-center">
            <p className="text-sm text-gray-500">Total Expenses</p>
            <p className="text-2xl font-bold text-danger-500">${totals.expenses.toFixed(2)}</p>
          </div>
          <div className="card text-center">
            <p className="text-sm text-gray-500">Net Savings</p>
            <p className={`text-2xl font-bold ${totals.net >= 0 ? 'text-success-500' : 'text-danger-500'}`}>${totals.net.toFixed(2)}</p>
          </div>
        </div>
      )}

      <div className="card">
        <h3 className="font-semibold mb-4">Monthly Breakdown - {year}</h3>
        {chartData ? (
          <div className="h-80">
            <Bar data={chartData} options={{
              responsive: true, maintainAspectRatio: false,
              plugins: { legend: { position: 'top' } },
              scales: { y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } } }
            }} />
          </div>
        ) : <p className="text-gray-400 text-center py-12">No data for {year}</p>}
      </div>

      {data?.months && (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700/50">
                  <th className="text-left p-4 font-medium">Month</th>
                  <th className="text-right p-4 font-medium">Income</th>
                  <th className="text-right p-4 font-medium">Expenses</th>
                  <th className="text-right p-4 font-medium">Net</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {data.months.map((m: any) => (
                  <tr key={m.month} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="p-4 font-medium">{m.monthName}</td>
                    <td className="p-4 text-right text-success-500">${m.income.toFixed(2)}</td>
                    <td className="p-4 text-right text-danger-500">${m.expenses.toFixed(2)}</td>
                    <td className={`p-4 text-right font-medium ${m.net >= 0 ? 'text-success-500' : 'text-danger-500'}`}>
                      ${m.net.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
