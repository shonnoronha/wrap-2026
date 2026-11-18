import { MotionConfig } from 'framer-motion';
import { lazy, StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';

// /?gallery: every card variant side by side, to pick the looks production uses.
const VariantGallery = lazy(() => import('./gallery/VariantGallery').then((m) => ({ default: m.VariantGallery })));
const gallery = new URLSearchParams(location.search).has('gallery');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MotionConfig reducedMotion="user">
      {gallery ? <Suspense fallback={null}><VariantGallery /></Suspense> : <App />}
    </MotionConfig>
  </StrictMode>,
);
