'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

const items = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/clients', label: 'Clients', icon: Users },
  
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-6 space-y-1">
      {items.map((it) => {
        const Icon = it.icon;
        const active =
          pathname === it.href ||
          (it.href !== '/' && pathname.startsWith(it.href));
        return (
          <Link
            key={it.href}
            href={it.href}
            className={cn(
              'flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition-colors',
              active
                ? 'bg-slate-900 text-white'
                : 'text-slate-700 hover:bg-slate-100'
            )}
          >
            <Icon className="h-4 w-4" />
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
