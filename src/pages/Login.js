import React, { useState } from "react";
import axios from "axios";
import "./Login.css";

function Login() {
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [cargando, setCargando] = useState(false); // 🕒 para mostrar feedback
  const API_URL = process.env.REACT_APP_API_URL;

  const handleLogin = async (e) => {
    e.preventDefault();
    setCargando(true);

    try {
      const res = await axios.post(`${API_URL}/usuarios/login`, {
        correo,
        password,
      });

      // ✅ Limpiar sesión anterior
      localStorage.clear();

      // ✅ Guardar sesión nueva
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("rol", res.data.rol);
      localStorage.setItem("nombre", res.data.nombre);

      console.log(`Bienvenido ${res.data.nombre} (${res.data.rol})`);

      // ✅ Redirección según rol (con recarga para que App.jsx lea los datos)
      if (res.data.rol === "admin") {
        window.location.href = "/admin"; // 🔥 fuerza la carga del panel admin
      } else if (res.data.rol === "vendedor") {
        window.location.href = "/dashboard"; // 🔥 fuerza carga del dashboard
      } else {
        alert("Rol desconocido. Contacta al administrador.");
        setCargando(false);
      }
    } catch (err) {
      console.error("Error al iniciar sesión:", err);
      alert(
        err.response?.data?.detail ||
          "❌ Credenciales inválidas o error en el servidor"
      );
      setCargando(false);
    }
  };

  return (
    <div className="login-container">
      <form onSubmit={handleLogin} className="login-form">
        <h2>🔐 Iniciar Sesión</h2>

        <input id="email"
          type="email"
          placeholder="Correo electrónico"
          value={correo}
          onChange={(e) => setCorreo(e.target.value)}
          required
          disabled={cargando}
        />

        <input id="password"
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={cargando}
        />

        <button id="enter" type="submit" disabled={cargando}>
          {cargando ? "Ingresando..." : "Ingresar"}
        </button>
      </form>
    </div>
  );
}

export default Login;
