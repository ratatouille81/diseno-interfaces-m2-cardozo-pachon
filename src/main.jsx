import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Estilos base de Bootstrap 5 y luego los propios, para que los propios puedan sobrescribir
import 'bootstrap/dist/css/bootstrap.min.css'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
