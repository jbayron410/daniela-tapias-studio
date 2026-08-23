import { toCloudinaryUrl } from "../api/cloudinary";

export default function Footer() {
	const year = new Date().getFullYear();

	return (
		<footer className="footer">
			<div className="container">
				<div className="footer-grid">
					<div>
						<div className="footer-logo">
							<img
								src={toCloudinaryUrl("/logo-sin-fondo.png")}
								alt="Daniela Tapias Studio"
							/>
						</div>
						<p>
							Peinados profesionales para novias, quinceañeras y eventos
							sociales. Cada peinado es una obra de arte hecha con amor.
						</p>
					</div>
					<div>
						<h4>Enlaces</h4>
						<ul>
							<li>
								<a href="#inicio">Inicio</a>
							</li>
							<li>
								<a href="#galeria">Galería</a>
							</li>
							<li>
								<a href="#servicios">Servicios</a>
							</li>
							<li>
								<a href="#agendar">Agendar cita</a>
							</li>
						</ul>
					</div>
					<div>
						<h4>Contacto</h4>
						<ul>
							<li>
								<a
									href="https://wa.me/573216646983"
									target="_blank"
									rel="noopener noreferrer"
								>
									📱 WhatsApp
								</a>
							</li>
							<li>
								<a href="mailto:danielatapias1226@gmail.coms">📧 Email</a>
							</li>
							<li>
								<a href="#agendar">📍 Agendar en línea</a>
							</li>
						</ul>
					</div>
				</div>
				<div className="footer-bottom">
					© {year} Daniela Tapias Studio · Todos los derechos reservados
				</div>
			</div>
		</footer>
	);
}
