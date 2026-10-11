import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { toCloudinaryUrl } from "../api/cloudinary";

export default function Navbar({ onBook }) {
	const [scrolled, setScrolled] = useState(false);
	const [menuOpen, setMenuOpen] = useState(false);
	const location = useLocation();
	const isHome = location.pathname === "/";

	useEffect(() => {
		const handleScroll = () => setScrolled(window.scrollY > 50);
		window.addEventListener("scroll", handleScroll);
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

	const links = [
		{ href: isHome ? "#inicio" : "/", label: "Inicio" },
		{ href: isHome ? "#galeria" : "/#galeria", label: "Galería" },
		{ href: isHome ? "#servicios" : "/#servicios", label: "Servicios" },
		{ href: "/tocados", label: "Tocados", isRoute: true },
		{ href: isHome ? "#sobre-mi" : "/#sobre-mi", label: "Sobre mí" },
		{ href: isHome ? "#agendar" : "/agendar", label: "Agendar" },
	];

	return (
		<nav className={`navbar ${scrolled ? "scrolled" : ""}`}>
			<div className="container">
				<a href={isHome ? "#inicio" : "/"} className="logo">
					<img
						src={toCloudinaryUrl("/w_280,f_auto,q_auto/logo-sin-letras.png")}
						alt="Daniela Tapias Studio"
						width="70"
						height="70"
					/>
				</a>

				<div className={`nav-links ${menuOpen ? "open" : ""}`}>
					{links.map((link) =>
						link.isRoute ? (
							<Link
								key={link.href}
								to={link.href}
								onClick={() => setMenuOpen(false)}
							>
								{link.label}
							</Link>
						) : (
							<a
								key={link.href}
								href={link.href}
								onClick={() => setMenuOpen(false)}
							>
								{link.label}
							</a>
						)
					)}
					<a
						href={isHome ? "#agendar" : "/agendar"}
						className="nav-cta nav-cta-mobile"
						onClick={(e) => {
							if (onBook) {
								e.preventDefault();
								setMenuOpen(false);
								onBook();
							}
						}}
					>
						Agenda tu cita
					</a>
				</div>

				<div className="nav-actions">
					<a
						href={isHome ? "#agendar" : "/agendar"}
						className="nav-cta nav-cta-desktop"
						onClick={(e) => {
							if (onBook) {
								e.preventDefault();
								setMenuOpen(false);
								onBook();
							}
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