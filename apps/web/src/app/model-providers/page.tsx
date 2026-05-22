import { fetchModelProviders } from '@/lib/api';
import { Server, Link, Key } from 'lucide-react';

export default async function ModelProvidersPage() {
  let providers = [];
  try {
    providers = await fetchModelProviders();
  } catch {
    // API may not be running
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Model Providers</h1>
        <span className="rounded-full bg-primary-50 px-3 py-1 text-sm font-medium text-primary-700">
          {providers.length} total
        </span>
      </div>

      {providers.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center">
          <Server className="mx-auto h-10 w-10 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">No providers yet</h3>
          <p className="mt-2 text-gray-500">Add your first model provider to get started.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {providers.map((provider: any) => (
            <div
              key={provider.id}
              className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50">
                  <Server className="h-5 w-5 text-primary-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{provider.name}</h3>
                  <p className="text-sm text-gray-500">{provider._count?.models ?? 0} models</p>
                </div>
              </div>

              <div className="mt-4 space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Link className="h-4 w-4 text-gray-400" />
                  <span className="truncate">{provider.baseUrl}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Key className="h-4 w-4 text-gray-400" />
                  <span className="font-mono text-xs text-gray-400">
                    {provider.apiKey ? '••••••••' : 'No key'}
                  </span>
                </div>
              </div>

              <div className="mt-4">
                <span className="rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                  {provider.providerId}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
