import BookingForm from '../components/BookingForm';
import { toCloudinaryUrl } from '../api/cloudinary';

export default function Agendar() {
  return (
    <div className="standalone-booking">
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
