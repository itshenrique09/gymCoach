import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { AppSettings, CoachLevel, ProgressionMethod } from '../types';
import { getSettings, resetAllData, saveSettings } from '../lib/db';
import { downloadBackup, downloadCsv, restoreBackup } from '../lib/backup';
import { ACCENTS, applyAccent } from '../lib/theme';
import { ConfirmSheet, SectionTitle, Toggle, TopBar } from '../components/ui';
import { Icon, type IconName } from '../components/icons';
import { Stepper } from '../components/Stepper';

const COACH_OPTIONS: { value: CoachLevel; title: string; desc: string }[] = [
  { value: 'off', title: 'Desligado', desc: 'Só registo de pesos e reps.' },
  { value: 'simple', title: 'Simples', desc: 'Sugere peso e reps. Sem jargão.' },
  { value: 'full', title: 'Treinador', desc: 'Analisa o esforço e ajusta como um PT.' },
];

const METHODS: { value: ProgressionMethod; title: string; desc: string; how: string; example: string }[] = [
  {
    value: 'double',
    title: 'Progressão dupla',
    desc: 'A mesma carga em todas as séries.',
    how: 'Ficas na mesma carga e vais somando reps dentro do intervalo do exercício. Quando todas as séries chegam ao topo do intervalo, a carga sobe e recomeças nas reps mais baixas.',
    example: '70 kg × 6, 6, 6 → 7, 7, 7 → 8, 8, 8 → 72,5 kg × 5, 5, 5',
  },
  {
    value: 'pyramid',
    title: 'Pirâmide crescente',
    desc: 'A carga sobe e as reps descem a cada série.',
    how: 'Cada série tem a sua carga e as suas reps. As séries de cima vão ganhando reps até apanharem a de baixo; quando todas apanham, a pirâmide sobe um degrau: sai a série mais leve e entra uma mais pesada no topo, para o máximo de reps que conseguires.',
    example: '60×12, 65×10, 70×8 → … → 60×12, 65×12, 70×10 → 65×12, 70×10, 75×máx.',
  },
  {
    value: 'linear',
    title: 'Progressão linear',
    desc: 'Reps fixas; a carga sobe a cada treino.',
    how: 'Fazes sempre as mesmas reps (o mínimo do intervalo do exercício). Se fechares todas as séries, a carga sobe no treino seguinte; se falhares, repetes a carga; à terceira falha seguida, tira 10% e volta a subir. Simples e rápido — bom para quem está a começar.',
    example: '3×5 a 70 kg → 72,5 kg → 75 kg → falhou → 75 kg',
  },
];

const BAR_WEIGHTS = [20, 15, 10];

function Row({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3">
      <div className="min-w-0">
        <div className="text-[16px] text-label">{label}</div>
        {hint && <div className="text-[13px] leading-snug text-label3">{hint}</div>}
      </div>
      <div className="flex shrink-0 items-center">{children}</div>
    </div>
  );
}

function ActionRow({ icon, label, hint, onClick, danger }: { icon: IconName; label: string; hint?: string; onClick: () => void; danger?: boolean }) {
  return (
    <button onClick={onClick} className={`press flex w-full items-center gap-3 px-4 py-3 text-left ${danger ? 'text-danger' : 'text-label'}`}>
      <Icon name={icon} size={20} className={danger ? '' : 'text-tint'} />
      <span className="min-w-0 flex-1">
        <span className="block text-[16px]">{label}</span>
        {hint && <span className="block text-[13px] leading-snug text-label3">{hint}</span>}
      </span>
    </button>
  );
}

