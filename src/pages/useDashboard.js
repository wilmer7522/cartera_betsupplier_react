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
  if (raw === null || raw === undefined || raw === "") return NaN;
  const cleaned = String(raw)
    .replace(/\s/g, "")
    .replace(/\$/g, "")
    .replace(/\./g, "")
    .replace(/,/g, ".");
  const n = parseFloat(cleaned);
  return isNaN(n) ? NaN : n;
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
  const [columnaSeleccionada, setColumnaSeleccionada] = useState("");
  const [mostrarNotasCredito, setMostrarNotasCredito] = useState(false);
  const [cupoCartera, setCupoCartera] = useState([]);
  const [cupoSeleccionado, setCupoSeleccionado] = useState(null);
  const [columnaOrden, setColumnaOrden] = useState(null);
  const [direccionOrden, setDireccionOrden] = useState("asc");
  const [filtrosColumnas, setFiltrosColumnas] = useState({});
  const [columnaFiltroActiva, setColumnaFiltroActiva] = useState(null);

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
    []
  );

  // ========== CARGA DE DATOS OPTIMIZADA ==========
  const cargarDatos = useCallback(async () => {
    if (datosCargadosRef.current) return;

    try {
      setCargando(true);
      setMensaje("");

      const [resDashboard, resCupo] = await Promise.all([
        axios.get(`${process.env.REACT_APP_API_URL}/excel/ver_dashboard`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${process.env.REACT_APP_API_URL}/excel/ver_cupo_cartera`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const datosCargados = Array.isArray(resDashboard.data.datos)
        ? resDashboard.data.datos
        : [];
      const cupoData = Array.isArray(resCupo.data.datos)
        ? resCupo.data.datos
        : [];

      // Normalización más eficiente
      const datosNormalizados = datosCargados.map((item) => ({
        ...item,
        Saldo_num: parseNumber(item.Saldo ?? item.saldo ?? 0),
        Deuda_num: parseNumber(item.Deuda),
        Pagado_num: parseNumber(item.Pagado),
        Por_Venc_num: parseNumber(item.Por_Venc),
        Venc_0_30_num: parseNumber(item.Venc_0_30),
        Venc_31_60_num: parseNumber(item.Venc_31_60),
        Venc_61_90_num: parseNumber(item.Venc_61_90),
        Venc_91_num: parseNumber(item.Venc_91),
        DiasVc_num: parseNumber(item.DiasVc),
      }));

      setDatos(datosNormalizados);
      setCupoCartera(cupoData);

      // Extraer vendedores únicos de forma más eficiente
      const vendedoresSet = new Set();
      datosCargados.forEach((d) => {
        if (d.Nombre_Vendedor) vendedoresSet.add(d.Nombre_Vendedor);
      });
      setVendedoresDisponibles(Array.from(vendedoresSet));

      datosCargadosRef.current = true;
    } catch (err) {
      console.error("Error al obtener datos del dashboard:", err);
      if (err.response?.status === 401) {
        localStorage.clear();
        navigate("/login");
        return;
      }
      setMensaje("❌ Error al obtener los datos del dashboard o cupo cartera.");
    } finally {
      setCargando(false);
    }
  }, [token, navigate]);

  // Efecto de carga optimizado
  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // ========== BUSCAR CUPO CON DEBOUNCE ==========
  const buscarCupoPorNit = useCallback(
    (nit) => {
      if (!nit || !nit.toString().trim()) return null;
      const nitBusqueda = normalizeNit(nit);
      const cupoEncontrado = cupoCartera.find(
        (c) => normalizeNit(c["Mt_Cliente_Proveedor"]) === nitBusqueda
      );

      if (cupoEncontrado) {
        const raw = cupoEncontrado["Cupo_Credito_Cl"];
        const n = parseNumber(raw);
        return isNaN(n) ? null : n;
      }
      return null;
    },
    [cupoCartera]
  );

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(() => {
      setCupoSeleccionado(buscarCupoPorNit(busqueda));
    }, 300);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [busqueda, buscarCupoPorNit]);

  // ========== PROCESAMIENTO DE DATOS OPTIMIZADO ==========
  const datosConCupo = useMemo(() => {
    return datos.map((item) => {
      const nitBase = normalizeNit(item.Cliente);
      const cupoRelacionado = cupoCartera.find(
        (c) => normalizeNit(c["Mt_Cliente_Proveedor"]) === nitBase
      );

      const rawCupo = cupoRelacionado ? cupoRelacionado["Cupo_Credito_Cl"] : 0;
      const cupoValor = parseNumber(rawCupo) || 0;

      return {
        ...item,
        CUPO_CREDITO: cupoValor,
        CUPO_CREDITO_num: cupoValor,
      };
    });
  }, [datos, cupoCartera]);

  // ========== FILTRADO Y ORDENAMIENTO OPTIMIZADO ==========
  const datosFiltradosFinal = useMemo(() => {
    let arr = datosConCupo;

    // Aplicar filtros en cadena más eficiente
    if (busqueda.trim()) {
      const termino = busqueda.trim().toLowerCase();
      arr = arr.filter(
        (fila) =>
          (fila.Cliente || "").toString().toLowerCase().includes(termino) ||
          (fila.Nombre_Cliente || "").toString().toLowerCase().includes(termino)
      );
    }

    if (vendedoresSeleccionados.length > 0) {
      const vendedoresSet = new Set(
        vendedoresSeleccionados.map((v) => v.toLowerCase())
      );
      arr = arr.filter((fila) =>
        vendedoresSet.has((fila.Nombre_Vendedor || "").toLowerCase())
      );
    }

    if (columnaSeleccionada) {
      arr = arr.filter((fila) => {
        const valorNum = fila[`${columnaSeleccionada}_num`];
        return !isNaN(valorNum) && valorNum !== 0;
      });
    }

    // Filtros de columnas
    if (filtrosColumnas.Nombre_Zona?.length) {
      const zonasSet = new Set(filtrosColumnas.Nombre_Zona);
      arr = arr.filter((f) => zonasSet.has(f.Nombre_Zona));
    }

    if (filtrosColumnas.Nombre_Ciudad?.length) {
      const ciudadesSet = new Set(filtrosColumnas.Nombre_Ciudad);
      arr = arr.filter((f) => ciudadesSet.has(f.Nombre_Ciudad));
    }

    if (mostrarNotasCredito) {
      arr = arr.filter((fila) => fila.T_Dcto?.toUpperCase() === "NC");
    }

    // Ordenamiento optimizado
    if (columnaOrden) {
      arr = [...arr].sort((a, b) => {
        const keyNumA = a[`${columnaOrden}_num`];
        const keyNumB = b[`${columnaOrden}_num`];

        if (!isNaN(keyNumA) && !isNaN(keyNumB)) {
          return direccionOrden === "asc"
            ? keyNumA - keyNumB
            : keyNumB - keyNumA;
        }

        const valA = a[columnaOrden] ?? "";
        const valB = b[columnaOrden] ?? "";

        return direccionOrden === "asc"
          ? String(valA).localeCompare(String(valB))
          : String(valB).localeCompare(String(valA));
      });
    }

    return arr;
  }, [
    datosConCupo,
    busqueda,
    vendedoresSeleccionados,
    columnaSeleccionada,
    filtrosColumnas,
    mostrarNotasCredito,
    columnaOrden,
    direccionOrden,
  ]);

  // ========== CÁLCULOS MEMOIZADOS - CORREGIDOS ==========
  const valoresUnicosByCol = useMemo(() => {
    const res = {};
    const cols = ["Nombre_Zona", "Nombre_Ciudad"];
    cols.forEach((col) => {
      const valoresSet = new Set();
      datosFiltradosFinal.forEach((d) => {
        if (d[col]) valoresSet.add(d[col]);
      });
      res[col] = Array.from(valoresSet);
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
    [columnaSeleccionada]
  );

  // ========== CONTADORES CORREGIDOS ==========
  const contarPorColumna = useCallback(
    (col) => {
      if (columnaSeleccionada) {
        if (col !== columnaSeleccionada) return 0;
        return datosFiltradosFinal.filter((fila) => {
          const num = fila[`${col}_num`];
          return !isNaN(num) && num !== 0;
        }).length;
      }
      return datosFiltradosFinal.filter((fila) => {
        const num = fila[`${col}_num`];
        return !isNaN(num) && num !== 0;
      }).length;
    },
    [datosFiltradosFinal, columnaSeleccionada]
  );

  const { cantidadVencidas, totalVisible } = useMemo(() => {
    let cantidadVencidas = 0;
    const columnasVencidas = [
      "Venc_0_30",
      "Venc_31_60",
      "Venc_61_90",
      "Venc_91",
    ];

    if (columnaSeleccionada === "Por_Venc") {
      cantidadVencidas = 0;
    } else if (
      columnaSeleccionada &&
      columnasVencidas.includes(columnaSeleccionada)
    ) {
      cantidadVencidas = datosFiltradosFinal.filter((fila) => {
        const num = fila[`${columnaSeleccionada}_num`];
        return !isNaN(num) && num !== 0;
      }).length;
    } else {
      columnasVencidas.forEach((col) => {
        cantidadVencidas += datosFiltradosFinal.filter((fila) => {
          const num = fila[`${col}_num`];
          return !isNaN(num) && num !== 0;
        }).length;
      });
    }

    const totalVisible = datosFiltradosFinal.reduce((acc, f) => {
      const n = f.Saldo_num;
      return !isNaN(n) ? acc + n : acc;
    }, 0);

    return { cantidadVencidas, totalVisible };
  }, [datosFiltradosFinal, columnaSeleccionada]);

  // ========== GRÁFICAS OPTIMIZADAS ==========
  const generarDatosGrafica = useCallback(() => {
    const categorias = [
      "Por_Venc",
      "Venc_0_30",
      "Venc_31_60",
      "Venc_61_90",
      "Venc_91",
    ];

    return categorias.map((col) => {
      let cantidad = 0;
      let monto = 0;

      datosFiltradosFinal.forEach((fila) => {
        const num = fila[`${col}_num`];
        if (!isNaN(num) && num !== 0) {
          if (!columnaSeleccionada || col === columnaSeleccionada) {
            cantidad += 1;
            monto += num;
          }
        }
      });

      return {
        categoria: nombresColumnas[col].replace(/[^a-zA-Z0-9 ]/g, ""),
        cantidad,
        monto,
      };
    });
  }, [datosFiltradosFinal, columnaSeleccionada, nombresColumnas]);

  const datosGrafica = useMemo(
    () => generarDatosGrafica(),
    [generarDatosGrafica]
  );

  const datosGraficaConTotal = useMemo(() => {
    const totalCantidad = datosGrafica
      .slice(1)
      .reduce((sum, d) => sum + d.cantidad, 0);
    const totalMonto = datosGrafica
      
      .reduce((sum, d) => sum + d.monto, 0);

    return [
      ...datosGrafica,
      { categoria: "TOTAL", cantidad: totalCantidad, monto: totalMonto },
    ];
  }, [datosGrafica]);

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
    const timer = setTimeout(() => {
      console.log("🔄 Cerrando sesión automáticamente...");
      localStorage.clear();
      // 🔥 Forzar recarga completa para limpiar todo
      window.location.href = "/login";
    }, 30 * 60 * 1000);
    return () => clearTimeout(timer);
  }, []);

  // ========== FUNCIONES DE NAVEGACIÓN ==========
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });
  const scrollToBottom = () =>
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: "smooth",
    });

  // ========== FUNCIÓN DESCARGAR EXCEL ==========
  const handleDescargarExcel = async () => {
    const filtros = {
      vendedoresSeleccionados,
      busqueda,
      mostrarNotasCredito,
      columnaSeleccionada,
    };

    const response = await fetch(
      `${process.env.REACT_APP_API_URL}/excel/descargar_filtrado`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(filtros),
      }
    );

    if (!response.ok) {
      alert("No se pudo generar el Excel filtrado.");
      return;
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "base_conocimiento_filtrado.xlsx";
    a.click();
    window.URL.revokeObjectURL(url);
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
    datosConCupo,
    valoresUnicosByCol,
    columnasParaTabla,
    datosGraficaConTotal,

    // Estadísticas
    cantidadVencidas,
    totalVisible,

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
  };
};
