import { useEffect, useState } from 'react';
import type { Plan, Routine } from '../types';
import { getPlans, getRoutines, getSettings, savePlan, saveSettings } from '../lib/db';
import { estMinutes } from '../lib/session';
import { relDays } from '../lib/format';
import { IconButton, PageHeader, Tag } from '../components/ui';
import { Icon } from '../components/icons';

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
  const [routines, setRoutines] = useState<Record<string, Routine>>({});
  const [activeId, setActiveId] = useState<string | undefined>();

  async function load() {
    const [p, s, r] = await Promise.all([getPlans(), getSettings(), getRoutines()]);
    // Active plan first, then newest.
    setPlans(p.sort((a, b) => Number(b.id === s.activePlanId) - Number(a.id === s.activePlanId) || b.createdAt - a.createdAt));
    setRoutines(Object.fromEntries(r.map((x) => [x.id, x])));
    setActiveId(s.activePlanId);
  }

  useEffect(() => {
    void load();
  }, [reloadKey]);

  async function activate(plan: Plan) {
    const settings = await getSettings();
    await saveSettings({ ...settings, activePlanId: plan.id });
    await savePlan({ ...plan, activatedAt: Date.now() });
    await load();
    onChanged();
  }

  async function deactivate() {
    const settings = await getSettings();
    await saveSettings({ ...settings, activePlanId: undefined });
    await load();
    onChanged();
  }

  return (
    <div className="mx-auto max-w-md px-4 pt-safe">
      <PageHeader title="Planos" action={<IconButton icon="plus" label="Criar plano" tone="tint" onClick={onCreatePlan} />} />

      {plans === null ? (
        <div className="space-y-3">
          {[0, 1].map((i) => (
            <div key={i} className="h-36 animate-pulse rounded-[22px] bg-surface" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {plans.map((plan) => {
            const active = plan.id === activeId;
            const list = plan.routineIds.map((id) => routines[id]).filter(Boolean);
            return (
              <article key={plan.id} className={active ? 'card-hero p-4' : 'card p-4'}>
                <button onClick={() => onEditPlan(plan.id)} className="press block w-full text-left">
                  <div className="flex items-center gap-2">
                    <h2 className="min-w-0 flex-1 truncate text-[19px] font-extrabold tracking-tight text-label">{plan.name}</h2>
                    {active && <Tag tone="tint">Ativo</Tag>}
                    <Icon name="chevronRight" size={18} className="shrink-0 text-label3" />
                  </div>
                  {plan.description && <p className="mt-0.5 text-[14px] text-label2">{plan.description}</p>}
                  <p className="mt-1 text-[12.5px] text-label3">
                    {list.length} {list.length === 1 ? 'treino' : 'treinos'}
                    {active && plan.activatedAt ? ` · ativo ${relDays(plan.activatedAt)}` : ''}
                  </p>
                </button>

                {list.length > 0 && (
                  <ul className="mt-3 space-y-1.5">
                    {list.map((r, i) => (
                      <li key={r.id} className="flex items-baseline gap-2.5 text-[14px]">
                        <span className="tnum w-4 shrink-0 text-right text-[12px] font-bold text-label3">{i + 1}</span>
                        <span className="min-w-0 flex-1 truncate text-label">{r.name}</span>
                        <span className="tnum shrink-0 text-[12.5px] text-label3">
                          {r.items.length} ex. · ~{estMinutes(r)} min
                        </span>
                      </li>
                    ))}
                  </ul>
                )}

                {active ? (
                  <button onClick={() => void deactivate()} className="press mt-3 -mb-1 rounded-full py-1.5 text-[13.5px] font-semibold text-label3">
                    Desativar plano
                  </button>
                ) : (
                  <button onClick={() => void activate(plan)} className="press btn-secondary mt-4 !min-h-[46px]">
                    Ativar plano
                  </button>
                )}
              </article>
            );
          })}

          <button onClick={onCreatePlan} className="press btn-secondary">
            <Icon name="plus" size={18} />
            Criar plano
          </button>
        </div>
      )}
    </div>
  );
}
