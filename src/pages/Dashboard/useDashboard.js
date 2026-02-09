import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

// Constantes fuera del componente para evitar recreación
const GRUPO_ZONAS = [
  "Por_Venc",
  "Venc_0_30",
  "Venc_31_60",
  "Venc_61_90",
  "Venc_91",
];
const COLUMNAS_VISIBLES = [
  "Cliente",
  "Nombre_Cliente",
  "Nombre_Zona",
  "Nombre_Ciudad",
  "Nombre_Vendedor",
  "Documento",
  "F_Expedic",
  "F_Vencim",
  "DiasVc",
  "Deuda",
  "Pagado",
  "Por_Venc",
  "Venc_0_30",
  "Venc_31_60",
  "Venc_61_90",
  "Venc_91",
  "Saldo",
  "CUPO_CREDITO",
];
const NOMBRES_COLUMNAS_PERSONALIZADOS = {
  Cliente: "Nit",
  Nombre_Cliente: "Cliente",
  Nombre_Zona: "Zona",
  Nombre_Ciudad: "Ciudad",
  Nombre_Vendedor: "Vendedor",
  Documento: "Documento",
  F_Expedic: "Fecha Exp",
  F_Vencim: "Fecha Venc",
  DiasVc: "Días Venc",
  Deuda: "Valor Fcta",
  Pagado: "Abono",
  Por_Venc: "Por Vencer",
  Venc_0_30: "Vencido 0-30 días",
  Venc_31_60: "Vencido 31-60 días",
  Venc_61_90: "Vencido 61-90 días",
  Venc_91: "Vencido >90 días",
  Saldo: "Saldo",
  CUPO_CREDITO: "Cupo",
};
const MONETARY_COLUMNS = new Set([
  "Pagado",
  "Por_Venc",
  "Venc_0_30",
  "Venc_31_60",
  "Venc_61_90",
  "Venc_91",
  "Deuda",
  "Saldo",
  "CUPO_CREDITO",
]);

// Helper functions
const parseNumber = (raw) => {
  if (typeof raw === "number") return raw;
  if (raw === null || raw === undefined || raw === "") return 0; // Changed from NaN to 0
  const cleaned = String(raw)
    .replace(/\s/g, "")
    .replace(/\$/g, "")
    .replace(/\./g, "")
    .replace(/,/g, ".");
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n; // Changed from NaN to 0
};

