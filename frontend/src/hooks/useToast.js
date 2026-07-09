import { useState, useCallback } from "react";

export function useToast() {
  const [toasts, setToasts] = useState([]);

  const add = useCallback((message, type = "success", duration = 4000) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    if (duration > 0) {
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
    }
    return id;
  }, []);

  const remove = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return {
    toasts,
    success: (msg, dur) => add(msg, "success", dur),
    error: (msg, dur) => add(msg, "error", dur),
    warning: (msg, dur) => add(msg, "warning", dur),
    info: (msg, dur) => add(msg, "info", dur),
    remove,
  };
}
