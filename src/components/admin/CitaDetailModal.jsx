import { getEstado, formatFecha } from './helpers';

export default function CitaDetailModal({
  cita,
  onClose,
  onAssignTime,
  onMarkConfirmed,
  onConfirm,
  onCancel,
  onEdit
}) {
  if (!cita) return null;

  const estado = getEstado(cita['Estado Confirmación']);
  const estadoNum = String(cita['Estado Confirmación']);
  const isPreagenda = !cita.ID || String(cita.ID).startsWith('PRE-');
  const handleAssign = onAssignTime || onConfirm;
  const handleConfirmAction = onMarkConfirmed || onConfirm;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-detail" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Detalle de Cita</h3>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          <div className="detail-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span
              className="estado-badge"
              style={{ background: estado.bg, color: estado.color }}
            >
              {estado.label}
            </span>
            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
              {isPreagenda ? 'ID Temporal: ' : 'ID Calendar: '}
              <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>
                {cita.ID || 'N/A'}
              </code>
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
              <span>{cita['Hora Cita'] || '⏳ Por coordinar'}</span>
            </div>
            {cita.WhatsApp && (
              <div className="detail-item">
                <span className="detail-label">WhatsApp</span>
                <a
                  className="cita-wa-link"
                  href={`https://wa.me/${String(cita.WhatsApp).replace(/[^0-9]/g, '')}`}
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
            {cita['Requiere Prueba'] === 'Sí' && (
              <div className="detail-item">
                <span className="detail-label">Prueba previa</span>
                <span className="cita-tag" style={{ background: '#fdf2f8', color: '#9d174d' }}>
                  👰 Sí {cita['Fecha Prueba'] ? `(${cita['Fecha Prueba']} ${cita['Hora Prueba'] || ''})` : '(Por programar)'}
                </span>
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
          {estadoNum !== '2' && (
            <>
              <button
                className="modal-btn modal-btn-danger"
                onClick={() => { onCancel(cita); onClose(); }}
              >
                ✕ Cancelar Cita
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
          {estadoNum === '0' && (
            <button
              className="modal-btn"
              style={{ background: '#f59e0b', color: '#fff', border: 'none' }}
              onClick={() => { handleAssign(cita); onClose(); }}
            >
              📅 Asignar Hora en Calendar
            </button>
          )}
          {estadoNum === '3' && (
            <button
              className="modal-btn modal-btn-primary"
              onClick={() => { handleConfirmAction(cita); onClose(); }}
            >
              ✓ Marcar Confirmada
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
