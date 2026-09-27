import { useState } from 'react';
import { confirmCita } from '../../api/sheets';

function toInputDate(fechaStr) {
  if (!fechaStr) return '';
  const raw = String(fechaStr).trim();
  if (raw.includes('-') && !raw.includes('/')) {
    return raw.split('T')[0];
  }
  const parts = raw.split('/');
  if (parts.length === 3) {
    const day = String(parts[0]).padStart(2, '0');
    const month = String(parts[1]).padStart(2, '0');
    const year = parts[2];
    return `${year}-${month}-${day}`;
  }
  return '';
}

function isNoviaOrQuince(servicio) {
  if (!servicio) return false;
  const s = servicio.toLowerCase();
  return s.includes('novia') || s.includes('quince');
}

// Opciones de hora de 5:00 AM a 10:00 PM cada 30 min
const TIME_OPTIONS = [];
for (let h = 5; h <= 22; h++) {
  for (const m of [0, 30]) {
    if (h === 22 && m > 0) continue;
    const suffix = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 === 0 ? 12 : h % 12;
    const mStr = String(m).padStart(2, '0');
    TIME_OPTIONS.push(`${h12}:${mStr} ${suffix}`);
  }
}

export default function ConfirmCitaModal({ cita, onClose, onSuccess }) {
  const isCandidatePrueba = isNoviaOrQuince(cita.Servicio);

  const [fecha, setFecha] = useState(() => toInputDate(cita['Fecha Cita']));
  const [hora, setHora] = useState(() => {
    const h = cita['Hora Cita'];
    if (h && !h.toLowerCase().includes('coordinar') && !h.toLowerCase().includes('definir')) {
      return h;
    }
    return '09:00 AM';
  });
  const [duracion, setDuracion] = useState(60);
  const [requierePrueba, setRequierePrueba] = useState(() => {
    return cita['Requiere Prueba'] === 'Sí';
  });
  const [fechaPrueba, setFechaPrueba] = useState(() => toInputDate(cita['Fecha Prueba']));
  const [horaPrueba, setHoraPrueba] = useState(() => {
    return cita['Hora Prueba'] || '03:00 PM';
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const isPruebaPosterior = Boolean(requierePrueba && fecha && fechaPrueba && fechaPrueba > fecha);
  const isPruebaMismoDia = Boolean(requierePrueba && fecha && fechaPrueba && fechaPrueba === fecha);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fecha) {
      setError('Por favor selecciona la fecha de la cita.');
      return;
    }
    if (!hora) {
      setError('Por favor selecciona la hora de inicio de la cita.');
      return;
    }
    if (requierePrueba && (!fechaPrueba || !horaPrueba)) {
      setError('Por favor define la fecha y hora para la prueba de peinado.');
      return;
    }

    if (requierePrueba && fecha && fechaPrueba) {
      if (fechaPrueba > fecha) {
        setError('⚠️ La fecha de la prueba no puede ser posterior a la fecha del evento principal. La prueba debe realizarse antes de la cita.');
        return;
      }
      if (fechaPrueba === fecha) {
        setError('⚠️ La fecha de la prueba no debería ser el mismo día del evento. Las pruebas se realizan en días de semana previos.');
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      const res = await confirmCita({
        rowIndex: cita.rowIndex,
        id: cita.ID,
        fecha,
        hora,
        duracion,
        servicio: cita.Servicio,
        clienta: cita.Clienta,
        whatsapp: cita.WhatsApp,
        email: cita.Email,
        a_domicilio: cita['A domicilio'],
        detalles_domicilio: cita['Detalles domicilio'],
        notas: cita.Notas,
        requiere_prueba: requierePrueba,
        fecha_prueba: requierePrueba ? fechaPrueba : '',
        hora_prueba: requierePrueba ? horaPrueba : ''
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Error al confirmar la cita');
      }

      onSuccess({
        ...cita,
        'Fecha Cita': fecha,
        'Hora Cita': hora,
        'Estado Confirmación': '3',
        'Requiere Prueba': requierePrueba ? 'Sí' : 'No',
        'Fecha Prueba': requierePrueba ? fechaPrueba : '',
        'Hora Prueba': requierePrueba ? horaPrueba : '',
        ID: data.eventId || cita.ID
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Error al agendar la cita en Google Calendar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '580px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        <div className="modal-header" style={{ flexShrink: 0, padding: '22px 28px 14px' }}>
          <div>
            <h3>📅 Agendar Cita en Google Calendar</h3>
            <span style={{ fontSize: '0.85rem', color: '#666' }}>
              Asigna el horario acordado con la clienta y crea el evento en Google Calendar
            </span>
          </div>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
          <div className="modal-body" style={{ flex: 1, overflowY: 'auto', padding: '16px 28px' }}>
            {error && (
              <div className="admin-error-banner" style={{ margin: '0 0 16px', padding: '10px 14px' }}>
                <span>⚠️ {error}</span>
              </div>
            )}

            {/* Resumen de la clienta */}
            <div className="modal-cita-preview" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <strong style={{ fontSize: '1rem', color: '#1e293b' }}>{cita.Clienta}</strong>
                  <div style={{ fontSize: '0.88rem', color: '#475569', marginTop: '2px' }}>
                    ✨ Servicio: <strong>{cita.Servicio}</strong>
                  </div>
                  {cita['A domicilio'] === 'Sí' && (
                    <div style={{ fontSize: '0.85rem', color: '#b45309', marginTop: '2px' }}>
                      🏠 Domicilio: {cita['Detalles domicilio'] || 'Sí'}
                    </div>
                  )}
                  {cita.Notas && cita.Notas !== 'Sin notas' && cita.Notas !== 'Sin notas adicionales' && (
                    <div style={{ fontSize: '0.83rem', color: '#64748b', marginTop: '4px', fontStyle: 'italic' }}>
                      📝 "{cita.Notas}"
                    </div>
                  )}
                </div>
                {cita.WhatsApp && (
                  <a
                    href={`https://wa.me/${String(cita.WhatsApp).replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-whatsapp-inline"
                    style={{ fontSize: '0.8rem', padding: '6px 10px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    title="Chatear con la clienta por WhatsApp"
                  >
                    💬 WhatsApp
                  </a>
                )}
              </div>
            </div>

            {/* Campos de la Cita Principal */}
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#334155', marginBottom: '12px' }}>
                📅 Cita Principal del Evento
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                    Fecha de la cita *
                  </label>
                  <input
                    type="date"
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                    required
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.9rem' }}
                  />
                  <small style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '3px', display: 'block' }}>
                    Precargada con lo solicitado por la clienta.
                  </small>
                </div>

                <div className="form-group">
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                    Hora de la cita *
                  </label>
                  <select
                    value={hora}
                    onChange={(e) => setHora(e.target.value)}
                    required
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.9rem' }}
                  >
                    {TIME_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Selector interactivo de duración (evita glitch de popup nativo) */}
              <div style={{ marginTop: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px', color: '#334155' }}>
                  ⏱️ Duración estimada
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {[
                    { value: 45, label: '45 min' },
                    { value: 60, label: '1 hora (recomendado)' },
                    { value: 90, label: '1 hr 30 min' },
                    { value: 120, label: '2 horas' },
                    { value: 180, label: '3 horas' }
                  ].map((opt) => {
                    const isSelected = duracion === opt.value;
                    return (
                      <button
                        type="button"
                        key={opt.value}
                        onClick={() => setDuracion(opt.value)}
                        style={{
                          padding: '7px 14px',
                          borderRadius: '20px',
                          border: isSelected ? '2px solid #2563eb' : '1px solid #cbd5e1',
                          background: isSelected ? '#eff6ff' : '#ffffff',
                          color: isSelected ? '#1d4ed8' : '#475569',
                          fontWeight: isSelected ? 600 : 500,
                          fontSize: '0.83rem',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        {isSelected && <span>✓</span>}
                        <span>{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Sección de Prueba de Peinado */}
            <div style={{ padding: '16px', background: '#fdf8f6', border: '1px solid #f9ded7', borderRadius: '8px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <label htmlFor="modal-requiere-prueba" style={{ fontWeight: 600, color: '#8a2b53', fontSize: '0.92rem', cursor: 'pointer' }}>
                    👰 ¿Incluye prueba de peinado previa?
                  </label>
                  <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
                    {isCandidatePrueba
                      ? 'Recomendado para novias y quinceañeras. Puedes activarla o retirarla según lo acordado.'
                      : 'Puedes activar prueba si la clienta lo solicitó en la conversación.'}
                  </div>
                </div>
                <input
                  id="modal-requiere-prueba"
                  type="checkbox"
                  checked={requierePrueba}
                  onChange={(e) => setRequierePrueba(e.target.checked)}
                  style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                />
              </div>

              {requierePrueba && (
                <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid #f4cfc6' }}>
                  <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '6px', padding: '8px 12px', color: '#92400e', fontSize: '0.8rem', marginBottom: '14px' }}>
                    ⚠️ Recuerda: Las pruebas de peinado se programan en <strong>días de semana (lunes a viernes)</strong>.
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div className="form-group">
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                        Fecha de la prueba *
                      </label>
                      <input
                        type="date"
                        value={fechaPrueba}
                        max={fecha || undefined}
                        onChange={(e) => setFechaPrueba(e.target.value)}
                        required={requierePrueba}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          border: isPruebaPosterior ? '2px solid #ef4444' : '1px solid #cbd5e1',
                          borderRadius: '6px',
                          fontSize: '0.9rem'
                        }}
                      />
                    </div>

                    <div className="form-group">
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                        Hora de la prueba *
                      </label>
                      <select
                        value={horaPrueba}
                        onChange={(e) => setHoraPrueba(e.target.value)}
                        required={requierePrueba}
                        style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.9rem' }}
                      >
                        {TIME_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Alertas explicativas de fecha de prueba */}
                  {isPruebaPosterior && (
                    <div style={{ marginTop: '12px', padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#991b1b', fontSize: '0.84rem', lineHeight: '1.4' }}>
                      ⚠️ <strong>Fecha no válida:</strong> La fecha de la prueba previa (<strong>{fechaPrueba}</strong>) no puede ser posterior a la fecha del evento principal (<strong>{fecha}</strong>). Recuerda que la prueba debe realizarse antes del evento.
                    </div>
                  )}

                  {isPruebaMismoDia && (
                    <div style={{ marginTop: '12px', padding: '10px 14px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', color: '#92400e', fontSize: '0.84rem', lineHeight: '1.4' }}>
                      ℹ️ <strong>Aviso:</strong> La prueba está seleccionada para el mismo día del evento. Recuerda que normalmente las pruebas se programan en días de semana previos (lunes a viernes).
                    </div>
                  )}
                </div>
              )}
            </div>

            <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '8px 0 0', lineHeight: '1.4' }}>
              ℹ️ Al agendar, se creará el evento en Google Calendar (con su ID) y el estado pasará a <strong>Agendada</strong>. Un día antes podrás contactar a la clienta y marcarla como <strong>Confirmada</strong>.
            </p>
          </div>

          <div
            className="modal-actions"
            style={{
              flexShrink: 0,
              padding: '14px 28px',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
              background: '#ffffff'
            }}
          >
            <button
              type="button"
              className="modal-btn modal-btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="modal-btn"
              style={{
                background: isPruebaPosterior ? '#94a3b8' : '#2563eb',
                color: '#fff',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '6px',
                fontWeight: 600,
                cursor: isPruebaPosterior ? 'not-allowed' : 'pointer'
              }}
              disabled={loading || isPruebaPosterior}
              title={isPruebaPosterior ? 'Corrige la fecha de la prueba antes de continuar' : ''}
            >
              {loading ? '⏳ Agendando en Calendar...' : (isPruebaPosterior ? '⚠️ Corrige la fecha de prueba' : '📅 Guardar y Agendar en Calendar')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
