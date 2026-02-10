import React from "react";
import "./AdminPanel.css";
import { useAdminPanel } from "./useAdminPanel";
import AdminHeader from "./components/AdminHeader";
import UserForm from "./components/UserForm";
import FileUploads from "./components/FileUploads";
import UserFilters from "./components/UserFilters";
import UserTable from "./components/UserTable";

export default function AdminPanel() {
  const {
    usuarios,
    usuariosFiltrados,
    correo, setCorreo,
    password, setPassword,
    nombre, setNombre,
    rol, setRol,
    vendedoresAsociados, setVendedoresAsociados,
    clientesAsociados, setClientesAsociados,
    mostrarPanel, setMostrarPanel,
    mostrarPanelClientes, setMostrarPanelClientes,
    editando, setEditando,
    filtro, setFiltro,
    filtroRol, setFiltroRol,
    vendedoresBase,
    clientesBase,
    buscadorClientes, setBuscadorClientes,
    panelRef,
    panelClientesRef,
    correoANombre,
    toggleVendedorAsociado,
    toggleClienteAsociado,
    todosSeleccionadosClientes,
    toggleTodosClientes,
    clientesFiltrados,
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
    usuarioSeleccionado,
    fechaReporte,
    setFechaReporte,
    fechaReporteFin,
    setFechaReporteFin,
    handleDescargarReportePagos
  } = useAdminPanel();

  const userFormProps = {
    onSubmit: guardarUsuario,
    editando,
    correo, setCorreo,
    password, setPassword,
    nombre, setNombre,
    rol, setRol,
    vendedoresAsociados, setVendedoresAsociados,
    clientesAsociados, setClientesAsociados,
    mostrarPanel, setMostrarPanel,
    mostrarPanelClientes, setMostrarPanelClientes,
    panelRef,
    panelClientesRef,
    toggleTodos,
    todosSeleccionados,
    vendedoresBase,
    clientesBase,
    toggleVendedorAsociado,
    toggleTodosClientes,
    todosSeleccionadosClientes,
    buscadorClientes, setBuscadorClientes,
    clientesFiltrados,
    toggleClienteAsociado,
    setEditando,
    usuarioSeleccionado
  };

  return (
    <div className="admin-panel">
      <AdminHeader onLogout={cerrarSesion} />

      <UserForm {...userFormProps} />

      <FileUploads onUploadBase={subirExcelBase} onUploadCupo={subirExcelCupo} />

      <div className="reporte-pagos-container">
        <strong>📥 Reporte de Pagos Diarios:</strong>
        <input 
          type="date" 
          value={fechaReporte} 
          onChange={(e) => setFechaReporte(e.target.value)}
          className="input-fecha-reporte"
        />
        <span style={{ margin: '0 10px' }}>hasta</span>
        <input 
          type="date" 
          value={fechaReporteFin} 
          onChange={(e) => setFechaReporteFin(e.target.value)}
          className="input-fecha-reporte"
        />
        <button className="btn-primario" onClick={handleDescargarReportePagos}>
          Descargar Excel
        </button>
      </div>

      <button className="btn-dashboard" onClick={() => navigate("/dashboard")}>
        📊 Dashboard
      </button>

      <UserFilters
        filtroRol={filtroRol}
        setFiltroRol={setFiltroRol}
        filtro={filtro}
        setFiltro={setFiltro}
        usuarios={usuarios}
      />

      <UserTable
        usuarios={usuariosFiltrados}
        formatearFecha={formatearFecha}
        correoANombre={correoANombre}
        onEdit={editarUsuario}
        onDelete={eliminarUsuario}
      />
    </div>
  );
}
