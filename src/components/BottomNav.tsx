import { Icon, type IconName } from './icons';
import { fmtClock } from '../lib/format';

export type Tab = 'today' | 'plans' | 'progress' | 'library';

const LEFT: { id: Tab; label: string; icon: IconName }[] = [
  { id: 'today', label: 'Início', icon: 'home' },
  { id: 'plans', label: 'Planos', icon: 'plans' },
];
const RIGHT: { id: Tab; label: string; icon: IconName }[] = [
  { id: 'progress', label: 'Progresso', icon: 'chart' },
  { id: 'library', label: 'Exercícios', icon: 'dumbbell' },
];

function TabButton({ item, active, onClick }: { item: { id: Tab; label: string; icon: IconName }; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={`flex flex-1 flex-col items-center gap-1 pt-2.5 pb-2 transition-colors ${active ? 'text-tint' : 'text-label3'}`}
    >
      <Icon name={item.icon} size={23} stroke={active ? 2.2 : 1.8} />
      <span className="text-[10.5px] font-semibold">{item.label}</span>
    </button>
  );
}

/**
 * Tab bar with a raised centre action: starts a workout, or — while one is
 * running in the background — shows its clock and jumps back into it.
 */
export function BottomNav({
  tab,
  onChange,
  onStart,
  runningSeconds,
}: {
  tab: Tab;
  onChange: (t: Tab) => void;
  onStart: () => void;
  /** Elapsed seconds of the minimised workout, or null when none is running. */
  runningSeconds: number | null;
}) {
  const running = runningSeconds !== null;
  return (
    <nav className="material pb-safe fixed inset-x-0 bottom-0 z-20 border-t border-line">
      <div className="mx-auto flex max-w-md items-stretch px-1">
        {LEFT.map((item) => (
          <TabButton key={item.id} item={item} active={tab === item.id} onClick={() => onChange(item.id)} />
        ))}
        <div className="flex w-[84px] shrink-0 justify-center">
          <button
            onClick={onStart}
            aria-label={running ? 'Voltar ao treino em curso' : 'Começar treino'}
            className="press btn-tint -mt-5 flex h-[62px] w-[62px] flex-col items-center justify-center rounded-full shadow-[0_0_0_6px_var(--color-ink),0_14px_30px_-10px_color-mix(in_oklab,var(--accent)_75%,transparent)]"
          >
            {running ? (
              <>
                <span className="animate-soft-pulse h-1.5 w-1.5 rounded-full bg-on-tint" />
                <span className="tnum mt-1 text-[12.5px] leading-none font-extrabold">{fmtClock(runningSeconds)}</span>
              </>
            ) : (
              <Icon name="play" size={26} className="ml-0.5" />
            )}
          </button>
        </div>
        {RIGHT.map((item) => (
          <TabButton key={item.id} item={item} active={tab === item.id} onClick={() => onChange(item.id)} />
        ))}
      </div>
    </nav>
  );
}
