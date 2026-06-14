import React from 'react';
import { FiGrid, FiTrendingUp, FiDollarSign, FiPieChart, FiBarChart2, FiCpu, FiBell, FiLogOut, FiChevronLeft } from 'react-icons/fi';
import { useAuth } from '@/context/AuthContext';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

const menuItems = [
  { id: 'overview', label: 'Overview', icon: FiGrid },
  { id: 'expenses', label: 'Expenses', icon: FiTrendingUp },
  { id: 'income', label: 'Income', icon: FiDollarSign },
  { id: 'budget', label: 'Budget', icon: FiPieChart },
  { id: 'reports', label: 'Reports', icon: FiBarChart2 },
  { id: 'ai', label: 'AI Assistant', icon: FiCpu },
];

export default function Sidebar({ activeTab, onTabChange, isOpen, onClose }: SidebarProps) {
  const { user, logout } = useAuth();

  const handleLogout = () => { logout(); };

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />}
      <aside className={`fixed top-0 left-0 z-50 h-full w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-300 lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className="p-5 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
                  <span className="text-lg font-bold text-white">$</span>
                </div>
                <div>
                  <h2 className="font-semibold">FinanceTracker</h2>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
              </div>
              <button onClick={onClose} className="lg:hidden p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <FiChevronLeft className="w-5 h-5" />
              </button>
            </div>
          </div>

          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {menuItems.map(item => {
              const Icon = item.icon;
              return (
                <button key={item.id} onClick={() => { onTabChange(item.id); onClose(); }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    activeTab === item.id
                      ? 'bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                  }`}>
                  <Icon className="w-5 h-5" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="p-3 border-t border-gray-200 dark:border-gray-700">
            <button onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 transition-all duration-200">
              <FiLogOut className="w-5 h-5" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
