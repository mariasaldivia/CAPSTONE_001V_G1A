
import { useState } from "react";
import ProjectForm from "./ProjectForm";
import ProjectList from "./ProjectList";
import ApplicationForm from "./ApplicationForm";

const ProyectosVecinales = ({ userRole = "socio" }) => {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);

  // Crear proyecto (Directiva)
  const handleCreate = (newProject) => {
    setProjects([...projects, { ...newProject, id: Date.now() }]);
  };

  // Postular (Socio)
  const handleApply = (projectId, formData) => {
    console.log("Postulación recibida:", projectId, formData);
    alert("Tu postulación fue enviada con éxito ✅");
    setSelectedProject(null);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Gestión de Proyectos Vecinales</h1>

      {userRole === "directiva" ? (
        <>
          <ProjectForm onCreate={handleCreate} />
          <ProjectList projects={projects} onSelect={setSelectedProject} />
        </>
      ) : (
        <>
          {!selectedProject ? (
            <ProjectList
              projects={projects.filter((p) => p.estado === "Abierto")}
              onSelect={setSelectedProject}
            />
          ) : (
            <ApplicationForm project={selectedProject} onApply={handleApply} />
          )}
        </>
      )}
    </div>
  );
};

export default ProyectosVecinales;
