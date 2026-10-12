import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const success = useCallback((msg) => addToast(msg, 'success'), [addToast]);
  const error = useCallback((msg) => addToast(msg, 'error', 6000), [addToast]);
  const info = useCallback((msg) => addToast(msg, 'info'), [addToast]);
  const warning = useCallback((msg) => addToast(msg, 'warning', 5000), [addToast]);

  return (
    <NotificationContext.Provider value={{ addToast, removeToast, success, error, info, warning }}>
      {children}
      <div className="toast-container-custom">
        {toasts.map((toast) => {
          let IconComponent = Info;
          let borderCol = '#3b82f6';
          let iconColor = '#2563eb';

          if (toast.type === 'success') {
            IconComponent = CheckCircle2;
            borderCol = '#10b981';
            iconColor = '#059669';
          } else if (toast.type === 'error') {
            IconComponent = AlertCircle;
            borderCol = '#ef4444';
            iconColor = '#dc2626';
          } else if (toast.type === 'warning') {
            IconComponent = AlertTriangle;
            borderCol = '#f59e0b';
            iconColor = '#d97706';
          }

          return (
            <div
              key={toast.id}
              className="toast-custom"
              style={{ borderLeftColor: borderCol }}
            >
              <IconComponent size={20} color={iconColor} className="flex-shrink-0" />
              <div style={{ flexGrow: 1, fontSize: '0.88rem', fontWeight: 500, color: '#1e293b' }}>
                {toast.message}
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#94a3b8',
                  padding: '2px',
                }}
              >
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
