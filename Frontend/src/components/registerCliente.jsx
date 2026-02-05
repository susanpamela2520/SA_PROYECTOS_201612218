import React, { useState } from 'react'
import { register } from '../api'

function RegisterCliente() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    nombreCompleto: '',
    telefono: ''
  })
  const [message, setMessage] = useState('')

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage('')

    try {
      const result = await register({
        ...formData,
        role: 'CLIENTE'
      })

      if (result.ok) {
        setMessage('✅ Registro exitoso. Ya puedes iniciar sesión.')
        setFormData({ email: '', password: '', nombreCompleto: '', telefono: '' })
      } else {
        setMessage(`❌ ${result.message}`)
      }
    } catch (error) {
      setMessage('❌ Error al conectar con el servidor')
    }
  }

  return (
    <div className="form-card">
      <h2>📝 Registro de Cliente</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Nombre Completo:</label>
          <input
            type="text"
            name="nombreCompleto"
            value={formData.nombreCompleto}
            onChange={handleChange}
            required
            placeholder="Juan Pérez"
          />
        </div>

        <div className="form-group">
          <label>Email:</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            placeholder="juan@email.com"
          />
        </div>

        <div className="form-group">
          <label>Teléfono:</label>
          <input
            type="tel"
            name="telefono"
            value={formData.telefono}
            onChange={handleChange}
            required
            placeholder="12345678"
          />
        </div>

        <div className="form-group">
          <label>Contraseña:</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            placeholder="••••••••"
          />
        </div>

        <button type="submit">Registrarse</button>
      </form>

      {message && (
        <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}
    </div>
  )
}

export default RegisterCliente