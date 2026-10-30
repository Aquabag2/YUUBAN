import { createContext, useContext } from 'react';

/*
 * Vista previa del inicio del alumno para admins: guarda el slug del evento que se
 * está previsualizando. Fuera de /vista-alumno/:slug vale null y todo funciona normal.
 */
export const PreviewContext = createContext(null);
export const usePreviewSlug = () => useContext(PreviewContext);

// Endpoints de datos según el modo
export const feedUrl     = (slug) => (slug ? `/preview/${encodeURIComponent(slug)}/feed` : '/my/feed');
export const overviewUrl = (slug) => (slug ? `/preview/${encodeURIComponent(slug)}/overview` : '/my/overview');

// true cuando la página se muestra dentro del iframe de "Vista previa" del panel del evento
export const isEmbedded = () => {
  try { return window.self !== window.top; } catch { return true; }
};
