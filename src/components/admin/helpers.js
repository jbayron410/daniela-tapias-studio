const ESTADO_MAP = {
  '0': { label: 'Pendiente', color: '#ff9800', bg: '#fff3e0' },
  '1': { label: 'Confirmada', color: '#4caf50', bg: '#e8f5e9' },
  '2': { label: 'Cancelada', color: '#ef5350', bg: '#fdeaea' }
};

export function getEstado(estado) {
  return ESTADO_MAP[String(estado)] || { label: String(estado), color: '#999', bg: '#f5f5f5' };
}

/**
 * Convierte "Fecha Cita" + "Hora Cita" a Date.
 * Soporta dos formatos de fecha:
 *   - DD/MM/YYYY  (ej: "24/8/2026")
 *   - ISO 8601    (ej: "2026-08-24T05:00:00.000Z")
 * Soporta hora en formato 12h (ej: "02:00 pm").
 */
export function parseCitaDateTime(fechaStr, horaStr) {
  if (!fechaStr) return null;

  const raw = fechaStr.trim();

  // Formato ISO: 2026-08-24T05:00:00.000Z o 2026-08-24
  if (raw.includes('T') || (raw.includes('-') && !raw.includes('/'))) {
    const d = new Date(raw);
    if (!isNaN(d.getTime())) {
      // Si hay hora explícita en 12h, sobreescribe la hora del ISO
      if (horaStr) {
        const parsed = parseHora12(horaStr);
        if (parsed) {
          d.setHours(parsed.hours, parsed.minutes, 0, 0);
        }
      }
      return d;
    }
  }

  // Formato DD/MM/YYYY
  const parts = raw.split('/');
  if (parts.length < 3) return null;

  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const year = parseInt(parts[2], 10);

  let hours = 0;
  let minutes = 0;

  if (horaStr) {
    const parsed = parseHora12(horaStr);
    if (parsed) {
      hours = parsed.hours;
      minutes = parsed.minutes;
    }
  }

  return new Date(year, month, day, hours, minutes);
}

function parseHora12(horaStr) {
  if (!horaStr) return null;
  const match = horaStr.trim().match(/^(\d{1,2}):(\d{2})\s*(am|pm)?$/i);
  if (!match) return null;

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = (match[3] || '').toLowerCase();

  if (period === 'pm' && hours < 12) hours += 12;
  if (period === 'am' && hours === 12) hours = 0;

  return { hours, minutes };
}

export function formatFecha(fechaStr) {
  const date = parseCitaDateTime(fechaStr, '12:00 am');
  if (!date) return fechaStr;
  return date.toLocaleDateString('es-CO', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

export function getMesLabel(fechaStr) {
  const date = parseCitaDateTime(fechaStr, '12:00 am');
  if (!date) return '';
  return date.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });
}

export function getUniqueMonths(citas) {
  const months = new Set();
  citas.forEach((c) => {
    const label = getMesLabel(c['Fecha Cita']);
    if (label) months.add(label);
  });
  return [...months].sort((a, b) => {
    const da = parseFechaFromLabel(a);
    const db = parseFechaFromLabel(b);
    return da - db;
  });
}

function parseFechaFromLabel(label) {
  const meses = {
    enero: 0, febrero: 1, marzo: 2, abril: 3, mayo: 4, junio: 5,
    julio: 6, agosto: 7, septiembre: 8, octubre: 9, noviembre: 10, diciembre: 11
  };
  const parts = label.toLowerCase().split(' de ');
  if (parts.length < 2) return new Date();
  const m = meses[parts[0]] ?? 0;
  const y = parseInt(parts[1]);
  return new Date(y, m);
}

/** Ordena citas por fecha+hora ascendente o descendente */
export function sortCitas(citas, direction = 'asc') {
  return [...citas].sort((a, b) => {
    const da = parseCitaDateTime(a['Fecha Cita'], a['Hora Cita']);
    const db = parseCitaDateTime(b['Fecha Cita'], b['Hora Cita']);
    if (!da && !db) return 0;
    if (!da) return 1;
    if (!db) return -1;
    return direction === 'asc' ? da - db : db - da;
  });
}

/** Compara fecha+hora de una cita contra un rango temporal */
export function citaEnRangoTemporal(cita, rango) {
  if (rango === 'todas') return true;

  const citaDate = parseCitaDateTime(cita['Fecha Cita'], cita['Hora Cita']);
  if (!citaDate) return false;

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

  if (rango === 'hoy') {
    return citaDate >= todayStart && citaDate <= todayEnd;
  }

  if (rango === 'semana') {
    const dayOfWeek = now.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + mondayOffset);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59);
    return citaDate >= weekStart && citaDate <= weekEnd;
  }

  if (rango === 'mes') {
    const mesStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const mesEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    return citaDate >= mesStart && citaDate <= mesEnd;
  }

  return true;
}
