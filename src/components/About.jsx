import { mapToCloudinary } from "../api/cloudinary";

const ABOUT_MEDIA = mapToCloudinary([
	"/image/upload/w_530,h_706,c_fill,f_auto,q_auto/2026-01-23_09-46-46_[DT22iqikXKU]_01.jpg",
	"/image/upload/w_530,h_706,c_fill,f_auto,q_auto/2026-01-23_09-46-46_[DT22iqikXKU]_06.jpg",
	"/video/upload/2025-05-27_09-56-02_[DKKUBwNg3j6].mp4",
	"/image/upload/w_530,h_706,c_fill,f_auto,q_auto/2026-07-17_09-49-16_[Da5d8OVPW7V].jpg",
	"/image/upload/w_530,h_706,c_fill,f_auto,q_auto/2026-07-27_18-45-57_[DbULTvupXzH].jpg",
]);

const FEATURES = [
	{ icon: "💅", text: "Técnicas profesionales" },
	{ icon: "🕐", text: "Puntualidad garantizada" },
	{ icon: "✨", text: "Productos de calidad" },
	{ icon: "🤍", text: "Atención personalizada" },
];

export default function About() {
	return (
		<section id="sobre-mi" className="section section-alt">
			<div className="container">
				<div className="about-grid">
					<div className="about-media">
						{ABOUT_MEDIA.slice(0, 5).map((src, index) => (
							<div className="media-item" key={src}>
								{src.endsWith(".mp4") ? (
									<video src={src} muted loop playsInline autoPlay />
								) : (
									<img
										src={src}
										alt={`Estudio Daniela Tapias ${index + 1}`}
										loading="lazy"
									/>
								)}
							</div>
						))}
					</div>

					<div className="about-content">
						<span className="section-tag">Sobre mí</span>
						<h2>Detrás de cada peinado hay una artista</h2>
						<p>
							Soy <strong>Daniela Tapias</strong>, peinadora profesional
							apasionada por realzar la belleza natural de cada mujer. Desde
							peinados elegantes para eventos sociales hasta creaciones
							espectaculares para novias y quinceañeras, cada trabajo lo realizo
							con dedicación y amor por el detalle.
						</p>
						<p>
							Mi compromiso es que llegues a tu evento sintiéndote segura,
							hermosa y completamente tú misma. Por eso mi estudio está diseñado
							para brindarte una experiencia única, en un ambiente cálido donde
							tu opinión siempre es lo más importante.
						</p>
						<div className="about-features">
							{FEATURES.map((feature) => (
								<div className="about-feature" key={feature.text}>
									<span className="icon">{feature.icon}</span>
									<span>{feature.text}</span>
								</div>
							))}
						</div>
						<a href="#agendar" className="btn btn-primary">
							Agenda tu cita conmigo
						</a>
					</div>
				</div>
			</div>
		</section>
	);
}