const formatIntegerWithDots = (raw) => {
  const n = typeof raw === "number" ? raw : parseNumber(raw);
  if (isNaN(n)) return raw ?? "";
  const rounded = Math.round(n);
  const sign = rounded < 0 ? "-" : "";
  const abs = Math.abs(rounded).toString();
  return sign + abs.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

const normalizeNit = (v) =>
  (v || "")
    .toString()
    .replace(/\s|\.|-/g, "")
    .trim();

export const useDashboard = () => {
  // ========== ESTADOS ==========
  const [datos, setDatos] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(true);
  const [vendedoresDisponibles, setVendedoresDisponibles] = useState([]);
  const [vendedoresSeleccionados, setVendedoresSeleccionados] = useState([]);
  const [mostrarVendedores1, setMostrarVendedores1] = useState(false);
  const [clientesDisponibles, setClientesDisponibles] = useState([]);
  const [clientesSeleccionados, setClientesSeleccionados] = useState([]);
  const [mostrarClientes1, setMostrarClientes1] = useState(false);
  const [paginaClientes, setPaginaClientes] = useState(1);
  const [clientesTotales, setClientesTotales] = useState(0);
  const [clientesHasNextPage, setClientesHasNextPage] = useState(false);
  const [clientesHasPrevPage, setClientesHasPrevPage] = useState(false);
  const [cargandoClientes, setCargandoClientes] = useState(false);
  const [columnaSeleccionada, setColumnaSeleccionada] = useState("");
  const [mostrarNotasCredito, setMostrarNotasCredito] = useState(false);
  const [cupoCartera, setCupoCartera] = useState([]);
  const [cupoSeleccionado, setCupoSeleccionado] = useState(null);
  const [columnaOrden, setColumnaOrden] = useState(null);
  const [direccionOrden, setDireccionOrden] = useState("asc");
  const [filtrosColumnas, setFiltrosColumnas] = useState({});
  const [columnaFiltroActiva, setColumnaFiltroActiva] = useState(null);
  const [busquedaDebounce, setBusquedaDebounce] = useState("");
  const [pagina, setPagina] = useState(1);
  const itemsPorPagina = 50;

  // Resetear página cuando cambian los filtros
  useEffect(() => {
    setPagina(1);
  }, [busquedaDebounce, vendedoresSeleccionados, clientesSeleccionados, filtrosColumnas, columnaSeleccionada, mostrarNotasCredito]);

  // Referencias para optimización
  const datosCargadosRef = useRef(false);
  const timeoutRef = useRef(null);

  // ========== CONSTANTES ==========
  const token = localStorage.getItem("token");
  const rol = localStorage.getItem("rol");
  const nombreUsuario = localStorage.getItem("nombre");
  const navigate = useNavigate();

  // Nombres para las gráficas
  const nombresColumnas = useMemo(
    () => ({
      Por_Venc: "💰 Por Vencer",
      Venc_0_30: "📅 Vencido 0-30 dias",
      Venc_31_60: "⏳ Vencido 31-60 dias",
      Venc_61_90: "⌛ Vencido 61-90 dias",
      Venc_91: "⚠️ Mas de 90 dias",
    }),
    [],
  );

  // ========== CARGA DE DATOS ==========
  const cargarDatos = useCallback(
    async () => {
      try {
        setCargando(true);
        setMensaje("");
        const headers = { Authorization: `Bearer ${token}` };

        // 1. Cargar Cupo Cartera
        const resCupo = await axios.get(`${process.env.REACT_APP_API_URL}/excel/ver_cupo_cartera`, { headers });
        setCupoCartera(resCupo.data.datos || []);

        // 2. Cargar Datos del Dashboard (Full)
        const resDashboard = await axios.get(`${process.env.REACT_APP_API_URL}/excel/ver_dashboard`, {
            headers, params: { limit: 50000 },
        });

        const datosCargados = resDashboard.data.datos || [];
        const datosNormalizados = datosCargados.map((item) => ({
          ...item,
          Saldo_num: parseNumber(item.Saldo ?? 0),
          Deuda_num: parseNumber(item.Deuda ?? 0), 
          Pagado_num: parseNumber(item.Pagado ?? 0),
          Por_Venc_num: parseNumber(item.Por_Venc ?? 0), 
          Venc_0_30_num: parseNumber(item.Venc_0_30 ?? 0),
          Venc_31_60_num: parseNumber(item.Venc_31_60 ?? 0), 
          Venc_61_90_num: parseNumber(item.Venc_61_90 ?? 0),
          Venc_91_num: parseNumber(item.Venc_91 ?? 0), 
          DiasVc_num: parseNumber(item.DiasVc ?? 0),
        }));

        setDatos(datosNormalizados);

        // Extraer Vendedores Disponibles
        const vendedoresSet = new Set();
        datosNormalizados.forEach((d) => { if (d.Nombre_Vendedor) vendedoresSet.add(d.Nombre_Vendedor); });
        setVendedoresDisponibles(Array.from(vendedoresSet).sort());

        // Extraer Clientes Disponibles (Para todos los roles)
        const clientesMap = new Map();
        datosNormalizados.forEach((d) => {
          if (d.Cliente) {
            const nit = d.Cliente.toString().trim();
            const nombre = d.Nombre_Cliente || d.Nombre || nit;
            if (!clientesMap.has(nit)) { clientesMap.set(nit, { nit, nombre }); }
          }
        });
        const listaClientes = Array.from(clientesMap.values()).sort((a,b) => a.nombre.localeCompare(b.nombre));
        setClientesDisponibles(listaClientes);

        // Si es rol cliente y no hay selección previa, seleccionar todos por defecto
        if (rol === "cliente") {
            setClientesSeleccionados(prev => prev.length === 0 ? listaClientes : prev);
        }

        datosCargadosRef.current = true;
      } catch (err) {
        console.error("Error al obtener datos del dashboard:", err);
        if (err.response?.status === 401) { localStorage.clear(); navigate("/login"); return; }
        setMensaje("❌ Error al obtener los datos del dashboard.");
      } finally {
        setCargando(false);
      }
    },
    [token, navigate, rol],
  );

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos, vendedoresSeleccionados, clientesSeleccionados, mostrarNotasCredito]);

  // ========== BUSCAR CUPO CON DEBOUNCE ==========
  const buscarCupoPorNit = useCallback(
    (nit) => {
      if (!nit || !nit.toString().trim()) return null;
      const nitBusqueda = normalizeNit(nit);
      const cupoEncontrado = cupoCartera.find(
        (c) => normalizeNit(c["Mt_Cliente_Proveedor"]) === nitBusqueda,
      );

      if (cupoEncontrado) {
        const raw = cupoEncontrado["Cupo_Credito_Cl"];
        const n = parseNumber(raw);
        return isNaN(n) ? null : n;
      }
      return null;
    },
    [cupoCartera],
  );

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(() => {
      setCupoSeleccionado(buscarCupoPorNit(busqueda));
      setBusquedaDebounce(busqueda); // 🔥 Actualizar búsqueda debounced
    }, 300);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [busqueda, buscarCupoPorNit]);

  // ========== PROCESAMIENTO DE DATOS ==========
  const datosConCupo = useMemo(() => {
    // 🔥 Optimización: Crear un Map para búsqueda instantánea de cupos O(1)
    const cupoMap = new Map();
    cupoCartera.forEach(c => {
        const nit = normalizeNit(c["Mt_Cliente_Proveedor"]);
        if (nit) cupoMap.set(nit, c);
    });

    return datos.map((item) => {
      const nitBase = normalizeNit(item.Cliente);
      const cupoRelacionado = cupoMap.get(nitBase);

      const rawCupo = cupoRelacionado ? cupoRelacionado["Cupo_Credito_Cl"] : 0;
      const cupoValor = parseNumber(rawCupo) || 0;

      return {
        ...item,
        CUPO_CREDITO: cupoValor,
        CUPO_CREDITO_num: cupoValor,
      };
    });
  }, [datos, cupoCartera]);

  // ========== FILTRADO Y ORDENAMIENTO LOCAL ==========
  const datosFiltradosFinal = useMemo(() => {
    let arr = datosConCupo;

    // 1. Buscador (Usar versión debounced para evitar lag al escribir)
    if (busquedaDebounce.trim().length > 0) {
      const term = busquedaDebounce.toLowerCase().trim();
      arr = arr.filter((f) => 
        (f.Nombre_Cliente || "").toLowerCase().includes(term) ||
        (f.Cliente || "").toString().toLowerCase().includes(term) ||
        (f.Nombre_Vendedor || "").toLowerCase().includes(term) ||
        (f.Documento || "").toString().toLowerCase().includes(term)
      );
    }

    // 2. Vendedores Seleccionados
    if (vendedoresSeleccionados.length > 0) {
      const vendedoresSet = new Set(vendedoresSeleccionados.map((v) => v.toLowerCase()));
      arr = arr.filter((fila) => vendedoresSet.has((fila.Nombre_Vendedor || "").toLowerCase()));
    }

    // 3. Clientes Seleccionados
    if (clientesSeleccionados.length > 0) {
      const nitsSeleccionadosMap = new Map();
      clientesSeleccionados.forEach(c => {
          const nit = normalizeNit(c.nit);
          if (nit) {
              nitsSeleccionadosMap.set(nit, true);
              if (nit.length > 5) nitsSeleccionadosMap.set(nit.substring(0, nit.length - 1), true);
          }
      });
      
      arr = arr.filter((fila) => {
        const nitRegistro = normalizeNit(fila.Cliente);
        if (!nitRegistro) return false;
        
        // Match exacto o contra base sin DV
        if (nitsSeleccionadosMap.has(nitRegistro)) return true;
        if (nitRegistro.length > 5 && nitsSeleccionadosMap.has(nitRegistro.substring(0, nitRegistro.length - 1))) return true;
        
        return false;
      });
    }

    // 4. Filtro por Columna (Barra de Gráfica)
    if (columnaSeleccionada) {
      arr = arr.filter((fila) => {
        const valorNum = fila[`${columnaSeleccionada}_num`];
        return !isNaN(valorNum) && valorNum !== 0;
      });
    }

    // 5. Filtros de Columnas adicionales (Zona/Ciudad)
    if (filtrosColumnas.Nombre_Zona?.length) {
      const zonasSet = new Set(filtrosColumnas.Nombre_Zona);
      arr = arr.filter((f) => zonasSet.has(f.Nombre_Zona));
    }
    if (filtrosColumnas.Nombre_Ciudad?.length) {
      const ciudadesSet = new Set(filtrosColumnas.Nombre_Ciudad);
      arr = arr.filter((f) => ciudadesSet.has(f.Nombre_Ciudad));
    }

    // 6. Notas de Crédito
    if (mostrarNotasCredito) {
      arr = arr.filter((fila) => fila.T_Dcto?.toUpperCase() === "NC");
    }

    // 7. Ordenamiento
    if (columnaOrden) {
      arr = [...arr].sort((a, b) => {
        const keyNumA = a[`${columnaOrden}_num`] ?? a[columnaOrden];
        const keyNumB = b[`${columnaOrden}_num`] ?? b[columnaOrden];

        if (typeof keyNumA === "number" && typeof keyNumB === "number") {
          return direccionOrden === "asc" ? keyNumA - keyNumB : keyNumB - keyNumA;
        }

        const valA = String(a[columnaOrden] ?? "").toLowerCase();
        const valB = String(b[columnaOrden] ?? "").toLowerCase();
        return direccionOrden === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
      });
    }

    return arr;
  }, [
    datosConCupo,
    busquedaDebounce,
    vendedoresSeleccionados,
    clientesSeleccionados,
    columnaSeleccionada,
    filtrosColumnas,
    mostrarNotasCredito,
    columnaOrden,
    direccionOrden,
  ]);

  // ========== PAGINACIÓN ==========
  const totalPaginas = Math.ceil(datosFiltradosFinal.length / itemsPorPagina);
  const datosPaginados = useMemo(() => {
    const inicio = (pagina - 1) * itemsPorPagina;
    return datosFiltradosFinal.slice(inicio, inicio + itemsPorPagina);
  }, [datosFiltradosFinal, pagina, itemsPorPagina]);

  // ========== CÁLCULOS MEMOIZADOS ==========
  const valoresUnicosByCol = useMemo(() => {
    const res = {};
    const cols = ["Nombre_Zona", "Nombre_Ciudad"];
    cols.forEach((col) => {
      const valoresSet = new Set();
      datosFiltradosFinal.forEach((d) => { if (d[col]) valoresSet.add(d[col]); });
      res[col] = Array.from(valoresSet).sort();
    });
    return res;
  }, [datosFiltradosFinal]);

  const columnasParaTabla = useMemo(
    () =>
      COLUMNAS_VISIBLES.map((col) => {
        if (GRUPO_ZONAS.includes(col)) {
          return columnaSeleccionada === col ? col : null;
        }
        if (col === "Nombre_Zona" || col === "Nombre_Ciudad") return col;
        return col;
      }).filter(Boolean),
    [columnaSeleccionada],
  );

  const contarPorColumna = useCallback(
    (col) => {
      // Siempre contamos sobre los datos filtrados (sin el filtro de la propia columna para que las demás barras no mueran)
      // Pero para simplicidad en la reversión, lo hacemos sobre lo visible.
      return datosFiltradosFinal.filter((f) => (f[`${col}_num`] || 0) !== 0).length;
    },
    [datosFiltradosFinal],
  );

  const { cantidadVencidas, totalVisible } = useMemo(() => {
    let vencidas = 0;
    const columnasVencidas = ["Venc_0_30", "Venc_31_60", "Venc_61_90", "Venc_91"];
    
    // Contar facturas únicas que tengan saldo en alguna categoría de vencido
    datosFiltradosFinal.forEach(fila => {
        const esVencida = columnasVencidas.some(col => (fila[`${col}_num`] || 0) > 0);
        if (esVencida) vencidas++;
    });

    const visibleTotal = datosFiltradosFinal.reduce((acc, f) => acc + (f.Saldo_num || 0), 0);

    return { cantidadVencidas: vencidas, totalVisible: visibleTotal };
  }, [datosFiltradosFinal]);

  // ========== GRÁFICA ==========
  const datosGraficaConTotal = useMemo(() => {
    const categorias = [
      { key: "Por_Venc", label: "Por Vencer", color: "#28a745" },
      { key: "Venc_0_30", label: "Vencido 0-30 días", color: "#ffc107" },
      { key: "Venc_31_60", label: "Vencido 31-60 días", color: "#fd7e14" },
      { key: "Venc_61_90", label: "Vencido 61-90 días", color: "#dc3545" },
      { key: "Venc_91", label: "Mas de 90 dias", color: "#6c757d" },
    ];

    const baseGrafica = categorias.map((cat) => {
      const filasEnCategoria = datosFiltradosFinal.filter(f => (f[`${cat.key}_num`] || 0) !== 0);
      return {
        categoria: cat.label,
        cantidad: filasEnCategoria.length,
        monto: filasEnCategoria.reduce((acc, f) => acc + (f[`${cat.key}_num`] || 0), 0),
        fill: cat.color,
      };
    });

    const totalEfectivo = baseGrafica.reduce((acc, b) => acc + b.monto, 0);

    return [
      ...baseGrafica,
      { categoria: "TOTAL", cantidad: cantidadVencidas, monto: totalEfectivo, fill: "#8884d8" }
    ];
  }, [datosFiltradosFinal, cantidadVencidas]);
  const cargarClientesPaginados = useCallback(async (pagina = 1) => {
    if (rol !== "cliente") return;

    try {
      setCargandoClientes(true);
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/excel/clientes_paginados`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { page: pagina, limit: 50 },
        },
      );

      const { clientes, total, currentPage, hasNextPage, hasPrevPage } = response.data;
      setClientesDisponibles(clientes);
      setClientesTotales(total);
      setPaginaClientes(currentPage);
      setClientesHasNextPage(hasNextPage);
      setClientesHasPrevPage(hasPrevPage);
    } catch (error) {
      console.error("Error al cargar clientes paginados:", error);
      setClientesDisponibles([]);
      setClientesTotales(0);
      setClientesHasNextPage(false);
      setClientesHasPrevPage(false);
    } finally {
      setCargandoClientes(false);
    }
  }, [rol, token]);

  // Efecto para cargar clientes paginados cuando se abre el panel
  useEffect(() => {
    if (mostrarClientes1 && rol === "cliente") {
      cargarClientesPaginados(paginaClientes);
    }
  }, [mostrarClientes1, rol, cargarClientesPaginados, paginaClientes]);

  // ========== FUNCIONES DE INTERACCIÓN ==========
  const filtrarPorClienteFila = useCallback((cliente) => {
    const nitCliente = cliente?.toString().trim();
    setBusqueda(nitCliente);
  }, []);

  const seleccionarColumna = useCallback((col) => {
    if (col === "Nombre_Zona" || col === "Nombre_Ciudad") return;
    setColumnaSeleccionada((prev) => (prev === col ? "" : col));
  }, []);

  const cerrarSesion = () => {
    localStorage.clear();
    window.location.href = "/login"; // 🔥 CAMBIADO
  };

  const formatYAxisTick = useCallback((value) => {
    const n = typeof value === "number" ? value : parseNumber(value);
    if (isNaN(n)) return value;
    const abs = Math.abs(n);
    const sign = n < 0 ? "-" : "";
    if (abs >= 1000000) {
      const m = Math.round(n / 1000000);
      return sign + formatIntegerWithDots(m) + "M";
    }
    if (abs >= 1000) {
      const k = Math.round(n / 1000);
      return sign + formatIntegerWithDots(k) + "k";
    }
    return formatIntegerWithDots(n);
  }, []);

  // ========== EFECTOS SECUNDARIOS ==========
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        !e.target.closest(".panel-vendedores") &&
        !e.target.closest(".btn-toggle-vendedores")
      ) {
        setMostrarVendedores1(false);
      }
      setColumnaFiltroActiva(null);
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

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

  // ========== FUNCIONES DE NAVEGACIÓN ==========
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });
  // ========== ESTADÍSTICAS GLOBALES (SIN FILTROS) ==========
  const statsGlobales = useMemo(() => {
    const columnasVencidas = ["Venc_0_30", "Venc_31_60", "Venc_61_90", "Venc_91"];
    let vencidas = 0;
    
    datosConCupo.forEach(fila => {
        const esVencida = columnasVencidas.some(col => (fila[`${col}_num`] || 0) > 0);
        if (esVencida) vencidas++;
    });

    const res = {
        cantidadVencidas: vencidas,
        totalSaldo: datosConCupo.reduce((acc, f) => acc + (f.Saldo_num || 0), 0),
    };

    GRUPO_ZONAS.forEach(col => {
        const filas = datosConCupo.filter(f => (f[`${col}_num`] || 0) !== 0);
        res[col] = filas.length;
        res[`total_${col}`] = filas.reduce((acc, f) => acc + (f[`${col}_num`] || 0), 0);
    });

    return res;
  }, [datosConCupo]);

  const scrollToBottom = () =>
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: "smooth",
    });

  // ========== FUNCIÓN DESCARGAR EXCEL ==========
  // ========== FUNCIÓN DESCARGAR EXCEL CORREGIDA ==========
  const handleDescargarExcel = async () => {
    try {
      const token = localStorage.getItem("token");
      const filtros = {
        vendedoresSeleccionados,
        busqueda: busquedaDebounce, // Usamos la búsqueda estabilizada
        mostrarNotasCredito,
        columnaSeleccionada,
      };

      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/excel/descargar_filtrado`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(filtros),
        }
      );

      if (!response.ok) {
        // Si el backend envía un error (ej: 404 o 403), lo mostramos
        const errorData = await response.json().catch(() => ({}));
        alert(errorData.detail || "No se pudo generar el Excel filtrado.");
        return;
      }

      // Convertir a blob y disparar descarga
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = `Cartera_Filtrada_${new Date().toISOString().slice(0, 10)}.xlsx`;
      
      document.body.appendChild(a);
      a.click();
      
      // Limpieza necesaria
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

    } catch (error) {
      console.error("Error en la descarga:", error);
      alert("Error de conexión al generar el Excel.");
    }
  };



  // ========== RETORNO DE TODA LA LÓGICA ==========
  return {
    // Estados
    busqueda,
    setBusqueda,
    mensaje,
    cargando,
    vendedoresDisponibles,
    vendedoresSeleccionados,
    setVendedoresSeleccionados,
    mostrarVendedores1,
    setMostrarVendedores1,
    clientesDisponibles,
    clientesSeleccionados,
    setClientesSeleccionados,
    mostrarClientes1,
    setMostrarClientes1,
    paginaClientes,
    setPaginaClientes,
    clientesTotales,
    clientesHasNextPage,
    clientesHasPrevPage,
    cargandoClientes,
    columnaSeleccionada,
    mostrarNotasCredito,
    setMostrarNotasCredito,
    cupoSeleccionado,
    setCupoSeleccionado,
    columnaOrden,
    setColumnaOrden,
    direccionOrden,
    setDireccionOrden,
    filtrosColumnas,
    setFiltrosColumnas,
    columnaFiltroActiva,
    setColumnaFiltroActiva,

    // Datos procesados
    datosFiltradosFinal,
    datosPaginados,
    pagina,
    setPagina,
    totalPaginas,
    datosConCupo,
    valoresUnicosByCol,
    columnasParaTabla,
    datosGraficaConTotal,

    // Estadísticas
    cantidadVencidas,
    totalVisible,
    statsGlobales, // Devuelto como memo

    // Constantes
    rol,
    nombreUsuario,
    GRUPO_ZONAS,
    NOMBRES_COLUMNAS_PERSONALIZADOS,
    MONETARY_COLUMNS,
    nombresColumnas,

    // Funciones
    filtrarPorClienteFila,
    seleccionarColumna,
    cerrarSesion,
    formatIntegerWithDots,
    formatYAxisTick,
    contarPorColumna,
    scrollToTop,
    scrollToBottom,
    handleDescargarExcel,
    cargarClientesPaginados,
    cargandoGlobal: cargando, // Mantenido para compatibilidad
  };
};
