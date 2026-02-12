import React, { useState } from "react";
import axios from "axios";
import "./ForgotPassword.css";

function ForgotPassword() {
  const [correo, setCorreo] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  
  const API_URL = process.env.REACT_APP_API_URL;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCargando(true);
    setMensaje("");
    setError("");

    try {
      const res = await axios.post(`${API_URL}/usuarios/solicitar-recuperacion`, {
        correo,
      });
      setMensaje(res.data.mensaje);
    } catch (err) {
      setError(
        err.response?.data?.detail || "Error al solicitar la recuperación."
      );
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="forgot-container">
      <div className="forgot-form">
        <h2>🔑 Recuperar Contraseña</h2>
        <p>Ingresa tu correo para recibir un enlace de recuperación.</p>

        {mensaje && <div className="alert success">{mensaje}</div>}
        {error && <div className="alert error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              type="email"
              placeholder="Correo electrónico"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              required
              disabled={cargando}
            />
          </div>

          <button type="submit" disabled={cargando}>
            {cargando ? "Enviando..." : "Enviar Enlace"}
          </button>
        </form>

        <div className="back-link">
          <a href="/login">← Volver al Login</a>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
