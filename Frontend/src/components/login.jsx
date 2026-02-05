import React, { useState } from 'react'
import { login } from '../api'

function Login({ setToken }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage('')

    try {
      const result = await login({ email, password })
      
      if (result.ok) {
        localStorage.setItem('token', result.token)
        setToken(result.token)
        setMessage('✅ Login exitoso')
      } else {
        setMessage(`❌ ${result.message}`)
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