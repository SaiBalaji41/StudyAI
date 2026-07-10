import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((type = 'info', message) => {
    // If addToast is called with (message, type) due to old signature, handle it
    if (type !== 'info' && type !== 'success' && type !== 'error') {
      const temp = message;
      message = type;
      type = temp || 'info';
    }
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 5000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            <div className="toast-icon">
              {t.type === 'success' && <CheckCircle2 size={20} />}
              {t.type === 'error' && <AlertCircle size={20} />}
              {t.type === 'info' && <Info size={20} />}
            </div>
            <div className="toast-content">
              <span className="toast-title">{t.type.charAt(0).toUpperCase() + t.type.slice(1)}</span>
              <span className="toast-message">{t.message}</span>
            </div>
            <button className="toast-close" onClick={() => removeToast(t.id)}>
              <X size={16} />
            </button>
            <div className="toast-progress"></div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
