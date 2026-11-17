import { useEffect, type ReactNode } from 'react';
import { Icon, type IconName } from './icons';

/** Large page title with an optional eyebrow line and trailing action. */
export function PageHeader({ title, eyebrow, action }: { title: string; eyebrow?: string; action?: ReactNode }) {
  return (
    <header className="flex items-end justify-between gap-3 pt-4 pb-5">
      <div className="min-w-0">
        {eyebrow && <p className="eyebrow mb-1.5">{eyebrow}</p>}
        <h1 className="large-title truncate text-label">{title}</h1>
      </div>
      {action}
    </header>
  );
}

/** Round icon button used in headers. */
export function IconButton({
  icon,
  label,
  onClick,
  tone = 'plain',
  size = 40,
}: {
  icon: IconName;
  label: string;
  onClick?: () => void;
  tone?: 'plain' | 'tint' | 'ghost';
  size?: number;
}) {
  const tones = {
    plain: 'bg-surface-2 text-label',
    tint: 'bg-tint text-on-tint',
    ghost: 'text-label2',
  };
  return (
    <button
      onClick={onClick}
      aria-label={label}
      style={{ width: size, height: size }}
      className={`press flex shrink-0 items-center justify-center rounded-full ${tones[tone]}`}
    >
      <Icon name={icon} size={Math.round(size * 0.5)} />
    </button>
  );
}

/** Sticky bar for pushed screens: back button, centred title, trailing slot. */
export function TopBar({ title, onBack, backLabel = 'Voltar', right }: { title?: string; onBack: () => void; backLabel?: string; right?: ReactNode }) {
  return (
    <header className="material sticky top-0 z-10 -mx-4 flex min-h-[52px] items-center justify-between gap-2 border-b border-line px-3 pt-1.5 pb-2">
      <button onClick={onBack} className="press flex items-center gap-0.5 rounded-full py-1.5 pr-3 pl-1 text-[15px] font-medium text-tint">
        <Icon name="chevronLeft" size={20} stroke={2.2} />
        {backLabel}
      </button>
      {title && <span className="nav-title pointer-events-none absolute left-1/2 max-w-[50%] -translate-x-1/2 truncate text-label">{title}</span>}
      <div className="flex items-center gap-2 pr-1">{right}</div>
    </header>
  );
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mt-7 mb-2.5 flex items-center justify-between px-1">
      <h2 className="eyebrow">{children}</h2>
      {action}
    </div>
  );
}

export function Chip({ children, active, onClick }: { children: ReactNode; active?: boolean; onClick?: () => void }) {
  const cls = `shrink-0 rounded-full px-3 py-1.5 text-[13px] font-semibold ${active ? 'bg-tint text-on-tint' : 'bg-surface-2 text-label2'}`;
  if (!onClick) return <span className={cls}>{children}</span>;
  return (
    <button onClick={onClick} aria-pressed={active} className={`press ${cls}`}>
      {children}
    </button>
  );
}

