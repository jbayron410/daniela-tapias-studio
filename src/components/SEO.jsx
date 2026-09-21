import { Helmet } from 'react-helmet-async';

const SITE_NAME = 'Daniela Tapias Studio';
const BASE_URL = 'https://www.danielatapias.com';
const CLOUDINARY_BASE = import.meta.env.VITE_CLOUDINARY_BASE_URL || import.meta.env.CLOUDINARY_BASE_URL;
const DEFAULT_IMAGE = `${CLOUDINARY_BASE}/w_1200,h_630,c_fill,f_auto,q_auto/blazer-negro-todo-medio.png`;

export default function SEO({
  title,
  description,
  path = '/',
  image = DEFAULT_IMAGE,
  type = 'website'
}) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} | Peinados Profesionales en Cartago, Valle del Cauca`;
  const url = `${BASE_URL}${path}`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />

      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={image} />
      <meta property="og:type" content={type} />

      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
    </Helmet>
  );
}