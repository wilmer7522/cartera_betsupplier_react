import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import "./ResetPassword.css";

function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const API_URL = process.env.REACT_APP_API_URL;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCargando(true);
    setError("");
    setMensaje("");

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      setCargando(false);
      return;
    }

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      setCargando(false);
      return;
    }

    try {
      const res = await axios.post(`${API_URL}/usuarios/reset-password/${token}`, {
        password,
      });
      setMensaje(res.data.mensaje);
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (err) {
      setError(
        err.response?.data?.detail || "Error al restablecer la contraseña."
      );
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="reset-container">
      <div className="reset-form">
        <h2>🔐 Nueva Contraseña</h2>
        <p>Ingresa tu nueva contraseña a continuación.</p>

        {mensaje && <div className="alert success">{mensaje}</div>}
        {error && <div className="alert error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              type="password"
              placeholder="Nueva contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={cargando}
            />
          </div>
          
          <div className="form-group">
            <input
              type="password"
              placeholder="Confirmar contraseña"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={cargando}
            />
          </div>

          <button type="submit" disabled={cargando}>
            {cargando ? "Restableciendo..." : "Cambiar Contraseña"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ResetPassword;
