import { useState, useEffect, useCallback, useRef } from 'react';
import PhoneInput from 'react-phone-number-input';
import { isValidPhoneNumber } from 'libphonenumber-js';
import 'react-phone-number-input/style.css';
import { SERVICES, OPENING_HOUR, LAST_SLOT_START } from '../data/services';
import { getAvailability, createBooking } from '../api/n8n';

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
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotsError, setSlotsError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
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
      setSlots([]);
      return;
    }

    // No re-consultar si la fecha no cambió
    if (previousDateRef.current === form.date) return;
    previousDateRef.current = form.date;

    let cancelled = false;
    setLoadingSlots(true);
    setSlotsError('');
    setForm((prev) => ({ ...prev, time: '' }));

    getAvailability(form.date)
      .then((availableSlots) => {
        if (cancelled) return;
        if (Array.isArray(availableSlots) && availableSlots.length > 0) {
          setSlots(availableSlots);
        } else {
          setSlots([]);
          setSlotsError('No hay disponibilidad para este día.');
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setSlots([]);
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
    if (!form.email || !emailRegex.test(form.email)) {
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
      email: true,
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
      const totalPrice = selectedService.price;
      const { startISO, endISO } = toEventISO(form.date, form.time, selectedService.duration);

      const bookingPayload = {
        servicio: selectedService.name,
        precio: totalPrice,
        nombre_completo: form.name.trim(),
        whatsapp: form.phone ? form.phone.replace(/[^0-9]/g, '') : '',
        email: form.email.trim(),
        a_domicilio: form.domicilio,
        detalles_domicilio: form.domicilio ? form.domicilioDetalles.trim() : 'NA',
        requiere_maquillaje: form.requiereMaquillaje,
        notas: form.notes.trim(),
        fecha_inicio: startISO,
        fecha_fin: endISO
      };

      const result = await createBooking(bookingPayload);

      setMessage({
        type: 'success',
        text: `✅ ¡Cita agendada con éxito! ${result.summary ? 'Te enviamos la confirmación a tu email.' : ''}`
      });

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

  const minDate = new Date().toISOString().split('T')[0];
  const maxDate = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  return (
		<section id="agendar" className="section booking-section">
			<div className="container">
				<div className="section-header">
					<span className="section-tag">Agenda tu cita</span>
					<h2>Reserva en línea</h2>
					<p>
						Selecciona tu servicio, elige la fecha y hora disponibles. Recibirás
						confirmación por email.
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
							<p>📱 WhatsApp: +57 321 664 6983</p>
							<p>📧 danielatapias1226@gmail.com</p>
							<p>
								📍 Estudio en tu ciudad (domicilio disponible con servicio
								Personalizado)
							</p>
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
									<label htmlFor="email">Email *</label>
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
								</div>
							</div>

							<div className="field">
								<label>Horas disponibles</label>
								{loadingSlots ? (
									<div className="slots-loading">
										⏳ Consultando disponibilidad...
									</div>
								) : slotsError && !loadingSlots ? (
									<div className="slots-error">{slotsError}</div>
								) : slots.length > 0 ? (
									<>
										<div className="slots-grid">
											{slots.map((slot) => (
												<button
													type="button"
													key={slot}
													className={`slot-btn ${form.time === slot ? "selected" : ""}`}
													onClick={() => {
														setForm((prev) => ({ ...prev, time: slot }));
														setErrors((prev) => ({ ...prev, time: "" }));
													}}
												>
													{formatTimeSpanish(slot)}
												</button>
											))}
										</div>
										{(touched.time || errors.time) && errors.time && (
											<p className="error-text">{errors.time}</p>
										)}
									</>
								) : form.date ? (
									<div className="slots-empty">
										{!loadingSlots &&
											"No hay horas disponibles para esta fecha."}
									</div>
								) : (
									<div className="slots-empty">
										Selecciona una fecha para ver las horas disponibles.
									</div>
								)}
							</div>
						</div>

						{selectedService && form.date && form.time && (
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
											<span>Sí</span>
										</div>
									)}
									<div className="summary-row total">
										<span className="label">Total aprox.</span>
										<span>{formatPrice(selectedService.price)}</span>
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
							disabled={submitting}
						>
							{submitting ? "⏳ Agendando..." : "✅ Confirmar mi cita"}
						</button>

						{message && (
							<div
								id="booking-message"
								className={`booking-message ${message.type}`}
							>
								{message.text}
							</div>
						)}
					</form>
				</div>
			</div>
		</section>
	);
}