/** Small non-interactive tag. */
export function Tag({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'tint' | 'gold' | 'warm' | 'danger' }) {
  const tones = {
    neutral: 'bg-surface-2 text-label2',
    tint: 'bg-tint/15 text-tint',
    gold: 'bg-gold/15 text-gold',
    warm: 'bg-warm/15 text-warm',
    danger: 'bg-danger/15 text-danger',
  };
  return <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[12px] font-semibold ${tones[tone]}`}>{children}</span>;
}

/** iOS-style segmented control. */
export function Segmented<T extends string>({ value, options, onChange }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div role="tablist" className="flex gap-1 rounded-[14px] bg-surface p-1 shadow-[inset_0_0_0_1px_var(--color-line)]">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={`flex-1 rounded-[10px] py-2 text-[13.5px] font-semibold transition-colors ${active ? 'bg-surface-3 text-label' : 'text-label3'}`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/** Circular progress ring. Children are centred inside it. */
export function Ring({ value, size = 76, stroke = 8, children }: { value: number; size?: number; stroke?: number; children?: ReactNode }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, value));
  return (
    <div className="relative flex shrink-0 items-center justify-center" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-surface-3)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--color-tint)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          style={{ transition: 'stroke-dashoffset .6s var(--ease-out-soft)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  );
}

export function StatTile({ value, label, accent, icon }: { value: string | number; label: string; accent?: boolean; icon?: IconName }) {
  // "82 kg" → big number + small unit, so long values still fit on one line.
  const m = typeof value === 'string' ? /^(.+)\s(kg|t|h|min)$/.exec(value) : null;
  return (
    <div className="card min-w-0 flex-1 px-3.5 py-3.5">
      {icon && <Icon name={icon} size={17} className={accent ? 'mb-2 text-tint' : 'mb-2 text-label3'} />}
      <div className={`display-num text-[23px] whitespace-nowrap ${accent ? 'text-tint' : 'text-label'}`}>
        {m ? m[1] : value}
        {m && <span className="ml-1 text-[13px] font-bold tracking-normal text-label3">{m[2]}</span>}
      </div>
      <div className="mt-1.5 text-[12px] font-medium text-label3">{label}</div>
    </div>
  );
}

export function EmptyState({ icon, title, text, action }: { icon: IconName; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="card flex flex-col items-center px-6 py-10 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-tint/12 text-tint">
        <Icon name={icon} size={26} />
      </span>
      <p className="mt-4 text-[16px] font-bold text-label">{title}</p>
      {text && <p className="mt-1 max-w-[260px] text-[14px] leading-snug text-label2">{text}</p>}
      {action && <div className="mt-5 w-full">{action}</div>}
    </div>
  );
}

/**
 * Bottom sheet with a dimmed backdrop. `full` makes it take (almost) the whole
 * screen for pickers; otherwise it hugs its content.
 */
export function Sheet({ title, onClose, children, full, footer }: { title?: string; onClose: () => void; children: ReactNode; full?: boolean; footer?: ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end" role="dialog" aria-modal="true" aria-label={title}>
      <button aria-label="Fechar" onClick={onClose} className="animate-fade absolute inset-0 cursor-default bg-black/60" />
      <div className={`animate-sheet relative mx-auto flex w-full max-w-md flex-col rounded-t-[28px] bg-surface shadow-[inset_0_1px_0_0_var(--color-line)] ${full ? 'h-[92%]' : 'max-h-[88%]'}`}>
        <div className="mx-auto mt-2.5 h-1 w-9 shrink-0 rounded-full bg-surface-3" />
        {title && (
          <div className="flex shrink-0 items-center justify-between px-5 pt-3 pb-2">
            <h2 className="text-[19px] font-bold tracking-tight text-label">{title}</h2>
            <IconButton icon="close" label="Fechar" onClick={onClose} size={32} />
          </div>
        )}
        <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-4 pt-2 pb-4">{children}</div>
        {footer && <div className="shrink-0 border-t border-line px-4 pt-3 pb-3">{footer}</div>}
        <div className="pb-safe shrink-0" />
      </div>
    </div>
  );
}

/** A tappable row inside an action sheet. */
export function SheetAction({ icon, label, hint, onClick, danger }: { icon: IconName; label: string; hint?: string; onClick: () => void; danger?: boolean }) {
  return (
    <button onClick={onClick} className={`press flex w-full items-center gap-3.5 rounded-2xl px-3 py-3 text-left ${danger ? 'text-danger' : 'text-label'}`}>
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${danger ? 'bg-danger/12' : 'bg-surface-2'}`}>
        <Icon name={icon} size={19} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[16px] font-semibold">{label}</span>
        {hint && <span className="block text-[13px] text-label3">{hint}</span>}
      </span>
    </button>
  );
}

/** Confirmation as a sheet (replaces the browser's native confirm()). */
export function ConfirmSheet({
  title,
  text,
  confirmLabel,
  onConfirm,
  onClose,
  danger = true,
}: {
  title: string;
  text?: string;
  confirmLabel: string;
  onConfirm: () => void;
  onClose: () => void;
  danger?: boolean;
}) {
  return (
    <Sheet title={title} onClose={onClose}>
      {text && <p className="px-1 pb-4 text-[15px] leading-snug text-label2">{text}</p>}
      <div className="space-y-2">
        <button
          onClick={() => {
            onClose();
            onConfirm();
          }}
          className={`press btn-secondary ${danger ? '!bg-danger !text-white' : '!bg-tint !text-on-tint'}`}
        >
          {confirmLabel}
        </button>
        <button onClick={onClose} className="press btn-secondary">
          Cancelar
        </button>
      </div>
    </Sheet>
  );
}

/** On/off switch. */
export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-[30px] w-[50px] shrink-0 rounded-full transition-colors ${checked ? 'bg-tint' : 'bg-surface-3'}`}
    >
      <span className={`absolute top-[3px] left-[3px] h-6 w-6 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : ''}`} />
    </button>
  );
}
