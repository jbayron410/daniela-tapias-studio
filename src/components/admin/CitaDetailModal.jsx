import { getEstado, formatFecha } from './helpers';

export default function CitaDetailModal({ cita, onClose, onConfirm, onCancel, onEdit }) {
  if (!cita) return null;

  const estado = getEstado(cita['Estado Confirmación']);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-detail" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Detalle de Cita</h3>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          <div className="detail-top">
            <span
              className="estado-badge"
              style={{ background: estado.bg, color: estado.color }}
            >
              {estado.label}
            </span>
          </div>

          <div className="detail-grid">
            <div className="detail-item">
              <span className="detail-label">Clienta</span>
              <strong>{cita.Clienta}</strong>
            </div>
            <div className="detail-item">
              <span className="detail-label">Servicio</span>
              <span>{cita.Servicio}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Fecha</span>
              <span>{formatFecha(cita['Fecha Cita'])}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Hora</span>
              <span>{cita['Hora Cita']}</span>
            </div>
            {cita.WhatsApp && (
              <div className="detail-item">
                <span className="detail-label">WhatsApp</span>
                <a
                  className="cita-wa-link"
                  href={`https://wa.me/${cita.WhatsApp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  💬 {cita.WhatsApp}
                </a>
              </div>
            )}
            {cita.Email && (
              <div className="detail-item">
                <span className="detail-label">Email</span>
                <span>{cita.Email}</span>
              </div>
            )}
            {cita['Requiere Maquillaje'] === 'Sí' && (
              <div className="detail-item">
                <span className="detail-label">Maquillaje</span>
                <span className="cita-tag">Sí, incluye maquillaje</span>
              </div>
            )}
            {cita['A domicilio'] === 'Sí' && (
              <div className="detail-item">
                <span className="detail-label">Ubicación</span>
                <span>🏠 {cita['Detalles domicilio'] || 'A domicilio'}</span>
              </div>
            )}
            {cita.Notas && (
              <div className="detail-item detail-full">
                <span className="detail-label">Notas</span>
                <span>{cita.Notas}</span>
              </div>
            )}
          </div>
        </div>
        <div className="modal-actions">
          {String(cita['Estado Confirmación']) !== '2' && (
            <>
              <button
                className="modal-btn modal-btn-danger"
                onClick={() => { onCancel(cita); onClose(); }}
              >
                ✕ Cancelar
              </button>
              <button
                className="modal-btn modal-btn-secondary"
                onClick={() => { onEdit(cita); onClose(); }}
              >
                ✏️ Editar
              </button>
            </>
          )}
          <div style={{ flex: 1 }} />
          {String(cita['Estado Confirmación']) !== '1' && String(cita['Estado Confirmación']) !== '2' && (
            <button
              className="modal-btn modal-btn-primary"
              onClick={() => { onConfirm(cita); onClose(); }}
            >
              ✓ Confirmar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
