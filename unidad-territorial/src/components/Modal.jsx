import React from 'react';
import './Modal.css';
// 1. Importamos los íconos que usaremos
import { 
  FaCheckCircle, 
  FaTimesCircle, 
  FaInfoCircle, 
  FaExclamationTriangle 
} from 'react-icons/fa';

// 2. Mapeo de 'type' a íconos
const iconMap = {
  success: <FaCheckCircle className="modal-icon-svg" />,
  error: <FaTimesCircle className="modal-icon-svg" />,
  info: <FaInfoCircle className="modal-icon-svg" />,
  warning: <FaExclamationTriangle className="modal-icon-svg" />,
};

// 3. Mapeo de 'type' a clases de botón
const buttonClassMap = {
  success: 'modal-btn--success',
  error: 'modal-btn--error',
  info: 'modal-btn--info',
  warning: 'modal-btn--warning',
};
/**
 * Un Modal de notificación genérico y reutilizable NECESITA esto parametros
 * @param {object} props
 * @param {boolean} props.isOpen - Si el modal debe estar visible.
 * @param {function} props.onClose - Función a llamar al cerrar.
 * @param {string} props.title - El título del modal.
 * @param {'success'|'error'|'info'|'warning'} props.type - El tipo de modal.
 * @param {React.ReactNode} props.children - El contenido (JSX) a mostrar dentro.
 */
function Modal({ isOpen, onClose, title, type = 'info', children }) {
  
  if (!isOpen) {
    return null; 
  }
  const handleCardClick = (e) => e.stopPropagation();

  // 4. Seleccionamos el ícono y la clase de botón, 
  //    o usamos 'info' por defecto si el tipo no es válido.
  const icon = iconMap[type] || iconMap['info'];
  const btnClass = buttonClassMap[type] || buttonClassMap['info'];
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={handleCardClick}>
        
        {/* 5. ÍCONO DINÁMICO */}
        <div className={`modal-icon ${type}`}>
          {icon}
        </div>
        
        <h3 className="modal-titulo">{title}</h3>
        
        <div className="modal-texto">
          {children} 
        </div>
        
        {/* 6. BOTÓN CON CLASE DINÁMICA */}
        <button 
          className={`modal-btn ${btnClass}`} 
          onClick={onClose}
        >
          Aceptar
        </button>
      </div>
    </div>
  );
}

export default Modal;