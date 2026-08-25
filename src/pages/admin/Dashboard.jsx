import { useState, useEffect, useCallback, useMemo } from 'react';
import { fetchCitas, confirmCita, cancelCita } from '../../api/sheets';
import DashboardHeader from '../../components/admin/DashboardHeader';
import StatsCards from '../../components/admin/StatsCards';
import FilterBar from '../../components/admin/FilterBar';
import CitasTable from '../../components/admin/CitasTable';
import CalendarView from '../../components/admin/CalendarView';
import ConfirmModal from '../../components/admin/ConfirmModal';
import CitaDetailModal from '../../components/admin/CitaDetailModal';
import AdminBookingModal from '../../components/admin/AdminBookingModal';
import BlockDayModal from '../../components/admin/BlockDayModal';
import { getMesLabel, sortCitas, citaEnRangoTemporal } from '../../components/admin/helpers';
import '../../styles/admin.css';

export default function Dashboard() {
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [filtroMes, setFiltroMes] = useState('todos');
  const [filtroTemporal, setFiltroTemporal] = useState('todas');
  const [busqueda, setBusqueda] = useState('');
  const [orden, setOrden] = useState('asc');
  const [vista, setVista] = useState('lista');
  const [citaToCancel, setCitaToCancel] = useState(null);
  const [citaDetail, setCitaDetail] = useState(null);
  const [showBooking, setShowBooking] = useState(false);
  const [showBlockDay, setShowBlockDay] = useState(false);
  const [editingCita, setEditingCita] = useState(null);

  const loadCitas = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCitas();
      setCitas(data);
    } catch (err) {
      setError(err.message || 'Error al cargar las citas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCitas();
  }, [loadCitas]);

  const handleConfirm = useCallback((cita) => {
    setCitas((prev) =>
      prev.map((c) =>
        c.rowIndex === cita.rowIndex ? { ...c, 'Estado Confirmación': '1' } : c
      )
    );
    confirmCita(cita).catch(() => {
      setCitas((prev) =>
        prev.map((c) =>
          c.rowIndex === cita.rowIndex ? { ...c, 'Estado Confirmación': cita['Estado Confirmación'] } : c
        )
      );
    });
  }, []);

  const handleCancelConfirm = useCallback(() => {
    if (!citaToCancel) return;
    const prevEstado = citaToCancel['Estado Confirmación'];
    setCitas((prev) =>
      prev.map((c) =>
        c.rowIndex === citaToCancel.rowIndex ? { ...c, 'Estado Confirmación': '2' } : c
      )
    );
    setCitaToCancel(null);
    cancelCita(citaToCancel).catch(() => {
      setCitas((prev) =>
        prev.map((c) =>
          c.rowIndex === citaToCancel.rowIndex ? { ...c, 'Estado Confirmación': prevEstado } : c
        )
      );
    });
  }, [citaToCancel]);

  const handleEdit = useCallback((cita) => {
    setEditingCita(cita);
    setShowBooking(true);
  }, []);

  const citasFiltradas = useMemo(() => {
    const filtered = citas.filter((cita) => {
      if (filtroEstado !== 'todos' && String(cita['Estado Confirmación']) !== filtroEstado) {
        return false;
      }
      if (filtroMes !== 'todos' && getMesLabel(cita['Fecha Cita']) !== filtroMes) {
        return false;
      }
      if (!citaEnRangoTemporal(cita, filtroTemporal)) {
        return false;
      }
      if (busqueda.trim()) {
        const q = busqueda.toLowerCase();
        const matchClienta = (cita.Clienta || '').toLowerCase().includes(q);
        const matchServicio = (cita.Servicio || '').toLowerCase().includes(q);
        if (!matchClienta && !matchServicio) return false;
      }
      return true;
    });
    return sortCitas(filtered, orden);
  }, [citas, filtroEstado, filtroMes, filtroTemporal, busqueda, orden]);

  const closeBooking = () => {
    setShowBooking(false);
    setEditingCita(null);
  };

  return (
    <div className="admin-dashboard">
      <DashboardHeader onRefresh={loadCitas} loading={loading} />

      <main className="admin-main">
        {error && (
          <div className="admin-error-banner">
            <span>⚠️ {error}</span>
            <button onClick={loadCitas}>Reintentar</button>
          </div>
        )}

        <StatsCards citas={citas} />

        <div className="admin-actions-bar">
          <button className="admin-action-btn admin-action-primary" onClick={() => { setEditingCita(null); setShowBooking(true); }}>
            ➕ Nueva Cita
          </button>
          <button className="admin-action-btn admin-action-warning" onClick={() => setShowBlockDay(true)}>
            🔒 Bloquear Agenda
          </button>
        </div>

        <div className="admin-citas-section">
          <div className="citas-section-header">
            <h2>Citas</h2>
            <div className="citas-section-right">
              <span className="citas-count">{citasFiltradas.length} resultado{citasFiltradas.length !== 1 ? 's' : ''}</span>
              <div className="view-toggle">
                <button
                  className={`view-toggle-btn ${vista === 'lista' ? 'active' : ''}`}
                  onClick={() => setVista('lista')}
                >
                  ☰ Lista
                </button>
                <button
                  className={`view-toggle-btn ${vista === 'calendario' ? 'active' : ''}`}
                  onClick={() => setVista('calendario')}
                >
                  📅 Calendario
                </button>
              </div>
            </div>
          </div>

          <FilterBar
            citas={citas}
            filtroEstado={filtroEstado}
            setFiltroEstado={setFiltroEstado}
            filtroMes={filtroMes}
            setFiltroMes={setFiltroMes}
            filtroTemporal={filtroTemporal}
            setFiltroTemporal={setFiltroTemporal}
            busqueda={busqueda}
            setBusqueda={setBusqueda}
            orden={orden}
            setOrden={setOrden}
          />

          {loading ? (
            <div className="admin-loading">
              <div className="spinner" />
              <p>Cargando citas desde Google Sheets...</p>
            </div>
          ) : vista === 'lista' ? (
            <CitasTable
              citas={citasFiltradas}
              onConfirm={handleConfirm}
              onCancel={(cita) => setCitaToCancel(cita)}
              onEdit={handleEdit}
            />
          ) : (
            <CalendarView
              citas={citasFiltradas}
              onEventClick={(cita) => setCitaDetail(cita)}
            />
          )}
        </div>
      </main>

      {citaToCancel && (
        <ConfirmModal
          cita={citaToCancel}
          onConfirm={handleCancelConfirm}
          onCancel={() => setCitaToCancel(null)}
        />
      )}

      {citaDetail && (
        <CitaDetailModal
          cita={citaDetail}
          onClose={() => setCitaDetail(null)}
          onConfirm={handleConfirm}
          onCancel={(cita) => {
            setCitaDetail(null);
            setCitaToCancel(cita);
          }}
          onEdit={(cita) => {
            setCitaDetail(null);
            handleEdit(cita);
          }}
        />
      )}

      {showBooking && (
        <AdminBookingModal
          onClose={closeBooking}
          onSuccess={loadCitas}
          initialData={editingCita}
          isEdit={!!editingCita}
        />
      )}

      {showBlockDay && (
        <BlockDayModal
          onClose={() => setShowBlockDay(false)}
          onSuccess={loadCitas}
        />
      )}
    </div>
  );
}
