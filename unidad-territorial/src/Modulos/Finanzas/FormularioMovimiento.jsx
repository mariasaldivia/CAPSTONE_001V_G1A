import React, { useState } from "react";
import { crearMovimiento } from "../../api/finanzasApi";
import ModalMensaje from "../../components/ModalMensaje";

// Listas de categorías (basadas en tu script SQL)
const categoriasIngreso = [
  "Cuota Socio",
  "Donación",
  "Arriendo Espacios",
  "Ingreso Evento",
];
const categoriasEgreso = [
  "Gastos Evento",
  "Reparaciones",
  "Materiales",
  // "Mantención" (la tenías en un script, añádela si la usas)
];

function FormularioMovimiento({ tipo, onMovimientoCreado }) {
  // Estado para los datos del formulario
  const [formData, setFormData] = useState({
    Descripcion: "",
    Monto: "",
    Categoria: "",
    ID_Socio_FK: null, // (Opcional)
  });
  
  // Estado para la UI
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMensaje, setModalMensaje] = useState("");
  const [modalTipo, setModalTipo] = useState("info");

  const categorias = tipo === "Ingreso" ? categoriasIngreso : categoriasEgreso;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Validación simple
    if (parseFloat(formData.Monto) <= 0 || !formData.Descripcion || !formData.Categoria) {
      setModalTipo("error");
      setModalMensaje("Completa todos los campos (Monto debe ser > 0)");
      setModalVisible(true);
      setLoading(false);
      return;
    }

    try {
      const body = {
        ...formData,
        Tipo: tipo, // Añade el tipo (Ingreso/Egreso) al body
        Monto: parseFloat(formData.Monto),
        ID_Socio_FK: formData.Categoria === 'Cuota Socio' ? formData.ID_Socio_FK : null
      };

      await crearMovimiento(body); // Llama a la API

      // Éxito
      setModalTipo("exito");
      setModalMensaje(`¡${tipo} registrado con éxito!`);
      setModalVisible(true);
      
      onMovimientoCreado(); // Llama a la función del padre para refrescar la tabla
      setFormData({ Descripcion: "", Monto: "", Categoria: "", ID_Socio_FK: null }); // Limpia el form

    } catch (err) {
      // Error
      setModalTipo("error");
      setModalMensaje(err.message || "Error al registrar el movimiento");
      setModalVisible(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-movimiento-card">
      <h3 className={tipo === 'Ingreso' ? 'tipo-ingreso' : 'tipo-egreso'}>
        Registrar {tipo}
      </h3>
      <form onSubmit={handleSubmit}>
        
        <div className="input-group">
          <label htmlFor={`descripcion-${tipo}`}>Descripción</label>
          <input
            id={`descripcion-${tipo}`}
            name="Descripcion"
            type="text"
            value={formData.Descripcion}
            onChange={handleChange}
            placeholder="Ej: Pago cuota Noviembre"
            required
          />
        </div>

        <div className="input-group">
          <label htmlFor={`monto-${tipo}`}>Monto</label>
          <input
            id={`monto-${tipo}`}
            name="Monto"
            type="number"
            min="1"
            value={formData.Monto}
            onChange={handleChange}
            placeholder="5000"
            required
          />
        </div>

        <div className="input-group">
          <label htmlFor={`categoria-${tipo}`}>Categoría</label>
          <select
            id={`categoria-${tipo}`}
            name="Categoria"
            value={formData.Categoria}
            onChange={handleChange}
            required
          >
            <option value="" disabled>Selecciona una categoría...</option>
            {categorias.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* 💡 Opcional: Mostrar campo de Socio si la categoría es "Cuota Socio" */}
        {tipo === 'Ingreso' && formData.Categoria === 'Cuota Socio' && (
           <div className="input-group">
             <label htmlFor={`socio-${tipo}`}>ID Socio (Opcional)</label>
             <input
               id={`socio-${tipo}`}
               name="ID_Socio_FK"
               type="text" // (Idealmente sería un <select> con los socios)
               value={formData.ID_Socio_FK || ""}
               onChange={handleChange}
               placeholder="Ej: 3"
             />
           </div>
        )}

        <button type="submit" className={`btn-finanzas ${tipo === 'Ingreso' ? 'btn-ingreso' : 'btn-egreso'}`} disabled={loading}>
          {loading ? "Registrando..." : `Añadir ${tipo}`}
        </button>
      </form>

      {/* Modal de éxito/error */}
      {modalVisible && (
        <ModalMensaje
          tipo={modalTipo}
          mensaje={modalMensaje}
          onClose={() => setModalVisible(false)}
        />
      )}
    </div>
  );
}

export default FormularioMovimiento;