"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import { CheckCircle2, AlertCircle, X } from "lucide-react";
import { t } from "@/lib/messages";

type Kind = "success" | "error";
type Toast = { id: number; kind: Kind; message: string };

const ToastContext = createContext<(message: string, kind?: Kind) => void>(() => {});

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => setToasts((ts) => ts.filter((x) => x.id !== id)), []);

  const notify = useCallback(
    (message: string, kind: Kind = "success") => {
      const id = nextId.current++;
      setToasts((ts) => [...ts.slice(-3), { id, kind, message }]);
      setTimeout(() => dismiss(id), kind === "error" ? 7000 : 4000);
    },
    [dismiss],
  );

  const render = (kind: Kind) =>
    toasts
      .filter((x) => x.kind === kind)
      .map((x) => (
        <div
          key={x.id}
          className={`pointer-events-auto flex items-start gap-2 rounded-lg border px-4 py-3 text-sm shadow-lg ${
            x.kind === "error" ? "border-red-200 bg-red-50 text-red-800" : "border-emerald-200 bg-emerald-50 text-emerald-800"
          }`}
        >
          {x.kind === "error" ? (
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          ) : (
            <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden />
          )}
          <span className="flex-1">{x.message}</span>
          <button
            type="button"
            onClick={() => dismiss(x.id)}
            aria-label={t.common.close}
            className="rounded-sm p-0.5 opacity-70 hover:opacity-100"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>
      ));

  return (
    <ToastContext.Provider value={notify}>
      {children}
      <div className="pointer-events-none fixed bottom-4 end-4 z-50 flex w-full max-w-sm flex-col gap-2">
        <div aria-live="polite" role="status" className="flex flex-col gap-2">
          {render("success")}
        </div>
        <div aria-live="assertive" role="alert" className="flex flex-col gap-2">
          {render("error")}
        </div>
      </div>
    </ToastContext.Provider>
  );
}
