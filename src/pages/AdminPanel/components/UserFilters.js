import React from 'react';

const UserFilters = ({ filtroRol, setFiltroRol, filtro, setFiltro, usuarios }) => {
  return (
    <div className="filtro-container">
      {/* Filtro por Rol */}
      <div className="filtro-item">
        <label>Filtrar por Rol:</label>
        <select
          value={filtroRol}
          onChange={(e) => {
            setFiltroRol(e.target.value);
            setFiltro("todos"); // Resetear filtro de nombre al cambiar rol
          }}
          className="filtro-select"
        >
          <option value="todos">Todos</option>
          <option value="admin">Administrador</option>
          <option value="vendedor">Vendedor</option>
          <option value="cliente">Cliente</option>
        </select>
      </div>

      {/* Filtro por Nombre (Dinámico) */}
      <div className="filtro-item">
        <label>Filtrar por Nombre:</label>
        <select
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          className="filtro-select"
        >
          <option value="todos">Todos</option>
          {[...new Set(usuarios
              .filter(u => filtroRol === "todos" || u.rol === filtroRol) // Filtrar opciones por rol
              .map((u) => u.nombre)
          )].map((nombre) => (
            <option key={nombre} value={nombre}>
              {nombre}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default UserFilters;
