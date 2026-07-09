import React from 'react';
import { X, CheckCircle, AlertTriangle, Info, AlertCircle } from 'lucide-react';
import { useToasts } from '../context/AppContext';

export default function ToastContainer() {
  const { toasts, removeToast } = useToasts();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-24 right-6 z-[300] flex flex-col gap-3 w-full max-w-sm pointer-events-none">
      {toasts.map((toast) => {
        const Icon = {
          success: CheckCircle,
          warning: AlertTriangle,
          info: Info,
          error: AlertCircle
        }[toast.type] || Info;

        const colorClass = {
          success: 'border-green-800 text-green-400',
          warning: 'border-yellow-800 text-yellow-400',
          info: 'border-blue-800 text-blue-400',
          error: 'border-brand-red text-brand-red'
        }[toast.type] || 'border-neutral-800 text-white';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 bg-[#0C0C0E]/95 border ${colorClass} p-4 shadow-2xl backdrop-blur-md transition-all duration-300 animate-slide-in`}
          >
            <Icon size={16} className="mt-0.5 shrink-0" />
            <div className="flex-grow">
              <p className="text-[11px] font-bold tracking-wider uppercase text-white">
                {toast.type}
              </p>
              <p className="text-[11px] text-neutral-400 mt-1 font-semibold tracking-wide leading-relaxed">
                {toast.message}
              </p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-neutral-500 hover:text-white transition cursor-pointer"
            >
              <X size={12} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
