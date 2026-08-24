export default function StatsCards({ citas }) {
  const total = citas.length;
  const pendientes = citas.filter((c) => String(c['Estado Confirmación']) === '0').length;
  const confirmadas = citas.filter((c) => String(c['Estado Confirmación']) === '1').length;
  const canceladas = citas.filter((c) => String(c['Estado Confirmación']) === '2').length;

  const stats = [
    { icon: '📅', number: total, label: 'Total Citas' },
    { icon: '⏳', number: pendientes, label: 'Sin Confirmar' },
    { icon: '✅', number: confirmadas, label: 'Confirmadas' },
    { icon: '❌', number: canceladas, label: 'Canceladas' }
  ];

  return (
    <div className="admin-stats">
      {stats.map((s) => (
        <div key={s.label} className="stat-card">
          <div className="stat-icon">{s.icon}</div>
          <div className="stat-info">
            <span className="stat-number">{s.number}</span>
            <span className="stat-label">{s.label}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
