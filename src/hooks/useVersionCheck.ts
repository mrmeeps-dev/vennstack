import { useState, useEffect, useCallback } from 'react';

const UPDATE_AVAILABLE = 'UPDATE_AVAILABLE';
const SKIP_WAITING = 'SKIP_WAITING';

export function useVersionCheck() {
  const [updateAvailable, setUpdateAvailable] = useState(false);

  const checkVersion = useCallback(async () => {
    try {
      const response = await fetch('/version.json?t=' + Date.now(), {
        cache: 'no-store',
      });
      if (!response.ok) return;
      
      const data = await response.json() as { version: string; buildTime: string };
      const serverVersion = data.version;
      const clientVersion = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '';

      if (serverVersion && clientVersion && serverVersion !== clientVersion) {
        setUpdateAvailable(true);
      }
    } catch (error) {
      // Silently fail - don't break the app if version check fails
      console.error('Version check failed:', error);
    }
  }, []);

  const checkForWaitingWorker = useCallback(() => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.getRegistration().then((registration) => {
        if (registration?.waiting) {
          setUpdateAvailable(true);
        }
      });
    }
  }, []);

  const sendSkipWaiting = useCallback(() => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: SKIP_WAITING });
    }
  }, []);

  useEffect(() => {
    // Check version on mount
    checkVersion();
    checkForWaitingWorker();

    // Check version when app regains focus
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkVersion();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Listen for service worker messages
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === UPDATE_AVAILABLE) {
        setUpdateAvailable(true);
      }
    };
    navigator.serviceWorker?.addEventListener('message', handleMessage);

    // Listen for custom update available event from main.tsx
    const handleUpdateAvailable = () => {
      setUpdateAvailable(true);
    };
    window.addEventListener('sw-update-available', handleUpdateAvailable);

    // Listen for controller change (when new worker takes control)
    const handleControllerChange = () => {
      window.location.reload();
    };
    navigator.serviceWorker?.addEventListener('controllerchange', handleControllerChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      navigator.serviceWorker?.removeEventListener('message', handleMessage);
      navigator.serviceWorker?.removeEventListener('controllerchange', handleControllerChange);
      window.removeEventListener('sw-update-available', handleUpdateAvailable);
    };
  }, [checkVersion, checkForWaitingWorker]);

  return {
    updateAvailable,
    setUpdateAvailable,
    sendSkipWaiting,
  };
}

