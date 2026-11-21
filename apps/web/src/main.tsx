import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/noto-serif-hebrew/400.css';
import '@fontsource/noto-serif-hebrew/600.css';
import './styles.css';
import { App } from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
