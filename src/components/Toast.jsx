import { useEffect } from "react";

function Toast({ message, type = "success", onHide, duration = 3000 }) {
  useEffect(() => {
    const timer = setTimeout(onHide, duration);
    return () => clearTimeout(timer);
  }, [onHide, duration]);

  return (
    <div className={`toast toast--${type}`}>
      <span className="toast-icon">{type === "success" ? "✓" : "✕"}</span>
      <span className="toast-msg">{message}</span>
    </div>
  );
}

export default Toast;
