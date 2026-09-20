// ──────────────────────────────────────────────────────────────
// SYNC: Este formulario y AdminBookingModal.jsx deben mantenerse
// sincronizados. Si cambias campos, validaciones, precios o payload aquí,
// aplica los mismos cambios en el formulario del admin (y viceversa).
// ──────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback, useRef } from 'react';
import PhoneInput from 'react-phone-number-input';
import { isValidPhoneNumber } from 'libphonenumber-js';
import 'react-phone-number-input/style.css';
import { SERVICES, OPENING_HOUR, LAST_SLOT_START } from '../data/services';
import { getAllSlotsWithAvailability, createBooking } from '../api/n8n';

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

function formatTimeSpanish(hour) {
  // "14:00" -> "2:00 PM"
  const [h, m] = hour.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${suffix}`;
}

// Convierte fecha (YYYY-MM-DD) y hora (HH:00) a ISO-8601
// con offset de Colombia (-05:00). Suma durationMinutes para fecha_fin.
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

function toGoogleCalendarDate(isoStr) {
  // "2025-07-15T14:00:00-05:00" -> "20250715T190000Z" (UTC)
  const d = new Date(isoStr);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
}

function buildGoogleCalendarUrl(booking) {
  const dates = `${toGoogleCalendarDate(booking.startISO)}/${toGoogleCalendarDate(booking.endISO)}`;
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `Cita - ${booking.servicio} | Daniela Tapias Studio`,
    dates,
    details: `Servicio: ${booking.servicio}\nTotal aprox.: ${formatPrice(booking.precio)}${booking.requiereMaquillaje ? '\nIncluye maquillaje' : ''}${booking.notas && booking.notas !== 'Sin notas adicionales' ? `\nNotas: ${booking.notas}` : ''}`,
    location: 'Daniela Tapias Studio'
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function buildICSContent(booking) {
  const dtStart = toGoogleCalendarDate(booking.startISO);
  const dtEnd = toGoogleCalendarDate(booking.endISO);
  const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Daniela Tapias Studio//ES',
    'BEGIN:VEVENT',
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `DTSTAMP:${now}`,
    `UID:${Date.now()}@danielatapias.studio`,
    `SUMMARY:Cita - ${booking.servicio} | Daniela Tapias Studio`,
    `DESCRIPTION:Servicio: ${booking.servicio}\\nTotal aprox.: ${formatPrice(booking.precio)}${booking.requiereMaquillaje ? '\\nIncluye maquillaje' : ''}`,
    'LOCATION:Daniela Tapias Studio',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
}

function downloadICS(booking) {
  const content = buildICSContent(booking);
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'cita-daniela-tapias.ics';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
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
  date: '',
  time: ''
};

const emptyErrors = {};

export default function BookingForm({ preselectService, onResetPreselect }) {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState(emptyErrors);
  const [allSlots, setAllSlots] = useState([]);
  const [availableSet, setAvailableSet] = useState(new Set());
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotsError, setSlotsError] = useState('');
  const [selectedBusySlot, setSelectedBusySlot] = useState(false);
  const [timeSuggestions, setTimeSuggestions] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [confirmedBooking, setConfirmedBooking] = useState(null);
  const [touched, setTouched] = useState({});
  const previousDateRef = useRef('');

  // Preseleccionar servicio cuando viene de la tarjeta de servicios
  useEffect(() => {
    if (preselectService) {
      setForm((prev) => ({ ...prev, serviceId: preselectService.id }));
      onResetPreselect();
    }
  }, [preselectService, onResetPreselect]);

  // Consultar disponibilidad cuando cambia la fecha
  useEffect(() => {
    if (!form.date) {
      setAllSlots([]);
      setAvailableSet(new Set());
      return;
    }

    // No re-consultar si la fecha no cambió
    if (previousDateRef.current === form.date) return;
    previousDateRef.current = form.date;

    let cancelled = false;
    setLoadingSlots(true);
    setSlotsError('');
    setSelectedBusySlot(false);
    setTimeSuggestions(null);
    setForm((prev) => ({ ...prev, time: '' }));

    getAllSlotsWithAvailability(form.date)
      .then(({ allSlots: slots, availableSet: availSet, diaCompleto }) => {
        if (cancelled) return;
        if (diaCompleto) {
          setAllSlots(slots);
          setAvailableSet(new Set());
          setSlotsError('Daniela no atiende este día.');
        } else if (availSet.size === 0) {
          setAllSlots(slots);
          setAvailableSet(new Set());
          setSlotsError('No hay agenda disponible para este día.');
        } else {
          setAllSlots(slots);
          setAvailableSet(availSet);
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setAllSlots([]);
        setAvailableSet(new Set());
        setSlotsError('Error al consultar disponibilidad. Intenta nuevamente.');
        console.error(err);
      })
      .finally(() => {
        if (!cancelled) setLoadingSlots(false);
      });

    return () => {
      cancelled = true;
    };
  }, [form.date]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (name === 'date') {
      previousDateRef.current = '';
    }
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  const handleTimeSelect = (slot) => {
    if (availableSet.has(slot)) {
      setForm((prev) => ({ ...prev, time: slot }));
      setErrors((prev) => ({ ...prev, time: '' }));
      setSelectedBusySlot(false);
      setTimeSuggestions(null);
    } else {
      setForm((prev) => ({ ...prev, time: slot }));
      setSelectedBusySlot(true);
      const above = [];
      const below = [];
      for (const s of allSlots) {
        if (availableSet.has(s)) {
          if (s < slot) below.push(s);
          else if (s > slot) above.push(s);
        }
      }
      if (above.length === 0 && below.length === 0) {
        setTimeSuggestions(null);
      } else {
        setTimeSuggestions({
          above: above.length > 0 ? above[0] : null,
          below: below.length > 0 ? below[0] : null
        });
      }
    }
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
    if (!form.time) newErrors.time = 'Selecciona una hora';
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
      date: true,
      time: true
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
      const { startISO, endISO } = toEventISO(form.date, form.time, selectedService.duration);

      const bookingPayload = {
        servicio: selectedService.name,
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

      const result = await createBooking(bookingPayload);

      setConfirmedBooking({
        ...bookingPayload,
        startISO,
        endISO,
        serviceName: selectedService.name
      });

      setMessage({ type: 'success' });

      // Reset form
      setForm(initialForm);
      setSlots([]);
      previousDateRef.current = '';
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
        text: `❌ No se pudo agendar la cita: ${error.message}. Intenta nuevamente.`
      });
    } finally {
      setSubmitting(false);
    }
  };

  const selectedService = SERVICES.find((s) => s.id === form.serviceId);

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
						Selecciona tu servicio, la fecha y hora. Tu solicitud será una
						<strong> pre-agenda</strong>: Daniela te escribirá por WhatsApp
						para confirmar tu cita.
					</p>
				</div>

				<div className="booking-grid">
					<div className="booking-info">
						<h3>Información</h3>
						<p>
							Agenda directamente tu cita. La disponibilidad se actualiza en
							tiempo real según el calendario de la peinadora.
						</p>

						<div className="booking-hours">
							<h4>Horario de atención</h4>
							<ul>
								<li>Lunes a Domingo</li>
								<li>5:00 AM - 11:00 PM</li>
								<li>Última cita comienza a las 10:00 PM</li>
								<li>Servicios de 1 hora aprox.</li>
							</ul>
						</div>

						<div className="booking-contact">
							<h4>¿Dudas?</h4>
							<p>
								<svg className="wa-icon" viewBox="0 0 24 24" width="16" height="16"><path fill="#25D366" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
								WhatsApp: +57 321 664 6983
							</p>
							<p>📧 danielatapias1226@gmail.com</p>
							<p>
								📍 Estudio en tu ciudad (domicilio disponible con servicio
								Personalizado)
							</p>
							<a
								href="https://wa.me/573216646983?text=Hola%20Daniela%2C%20quiero%20agendar%20una%20cita"
								target="_blank"
								rel="noopener noreferrer"
								className="btn btn-whatsapp-inline"
							>
								<svg className="wa-icon" viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
								Agendar por WhatsApp
							</a>
						</div>
					</div>

					<form className="booking-form" onSubmit={handleSubmit} noValidate>
						<h3>Formulario de reserva</h3>

						<div className="form-step">
							<div className="form-step-title">
								<span className="step-num">1</span> Selecciona el servicio
							</div>
							<div className="service-selector">
								{SERVICES.map((service) => (
									<button
										type="button"
										key={service.id}
										className={`service-option ${form.serviceId === service.id ? "selected" : ""}`}
										onClick={() => {
											setForm((prev) => ({ ...prev, serviceId: service.id }));
											setErrors((prev) => ({ ...prev, serviceId: "" }));
										}}
									>
										<span className="icon">{service.icon}</span>
										<span className="name">{service.name}</span>
										<span className="price">{formatPrice(service.price)}</span>
									</button>
								))}
							</div>
							{errors.serviceId && (
								<p className="error-text">{errors.serviceId}</p>
							)}
						</div>

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
											onChange={(value) =>
												handleChange({
													target: { name: 'phone', value: value || '', type: 'text', checked: false }
												})
											}
											onBlur={() => setTouched((prev) => ({ ...prev, phone: true }))}
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
									¿Necesitas servicio a domicilio?{" "}
									<span className="field-hint">
										(el valor depende de tu ubicación — será confirmado a tu
										número telefónico)
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
								<label htmlFor="requiereMaquillaje">Requiere maquillaje</label>
							</div>

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

						<div className="form-step">
							<div className="form-step-title">
								<span className="step-num">3</span> Fecha y hora
							</div>

							<div className="date-picker">
								<div className="field">
									<label htmlFor="date">Elige el día *</label>
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
										¿Necesitas cita para hoy? Las citas para el mismo día se agendan directamente por{" "}
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

							<div className="field">
								<label htmlFor="time">Selecciona una hora *</label>
								{loadingSlots ? (
									<div className="slots-loading">
										⏳ Consultando disponibilidad...
									</div>
								) : slotsError && !loadingSlots ? (
									<div className="slots-error">{slotsError}</div>
								) : allSlots.length > 0 ? (
									<>
										<select
											id="time"
											name="time"
											value={form.time}
											onChange={(e) => handleTimeSelect(e.target.value)}
											onBlur={handleBlur}
										>
											<option value="">-- Selecciona una hora --</option>
											{allSlots.map((slot) => (
												<option key={slot} value={slot}>
													{formatTimeSpanish(slot)}
												</option>
											))}
										</select>
										{selectedBusySlot && timeSuggestions && (
											<div className="slot-suggestion">
												⚠️ Este horario ya está agendado.
												{timeSuggestions.above && timeSuggestions.below
													? <> Te sugerimos: <button type="button" className="suggestion-link" onClick={() => handleTimeSelect(timeSuggestions.above)}>{formatTimeSpanish(timeSuggestions.above)}</button> o <button type="button" className="suggestion-link" onClick={() => handleTimeSelect(timeSuggestions.below)}>{formatTimeSpanish(timeSuggestions.below)}</button></>
													: timeSuggestions.above
														? <> La hora disponible más cercana: <button type="button" className="suggestion-link" onClick={() => handleTimeSelect(timeSuggestions.above)}>{formatTimeSpanish(timeSuggestions.above)}</button></>
														: <> La hora disponible anterior más cercana: <button type="button" className="suggestion-link" onClick={() => handleTimeSelect(timeSuggestions.below)}>{formatTimeSpanish(timeSuggestions.below)}</button></>
												}
											</div>
										)}
										{selectedBusySlot && !timeSuggestions && (
											<div className="slot-suggestion">
												⚠️ Este horario ya está agendado. No hay más disponibilidad para este día.
											</div>
										)}
										{(touched.time || errors.time) && errors.time && (
											<p className="error-text">{errors.time}</p>
										)}
									</>
								) : form.date ? (
									<div className="slots-empty">
										{!loadingSlots &&
											"No hay agenda disponible para esta fecha."}
									</div>
								) : (
									<div className="slots-empty">
										Selecciona una fecha para elegir una hora.
									</div>
								)}
							</div>
						</div>

						{selectedService && form.date && form.time && !selectedBusySlot && (
							<div className="form-step">
								<div className="booking-summary">
									<h4>Resumen de tu cita</h4>
									<div className="summary-row">
										<span className="label">Servicio</span>
										<span>
											{selectedService.icon} {selectedService.name}
										</span>
									</div>
									<div className="summary-row">
										<span className="label">Fecha</span>
										<span style={{ textTransform: "capitalize" }}>
											{formatDateSpanish(form.date)}
										</span>
									</div>
									<div className="summary-row">
										<span className="label">Hora</span>
										<span>{formatTimeSpanish(form.time)}</span>
									</div>
									<div className="summary-row">
										<span className="label">Duración</span>
										<span>{selectedService.duration} min</span>
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
									{form.domicilio && (
										<p className="summary-note">
											El valor del desplazamiento depende de tu ubicación y se
											confirma por WhatsApp antes de la cita.
										</p>
									)}
								</div>
							</div>
						)}

						<button
							type="submit"
							className="btn btn-primary btn-lg"
							style={{ width: "100%" }}
							disabled={submitting || selectedBusySlot}
						>
							{submitting ? "⏳ Enviando pre-agenda..." : "📅 Solicitar mi pre-agenda"}
						</button>

						{message && (
							<div
								id="booking-message"
								className={`booking-message ${message.type}`}
							>
								{message.type === 'error' && message.text}
								{message.type === 'success' && confirmedBooking && (
									<div className="booking-confirmation">
										<p className="confirmation-title">¡Tu pre-agenda ha sido registrada!</p>
										<p>
											<strong>Tu cita quedó como pre-agenda. Daniela te escribirá por WhatsApp para confirmar el agendamiento y coordinar los detalles.</strong>
										</p>
										<p className="confirmation-disclaimer">
											El precio mostrado es un valor aproximado. El valor final puede variar según peinados especiales, requerimientos adicionales u otras particularidades del servicio. El valor definitivo será confirmado directamente por Daniela.
										</p>
										<div className="calendar-buttons">
											<p className="calendar-label">¿Deseas agregar esta cita a tu calendario?</p>
											<div className="calendar-actions">
												<a
													href={buildGoogleCalendarUrl(confirmedBooking)}
													target="_blank"
													rel="noopener noreferrer"
													className="btn btn-calendar"
												>
													Google Calendar
												</a>
												<button
													type="button"
													className="btn btn-calendar"
													onClick={() => downloadICS(confirmedBooking)}
												>
													Apple Calendar / Outlook
												</button>
											</div>
										</div>
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