import BookingForm from '../components/BookingForm';
import { toCloudinaryUrl } from '../api/cloudinary';
import SEO from '../components/SEO';

export default function Agendar() {
  return (
    <div className="standalone-booking">
      <SEO
        title="Agendar Cita"
        description="Agenda tu cita de peinados profesionales en Cartago, Valle del Cauca. Novias, quinceañeras y eventos sociales. Reserva en línea."
        path="/agendar"
      />
      <header className="standalone-header">
        <a href="/" className="standalone-logo">
          <img
            src={toCloudinaryUrl("/logo-sin-letras.png")}
            alt="Daniela Tapias Studio"
            className="standalone-logo-img"
          />
          <span>Daniela Tapias Studio</span>
        </a>
      </header>
      <BookingForm preselectService={null} onResetPreselect={() => {}} />
    </div>
  );
}