export function Settings({ onBack }: { onBack: () => void }) {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [confirm, setConfirm] = useState<'reset' | 'import' | null>(null);
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const pendingFile = useRef<File | null>(null);

  useEffect(() => {
    void getSettings().then(setSettings);
  }, []);

  function update(patch: Partial<AppSettings>) {
    setSettings((s) => {
      if (!s) return s;
      const next = { ...s, ...patch };
      void saveSettings(next);
      return next;
    });
  }

  async function doImport() {
    const file = pendingFile.current;
    pendingFile.current = null;
    if (!file) return;
    try {
      const { sessions } = await restoreBackup(file);
      setMessage({ text: `Cópia restaurada: ${sessions} treinos. A recarregar…` });
      setTimeout(() => location.reload(), 900);
    } catch (e) {
      setMessage({ text: (e as Error).message, error: true });
    }
  }

  async function doReset() {
    await resetAllData();
    location.reload();
  }

  async function seedDemo() {
    const { seedDemoData } = await import('../lib/demo');
    await seedDemoData();
    location.reload();
  }

  if (!settings) return null;

  const accent = settings.accent ?? 'lime';
  const method = settings.progressionMethod ?? 'double';

  return (
    <div className="mx-auto max-w-md px-4 pt-safe pb-16">
      <TopBar onBack={onBack} backLabel="Início" title="Definições" />

      <SectionTitle>Cor de destaque</SectionTitle>
      <div className="card flex justify-between px-4 py-4">
        {ACCENTS.map((a) => (
          <button
            key={a.id}
            onClick={() => {
              applyAccent(a.id);
              update({ accent: a.id });
            }}
            aria-label={a.label}
            aria-pressed={accent === a.id}
            className="press flex flex-col items-center gap-1.5"
          >
            <span
              className="flex h-10 w-10 items-center justify-center rounded-full text-on-tint"
              style={{ background: a.color, boxShadow: accent === a.id ? `0 0 0 3px var(--color-surface), 0 0 0 5px ${a.color}` : undefined }}
            >
              {accent === a.id && <Icon name="check" size={18} stroke={2.8} />}
            </span>
            <span className={`text-[11.5px] font-semibold ${accent === a.id ? 'text-label' : 'text-label3'}`}>{a.label}</span>
          </button>
        ))}
      </div>

      <SectionTitle>Objetivo</SectionTitle>
      <div className="list">
        <Row label="Treinos por semana" hint="Define o anel e a meta no ecrã inicial.">
          <div className="flex w-[120px]">
            <Stepper value={settings.weeklyGoal ?? 4} step={1} min={1} label="Treinos por semana" onChange={(v) => update({ weeklyGoal: Math.min(7, Math.max(1, Math.round(v))) })} />
          </div>
        </Row>
      </div>

      <SectionTitle>Treinador</SectionTitle>
      <div className="list" role="radiogroup" aria-label="Nível do treinador">
        {COACH_OPTIONS.map((o) => {
          const active = settings.coachLevel === o.value;
          return (
            <button key={o.value} role="radio" aria-checked={active} onClick={() => update({ coachLevel: o.value })} className="press flex w-full items-center gap-3 px-4 py-3 text-left">
              <div className="flex-1">
                <div className="text-[16px] text-label">{o.title}</div>
                <div className="text-[13px] text-label3">{o.desc}</div>
              </div>
              <span className={`flex h-6 w-6 items-center justify-center rounded-full ${active ? 'bg-tint text-on-tint' : 'shadow-[inset_0_0_0_2px_var(--color-surface-3)]'}`}>
                {active && <Icon name="check" size={14} stroke={3} />}
              </span>
            </button>
          );
        })}
      </div>

      <SectionTitle>Método de progressão</SectionTitle>
      <div className="list" role="radiogroup" aria-label="Método de progressão">
        {METHODS.map((m) => {
          const active = method === m.value;
          return (
            <button key={m.value} role="radio" aria-checked={active} onClick={() => update({ progressionMethod: m.value })} className="press block w-full px-4 py-3 text-left">
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="text-[16px] text-label">{m.title}</div>
                  <div className="text-[13px] text-label3">{m.desc}</div>
                </div>
                <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${active ? 'bg-tint text-on-tint' : 'shadow-[inset_0_0_0_2px_var(--color-surface-3)]'}`}>
                  {active && <Icon name="check" size={14} stroke={3} />}
                </span>
              </div>
              {active && (
                <div className="mt-2.5 rounded-[14px] bg-surface-2/70 px-3 py-2.5">
                  <p className="text-[13.5px] leading-snug text-label2">{m.how}</p>
                  <p className="tnum mt-2 text-[12.5px] leading-snug font-semibold text-tint">{m.example}</p>
                </div>
              )}
            </button>
          );
        })}
      </div>
      <p className="mt-2.5 px-2 text-[12.5px] leading-snug text-label3">
        É o teu método por omissão: decide como um exercício novo começa e como progridem as séries com a mesma carga. Em qualquer método, um exercício que treines com cargas diferentes por série é
        tratado como pirâmide ou escada — e a carga só sobe quando foi conquistada.
      </p>

      <SectionTitle>Durante o treino</SectionTitle>
      <div className="list">
        <Row label="Descanso automático" hint="Inicia o temporizador ao marcar uma série.">
          <Toggle checked={settings.autoRest !== false} onChange={(v) => update({ autoRest: v })} label="Descanso automático" />
        </Row>
        <Row label="Ecrã ligado no descanso" hint="Se o telemóvel bloquear, o aviso sonoro não toca.">
          <Toggle checked={settings.keepAwake !== false} onChange={(v) => update({ keepAwake: v })} label="Ecrã ligado no descanso" />
        </Row>
        <Row label="Barra" hint="Para o cálculo dos discos.">
          <div className="flex gap-0.5 rounded-[11px] bg-surface-2 p-0.5">
            {BAR_WEIGHTS.map((w) => (
              <button
                key={w}
                onClick={() => update({ barWeight: w })}
                aria-pressed={(settings.barWeight ?? 20) === w}
                className={`tnum rounded-[9px] px-3 py-1.5 text-[14px] font-semibold ${(settings.barWeight ?? 20) === w ? 'bg-surface-3 text-label' : 'text-label3'}`}
              >
                {w} kg
              </button>
            ))}
          </div>
        </Row>
      </div>

      <SectionTitle>Os teus dados</SectionTitle>
      <div className="list">
        <ActionRow icon="download" label="Exportar cópia de segurança" hint="Ficheiro JSON com planos, treinos e histórico." onClick={() => void downloadBackup()} />
        <ActionRow icon="upload" label="Restaurar cópia de segurança" hint="Substitui os dados deste dispositivo." onClick={() => fileRef.current?.click()} />
        <ActionRow icon="chart" label="Exportar histórico em CSV" hint="Uma linha por série, para Excel ou Sheets." onClick={() => void downloadCsv()} />
        <ActionRow icon="trash" label="Apagar todos os dados" danger onClick={() => setConfirm('reset')} />
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (!file) return;
          pendingFile.current = file;
          setConfirm('import');
        }}
      />
      {message && (
        <p role="status" className={`mt-2.5 px-2 text-[13.5px] ${message.error ? 'text-danger' : 'text-tint'}`}>
          {message.text}
        </p>
      )}
      <p className="mt-2.5 px-2 text-[12.5px] leading-snug text-label3">
        Tudo fica guardado apenas neste dispositivo. Exporta uma cópia de vez em quando — se limpares os dados do browser ou trocares de telemóvel, é a única forma de recuperar o histórico.
      </p>

      {import.meta.env.DEV && (
        <>
          <SectionTitle>Desenvolvimento</SectionTitle>
          <div className="list">
            <ActionRow icon="bolt" label="Carregar dados de demonstração" hint="Acrescenta ~10 semanas de treinos fictícios." onClick={() => void seedDemo()} />
          </div>
        </>
      )}

      {confirm === 'reset' && (
        <ConfirmSheet
          title="Apagar todos os dados?"
          text="Treinos, histórico, peso corporal, exercícios personalizados e definições são apagados e a app volta ao estado inicial. Não dá para desfazer."
          confirmLabel="Apagar tudo"
          onConfirm={() => void doReset()}
          onClose={() => setConfirm(null)}
        />
      )}
      {confirm === 'import' && (
        <ConfirmSheet
          title="Restaurar cópia?"
          text="Os dados atuais deste dispositivo são substituídos pelos do ficheiro. Não dá para desfazer."
          confirmLabel="Substituir pelos da cópia"
          onConfirm={() => void doImport()}
          onClose={() => setConfirm(null)}
        />
      )}
    </div>
  );
}
