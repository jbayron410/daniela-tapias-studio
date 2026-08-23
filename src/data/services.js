// Datos de servicios y precios
// NOTA: Precios provisionales - Daniela debe ajustarlos luego
import { mapToCloudinary } from "../api/cloudinary";

export const SERVICES = [
	{
		id: "sociales",
		name: "Sociales",
		icon: "✨",
		description:
			"Peinados elegantes y modernos para eventos sociales, grados, celebraciones y ocasiones especiales.",
		price: 60000,
		duration: 60,
		includes: [
			"Peinado completo",
			"Productos profesionales",
			"Asesoría de estilo",
		],
	},
	{
		id: "novias",
		name: "Novias",
		icon: "👰",
		description:
			"Peinados espectaculares para tu gran día. Prueba previa y asesoría personalizada incluida.",
		price: 100000,
		duration: 60,
		includes: [
			"Prueba de peinado",
			"Peinado el día del evento",
			"Tocados y accesorios",
			"Fijación de larga duración",
		],
	},
	{
		id: "quinceañeras",
		name: "Quinceañeras",
		icon: "🎀",
		description: "Peinados de ensueño para celebrar tus 15 años como mereces.",
		price: 100000,
		duration: 60,
		includes: [
			"Peinado espectacular",
			"Prueba previa",
			"Accesorios decorativos",
		],
	},
	{
		id: "personalizado",
		name: "Personalizados",
		icon: "💖",
		description:
			"¿Necesitas algo especial? Elige esta opción para peinados a medida o si requieres servicio a domicilio.",
		price: 60000,
		duration: 60,
		includes: [
			"Peinado a tu medida",
			"Consulta personalizada",
			"Opción a domicilio disponible",
		],
	},
];

