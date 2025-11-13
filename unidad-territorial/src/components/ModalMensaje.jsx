import React from "react";
import "./ModalMensaje.css";

function ModalMensaje({ tipo = "info", mensaje, onClose }) {
  return (
    <div className="modal-overlay">
      <div className={`modal-box ${tipo}`}>
        <h3>
          {tipo === "exito" && "✅ Operación exitosa"}
          {tipo === "error" && "❌ Error"}
          {tipo === "info" && "ℹ️ Información"}
        </h3>

        <p>{mensaje}</p>

        <button className="btn-cerrar" onClick={onClose}>
          Cerrar
        </button>
      </div>
    </div>
  );
}

export default ModalMensaje;