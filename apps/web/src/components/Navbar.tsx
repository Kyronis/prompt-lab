'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Terminal, FolderKanban, Home, Server, Cpu, Play } from 'lucide-react';

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/prompts', label: 'Prompts', icon: Terminal },
  { href: '/playground', label: 'Playground', icon: Play },
  { href: '/projects', label: 'Projects', icon: FolderKanban },
  { href: '/model-providers', label: 'Providers', icon: Server },
  { href: '/models', label: 'Models', icon: Cpu },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex h-14 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-semibold text-gray-900">
            <Terminal className="h-5 w-5 text-primary-600" />
            <span>Prompt Lab</span>
          </Link>
          <div className="flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
