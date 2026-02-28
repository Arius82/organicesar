import React, { createContext, useContext, useState, useCallback } from 'react';

export interface Notification {
  id: string;
  message: string;
  type: 'success' | 'info' | 'warning';
  timestamp: string;
  read: boolean;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (message: string, type?: Notification['type']) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([
    { id: '1', message: 'Sofia marcou "Arrumar o quarto" como concluída', type: 'info', timestamp: new Date().toISOString(), read: false },
    { id: '2', message: 'Feijão e Ovos adicionados automaticamente à lista de compras', type: 'warning', timestamp: new Date().toISOString(), read: false },
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const addNotification = useCallback((message: string, type: Notification['type'] = 'info') => {
    setNotifications(prev => [{
      id: Date.now().toString(),
      message,
      type,
      timestamp: new Date().toISOString(),
      read: false,
    }, ...prev]);
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const clearAll = useCallback(() => setNotifications([]), []);

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, addNotification, markAsRead, markAllAsRead, clearAll }}>
      {children}
    </NotificationContext.Provider>
  );
};
