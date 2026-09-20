import { toCloudinaryUrl } from "../api/cloudinary";

export default function Hero({ onBook }) {
	return (
		<section id="inicio" className="hero">
			<div className="container">
				<div className="hero-inner">
					<div className="hero-content">
						<span className="hero-badge">Peinados Profesionales</span>
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
						<div className="hero-buttons">
							<button className="btn btn-primary btn-lg" onClick={onBook}>
								Agenda tu cita
							</button>
							<a href="#galeria" className="btn btn-outline btn-lg">
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
						<div className="hero-media-frame">
							<img
								className="hero-media-img"
								src={toCloudinaryUrl(
									"/w_772,h_1160,c_fill,f_auto,q_auto/blazer-negro-todo-medio.png",
								)}
								srcSet={`${toCloudinaryUrl("/w_380,h_570,c_fill,f_auto,q_auto/blazer-negro-todo-medio.png")} 380w, ${toCloudinaryUrl("/w_540,h_810,c_fill,f_auto,q_auto/blazer-negro-todo-medio.png")} 540w, ${toCloudinaryUrl("/w_772,h_1160,c_fill,f_auto,q_auto/blazer-negro-todo-medio.png")} 772w`}
								sizes="(max-width: 767px) 380px, (max-width: 1024px) 540px, 772px"
								alt="Daniela Tapias - Peinadora Profesional"
								fetchpriority="high"
							/>
						</div>
						<div className="hero-media-card">
							<div>
								<h4>DANIELA TAPIAS</h4>
								<p>Peinadora Profesional</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
