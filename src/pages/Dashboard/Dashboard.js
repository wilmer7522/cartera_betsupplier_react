import React from "react";
import { useNavigate } from "react-router-dom";
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
import { useDashboard } from "./useDashboard";
import "./Dashboard.css";

const Dashboard = () => {
  const {
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
    statsGlobales,

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
    cargandoGlobal,
  } = useDashboard();

  const navigate = useNavigate();

  // Determinar si es usuario cliente
  const esCliente = rol === "cliente";

  // Efecto para manejar clics fuera del panel de clientes
  React.useEffect(() => {
    // Manejador de clic fuera del panel de clientes
    const handleClickOutsideClientes = (e) => {
      // Verificar si el clic fue fuera del panel de clientes
      if (
        !e.target.closest(".panel-vendedores") &&
        !e.target.closest(".btn-toggle-vendedores")
      ) {
        setMostrarClientes1(false);
      }
    };

    if (mostrarClientes1) {
      document.addEventListener("mousedown", handleClickOutsideClientes);
      return () => {
        document.removeEventListener("mousedown", handleClickOutsideClientes);
      };
    }
  }, [mostrarClientes1, setMostrarClientes1]);

  const handlePago = (fila) => {
    // Solo permitir pago si hay un saldo pendiente
    if (!fila.Saldo || fila.Saldo <= 0) {
      alert("Esta factura no tiene saldo pendiente de pago.");
      return;
    }


    // Navegar a la página de pago, pasando los datos de la fila completa
    navigate(`/pagar/${fila.Documento}`, {
      state: { ...fila, fromDashboard: true },
    });
  };

  // === RENDER ===
  return (
    <div className="dashboard-container">
      <div className="panel">
        <div className="nombre">
          <h2>{nombreUsuario || "Usuario"}</h2>
        </div>

        {/* === LEYENDA DE VENDEDORES SELECCIONADOS === */}
        <div className="leyenda-vendedores">
          <strong>📊 Vendedores seleccionados: </strong>
          <span className="texto-leyenda">
            {vendedoresSeleccionados.length === 0
              ? "Ningún vendedor seleccionado (mostrando todos)"
              : vendedoresSeleccionados.length === vendedoresDisponibles.length
                ? "Todos los vendedores seleccionados"
                : vendedoresSeleccionados.length <= 9
                  ? vendedoresSeleccionados.join(", ")
                  : `${vendedoresSeleccionados.length} vendedores seleccionados`}
          </span>
        </div>

        {/* === GRÁFICAS DE BARRAS === */}
        <div className="graficas-container">
          {/* === Gráfica de Cantidades === */}
          <div className="grafica-item">
            <h4>📈 Cantidad de Facturas</h4>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart
                data={datosGraficaConTotal}
                /* Reducimos el margen inferior de 40 a 30 porque ya el eje tiene su propia altura */
                margin={{ top: 20, right: 10, left: 10, bottom: 30 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis
                  dataKey="categoria"
                  interval={0}
                  height={60} // Mantenemos 60 para que no se corten las letras
                  angle={30}
                  textAnchor="start"
                  dy={5} // Reducimos de 10 a 5 para que el texto esté más cerca de la base
                  tick={{
                    fill: "#ffffff",
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                />

                <YAxis
                  tick={{
                    fill: "#ffffff",
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                  tickFormatter={formatYAxisTick}
                />
                <Tooltip />
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

                  <LabelList
                    dataKey="cantidad"
                    position="top"
                    fill="#fff"
                    style={{
                      fontSize: "12px",
                      fontWeight: "bold",
                      fontFamily: "Poppins, sans-serif",
                    }}
                    formatter={(v) => formatIntegerWithDots(v)}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* === Gráfica de Montos === */}
          <div className="grafica-item">
            <h4>💵 Monto Total ($)</h4>
            {/* Subimos la altura a 320 o 350 para que las barras no se vean pequeñas */}
            <ResponsiveContainer width="100%" height={320}>
              <BarChart
                data={datosGraficaConTotal}
                /* Reducimos el margen inferior de 40 a 30 porque ya el eje tiene su propia altura */
                margin={{ top: 20, right: 10, left: 10, bottom: 30 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis
                  dataKey="categoria"
                  interval={0}
                  height={60} // Mantenemos 60 para que no se corten las letras
                  angle={30}
                  textAnchor="start"
                  dy={5} // Reducimos de 10 a 5 para que el texto esté más cerca de la base
                  tick={{
                    fill: "#ffffff",
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                />
                <YAxis
                  tick={{
                    fill: "#ffffff",
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                  tickFormatter={formatYAxisTick}
                />
                <Tooltip />
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

                  <LabelList
                    dataKey="monto"
                    position="top"
                    fill="#fff"
                    style={{
                      fontSize: "12px",
                      fontWeight: "bold",
                      fontFamily: "Poppins, sans-serif",
                    }}
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
          <button className="btn-primario" onClick={handleDescargarExcel}>
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

          {/* CUP0 DISPONIBLE - SUMANDO TODAS LAS FACTURAS */}
          <div className="saldo-panel cupo-disponible-panel">
            <strong>💰 Cupo Disponible:</strong>&nbsp;
            <span className="saldo-valor">
              {(() => {
                if (!cupoSeleccionado) return "No disponible";

                // BUSCAR TODAS las facturas del mismo cliente
                const facturasCliente = datosConCupo.filter(
                  (d) =>
                    (d.Cliente || "").toString().trim() ===
                    busqueda.toString().trim(),
                );

                if (facturasCliente.length === 0) return "No encontrado";

                // SUMAR el Saldo de TODAS las facturas
                const totalSaldoCliente = facturasCliente.reduce(
                  (sum, factura) => {
                    const saldo = parseFloat(factura.Saldo ?? 0);
                    return sum + (isNaN(saldo) ? 0 : saldo);
                  },
                  0,
                );

                const cupo = parseFloat(cupoSeleccionado ?? 0);
                const disponible = cupo - totalSaldoCliente;

                return formatIntegerWithDots(disponible);
              })()}
            </span>
            {/* LÓGICA DE ESTADO - TAMBIÉN CORREGIDA */}
            {(() => {
              // BUSCAR TODAS las facturas del cliente
              const facturasCliente = datosConCupo.filter(
                (d) =>
                  (d.Cliente || "").toString().trim() ===
                  busqueda.toString().trim(),
              );

              if (facturasCliente.length === 0) return null;

              // Verificar si ALGUNA factura tiene vencidas
              const tieneVencidas = facturasCliente.some((factura) => {
                return (
                  parseFloat(factura.Venc_0_30 ?? 0) > 0 ||
                  parseFloat(factura.Venc_31_60 ?? 0) > 0 ||
                  parseFloat(factura.Venc_61_90 ?? 0) > 0 ||
                  parseFloat(factura.Venc_91 ?? 0) > 0
                );
              });

              // Calcular total saldo del cliente
              const totalSaldoCliente = facturasCliente.reduce(
                (sum, factura) => {
                  const saldo = parseFloat(factura.Saldo ?? 0);
                  return sum + (isNaN(saldo) ? 0 : saldo);
                },
                0,
              );

              let bloqueado = false;

              if (cupoSeleccionado) {
                const cupo = parseFloat(cupoSeleccionado ?? 0);
                const disponible = cupo - totalSaldoCliente;
                // Bloqueado si: NO tiene cupo suficiente O tiene facturas vencidas
                bloqueado = disponible < 0 || tieneVencidas;
              } else {
                // Si NO tiene cupo, solo bloqueado por vencidas
                bloqueado = tieneVencidas;
              }

              return (
                <span
                  className={`estado-cupo ${
                    bloqueado ? "bloqueado" : "activo"
                  }`}
                >
                  {bloqueado ? "Bloqueado" : "Activo"}
                  <span
                    style={{
                      fontSize: "0.8em",
                      marginLeft: "5px",
                      opacity: 0.8,
                    }}
                  ></span>
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
        {cargandoGlobal && (
          <span className="buscando-spinner">
            Buscando en toda la base de datos...
          </span>
        )}
      </div>

      <div className="filtro-vendedor">
        {/* === SEGUNDO FILTRO DESPLEGABLE DE VENDEDORES (SOLO PARA ADMIN Y VENDEDOR) === */}
        {!esCliente && (
          <div className="vendedores-wrapper">
            <button
              className="btn-toggle-vendedores"
              onClick={(e) => {
                e.stopPropagation();
                setMostrarVendedores1((prev) => !prev);
              }}
            >
              👥 Seleccionar Vendedores
            </button>

            {mostrarVendedores1 && (
              <div
                className="panel-vendedores"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="panel-header">
                  <p>Selecciona los vendedores:</p>
                  <div className="botones-todos">
                    <button
                      type="button"
                      className="btn-todos"
                      onClick={() => {
                        if (
                          vendedoresSeleccionados.length ===
                          vendedoresDisponibles.length
                        ) {
                          setVendedoresSeleccionados([]);
                        } else {
                          setVendedoresSeleccionados([
                            ...vendedoresDisponibles,
                          ]);
                        }
                      }}
                    >
                      {vendedoresSeleccionados.length ===
                      vendedoresDisponibles.length
                        ? "❌ Deseleccionar todos"
                        : "✅ Seleccionar todos"}
                    </button>
                  </div>
                </div>

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
                              : [...prev, v],
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
        )}

        {/* === PANEL DE CLIENTES (SOLO PARA USUARIOS CLIENTE) === */}
        {esCliente && (
          <div className="vendedores-wrapper" style={{ marginLeft: "10px" }}>
            <button
              className="btn-toggle-vendedores"
              onClick={(e) => {
                e.stopPropagation();
                setMostrarClientes1((prev) => !prev);
              }}
            >
              🏢 Seleccionar Clientes
            </button>

            {mostrarClientes1 && (
              <div
                className="panel-vendedores"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="panel-header">
                  <p>Selecciona los clientes:</p>
                  <div className="botones-todos">
                    <button
                      type="button"
                      className="btn-todos"
                      onClick={() => {
                        if (
                          clientesSeleccionados.length ===
                          clientesDisponibles.length
                        ) {
                          setClientesSeleccionados([]);
                        } else {
                          setClientesSeleccionados([...clientesDisponibles]);
                        }
                      }}
                    >
                      {clientesSeleccionados.length ===
                      clientesDisponibles.length
                        ? "❌ Deseleccionar todos"
                        : "✅ Seleccionar todos"}
                    </button>
                  </div>
                </div>

                {cargandoClientes ? (
                  <div className="cargando-clientes">
                    <p>Cargando clientes...</p>
                  </div>
                ) : (
                  <>
                    <div className="checkbox-list">
                      {clientesDisponibles.map((c) => (
                        <label key={c.nit} className="checkbox-item">
                          <input
                            type="checkbox"
                            checked={clientesSeleccionados.some(
                              (cs) => cs.nit === c.nit,
                            )}
                            onChange={() => {
                              setClientesSeleccionados((prev) => {
                                const existe = prev.some(
                                  (cs) => cs.nit === c.nit,
                                );
                                if (existe) {
                                  return prev.filter((cs) => cs.nit !== c.nit);
                                }
                                return [...prev, c];
                              });
                            }}
                          />
                          <span>
                            {c.nit} - {c.nombre}
                          </span>
                        </label>
                      ))}
                    </div>

                    {/* Controles de paginación */}
                    <div className="paginacion-clientes">
                      <div className="info-paginacion">
                        <span>
                          Página {paginaClientes} de{" "}
                          {Math.ceil(clientesTotales / 50)}
                        </span>
                        <span style={{ marginLeft: "10px" }}>
                          Total: {clientesTotales} clientes
                        </span>
                      </div>
                      <div className="botones-paginacion">
                        <button
                          className="btn-paginacion"
                          onClick={() => {
                            if (clientesHasPrevPage) {
                              setPaginaClientes((prev) =>
                                Math.max(1, prev - 1),
                              );
                            }
                          }}
                          disabled={!clientesHasPrevPage}
                        >
                          ← Anterior
                        </button>
                        <button
                          className="btn-paginacion"
                          onClick={() => {
                            if (clientesHasNextPage) {
                              setPaginaClientes((prev) => prev + 1);
                            }
                          }}
                          disabled={!clientesHasNextPage}
                        >
                          Siguiente →
                        </button>
                      </div>
                    </div>
                  </>
                )}

                {clientesSeleccionados.length > 0 && (
                  <button
                    className="btn-limpiar-vendedores"
                    onClick={() => setClientesSeleccionados([])}
                  >
                    🧹 Limpiar selección
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* === CONTADORES DE ZONAS === */}
        <div className="contadores">
          {GRUPO_ZONAS.map((col) => {
            // Si NO hay filtros, usar el global. Si hay filtros, usar contarPorColumna (que mira datosFiltradosFinal)
            const tieneFiltros =
              columnaSeleccionada !== "" ||
              mostrarNotasCredito ||
              vendedoresSeleccionados.length > 0 ||
              busqueda.trim() !== "";
            const cantidad = tieneFiltros
              ? contarPorColumna(col)
              : statsGlobales[col];

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
        <div className="filtro-cuadro">
          {GRUPO_ZONAS.map((col) => (
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
        <>
          <div className="tabla-contenedor">
            <table className="tabla-dashboard">
              <thead>
                <tr>
                  {columnasParaTabla.map((col) => (
                    <th key={col} className="th-dashboard">
                      <div className="th-content">
                        <span>
                          {NOMBRES_COLUMNAS_PERSONALIZADOS[col] ||
                            col.replace(/_/g, " ")}
                        </span>
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
                                columnaFiltroActiva === col ? null : col,
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
                            {col === "Nombre_Zona" ||
                            col === "Nombre_Ciudad" ? (
                              <>
                                <p className="dropdown-title">
                                  Filtrar {col.replace(/_/g, " ")}:
                                </p>
                                <div className="checkbox-list">
                                  {(valoresUnicosByCol[col] || []).map(
                                    (valor) => (
                                      <label
                                        key={valor}
                                        className="checkbox-item"
                                      >
                                        <input
                                          type="checkbox"
                                          checked={
                                            filtrosColumnas[col]?.includes(
                                              valor,
                                            ) || false
                                          }
                                          onChange={(e) => {
                                            const seleccionados =
                                              filtrosColumnas[col] || [];
                                            if (e.target.checked) {
                                              setFiltrosColumnas({
                                                ...filtrosColumnas,
                                                [col]: [
                                                  ...seleccionados,
                                                  valor,
                                                ],
                                              });
                                            } else {
                                              setFiltrosColumnas({
                                                ...filtrosColumnas,
                                                [col]: seleccionados.filter(
                                                  (v) => v !== valor,
                                                ),
                                              });
                                            }
                                          }}
                                        />
                                        <span>{valor}</span>
                                      </label>
                                    ),
                                  )}
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
                  ))}
                  {esCliente && <th className="th-dashboard">Acción</th>}
                </tr>
              </thead>
              <tbody>
                {datosPaginados.map((fila, idx) => (
                  <tr
                    key={idx}
                    onClick={() => filtrarPorClienteFila(fila.Cliente)}
                    style={{ cursor: "pointer" }}
                  >
                    {columnasParaTabla.map((col) => (
                      <td key={col}>
                        {col === "F_Expedic" || col === "F_Vencim"
                          ? (() => {
                              const val = fila[col];
                              if (!val) return "";
                              const date = new Date(val);
                              if (isNaN(date.getTime())) return val;
                              const day = String(date.getUTCDate()).padStart(
                                2,
                                "0",
                              );
                              const month = String(
                                date.getUTCMonth() + 1,
                              ).padStart(2, "0");
                              const year = date.getUTCFullYear();
                              return `${day}/${month}/${year}`;
                            })()
                          : MONETARY_COLUMNS.has(col)
                            ? formatIntegerWithDots(fila[col])
                            : (fila[col] ?? "")}
                      </td>
                    ))}
                    {esCliente && (
                      <td className="td-accion">
                        {fila.Saldo > 0 && (
                          <button
                            className="btn-pagar"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePago(fila);
                            }}
                          >
                            Pagar
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPaginas > 1 && (
            <div className="paginacion-contenedor">
              <button
                className="btn-paginacion"
                disabled={pagina === 1}
                onClick={() => {
                  setPagina(pagina - 1);
                  document.querySelector(".tabla-contenedor")?.scrollTo(0, 0);
                }}
              >
                ◀ Anterior
              </button>
              <span className="info-paginacion">
                Página <strong>{pagina}</strong> de {totalPaginas}
              </span>
              <button
                className="btn-paginacion"
                disabled={pagina === totalPaginas}
                onClick={() => {
                  setPagina(pagina + 1);
                  document.querySelector(".tabla-contenedor")?.scrollTo(0, 0);
                }}
              >
                Siguiente ▶
              </button>
            </div>
          )}
        </>
      )}

      {/* Botones fijos de navegación */}
      <div className="btn-navegacion-superior">
        <button className="btn-primario" onClick={scrollToBottom}>
          Ir al final ↓
        </button>
      </div>

      <div className="btn-navegacion-inferior">
        <button className="btn-primario" onClick={scrollToTop}>
          Ir al inicio ↑
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
