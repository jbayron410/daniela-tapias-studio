// ──────────────────────────────────────────────────────────────
// SYNC: Este formulario y AdminBookingModal.jsx deben mantenerse
// sincronizados. Si cambias campos, validaciones, precios o payload aquí,
// aplica los mismos cambios en el formulario del admin (y viceversa).
// ──────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback } from 'react';
import PhoneInput from 'react-phone-number-input';
import { isValidPhoneNumber } from 'libphonenumber-js';
import 'react-phone-number-input/style.css';
import { SERVICES } from '../data/services';
import { createBooking } from '../api/n8n';

const MAQUILLAJE_PRICE = 80000;

function formatPrice(price) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  }).format(price);
}

function formatDateSpanish(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr + 'T12:00:00');
  return date.toLocaleDateString('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

function isServiceWithPrueba(serviceId) {
  if (!serviceId) return false;
  const s = serviceId.toLowerCase();
  return s.includes('novia') || s.includes('quince');
}

const initialForm = {
  serviceId: '',
  name: '',
  phone: '',
  email: '',
  notes: '',
  domicilio: false,
  domicilioDetalles: '',
  requiereMaquillaje: false,
  requierePrueba: false,
  date: ''
};

const emptyErrors = {};

export default function BookingForm({ preselectService, onResetPreselect }) {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState(emptyErrors);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [confirmedBooking, setConfirmedBooking] = useState(null);
  const [touched, setTouched] = useState({});

  // Preseleccionar servicio cuando viene de la tarjeta de servicios
  useEffect(() => {
    if (preselectService) {
      setForm((prev) => ({
        ...prev,
        serviceId: preselectService.id,
        requierePrueba: isServiceWithPrueba(preselectService.id) ? prev.requierePrueba : false
      }));
      onResetPreselect();
    }
  }, [preselectService, onResetPreselect]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => {
      const updated = {
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      };
      if (name === 'serviceId' && !isServiceWithPrueba(value)) {
        updated.requierePrueba = false;
      }
      return updated;
    });
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  const validate = useCallback(() => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!form.serviceId) newErrors.serviceId = 'Selecciona un servicio';
    if (!form.name || form.name.trim().length < 3) {
      newErrors.name = 'Ingresa tu nombre completo';
    }
    if (!form.phone || !isValidPhoneNumber(form.phone)) {
      newErrors.phone = 'Ingresa un número de WhatsApp válido';
    }
    if (form.email && !emailRegex.test(form.email)) {
      newErrors.email = 'Ingresa un email válido';
    }
    if (!form.date) newErrors.date = 'Selecciona una fecha';
    if (form.domicilio && !form.domicilioDetalles.trim()) {
      newErrors.domicilioDetalles = 'Ingresa los detalles de tu domicilio';
    }

    return newErrors;
  }, [form]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({
      serviceId: true,
      name: true,
      phone: true,
      date: true
    });

    const validationErrors = validate();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      setMessage({
        type: 'error',
        text: 'Por favor completa todos los campos obligatorios.'
      });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      const selectedService = SERVICES.find((s) => s.id === form.serviceId);
      const maquillajeCost = form.requiereMaquillaje ? MAQUILLAJE_PRICE : 0;
      const totalPrice = selectedService.price + maquillajeCost;

      const bookingPayload = {
        servicio: selectedService.name,
        precio: totalPrice,
        nombre_completo: form.name.trim(),
        whatsapp: form.phone ? form.phone.replace(/[^0-9]/g, '') : '',
        email: form.email.trim() || 'sinCorreo@ejemplo.com',
        a_domicilio: form.domicilio,
        detalles_domicilio: form.domicilio ? form.domicilioDetalles.trim() : 'NA',
        requiere_maquillaje: form.requiereMaquillaje,
        requiere_prueba: isServiceWithPrueba(form.serviceId) ? form.requierePrueba : false,
        notas: form.notes.trim() || 'Sin notas adicionales',
        fecha: form.date
      };

      await createBooking(bookingPayload);

      setConfirmedBooking({
        ...bookingPayload,
        serviceName: selectedService.name
      });

      setMessage({ type: 'success' });

      // Reset form
      setForm(initialForm);
      setErrors({});
      setTouched({});

      // Scroll to success message
      setTimeout(() => {
        document.getElementById('booking-message')?.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }, 100);
    } catch (error) {
      setMessage({
        type: 'error',
        text: `❌ No se pudo registrar la pre-agenda: ${error.message}. Intenta nuevamente.`
      });
    } finally {
      setSubmitting(false);
    }
  };

  const selectedService = SERVICES.find((s) => s.id === form.serviceId);
  const showPruebaOption = selectedService && isServiceWithPrueba(selectedService.id);

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];
  const maxDate = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  return (
    <section id="agendar" className="section booking-section">
      <div className="container">
        <div className="section-header">
          <span className="section-tag">Agenda tu cita</span>
          <h2>Reserva en línea</h2>
          <p>
            Selecciona tu servicio y la fecha deseada. Tu solicitud será una
            <strong> pre-agenda</strong>: Daniela te contactará por WhatsApp para coordinar la hora y ultimar los detalles.
          </p>
        </div>

        <div className="booking-grid">
          <div className="booking-info">
            <h3>Información</h3>
            <p>
              Solicita directamente tu cita. Daniela revisará su agenda y te contactará para confirmar el horario exacto.
            </p>

            <div className="booking-contact">
              <h4>¿Dudas?</h4>
              <p>
                <svg className="wa-icon" viewBox="0 0 24 24" width="16" height="16">
                  <path fill="#25D366" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                WhatsApp: +57 321 664 6983
              </p>
              <p>📧 danielatapias1226@gmail.com</p>
              <p>📍 Cartago, Valle del Cauca</p>
              <div style={{ marginTop: '1.25rem' }}>
                <a
                  href="https://wa.me/573216646983?text=Hola%20Daniela%2C%20tengo%20una%20pregunta%20sobre%20tus%20servicios"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-whatsapp-inline"
                >
                  Agendar por WhatsApp
                </a>
              </div>
            </div>
          </div>

          <form className="booking-form" onSubmit={handleSubmit} noValidate>
            <h3>Formulario de reserva</h3>

            {/* Paso 1: Servicio */}
            <div className="form-step">
              <div className="form-step-title">
                <span className="step-num">1</span> Selecciona el servicio
              </div>
              <div className="service-selector">
                {SERVICES.map((service) => (
                  <button
                    type="button"
                    key={service.id}
                    className={`service-option ${form.serviceId === service.id ? 'selected' : ''}`}
                    onClick={() => {
                      setForm((prev) => ({
                        ...prev,
                        serviceId: service.id,
                        requierePrueba: isServiceWithPrueba(service.id) ? prev.requierePrueba : false
                      }));
                      setErrors((prev) => ({ ...prev, serviceId: '' }));
                    }}
                  >
                    <span className="icon">{service.icon}</span>
                    <span className="name">{service.name}</span>
                    <span className="price">{formatPrice(service.price)}</span>
                  </button>
                ))}
              </div>
              {(touched.serviceId || errors.serviceId) && errors.serviceId && (
                <p className="error-text">{errors.serviceId}</p>
              )}
            </div>

            {/* Paso 2: Tus datos */}
            <div className="form-step">
              <div className="form-step-title">
                <span className="step-num">2</span> Tus datos
              </div>

              <div className="field">
                <label htmlFor="name">Nombre completo *</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Ej: María Fernanda Gómez"
                  value={form.name}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
                {(touched.name || errors.name) && errors.name && (
                  <p className="error-text">{errors.name}</p>
                )}
              </div>

              <div className="field-group">
                <div className="field">
                  <label htmlFor="phone">WhatsApp / Teléfono *</label>
                  <PhoneInput
                    id="phone"
                    name="phone"
                    international
                    defaultCountry="CO"
                    placeholder="300 123 4567"
                    value={form.phone}
                    onChange={(val) => {
                      setForm((prev) => ({ ...prev, phone: val || '' }));
                      if (touched.phone) {
                        setErrors((prev) => ({
                          ...prev,
                          phone: val && isValidPhoneNumber(val) ? '' : 'Ingresa un número de WhatsApp válido'
                        }));
                      }
                    }}
                    onBlur={() => {
                      setTouched((prev) => ({ ...prev, phone: true }));
                      setErrors((prev) => ({
                        ...prev,
                        phone: form.phone && isValidPhoneNumber(form.phone) ? '' : 'Ingresa un número de WhatsApp válido'
                      }));
                    }}
                  />
                  {(touched.phone || errors.phone) && errors.phone && (
                    <p className="error-text">{errors.phone}</p>
                  )}
                </div>

                <div className="field">
                  <label htmlFor="email">Email (opcional)</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="tucorreo@gmail.com"
                    value={form.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                  {(touched.email || errors.email) && errors.email && (
                    <p className="error-text">{errors.email}</p>
                  )}
                </div>
              </div>

              <div className="field checkbox">
                <input
                  id="domicilio"
                  name="domicilio"
                  type="checkbox"
                  checked={form.domicilio}
                  onChange={handleChange}
                />
                <label htmlFor="domicilio">
                  ¿Necesitas servicio a domicilio?{' '}
                  <span className="field-hint">
                    (el valor depende de tu ubicación — será confirmado a tu número telefónico)
                  </span>
                </label>
              </div>

              {form.domicilio && (
                <div className="field">
                  <label htmlFor="domicilioDetalles">
                    Detalles del domicilio *
                  </label>
                  <input
                    id="domicilioDetalles"
                    name="domicilioDetalles"
                    type="text"
                    placeholder="Ej: Barrio, dirección, referencias, ciudad..."
                    value={form.domicilioDetalles}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                  {(touched.domicilioDetalles || errors.domicilioDetalles) &&
                    errors.domicilioDetalles && (
                      <p className="error-text">{errors.domicilioDetalles}</p>
                    )}
                </div>
              )}

              <div className="field checkbox">
                <input
                  id="requiereMaquillaje"
                  name="requiereMaquillaje"
                  type="checkbox"
                  checked={form.requiereMaquillaje}
                  onChange={handleChange}
                />
                <label htmlFor="requiereMaquillaje">
                  Requiere maquillaje ({formatPrice(MAQUILLAJE_PRICE)})
                </label>
              </div>

              {/* Opción de prueba para Novias y Quinceañeras */}
              {showPruebaOption && (
                <div className="field checkbox" style={{ marginTop: '12px' }}>
                  <input
                    id="requierePrueba"
                    name="requierePrueba"
                    type="checkbox"
                    checked={form.requierePrueba}
                    onChange={handleChange}
                  />
                  <label htmlFor="requierePrueba" style={{ fontWeight: 600, color: 'var(--primary, #8a2b53)' }}>
                    👰 ¿Deseas incluir prueba de peinado previa?
                  </label>
                </div>
              )}

              {showPruebaOption && form.requierePrueba && (
                <div style={{ marginTop: '6px', marginBottom: '14px', padding: '10px 14px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', color: '#92400e', fontSize: '13px', lineHeight: 1.4 }}>
                  ⚠️ <strong>Ten en cuenta:</strong> Las pruebas de peinado se realizan exclusivamente en <strong>días de semana (lunes a viernes)</strong>, no los fines de semana.
                </div>
              )}

              <div className="field">
                <label htmlFor="notes">Notas adicionales (opcional)</label>
                <textarea
                  id="notes"
                  name="notes"
                  placeholder="Ej: estilo que deseas, referencias, evento, etc."
                  value={form.notes}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Paso 3: Fecha */}
            <div className="form-step">
              <div className="form-step-title">
                <span className="step-num">3</span> Elige el día
              </div>

              <div className="date-picker">
                <div className="field">
                  <label htmlFor="date">Fecha de tu evento o cita *</label>
                  <input
                    id="date"
                    name="date"
                    type="date"
                    min={minDate}
                    max={maxDate}
                    value={form.date}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                  {(touched.date || errors.date) && errors.date && (
                    <p className="error-text">{errors.date}</p>
                  )}
                  <p className="field-hint-sameday">
                    ¿Necesitas cita para hoy? Las citas para el mismo día se agendan directamente por{' '}
                    <a
                      href="https://wa.me/573216646983?text=Hola%20Daniela%2C%20quiero%20agendar%20una%20cita%20para%20hoy"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      WhatsApp
                    </a>
                    .
                  </p>
                </div>
              </div>
            </div>

            {/* Resumen */}
            {selectedService && form.date && (
              <div className="form-step">
                <div className="booking-summary">
                  <h4>Resumen de tu pre-agenda</h4>
                  <div className="summary-row">
                    <span className="label">Servicio</span>
                    <span>
                      {selectedService.icon} {selectedService.name}
                    </span>
                  </div>
                  <div className="summary-row">
                    <span className="label">Fecha deseada</span>
                    <span style={{ textTransform: 'capitalize' }}>
                      {formatDateSpanish(form.date)}
                    </span>
                  </div>
                  <div className="summary-row">
                    <span className="label">Horario</span>
                    <span style={{ color: '#b45309', fontWeight: 500 }}>A coordinar por WhatsApp</span>
                  </div>
                  <div className="summary-row">
                    <span className="label">Duración aprox.</span>
                    <span>{selectedService.duration} min</span>
                  </div>
                  {showPruebaOption && (
                    <div className="summary-row">
                      <span className="label">Prueba previa</span>
                      <span>{form.requierePrueba ? 'Sí (en día de semana)' : 'No solicitada'}</span>
                    </div>
                  )}
                  {form.domicilio && (
                    <div className="summary-row">
                      <span className="label">Domicilio</span>
                      <span>Según ubicación (a coordinar)</span>
                    </div>
                  )}
                  {form.requiereMaquillaje && (
                    <div className="summary-row">
                      <span className="label">Maquillaje</span>
                      <span>{formatPrice(MAQUILLAJE_PRICE)}</span>
                    </div>
                  )}
                  <div className="summary-row total">
                    <span className="label">Total estimado</span>
                    <span>{formatPrice(selectedService.price + (form.requiereMaquillaje ? MAQUILLAJE_PRICE : 0))}</span>
                  </div>
                  <p className="summary-note">
                    {form.domicilio
                      ? 'El costo del desplazamiento y la hora exacta serán coordinados directamente contigo por WhatsApp.'
                      : 'Daniela se comunicará contigo por WhatsApp para confirmar la hora exacta de inicio.'}
                  </p>
                </div>
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              style={{ width: '100%' }}
              disabled={submitting}
            >
              {submitting ? '⏳ Enviando pre-agenda...' : '📅 Solicitar mi pre-agenda'}
            </button>

            {message && (
              <div
                id="booking-message"
                className={`booking-message ${message.type}`}
              >
                {message.type === 'error' && message.text}
                {message.type === 'success' && confirmedBooking && (
                  <div className="booking-confirmation">
                    <p className="confirmation-title">✨ ¡Tu pre-agenda ha sido registrada!</p>
                    <p>
                      <strong>
                        Tu solicitud para el {formatDateSpanish(confirmedBooking.fecha)} fue recibida con éxito.
                      </strong>
                    </p>
                    <p style={{ marginTop: '0.5rem' }}>
                      Daniela se comunicará contigo vía WhatsApp al{' '}
                      <strong>+{confirmedBooking.whatsapp}</strong> para coordinar la hora exacta de tu cita y afinar todos los detalles.
                    </p>
                    {confirmedBooking.requiere_prueba && (
                      <div style={{ margin: '1rem 0', padding: '0.75rem 1rem', background: '#fef3c7', borderRadius: '8px', color: '#92400e', fontSize: '0.88rem' }}>
                        💇‍♀️ <strong>Prueba de peinado:</strong> Recuerda que la prueba previa se coordina para un día de semana (lunes a viernes).
                      </div>
                    )}
                    <p className="confirmation-disclaimer" style={{ marginTop: '0.75rem' }}>
                      El valor mostrado es una estimación. El valor final se confirmará al definir particularidades del peinado o desplazamiento.
                    </p>
                  </div>
                )}
              </div>
            )}
          </form>
        </div>
      </div>
    </section>
  );
}