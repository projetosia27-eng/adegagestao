import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/modules/auth/hooks/useAuth';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type?: 'order' | 'system' | 'promo' | 'driver';
  link?: string;
}

const STORAGE_KEY = 'adegahub_notifications_v1';

export const useNotificacoes = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Erro ao carregar notificações do localStorage', e);
    }
    return [
      {
        id: 'welcome-1',
        title: 'Bem-vindo ao AdegaHub!',
        message: 'Acompanhe seus pedidos e atualizações em tempo real aqui.',
        timestamp: new Date().toISOString(),
        read: false,
        type: 'system',
      },
    ];
  });

  // Save to localStorage whenever notifications change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
    } catch (e) {
      console.error('Erro ao salvar notificações', e);
    }
  }, [notifications]);

  // Sync notifications across tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          setNotifications(JSON.parse(e.newValue));
        } catch (err) {
          console.error(err);
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const addNotification = useCallback(
    (item: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>) => {
      const newNotif: NotificationItem = {
        ...item,
        id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        timestamp: new Date().toISOString(),
        read: false,
      };
      setNotifications((prev) => [newNotif, ...prev]);
    },
    []
  );

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // Supabase Realtime Listener for Orders
  useEffect(() => {
    if (!user) return;

    // Se for cliente, filtra os pedidos dele. Se for vendedor, filtra os da loja dele
    // Mas no payload não temos store_id garantido. Vamos filtrar no lado cliente para simplificar.
    const channel = supabase
      .channel('global-notifs')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
        },
        (payload: any) => {
          const order = payload.new;
          
          if (!order) return;
          
          // Verifica se o pedido pertence a este usuário
          if (user.role === 'customer' && order.user_id !== user.id) return;
          if (user.role === 'vendor' && order.store_id !== user.id) return;

          if (payload.eventType === 'INSERT') {
            addNotification({
              title: 'Novo Pedido Recebido!',
              message: `Pedido #${order.id?.slice(0, 8) || 'novo'} recebido no valor de R$ ${(order.total || 0).toFixed(2)}.`,
              type: 'order',
              link: '/vendedor/pedidos',
            });
          } else if (payload.eventType === 'UPDATE') {
            const statusMap: Record<string, string> = {
              preparing: 'Em Preparação',
              delivering: 'Em Rota de Entrega',
              delivered: 'Entregue com Sucesso',
              canceled: 'Cancelado',
            };
            addNotification({
              title: `Atualização de Pedido`,
              message: `O status do seu pedido #${order.id?.slice(0, 8) || ''} mudou para: ${statusMap[order.status] || order.status}`,
              type: 'order',
              link: user?.role === 'vendor' ? `/vendedor/pedido/${order.id}` : `/cliente/pedidos`,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, addNotification]);

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    addNotification,
    removeNotification,
    clearAll,
  };
};
