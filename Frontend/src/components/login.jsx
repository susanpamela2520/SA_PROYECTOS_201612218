import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../api'

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

function Login({ setToken }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage('')

    try {
      const result = await login({ email, password })

      if (!result?.ok || !result?.token) {
        setMessage(`❌ ${result?.message || 'Login fallido'}`)
        return
      }

      // ✅ Guardar token
      localStorage.setItem('token', result.token)
      setToken(result.token)

      // ✅ Sacar rol desde JWT (porque tu backend NO devuelve user)
      const payload = parseJwt(result.token)
      const role = String(payload?.role || payload?.rol || '').toUpperCase()

      // ✅ Guardar info mínima en localStorage
      localStorage.setItem('user_role', role)
      localStorage.setItem('user_email', payload?.email || email)
      localStorage.setItem('user_name', payload?.nombreCompleto || '')

      setMessage('✅ Login exitoso')

      // ✅ Redirigir inmediato (sin setTimeout)
      if (role === 'ADMIN' || role === 'ADMINISTRADOR') {
        navigate('/admin', { replace: true })
      } else {
        navigate('/dashboard', { replace: true })
      }
    } catch (error) {
      setMessage('❌ Error al conectar con el servidor')
    }
  }

  return (
    <div className="form-card">
      <h2>🔐 Iniciar Sesión</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="tu@email.com"
          />
        </div>

        <div className="form-group">
          <label>Contraseña:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
          />
        </div>

        <button type="submit">Iniciar Sesión</button>
      </form>

      {message && (
        <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}
    </div>
  )
}

export default Login