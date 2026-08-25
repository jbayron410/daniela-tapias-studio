// ──────────────────────────────────────────────────────────────
// SYNC: Este formulario y BookingForm.jsx (público) deben mantenerse
// sincronizados. Si cambias campos, validaciones, precios o payload aquí,
// aplica los mismos cambios en el formulario público (y viceversa).
// ──────────────────────────────────────────────────────────────
import { useState, useEffect, useRef } from 'react';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { SERVICES } from '../../data/services';
import { createBooking, getAvailability } from '../../api/n8n';
import { cancelCita } from '../../api/sheets';
import { parseCitaDateTime } from './helpers';

const MAQUILLAJE_PRICE = 80000;

function formatPrice(price) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  }).format(price);
}

function toEventISO(date, time, durationMinutes) {
  const [h, m] = time.split(':').map(Number);
  const d = new Date(date + 'T12:00:00');
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), h, m);
  const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
  const pad = (n) => String(n).padStart(2, '0');
  const fmt = (dt) =>
    `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}` +
    `T${pad(dt.getHours())}:${pad(dt.getMinutes())}:00-05:00`;
  return { startISO: fmt(start), endISO: fmt(end) };
}

function formatTimeSpanish(hour) {
  const [h, m] = hour.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${suffix}`;
}

function serviceNameToId(name) {
  if (!name) return '';
  const lower = name.toLowerCase();
  const match = SERVICES.find((s) => s.name.toLowerCase() === lower);
  return match ? match.id : '';
}

function citaToFormData(cita) {
  const dt = parseCitaDateTime(cita['Fecha Cita'], cita['Hora Cita']);
  let dateStr = '';
  if (dt) {
    const pad = (n) => String(n).padStart(2, '0');
    dateStr = `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
  }

  let timeStr = '';
  if (cita['Hora Cita']) {
    const match = cita['Hora Cita'].trim().match(/^(\d{1,2}):(\d{2})\s*(am|pm)?$/i);
    if (match) {
      let h = parseInt(match[1], 10);
      const m = match[2];
      const period = (match[3] || '').toLowerCase();
      if (period === 'pm' && h < 12) h += 12;
      if (period === 'am' && h === 12) h = 0;
      timeStr = `${String(h).padStart(2, '0')}:${m}`;
    }
  }

  return {
    serviceId: serviceNameToId(cita.Servicio),
    name: cita.Clienta || '',
    phone: cita.WhatsApp ? `+${cita.WhatsApp}` : '',
    email: cita.Email || '',
    notes: cita.Notas || '',
    domicilio: cita['A domicilio'] === 'Sí',
    domicilioDetalles: cita['Detalles domicilio'] || '',
    requiereMaquillaje: cita['Requiere Maquillaje'] === 'Sí',
    date: dateStr,
    time: timeStr
  };
}

function buildPayload(form) {
  const service = SERVICES.find((s) => s.id === form.serviceId);
  const maquillajeCost = form.requiereMaquillaje ? MAQUILLAJE_PRICE : 0;
  const totalPrice = service.price + maquillajeCost;
  const { startISO, endISO } = toEventISO(form.date, form.time, service.duration);
  return {
    servicio: service.name,
    precio: totalPrice,
    nombre_completo: form.name.trim(),
    whatsapp: form.phone ? form.phone.replace(/[^0-9]/g, '') : '',
    email: form.email.trim() || 'sinCorreo@ejemplo.com',
    a_domicilio: form.domicilio,
    detalles_domicilio: form.domicilio ? form.domicilioDetalles.trim() : 'NA',
    requiere_maquillaje: form.requiereMaquillaje,
    notas: form.notes.trim() || 'Sin notas adicionales',
    fecha_inicio: startISO,
    fecha_fin: endISO
  };
}

function hasFormChanged(original, current) {
  if (!original) return true;
  return (
    original.serviceId !== current.serviceId ||
    original.name !== current.name ||
    original.phone !== current.phone ||
    original.email !== current.email ||
    original.notes !== current.notes ||
    original.domicilio !== current.domicilio ||
    original.domicilioDetalles !== current.domicilioDetalles ||
    original.requiereMaquillaje !== current.requiereMaquillaje ||
    original.date !== current.date ||
    original.time !== current.time
  );
}

