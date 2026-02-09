import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export const useAdminPanel = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [usuariosFiltrados, setUsuariosFiltrados] = useState([]);
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [rol, setRol] = useState("vendedor");
  const [vendedoresAsociados, setVendedoresAsociados] = useState([]);
  const [clientesAsociados, setClientesAsociados] = useState([]);
  const [mostrarPanel, setMostrarPanel] = useState(false);
  const [mostrarPanelClientes, setMostrarPanelClientes] = useState(false);
  const [editando, setEditando] = useState(false);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
  const [filtro, setFiltro] = useState("todos"); // Este será el filtro por nombre
  const [filtroRol, setFiltroRol] = useState("todos");
  const [fechaReporte, setFechaReporte] = useState(new Date().toISOString().split('T')[0]); // Default today // Nuevo filtro por rol

  const [vendedoresBase, setVendedoresBase] = useState([]);
  const [clientesBase, setClientesBase] = useState([]);
  const [buscadorClientes, setBuscadorClientes] = useState("");

  const token = localStorage.getItem("token");
  const navigate = useNavigate();
  const panelRef = useRef(null);
  const panelClientesRef = useRef(null);

  // === CARGAR USUARIOS ===
  const cargarUsuarios = useCallback(async () => {
    try {
      const res = await axios.get(
        `${process.env.REACT_APP_API_URL}/usuarios/todos`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = res.data.usuarios || [];
      setUsuarios(data);
      setUsuariosFiltrados(data);
    } catch (err) {
      console.error("Error al cargar usuarios:", err);
      // 🔥 NUEVO: Redirigir al login si el token expiró
      if (err.response?.status === 401) {
        localStorage.clear();
        navigate("/login", { replace: true });
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
        },
      );

      // Extraemos los nombres únicos de vendedores de la base de conocimiento
      const data = res.data.datos || [];
      const vendedoresUnicos = [
        ...new Set(
          data.map((item) => (item.Nombre_Vendedor || "").trim().toUpperCase()),
        ),
      ].filter((v) => v);

      setVendedoresBase(vendedoresUnicos);
    } catch (err) {
      console.error("Error al cargar vendedores de base de conocimiento:", err);
      // 🔥 NUEVO: Redirigir al login si el token expiró
      if (err.response?.status === 401) {
        localStorage.clear();
        navigate("/login", { replace: true });
        return;
      }
    }
  }, [token, navigate]); // 🔥 Agregar navigate como dependencia

  const cargarClientesBase = useCallback(async () => {
    try {
      // Cargar clientes desde endpoint optimizado
      const res = await axios.get(
        `${process.env.REACT_APP_API_URL}/excel/clientes_unicos`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      setClientesBase(res.data.clientes || []);
    } catch (err) {
      console.error("Error al cargar clientes de base de conocimiento:", err);
      // Redirigir al login si el token expiró
      if (err.response?.status === 401) {
        localStorage.clear();
        navigate("/login", { replace: true });
        return;
      }
    }
  }, [token, navigate]);


  useEffect(() => {
    cargarVendedoresBase();
  }, [cargarVendedoresBase]);

  useEffect(() => {
    cargarClientesBase();
  }, [cargarClientesBase]);

  // === FILTRO ===
  useEffect(() => {
    let filtrados = usuarios;

    // 1. Filtrar por Rol
    if (filtroRol !== "todos") {
      filtrados = filtrados.filter((u) => u.rol === filtroRol);
    }

    // 2. Filtrar por Nombre (respetando los filtrados por rol)
    if (filtro !== "todos") {
      filtrados = filtrados.filter(
        (u) =>
          u.nombre === filtro ||
          (u.vendedores_asociados || []).some(
            (c) => correoANombre[c] === filtro,
          ),
      );
    }

    setUsuariosFiltrados(filtrados);
  }, [filtro, filtroRol, usuarios, correoANombre]);

  // === CLIC FUERA PARA CERRAR PANELES ===
  useEffect(() => {
    const handleClickOutside = (e) => {
      // Cerrar panel de vendedores si el click fue fuera del panel
      if (
        mostrarPanel &&
        panelRef.current &&
        !panelRef.current.contains(e.target)
      ) {
        setMostrarPanel(false);
      }

      // Cerrar panel de clientes si el click fue fuera del panel
      if (
        mostrarPanelClientes &&
        panelClientesRef.current &&
        !panelClientesRef.current.contains(e.target)
      ) {
        setMostrarPanelClientes(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [mostrarPanel, mostrarPanelClientes]);

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

  // === TOGGLE CHECKBOX CLIENTES ===
  const toggleClienteAsociado = (cliente) => {
    const nitUpper = cliente.nit.toUpperCase();
    setClientesAsociados((prev) => {
      // Buscar si ya existe por NIT
      const index = prev.findIndex((c) => (c.nit || "").toUpperCase() === nitUpper);

      if (index >= 0) {
        // Ya está seleccionado → eliminarlo
        const newPrev = [...prev];
        newPrev.splice(index, 1);
        return newPrev;
      }
      // No está → agregarlo
      else {
        return [...prev, { nit: cliente.nit, nombre: cliente.nombre }];
      }
    });
  };

  // === SELECCIONAR TODOS LOS CLIENTES ===
  const seleccionarTodosClientes = () => {
    setClientesAsociados(
      clientesBase.map((c) => ({
        nit: c.nit.toUpperCase(),
        nombre: c.nombre.toUpperCase(),
      })),
    );
  };

  // === DESELECCIONAR TODOS LOS CLIENTES ===
  const deseleccionarTodosClientes = () => {
    setClientesAsociados([]);
  };

  // === VERIFICAR SI TODOS LOS CLIENTES ESTÁN SELECCIONADOS ===
  const todosSeleccionadosClientes = useMemo(() => {
    if (clientesBase.length === 0) return false;
    const clientesNitsSeleccionados = clientesAsociados.map((c) =>
      (c.nit || "").toUpperCase(),
    );
    return clientesBase.every((cliente) =>
      clientesNitsSeleccionados.includes((cliente.nit || "").toUpperCase()),
    );
  }, [clientesAsociados, clientesBase]);

  // === TOGGLE TODOS CLIENTES (seleccionar/deseleccionar todos) ===
  const toggleTodosClientes = () => {
    if (todosSeleccionadosClientes) {
      deseleccionarTodosClientes();
    } else {
      seleccionarTodosClientes();
    }
  };

  // === FILTRO CLIENTES POR BÚSQUEDA Y ORDENAMIENTO (Asociados primero) ===
  const clientesFiltrados = useMemo(() => {
    let lista = clientesBase;

    // 1. Filtrar por búsqueda
    if (buscadorClientes.trim()) {
      const termino = buscadorClientes.trim().toLowerCase();
      lista = lista.filter((cliente) => {
        const nitLower = (cliente.nit || "").toLowerCase();
        const nombreLower = (cliente.nombre || "").toLowerCase();
        return nitLower.includes(termino) || nombreLower.includes(termino);
      });
    }

    // 2. Ordenar: Asociados primero, luego alfabético
    return [...lista].sort((a, b) => {
      const nitA = (a.nit || "").toUpperCase();
      const nitB = (b.nit || "").toUpperCase();

      const esAsociadoA = clientesAsociados.some((c) => (c.nit || "").toUpperCase() === nitA);
      const esAsociadoB = clientesAsociados.some((c) => (c.nit || "").toUpperCase() === nitB);

      if (esAsociadoA && !esAsociadoB) return -1; // A va primero
      if (!esAsociadoA && esAsociadoB) return 1;  // B va primero

      // Si ambos son asociados o ambos no lo son, ordenar alfabéticamente por nombre
      return (a.nombre || "").localeCompare(b.nombre || "");
    });
  }, [clientesBase, buscadorClientes, clientesAsociados]);

  // === SELECCIONAR TODOS LOS VENDEDORES ===
  const seleccionarTodos = () => {
    setVendedoresAsociados(vendedoresBase.map((v) => (v || "").toUpperCase()));
  };

  // === DESELECCIONAR TODOS LOS VENDEDORES ===
  const deseleccionarTodos = () => {
    setVendedoresAsociados([]);
  };

  // === VERIFICAR SI TODOS ESTÁN SELECCIONADOS ===
  const todosSeleccionados = useMemo(() => {
    if (vendedoresBase.length === 0) return false;
    const vendedoresAsociadosUpper = vendedoresAsociados.map((v) =>
      (v || "").toUpperCase(),
    );
    return vendedoresBase.every((vendedor) =>
      vendedoresAsociadosUpper.includes((vendedor || "").toUpperCase()),
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
        vendedores_asociados: rol !== "cliente" ? vendedoresAsociados : [],
        clientes_asociados: rol === "cliente" ? clientesAsociados : [],
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
          },
        );
      } else {
        await axios.post(
          `${process.env.REACT_APP_API_URL}/usuarios/crear`,
          datos,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
      }

      setCorreo("");
      setPassword("");
      setNombre("");
      setRol("vendedor");
      setVendedoresAsociados([]);
      setClientesAsociados([]);
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
      (u.vendedores_asociados || []).map((v) => v.toUpperCase()),
    );
    // 🔹 Cargar clientes asociados si es cliente - ahora maneja objetos {nit, nombre}
    setClientesAsociados(
      (u.clientes_asociados || []).map((c) => {
        if (typeof c === "object" && c.nit) {
          return {
            nit: (c.nit || "").toUpperCase(),
            nombre: (c.nombre || c.nit || "").toUpperCase(),
          };
        }
        return { 
            nit: String(c || "").toUpperCase(), 
            nombre: String(c || "").toUpperCase() 
        };
      }),
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
        },
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
        },
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
        },
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
    const timer = setTimeout(
      () => {
        
        localStorage.clear();
        // 🔥 Forzar recarga completa para limpiar todo
        window.location.href = "/login";
      },
      30 * 60 * 1000,
    );
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

  const handleDescargarReportePagos = async () => {
    if (!fechaReporte) {
      alert("Por favor selecciona una fecha para el reporte.");
      return;
    }

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/pagos/reporte-excel?fecha=${fechaReporte}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        alert(errorData.error || "No se pudo generar el reporte de pagos.");
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = `Reporte_Pagos_${fechaReporte}.xlsx`;
      
      document.body.appendChild(a);
      a.click();
      
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

    } catch (error) {
      console.error("Error descargando reporte de pagos:", error);
      alert("Error al descargar el reporte.");
    }
  };

  return {
    usuarios,
    usuariosFiltrados,
    correo,
    setCorreo,
    password,
    setPassword,
    nombre,
    setNombre,
    rol,
    setRol,
    vendedoresAsociados,
    setVendedoresAsociados,
    clientesAsociados,
    setClientesAsociados,
    mostrarPanel,
    setMostrarPanel,
    mostrarPanelClientes,
    setMostrarPanelClientes,
    editando,
    setEditando,
    usuarioSeleccionado,
    setUsuarioSeleccionado,
    filtro,
    setFiltro,
    filtroRol,
    setFiltroRol,
    vendedoresBase,
    clientesBase,
    buscadorClientes,
    setBuscadorClientes,
    panelRef,
    panelClientesRef,
    correoANombre,
    toggleVendedorAsociado,
    toggleClienteAsociado,
    seleccionarTodosClientes,
    deseleccionarTodosClientes,
    todosSeleccionadosClientes,
    toggleTodosClientes,
    clientesFiltrados,
    seleccionarTodos,
    deseleccionarTodos,
    todosSeleccionados,
    toggleTodos,
    guardarUsuario,
    editarUsuario,
    eliminarUsuario,
    subirExcelBase,
    subirExcelCupo,
    cerrarSesion,
    formatearFecha,
    navigate,
    fechaReporte,
    setFechaReporte,
    handleDescargarReportePagos
  };
};
