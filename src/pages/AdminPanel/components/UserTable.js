import React from 'react';

const UserTable = ({ usuarios, formatearFecha, correoANombre, onEdit, onDelete }) => {
  return (
    <div className="user-table">
      <table className="tabla-usuarios">
        <thead>
          <tr>
            <th>Correo</th>
            <th>Nombre</th>
            <th>Rol</th>
            <th>Último Login</th>
            <th>Asociados</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {usuarios.map((u) => (
            <tr key={u._id}>
              <td>{u.correo}</td>
              <td>{u.nombre}</td>
              <td>{u.rol}</td>
              <td>{formatearFecha(u.ultimo_login)}</td>
              <td>
                {u.rol === "cliente" ? (
                  u.clientes_asociados?.length ? (
                    u.clientes_asociados.length > 4 ? (
                      <details>
                        <summary style={{ cursor: "pointer", fontWeight: "bold" }}>
                          {u.clientes_asociados.length} clientes asociados
                        </summary>
                        <ul style={{ listStyle: "none", paddingLeft: "10px", marginTop: "5px" }}>
                          {u.clientes_asociados.map((c, idx) => (
                            <li key={idx} style={{ textTransform: "uppercase" }}>
                              {typeof c === "object" && c.nit
                                ? `${c.nit.toUpperCase()} - ${c.nombre?.toUpperCase() || c.nit.toUpperCase()}`
                                : c.toUpperCase()}
                            </li>
                          ))}
                        </ul>
                      </details>
                    ) : (
                      u.clientes_asociados
                        .map((c) =>
                          typeof c === "object" && c.nit
                            ? `${c.nit.toUpperCase()} - ${c.nombre?.toUpperCase() || c.nit.toUpperCase()}`
                            : c.toUpperCase()
                        )
                        .join(", ")
                    )
                  ) : (
                    "—"
                  )
                ) : u.vendedores_asociados?.length ? (
                  u.vendedores_asociados.length > 4 ? (
                    <details>
                      <summary style={{ cursor: "pointer", fontWeight: "bold" }}>
                        {u.vendedores_asociados.length} vendedores asociados
                      </summary>
                      <ul style={{ listStyle: "none", paddingLeft: "10px", marginTop: "5px" }}>
                        {u.vendedores_asociados.map((c, idx) => (
                          <li key={idx} style={{ textTransform: "uppercase" }}>
                            {correoANombre[c]
                              ? correoANombre[c].toUpperCase()
                              : c.toUpperCase()}
                          </li>
                        ))}
                      </ul>
                    </details>
                  ) : (
                    u.vendedores_asociados
                      .map((c) =>
                        correoANombre[c]
                          ? correoANombre[c].toUpperCase()
                          : c.toUpperCase()
                      )
                      .join(", ")
                  )
                ) : (
                  "—"
                )}
              </td>
              <td>
                <button className="btn-editar" onClick={() => onEdit(u)}>
                  ✏️
                </button>
                <button
                  className="btn-eliminar"
                  onClick={() => onDelete(u.correo)}
                >
                  🗑️
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UserTable;
