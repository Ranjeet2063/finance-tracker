import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/router';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import DashboardOverview from '@/components/dashboard/DashboardOverview';
import ExpenseList from '@/components/expenses/ExpenseList';
import IncomeList from '@/components/income/IncomeList';
import BudgetPlanner from '@/components/dashboard/BudgetPlanner';
import ReportsView from '@/components/reports/ReportsView';
import AIAssistant from '@/components/ai/AIAssistant';
import ChatBot from '@/components/chatbot/ChatBot';
import NotificationsPanel from '@/components/notifications/NotificationsPanel';

export default function Dashboard() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (isLoading) return <LoadingScreen />;
  if (!user) { router.push('/login'); return null; }

  const renderTab = () => {
    switch (activeTab) {
      case 'overview': return <DashboardOverview />;
      case 'expenses': return <ExpenseList />;
      case 'income': return <IncomeList />;
      case 'budget': return <BudgetPlanner />;
      case 'reports': return <ReportsView />;
      case 'ai': return <AIAssistant />;
      default: return <DashboardOverview />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="lg:ml-64">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="p-4 lg:p-6 max-w-7xl mx-auto">
          {renderTab()}
        </main>
      </div>
      <ChatBot />
      <NotificationsPanel />
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="animate-pulse text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700" />
        <p className="text-gray-500">Loading your finances...</p>
      </div>
    </div>
  );
}
