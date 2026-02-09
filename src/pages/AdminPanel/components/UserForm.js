import React from "react";

const UserForm = (props) => {
  const {
    onSubmit,
    editando,
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
    panelRef,
    panelClientesRef,
    toggleTodos,
    todosSeleccionados,
    vendedoresBase,
    toggleVendedorAsociado,
    toggleTodosClientes,
    todosSeleccionadosClientes,
    buscadorClientes,
    setBuscadorClientes,
    clientesFiltrados,
    toggleClienteAsociado,
    setEditando,
  } = props;

  return (
    <form onSubmit={onSubmit} className="admin-form">
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

        <select
          value={rol}
          onChange={(e) => {
            const nuevoRol = e.target.value;
            setRol(nuevoRol);
            if (nuevoRol === "cliente") {
              setVendedoresAsociados([]);
            } else {
              setClientesAsociados([]);
            }
          }}
          className="select-rol"
        >
          <option value="vendedor">Vendedor</option>
          <option value="admin">Administrador</option>
          <option value="cliente">Cliente</option>
        </select>
      </div>

      {/* --- SECCIÓN DE ASOCIADOS (FUERA DEL GRID PRINCIPAL) --- */}
      <div className="asociados-section-wrapper">
        {(rol === "admin" || rol === "vendedor") && (
          <div className="vendedores-asociados-container" ref={panelRef}>
            <button
              type="button"
              className="btn-toggle-vendedores"
              onClick={() => setMostrarPanel(!mostrarPanel)}
            >
              {mostrarPanel ? "🔼 Cerrar Vendedores" : "🧑‍🤝‍🧑 Asociar Vendedores"}
            </button>

            {mostrarPanel && (
              <div className="panel-vendedores">
                <div className="panel-header">
                  <p>Vendedores asociados:</p>
                  <button
                    type="button"
                    className="btn-todos"
                    onClick={toggleTodos}
                  >
                    {todosSeleccionados ? "Quitar todos" : "Seleccionar todos"}
                  </button>
                </div>
                <div className="checkbox-list scrollable">
                  {vendedoresBase.length > 0 ? (
                    vendedoresBase.map((vendedor) => {
                      const vUpper = (vendedor || "").toUpperCase();
                      const seleccionado = vendedoresAsociados
                        .map((v) => v.toUpperCase())
                        .includes(vUpper);
                      return (
                        <label key={vUpper} className="checkbox-item">
                          <input
                            type="checkbox"
                            checked={seleccionado}
                            onChange={() => toggleVendedorAsociado(vUpper)}
                          />
                          <span>{vUpper}</span>
                        </label>
                      );
                    })
                  ) : (
                    <p className="sin-vendedores">
                      ⚠️ No hay vendedores en la base.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {rol === "cliente" && (
          <div
            className="vendedores-asociados-container"
            ref={panelClientesRef}
          >
            <button
              type="button"
              className="btn-toggle-vendedores"
              onClick={() => setMostrarPanelClientes(!mostrarPanelClientes)}
            >
              {mostrarPanelClientes
                ? "🔼 Cerrar Clientes"
                : "🏢 Asociar Clientes"}
            </button>

            {mostrarPanelClientes && (
              <div className="panel-vendedores">
                <div className="panel-header">
                  <p>Clientes asociados:</p>
                  <button
                    type="button"
                    className="btn-todos"
                    onClick={toggleTodosClientes}
                  >
                    {todosSeleccionadosClientes
                      ? "Quitar todos"
                      : "Seleccionar todos"}
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="🔍 Buscar cliente..."
                  value={buscadorClientes}
                  onChange={(e) => setBuscadorClientes(e.target.value)}
                  className="input-busqueda-cliente"
                  style={{
                    width: "100%",
                    marginBottom: "10px",
                    padding: "8px",
                    background: "#0d1b2a",
                    border: "1px solid #2b3a55",
                    color: "white",
                  }}
                />
                <div className="checkbox-list scrollable">
                  {clientesFiltrados.length > 0 ? (
                    clientesFiltrados.map((cliente) => {
                      const seleccionado = clientesAsociados.some(
                        (c) => c.nit === cliente.nit,
                      );
                      return (
                        <label key={cliente.nit} className="checkbox-item">
                          <input
                            type="checkbox"
                            checked={seleccionado}
                            onChange={() => toggleClienteAsociado(cliente)}
                          />
                          <span>
                            {cliente.nit} - {cliente.nombre}
                          </span>
                        </label>
                      );
                    })
                  ) : (
                    <p className="sin-vendedores">
                      ⚠️ No se encontraron clientes.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="botones-form">
        <button type="submit" className="btn-guardar">
          {editando ? "Actualizar" : "Agregar"}
        </button>
        {editando && (
          <button
            type="button"
            className="btn-cancelar"
            onClick={() => setEditando(false)}
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
};

export default UserForm;
