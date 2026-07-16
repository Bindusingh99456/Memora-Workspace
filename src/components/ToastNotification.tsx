import React, { useState, useEffect } from "react";
import { Bell, CheckCircle, Info, X } from "lucide-react";

interface ToastNotificationProps {
  toast: {
    id: string;
    title: string;
    message: string;
    type: "reminder" | "success" | "info";
  };
  onDismiss: () => void;
  durationMs?: number;
}

export default function ToastNotification({ 
  toast, 
  onDismiss, 
  durationMs = 6000 
}: ToastNotificationProps) {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    setProgress(100);
    const startTime = Date.now();
    
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remainingPercent = Math.max(0, 100 - (elapsed / durationMs) * 100);
      setProgress(remainingPercent);
      
      if (elapsed >= durationMs) {
        clearInterval(interval);
        onDismiss();
      }
    }, 30); // 30ms updates for a buttery-smooth fluid transition

    return () => clearInterval(interval);
  }, [toast.id, onDismiss, durationMs]);

  const progressBg = 
    toast.type === "reminder" ? "bg-amber-500" :
    toast.type === "success" ? "bg-emerald-500" : "bg-indigo-500";

  return (
    <div className={`p-4 rounded-xl border shadow-2xl flex flex-col overflow-hidden bg-white ${
      toast.type === "reminder" ? "border-amber-300" :
      toast.type === "success" ? "border-emerald-300" : "border-blue-300"
    }`}>
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${
          toast.type === "reminder" ? "bg-amber-50 text-amber-600" :
          toast.type === "success" ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"
        }`}>
          {toast.type === "reminder" ? (
            <Bell size={18} className="animate-swing" />
          ) : toast.type === "success" ? (
            <CheckCircle size={18} />
          ) : (
            <Info size={18} />
          )}
        </div>
        <div className="flex-1 text-left">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">{toast.title}</h4>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">{toast.message}</p>
        </div>
        <button
          onClick={onDismiss}
          className="text-slate-400 hover:text-slate-600 p-1 rounded transition-colors cursor-pointer"
        >
          <X size={14} />
        </button>
      </div>
      
      {/* Dynamic Sub-pixel Progress Bar Indicator */}
      <div className="w-full h-1 bg-slate-100 rounded-full mt-3 overflow-hidden">
        <div 
          className={`h-full ${progressBg} transition-all duration-30 ease-linear`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
