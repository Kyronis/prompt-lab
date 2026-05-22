import { fetchModels } from '@/lib/api';
import { Cpu, Zap, Eye, Brain } from 'lucide-react';

export default async function ModelsPage() {
  let models = [];
  try {
    models = await fetchModels();
  } catch {
    // API may not be running
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Models</h1>
        <span className="rounded-full bg-primary-50 px-3 py-1 text-sm font-medium text-primary-700">
          {models.length} total
        </span>
      </div>

      {models.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center">
          <Cpu className="mx-auto h-10 w-10 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">No models yet</h3>
          <p className="mt-2 text-gray-500">Add models from your configured providers.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {models.map((model: any) => (
            <div
              key={model.id}
              className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50">
                    <Cpu className="h-5 w-5 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{model.name}</h3>
                    <p className="text-xs text-gray-500">{model.provider?.name ?? 'Unknown provider'}</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-600">
                  <Zap className="h-3 w-3" />
                  {model.maxTokens?.toLocaleString() ?? '-'} tokens
                </span>
                {model.isMultimodal && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-purple-50 px-2 py-1 text-xs font-medium text-purple-700">
                    <Eye className="h-3 w-3" />
                    Multimodal
                  </span>
                )}
                {model.supportsDeepThinking && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700">
                    <Brain className="h-3 w-3" />
                    Deep Thinking
                  </span>
                )}
              </div>

              <div className="mt-4">
                <span className="font-mono text-xs text-gray-400">{model.modelId}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
