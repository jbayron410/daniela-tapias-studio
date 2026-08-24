export default function ConfirmModal({ cita, onConfirm, onCancel }) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content modal-sm" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Cancelar Cita</h3>
          <button className="modal-close" onClick={onCancel}>&times;</button>
        </div>
        <div className="modal-body">
          <p className="modal-warning-text">
            ¿Estás segura de que deseas cancelar esta cita?
          </p>
          <div className="modal-cita-preview">
            <strong>{cita.Clienta}</strong>
            <span>{cita.Servicio}</span>
            <span>{cita['Fecha Cita']} — {cita['Hora Cita']}</span>
          </div>
          <p className="modal-warning-note">
            Esta acción eliminará el evento de Google Calendar y liberará el horario.
          </p>
        </div>
        <div className="modal-actions">
          <button className="modal-btn modal-btn-secondary" onClick={onCancel}>
            Volver
          </button>
          <button className="modal-btn modal-btn-danger" onClick={onConfirm}>
            Sí, Cancelar Cita
          </button>
        </div>
      </div>
    </div>
  );
}
