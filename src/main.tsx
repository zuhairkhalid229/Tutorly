
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initializeAppData } from './lib/initAppData.ts'

// Initialize app data (add dummy tutors if needed)
initializeAppData().then(() => {
  console.log('App data initialization complete');
}).catch(error => {
  console.error('Error during app data initialization:', error);
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
