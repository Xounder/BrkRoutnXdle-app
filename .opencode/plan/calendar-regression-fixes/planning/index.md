# Planning Analysis — Calendar Regression Fixes

## Bugs Reportados

### 1. Google Calendar tasks não estão sendo puxadas
**Sintoma**: Eventos do Google Calendar não aparecem no calendário após carregar a página.

**Análise**:
- `useCalendarEvents(timeMin, timeMax)` é chamado em `DashboardPage.tsx:205` com range de 2 semanas
- React Query faz fetch de `/events` com `staleTime: 5min` — deve disparar no mount
- `useCalendarEvents.ts:22-30` faz merge: mantém eventos locais (sem ID da API) + adiciona eventos da API
- `CalendarContext.tsx:32-48` (`persistEvents`): toda vez que `setEvents` é chamado (inclusive pelo merge da API), persiste tudo em localStorage

**Causa raiz suspeita**: Se a chamada à API falha silenciosamente (erro de autenticação, CORS, etc.), `query.data` fica `undefined` e o merge nunca acontece. Não há tratamento de erro ou feedback visual.

---

### 2. Botão X em blocks no calendário não aparece/não funciona
**Sintoma**: O × de deleção em blocks (horário bloqueado) não aparece no calendário.

**Análise**:
- `handleEventDidMount` em `CalendarView.tsx:278-324`: mostra × apenas se `isGenerated || isBlock`
- Blocks têm `extendedProps.isBlock: true` → deveria funcionar
- Duas verificações de passado bloqueiam o ×:
  1. `if (props.isPast) return;` — para SingleDay blocks, `isPast` é setado
  2. `if (endMs < Date.now()) return;` — fallback para eventos sem `isPast`
- Para blocks **RecurringWeekday/RecurringPeriod**: `isPast` não existe em `extendedProps` (linha 209 retorna block inalterado). `endStr`/`startStr` do FC deve funcionar para cada ocorrência.

**Causa raiz suspeita**: CSS do FullCalendar com `overflow: hidden` escondendo o botão × (adicionado como absolute positioning dentro do elemento do evento). Ou a verificação de passado está incorreta para certos fusos horários.

---

### 3. Blocks no calendário não podem ser movidos
**Sintoma**: Arrastar um block para reposicionar não funciona.

**Análise**:
- `CalendarView.tsx:350`: `editable={true}` global
- `fcEvents`: block mapping (linhas 195-210) seta `eventStartEditable: !isPast` / `eventDurationEditable: !isPast` apenas para SingleDay
- Recurring blocks: sem esses atributos → usa default FC (`editable: true`) → OK
- `handleEventDrop` em `useScheduleEditing.ts:122-180`: trata `isBlock` corretamente (linhas 139-157), atualiza block via `updateBlock`
- `handleEventAllow` em `CalendarView.tsx:274-276`: chama `validateDrop` → `canDropAt(startStr, endStr)` **sem excluir o evento sendo arrastado** → pode rejeitar drop falso positivo

**Causa raiz suspeita**: `handleEventAllow` não passa `excludeEventId` para `canDropAt`, causando rejeição de drops válidos quando o block overlap com sua própria posição original. Ou `isEventPast` em `handleEventDrop` (linha 125) está bloqueando blocks válidos.

---

### 4. Task no calendário sem × para deleção
**Sintoma**: Eventos gerados (isGenerated) não mostram ×.

**Análise**:
- `handleEventDidMount:281`: `if (!props.isGenerated && !props.isBlock) return;` — generated events com `isGenerated: true` passam
- `handleEventDidMount:284`: `if (props.isPast) return;` — events in the past correctly blocked
- `DashboardPage.tsx:208-223` (`mappedPreviewEvents`): mapeia preview events com `isGenerated: true`
- `CalendarView.tsx:163`: eventos de `events[]` (CalendarContext) mapeiam `isGenerated: e.isGenerated`

**Causa raiz suspeita**: `isGenerated` pode estar `false` ou `undefined` em eventos que vieram da API do Google Calendar — por design, esses events não devem ter ×. Mas eventos inline criados via `handleCreateTaskInline` (DashboardPage:134-166) têm `isGenerated: true`. Se o × não aparece para eles, pode ser erro no CSS ou no `isPast` check.

---

### 5. Sidebar tasks podem ser arrastadas mas drop no calendário não funciona
**Sintoma**: Tasks no TaskPanel mostram cursor `grab` e permitem drag, mas ao soltar no calendário nada acontece.

**Análise**:
- `TaskCard.tsx`: `draggable="true"` + `handleDragStart` seta `dataTransfer` com `type: "task"`
- `CalendarView.tsx`: `droppable={true}` + `drop={handleExternalDrop}`
- `handleExternalDrop` em `CalendarView.tsx:266-272`: lê `dataTransfer.getData("application/json")` e chama `onExternalDrop`
- `DashboardPage.tsx:243-293` (`handleExternalDrop`):
  - Para `dragData.type === "task"`: calcula `end` como UTC (via `endDate.toISOString().slice(0,19)`) enquanto `start` é construído localmente — **inconsistência de timezone**
  - `if (!editing.canDropAt(start, end)) return;` — validação pode rejeitar devido ao timezone mismatch
  - Cria evento com `isGenerated: true`

**Causa raiz suspeita**: Timezone mismatch entre `start` (local) e `end` (UTC) faz `canDropAt` rejeitar ou FC exibir o evento incorretamente. `start` preserva timezone local (ex: `2026-06-26T09:00:00` sem offset = interpretado como local), enquanto `end` (`toISOString().slice(0,19)` = `2026-06-26T09:30:00` UTC) tem significado temporal diferente.

---

## Resumo de Causas Raiz

| Bug | Causa Raiz | Arquivos |
|-----|-----------|----------|
| 1. Google Calendar não sincroniza | Erro de API não tratado (sem fallback/feedback) | `useCalendar.ts`, `DashboardPage.tsx` |
| 2. × block não aparece | CSS do FC escondendo botão OU isPast incorreto | `CalendarView.tsx` |
| 3. Block não move | `handleEventAllow` sem `excludeEventId` | `CalendarView.tsx` |
| 4. × task não aparece | `isPast` check bloqueando eventos válidos OU CSS | `CalendarView.tsx` |
| 5. Sidebar drag não funciona | Timezone mismatch start/end + `canDropAt` rejeitando | `DashboardPage.tsx` |

## Abordagem Recomendada

Dividir em 3-4 tasks independentes:

1. **TASK-SYNC**: Tratamento de erro na API sync + loading state + feedback visual
2. **TASK-X-BUTTON**: Corrigir exibição do × em blocks e tasks (CSS + lógica isPast)
3. **TASK-DRAG**: Corrigir drag de blocks (excludeEventId em eventAllow) + sidebar drag (timezone)
4. **TASK-VALIDATE**: Revisar `canDropAt` para aceitar drops válidos (endHour check + timezone)
