import { useRegisterSW } from 'virtual:pwa-register/react';

export function UpdateBanner() {
  const { needRefresh: [needRefresh, setNeedRefresh], updateServiceWorker } = useRegisterSW({
    onRegisterError: (err) => console.error('[pwa] no se pudo registrar el service worker', err),
  });
  if (!needRefresh) return null;
  return (
    <div className="update-banner" role="status">
      <span>Nueva versión disponible</span>
      <button type="button" className="primary" onClick={() => updateServiceWorker(true)}>Recargar</button>
      <button type="button" aria-label="Cerrar" onClick={() => setNeedRefresh(false)}>×</button>
    </div>
  );
}
