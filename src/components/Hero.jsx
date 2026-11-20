import { toCloudinaryUrl } from "../api/cloudinary";
import { useSeasonalTheme } from "../context/SeasonalThemeContext";
import { trackCtaClick, trackBookingStart, trackWhatsAppClick } from "../utils/gtm";

const HERO_CLASSIC_SRC = toCloudinaryUrl(
	"/w_772,h_1160,c_fill,f_auto,q_auto/blazer-negro-todo-medio.png",
);
const HERO_CLASSIC_SRCSET = `${toCloudinaryUrl("/w_380,h_570,c_fill,f_auto,q_auto/blazer-negro-todo-medio.png")} 380w, ${toCloudinaryUrl("/w_540,h_810,c_fill,f_auto,q_auto/blazer-negro-todo-medio.png")} 540w, ${toCloudinaryUrl("/w_772,h_1160,c_fill,f_auto,q_auto/blazer-negro-todo-medio.png")} 772w`;

const HERO_FESTIVE_SRC = toCloudinaryUrl(
	"/w_772,h_1160,c_fill,g_north,f_auto,q_auto/daniela-portrait-navidad.png",
);
const HERO_FESTIVE_SRCSET = `${toCloudinaryUrl("/w_380,h_570,c_fill,g_north,f_auto,q_auto/daniela-portrait-navidad.png")} 380w, ${toCloudinaryUrl("/w_540,h_810,c_fill,g_north,f_auto,q_auto/daniela-portrait-navidad.png")} 540w, ${toCloudinaryUrl("/w_772,h_1160,c_fill,g_north,f_auto,q_auto/daniela-portrait-navidad.png")} 772w`;

export default function Hero({ onBook, onExploreGallery }) {
	const { isFestive } = useSeasonalTheme();

	const handleBookClick = () => {
		trackCtaClick('Agenda tu cita', 'hero', '#agendar');
		trackBookingStart('hero');
		if (onBook) onBook();
	};

	const handlePortfolioClick = (e) => {
		trackCtaClick('Ver portafolio', 'hero', '#galeria');
		if (onExploreGallery) onExploreGallery(e);
	};

	const heroImageSrc = isFestive ? HERO_FESTIVE_SRC : HERO_CLASSIC_SRC;
	const heroImageSrcSet = isFestive ? HERO_FESTIVE_SRCSET : HERO_CLASSIC_SRCSET;

	return (
		<section id="inicio" className={`hero ${isFestive ? "hero-festive" : ""}`}>
			<div className="container">
				<div className="hero-inner">
					<div className="hero-content">
						<span className={`hero-badge ${isFestive ? "hero-badge-festive" : ""}`}>
							{isFestive ? "✦ Especial Navidad y Año Nuevo ✦" : "Peinados Profesionales"}
						</span>
						<h1>
							Realza tu belleza con{" "}
							<span className="highlight">peinados extraordinarios</span>
						</h1>
						<p className="hero-subtitle">
							Especialista en novias, quinceañeras y eventos sociales
						</p>
						<p className="hero-text">
							Cada peinado es único, creado con amor y técnica profesional para
							que luzcas espectacular en tu ocasión especial.
						</p>

						{isFestive && (
							<div className="hero-festive-notice">
								<span className="hero-festive-notice-icon" aria-hidden="true">🎄</span>
								<div className="hero-festive-notice-body">
									<strong>Agenda abierta · 24 y 31 de diciembre</strong>
									<span>
										Cupos limitados solo por{" "}
										<a
											href="https://wa.me/573216646983?text=Hola%20Daniela%2C%20quiero%20consultar%20disponibilidad%20para%20el%2024%20o%2031%20de%20diciembre"
											target="_blank"
											rel="noopener noreferrer"
											onClick={() => trackWhatsAppClick('hero_festive_notice', 'Agenda 24 y 31 diciembre')}
										>
											WhatsApp
										</a>
										{" "}· Se separa con el 50% · Horario fijo
									</span>
								</div>
							</div>
						)}

						<div className="hero-buttons">
							<button className="btn btn-primary btn-lg" onClick={handleBookClick}>
								Agenda tu cita
							</button>
							<a href="#galeria" className="btn btn-outline btn-lg" onClick={handlePortfolioClick}>
								Ver portafolio
							</a>
						</div>
						<div className="hero-social-proof">
							<div className="stat">
								<h3>100%</h3>
								<p>Clientas satisfechas</p>
							</div>
							<div className="stat">
								<h3>4+</h3>
								<p>Años de experiencia</p>
							</div>
							<div className="stat">
								<h3>3</h3>
								<p>Tipos de servicios</p>
							</div>
						</div>
					</div>

					<div className="hero-media">
						<div className={`hero-media-frame ${isFestive ? "hero-media-frame-festive" : ""}`}>
							<img
								className="hero-media-img"
								src={heroImageSrc}
								srcSet={heroImageSrcSet}
								sizes="(max-width: 767px) 380px, (max-width: 1024px) 540px, 772px"
								alt="Daniela Tapias - Peinadora Profesional"
								fetchpriority="high"
							/>
						</div>
						<div className={`hero-media-card ${isFestive ? "hero-media-card-festive" : ""}`}>
							<div>
								<h4>DANIELA TAPIAS</h4>
								<p>{isFestive ? "Peinadora Profesional · ✨ Temporada Navideña" : "Peinadora Profesional"}</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
