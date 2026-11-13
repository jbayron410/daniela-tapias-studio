import { useState, useEffect, useCallback, useMemo } from 'react';
import { fetchCitas, confirmCita, markCitaConfirmed, cancelCita } from '../../api/sheets';
import { getBlocks } from '../../api/n8n';
import {
  fetchSeasonalThemeConfig,
  updateSeasonalThemeMode,
  isChristmasThemeActive,
  getCachedSeasonalTheme,
} from '../../api/gallery';
import DashboardHeader from '../../components/admin/DashboardHeader';
import StatsCards from '../../components/admin/StatsCards';
import FilterBar from '../../components/admin/FilterBar';
import CitasTable from '../../components/admin/CitasTable';
import CalendarView from '../../components/admin/CalendarView';
import ConfirmModal from '../../components/admin/ConfirmModal';
import ConfirmCitaModal from '../../components/admin/ConfirmCitaModal';
import CitaDetailModal from '../../components/admin/CitaDetailModal';
import AdminBookingModal from '../../components/admin/AdminBookingModal';
import BlockDayModal from '../../components/admin/BlockDayModal';
import GalleryManager from '../../components/admin/GalleryManager';
import HeadpieceManager from '../../components/admin/HeadpieceManager';
import { getMesLabel, sortCitas, citaEnRangoTemporal } from '../../components/admin/helpers';
import '../../styles/admin.css';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('citas');
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
  const [citaToConfirm, setCitaToConfirm] = useState(null);
  const [citaDetail, setCitaDetail] = useState(null);
  const [showBooking, setShowBooking] = useState(false);
  const [showBlockDay, setShowBlockDay] = useState(false);
  const [editingCita, setEditingCita] = useState(null);
  const [bloqueos, setBloqueos] = useState([]);
  const [seasonalConfig, setSeasonalConfig] = useState(() => getCachedSeasonalTheme());
  const [savingSeasonal, setSavingSeasonal] = useState(false);

  useEffect(() => {
    let isMounted = true;
    fetchSeasonalThemeConfig().then((config) => {
      if (isMounted) setSeasonalConfig(config);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSeasonalModeChange = useCallback(async (newMode) => {
    setSavingSeasonal(true);
    try {
      const updated = await updateSeasonalThemeMode(newMode);
      setSeasonalConfig(updated);
    } catch (err) {
      alert(err.message || 'No se pudo actualizar el modo navideño');
    } finally {
      setSavingSeasonal(false);
    }
  }, []);

  const isFestiveActiveNow = isChristmasThemeActive(seasonalConfig);

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

  const loadBloqueos = useCallback(async () => {
    try {
      const data = await getBlocks();
      setBloqueos(data);
    } catch {
      // Los bloqueos no son críticos, fallar silenciosamente
    }
  }, []);

  useEffect(() => {
    loadBloqueos();
  }, [loadBloqueos]);

  // Deep-link desde WhatsApp: ?confirmar=ID o ?cita=ID
  useEffect(() => {
    if (citas.length === 0) return;
    const params = new URLSearchParams(window.location.search);
    const targetId = params.get('confirmar') || params.get('cita');
    if (!targetId) return;

    const cleanTarget = targetId.trim().toLowerCase();
    const found = citas.find((c) => {
      const idVal = String(c.ID || c.id || c.Id || c['ID Evento'] || '').trim().toLowerCase();
      if (idVal && (idVal === cleanTarget || idVal.includes(cleanTarget) || cleanTarget.includes(idVal))) {
        return true;
      }
      if (String(c.rowIndex) === cleanTarget) return true;
      if (c.WhatsApp && String(c.WhatsApp).includes(cleanTarget)) return true;
      return Object.values(c).some((val) => typeof val === 'string' && val.trim().toLowerCase() === cleanTarget);
    });

    if (found) {
      setCitaToConfirm(found);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [citas]);

  const handleConfirm = useCallback((cita) => {
    setCitaDetail(null);
    setCitaToConfirm(cita);
  }, []);

  const handleMarkConfirmed = useCallback((cita) => {
    const prevEstado = cita['Estado Confirmación'];
    setCitas((prev) =>
      prev.map((c) =>
        c.rowIndex === cita.rowIndex ? { ...c, 'Estado Confirmación': '1' } : c
      )
    );
    markCitaConfirmed(cita).catch(() => {
      setCitas((prev) =>
        prev.map((c) =>
          c.rowIndex === cita.rowIndex ? { ...c, 'Estado Confirmación': prevEstado } : c
        )
      );
    });
  }, []);

  const handleConfirmSuccess = useCallback((updatedCita) => {
    setCitas((prev) =>
      prev.map((c) => (c.rowIndex === updatedCita.rowIndex ? updatedCita : c))
    );
    loadCitas();
  }, [loadCitas]);

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
        <nav className="admin-tabs">
          <button
            className={`admin-tab ${activeTab === 'citas' ? 'active' : ''}`}
            onClick={() => setActiveTab('citas')}
          >
            Citas
          </button>
          <button
            className={`admin-tab ${activeTab === 'galeria' ? 'active' : ''}`}
            onClick={() => setActiveTab('galeria')}
          >
            Galería
          </button>
          <button
            className={`admin-tab ${activeTab === 'tocados' ? 'active' : ''}`}
            onClick={() => setActiveTab('tocados')}
          >
            Tocados
          </button>
        </nav>

        {activeTab === 'citas' && (
          <>
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

            <div className="admin-seasonal-card">
              <div className="admin-seasonal-info">
                <div className="admin-seasonal-title-row">
                  <span className="admin-seasonal-icon">🎄</span>
                  <h3>Diseño Navideño en /mis-redes</h3>
                  <span className={`admin-seasonal-status ${isFestiveActiveNow ? 'is-active' : 'is-inactive'}`}>
                    {isFestiveActiveNow ? 'Activo ahora' : 'Diseño clásico'}
                  </span>
                </div>
                <p className="admin-seasonal-desc">
                  En modo <strong>Automático</strong> se desactivará solo el <strong>31 de diciembre de 2026 a las 11:59 p.m.</strong> sin que tengas que tocar nada el 1 de enero.
                </p>
              </div>
              <div className="admin-seasonal-controls">
                <div className="admin-seasonal-toggle-group" role="group" aria-label="Modo diseño navideño">
                  <button
                    type="button"
                    disabled={savingSeasonal}
                    className={`admin-seasonal-btn ${(seasonalConfig?.mode || 'auto') === 'auto' ? 'active' : ''}`}
                    onClick={() => handleSeasonalModeChange('auto')}
                  >
                    ✨ Automático (hasta 31 dic)
                  </button>
                  <button
                    type="button"
                    disabled={savingSeasonal}
                    className={`admin-seasonal-btn ${seasonalConfig?.mode === 'enabled' ? 'active' : ''}`}
                    onClick={() => handleSeasonalModeChange('enabled')}
                  >
                    🎄 Siempre encendido
                  </button>
                  <button
                    type="button"
                    disabled={savingSeasonal}
                    className={`admin-seasonal-btn ${seasonalConfig?.mode === 'disabled' ? 'active' : ''}`}
                    onClick={() => handleSeasonalModeChange('disabled')}
                  >
                    Apagado (Clásico)
                  </button>
                </div>
                <a
                  href="/mis-redes"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="admin-seasonal-preview-link"
                >
                  Ver /mis-redes ↗
                </a>
              </div>
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
                  onAssignTime={handleConfirm}
                  onMarkConfirmed={handleMarkConfirmed}
                  onConfirm={handleConfirm}
                  onCancel={(cita) => setCitaToCancel(cita)}
                  onEdit={handleEdit}
                />
              ) : (
                <CalendarView
                  citas={citasFiltradas}
                  bloqueos={bloqueos}
                  onEventClick={(cita) => setCitaDetail(cita)}
                />
              )}
            </div>
          </>
        )}

        {activeTab === 'galeria' && <GalleryManager />}
        {activeTab === 'tocados' && <HeadpieceManager />}
      </main>

      {citaToCancel && (
        <ConfirmModal
          cita={citaToCancel}
          onConfirm={handleCancelConfirm}
          onCancel={() => setCitaToCancel(null)}
        />
      )}

      {citaToConfirm && (
        <ConfirmCitaModal
          cita={citaToConfirm}
          onClose={() => setCitaToConfirm(null)}
          onSuccess={handleConfirmSuccess}
        />
      )}

      {citaDetail && (
        <CitaDetailModal
          cita={citaDetail}
          onClose={() => setCitaDetail(null)}
          onAssignTime={handleConfirm}
          onMarkConfirmed={handleMarkConfirmed}
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
          onSuccess={() => { loadCitas(); loadBloqueos(); }}
        />
      )}
    </div>
  );
}
