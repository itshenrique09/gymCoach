import { useEffect, useState } from 'react';
import type { Plan } from '../types';
import { getPlans, getSettings, savePlan, saveSettings } from '../lib/db';

function relDays(ts: number): string {
  const d = Math.floor((Date.now() - ts) / 86_400_000);
  if (d <= 0) return 'hoje';
  if (d === 1) return 'ontem';
  return `há ${d} dias`;
}

export function Plans({
  onEditPlan,
  onCreatePlan,
  onChanged,
  reloadKey,
}: {
  onEditPlan: (id: string) => void;
  onCreatePlan: () => void;
  onChanged: () => void;
  reloadKey: number;
}) {
  const [plans, setPlans] = useState<Plan[] | null>(null);
  const [activeId, setActiveId] = useState<string | undefined>();

  async function load() {
    const [p, s] = await Promise.all([getPlans(), getSettings()]);
    setPlans(p.sort((a, b) => b.createdAt - a.createdAt));
    setActiveId(s.activePlanId);
  }

  useEffect(() => {
    void load();
  }, [reloadKey]);

  async function activate(plan: Plan, on: boolean) {
    const settings = await getSettings();
    await saveSettings({ ...settings, activePlanId: on ? plan.id : undefined });
    if (on) await savePlan({ ...plan, activatedAt: Date.now() });
    await load();
    onChanged();
  }

  return (
    <div className="mx-auto max-w-md px-4 pt-safe">
      <header className="flex items-end justify-between pt-3 pb-4">
        <h1 className="large-title text-label">Planos</h1>
        <button onClick={onCreatePlan} aria-label="Criar plano" className="press pb-1.5 text-[28px] font-light leading-none text-tint">+</button>
      </header>

      {plans === null ? (
        <div className="space-y-3">{[0, 1].map((i) => (<div key={i} className="h-28 animate-pulse rounded-2xl bg-surface" />))}</div>
      ) : (
        <div className="space-y-3">
          {plans.map((plan) => {
            const active = plan.id === activeId;
            return (
              <div key={plan.id} className={`rounded-2xl bg-surface p-4 ${active ? 'ring-1 ring-tint' : ''}`}>
                <button onClick={() => onEditPlan(plan.id)} className="press block w-full text-left">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="truncate text-[17px] font-semibold text-label">{plan.name}</h3>
                    {active && <span className="shrink-0 rounded-full bg-tint/15 px-2.5 py-0.5 text-[12px] font-semibold text-tint">Ativo</span>}
                  </div>
                  {plan.description && <p className="mt-0.5 text-[13px] text-label2">{plan.description}</p>}
                  <p className="mt-1 text-[12px] text-label3">
                    {plan.routineIds.length} treinos{active && plan.activatedAt ? ` · ativo ${relDays(plan.activatedAt)}` : ''}
                  </p>
                </button>
                <button
                  onClick={() => activate(plan, !active)}
                  className={`press mt-3 w-full rounded-[12px] py-2.5 text-[15px] font-semibold ${active ? 'bg-surface-2 text-label' : 'btn-tint'}`}
                >
                  {active ? 'Desativar' : 'Ativar plano'}
                </button>
              </div>
            );
          })}

          <button onClick={onCreatePlan} className="press w-full rounded-2xl bg-surface py-3.5 text-[16px] font-medium text-tint">
            + Criar plano
          </button>
        </div>
      )}
    </div>
  );
}
