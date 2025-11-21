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
  } = useDashboard();

  const navigate = useNavigate();

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
            <ResponsiveContainer width="100%" height={250}>
              <BarChart
                data={datosGraficaConTotal}
                margin={{ top: 20, right: 30, left: 50, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis
                  dataKey="categoria"
                  interval={0}
                  angle={30}
                  dy={10}
                  tick={{
                    fill: "#ffffff",
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                  tickFormatter={formatYAxisTick}
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
            <ResponsiveContainer width="100%" height={250}>
              <BarChart
                data={datosGraficaConTotal}
                margin={{ top: 20, right: 5, left: 60, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis
                  dataKey="categoria"
                  interval={0}
                  angle={30}
                  dy={10}
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
                        setVendedoresSeleccionados([...vendedoresDisponibles]);
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
          {GRUPO_ZONAS.map((col) => {
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
        <div className="tabla-contenedor">
          <table className="tabla-dashboard">
            <thead>
              <tr>
                {columnasParaTabla.map((col) => {
                  const esMultiple =
                    col === "Nombre_Zona" || col === "Nombre_Ciudad";

                  const valoresUnicos = esMultiple
                    ? valoresUnicosByCol[col] || []
                    : [];

                  return (
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
                      {MONETARY_COLUMNS.has(col)
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
