import { SERVICES } from '../data/services';

function formatPrice(price) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  }).format(price);
}

export default function Services({ onSelect }) {
  return (
    <section id="servicios" className="section">
      <div className="container">
        <div className="section-header">
          <span className="section-tag">Servicios</span>
          <h2>Precios y servicios</h2>
          <p>
            Elige el servicio perfecto para tu ocasión y agenda
            directamente en línea.
          </p>
        </div>

        <div className="services-grid">
          {SERVICES.map((service) => (
            <div
              key={service.id}
              className={`service-card ${service.id === 'novias' ? 'featured' : ''}`}
            >
              {service.id === 'novias' && (
                <span className="card-badge">⭐ Más solicitado</span>
              )}
              <span className="service-icon">{service.icon}</span>
              <h3>{service.name}</h3>
              <p>{service.description}</p>
              <div className="service-price">
                <small>Desde</small>
                {formatPrice(service.price)}
              </div>
              <div className="service-duration">
                ⏱️ Duración aprox. {service.duration} min
              </div>
              <ul className="service-includes">
                {service.includes.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <button
                className={`btn ${service.id === 'novias' ? 'btn-gold' : 'btn-primary'}`}
                onClick={() => onSelect(service)}
              >
                {service.name}
              </button>
            </div>
          ))}
        </div>

        <p className="service-note">
          💡 <strong>¿Servicio a domicilio?</strong> Actívalo en el formulario de
          reserva — el valor del desplazamiento depende de tu ubicación y se
          confirma antes de agendar.
        </p>
      </div>
    </section>
  );
}