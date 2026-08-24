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

export default function CalendarView({ citas, onEventClick }) {
  const events = citasToEvents(citas);

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
          info.el.title = `${info.event.extendedProps.Clienta}\n${info.event.extendedProps.Servicio}\n${info.event.extendedProps.estadoLabel}`;
        }}
      />
    </div>
  );
}
