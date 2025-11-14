import { useEffect, useState, useCallback, useMemo } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from "recharts";

export default function Dashboard() {
  const [datos, setDatos] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [columnasVisibles] = useState([
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
    "CUPO_CREDITO", // ✅ Nueva columna
  ]);

  const [cargando, setCargando] = useState(true);

  const nombresColumnasPersonalizados = {
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

  const [vendedoresDisponibles, setVendedoresDisponibles] = useState([]);
  const [vendedoresSeleccionados, setVendedoresSeleccionados] = useState([]);
  const [mostrarVendedores1, setMostrarVendedores1] = useState(false);
  const [mostrarVendedores2, setMostrarVendedores2] = useState(false);
  const [columnaSeleccionada, setColumnaSeleccionada] = useState("");
  const [mostrarNotasCredito, setMostrarNotasCredito] = useState(false);
  const [cupoCartera, setCupoCartera] = useState([]);
  const [cupoSeleccionado, setCupoSeleccionado] = useState(null);
  const [columnaOrden, setColumnaOrden] = useState(null);
  const [direccionOrden, setDireccionOrden] = useState("asc"); // o "desc"
  const [filtrosColumnas, setFiltrosColumnas] = useState({});
  const [columnaFiltroActiva, setColumnaFiltroActiva] = useState(null);

  const token = localStorage.getItem("token");
  const rol = localStorage.getItem("rol");
  const nombreUsuario = localStorage.getItem("nombre");
  const navigate = useNavigate();

  const grupoZonas = [
    "Por_Venc",
    "Venc_0_30",
    "Venc_31_60",
    "Venc_61_90",
    "Venc_91",
  ];

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

  // === Cargar Dashboard + Cupo Cartera ===
  const cargarDatos = useCallback(async () => {
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

      // Normalizar y preparsear campos numéricos para evitar reparsing en cada render
      const parseNum = (raw) => {
        if (raw === null || raw === undefined || raw === "") return NaN;
        const cleaned = String(raw)
          .replace(/\s/g, "")
          .replace(/\$/g, "")
          .replace(/\./g, "")
          .replace(/,/g, ".");
        const n = parseFloat(cleaned);
        return isNaN(n) ? NaN : n;
      };

      const datosNormalizados = datosCargados.map((item) => ({
        ...item,
        Saldo_num: parseNum(item.Saldo ?? item.saldo ?? 0),
        Deuda_num: parseNum(item.Deuda),
        Pagado_num: parseNum(item.Pagado),
        Por_Venc_num: parseNum(item.Por_Venc),
        Venc_0_30_num: parseNum(item.Venc_0_30),
        Venc_31_60_num: parseNum(item.Venc_31_60),
        Venc_61_90_num: parseNum(item.Venc_61_90),
        Venc_91_num: parseNum(item.Venc_91),
        DiasVc_num: parseNum(item.DiasVc),
        // CUPO_CREDITO se ligará más adelante cuando unamos con cupoCartera
      }));

      setDatos(datosNormalizados);
      setCupoCartera(cupoData);

      const nombresVendedores = [
        ...new Set(datosCargados.map((d) => d.Nombre_Vendedor).filter(Boolean)),
      ];
      setVendedoresDisponibles(nombresVendedores);
    } catch (err) {
      console.error("Error al obtener datos del dashboard:", err);
      setMensaje("❌ Error al obtener los datos del dashboard o cupo cartera.");
    } finally {
      setCargando(false);
    }
  }, [token]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // === Mostrar cupo cuando se escribe o pega el NIT en el buscador ===
  // === Mostrar cupo cuando se escribe o pega el NIT en el buscador ===
  useEffect(() => {
    if (!busqueda.trim()) {
      setCupoSeleccionado(null);
      return;
    }

    const normalizeNit = (v) =>
      (v || "")
        .toString()
        .replace(/\s|\.|-/g, "")
        .trim();

    const nitBusqueda = normalizeNit(busqueda);

    // Detectar las columnas correctas de NIT y CUPO automáticamente
    const sample = cupoCartera[0] || {};
    const columnas = Object.keys(sample).reduce(
      (acc, key) => {
        const limpio = key.replace(/\s|-/g, "").toUpperCase();
        if (limpio.includes("NIT")) acc.nit = key;
        if (limpio.includes("CUPO") && limpio.includes("CREDITO"))
          acc.cupo = key;
        return acc;
      },
      { nit: null, cupo: null }
    );

    const cupoEncontrado = cupoCartera.find((c) => {
      const nitCupo = normalizeNit(c[columnas.nit]);
      return nitCupo === nitBusqueda;
    });

    if (cupoEncontrado) {
      const raw = cupoEncontrado[columnas.cupo];
      const cleaned = String(raw)
        .replace(/\s/g, "")
        .replace(/\$/g, "")
        .replace(/\./g, "")
        .replace(/,/g, ".");
      const n = parseFloat(cleaned);
      setCupoSeleccionado(isNaN(n) ? null : n);
    } else {
      setCupoSeleccionado(null);
    }
  }, [busqueda, cupoCartera]);

  // === Relacionar Cupo Cartera con Base de Conocimiento ===
  // === Relacionar Cupo Cartera con Base de Conocimiento ===
  const datosConCupo = useMemo(() => {
    // 🔹 Función para limpiar NIT
    const normalizeNit = (v) =>
      (v || "")
        .toString()
        .replace(/\s|\.|-/g, "")
        .trim();

    // 🔹 Detectar nombres de columnas que contienen NIT y CUPO
    const sample = cupoCartera[0] || {};
    const columnas = Object.keys(sample).reduce(
      (acc, key) => {
        const limpio = key.replace(/\s|-/g, "").toUpperCase();
        if (limpio.includes("NIT")) acc.nit = key;
        if (limpio.includes("CUPO") && limpio.includes("CREDITO"))
          acc.cupo = key;
        return acc;
      },
      { nit: null, cupo: null }
    );

    console.log("🧩 Columnas detectadas:", columnas);

    return datos.map((item) => {
      const nitBase = normalizeNit(item.Cliente);

      // Buscar coincidencia de NIT (ignorando espacios y guiones)
      const cupoRelacionado = cupoCartera.find((c) => {
        const nitCupo = normalizeNit(c[columnas.nit]);
        return nitCupo === nitBase;
      });

      // Extraer y limpiar el cupo
      const rawCupo = cupoRelacionado ? cupoRelacionado[columnas.cupo] : 0;

      const cupoValor = (() => {
        if (!rawCupo) return 0;
        const cleaned = String(rawCupo)
          .replace(/\s/g, "")
          .replace(/\$/g, "")
          .replace(/\./g, "")
          .replace(/,/g, ".");
        const n = parseFloat(cleaned);
        return isNaN(n) ? 0 : n;
      })();

      return {
        ...item,
        CUPO_CREDITO: cupoValor,
        CUPO_CREDITO_num: cupoValor,
      };
    });
  }, [datos, cupoCartera]);

  // Helper: devuelve los datos filtrados por los filtros globales pero
  // opcionalmente excluyendo el filtro aplicado a una columna específica.

  const seleccionarColumna = (col) => {
    if (col === "Nombre_Zona" || col === "Nombre_Ciudad") return; // No toca columnaSeleccionada
    setColumnaSeleccionada((prev) => (prev === col ? "" : col));
  };

  const cerrarSesion = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  // === FILTRAR CLIENTE Y MOSTRAR SU CUPO ===
  const filtrarPorClienteFila = (cliente) => {
    const nitCliente = cliente?.toString().trim();

    // Filtramos la tabla
    setBusqueda(nitCliente);

    // Buscamos el cupo relacionado en la base de cupo_cartera
    const cupoEncontrado = cupoCartera.find(
      (c) => (c["NIT--------------"] || "").trim() === nitCliente
    );

    if (cupoEncontrado) {
      setCupoSeleccionado(cupoEncontrado["-------CUPO CREDITO"]);
    } else {
      setCupoSeleccionado(null);
    }
  };

  // === Aplicar Filtros ===
  // Consolidated filtered data with memoization
  const datosFiltradosFinal = useMemo(() => {
    let arr = datosConCupo
      .filter((fila) => {
        const nit = (fila.Cliente || "").toString().toLowerCase();
        const nombre = (fila.Nombre_Cliente || "").toString().toLowerCase();
        const termino = busqueda.trim().toLowerCase();
        return nit.includes(termino) || nombre.includes(termino);
      })
      .filter((fila) =>
        vendedoresSeleccionados.length > 0
          ? vendedoresSeleccionados.some(
              (v) =>
                (fila.Nombre_Vendedor || "").toLowerCase() === v.toLowerCase()
            )
          : true
      )
      .filter((fila) => {
        if (!columnaSeleccionada) return true;
        const valorNum = fila[`${columnaSeleccionada}_num`];
        return !isNaN(valorNum) && valorNum !== 0;
      });

    // === Aplicar filtros por Nombre_Zona y Nombre_Ciudad ===
    if (filtrosColumnas.Nombre_Zona?.length) {
      arr = arr.filter((f) =>
        filtrosColumnas.Nombre_Zona.includes(f.Nombre_Zona)
      );
    }
    if (filtrosColumnas.Nombre_Ciudad?.length) {
      arr = arr.filter((f) =>
        filtrosColumnas.Nombre_Ciudad.includes(f.Nombre_Ciudad)
      );
    }

    // === Filtrar Notas de Crédito ===
    if (mostrarNotasCredito) {
      arr = arr.filter((fila) => fila.T_Dcto?.toUpperCase() === "NC");
    }

    // === ORDENAR POR COLUMNA SELECCIONADA ===
    if (columnaOrden) {
      arr = [...arr].sort((a, b) => {
        const keyNumA = a[`${columnaOrden}_num`];
        const keyNumB = b[`${columnaOrden}_num`];

        if (!isNaN(keyNumA) && !isNaN(keyNumB)) {
          return direccionOrden === "asc"
            ? keyNumA - keyNumB
            : keyNumB - keyNumA;
        }

        const valA = a[columnaOrden];
        const valB = b[columnaOrden];
        // Manejar columnas de fecha en formato dd-mm-YYYY o YYYY-MM-DD (ordenarlas por fecha real)
        const dateCols = ["F_Expedic", "F_Vencim"];
        if (dateCols.includes(columnaOrden)) {
          try {
            const toTime = (v) => {
              if (v == null || v === "") return NaN;
              if (typeof v === "number") return v;
              if (v instanceof Date) return v.getTime();
              const s = String(v).trim();
              // dd-mm-YYYY
              const m1 = s.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
              if (m1) {
                const day = parseInt(m1[1], 10);
                const month = parseInt(m1[2], 10) - 1;
                const year = parseInt(m1[3], 10);
                return Date.UTC(year, month, day);
              }
              // YYYY-MM-DD
              const m2 = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
              if (m2) {
                const year = parseInt(m2[1], 10);
                const month = parseInt(m2[2], 10) - 1;
                const day = parseInt(m2[3], 10);
                return Date.UTC(year, month, day);
              }
              const d = new Date(s);
              return isNaN(d) ? NaN : d.getTime();
            };

            const ta = toTime(valA);
            const tb = toTime(valB);
            if (!isNaN(ta) && !isNaN(tb)) {
              return direccionOrden === "asc" ? ta - tb : tb - ta;
            }
          } catch (e) {
            // En caso de error, no romper la UI — caemos al comparador por string
            console.error("Error sorting dates:", e);
          }
        }

        return direccionOrden === "asc"
          ? String(valA ?? "").localeCompare(String(valB ?? ""))
          : String(valB ?? "").localeCompare(String(valA ?? ""));
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

  // Valores únicos por columna (para dropdowns) — memoizado
  const valoresUnicosByCol = useMemo(() => {
    const res = {};
    const cols = ["Nombre_Zona", "Nombre_Ciudad"];
    cols.forEach((col) => {
      res[col] = [
        ...new Set(datosFiltradosFinal.map((d) => d[col]).filter(Boolean)),
      ];
    });
    return res;
  }, [datosFiltradosFinal]);

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

  // Formatea número como entero sin decimales y con puntos como separador de miles
  const formatIntegerWithDots = (raw) => {
    const n = typeof raw === "number" ? raw : parseNumber(raw);
    if (isNaN(n)) return raw ?? "";
    const rounded = Math.round(n);
    const sign = rounded < 0 ? "-" : "";
    const abs = Math.abs(rounded).toString();
    return sign + abs.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  // Formatea ticks del eje Y: usa sufijos k/M y pone puntos en números pequeños
  const formatYAxisTick = (value) => {
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
  };

  // Columnas que deben mostrarse como montos
  const monetaryColumns = new Set([
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

  const generarDatosGrafica = useCallback(() => {
    const categorias = [
      "Por_Venc",
      "Venc_0_30",
      "Venc_31_60",
      "Venc_61_90",
      "Venc_91",
    ];

    // Si hay una columna seleccionada, forzamos que sólo esa columna aporte
    // datos a las barras (las demás quedan en 0). Esto evita residuos cuando
    // se filtra por una zona específica.
    return categorias.map((col) => {
      let cantidad = 0;
      let monto = 0;

      if (columnaSeleccionada) {
        // Sólo sumar/contar si la columna actual es la seleccionada
        if (col === columnaSeleccionada) {
          datosFiltradosFinal.forEach((fila) => {
            const num = fila[`${col}_num`];
            if (!isNaN(num) && num !== 0) {
              cantidad += 1;
              monto += num;
            }
          });
        } else {
          cantidad = 0;
          monto = 0;
        }
      } else {
        // Comportamiento por defecto: contar/sumar por cada categoría
        datosFiltradosFinal.forEach((fila) => {
          const num = fila[`${col}_num`];
          if (!isNaN(num) && num !== 0) {
            cantidad += 1;
            monto += num;
          }
        });
      }

      return {
        categoria: nombresColumnas[col].replace(/[^a-zA-Z0-9 ]/g, ""),
        cantidad,
        monto,
      };
    });
  }, [datosFiltradosFinal, columnaSeleccionada, nombresColumnas]);

  const datosGrafica = generarDatosGrafica();

  const totalCantidad = datosGrafica.reduce((sum, d) => sum + d.cantidad, 0);
  const totalMonto = datosGrafica.reduce((sum, d) => sum + d.monto, 0);

  // 🔹 Agregar una fila extra para el total
  const datosGraficaConTotal = [
    ...datosGrafica,
    { categoria: "TOTAL", cantidad: totalCantidad, monto: totalMonto },
  ];

  // Filas que sí deben mostrarse en la tabla: excluir filas que no tienen
  // ningún valor monetario (evita filas "totales" o vacías al final)

  // === Columnas visibles dinámicamente ===
  const columnasParaTabla = columnasVisibles
    .map((col) => {
      if (grupoZonas.includes(col)) {
        return columnaSeleccionada === col ? col : null;
      }
      // Mostrar siempre estas columnas
      if (col === "Nombre_Zona" || col === "Nombre_Ciudad") return col;
      return col;
    })
    .filter(Boolean);

  const columnasVencidas = ["Venc_0_30", "Venc_31_60", "Venc_61_90", "Venc_91"];

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

  let cantidadVencidas = 0;
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
    cantidadVencidas = datosFiltradosFinal.filter((fila) =>
      columnasVencidas.some((col) => {
        const num = fila[`${col}_num`];
        return !isNaN(num) && num !== 0;
      })
    ).length;
  }

  const totalVisible = datosFiltradosFinal.reduce((acc, f) => {
    const n = f.Saldo_num ?? f.saldo_num ?? f.Saldo ?? 0;
    return !isNaN(n) ? acc + n : acc;
  }, 0);

  useEffect(() => {
    const handleClickOutside = (e) => {
      // Si el clic no fue dentro de ningún panel, los cierra
      if (
        !e.target.closest(".panel-vendedores") &&
        !e.target.closest(".btn-toggle-vendedores")
      ) {
        setMostrarVendedores1(false);
        setMostrarVendedores2(false);
      }

      // Cierra dropdowns controlados por estado
      setColumnaFiltroActiva(null);
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // No listeners de scroll: botones son fijos y no deben causar re-renders

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });
  const scrollToBottom = () => {
    const scrollHeight =
      document.documentElement.scrollHeight || document.body.scrollHeight || 0;
    window.scrollTo({ top: scrollHeight, behavior: "smooth" });
  };

  // === Render ===
  return (
    <div className="dashboard-container">
      <div className="panel">
        <div className="panel-header">
          <h2>📊 Base de Conocimiento</h2>
        </div>

        <div className="nombre">
          <h2>{nombreUsuario || "Usuario"}</h2>
        </div>

        {/* === FILTRO DE GRÁFICAS POR VENDEDOR === */}
        {/* === FILTRO DE VENDEDORES CON CHECKBOX === */}
        {/* === PANEL DESPLEGABLE DE VENDEDORES === */}
        <div className="vendedores-wrapper">
          <button
            className="btn-toggle-vendedores"
            onClick={(e) => {
              e.stopPropagation();
              setMostrarVendedores1((prev) => !prev);
              setMostrarVendedores2(false); // cerrar el otro
            }}
          >
            👥 Seleccionar Vendedores
          </button>

          {mostrarVendedores1 && (
            <div
              className="panel-vendedores"
              onClick={(e) => e.stopPropagation()}
            >
              <p>Selecciona los vendedores:</p>
              <div className="checkbox-list">
                {vendedoresDisponibles.map((v) => (
                  <label key={v} className="checkbox-item">
                    <input
                      type="checkbox"
                      checked={vendedoresSeleccionados.includes(v)}
                      onChange={() => {
                        setVendedoresSeleccionados((prev) =>
                          prev.includes(v)
                            ? prev.filter((x) => x !== v)
                            : [...prev, v]
                        );
                      }}
                    />
                    <span>{v}</span>
                  </label>
                ))}
              </div>

              {vendedoresSeleccionados.length > 0 && (
                <button
                  className="btn-limpiar-vendedores"
                  onClick={() => setVendedoresSeleccionados([])}
                >
                  🧹 Limpiar selección
                </button>
              )}
            </div>
          )}
        </div>

        {/* === GRÁFICAS DE BARRAS === */}
        <div className="graficas-container">
          {/* === Gráfica de Cantidades === */}
          <div className="grafica-item">
            <h4>📈 Cantidad de Facturas</h4>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart
                data={datosGraficaConTotal}
                margin={{ top: 20, right: 30, left: 50, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis
                  dataKey="categoria"
                  interval={0} // ✅ muestra todos los labels
                  angle={30} // ✅ mantiene el texto horizontal
                  dy={10} // ✅ agrega un pequeño espacio hacia abajo
                  tick={{
                    fill: "#ffffff", // Color blanco
                    fontSize: 11, // Tamaño de letra eje X
                    fontWeight: 600,
                  }}
                  tickFormatter={formatYAxisTick}
                />

                <YAxis
                  tick={{
                    fill: "#ffffff", // Color blanco
                    fontSize: 13, // Tamaño de letra eje Y
                    fontWeight: 600, // (opcional) negrita
                  }}
                  tickFormatter={formatYAxisTick}
                />
                <Tooltip />
                {/* 🔹 Se quitó <Legend /> */}
                <Bar dataKey="cantidad" barSize={40}>
                  {datosGraficaConTotal.map((_, index) => (
                    <Cell
                      key={`cell-cantidad-${index}`}
                      fill={
                        index === datosGraficaConTotal.length - 1
                          ? "#ff7866ff"
                          : [
                              "#00bcd4",
                              "#43a047",
                              "#ff9800",
                              "#e53935",
                              "#9c27b0",
                            ][index % 5]
                      }
                    />
                  ))}

                  {/* 🔹 Muestra los valores encima de cada barra */}
                  <LabelList
                    dataKey="cantidad"
                    position="top"
                    fill="#fff"
                    fontSize={14}
                    formatter={(v) => formatIntegerWithDots(v)}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* === Gráfica de Montos === */}
          <div className="grafica-item">
            <h4>💵 Monto Total ($)</h4>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart
                data={datosGraficaConTotal}
                margin={{ top: 20, right: 5, left: 60, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis
                  dataKey="categoria"
                  interval={0} // ✅ muestra todos los labels
                  angle={30} // ✅ mantiene el texto horizontal
                  dy={10} // ✅ agrega un pequeño espacio hacia abajo
                  tick={{
                    fill: "#ffffff", // Color blanco
                    fontSize: 11, // Tamaño de letra eje X
                    fontWeight: 600,
                  }}
                />
                <YAxis
                  tick={{
                    fill: "#ffffff", // Color blanco
                    fontSize: 13, // Tamaño de letra eje Y
                    fontWeight: 600, // (opcional) negrita
                  }}
                  tickFormatter={formatYAxisTick}
                />
                <Tooltip />
                {/* 🔹 Se quitó <Legend /> */}
                <Bar dataKey="monto" barSize={40}>
                  {datosGraficaConTotal.map((_, index) => (
                    <Cell
                      key={`cell-monto-${index}`}
                      fill={
                        index === datosGraficaConTotal.length - 1
                          ? "#e31456ff"
                          : [
                              "#2196f3",
                              "#4caf50",
                              "#ffeb3b",
                              "#ff5722",
                              "#ab47bc",
                            ][index % 5]
                      }
                    />
                  ))}

                  {/* 🔹 Muestra los valores encima de cada barra */}
                  <LabelList
                    dataKey="monto"
                    position="top"
                    fill="#fff"
                    fontSize={14}
                    formatter={(v) => formatIntegerWithDots(v)}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel-buttons">
          {rol === "admin" && (
            <button className="btn-primario" onClick={() => navigate("/admin")}>
              ⬅️ Volver al Panel
            </button>
          )}
          <button
            className="btn-primario"
            onClick={async () => {
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
            }}
          >
            📥 Descargar Excel Filtrado
          </button>

          <button className="btn-peligro" onClick={cerrarSesion}>
            🔒 Cerrar Sesión
          </button>
        </div>
      </div>

      <div className="saldo-panel">
        <strong>Total Saldo visible:</strong>{" "}
        <span className="saldo-valor">
          {isFinite(totalVisible) ? formatIntegerWithDots(totalVisible) : "0"}
        </span>
      </div>

      {/* === MOSTRAR CUPO CUANDO SELECCIONADO === */}
      {busqueda.trim() && (
        <>
          {/* CUP0 DE CRÉDITO */}
          <div className="saldo-panel cupo-panel">
            <strong>💳 Cupo de Crédito:</strong>&nbsp;
            <span className="saldo-valor">
              {cupoSeleccionado !== null
                ? formatIntegerWithDots(parseFloat(cupoSeleccionado))
                : "No disponible"}
            </span>
          </div>

          {/* CUPO DISPONIBLE */}
          <div className="saldo-panel cupo-disponible-panel">
            <strong>💰 Cupo Disponible:</strong>&nbsp;
            <span className="saldo-valor">
              {(() => {
                if (!cupoSeleccionado) return "No disponible";

                const clienteActual = datosConCupo.find(
                  (d) =>
                    (d.Cliente || "").toString().trim() ===
                    busqueda.toString().trim()
                );

                if (!clienteActual) return "No disponible";

                const saldoCliente = parseFloat(clienteActual.Saldo ?? 0);
                const cupo = parseFloat(cupoSeleccionado ?? 0);
                const disponible = cupo - saldoCliente;

                return formatIntegerWithDots(disponible);
              })()}
            </span>
            {/* 🔹 Estado basado en facturas vencidas o cupo negativo */}
            {(() => {
              const clienteActual = datosConCupo.find(
                (d) =>
                  (d.Cliente || "").toString().trim() ===
                  busqueda.toString().trim()
              );
              if (!clienteActual) return null;

              const tieneVencidas =
                parseFloat(clienteActual.Venc_0_30 ?? 0) > 0 ||
                parseFloat(clienteActual.Venc_31_60 ?? 0) > 0 ||
                parseFloat(clienteActual.Venc_61_90 ?? 0) > 0 ||
                parseFloat(clienteActual.Venc_91 ?? 0) > 0;

              let bloqueado = false;

              // Si tiene cupo, puede bloquearse por cupo negativo o por vencidas
              if (cupoSeleccionado) {
                const saldoCliente = parseFloat(clienteActual.Saldo ?? 0);
                const cupo = parseFloat(cupoSeleccionado ?? 0);
                const disponible = cupo - saldoCliente;
                bloqueado = disponible < 0 || tieneVencidas;
              } else {
                // Si NO tiene cupo, solo se evalúa por facturas vencidas
                bloqueado = tieneVencidas;
              }

              return (
                <span
                  className={`estado-cupo ${
                    bloqueado ? "bloqueado" : "activo"
                  }`}
                >
                  {bloqueado ? "Bloqueado" : "Activo"}
                </span>
              );
            })()}
          </div>
        </>
      )}

      <div className="buscador-container">
        {busqueda && (
          <button
            className="btn-primario"
            style={{ marginRight: "10px" }}
            onClick={() => {
              setBusqueda("");
              setCupoSeleccionado(null);
            }}
          >
            🧹 Limpiar filtro
          </button>
        )}

        <input
          type="text"
          placeholder="🔍 Buscar por cliente..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="input-busqueda"
        />
      </div>

      <div className="filtro-vendedor">
        {/* === SEGUNDO FILTRO DESPLEGABLE DE VENDEDORES === */}
        <div className="filtro-vendedores">
          <button
            className="btn-toggle-vendedores"
            onClick={(e) => {
              e.stopPropagation();
              setMostrarVendedores2((prev) => !prev);
              setMostrarVendedores1(false); // cerrar el otro
            }}
          >
            📋 Filtrar por vendedor
          </button>

          {mostrarVendedores2 && (
            <div
              className="panel-vendedores panel-vendedores-secundario"
              onClick={(e) => e.stopPropagation()}
            >
              <p>Selecciona los vendedores:</p>
              <div className="checkbox-list">
                {vendedoresDisponibles.map((v) => (
                  <label key={v} className="checkbox-item">
                    <input
                      type="checkbox"
                      checked={vendedoresSeleccionados.includes(v)}
                      onChange={() => {
                        setVendedoresSeleccionados((prev) =>
                          prev.includes(v)
                            ? prev.filter((x) => x !== v)
                            : [...prev, v]
                        );
                      }}
                    />
                    <span>{v}</span>
                  </label>
                ))}
              </div>

              {vendedoresSeleccionados.length > 0 && (
                <button
                  className="btn-limpiar-vendedores"
                  onClick={() => setVendedoresSeleccionados([])}
                >
                  🧹 Limpiar selección
                </button>
              )}
            </div>
          )}
        </div>

        {/* === CONTADORES DE ZONAS === */}
        <div className="contadores">
          {grupoZonas.map((col) => {
            const cantidad = contarPorColumna(col);
            return (
              <div key={col} className="contador-item">
                <span className="contador-label">{nombresColumnas[col]}</span>
                <span className="contador-valor">
                  {formatIntegerWithDots(cantidad)}
                </span>
              </div>
            );
          })}
          <div className="contador-item total-vencidas">
            <span className="contador-label">📊 Total Facturas Vencidas</span>
            <span className="contador-valor">
              {formatIntegerWithDots(cantidadVencidas)}
            </span>
          </div>
        </div>
      </div>

      <div className="columnas-panel">
        <h4>Filtro de Zonas</h4>
        <div className="filtro-cuadro">
          {grupoZonas.map((col) => (
            <button
              key={col}
              className={`columna-boton ${
                columnaSeleccionada === col ? "activo" : ""
              }`}
              onClick={() => seleccionarColumna(col)}
            >
              {nombresColumnas[col] || col}
            </button>
          ))}

          <button
            className={`columna-boton ${mostrarNotasCredito ? "activo" : ""}`}
            onClick={() => setMostrarNotasCredito((prev) => !prev)}
          >
            🧾 {mostrarNotasCredito ? "Mostrar Todo" : "Ver Notas de Crédito"}
          </button>
        </div>
      </div>

      {cargando ? (
        <p className="texto-cargando">Cargando datos...</p>
      ) : mensaje ? (
        <p className="texto-vacio">{mensaje}</p>
      ) : datosFiltradosFinal.length === 0 ? (
        <p className="texto-vacio">⚠️ No hay registros visibles.</p>
      ) : (
        <div className="tabla-contenedor">
          <table className="tabla-dashboard">
            <thead>
              <tr>
                {columnasParaTabla.map((col) => {
                  const esMultiple =
                    col === "Nombre_Zona" || col === "Nombre_Ciudad";

                  // Valores únicos dinámicos para dropdown de filtro (precalculados)
                  const valoresUnicos = esMultiple
                    ? valoresUnicosByCol[col] || []
                    : [];

                  return (
                    <th key={col} className="th-dashboard">
                      <div className="th-content">
                        {/* Nombre personalizado */}
                        <span>
                          {nombresColumnasPersonalizados[col] ||
                            col.replace(/_/g, " ")}
                        </span>

                        {/* Dropdown de filtro / orden (controlado por estado) */}
                        <div
                          className="dropdown-container"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            className={`dropdown-btn ${
                              columnaFiltroActiva === col ||
                              (filtrosColumnas[col] &&
                                filtrosColumnas[col].length > 0) ||
                              columnaOrden === col
                                ? "orden-activo"
                                : ""
                            }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setColumnaFiltroActiva(
                                columnaFiltroActiva === col ? null : col
                              );
                            }}
                          >
                            ⚙️
                          </button>

                          <div
                            className={`dropdown-menu ${
                              columnaFiltroActiva === col ? "show" : ""
                            }`}
                          >
                            {esMultiple ? (
                              <>
                                <p className="dropdown-title">
                                  Filtrar {col.replace(/_/g, " ")}:
                                </p>
                                <div className="checkbox-list">
                                  {valoresUnicos.map((valor) => (
                                    <label
                                      key={valor}
                                      className="checkbox-item"
                                    >
                                      <input
                                        type="checkbox"
                                        checked={
                                          filtrosColumnas[col]?.includes(
                                            valor
                                          ) || false
                                        }
                                        onChange={(e) => {
                                          const seleccionados =
                                            filtrosColumnas[col] || [];
                                          if (e.target.checked) {
                                            setFiltrosColumnas({
                                              ...filtrosColumnas,
                                              [col]: [...seleccionados, valor],
                                            });
                                          } else {
                                            setFiltrosColumnas({
                                              ...filtrosColumnas,
                                              [col]: seleccionados.filter(
                                                (v) => v !== valor
                                              ),
                                            });
                                          }
                                        }}
                                      />
                                      <span>{valor}</span>
                                    </label>
                                  ))}
                                </div>
                                {filtrosColumnas[col]?.length > 0 && (
                                  <button
                                    className="btn-limpiar-filtro"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setFiltrosColumnas({
                                        ...filtrosColumnas,
                                        [col]: [],
                                      });
                                    }}
                                  >
                                    🧹 Limpiar filtro
                                  </button>
                                )}
                              </>
                            ) : (
                              <>
                                <button
                                  className={
                                    columnaOrden === col &&
                                    direccionOrden === "asc"
                                      ? "activo"
                                      : ""
                                  }
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setColumnaOrden(col);
                                    setDireccionOrden("asc");
                                    setColumnaFiltroActiva(null);
                                  }}
                                >
                                  ⬆️ Menor a mayor
                                </button>

                                <button
                                  className={
                                    columnaOrden === col &&
                                    direccionOrden === "desc"
                                      ? "activo"
                                      : ""
                                  }
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setColumnaOrden(col);
                                    setDireccionOrden("desc");
                                    setColumnaFiltroActiva(null);
                                  }}
                                >
                                  ⬇️ Mayor a menor
                                </button>

                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setColumnaOrden(null);
                                    setColumnaFiltroActiva(null);
                                  }}
                                >
                                  ❌ Quitar filtro
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody>
              {datosFiltradosFinal.map((fila, idx) => (
                <tr
                  key={idx}
                  onClick={() => filtrarPorClienteFila(fila.Cliente)}
                  style={{ cursor: "pointer" }}
                >
                  {columnasParaTabla.map((col) => (
                    <td key={col}>
                      {monetaryColumns.has(col)
                        ? formatIntegerWithDots(fila[col])
                        : fila[col] ?? ""}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {/* Botones fijos a la derecha: cuando estamos arriba muestra botón para ir al final; cuando estamos abajo muestra botón para ir al inicio */}
      <div style={{ position: "absolute", right: 20, top: 20, zIndex: 9999 }}>
        <button className="btn-primario" onClick={scrollToBottom}>
          Ir al final ↓
        </button>
      </div>

      <div
        style={{ position: "absolute", right: 20, bottom: -90, zIndex: 9999 }}
      >
        <button className="btn-primario" onClick={scrollToTop}>
          Ir al inicio ↑
        </button>
      </div>
    </div>
  );
}
