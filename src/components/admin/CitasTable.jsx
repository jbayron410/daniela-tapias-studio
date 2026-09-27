import { getEstado, formatFecha } from './helpers';

function getCleanPhone(phone) {
  return String(phone || '').replace(/[^0-9]/g, '');
}

export default function CitasTable({
  citas,
  onAssignTime,
  onMarkConfirmed,
  onConfirm,
  onCancel,
  onEdit
}) {
  const handleAssign = onAssignTime || onConfirm;
  const handleConfirmAction = onMarkConfirmed || onConfirm;

  if (citas.length === 0) {
    return (
      <div className="citas-empty">
        <span className="citas-empty-icon">📭</span>
        <p>No se encontraron citas con los filtros seleccionados</p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop table */}
      <div className="citas-table-wrapper">
        <table className="citas-table">
          <thead>
            <tr>
              <th>Fecha / Hora</th>
              <th>Clienta</th>
              <th>Servicio</th>
              <th>WhatsApp</th>
              <th>Domicilio</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {citas.map((cita, i) => {
              const estado = getEstado(cita['Estado Confirmación']);
              const estadoNum = String(cita['Estado Confirmación']);
              const cleanPhone = getCleanPhone(cita.WhatsApp);

              return (
                <tr key={cita.ID || i} className={`cita-row cita-row-${estadoNum}`}>
                  <td className="cita-fecha">
                    <strong>{formatFecha(cita['Fecha Cita'])}</strong>
                    <span className="cita-hora" style={!cita['Hora Cita'] || cita['Hora Cita'].toLowerCase().includes('coordinar') ? { color: '#b45309', background: '#fef3c7', padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 } : {}}>
                      {cita['Hora Cita'] && !cita['Hora Cita'].toLowerCase().includes('coordinar')
                        ? cita['Hora Cita']
                        : '⏳ Por coordinar'}
                    </span>
                  </td>
                  <td className="cita-clienta">
                    <strong>{cita.Clienta}</strong>
                    {cita.Email && <span className="cita-email">{cita.Email}</span>}
                  </td>
                  <td>
                    <span className="cita-servicio">{cita.Servicio}</span>
                    {cita['Requiere Maquillaje'] === 'Sí' && (
                      <span className="cita-tag">+ Maquillaje</span>
                    )}
                    {cita['Requiere Prueba'] === 'Sí' && (
                      <span className="cita-tag" style={{ background: '#fdf2f8', color: '#9d174d', borderColor: '#fbcfe8' }}>
                        👰 Prueba
                      </span>
                    )}
                  </td>
                  <td>
                    {cita.WhatsApp ? (
                      <a
                        className="cita-wa-link"
                        href={`https://wa.me/${cleanPhone}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        💬 {cita.WhatsApp}
                      </a>
                    ) : (
                      <span className="cita-no-data">—</span>
                    )}
                  </td>
                  <td>
                    {cita['A domicilio'] === 'Sí' ? (
                      <span className="cita-domicilio">
                        🏠 {cita['Detalles domicilio'] || 'Sí'}
                      </span>
                    ) : (
                      <span className="cita-no-data">Studio</span>
                    )}
                  </td>
                  <td>
                    <span
                      className="estado-badge"
                      style={{ background: estado.bg, color: estado.color }}
                    >
                      {estado.label}
                    </span>
                  </td>
                  <td className="cita-actions">
                    {estadoNum === '0' && (
                      <>
                        <button
                          className="action-btn action-assign"
                          onClick={() => handleAssign(cita)}
                          title="Asignar hora y agendar en Google Calendar"
                        >
                          📅 Asignar Hora
                        </button>
                        {cleanPhone && (
                          <a
                            className="action-btn action-wa"
                            href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(`Hola ${cita.Clienta}! ✨ Te escribo de Daniela Tapias Studio para coordinar la hora de tu cita del ${formatFecha(cita['Fecha Cita'])} (${cita.Servicio}). ¿A qué hora te gustaría iniciar?`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Coordinar hora por WhatsApp"
                          >
                            💬 Coordinar
                          </a>
                        )}
                        <button
                          className="action-btn action-cancel"
                          onClick={() => onCancel(cita)}
                          title="Cancelar cita"
                        >
                          ✕ Cancelar
                        </button>
                      </>
                    )}

                    {estadoNum === '3' && (
                      <>
                        {cleanPhone && (
                          <a
                            className="action-btn action-wa"
                            href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(`Hola ${cita.Clienta}! ✨ Te escribo de Daniela Tapias Studio para confirmar tu cita de mañana ${formatFecha(cita['Fecha Cita'])} a las ${cita['Hora Cita']} para el servicio de ${cita.Servicio}. ¿Me confirmas tu asistencia? ¡Gracias!`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Preguntar confirmación a clienta por WhatsApp"
                          >
                            💬 Reconfirmar
                          </a>
                        )}
                        <button
                          className="action-btn action-confirm"
                          onClick={() => handleConfirmAction(cita)}
                          title="Marcar como Confirmada por la clienta"
                        >
                          ✓ Confirmar
                        </button>
                        <button
                          className="action-btn action-edit"
                          onClick={() => onEdit(cita)}
                          title="Editar cita"
                        >
                          ✏️ Editar
                        </button>
                        <button
                          className="action-btn action-cancel"
                          onClick={() => onCancel(cita)}
                          title="Cancelar cita y borrar de Calendar"
                        >
                          ✕ Cancelar
                        </button>
                      </>
                    )}

                    {estadoNum === '1' && (
                      <>
                        <button
                          className="action-btn action-edit"
                          onClick={() => onEdit(cita)}
                          title="Editar cita"
                        >
                          ✏️ Editar
                        </button>
                        <button
                          className="action-btn action-cancel"
                          onClick={() => onCancel(cita)}
                          title="Cancelar cita y borrar de Calendar"
                        >
                          ✕ Cancelar
                        </button>
                      </>
                    )}

                    {estadoNum === '2' && (
                      <span className="cita-no-data" style={{ fontSize: '0.8rem', color: '#999' }}>Cancelada</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="citas-cards">
        {citas.map((cita, i) => {
          const estado = getEstado(cita['Estado Confirmación']);
          const estadoNum = String(cita['Estado Confirmación']);
          const cleanPhone = getCleanPhone(cita.WhatsApp);

          return (
            <div key={cita.ID || i} className={`cita-card cita-card-${estadoNum}`}>
              <div className="cita-card-header">
                <div className="cita-card-fecha">
                  <strong>{formatFecha(cita['Fecha Cita'])}</strong>
                  <span style={!cita['Hora Cita'] || cita['Hora Cita'].toLowerCase().includes('coordinar') ? { color: '#b45309', background: '#fef3c7', padding: '1px 5px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 } : {}}>
                    {cita['Hora Cita'] && !cita['Hora Cita'].toLowerCase().includes('coordinar')
                      ? cita['Hora Cita']
                      : '⏳ Por coordinar'}
                  </span>
                </div>
                <span
                  className="estado-badge"
                  style={{ background: estado.bg, color: estado.color }}
                >
                  {estado.label}
                </span>
              </div>
              <div className="cita-card-body">
                <h4>{cita.Clienta}</h4>
                <p className="cita-card-servicio">{cita.Servicio}</p>
                {cita['Requiere Maquillaje'] === 'Sí' && (
                  <span className="cita-tag">+ Maquillaje</span>
                )}
                {cita['Requiere Prueba'] === 'Sí' && (
                  <span className="cita-tag" style={{ background: '#fdf2f8', color: '#9d174d', borderColor: '#fbcfe8', marginLeft: '4px' }}>
                    👰 Prueba
                  </span>
                )}
                {cita.Email && <p className="cita-card-email">{cita.Email}</p>}
                {cita['A domicilio'] === 'Sí' && (
                  <p className="cita-card-domicilio">🏠 {cita['Detalles domicilio'] || 'A domicilio'}</p>
                )}
                {cita.Notas && <p className="cita-card-notas">📝 {cita.Notas}</p>}
              </div>
              <div className="cita-card-footer">
                {cita.WhatsApp && (
                  <a
                    className="cita-wa-link"
                    href={`https://wa.me/${cleanPhone}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    💬 WhatsApp
                  </a>
                )}
                <div className="cita-card-actions">
                  {estadoNum === '0' && (
                    <>
                      <button
                        className="action-btn action-assign"
                        onClick={() => handleAssign(cita)}
                      >
                        📅 Asignar Hora
                      </button>
                      <button
                        className="action-btn action-cancel"
                        onClick={() => onCancel(cita)}
                      >
                        ✕ Cancelar
                      </button>
                    </>
                  )}

                  {estadoNum === '3' && (
                    <>
                      <button
                        className="action-btn action-confirm"
                        onClick={() => handleConfirmAction(cita)}
                      >
                        ✓ Confirmar
                      </button>
                      <button
                        className="action-btn action-edit"
                        onClick={() => onEdit(cita)}
                      >
                        ✏️ Editar
                      </button>
                      <button
                        className="action-btn action-cancel"
                        onClick={() => onCancel(cita)}
                      >
                        ✕ Cancelar
                      </button>
                    </>
                  )}

                  {estadoNum === '1' && (
                    <>
                      <button
                        className="action-btn action-edit"
                        onClick={() => onEdit(cita)}
                      >
                        ✏️ Editar
                      </button>
                      <button
                        className="action-btn action-cancel"
                        onClick={() => onCancel(cita)}
                      >
                        ✕ Cancelar
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
