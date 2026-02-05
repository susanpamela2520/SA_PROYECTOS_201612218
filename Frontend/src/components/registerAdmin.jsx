import React, { useState } from 'react'
import { register } from '../api'

function RegisterAdmin() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    nombreCompleto: '',
    telefono: '',
    role: 'REPARTIDOR'
  })
  const [message, setMessage] = useState('')

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage('')

    try {
      const result = await register(formData)

      if (result.ok) {
        setMessage(`✅ ${formData.role} registrado exitosamente`)
        setFormData({ 
          email: '', 
          password: '', 
          nombreCompleto: '', 
          telefono: '',
          role: 'REPARTIDOR' 
        })
      } else {
        setMessage(`❌ ${result.message}`)
      }
    } catch (error) {
      setMessage('❌ Error al conectar con el servidor')
    }
  }

  return (
    <div className="form-card">
      <h2>👨‍💼 Panel de Administrador</h2>
      <p style={{ textAlign: 'center', color: '#666', marginBottom: '1.5rem' }}>
        Registrar Repartidor o Restaurante
      </p>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Tipo de Usuario:</label>
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            required
          >
            <option value="REPARTIDOR">Repartidor</option>
            <option value="RESTAURANTE">Restaurante</option>
          </select>
        </div>

        <div className="form-group">
          <label>Nombre Completo / Restaurante:</label>
          <input
            type="text"
            name="nombreCompleto"
            value={formData.nombreCompleto}
            onChange={handleChange}
            required
            placeholder="Nombre del repartidor o restaurante"
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
            placeholder="email@ejemplo.com"
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

        <button type="submit">Registrar {formData.role}</button>
      </form>

      {message && (
        <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}
    </div>
  )
}

export default RegisterAdmin