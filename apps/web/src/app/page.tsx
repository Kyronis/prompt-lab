import Link from 'next/link';
import { Terminal, FolderKanban, ArrowRight, Play } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="space-y-12">
      <section className="rounded-2xl bg-white p-12 text-center shadow-sm">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
          Prompt Lab
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-gray-600">
          An open-source platform for prompt engineering, tuning, and evaluation.
        </p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <Link
            href="/playground"
            className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-6 py-3 font-medium text-white transition-colors hover:bg-primary-700"
          >
            <Play className="h-4 w-4" />
            Playground
          </Link>
          <Link
            href="/prompts"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-6 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-100"
          >
            <Terminal className="h-4 w-4" />
            Browse Prompts
          </Link>
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-6 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-100"
          >
            <FolderKanban className="h-4 w-4" />
            Projects
          </Link>
        </div>
      </section>

      <section className="grid gap-6 sm:grid-cols-4">
        {[
          {
            title: 'Create Prompts',
            desc: 'Write, version, and organize your prompts with rich metadata.',
          },
          {
            title: 'Playground',
            desc: 'Test prompts against real models with live execution and tuning.',
          },
          {
            title: 'Version Control',
            desc: 'Every edit creates a new version so you never lose a good prompt.',
          },
          {
            title: 'Collaborate',
            desc: 'Share prompts publicly or keep them private within your team.',
          },
        ].map((feature) => (
          <div
            key={feature.title}
            className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
          >
            <h3 className="font-semibold text-gray-900">{feature.title}</h3>
            <p className="mt-2 text-sm text-gray-600">{feature.desc}</p>
          </div>
        ))}
      </section>

      <section className="flex items-center justify-center">
        <Link
          href="https://github.com"
          target="_blank"
          className="inline-flex items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-700"
        >
          View on GitHub
          <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </div>
  );
}
