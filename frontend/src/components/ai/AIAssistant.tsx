import { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { AIPrediction, SavingAdvice, FinancialHealth } from '@/types';
import toast from 'react-hot-toast';
import { FiCpu, FiTrendingUp, FiAlertCircle, FiShield, FiRefreshCw } from 'react-icons/fi';

export default function AIAssistant() {
  const [predictions, setPredictions] = useState<AIPrediction | null>(null);
  const [advice, setAdvice] = useState<SavingAdvice[]>([]);
  const [health, setHealth] = useState<FinancialHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'predictions' | 'advice' | 'health'>('predictions');

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [predData, adviceData, healthData] = await Promise.all([
        api.getPredictions().catch(() => null),
        api.getSavingAdvice(),
        api.getFinancialHealth()
      ]);
      if (predData?.predictions) setPredictions(predData.predictions);
      setAdvice(adviceData.advice);
      setHealth(healthData.health);
    } catch (err: any) { toast.error('Failed to load AI data'); }
    finally { setLoading(false) }
  };

  if (loading) return <div className="animate-pulse space-y-4">{[1,2,3].map(i => <div key={i} className="card h-32" />)}</div>;

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">AI Financial Assistant</h2>
        <button onClick={fetchAll} className="btn-secondary flex items-center gap-2"><FiRefreshCw className="w-4 h-4" /> Refresh</button>
      </div>

      <div className="flex gap-2">
        {(['predictions', 'advice', 'health'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all capitalize ${
              activeTab === tab ? 'bg-primary-600 text-white' : 'bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}>{tab}</button>
        ))}
      </div>

      {activeTab === 'predictions' && predictions && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-2"><FiTrendingUp /> Next Week</div>
            <p className="text-2xl font-bold">${predictions.nextWeek.amount.toFixed(2)}</p>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-primary-500" style={{ width: `${predictions.nextWeek.confidence}%` }} />
              </div>
              <span className="text-xs text-gray-500">{predictions.nextWeek.confidence}% confidence</span>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-2"><FiCpu /> Next Month</div>
            <p className="text-2xl font-bold">${predictions.nextMonth.amount.toFixed(2)}</p>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-primary-500" style={{ width: `${predictions.nextMonth.confidence}%` }} />
              </div>
              <span className="text-xs text-gray-500">{predictions.nextMonth.confidence}% confidence</span>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-2"><FiAlertCircle /> Predicted Savings</div>
            <p className={`text-2xl font-bold ${predictions.nextMonthSavings >= 0 ? 'text-success-500' : 'text-danger-500'}`}>
              ${(predictions.nextMonthSavings || 0).toFixed(2)}
            </p>
            <p className="text-xs text-gray-500 mt-2">Trend: {predictions.trend}</p>
          </div>
        </div>
      )}

      {activeTab === 'advice' && (
        <div className="space-y-3">
          {advice.length === 0 ? (
            <div className="card text-center py-12 text-gray-400">No saving advice available yet</div>
          ) : advice.map((a, i) => (
            <div key={i} className="card flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-success-50 dark:bg-success-500/20 flex items-center justify-center flex-shrink-0">
                <FiShield className="w-5 h-5 text-success-500" />
              </div>
              <div className="flex-1">
                <p className="font-medium">{a.message}</p>
                {a.potentialSavings > 0 && (
                  <p className="text-sm text-success-500 mt-1">Potential savings: ${a.potentialSavings}/month</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'health' && health && (
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Financial Health</h3>
            <div className={`px-4 py-1.5 rounded-full text-sm font-medium ${
              health.score >= 80 ? 'badge-success' : health.score >= 60 ? 'badge-warning' : 'badge-danger'
            }`}>{health.category}</div>
          </div>

          <div className="flex items-center justify-center mb-8">
            <div className="relative w-40 h-40">
              <svg className="w-40 h-40 -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="8" className="text-gray-200 dark:text-gray-700" />
                <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="8"
                  strokeDasharray={`${2 * Math.PI * 42}`} strokeDashoffset={`${2 * Math.PI * 42 * (1 - health.score / 100)}`}
                  className={health.score >= 80 ? 'text-success-500' : health.score >= 60 ? 'text-warning-500' : 'text-danger-500'}
                  strokeLinecap="round" />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-3xl font-bold">{health.score}</span>
            </div>
          </div>

          <p className="text-center text-gray-600 dark:text-gray-400 mb-6">{health.description}</p>

          <div className="grid grid-cols-2 gap-4 mb-6">
            {Object.entries(health.components).map(([key, val]: [string, any]) => (
              <div key={key}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                  <span className="font-medium">{val}/100</span>
                </div>
                <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${val >= 80 ? 'bg-success-500' : val >= 60 ? 'bg-warning-500' : 'bg-danger-500'}`}
                    style={{ width: `${val}%` }} />
                </div>
              </div>
            ))}
          </div>

          <div>
            <h4 className="font-medium mb-2">How to Improve</h4>
            <ul className="space-y-2">
              {health.improvements.map((imp, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <span className="w-5 h-5 rounded-full bg-primary-100 dark:bg-primary-500/20 text-primary-600 flex items-center justify-center flex-shrink-0 text-xs">{i + 1}</span>
                  {imp}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {activeTab === 'predictions' && !predictions && (
        <div className="card text-center py-12">
          <FiCpu className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-400">Not enough data for predictions. Add more transactions.</p>
        </div>
      )}
    </div>
  );
}
