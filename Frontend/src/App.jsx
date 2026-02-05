import React, { useState } from 'react'
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom'
import Login from './components/login.jsx'
import RegisterCliente from './components/registerCliente.jsx'
import RegisterAdmin from './components/registerAdmin.jsx'

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'))

  const handleLogout = () => {
    localStorage.removeItem('token')
    setToken(null)
  }

  return (
    <BrowserRouter>
      <div className="app">
        <nav className="navbar">
          <h1>🍕 Delivereats</h1>
          <div className="nav-links">
            {!token ? (
              <>
                <Link to="/login">Iniciar Sesión</Link>
                <Link to="/register">Registrarse</Link>
                <Link to="/admin">Admin</Link>
              </>
            ) : (
              <>
                <span>Sesión activa ✅</span>
                <button onClick={handleLogout}>Cerrar Sesión</button>
              </>
            )}
          </div>
        </nav>

        <div className="container">
          <Routes>
            <Route path="/" element={<Navigate to="/login" />} />
            <Route path="/login" element={<Login setToken={setToken} />} />
            <Route path="/register" element={<RegisterCliente />} />
            <Route path="/admin" element={<RegisterAdmin />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  )
}

export default App