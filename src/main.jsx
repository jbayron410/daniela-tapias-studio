import React, { Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import App from './App';
import './styles/global.css';

const Agendar = React.lazy(() => import('./pages/Agendar'));
const MisRedes = React.lazy(() => import('./pages/MisRedes'));
const AdminRoutes = React.lazy(() => import('./pages/admin/AdminRoutes'));

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <Suspense fallback={null}>
          <Routes>
            <Route path="/" element={<App />} />
            <Route path="/agendar" element={<Agendar />} />
            <Route path="/mis-redes" element={<MisRedes />} />
            <Route path="/admin/*" element={<AdminRoutes />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </HelmetProvider>
  </React.StrictMode>
);