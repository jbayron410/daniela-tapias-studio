// ============================================
// Capa de comunicación con Google Apps Script
// ============================================

// En desarrollo usa el proxy de Vite (evita CORS); en producción, la URL directa
const APPS_SCRIPT_URL =
  import.meta.env.DEV
    ? '/api/apps-script'
    : import.meta.env.VITE_APPS_SCRIPT_URL;
const API_KEY = import.meta.env.VITE_APPS_SCRIPT_KEY;

// Horario laboral: primer slot 5:00 AM, último slot empieza 10:00 PM
const OPENING_SLOT_HOUR = 5;
const LAST_SLOT_HOUR = 22;

/**
 * Consulta los slots disponibles para una fecha específica.
 * Llama a Apps Script → Google Calendar → retorna horas libres.
 * @param {string} date - Fecha en formato YYYY-MM-DD
 * @returns {Promise<string[]>} - Array de horas disponibles "HH:00" (formato 24h)
 */
export async function getAvailability(date) {
  const url = `${APPS_SCRIPT_URL}?action=availability&fecha=${date}&key=${encodeURIComponent(API_KEY)}`;
  const response = await fetch(url, { method: 'GET' });

  if (!response.ok) {
    throw new Error(`Error al consultar disponibilidad: ${response.status}`);
  }

  const data = await response.json();

  if (data.error) {
    throw new Error(data.error);
  }

  // Día cerrado por Daniela
  if (data.diaCompleto) {
    return [];
  }

  const slots = Array.isArray(data.slots) ? data.slots : [];

  // Si Apps Script no devolvió slots calculados, calcular localmente
  if (slots.length === 0 && !data.diaCompleto) {
    return [];
  }

  return slots;
}

/**
 * Envía una reserva a Apps Script para crear el evento en Google Calendar,
 * guardar en Sheet y enviar WhatsApp.
 * @param {Object} booking - Datos de la reserva
 * @returns {Promise<Object>} - Respuesta de Apps Script
 */
export async function createBooking(booking) {
  const response = await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...booking,
      key: API_KEY,
      action: 'book'
    })
  });

  if (!response.ok) {
    throw new Error(`Error al crear la reserva: ${response.status}`);
  }

  const data = await response.json();

  if (data.error) {
    throw new Error(data.error);
  }

  if (data.success === false) {
    throw new Error(data.error || 'No se pudo registrar la cita');
  }

  return data;
}

/**
 * Consulta los eventos de bloqueo (DÍA CERRADO / Franja bloqueada) del calendario.
 * @param {string} [from] - Fecha inicio rango YYYY-MM-DD (opcional)
 * @param {string} [to] - Fecha fin rango YYYY-MM-DD (opcional)
 * @returns {Promise<Array>} - Lista de bloqueos con title, start, end, description
 */
export async function getBlocks(from, to) {
  let url = `${APPS_SCRIPT_URL}?action=blocks&key=${encodeURIComponent(API_KEY)}`;
  if (from) url += `&from=${from}`;
  if (to) url += `&to=${to}`;

  const response = await fetch(url, { method: 'GET' });

  if (!response.ok) {
    throw new Error(`Error al consultar bloqueos: ${response.status}`);
  }

  const data = await response.json();

  if (data.error) {
    throw new Error(data.error);
  }

  return Array.isArray(data) ? data : [];
}
