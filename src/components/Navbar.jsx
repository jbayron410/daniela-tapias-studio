import { useState, useEffect } from "react";
import { toCloudinaryUrl } from "../api/cloudinary";

export default function Navbar({ onBook }) {
	const [scrolled, setScrolled] = useState(false);
	const [menuOpen, setMenuOpen] = useState(false);

	useEffect(() => {
		const handleScroll = () => setScrolled(window.scrollY > 50);
		window.addEventListener("scroll", handleScroll);
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

	const links = [
		{ href: "#inicio", label: "Inicio" },
		{ href: "#galeria", label: "Galería" },
		{ href: "#servicios", label: "Servicios" },
		{ href: "#sobre-mi", label: "Sobre mí" },
		{ href: "#agendar", label: "Agendar" },
	];

	return (
		<nav className={`navbar ${scrolled ? "scrolled" : ""}`}>
			<div className="container">
				<a href="#inicio" className="logo">
					<img
						src={toCloudinaryUrl("/logo-sin-letras.png")}
						alt="Daniela Tapias Studio"
					/>
				</a>

				<div className={`nav-links ${menuOpen ? "open" : ""}`}>
					{links.map((link) => (
						<a
							key={link.href}
							href={link.href}
							onClick={() => setMenuOpen(false)}
						>
							{link.label}
						</a>
					))}
					<a
						href="#agendar"
						className="nav-cta nav-cta-mobile"
						onClick={(e) => {
							e.preventDefault();
							setMenuOpen(false);
							onBook();
						}}
					>
						Agenda tu cita
					</a>
				</div>

				<div className="nav-actions">
					<a
						href="#agendar"
						className="nav-cta nav-cta-desktop"
						onClick={(e) => {
							e.preventDefault();
							setMenuOpen(false);
							onBook();
						}}
					>
						Agenda tu cita
					</a>

					<button
						className="hamburger"
						onClick={() => setMenuOpen(!menuOpen)}
						aria-label="Menú"
						aria-expanded={menuOpen}
					>
						<span></span>
						<span></span>
						<span></span>
					</button>
				</div>
			</div>
		</nav>
	);
}