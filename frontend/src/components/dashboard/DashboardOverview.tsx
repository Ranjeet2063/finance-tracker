import { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { DashboardStats, FinancialHealth } from '@/types';
import { FiTrendingUp, FiTrendingDown, FiDollarSign, FiPieChart } from 'react-icons/fi';
import { Doughnut, Line } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Filler } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Filler);

export default function DashboardOverview() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [health, setHealth] = useState<FinancialHealth | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getDashboard('period=monthly'),
      api.getFinancialHealth()
    ]).then(([s, h]) => {
      setStats(s);
      setHealth(h);
    }).catch(console.error)
    .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="animate-pulse space-y-4">{[1,2,3].map(i => <div key={i} className="card h-24" />)}</div>;

  const donutData = stats?.categoryBreakdown ? {
    labels: stats.categoryBreakdown.map(c => c._id),
    datasets: [{
      data: stats.categoryBreakdown.map(c => c.total),
      backgroundColor: ['#6366f1','#22c55e','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#f97316','#ec4899'],
      borderWidth: 0
    }]
  } : null;

  const trendData = stats?.trends ? {
    labels: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
    datasets: [
      { label: 'Income', data: Array(12).fill(0).map((_, i) => stats.trends.filter(t => t._id.month === i+1 && t._id.type === 'income').reduce((s: number, t: any) => s + t.total, 0)), borderColor: '#22c55e', backgroundColor: 'rgba(34,197,94,0.1)', fill: true, tension: 0.4 },
      { label: 'Expenses', data: Array(12).fill(0).map((_, i) => stats.trends.filter(t => t._id.month === i+1 && t._id.type === 'expense').reduce((s: number, t: any) => s + t.total, 0)), borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.1)', fill: true, tension: 0.4 }
    ]
  } : null;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={FiDollarSign} label="Total Income" value={`$${(stats?.totalIncome || 0).toLocaleString()}`} color="text-success-500" bg="bg-success-50 dark:bg-success-500/10" />
        <StatCard icon={FiTrendingUp} label="Total Expenses" value={`$${(stats?.totalExpenses || 0).toLocaleString()}`} color="text-danger-500" bg="bg-danger-50 dark:bg-danger-500/10" />
        <StatCard icon={FiTrendingDown} label="Net Savings" value={`$${(stats?.netSavings || 0).toLocaleString()}`} color={stats && stats.netSavings >= 0 ? 'text-success-500' : 'text-danger-500'} bg="bg-primary-50 dark:bg-primary-500/10" />
        <StatCard icon={FiPieChart} label="Savings Rate" value={`${stats?.savingsRate || 0}%`} color="text-primary-500" bg="bg-warning-50 dark:bg-warning-500/10" />
      </div>

      {health && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Financial Health Score</h3>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              health.score >= 80 ? 'badge-success' : health.score >= 60 ? 'badge-warning' : 'badge-danger'
            }`}>{health.category}</div>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative w-24 h-24">
              <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="8" className="text-gray-200 dark:text-gray-700" />
                <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="8" strokeDasharray={`${2 * Math.PI * 42}`} strokeDashoffset={`${2 * Math.PI * 42 * (1 - health.score / 100)}`}
                  className={`${health.score >= 80 ? 'text-success-500' : health.score >= 60 ? 'text-warning-500' : 'text-danger-500'}`} strokeLinecap="round" />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-xl font-bold">{health.score}</span>
            </div>
            <div className="flex-1 space-y-1">
              <p className="text-sm text-gray-600 dark:text-gray-400">{health.description}</p>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(health.components).map(([key, val]: [string, any]) => (
                  <div key={key} className="flex items-center gap-2 text-xs">
                    <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-primary-500" style={{ width: `${val}%` }} />
                    </div>
                    <span className="text-gray-500 w-16 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="font-semibold mb-4">Spending by Category</h3>
          {donutData ? (
            <div className="flex items-center justify-center h-64">
              <Doughnut data={donutData} options={{ cutout: '65%', plugins: { legend: { position: 'right', labels: { boxWidth: 12, padding: 12 } } } }} />
            </div>
          ) : <p className="text-gray-400 text-center py-12">No data yet</p>}
        </div>

        <div className="card">
          <h3 className="font-semibold mb-4">Income vs Expenses</h3>
          {trendData ? (
            <div className="h-64">
              <Line data={trendData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' } }, scales: { y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } } } }} />
            </div>
          ) : <p className="text-gray-400 text-center py-12">No trend data yet</p>}
        </div>
      </div>

      {stats?.recentTransactions && stats.recentTransactions.length > 0 && (
        <div className="card">
          <h3 className="font-semibold mb-4">Recent Transactions</h3>
          <div className="space-y-2">
            {stats.recentTransactions.map(t => (
              <div key={t._id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold ${
                    t.type === 'income' ? 'bg-success-50 dark:bg-success-500/20 text-success-600' : 'bg-danger-50 dark:bg-danger-500/20 text-danger-600'
                  }`}>{t.type === 'income' ? '+' : '-'}</div>
                  <div>
                    <p className="text-sm font-medium">{t.description || t.category}</p>
                    <p className="text-xs text-gray-500">{t.category} &middot; {new Date(t.date).toLocaleDateString()}</p>
                  </div>
                </div>
                <span className={`font-semibold ${t.type === 'income' ? 'text-success-500' : 'text-danger-500'}`}>
                  {t.type === 'income' ? '+' : '-'}${t.amount.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color, bg }: { icon: any; label: string; value: string; color: string; bg: string }) {
  return (
    <div className="card flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center`}>
        <Icon className={`w-6 h-6 ${color}`} />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-xl font-bold">{value}</p>
      </div>
    </div>
  );
}
