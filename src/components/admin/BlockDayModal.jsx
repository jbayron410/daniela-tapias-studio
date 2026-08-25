import { useState } from 'react';
import { createBooking } from '../../api/n8n';

const BUSINESS_START = 5;  // 5:00 AM
const BUSINESS_END = 23;   // 11:00 PM

function formatHourLabel(h) {
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:00 ${suffix}`;
}

function generateTimeOptions(from, to) {
  const options = [];
  for (let h = from; h <= to; h++) {
    options.push({ val: `${String(h).padStart(2, '0')}:00`, label: formatHourLabel(h) });
  }
  return options;
}

const START_OPTIONS = generateTimeOptions(BUSINESS_START, BUSINESS_END - 1); // 5 AM - 10 PM
const END_OPTIONS = generateTimeOptions(BUSINESS_START + 1, BUSINESS_END);   // 6 AM - 11 PM

export default function BlockDayModal({ onClose, onSuccess }) {
  const [date, setDate] = useState('');
  const [fullDay, setFullDay] = useState(true);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!date) {
      setError('Selecciona una fecha.');
      return;
    }
    if (!fullDay && (!startTime || !endTime)) {
      setError('Selecciona la hora de inicio y fin de la franja.');
      return;
    }
    if (!fullDay && startTime >= endTime) {
      setError('La hora de inicio debe ser menor a la hora de fin.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const d = new Date(date + 'T12:00:00');
      const pad = (n) => String(n).padStart(2, '0');
      const fmt = (year, month, day, h, m) =>
        `${year}-${pad(month + 1)}-${pad(day)}T${pad(h)}:${pad(m)}:00-05:00`;

      const startH = fullDay ? BUSINESS_START : parseInt(startTime.split(':')[0], 10);
      const endH = fullDay ? BUSINESS_END : parseInt(endTime.split(':')[0], 10);

      const startISO = fmt(d.getFullYear(), d.getMonth(), d.getDate(), startH, 0);
      const endISO = fmt(d.getFullYear(), d.getMonth(), d.getDate(), endH, 0);

      const notasTexto = fullDay
        ? (reason || 'Día no laborable')
        : `Franja bloqueada: ${formatHourLabel(startH)} - ${formatHourLabel(endH)}${reason ? ` — ${reason}` : ''}`;

      await createBooking({
        servicio: 'DÍA CERRADO',
        precio: 0,
        nombre_completo: 'Bloqueado por admin',
        whatsapp: '',
        email: '',
        a_domicilio: false,
        detalles_domicilio: 'NA',
        requiere_maquillaje: false,
        notas: notasTexto,
        fecha_inicio: startISO,
        fecha_fin: endISO
      });

      onSuccess?.();
      onClose();
    } catch (err) {
      setError(`Error al bloquear: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-sm" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Bloquear Agenda</h3>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          {error && <div className="login-error">{error}</div>}

          <div className="modal-field">
            <label>Fecha *</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={today}
              required
            />
          </div>

          <div className="modal-field">
            <label className="admin-checkbox-label">
              <input
                type="checkbox"
                checked={fullDay}
                onChange={(e) => setFullDay(e.target.checked)}
              />
              Cerrar día completo
            </label>
          </div>

          {!fullDay && (
            <div className="modal-row">
              <div className="modal-field">
                <label>Hora inicio *</label>
                <select
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                >
                  <option value="">Seleccionar...</option>
                  {START_OPTIONS.map((opt) => (
                    <option key={opt.val} value={opt.val}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="modal-field">
                <label>Hora fin *</label>
                <select
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                >
                  <option value="">Seleccionar...</option>
                  {END_OPTIONS.map((opt) => (
                    <option key={opt.val} value={opt.val}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

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
                <span>
                  {fullDay
                    ? `Se bloquearán todas las horas de ${formatHourLabel(BUSINESS_START)} a ${formatHourLabel(BUSINESS_END)}`
                    : `Se bloqueará de ${formatHourLabel(parseInt(startTime.split(':')[0], 10) || BUSINESS_START)} a ${formatHourLabel(parseInt(endTime.split(':')[0], 10) || BUSINESS_END)}`
                  }
                </span>
              </div>
            </div>
          )}

          <div className="modal-actions">
            <button type="button" className="modal-btn modal-btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="modal-btn modal-btn-danger" disabled={submitting}>
              {submitting ? 'Bloqueando...' : '🔒 Bloquear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
