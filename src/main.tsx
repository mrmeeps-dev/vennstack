import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// Service Worker Registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        // Check if there's already a waiting worker (update occurred while app was closed)
        if (registration.waiting) {
          // Notify the app that an update is available
          window.dispatchEvent(new CustomEvent('sw-update-available'));
        }

        // Listen for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              // When new worker enters 'installed' state and there's already a controller,
              // it means an update is available and waiting
              if (
                newWorker.state === 'installed' &&
                navigator.serviceWorker.controller
              ) {
                // Notify the app that an update is available
                window.dispatchEvent(new CustomEvent('sw-update-available'));
              }
            });
          }
        });

        // Listen for controller change (when new worker takes control)
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          // Reload the page when new worker takes control
          window.location.reload();
        });

        // Listen for messages from service worker
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data?.type === 'UPDATE_AVAILABLE') {
            window.dispatchEvent(new CustomEvent('sw-update-available'));
          }
        });
      })
      .catch((error) => {
        // Log error but don't break the app
        console.error('Service Worker registration failed:', error);
      });
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <App />
)

