function ConfirmModal({
  title,
  message,
  confirmLabel = "Usuń",
  cancelLabel = "Anuluj",
  onConfirm,
  onCancel,
  danger = true,
}) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        {title && <h3 className="modal-title">{title}</h3>}
        <p className="modal-message">{message}</p>
        <div className="modal-actions">
          <button className="back-btn" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            className={danger ? "remove-btn modal-confirm-danger" : "save-btn"}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;
