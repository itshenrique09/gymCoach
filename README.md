# Gym Coach 🏋️

PWA de treino para iPhone (instalável, funciona offline) que age como um
personal trainer: regista séries, controla o descanso e decide quando subir
carga, manter, fazer deload ou trocar de exercício.

## Stack

- **Vite 8 + React 19 + TypeScript**
- **Tailwind CSS 4**
- **IndexedDB** (via `idb`) para histórico local — sem servidor, sem conta
- **vite-plugin-pwa** — manifest + service worker (instalável / offline)

## Como correr

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # build de produção (gera o service worker da PWA)
```

## Arquitetura

| Ficheiro | Responsabilidade |
|----------|------------------|
| `src/data/exercises.ts` | Biblioteca de exercícios + rotinas, com config de progressão e `demoQuery` (termo p/ o GIF) |
| `src/engine/progression.ts` | **O "cérebro" do PT.** Progressão dupla com autorregulação por RIR: carga de trabalho = peso mais frequente (ignora aquecimento); topo do range → sobe; à falha + reps a cair → recua; estagnação ≥3 → deload; ≥5 → troca |
| `src/lib/db.ts` | Persistência IndexedDB (sessões, rotinas, definições, cache de media) |
| `src/lib/exercisedb.ts` | Cliente ExerciseDB (GIF + instruções) com cache offline e fallback |
| `src/lib/stats.ts` | 1RM estimado (Epley) e evolução por exercício |
| `src/lib/session.ts` | Monta o treino do dia já pré-preenchido com as recomendações |
| `src/lib/notify.ts` | Som + vibração + notificação no fim do descanso |
| `src/hooks/useRestTimer.ts` | Timer de descanso baseado em timestamp absoluto |
| `src/pages/Session.tsx` | Ecrã do treino ativo (registo de séries + esforço RIR) |
| `src/pages/RoutineEditor.tsx` | Criar/editar/apagar treinos (exercícios, séries, descanso, ordem) |
| `src/pages/ExerciseDetail.tsx` | GIF, instruções, recorde 1RM e gráfico de progresso |

## Estado

**Fase 1 — completa.** Instalável, offline. Criar/editar treinos, registo de
séries com esforço (RIR), timer de descanso (som/vibração/notificação **com a
app aberta**), histórico, página de cada exercício com demonstração e progresso,
e motor de progressão autorregulado.

### Demonstrações (GIFs)

A chave da ExerciseDB vive em `.env.local` (fora do git), não na UI:

```bash
cp .env.example .env.local   # depois preenche VITE_EXERCISEDB_KEY
```

A app busca metadados + GIF (dois endpoints autenticados), guarda o GIF como
blob em IndexedDB e mostra-o offline a partir daí.

> ⚠️ Sendo uma app cliente estática, o Vite embute `VITE_EXERCISEDB_KEY` no
> bundle no build. Para uso pessoal não há problema; se publicares, restringe/
> roda a chave (ou serve via proxy).

## Notificações com o ecrã bloqueado (Web Push) — implementado

Com o iPhone bloqueado o JavaScript adormece, por isso o timer in-app não
dispara em background. A solução é **Web Push** servido por um pequeno backend:

- `server/index.mjs` — servidor Node (`web-push`) com `/schedule` e `/cancel`
- `src/sw.ts` — service worker que recebe o `push` e mostra a notificação
- `src/lib/push.ts` — subscreve o dispositivo e agenda o push ao iniciar descanso

Fluxo: marcas uma série → a app pede ao servidor "envia push daqui a Xs" → o
servidor envia na hora certa → notificação no telemóvel (app aberta ou não).

### Correr localmente

```bash
cp server/.env.example server/.env   # cola o par de chaves VAPID
cp .env.example .env.local           # cola a chave PÚBLICA + URL do servidor
npm run server                       # porta 8787
npm run dev                          # noutro terminal
```

Gerar chaves VAPID: `npx web-push generate-vapid-keys` (pública → ambos os
ficheiros; privada → só `server/.env`).

### Testar no iPhone (requisitos)

1. O servidor de push tem de estar acessível por **HTTPS** (Web Push não
   funciona em http fora de localhost). Em dev rápido: um túnel (ex. `cloudflared`
   / `ngrok`) para o `:8787`; em produção: deploy grátis em Render / Railway / Fly.
2. Aponta `VITE_PUSH_SERVER` (em `.env.local`) para esse URL HTTPS e faz `build`.
3. Serve a app por HTTPS, abre no Safari → **Adicionar ao ecrã principal**.
4. Abre a partir do ícone, começa um treino e **autoriza as notificações**.

Requisito iOS: PWA no ecrã principal (iOS 16.4+) e telemóvel com rede no momento.

### Deploy grátis (Render, ~5 min)

Há um blueprint pronto em `render.yaml` que cria os dois serviços (servidor de
push + app estática), ambos no plano free.

1. Põe este projeto num repositório GitHub.
2. Render → **New → Blueprint** → escolhe o repo. Ele lê o `render.yaml`.
3. Preenche as variáveis de ambiente (marcadas `sync: false`):
   - **gym-coach-push**: `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` (o par que já
     tens em `server/.env`).
   - **gym-coach-app**: `VITE_EXERCISEDB_KEY`, `VITE_VAPID_PUBLIC_KEY` (a mesma
     pública) e `VITE_PUSH_SERVER` = o URL do serviço de push
     (ex. `https://gym-coach-push.onrender.com`).
