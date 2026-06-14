import { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { Notification as NotificationType } from '@/types';
import { FiBell, FiX, FiCheck, FiTrash2 } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function NotificationsPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (isOpen) fetchNotifications();
  }, [isOpen]);

  const fetchNotifications = async () => {
    try {
      const data = await api.getNotifications('limit=20');
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch { }
  };

  const markAsRead = async (id: string) => {
    try { await api.markAsRead(id); fetchNotifications(); }
    catch (err: any) { toast.error(err.message) }
  };

  const markAllRead = async () => {
    try { await api.markAllAsRead(); fetchNotifications(); toast.success('All marked as read'); }
    catch (err: any) { toast.error(err.message) }
  };

  const deleteNotif = async (id: string) => {
    try { await api.deleteNotification(id); fetchNotifications(); }
    catch (err: any) { toast.error(err.message) }
  };

  const severityColors: Record<string, string> = {
    info: 'bg-primary-50 dark:bg-primary-500/10 border-primary-200 dark:border-primary-500/20',
    warning: 'bg-warning-50 dark:bg-warning-500/10 border-warning-200 dark:border-warning-500/20',
    danger: 'bg-danger-50 dark:bg-danger-500/10 border-danger-200 dark:border-danger-500/20',
    success: 'bg-success-50 dark:bg-success-500/10 border-success-200 dark:border-success-500/20'
  };

  return (
    <>
      <button onClick={() => setIsOpen(!isOpen)} className="fixed top-4 right-20 z-30 relative">
        <FiBell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-danger-500 text-white text-xs flex items-center justify-center font-medium">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="fixed right-4 top-16 z-50 w-80 sm:w-96 max-h-[600px] card flex flex-col shadow-2xl animate-slide-up">
          <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <FiBell className="w-5 h-5" />
              <h4 className="font-semibold">Notifications</h4>
              {unreadCount > 0 && <span className="badge-danger">{unreadCount} new</span>}
            </div>
            <div className="flex gap-1">
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-xs">Mark all read</button>
              )}
              <button onClick={() => setIsOpen(false)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <FiX className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto py-2 space-y-2 scrollbar-hide">
            {notifications.length === 0 ? (
              <p className="text-center text-gray-400 py-8 text-sm">No notifications</p>
            ) : notifications.map(n => (
              <div key={n._id} className={`p-3 rounded-xl border text-sm ${severityColors[n.severity] || severityColors.info} ${!n.read ? 'ring-1 ring-primary-500/20' : ''}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{n.title}</p>
                    <p className="text-gray-500 text-xs mt-0.5">{n.message}</p>
                    <p className="text-gray-400 text-xs mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="flex gap-1">
                    {!n.read && (
                      <button onClick={() => markAsRead(n._id)} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded">
                        <FiCheck className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button onClick={() => deleteNotif(n._id)} className="p-1 hover:bg-red-100 dark:hover:bg-red-500/20 rounded text-danger-500">
                      <FiTrash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
