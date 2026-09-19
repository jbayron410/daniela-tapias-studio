import { useState, useCallback } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Gallery from './components/Gallery';
import Services from './components/Services';
import About from './components/About';
import BookingForm from './components/BookingForm';
import Footer from './components/Footer';
import SEO from './components/SEO';

export default function App() {
  const [preselectService, setPreselectService] = useState(null);

  const handleSelectService = useCallback((service) => {
    setPreselectService(service);
    document.getElementById('agendar')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }, []);

  const handleBook = useCallback(() => {
    document.getElementById('agendar')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }, []);

  return (
    <>
      <SEO
        title="Inicio"
        description="Peinadora profesional en Cartago, Valle del Cauca. Especialista en peinados para novias, quinceañeras y eventos sociales. Agenda tu cita en línea."
        path="/"
      />
      <Navbar onBook={handleBook} />
      <main>
        <Hero onBook={handleBook} />
        <Gallery />
        <Services onSelect={handleSelectService} />
        <About />
        <BookingForm
          preselectService={preselectService}
          onResetPreselect={() => setPreselectService(null)}
        />
      </main>
      <Footer />
    </>
  );
}