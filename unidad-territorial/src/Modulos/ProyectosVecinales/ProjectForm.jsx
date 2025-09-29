
import { useState } from "react";

const ProjectForm = ({ onCreate }) => {
  const [formData, setFormData] = useState({
    titulo: "",
    descripcion: "",
    bases: "",
    archivo: null,
    fechaInicio: "",
    fechaCierre: "",
    estado: "Abierto",
  });

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData({
      ...formData,
      [name]: files ? files[0] : value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onCreate(formData);
    setFormData({
      titulo: "",
      descripcion: "",
      bases: "",
      archivo: null,
      fechaInicio: "",
      fechaCierre: "",
      estado: "Abierto",
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg shadow-md">
      <input
        type="text"
        name="titulo"
        value={formData.titulo}
        onChange={handleChange}
        placeholder="Título"
        className="w-full border p-2 rounded"
        required
      />
      <textarea
        name="descripcion"
        value={formData.descripcion}
        onChange={handleChange}
        placeholder="Descripción"
        className="w-full border p-2 rounded"
        required
      />
      <textarea
        name="bases"
        value={formData.bases}
        onChange={handleChange}
        placeholder="Bases o condiciones"
        className="w-full border p-2 rounded"
      />
      <input type="file" name="archivo" onChange={handleChange} />
      <input type="date" name="fechaInicio" value={formData.fechaInicio} onChange={handleChange} required />
      <input type="date" name="fechaCierre" value={formData.fechaCierre} onChange={handleChange} required />
      <select name="estado" value={formData.estado} onChange={handleChange}>
        <option value="Abierto">Abierto</option>
        <option value="Cerrado">Cerrado</option>
        <option value="Evaluando">Evaluando</option>
        <option value="Finalizado">Finalizado</option>
      </select>
      <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
        Crear Proyecto
      </button>
    </form>
  );
};

export default ProjectForm;
