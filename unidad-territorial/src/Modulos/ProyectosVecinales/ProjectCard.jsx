// components/ProjectCard.jsx
const ProjectCard = ({ project, onSelect }) => {
  return (
    <div className="p-4 border rounded-lg shadow cursor-pointer" onClick={() => onSelect(project)}>
      <h2 className="text-xl font-bold">{project.titulo}</h2>
      <p>{project.descripcion}</p>
      <p className="text-sm text-gray-500">Estado: {project.estado}</p>
    </div>
  );
};

export default ProjectCard;
