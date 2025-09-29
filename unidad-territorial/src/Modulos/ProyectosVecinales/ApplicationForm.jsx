
import { useState } from "react";

const ApplicationForm = ({ project, onApply }) => {
  const [formData, setFormData] = useState({
    nombre: "",
    direccion: "",
    contacto: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onApply(project.id, formData);
    setFormData({ nombre: "", direccion: "", contacto: "" });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 border p-4 rounded shadow-md">
      <h2 className="text-lg font-bold">Postulación a: {project.titulo}</h2>
      <input
        type="text"
        name="nombre"
        value={formData.nombre}
        onChange={handleChange}
        placeholder="Nombre completo"
        className="w-full border p-2 rounded"
        required
      />
      <input
        type="text"
        name="direccion"
        value={formData.direccion}
        onChange={handleChange}
        placeholder="Dirección"
        className="w-full border p-2 rounded"
        required
      />
      <input
        type="text"
        name="contacto"
        value={formData.contacto}
        onChange={handleChange}
        placeholder="Teléfono o correo"
        className="w-full border p-2 rounded"
        required
      />
      <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded">
        Postular
      </button>
    </form>
  );
};

export default ApplicationForm;
