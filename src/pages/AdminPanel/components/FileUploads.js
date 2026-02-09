import React from 'react';

const FileUploads = ({ onUploadBase, onUploadCupo }) => {
  return (
    <div className="excel-upload">
      <label
        id="base-conocimiento"
        htmlFor="excel-base"
        className="btn-excel"
      >
        📤 Subir Base de Conocimiento
      </label>
      <input
        type="file"
        id="excel-base"
        accept=".xlsx, .xls"
        style={{ display: "none" }}
        onChange={onUploadBase}
      />

      <label
        id="cupo-cartera"
        htmlFor="excel-cupo"
        className="btn-excel"
        style={{ marginLeft: "10px" }}
      >
        📤 Subir Cupo Cartera
      </label>
      <input
        type="file"
        id="excel-cupo"
        accept=".xlsx, .xls"
        style={{ display: "none" }}
        onChange={onUploadCupo}
      />
    </div>
  );
};

export default FileUploads;
