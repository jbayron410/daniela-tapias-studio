import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { parseCitaDateTime, getEstado } from './helpers';

const STATUS_COLORS = {
  '0': { bg: '#ff9800', border: '#e68900' },
  '1': { bg: '#4caf50', border: '#388e3c' },
  '2': { bg: '#ef5350', border: '#d32f2f' }
};

function citasToEvents(citas) {
  return citas.map((cita) => {
    const start = parseCitaDateTime(cita['Fecha Cita'], cita['Hora Cita']);
    if (!start) return null;

    const end = new Date(start.getTime() + 60 * 60 * 1000);
    const colors = STATUS_COLORS[String(cita['Estado Confirmación'])] || { bg: '#999', border: '#777' };
    const estado = getEstado(cita['Estado Confirmación']);

    return {
      id: cita.ID || cita.rowIndex?.toString(),
      title: `${cita.Clienta} — ${cita.Servicio || ''}`,
      start,
      end,
      backgroundColor: colors.bg,
      borderColor: colors.border,
      extendedProps: { ...cita, estadoLabel: estado.label }
    };
  }).filter(Boolean);
}

function bloqueosToEvents(bloqueos) {
  return bloqueos.map((b, i) => {
    const isDiaCerrado = b.title.toUpperCase().indexOf('DÍA CERRADO') !== -1;
    return {
      id: `bloqueo-${i}`,
      title: isDiaCerrado ? '🔒 Día cerrado' : `🔒 ${b.title}`,
      start: b.start,
      end: b.end,
      backgroundColor: '#78909c',
      borderColor: '#546e7a',
      textColor: '#fff',
      display: 'block',
      extendedProps: { isBloqueo: true, description: b.description }
    };
  });
}

export default function CalendarView({ citas, bloqueos = [], onEventClick }) {
  const events = [...citasToEvents(citas), ...bloqueosToEvents(bloqueos)];

  return (
    <div className="calendar-view-wrapper">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay'
        }}
        locale="es"
        buttonText={{
          today: 'Hoy',
          month: 'Mes',
          week: 'Semana',
          day: 'Día'
        }}
        events={events}
        eventClick={(info) => {
          if (onEventClick) onEventClick(info.event.extendedProps);
        }}
        height="auto"
        slotMinTime="07:00:00"
        slotMaxTime="21:00:00"
        allDaySlot={false}
        nowIndicator={true}
        eventDisplay="block"
        dayMaxEvents={4}
        eventDidMount={(info) => {
          const props = info.event.extendedProps;
          if (props.isBloqueo) {
            info.el.title = props.description || info.event.title;
          } else {
            info.el.title = `${props.Clienta}\n${props.Servicio}\n${props.estadoLabel}`;
          }
        }}
      />
    </div>
  );
}
