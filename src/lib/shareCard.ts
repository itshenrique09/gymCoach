import type { WorkoutSummary } from './summary';

const dateFmt = new Intl.DateTimeFormat('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' });

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function drawCard(sum: WorkoutSummary): HTMLCanvasElement {
  const W = 1080;
  const H = 1350;
  const P = 80;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  const font = "'Inter Variable', -apple-system, system-ui, sans-serif";

  ctx.fillStyle = '#0a0a0b';
  ctx.fillRect(0, 0, W, H);

  // Header
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#0a84ff';
  ctx.font = `600 34px ${font}`;
  ctx.fillText('GYM COACH', P, 140);

  ctx.fillStyle = '#ffffff';
  ctx.font = `700 88px ${font}`;
  ctx.fillText('Treino concluído', P, 250);

  ctx.fillStyle = 'rgba(235,235,245,0.6)';
  ctx.font = `400 38px ${font}`;
  const dateLabel = dateFmt.format(new Date(sum.date));
  ctx.fillText(`${sum.name} · ${dateLabel.charAt(0).toUpperCase()}${dateLabel.slice(1)}`, P, 320);

  // Stat blocks
  const stats: [string, string][] = [
    [`${sum.durationMin}′`, 'duração'],
    [`${sum.sets}`, 'séries'],
    [sum.volume.toLocaleString('pt-PT'), 'kg volume'],
  ];
  const gap = 24;
  const bw = (W - 2 * P - 2 * gap) / 3;
  const bh = 220;
  const by = 400;
  stats.forEach(([value, label], i) => {
    const bx = P + i * (bw + gap);
    ctx.fillStyle = '#1c1c1e';
    roundRect(ctx, bx, by, bw, bh, 28);
    ctx.fill();
    ctx.textAlign = 'center';
    ctx.fillStyle = i === 2 ? '#409cff' : '#ffffff';
    ctx.font = `700 66px ${font}`;
    ctx.fillText(value, bx + bw / 2, by + 120);
    ctx.fillStyle = 'rgba(235,235,245,0.6)';
    ctx.font = `500 30px ${font}`;
    ctx.fillText(label, bx + bw / 2, by + 170);
  });
  ctx.textAlign = 'left';

  // PRs
  let y = by + bh + 90;
  if (sum.prs.length > 0) {
    ctx.fillStyle = 'rgba(235,235,245,0.6)';
    ctx.font = `600 30px ${font}`;
    ctx.fillText('RECORDES PESSOAIS', P, y);
    y += 40;
    for (const pr of sum.prs.slice(0, 4)) {
      const rh = 130;
      ctx.fillStyle = '#1c1c1e';
      roundRect(ctx, P, y, W - 2 * P, rh, 28);
      ctx.fill();
      // trophy badge
      ctx.fillStyle = 'rgba(255,214,10,0.16)';
      roundRect(ctx, P + 30, y + 35, 60, 60, 16);
      ctx.fill();
      ctx.fillStyle = '#ffd60a';
      ctx.font = `700 30px ${font}`;
      ctx.textAlign = 'center';
      ctx.fillText('PR', P + 60, y + 74);
      ctx.textAlign = 'left';
      ctx.fillStyle = '#ffffff';
      ctx.font = `600 42px ${font}`;
      ctx.fillText(pr.name, P + 120, y + 60);
      ctx.fillStyle = 'rgba(235,235,245,0.6)';
      ctx.font = `400 32px ${font}`;
      ctx.fillText(`${pr.weight}kg × ${pr.reps}`, P + 120, y + 102);
      ctx.fillStyle = '#ffd60a';
      ctx.font = `700 46px ${font}`;
      ctx.textAlign = 'right';
      ctx.fillText(`${pr.e1rm} kg`, W - P - 30, y + 82);
      ctx.textAlign = 'left';
      y += rh + 20;
    }
  }

  // Footer
  ctx.fillStyle = 'rgba(235,235,245,0.35)';
  ctx.font = `500 30px ${font}`;
  ctx.textAlign = 'center';
  ctx.fillText('Registado com Gym Coach', W / 2, H - 70);
  ctx.textAlign = 'left';

  return canvas;
}

/** Render the summary as an image and share it (or download as fallback). */
export async function shareSummary(sum: WorkoutSummary): Promise<void> {
  const canvas = drawCard(sum);
  const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/png'));
  if (!blob) return;
  const file = new File([blob], 'treino.png', { type: 'image/png' });

  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
  if (nav.canShare && nav.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: 'Gym Coach', text: 'Mais um treino feito 💪' });
      return;
    } catch {
      /* user cancelled or share failed — fall back to download */
    }
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'treino.png';
  a.click();
  URL.revokeObjectURL(url);
}
