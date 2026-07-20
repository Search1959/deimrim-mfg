type ToastType = "success" | "error" | "warning" | "info";

function show(type: ToastType, title: string, message?: string) {
  const colors: Record<ToastType, string> = {
    success: "#10b981", error: "#ef4444", warning: "#f59e0b", info: "#6366f1",
  };
  const el = document.createElement("div");
  el.style.cssText = `position:fixed;top:20px;right:20px;z-index:9999;background:#1e293b;border:1px solid #334155;border-left:4px solid ${colors[type]};border-radius:8px;padding:12px 16px;min-width:260px;max-width:360px;box-shadow:0 10px 25px rgba(0,0,0,0.5);animation:slideIn 0.25s ease`;
  el.innerHTML = `<style>@keyframes slideIn{from{transform:translateX(120%);opacity:0}to{transform:translateX(0);opacity:1}}</style><div style="font-weight:700;font-size:13px;color:#f1f5f9;margin-bottom:${message ? "3px" : "0"}">${title}</div>${message ? `<div style="font-size:12px;color:#94a3b8">${message}</div>` : ""}`;
  document.body.appendChild(el);
  setTimeout(() => { el.style.opacity = "0"; el.style.transition = "opacity 0.3s"; setTimeout(() => el.remove(), 300); }, 3000);
}

export const toast = {
  success: (title: string, message?: string) => show("success", title, message),
  error:   (title: string, message?: string) => show("error",   title, message),
  warning: (title: string, message?: string) => show("warning", title, message),
  info:    (title: string, message?: string) => show("info",    title, message),
};
