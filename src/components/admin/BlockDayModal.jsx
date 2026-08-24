import { useState } from 'react';
import { createBooking } from '../../api/n8n';

export default function BlockDayModal({ onClose, onSuccess }) {
  const [date, setDate] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!date) {
      setError('Selecciona una fecha.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const d = new Date(date + 'T12:00:00');
      const pad = (n) => String(n).padStart(2, '0');
      const fmt = (year, month, day, h, m) =>
        `${year}-${pad(month + 1)}-${pad(day)}T${pad(h)}:${pad(m)}:00-05:00`;

      const startISO = fmt(d.getFullYear(), d.getMonth(), d.getDate(), 5, 0);
      const endISO = fmt(d.getFullYear(), d.getMonth(), d.getDate(), 23, 0);

      await createBooking({
        servicio: 'DÍA CERRADO',
        precio: 0,
        nombre_completo: 'Bloqueado por admin',
        whatsapp: '',
        email: '',
        a_domicilio: false,
        detalles_domicilio: 'NA',
        requiere_maquillaje: false,
        notas: reason || 'Día no laborable',
        fecha_inicio: startISO,
        fecha_fin: endISO
      });

      onSuccess?.();
      onClose();
    } catch (err) {
      setError(`Error al bloquear el día: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-sm" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Cerrar Día de Agenda</h3>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          {error && <div className="login-error">{error}</div>}

          <p className="block-day-info">
            Se creará un evento que bloquea todo el horario de atención (5:00 AM — 11:00 PM).
            Las clientas no podrán agendar citas ese día.
          </p>

          <div className="modal-field">
            <label>Fecha a cerrar *</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={today}
              required
            />
          </div>

          <div className="modal-field">
            <label>Motivo (opcional)</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ej: Día personal, feriado, descanso..."
            />
          </div>

          {date && (
            <div className="block-day-preview">
              <span>🔒</span>
              <div>
                <strong>{date}</strong>
                <span>Se bloquearán todas las horas de 5:00 AM a 11:00 PM</span>
              </div>
            </div>
          )}

          <div className="modal-actions">
            <button type="button" className="modal-btn modal-btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="modal-btn modal-btn-danger" disabled={submitting}>
              {submitting ? 'Bloqueando...' : '🔒 Cerrar Día'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
