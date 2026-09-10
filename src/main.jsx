const originalAddEventListener = EventTarget.prototype.addEventListener;
EventTarget.prototype.addEventListener = function (type, listener, options) {
  if (
    typeof type === 'string' &&
    (type === 'touchstart' || type === 'touchmove' || type === 'wheel')
  ) {
    const opts = typeof options === 'boolean' ? { capture: options } : { ...(options || {}) };
    if (!('passive' in opts)) {
      opts.passive = false;
    }
    return originalAddEventListener.call(this, type, listener, opts);
  }
  return originalAddEventListener.call(this, type, listener, options);
};

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
