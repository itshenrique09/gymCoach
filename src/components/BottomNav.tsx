import type { ReactNode } from 'react';

export type Tab = 'today' | 'plans' | 'progress' | 'library';

const ITEMS: { id: Tab; label: string; icon: ReactNode }[] = [
  {
    id: 'today',
    label: 'Hoje',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" className="h-[24px] w-[24px]">
        <path d="M6.5 6.5 17.5 17.5M4 7v10M7 4h10M20 7v10M17 20H7M2 9v6M22 9v6" />
      </svg>
    ),
  },
  {
    id: 'plans',
    label: 'Planos',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-[24px] w-[24px]">
        <rect x="4" y="3" width="16" height="18" rx="2.5" />
        <path d="M8 8h8M8 12h8M8 16h5" />
      </svg>
    ),
  },
  {
    id: 'progress',
    label: 'Progresso',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-[24px] w-[24px]">
        <path d="M4 19V5M4 19h16M8 16l3.5-4 3 2.5L20 8" />
      </svg>
    ),
  },
  {
    id: 'library',
    label: 'Exercícios',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-[24px] w-[24px]">
        <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
      </svg>
    ),
  },
];

export function BottomNav({ tab, onChange }: { tab: Tab; onChange: (t: Tab) => void }) {
  return (
    <nav className="material fixed inset-x-0 bottom-0 z-20 border-t border-line/80 pb-safe">
      <div className="mx-auto flex max-w-md items-stretch">
        {ITEMS.map((item) => {
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onChange(item.id)}
              className={`flex flex-1 flex-col items-center gap-0.5 pt-2 pb-1.5 ${active ? 'text-tint' : 'text-label3'}`}
            >
              {item.icon}
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
