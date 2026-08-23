// ============================================
// Capa de comunicación con webhooks (Make)
// ============================================

// Webhook de Make: consulta los eventos ocupados del calendario
const MAKE_AVAILABILITY_WEBHOOK_URL = import.meta.env
	.MAKE_AVAILABILITY_WEBHOOK_URL;

// Webhook de Make: crea la reserva (inserta el evento en Google Calendar)
const MAKE_BOOKING_WEBHOOK_URL = import.meta.env.MAKE_BOOKING_WEBHOOK_URL;

// Horario laboral: primer slot 5:00 AM, último slot empieza 10:00 PM
const OPENING_SLOT_HOUR = 5;
const LAST_SLOT_HOUR = 22;

/**
 * Consulta los slots disponibles para una fecha específica.
 * Hace GET al webhook de Make con ?fecha=YYYY-MM-DD, recibe los
 * eventos ocupados y calcula las horas libres restando los bloqueos
 * del horario laboral (5:00 AM - 10:00 PM, slots de 1 hora).
 * @param {string} date - Fecha en formato YYYY-MM-DD
 * @returns {Promise<string[]>} - Array de horas disponibles "HH:00" (formato 24h)
 */
export async function getAvailability(date) {
  try {
    const response = await fetch(
      `${MAKE_AVAILABILITY_WEBHOOK_URL}?fecha=${date}`,
      { method: 'GET' }
    );

    if (!response.ok) {
      throw new Error(`Error al consultar disponibilidad: ${response.status}`);
    }

    const data = await response.json();
    const eventos = Array.isArray(data.eventos) ? data.eventos : [];
    return computeAvailableSlots(date, eventos);
  } catch (error) {
    console.error('Error consultando disponibilidad:', error);
    // Fallback: generar slots básicos si el webhook no está disponible
    // (útil para desarrollo sin conexión)
    return generateFallbackSlots(date);
  }
}

/**
 * Envía una reserva al webhook de Make para crear el evento en Google Calendar
 * @param {Object} booking - Datos de la reserva (payload en español)
 * @returns {Promise<Object>} - Respuesta de Make
 */
export async function createBooking(booking) {
  const response = await fetch(MAKE_BOOKING_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(booking)
  });

  if (!response.ok) {
    throw new Error(`Error al crear la reserva: ${response.status}`);
  }

  const text = await response.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return {};
  }
}

/**
 * Calcula las horas disponibles restando los eventos ocupados
 * del horario laboral (5:00 AM - 10:00 PM, slots de 1 hora).
 * @param {string} date - Fecha en formato YYYY-MM-DD
 * @param {Array<{start: string, end: string}>} eventos - Eventos ocupados
 * @returns {string[]} - Slots disponibles "HH:00"
 */
function computeAvailableSlots(date, eventos) {
  const [year, month, day] = date.split('-').map(Number);
  const now = new Date();
  const isToday = now.toDateString() === new Date(year, month - 1, day).toDateString();

  // Convertir eventos a rangos [inicio, fin)
  const ocupados = eventos
    .map((e) => ({
      start: new Date(e.start),
      end: new Date(e.end)
    }))
    .filter((e) => !isNaN(e.start) && !isNaN(e.end));

  const slots = [];
  const pad = (n) => String(n).padStart(2, '0');

  for (let h = OPENING_SLOT_HOUR; h <= LAST_SLOT_HOUR; h++) {
    const slotStart = new Date(year, month - 1, day, h, 0);
    const slotEnd = new Date(year, month - 1, day, h + 1, 0);

    // Si es hoy, descartar horas que ya pasaron
    if (isToday && slotStart <= now) continue;

    // Si el slot se solapa con algún evento ocupado, se bloquea
    const bloqueado = ocupados.some(
      (e) => slotStart < e.end && slotEnd > e.start
    );

    if (!bloqueado) {
      slots.push(`${pad(h)}:00`);
    }
  }

  return slots;
}

/**
 * Genera slots de contingencia (cuando el webhook no está conectado).
 * NO bloquea horas ocupadas — solo para desarrollo visual.
 */
function generateFallbackSlots(date) {
  const [year, month, day] = date.split('-').map(Number);
  const now = new Date();
  const selectedDate = new Date(year, month - 1, day);
  const isToday = now.toDateString() === selectedDate.toDateString();
  const currentHour = now.getHours() + (now.getMinutes() > 0 ? 1 : 0);

  // Si la fecha ya pasó, no hay slots
  if (selectedDate < new Date(now.toDateString())) {
    return [];
  }

  return computeAvailableSlots(date, []);
}
