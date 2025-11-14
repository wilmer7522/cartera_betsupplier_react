import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import AdminPanel from "./pages/AdminPanel";
import Dashboard from "./pages/Dashboard";

function App() {
  // ✅ Función para verificar token y rol desde localStorage
  const getUserData = () => {
    try {
      const token = localStorage.getItem("token");
      const rol = localStorage.getItem("rol");
      return { token, rol };
    } catch (error) {
      console.error("Error al leer localStorage:", error);
      return { token: null, rol: null };
    }
  };

  const { token, rol } = getUserData();

  return (
    <Router>
      <Routes>
        {/* 🔐 LOGIN - solo visible si no hay sesión */}
        <Route
          path="/login"
          element={
            token ? (
              rol === "admin" ? (
                <Navigate to="/admin" replace />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            ) : (
              <Login />
            )
          }
        />

        {/* 👑 PANEL ADMIN - solo para admin */}
        <Route
          path="/admin"
          element={
            token && rol === "admin" ? (
              <AdminPanel />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* 🧑‍💼 DASHBOARD - para cualquier usuario logueado */}
        <Route
          path="/dashboard"
          element={
            token ? <Dashboard /> : <Navigate to="/login" replace />
          }
        />

        {/* 🔄 Ruta por defecto */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;

