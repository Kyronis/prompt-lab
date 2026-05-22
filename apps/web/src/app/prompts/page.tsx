import { fetchPrompts } from '@/lib/api';
import { Terminal, Tag, Clock } from 'lucide-react';

export default async function PromptsPage() {
  let prompts = [];
  try {
    prompts = await fetchPrompts();
  } catch {
    // API may not be running
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Prompts</h1>
        <span className="rounded-full bg-primary-50 px-3 py-1 text-sm font-medium text-primary-700">
          {prompts.length} total
        </span>
      </div>

      {prompts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center">
          <Terminal className="mx-auto h-10 w-10 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">No prompts yet</h3>
          <p className="mt-2 text-gray-500">Start by creating your first prompt.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {prompts.map((prompt: any) => (
            <div
              key={prompt.id}
              className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <h3 className="font-semibold text-gray-900 line-clamp-1">{prompt.name}</h3>
                {prompt.isPublic && (
                  <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                    Public
                  </span>
                )}
              </div>
              <p className="mt-2 line-clamp-3 text-sm text-gray-600">{prompt.content}</p>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {prompt.tags?.map((tag: string) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-600"
                  >
                    <Tag className="h-3 w-3" />
                    {tag}
                  </span>
                ))}
              </div>
              <div className="mt-4 flex items-center gap-1 text-xs text-gray-400">
                <Clock className="h-3 w-3" />
                v{prompt.version}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