4. Deploy. Abre o URL da app no Safari do iPhone → **Adicionar ao ecrã
   principal** → abre pelo ícone → autoriza notificações.

> Nota: no plano free do Render o servidor "adormece" após inatividade e demora
> ~30s a acordar no primeiro pedido. Para o timer de descanso isso é irrelevante
> (o pedido é feito no início do descanso, com margem). Railway/Fly.io são
> alternativas equivalentes.

Alternativa para **testar já** sem deploy: um túnel temporário com HTTPS
(`cloudflared tunnel --url http://localhost:8787` para o servidor e outro para o
`:5180`), apontando `VITE_PUSH_SERVER` para o URL do túnel.

### Deploy na tua VPS (servidor único — recomendado)

O servidor (`server/index.mjs`) serve **a app E os endpoints de push** no mesmo
processo/porta. Assim o cliente fala com o push no **mesmo domínio** e não
precisas de configurar `VITE_PUSH_SERVER`.

Na VPS (Node ≥ 20):

```bash
git clone https://github.com/itshenrique09/gymCoach.git && cd gymCoach
npm install

# segredos (NÃO estão no git):
cp server/.env.example server/.env      # cola VAPID_PUBLIC_KEY + VAPID_PRIVATE_KEY
printf 'VITE_EXERCISEDB_KEY=<a-tua-chave>\nVITE_VAPID_PUBLIC_KEY=<a-publica>\n' > .env.local

npm run build                            # gera ./dist (embute as chaves VITE_)
npm --prefix server install
PORT=8787 node --env-file=server/.env server/index.mjs
```

Isto serve tudo em `http://IP:8787`. Falta só **HTTPS** (obrigatório para PWA +
push) — mete um reverse-proxy à frente. Exemplo com **Caddy** (HTTPS automático):

```
treino.oteudominio.com {
    reverse_proxy localhost:8787
}
```

Para manter o processo vivo: `pm2 start server/index.mjs --name gym-coach` (ou um
serviço systemd). Depois, no iPhone: abre `https://treino.oteudominio.com` no
Safari → **Adicionar ao ecrã principal** → autoriza notificações.

> Sempre que mudares o `VITE_EXERCISEDB_KEY`/`VITE_VAPID_PUBLIC_KEY`, corre
> `npm run build` de novo (as variáveis `VITE_` são embutidas no build).

## Instalar no iPhone

1. Servir a app por HTTPS (em dev: `npm run dev -- --host` + Safari na mesma
   rede; em produção: deploy num host grátis).
2. Safari → Partilhar → **Adicionar ao ecrã principal**.
