import { useState, useCallback, useEffect, Suspense, lazy } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Services from './components/Services';
import About from './components/About';
import Footer from './components/Footer';
import SEO from './components/SEO';
import { useNearScreen } from './hooks/useNearScreen';

const Gallery = lazy(() => import('./components/Gallery'));
const BookingForm = lazy(() => import('./components/BookingForm'));

function GalleryFallback() {
  return (
    <section id="galeria" className="section section-alt" style={{ minHeight: '400px' }}>
      <div className="container">
        <div className="section-header">
          <span className="section-tag">Portafolio</span>
          <h2>Nuestros trabajos</h2>
          <p>
            Peinados reales realizados en nuestro estudio. Explora las
            diferentes categorías de servicios.
          </p>
        </div>
        <div className="gallery-loading">
          <div className="spinner" />
        </div>
      </div>
    </section>
  );
}

function BookingFallback() {
  return (
    <section id="agendar" className="section booking-section" style={{ minHeight: '450px' }}>
      <div className="container">
        <div className="section-header">
          <span className="section-tag">Agenda tu cita</span>
          <h2>Reserva en línea</h2>
          <p>
            Selecciona tu servicio, la fecha y hora. Tu solicitud será una
            <strong> pre-agenda</strong>: Daniela te escribirá por WhatsApp para confirmar tu cita.
          </p>
        </div>
        <div className="gallery-loading">
          <div className="spinner" />
        </div>
      </div>
    </section>
  );
}

export default function App() {
  const [preselectService, setPreselectService] = useState(null);
  const [isNearGallery, galleryRef, triggerGallery] = useNearScreen({ rootMargin: '350px' });
  const [isNearBooking, bookingRef, triggerBooking] = useNearScreen({ rootMargin: '450px' });

  // Si el usuario entra directamente con un ancla (#galeria o #agendar)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      if (hash === '#galeria') triggerGallery();
      if (hash === '#agendar') triggerBooking();
    }
  }, [triggerGallery, triggerBooking]);

  const handleSelectService = useCallback((service) => {
    triggerBooking();
    setPreselectService(service);
    setTimeout(() => {
      document.getElementById('agendar')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }, 100);
  }, [triggerBooking]);

  const handleBook = useCallback(() => {
    triggerBooking();
    setTimeout(() => {
      document.getElementById('agendar')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }, 100);
  }, [triggerBooking]);

  return (
    <>
      <SEO
        title="Inicio"
        description="Peinadora profesional en Cartago, Valle del Cauca. Especialista en peinados para novias, quinceañeras y eventos sociales. Agenda tu cita en línea."
        path="/"
      />
      <Navbar onBook={handleBook} />
      <main>
        <Hero onBook={handleBook} onExploreGallery={triggerGallery} />

        <div ref={galleryRef}>
          {isNearGallery ? (
            <Suspense fallback={<GalleryFallback />}>
              <Gallery />
            </Suspense>
          ) : (
            <GalleryFallback />
          )}
        </div>

        <Services onSelect={handleSelectService} />
        <About onBook={handleBook} />

        <div ref={bookingRef}>
          {isNearBooking ? (
            <Suspense fallback={<BookingFallback />}>
              <BookingForm
                preselectService={preselectService}
                onResetPreselect={() => setPreselectService(null)}
              />
            </Suspense>
          ) : (
            <BookingFallback />
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}