import { useRef, useState, type ReactNode } from 'react';

const OPEN_X = -76;

/**
 * iOS-style swipe-to-delete row: drag left to reveal a red delete button.
 * Pointer-based so it works with touch and mouse; vertical scroll stays free
 * via touch-action: pan-y.
 */
export function SwipeRow({ onDelete, children }: { onDelete: () => void; children: ReactNode }) {
  const [dx, setDx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startX = useRef<number | null>(null);
  const startY = useRef(0);
  const openRef = useRef(false);

  function down(e: React.PointerEvent) {
    startX.current = e.clientX;
    startY.current = e.clientY;
    setDragging(true);
  }

  function move(e: React.PointerEvent) {
    if (startX.current === null) return;
    if (Math.abs(e.clientY - startY.current) > 28) {
      // clearly a vertical scroll — bail out
      startX.current = null;
      setDragging(false);
      setDx(openRef.current ? OPEN_X : 0);
      return;
    }
    const base = openRef.current ? OPEN_X : 0;
    setDx(Math.min(0, Math.max(OPEN_X - 24, base + (e.clientX - startX.current))));
  }

  function up() {
    if (startX.current === null) {
      setDragging(false);
      return;
    }
    startX.current = null;
    setDragging(false);
    const open = dx < OPEN_X / 2;
    openRef.current = open;
    setDx(open ? OPEN_X : 0);
  }

  return (
    <div className="relative overflow-hidden rounded-xl">
      <button
        onClick={() => {
          openRef.current = false;
          setDx(0);
          onDelete();
        }}
        tabIndex={dx === 0 ? -1 : 0}
        aria-label="Apagar série"
        className="absolute inset-y-0 right-0 flex w-[68px] items-center justify-center rounded-xl bg-rose-500 text-white"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
          <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
        </svg>
      </button>
      <div
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        onPointerLeave={() => dragging && up()}
        style={{ transform: `translateX(${dx}px)`, transition: dragging ? 'none' : 'transform .2s ease', touchAction: 'pan-y' }}
        className="relative"
      >
        {children}
      </div>
    </div>
  );
}
