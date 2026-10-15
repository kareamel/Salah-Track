import { AlertCircle, Check } from "lucide-react";

export type Toast = { tone: "success" | "error"; message: string };

/** A short message that floats above the bottom navigation. */
export function ToastMessage({ toast }: { toast: Toast }) {
  const isError = toast.tone === "error";
  return (
    <div
      role={isError ? "alert" : "status"}
      className="fixed inset-x-0 bottom-28 z-40 flex justify-center px-5"
    >
      <div
        className={`flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium text-white shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-300 ${
          isError ? "bg-rose-600" : "bg-stone-900"
        }`}
      >
        {isError ? (
          <AlertCircle className="size-4 shrink-0" />
        ) : (
          <Check className="size-4 shrink-0 text-emerald-400" strokeWidth={3} />
        )}
        {toast.message}
      </div>
    </div>
  );
}
