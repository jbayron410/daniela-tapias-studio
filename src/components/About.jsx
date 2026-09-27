import { toCloudinaryUrl } from "../api/cloudinary";

const STUDIO_IMG = toCloudinaryUrl(
	"/image/upload/w_1000,h_620,c_fill,g_center,f_auto,q_auto/daniela-tapias-studio.jpg",
);

const FEATURES = [
	{
		icon: (
			<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
				<path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
			</svg>
		),
		title: "Técnicas Profesionales",
		desc: "Peinados modernos con fijación duradera y acabados de alta definición.",
	},
	{
		icon: (
			<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
				<circle cx="12" cy="12" r="10" />
				<polyline points="12 6 12 12 16 14" />
			</svg>
		),
		title: "Puntualidad Garantizada",
		desc: "Tu tiempo y tu ocasión especial son prioridad absoluta; sin retrasos.",
	},
	{
		icon: (
			<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
				<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
			</svg>
		),
		title: "Productos de Calidad",
		desc: "Marcas profesionales de alta gama que protegen y cuidan tu cabello.",
	},
	{
		icon: (
			<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
				<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
			</svg>
		),
		title: "Atención Personalizada",
		desc: "Asesoría exclusiva 1 a 1 adaptada a tu vestido, estilo y tipo de rostro.",
	},
];

export default function About({ onBook }) {
	return (
		<section id="sobre-mi" className="section section-alt about-section">
			<div className="container">
				<div className="about-grid">
					{/* Columna Izquierda: Showcase del Estudio */}
					<div className="about-showcase">
						<div className="about-image-wrapper">
							<img
								src={STUDIO_IMG}
								srcSet={`
									${toCloudinaryUrl("/image/upload/w_540,h_340,c_fill,g_center,f_auto,q_auto/daniela-tapias-studio.jpg")} 540w,
									${toCloudinaryUrl("/image/upload/w_800,h_500,c_fill,g_center,f_auto,q_auto/daniela-tapias-studio.jpg")} 800w,
									${toCloudinaryUrl("/image/upload/w_1100,h_680,c_fill,g_center,f_auto,q_auto/daniela-tapias-studio.jpg")} 1100w
								`}
								sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 560px"
								alt="Daniela Tapias Studio - Cartago, Valle del Cauca"
								loading="lazy"
								className="about-studio-img"
							/>
							<div className="about-image-badge top-left">
								<span className="badge-dot" />
								<span>Estudio Privado</span>
							</div>
							<div className="about-image-badge bottom-right">
								<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
									<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
									<circle cx="12" cy="10" r="3" />
								</svg>
								<span>Cartago, Valle</span>
							</div>
						</div>

						{/* Tarjeta flotante de experiencia */}
						<div className="about-studio-floating-card">
							<div className="studio-card-icon">🪞</div>
							<div className="studio-card-text">
								<strong>Un espacio exclusivo pensado para ti</strong>
								<span>Privacidad, comodidad y luz profesional para vivir tu momento sin prisas.</span>
							</div>
						</div>

						{/* Chips de comodidades del estudio */}
						<div className="about-studio-perks">
							<span className="studio-perk">
								<span className="perk-bullet">✓</span> Espejo profesional iluminado
							</span>
							<span className="studio-perk">
								<span className="perk-bullet">✓</span> Zona lounge para acompañante
							</span>
							<span className="studio-perk">
								<span className="perk-bullet">✓</span> Citas 100% personalizadas
							</span>
						</div>
					</div>

					{/* Columna Derecha: Información de Daniela */}
					<div className="about-content">
						<span className="section-tag">Sobre mí & El Estudio</span>
						<h2>Detrás de cada peinado hay una artista</h2>
						<p className="about-lead">
							Soy <strong>Daniela Tapias</strong>, peinadora profesional apasionada por realzar la belleza natural y la confianza de cada mujer en sus momentos más memorables.
						</p>
						<p>
							Desde creaciones deslumbrantes para novias y quinceañeras hasta looks modernos para eventos sociales, cada peinado lo realizo con técnica impecable, dedicación y amor por el detalle. Mi estudio en Cartago fue diseñado para brindarte una experiencia cálida, exclusiva y relajada, donde tu opinión y tu tranquilidad siempre son lo más importante.
						</p>

						<div className="about-features">
							{FEATURES.map((feature) => (
								<div className="about-feature" key={feature.title}>
									<div className="about-feature-icon">{feature.icon}</div>
									<div className="about-feature-body">
										<h4>{feature.title}</h4>
										<p>{feature.desc}</p>
									</div>
								</div>
							))}
						</div>

						<div className="about-action">
							<a href="#agendar" className="btn btn-primary btn-about" onClick={onBook}>
								<span>Agenda tu cita conmigo</span>
								<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
									<line x1="5" y1="12" x2="19" y2="12" />
									<polyline points="12 5 19 12 12 19" />
								</svg>
							</a>
							<span className="about-action-note">📍 Atención en estudio privado en Cartago</span>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}

