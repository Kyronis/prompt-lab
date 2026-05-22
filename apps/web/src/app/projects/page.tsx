import { fetchProjects } from '@/lib/api';
import { FolderKanban, FileText } from 'lucide-react';

export default async function ProjectsPage() {
  let projects = [];
  try {
    projects = await fetchProjects();
  } catch {
    // API may not be running
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
        <span className="rounded-full bg-primary-50 px-3 py-1 text-sm font-medium text-primary-700">
          {projects.length} total
        </span>
      </div>

      {projects.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center">
          <FolderKanban className="mx-auto h-10 w-10 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">No projects yet</h3>
          <p className="mt-2 text-gray-500">Organize your prompts into projects.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project: any) => (
            <div
              key={project.id}
              className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50">
                  <FolderKanban className="h-5 w-5 text-primary-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{project.name}</h3>
                  <p className="text-sm text-gray-500">
                    {project._count?.prompts ?? 0} prompts
                  </p>
                </div>
              </div>
              {project.description && (
                <p className="mt-3 text-sm text-gray-600">{project.description}</p>
              )}
              <div className="mt-4 flex items-center gap-1 text-xs text-gray-400">
                <FileText className="h-3 w-3" />
                {project._count?.prompts ?? 0} prompts
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
