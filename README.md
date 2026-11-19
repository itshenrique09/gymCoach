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
| `src/data/exercises-extra.ts` | Catálogo alargado (~1100 exercícios) — ficheiro gerado, ver Créditos |
| `src/engine/progression.ts` | **O "cérebro" do PT.** A carga só sobe quando foi conquistada. Progressão dupla com autorregulação por esforço (RIR): topo do intervalo em todas as séries → sobe; abaixo do mínimo de reps → desce; no limite → repete antes de pedir mais; no limite + reps a cair → recua; 3 sessões sem avançar → deload; 5 → troca. Séries desiguais são igualadas antes de somar reps. Três métodos à escolha nas Definições (progressão dupla, pirâmide crescente, linear); seja qual for, um exercício treinado em pirâmide (60×12 → 65×10 → 70×8) sobe um degrau quando cada série apanha as reps da de baixo, e uma escada de reps iguais (60 → 65 → 70 × 6) sobe ou desce toda junta conforme a série mais pesada |
| `src/lib/db.ts` | Persistência IndexedDB (sessões, rotinas, definições, cache de media) |
| `src/lib/exercisedb.ts` | Demonstrações (GIF + instruções), pedidas ao servidor, (GIF + instruções) com cache offline e fallback |
| `server/exercisedb.mjs` | Proxy da ExerciseDB: guarda a chave e as demonstrações já pedidas |
| `src/lib/stats.ts` | 1RM estimado (Epley), recordes, séries semanais por músculo, sequência de semanas e próximo treino |
| `src/lib/backup.ts` | Exportar / restaurar cópia de segurança (JSON) e exportar CSV |
| `src/components/ui.tsx` | Peças de interface partilhadas (folhas inferiores, cabeçalhos, anel, etc.) |
| `src/lib/session.ts` | Monta o treino do dia já pré-preenchido com as recomendações |
| `src/lib/notify.ts` | Som + vibração no fim do descanso (com a app aberta) |
| `src/hooks/useRestTimer.ts` | Timer de descanso baseado em timestamp absoluto |
| `src/pages/Session.tsx` | Ecrã do treino ativo (registo de séries + esforço RIR) |
| `src/pages/RoutineEditor.tsx` | Criar/editar/apagar treinos (exercícios, séries, descanso, ordem) |
| `src/pages/ExerciseDetail.tsx` | GIF, instruções, recorde 1RM e gráfico de progresso |

## Funcionalidades

- **Início** — anel da meta semanal, dias treinados (Seg–Dom), semanas seguidas
  e o **próximo treino** do plano já sugerido (roda pela ordem do plano).
- **Treino ativo** — steppers ou escrita direta de peso/reps, tipos de série
  (toca no número: aquecimento, drop set, falha), seta ↑/=/↓ face à mesma série
  da última vez, troféu ao vivo em recordes (1RM estimado ou maior carga), notas
  por exercício e por treino, adicionar / trocar / reordenar / remover
  exercícios a meio, e exercícios concluídos que se recolhem sozinhos.
- **Minimizar o treino** — o treino continua a contar enquanto navegas na app;
  o botão central da barra mostra o relógio e leva-te de volta.
- **Treino livre** — começa vazio e adiciona exercícios à medida.
- **Progresso** — resumo (volume semanal, consistência, séries por músculo na
  semana face ao intervalo recomendado de 10–20, com meias séries para músculos
  secundários), histórico em calendário com detalhe de cada treino (repetir /
  apagar), recordes por exercício e peso corporal.
- **Exercícios** — mais de 1200 exercícios, pesquisa em português ou inglês,
  filtros por músculo e equipamento, **exercícios personalizados**,
  e em cada exercício: 1RM estimado, maior carga, cargas estimadas por nº de
  reps e últimas sessões.
- **Definições** — cor de destaque, meta semanal, descanso automático, peso da
  barra, **cópia de segurança** (exportar / restaurar JSON) e exportação CSV.

Em desenvolvimento (`npm run dev`) as Definições têm ainda um botão para carregar
dados de demonstração.

## Estado

**Fase 1 — completa.** Instalável, offline. Criar/editar treinos, registo de
séries com esforço (RIR), timer de descanso (som/vibração **com a
app aberta**), histórico, página de cada exercício com demonstração e progresso,
e motor de progressão autorregulado.

### Demonstrações (GIFs)

As demonstrações vêm da API ExerciseDB, mas a app nunca vê a chave: pede-as ao
seu próprio servidor (`server/exercisedb.mjs`), que tem a chave, vai buscá-las
uma vez e guarda-as em `server/cache/`. A partir daí toda a gente as recebe do
servidor, sem gastar a quota, e cada telemóvel guarda o GIF em IndexedDB para o
mostrar offline.

A chave fica em `server/.env` (fora do git):

```bash
cp server/.env.example server/.env   # depois preenche EXERCISEDB_KEY
```

Em desenvolvimento corre o servidor ao lado do Vite (`npm run server` e
`npm run dev`): o Vite encaminha `/api` para ele.

## Deploy

### Na tua VPS (servidor único)

`server/index.mjs` é um servidor Express pequeno que serve a app já compilada
(`./dist`) e as demonstrações dos exercícios. Na VPS (Node ≥ 20):

```bash
git clone https://github.com/itshenrique09/gymCoach.git && cd gymCoach
npm install
npm run build                    # gera ./dist
npm --prefix server install
echo 'EXERCISEDB_KEY=<a-tua-chave>' > server/.env   # fora do git
PORT=8787 node server/index.mjs
```

Isto serve tudo em `http://IP:8787`. Falta só **HTTPS** (obrigatório para
instalar a PWA) — mete um reverse-proxy à frente. Exemplo com **Caddy** (HTTPS
automático):

```
treino.oteudominio.com {
    reverse_proxy localhost:8787
}
```

Para manter o processo vivo: `pm2 start server/index.mjs --name gym-coach` (ou um
serviço systemd).

> Se mudares a `EXERCISEDB_KEY`, basta reiniciar o servidor
> (`pm2 restart gym-coach`); não é preciso compilar de novo.

### Render (site estático, grátis)

O `render.yaml` cria um site estático: Render → **New → Blueprint** → escolhe o
repo. Um site estático não tem servidor, por isso fica sem as demonstrações dos
exercícios; tudo o resto funciona.

## Temporizador de descanso e ecrã bloqueado

O fim do descanso dá **som + vibração com a app aberta**. Não há notificações
do sistema: um contador a correr no ecrã bloqueado do iPhone (Live Activity) só
é possível numa app nativa, não numa PWA.

## Instalar no iPhone

1. Servir a app por HTTPS (em dev: `npm run dev -- --host` + Safari na mesma
   rede; em produção: deploy num host grátis).
2. Safari → Partilhar → **Adicionar ao ecrã principal**.

## Créditos

Os nomes em inglês, músculo-alvo e equipamento do catálogo alargado
(`src/data/exercises-extra.ts`) vêm do
[exercises-dataset](https://github.com/hasaneyldrm/exercises-dataset) de Hasan
Emir Yıldırım (dados ExerciseDB v1), sob licença MIT — texto completo em
[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). Os nomes em português foram
escritos para esta app. Nenhuma imagem desse conjunto de dados é incluída: os
GIFs de demonstração continuam a vir da API ExerciseDB com a tua chave.
