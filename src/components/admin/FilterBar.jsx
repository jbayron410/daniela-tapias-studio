import { getUniqueMonths } from './helpers';

export default function FilterBar({
  citas,
  filtroEstado,
  setFiltroEstado,
  filtroMes,
  setFiltroMes,
  filtroTemporal,
  setFiltroTemporal,
  busqueda,
  setBusqueda,
  orden,
  setOrden
}) {
  const months = getUniqueMonths(citas);

  return (
    <div className="filter-bar">
      <div className="filter-group">
        <label>Fecha</label>
        <select value={filtroTemporal} onChange={(e) => setFiltroTemporal(e.target.value)}>
          <option value="todas">Todas las fechas</option>
          <option value="hoy">Hoy</option>
          <option value="semana">Esta semana</option>
          <option value="mes">Este mes</option>
        </select>
      </div>
      <div className="filter-group">
        <label>Estado</label>
        <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
          <option value="todos">Todos</option>
          <option value="0">Sin Confirmar</option>
          <option value="1">Confirmadas</option>
          <option value="2">Canceladas</option>
        </select>
      </div>
      <div className="filter-group">
        <label>Mes</label>
        <select value={filtroMes} onChange={(e) => setFiltroMes(e.target.value)}>
          <option value="todos">Todos los meses</option>
          {months.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>
      <div className="filter-group filter-search">
        <label>Buscar</label>
        <input
          type="text"
          placeholder="Clienta o servicio..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>
      <div className="filter-group">
        <label>Orden</label>
        <button
          className="sort-toggle-btn"
          onClick={() => setOrden((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
          title={orden === 'asc' ? 'Más cercana primero' : 'Más lejana primero'}
        >
          {orden === 'asc' ? '↑ Asc' : '↓ Desc'}
        </button>
      </div>
    </div>
  );
}