const GALLERY_LOCAL = {
	sociales: [
		"/image/upload/w_552,h_690,c_fill,f_auto,q_auto/2024-08-20_10-48-58_[C-5bgaiAcKk].jpg",
		"/image/upload/w_552,h_690,c_fill,f_auto,q_auto/2024-06-24_14-09-18_[C8nBHvzPmzL].jpg",
		"/image/upload/w_552,h_690,c_fill,f_auto,q_auto/2025-05-20_17-31-03_[DJ5GiPOyogP].jpg",
		"/image/upload/w_552,h_690,c_fill,f_auto,q_auto/2024-03-22_11-18-14_[C40q0kYAUJN].jpg",
		"/image/upload/w_552,h_690,c_fill,f_auto,q_auto/2024-10-15_12-19-22_[DBJyXc4yKkY].jpg",
		"/image/upload/w_552,h_690,c_fill,f_auto,q_auto/2024-09-03_11-17-45_[C_dh7Zxx0g7].jpg",
		"/image/upload/w_552,h_690,c_fill,f_auto,q_auto/2024-12-11_09-29-25_[DDcQOoexFHx]_01.jpg",
		"/image/upload/w_552,h_690,c_fill,f_auto,q_auto/2023-10-17_09-40-15_[CygOzmjgHFS]_01.jpg",
		"/image/upload/w_552,h_690,c_fill,f_auto,q_auto/2024-01-31_12-18-21_[C2xdKRdgHfu]_01.jpg",
		"/image/upload/w_552,h_690,c_fill,f_auto,q_auto/2023-06-08_11-39-16_[CtPISpeAMU0].jpg",
		"/image/upload/w_552,h_690,c_fill,f_auto,q_auto/2025-02-28_10-04-34_[DGnvDIbA1Oq].jpg",
		"/image/upload/w_552,h_690,c_fill,f_auto,q_auto/2024-05-07_10-48-05_[C6rD8D7AmJL].jpg",
	],
	novias: [
		"/image/upload/w_552,h_690,c_fill,f_auto,q_auto/2025-07-31_11-06-20_[DMxzvc5gC3E].jpg",
		"/image/upload/w_552,h_690,c_fill,f_auto,q_auto/2025-09-02_09-50-01_[DOGpPnnDQMN].jpg",
		"/image/upload/w_552,h_690,c_fill,f_auto,q_auto/2026-01-26_09-59-13_[DT-mWjskcS-].jpg",
		"/image/upload/w_552,h_690,c_fill,f_auto,q_auto/2026-06-10_12-40-54_[DZagK5_wh72].jpg",
		"/image/upload/w_552,h_690,c_fill,f_auto,q_auto/2026-07-03_08-30-08_[DaUR6U5PFAX].jpg",
		"/image/upload/w_552,h_690,c_fill,f_auto,q_auto/2025-10-11_14-11-32_[DPriLd7icy_].jpg",
		"/image/upload/w_552,h_690,c_fill,f_auto,q_auto/2025-12-16_11-04-19_[DSVJNa_kWQ2]_01.jpg",
		"/image/upload/w_552,h_690,c_fill,f_auto,q_auto/2026-01-24_15-00-08_[DT5_My_AW6E].jpg",
		"/image/upload/w_552,h_690,c_fill,f_auto,q_auto/2025-12-14_11-31-28_[DSQCu8yEZcY].jpg",
		"/image/upload/w_552,h_690,c_fill,f_auto,q_auto/2026-07-30_18-21-15_[Dbb23fWJ6tu].jpg",
		"/image/upload/w_552,h_690,c_fill,f_auto,q_auto/2026-07-22_15-08-54_[DbG6fniCcK7]_01.jpg",
		"/image/upload/w_552,h_690,c_fill,f_auto,q_auto/2025-03-13_09-57-32_[DHJMlDOAHeb]_01.jpg",
	],
	quinceañeras: [
		"/image/upload/w_552,h_690,c_fill,f_auto,q_auto/2026-07-30_13-28-06_[DbbVUXapX5w].jpg",
		"/image/upload/w_552,h_690,c_fill,f_auto,q_auto/2026-02-23_15-36-43_[DVHTO-FCbe9]_01.jpg",
		"/image/upload/w_552,h_690,c_fill,f_auto,q_auto/2026-02-23_15-36-43_[DVHTO-FCbe9]_02.jpg",
		"/video/upload/2026-07-21_09-32-12_[DbDvINKvKEp].mp4",
	],
	kids: [
		"/image/upload/w_552,h_690,c_fill,f_auto,q_auto/2025-02-03_09-53-52_[DFnV88VxuiY].jpg",
		"/image/upload/w_552,h_690,c_fill,f_auto,q_auto/2025-12-04_09-55-41_[DR2H0N4EWtC].jpg",
		"/video/upload/2026-07-02_11-07-15_[DaS-dkGPbSb].mp4",
	],
	grados: [
		"/image/upload/w_552,h_690,c_fill,f_auto,q_auto/2024-04-23_11-54-10_[C6HIX08gCxY]_01.jpg",
		"/image/upload/w_552,h_690,c_fill,f_auto,q_auto/2024-04-23_11-54-10_[C6HIX08gCxY]_02.jpg",
		"/image/upload/w_552,h_690,c_fill,f_auto,q_auto/2024-08-30_11-39-56_[C_TRScOR1pJ]_01.jpg",
		"/image/upload/w_552,h_690,c_fill,f_auto,q_auto/2024-08-30_11-39-56_[C_TRScOR1pJ]_02.jpg",
	],
	crespas: [
		"/image/upload/w_552,h_690,c_fill,f_auto,q_auto/2025-12-27_22-12-29_[DSyqbS2ja1l].jpg",
		"/image/upload/w_552,h_690,c_fill,f_auto,q_auto/2026-04-18_20-47-54_[DXS5xfUj6ne].jpg",
	],
};

// Expone la galería apuntando a Cloudinary en lugar de rutas locales
export const GALLERY = Object.fromEntries(
	Object.entries(GALLERY_LOCAL).map(([key, paths]) => [
		key,
		mapToCloudinary(paths),
	]),
);

export const CATEGORIES = [
  { id: 'sociales', label: 'Sociales' },
  { id: 'novias', label: 'Novias' },
  { id: 'quinceañeras', label: 'Quinceañeras' },
  { id: 'kids', label: 'Niñas' },
  { id: 'grados', label: 'Grados' },
  { id: 'crespas', label: 'Crespos' }
];

// Horario laboral: 5:00 AM a 11:00 PM (última cita empieza 10:00 PM)
export const OPENING_HOUR = 5;     // 5:00 AM
export const LAST_SLOT_START = 22; // 10:00 PM
export const SERVICE_DURATION_MIN = 60;
export const SLOT_STEP_MIN = 60;