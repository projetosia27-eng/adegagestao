import React, { useState, useRef, useEffect } from 'react';
import { 
  Bell, 
  Check, 
  CheckCheck, 
  Trash2, 
  ShoppingBag, 
  Info, 
  Tag, 
  Truck, 
  X
} from 'lucide-react';
import { useNotificacoes, NotificationItem } from '@/hooks/useNotificacoes';
import { useNavigate } from 'react-router-dom';

export const NotificacoesDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll
  } = useNotificacoes();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = (item: NotificationItem) => {
    if (!item.read) {
      markAsRead(item.id);
    }
    if (item.link) {
      navigate(item.link);
      setIsOpen(false);
    }
  };

  const getIcon = (type?: string) => {
    switch (type) {
      case 'order':
        return <ShoppingBag className="w-4 h-4 text-gold" />;
      case 'driver':
        return <Truck className="w-4 h-4 text-blue-400" />;
      case 'promo':
        return <Tag className="w-4 h-4 text-emerald-400" />;
      default:
        return <Info className="w-4 h-4 text-zinc-400" />;
    }
  };

  const formatTimestamp = (isoDate: string) => {
    try {
      const date = new Date(isoDate);
      const now = new Date();
      const diffMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);

      if (diffMinutes < 1) return 'Agora';
      if (diffMinutes < 60) return `Há ${diffMinutes} min`;
      
      const diffHours = Math.floor(diffMinutes / 60);
      if (diffHours < 24) return `Há ${diffHours} h`;

      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 hover:bg-surface rounded-full transition-colors relative text-text-secondary hover:text-white"
        aria-label="Notificações"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 shadow-md animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl z-50 overflow-hidden backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="p-4 bg-zinc-900/90 border-b border-zinc-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-white text-base">Notificações</h3>
              {unreadCount > 0 && (
                <span className="bg-gold/10 text-gold text-xs font-bold px-2 py-0.5 rounded-full border border-gold/20">
                  {unreadCount} novas
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              {notifications.length > 0 && (
                <>
                  <button
                    onClick={markAllAsRead}
                    className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors"
                    title="Marcar todas como lidas"
                  >
                    <CheckCheck className="w-4 h-4" />
                  </button>
                  <button
                    onClick={clearAll}
                    className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-rose-400 transition-colors"
                    title="Limpar todas"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-zinc-800/50 scrollbar-thin">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-text-secondary">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-30 text-zinc-500" />
                <p className="text-sm font-medium">Nenhuma notificação por enquanto</p>
                <p className="text-xs text-zinc-500 mt-1">
                  Você receberá alertas quando houver novidades sobre pedidos.
                </p>
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleNotificationClick(item)}
                  className={`p-4 transition-colors flex gap-3 cursor-pointer relative group ${
                    item.read 
                      ? 'bg-zinc-900/40 opacity-75 hover:bg-zinc-800/40' 
                      : 'bg-zinc-800/40 border-l-2 border-l-gold hover:bg-zinc-800/80'
                  }`}
                >
                  <div className="mt-0.5 p-2 rounded-xl bg-zinc-800 border border-zinc-700/50 shrink-0">
                    {getIcon(item.type)}
                  </div>

                  <div className="flex-1 min-w-0 pr-6">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h4 className={`text-sm font-semibold truncate ${item.read ? 'text-zinc-300' : 'text-white'}`}>
                        {item.title}
                      </h4>
                      <span className="text-[10px] text-zinc-500 shrink-0">
                        {formatTimestamp(item.timestamp)}
                      </span>
                    </div>
                    <p className="text-xs text-text-secondary leading-relaxed line-clamp-2">
                      {item.message}
                    </p>
                  </div>

                  {/* Actions on hover or item status */}
                  <div className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                    {!item.read && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(item.id);
                        }}
                        className="p-1 hover:bg-zinc-700 rounded text-zinc-400 hover:text-gold"
                        title="Marcar como lida"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeNotification(item.id);
                      }}
                      className="p-1 hover:bg-zinc-700 rounded text-zinc-400 hover:text-rose-400"
                      title="Excluir"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