const emptyForm = {
  serviceId: '',
  name: '',
  phone: '',
  email: '',
  notes: '',
  domicilio: false,
  domicilioDetalles: '',
  requiereMaquillaje: false,
  date: '',
  time: ''
};

export default function AdminBookingModal({ onClose, onSuccess, initialData, isEdit }) {
  const initialFormData = initialData ? citaToFormData(initialData) : emptyForm;
  const [form, setForm] = useState(initialFormData);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [slots, setSlots] = useState(isEdit && initialFormData.time ? [initialFormData.time] : []);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotsError, setSlotsError] = useState('');
  const fetchedDateRef = useRef(null);

  useEffect(() => {
    if (!form.date) {
      setSlots([]);
      fetchedDateRef.current = null;
      return;
    }

    if (fetchedDateRef.current === form.date) return;
    fetchedDateRef.current = form.date;

    let cancelled = false;
    setLoadingSlots(true);
    setSlotsError('');

    getAvailability(form.date)
      .then((availableSlots) => {
        if (cancelled) return;
        const list = Array.isArray(availableSlots) ? availableSlots : [];
        // Always include the current time in edit mode so it stays selectable
        if (isEdit && form.time && !list.includes(form.time)) {
          setSlots([form.time, ...list]);
        } else if (list.length > 0) {
          setSlots(list);
        } else if (isEdit && form.time) {
          setSlots([form.time]);
        } else {
          setSlots([]);
          setSlotsError('No hay disponibilidad para este día.');
        }
      })
      .catch(() => {
        if (cancelled) return;
        if (isEdit && form.time) {
          setSlots([form.time]);
        } else {
          setSlots([]);
          setSlotsError('Error al consultar disponibilidad.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingSlots(false);
      });

    return () => { cancelled = true; };
  }, [form.date, form.time, isEdit]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (name === 'date') {
      fetchedDateRef.current = null;
      setForm((prev) => ({ ...prev, time: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.serviceId || !form.name || !form.date || !form.time) {
      setError('Completa los campos obligatorios: servicio, nombre, fecha y hora.');
      return;
    }

    // In edit mode, check if anything changed
    if (isEdit && !hasFormChanged(initialFormData, form)) {
      onClose();
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const payload = buildPayload(form);

      if (isEdit) {
        payload.edit = true;
        // Cancel the old cita first
        await cancelCita(initialData).catch(() => {});
      }

      await createBooking(payload);
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(`Error al crear la cita: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const selectedService = SERVICES.find((s) => s.id === form.serviceId);
  const minDate = new Date().toISOString().split('T')[0];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{isEdit ? 'Editar Cita' : 'Agendar Nueva Cita'}</h3>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form admin-booking-form">
          {error && <div className="login-error">{error}</div>}

          <div className="form-step-title">
            <span className="step-num">1</span> Servicio
          </div>
          <div className="admin-service-grid">
            {SERVICES.map((s) => (
              <button
                type="button"
                key={s.id}
                className={`admin-service-option ${form.serviceId === s.id ? 'selected' : ''}`}
                onClick={() => setForm((prev) => ({ ...prev, serviceId: s.id }))}
              >
                <span className="icon">{s.icon}</span>
                <span className="name">{s.name}</span>
                <span className="price">{formatPrice(s.price)}</span>
              </button>
            ))}
          </div>

          <div className="form-step-title" style={{ marginTop: 20 }}>
            <span className="step-num">2</span> Datos de la clienta
          </div>
          <div className="modal-field">
            <label>Nombre completo *</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Nombre de la clienta"
              required
            />
          </div>
          <div className="modal-row">
            <div className="modal-field">
              <label>WhatsApp</label>
              <PhoneInput
                international
                defaultCountry="CO"
                placeholder="300 123 4567"
                value={form.phone}
                onChange={(value) =>
                  handleChange({
                    target: { name: 'phone', value: value || '', type: 'text', checked: false }
                  })
                }
              />
            </div>
            <div className="modal-field">
              <label>Email</label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="clienta@email.com"
              />
            </div>
          </div>
          <div className="modal-row">
            <div className="modal-field">
              <label className="admin-checkbox-label">
                <input
                  type="checkbox"
                  name="domicilio"
                  checked={form.domicilio}
                  onChange={handleChange}
                />
                A domicilio
              </label>
            </div>
            <div className="modal-field">
              <label className="admin-checkbox-label">
                <input
                  type="checkbox"
                  name="requiereMaquillaje"
                  checked={form.requiereMaquillaje}
                  onChange={handleChange}
                />
                Requiere maquillaje
              </label>
            </div>
          </div>
          {form.domicilio && (
            <div className="modal-field">
              <label>Detalles del domicilio</label>
              <input
                name="domicilioDetalles"
                value={form.domicilioDetalles}
                onChange={handleChange}
                placeholder="Barrio, dirección, ciudad..."
              />
            </div>
          )}
          <div className="modal-field">
            <label>Notas</label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows={2}
              placeholder="Referencias de estilo, evento, etc."
            />
          </div>

          <div className="form-step-title" style={{ marginTop: 20 }}>
            <span className="step-num">3</span> Fecha y hora
          </div>
          <div className="modal-field">
            <label>Fecha *</label>
            <input
              type="date"
              name="date"
              value={form.date}
              onChange={handleChange}
              min={minDate}
              required
            />
          </div>

          <div className="modal-field">
            <label>Hora disponible *</label>
            {loadingSlots ? (
              <div className="slots-loading">⏳ Consultando disponibilidad...</div>
            ) : slotsError ? (
              <div className="slots-error">{slotsError}</div>
            ) : slots.length > 0 ? (
              <div className="slots-grid">
                {slots.map((slot) => (
                  <button
                    type="button"
                    key={slot}
                    className={`slot-btn ${form.time === slot ? 'selected' : ''}`}
                    onClick={() => setForm((prev) => ({ ...prev, time: slot }))}
                  >
                    {formatTimeSpanish(slot)}
                  </button>
                ))}
              </div>
            ) : form.date ? (
              <div className="slots-empty">Selecciona una fecha para ver horas disponibles.</div>
            ) : (
              <div className="slots-empty">Selecciona una fecha primero.</div>
            )}
          </div>

          {selectedService && form.date && form.time && (
            <div className="booking-summary" style={{ marginTop: 16 }}>
              <h4>Resumen</h4>
              <div className="summary-row">
                <span className="label">Servicio</span>
                <span>{selectedService.icon} {selectedService.name}</span>
              </div>
              <div className="summary-row">
                <span className="label">Clienta</span>
                <span>{form.name}</span>
              </div>
              <div className="summary-row">
                <span className="label">Fecha</span>
                <span>{form.date}</span>
              </div>
              <div className="summary-row">
                <span className="label">Hora</span>
                <span>{formatTimeSpanish(form.time)}</span>
              </div>
              {form.domicilio && (
                <div className="summary-row">
                  <span className="label">Domicilio</span>
                  <span>Según ubicación (a confirmar)</span>
                </div>
              )}
              {form.requiereMaquillaje && (
                <div className="summary-row">
                  <span className="label">Maquillaje</span>
                  <span>{formatPrice(MAQUILLAJE_PRICE)}</span>
                </div>
              )}
              <div className="summary-row total">
                <span className="label">Total aprox.</span>
                <span>{formatPrice(selectedService.price + (form.requiereMaquillaje ? MAQUILLAJE_PRICE : 0))}</span>
              </div>
            </div>
          )}

          <div className="modal-actions">
            <button type="button" className="modal-btn modal-btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="modal-btn modal-btn-primary" disabled={submitting || !form.time}>
              {submitting
                ? 'Guardando...'
                : isEdit
                  ? '✓ Guardar Cambios'
                  : '✓ Crear Cita'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
