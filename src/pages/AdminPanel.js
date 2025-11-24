import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import axios from "axios";
import "./AdminPanel.css";
import { useNavigate } from "react-router-dom";

export default function AdminPanel() {
  const [usuarios, setUsuarios] = useState([]);
  const [usuariosFiltrados, setUsuariosFiltrados] = useState([]);
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [rol, setRol] = useState("vendedor");
  const [vendedoresAsociados, setVendedoresAsociados] = useState([]);
  const [mostrarPanel, setMostrarPanel] = useState(false);
  const [editando, setEditando] = useState(false);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
  const [filtro, setFiltro] = useState("todos");
  const [vendedoresBase, setVendedoresBase] = useState([]);

  const token = localStorage.getItem("token");
  const navigate = useNavigate();
  const panelRef = useRef(null);

  // === CARGAR USUARIOS ===
  const cargarUsuarios = useCallback(async () => {
    try {
      const res = await axios.get(
        `${process.env.REACT_APP_API_URL}/usuarios/todos`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = res.data.usuarios || [];
      setUsuarios(data);
      setUsuariosFiltrados(data);
    } catch (err) {
      console.error("Error al cargar usuarios:", err);
      // 🔥 NUEVO: Redirigir al login si el token expiró
      if (err.response?.status === 401) {
        localStorage.clear();
        navigate("/login");
        return;
      }
    }
  }, [token, navigate]); // 🔥 Agregar navigate como dependencia

  useEffect(() => {
    cargarUsuarios();
  }, [cargarUsuarios]);

  // 🔹 Crear mapa correo -> nombre con useMemo para dependencia segura
  const correoANombre = useMemo(() => {
    const mapa = {};
    usuarios.forEach((u) => {
      mapa[u.correo] = u.nombre;
    });
    return mapa;
  }, [usuarios]);

  const cargarVendedoresBase = useCallback(async () => {
    try {
      const res = await axios.get(
        `${process.env.REACT_APP_API_URL}/excel/ver_dashboard`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Extraemos los nombres únicos de vendedores de la base de conocimiento
      const data = res.data.datos || [];
      const vendedoresUnicos = [
        ...new Set(
          data.map((item) => (item.Nombre_Vendedor || "").trim().toUpperCase())
        ),
      ].filter((v) => v);

      setVendedoresBase(vendedoresUnicos);
    } catch (err) {
      console.error("Error al cargar vendedores de base de conocimiento:", err);
      // 🔥 NUEVO: Redirigir al login si el token expiró
      if (err.response?.status === 401) {
        localStorage.clear();
        navigate("/login");
        return;
      }
    }
  }, [token, navigate]); // 🔥 Agregar navigate como dependencia

  useEffect(() => {
    cargarVendedoresBase();
  }, [cargarVendedoresBase]);

  // === FILTRO ===
  useEffect(() => {
    if (filtro === "todos") {
      setUsuariosFiltrados(usuarios);
    } else {
      setUsuariosFiltrados(
        usuarios.filter(
          (u) =>
            u.nombre === filtro ||
            (u.vendedores_asociados || []).some(
              (c) => correoANombre[c] === filtro
            )
        )
      );
    }
  }, [filtro, usuarios, correoANombre]);

  // === CLIC FUERA PARA CERRAR PANEL ===
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setMostrarPanel(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // === TOGGLE CHECKBOX (normaliza mayúsculas y minúsculas) ===
  const toggleVendedorAsociado = (nombreVendedor) => {
    setVendedoresAsociados((prev) => {
      const vendedorUpper = nombreVendedor.toUpperCase();
      const listaNormalizada = prev.map((v) => v.toUpperCase());

      // Si ya está seleccionado → eliminarlo
      if (listaNormalizada.includes(vendedorUpper)) {
        return prev.filter((v) => v.toUpperCase() !== vendedorUpper);
      }

      // Si no está → agregarlo
      return [...prev, vendedorUpper];
    });
  };

  // === SELECCIONAR TODOS LOS VENDEDORES ===
  const seleccionarTodos = () => {
    setVendedoresAsociados(vendedoresBase.map((v) => v.toUpperCase()));
  };

  // === DESELECCIONAR TODOS LOS VENDEDORES ===
  const deseleccionarTodos = () => {
    setVendedoresAsociados([]);
  };

  // === VERIFICAR SI TODOS ESTÁN SELECCIONADOS ===
  const todosSeleccionados = useMemo(() => {
    if (vendedoresBase.length === 0) return false;
    const vendedoresAsociadosUpper = vendedoresAsociados.map((v) =>
      v.toUpperCase()
    );
    return vendedoresBase.every((vendedor) =>
      vendedoresAsociadosUpper.includes(vendedor.toUpperCase())
    );
  }, [vendedoresAsociados, vendedoresBase]);

  // === TOGGLE TODOS (seleccionar/deseleccionar todos) ===
  const toggleTodos = () => {
    if (todosSeleccionados) {
      deseleccionarTodos();
    } else {
      seleccionarTodos();
    }
  };

  // === GUARDAR / ACTUALIZAR ===
  const guardarUsuario = async (e) => {
    e.preventDefault();
    try {
      const datos = {
        correo,
        ...(password ? { password } : {}),
        nombre,
        rol,
        vendedores_asociados: vendedoresAsociados,
      };

      if (editando) {
        await axios.put(
          `${process.env.REACT_APP_API_URL}/usuarios/actualizar/${usuarioSeleccionado}`,
          datos,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
      } else {
        await axios.post(
          `${process.env.REACT_APP_API_URL}/usuarios/crear`,
          datos,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      }

      setCorreo("");
      setPassword("");
      setNombre("");
      setRol("vendedor");
      setVendedoresAsociados([]);
      setEditando(false);
      setUsuarioSeleccionado(null);
      cargarUsuarios();
    } catch (err) {
      const msg = err.response?.data?.detail || "❌ Error al guardar usuario";
      alert(msg);
      console.error(err);
    }
  };

  const editarUsuario = (u) => {
    setCorreo(u.correo);
    setPassword("");
    setNombre(u.nombre);
    setRol(u.rol);
    // 🔹 Normaliza todos los vendedores asociados en mayúsculas para coincidir con el listado
    setVendedoresAsociados(
      (u.vendedores_asociados || []).map((v) => v.toUpperCase())
    );
    setEditando(true);
    setUsuarioSeleccionado(u.correo);
  };

  const eliminarUsuario = async (correo) => {
    if (!window.confirm(`¿Eliminar usuario "${correo}"?`)) return;
    try {
      await axios.delete(
        `${process.env.REACT_APP_API_URL}/usuarios/eliminar/${correo}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      cargarUsuarios();
    } catch (err) {
      alert("❌ Error al eliminar usuario");
      console.error(err);
    }
  };

  // === SUBIR EXCELES ===
  const subirExcelBase = async (e) => {
    const archivo = e.target.files[0];
    if (!archivo) return;
    const formData = new FormData();
    formData.append("archivo", archivo);
    try {
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/excel/subir`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      alert(`✅ ${res.data.mensaje}\nRegistros: ${res.data.total_registros}`);
    } catch (err) {
      alert("❌ Error al subir Base de Conocimiento");
      console.error(err);
    }
    e.target.value = "";
  };

  const subirExcelCupo = async (e) => {
    const archivo = e.target.files[0];
    if (!archivo) return;
    const formData = new FormData();
    formData.append("archivo", archivo);
    try {
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/excel/subir_cupo_cartera`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      alert(`✅ ${res.data.mensaje}\nRegistros: ${res.data.total_registros}`);
    } catch (err) {
      alert("❌ Error al subir Cupo Cartera");
      console.error(err);
    }
    e.target.value = "";
  };

  const cerrarSesion = () => {
    localStorage.clear();
    window.location.href = "/login"; // 🔥 CAMBIADO
  };

  // 🔥 Timer para cerrar sesión automáticamente después de 5 minutos (SIN CONTADOR VISUAL)
  useEffect(() => {
    const timer = setTimeout(() => {
      console.log("🔄 Cerrando sesión automáticamente...");
      localStorage.clear();
      // 🔥 Forzar recarga completa para limpiar todo
      window.location.href = "/login";
    }, 30 * 60 * 1000);
    return () => clearTimeout(timer);
  }, []);

  // 🔥 FUNCIÓN PARA FORMATEAR FECHA
  const formatearFecha = (fechaISO) => {
    if (!fechaISO) return "Nunca";

    const fecha = new Date(fechaISO);
    return fecha.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  /*======== RENDER ======*/
  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h2>Panel de Administración</h2>
        <button onClick={cerrarSesion} className="btn-salir">
          🔒 Cerrar Sesión
        </button>
      </div>

      {/* Formulario */}
      <form onSubmit={guardarUsuario} className="admin-form">
        <h3>{editando ? "✏️ Editar Usuario" : "➕ Agregar Usuario"}</h3>
        <div className="form-fields">
          <input
            type="email"
            placeholder="Correo electrónico"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            required={!editando}
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required={!editando}
          />
          <input
            type="text"
            placeholder="Nombre completo"
            value={nombre}
            onChange={(e) => setNombre(e.target.value.toUpperCase())}
          />

          <div className="rol-vendedor-container">
            <select
              value={rol}
              onChange={(e) => setRol(e.target.value)}
              className="select-rol"
            >
              <option value="vendedor">Vendedor</option>
              <option value="admin">Administrador</option>
            </select>

            <div className="vendedores-asociados-container" ref={panelRef}>
              <button
                type="button"
                className="btn-toggle-vendedores"
                onClick={() => setMostrarPanel(!mostrarPanel)}
              >
                🧑‍🤝‍🧑 Asociar vendedores
              </button>

              {mostrarPanel && (
                <div className="panel-vendedores">
                  <div className="panel-header">
                    <p>Vendedores asociados:</p>
                    <div className="botones-todos">
                      <button
                        type="button"
                        className="btn-todos"
                        onClick={toggleTodos}
                      >
                        {todosSeleccionados
                          ? " Quitar todos"
                          : " Seleccionar todos"}
                      </button>
                    </div>
                  </div>
                  <div className="checkbox-list scrollable">
                    {vendedoresBase.length > 0 ? (
                      vendedoresBase.map((nombreVendedor) => {
                        const vendedorUpper = nombreVendedor.toUpperCase();
                        const seleccionado = vendedoresAsociados
                          .map((v) => v.toUpperCase())
                          .includes(vendedorUpper);

                        return (
                          <label key={vendedorUpper} className="checkbox-item">
                            <input
                              type="checkbox"
                              checked={seleccionado}
                              onChange={() =>
                                toggleVendedorAsociado(vendedorUpper)
                              }
                            />
                            <span>{vendedorUpper}</span>
                          </label>
                        );
                      })
                    ) : (
                      <p className="sin-vendedores">
                        ⚠️ No hay vendedores cargados en la base de
                        conocimiento.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="botones-form">
          <button type="submit" className="btn-guardar">
            {editando ? "Actualizar" : "Agregar"}
          </button>
          {editando && (
            <button
              type="button"
              className="btn-cancelar"
              onClick={() => {
                setEditando(false);
                setCorreo("");
                setPassword("");
                setNombre("");
                setRol("vendedor");
                setVendedoresAsociados([]);
              }}
            >
              Cancelar
            </button>
          )}
        </div>
      </form>

      {/* Subida de archivos */}
      <div className="excel-upload">
        <label id="base-conocimiento" htmlFor="excel-base" className="btn-excel">
          📤 Subir Base de Conocimiento
        </label>
        <input
          type="file"
          id="excel-base"
          accept=".xlsx, .xls"
          style={{ display: "none" }}
          onChange={subirExcelBase}
        />

        <label id="cupo-cartera"
          htmlFor="excel-cupo"
          className="btn-excel"
          style={{ marginLeft: "10px" }}
        >
          📤 Subir Cupo Cartera
        </label>
        <input
          type="file"
          id="excel-cupo"
          accept=".xlsx, .xls"
          style={{ display: "none" }}
          onChange={subirExcelCupo}
        />
      </div>

      <button className="btn-dashboard" onClick={() => navigate("/dashboard")}>
        📊 Dashboard
      </button>

      {/* Filtro */}
      <div className="filtro-container">
        <label>Filtrar por vendedor:</label>
        <select
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          className="filtro-select"
        >
          <option value="todos">Todos</option>
          {[...new Set(usuarios.map((u) => u.nombre))].map((nombre) => (
            <option key={nombre} value={nombre}>
              {nombre}
            </option>
          ))}
        </select>
      </div>

      {/* Tabla de usuarios */}
      {/* Tabla de usuarios */}
      <h3>📋 Lista de Usuarios</h3>
      <table className="tabla-usuarios">
        <thead>
          <tr>
            <th>Correo</th>
            <th>Nombre</th>
            <th>Rol</th>
            <th>Último Login</th> {/* 🔥 NUEVA COLUMNA */}
            <th>Asociados</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {usuariosFiltrados.map((u) => (
            <tr key={u._id}>
              <td>{u.correo}</td>
              <td>{u.nombre}</td>
              <td>{u.rol}</td>
              <td>
                {formatearFecha(u.ultimo_login)} {/* 🔥 NUEVA CELDA */}
              </td>
              <td>
                {u.vendedores_asociados?.length ? (
                  u.vendedores_asociados.length > 4 ? ( // Si hay muchos, usa un desplegable
                    <details>
                      <summary
                        style={{ cursor: "pointer", fontWeight: "bold" }}
                      >
                        {u.vendedores_asociados.length} vendedores asociados
                      </summary>
                      <ul
                        style={{
                          listStyle: "none",
                          paddingLeft: "10px",
                          marginTop: "5px",
                        }}
                      >
                        {u.vendedores_asociados.map((c, idx) => (
                          <li key={idx} style={{ textTransform: "uppercase" }}>
                            {correoANombre[c]
                              ? correoANombre[c].toUpperCase()
                              : c.toUpperCase()}
                          </li>
                        ))}
                      </ul>
                    </details>
                  ) : (
                    // Si hay pocos, los muestra en línea
                    u.vendedores_asociados
                      .map((c) =>
                        correoANombre[c]
                          ? correoANombre[c].toUpperCase()
                          : c.toUpperCase()
                      )
                      .join(", ")
                  )
                ) : (
                  "—"
                )}
              </td>
              <td>
                <button className="btn-editar" onClick={() => editarUsuario(u)}>
                  ✏️
                </button>
                <button
                  className="btn-eliminar"
                  onClick={() => eliminarUsuario(u.correo)}
                >
                  🗑️
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
