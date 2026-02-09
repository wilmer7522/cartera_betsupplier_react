import React from 'react';

const AdminHeader = ({ onLogout }) => {
  return (
    <div className="admin-header">
      <h2>Panel de Administración</h2>
      <button onClick={onLogout} className="btn-salir">
        🔒 Cerrar Sesión
      </button>
    </div>
  );
};

export default AdminHeader;
