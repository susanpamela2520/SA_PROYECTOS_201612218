import React, { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom'
import Login from './components/login.jsx'
import RegisterCliente from './components/registerCliente.jsx'
import RegisterAdmin from './components/registerAdmin.jsx'

// ✅ Decodificar el payload del JWT sin librerías
function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(jsonPayload)
  } catch (e) {
    return null
  }
}

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'))

  // ✅ Si hay token pero no hay role guardado, lo sacamos del JWT
  useEffect(() => {
    if (!token) return

    const currentRole = localStorage.getItem('user_role')
    if (!currentRole) {
      const payload = parseJwt(token)
      const role = String(payload?.role || payload?.rol || '').toUpperCase()
      if (role) localStorage.setItem('user_role', role)

      if (!localStorage.getItem('user_email') && payload?.email) {
        localStorage.setItem('user_email', payload.email)
      }
      if (!localStorage.getItem('user_name') && payload?.nombreCompleto) {
        localStorage.setItem('user_name', payload.nombreCompleto)
      }
    }
  }, [token])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user_email')
    localStorage.removeItem('user_role')
    localStorage.removeItem('user_name')
    setToken(null)
  }

  // ✅ Verificar si es admin (desde localStorage o token)
  const isAdmin = () => {
    const roleStorage = (localStorage.getItem('user_role') || '').toUpperCase()
    if (roleStorage) return roleStorage === 'ADMIN' || roleStorage === 'ADMINISTRADOR'

    const tokenLocal = localStorage.getItem('token')
    if (!tokenLocal) return false

    const payload = parseJwt(tokenLocal)
    const roleToken = String(payload?.role || payload?.rol || '').toUpperCase()
    return roleToken === 'ADMIN' || roleToken === 'ADMINISTRADOR'
  }

  // ✅ Ruta protegida admin
  const ProtectedAdminRoute = ({ children }) => {
    const tokenLocal = localStorage.getItem('token')
    if (!tokenLocal) return <Navigate to="/login" replace />

    const roleStorage = (localStorage.getItem('user_role') || '').toUpperCase()
    const payload = parseJwt(tokenLocal)
    const roleToken = String(payload?.role || payload?.rol || '').toUpperCase()

    const role = roleStorage || roleToken

    if (role !== 'ADMIN' && role !== 'ADMINISTRADOR') {
      return (
        <div className="form-card">
          <h2>⛔ Acceso Denegado</h2>
          <p style={{ textAlign: 'center', color: '#666' }}>
            Solo los administradores pueden acceder a esta sección.
          </p>
          <button onClick={() => (window.location.href = '/login')}>
            Volver al Login
          </button>
        </div>
      )
    }

    return children
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
              </>
            ) : (
              <>
                <span>Sesión activa ✅ ({localStorage.getItem('user_name') || localStorage.getItem('user_email')})</span>
                {isAdmin() && <Link to="/admin">Panel Admin</Link>}
                <button onClick={handleLogout}>Cerrar Sesión</button>
              </>
            )}
          </div>
        </nav>

        <div className="container">
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login setToken={setToken} />} />
            <Route path="/register" element={<RegisterCliente />} />

            <Route
              path="/admin"
              element={
                <ProtectedAdminRoute>
                  <RegisterAdmin />
                </ProtectedAdminRoute>
              }
            />

            <Route
              path="/dashboard"
              element={
                token ? (
                  <div className="form-card">
                    <h2>Bienvenido</h2>
                    <p>Hola, {localStorage.getItem('user_name') || localStorage.getItem('user_email')}</p>
                    <p>Rol: {localStorage.getItem('user_role')}</p>
                  </div>
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  )
}

export default App
