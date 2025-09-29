
import ProjectCard from "./ProjectCard";

const ProjectList = ({ projects, onSelect }) => {
  return (
    <div className="grid gap-4">
      {projects.map((p) => (
        <ProjectCard key={p.id} project={p} onSelect={onSelect} />
      ))}
    </div>
  );
};

export default ProjectList;
