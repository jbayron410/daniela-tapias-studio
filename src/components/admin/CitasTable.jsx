import { getEstado, formatFecha } from './helpers';

export default function CitasTable({ citas, onConfirm, onCancel, onEdit }) {
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
              return (
                <tr key={cita.ID || i} className={`cita-row cita-row-${String(cita['Estado Confirmación'])}`}>
                  <td className="cita-fecha">
                    <strong>{formatFecha(cita['Fecha Cita'])}</strong>
                    <span className="cita-hora">{cita['Hora Cita']}</span>
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
                  </td>
                  <td>
                    {cita.WhatsApp ? (
                      <a
                        className="cita-wa-link"
                        href={`https://wa.me/${cita.WhatsApp}`}
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
                    {String(cita['Estado Confirmación']) !== '2' && (
                      <>
                        <button
                          className="action-btn action-edit"
                          onClick={() => onEdit(cita)}
                          title="Editar cita"
                        >
                          ✏️ Editar
                        </button>
                        {String(cita['Estado Confirmación']) !== '1' && (
                          <button
                            className="action-btn action-confirm"
                            onClick={() => onConfirm(cita)}
                            title="Confirmar cita"
                          >
                            ✓ Confirmar
                          </button>
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
          return (
            <div key={cita.ID || i} className={`cita-card cita-card-${String(cita['Estado Confirmación'])}`}>
              <div className="cita-card-header">
                <div className="cita-card-fecha">
                  <strong>{formatFecha(cita['Fecha Cita'])}</strong>
                  <span>{cita['Hora Cita']}</span>
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
                    href={`https://wa.me/${cita.WhatsApp}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    💬 WhatsApp
                  </a>
                )}
                <div className="cita-card-actions">
                  {String(cita['Estado Confirmación']) !== '2' && (
                    <>
                      <button
                        className="action-btn action-edit"
                        onClick={() => onEdit(cita)}
                      >
                        ✏️ Editar
                      </button>
                      {String(cita['Estado Confirmación']) !== '1' && (
                        <button
                          className="action-btn action-confirm"
                          onClick={() => onConfirm(cita)}
                        >
                          ✓ Confirmar
                        </button>
                      )}
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
