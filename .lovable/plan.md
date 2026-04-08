

# Varredura RACE - OrganiCesar (Abril 2026)

---

## R - REVIEW (Problemas encontrados)

### 1. Status "rejeitada" nao tratado na RPC `update_task_status`
A funcao `update_task_status` so aceita `pendente`, `em_progresso` e `concluida`. O Dashboard e TasksPage enviam `rejeitada` e `aguardando_aprovacao`, mas a RPC rejeita esses valores com "Invalid status". Tarefas rejeitadas e o fluxo de aprovacao estao quebrados silenciosamente.

### 2. Status "em_progresso" nao utilizado na UI
O tipo `TaskStatus` inclui apenas `pendente | aguardando_aprovacao | concluida | rejeitada`, mas a RPC aceita `em_progresso`. Ha inconsistencia entre o tipo TypeScript e o banco.

### 3. Tarefas concluidas pelo usuario simples vao direto para `concluida` via RPC
Quando o usuario simples clica "Concluir", o front envia `aguardando_aprovacao`, mas a RPC so aceita `pendente/em_progresso/concluida`. Se o status enviado for rejeitado, a tarefa nao muda. Se for aceito como `concluida`, pula a aprovacao do master.

### 4. Politicas RLS permissivas demais (6 ocorrencias)
INSERT e UPDATE em `pantry_items`, `shopping_items` e `meal_plans` usam `true` - qualquer usuario autenticado pode modificar qualquer registro sem restricao.

### 5. `fetchAll` chamado apos cada operacao CRUD
Cada `addTask`, `editTask`, `toggleShoppingItem` etc. chama `fetchAll()` que recarrega TODAS as tabelas. Isso causa lentidao e requests desnecessarios. O realtime ja cuida das atualizacoes.

### 6. Usuarios inativos aparecem no ranking e relatorios
O ranking no Dashboard e os relatorios nao filtram `user.ativo === false`.

---

## A - ANALYZE (Analise de impacto)

| Problema | Impacto | Risco |
|---|---|---|
| RPC nao aceita rejeitada/aguardando | Fluxo de aprovacao completamente quebrado | CRITICO |
| RLS `true` em INSERT/UPDATE | Qualquer usuario pode alterar dados de outros | ALTO |
| fetchAll em cada CRUD | Performance degradada, requests multiplicados | MEDIO |
| Usuarios inativos no ranking | Dados incorretos nos relatorios | BAIXO |

---

## C - CORRECT (Correcoes propostas)

### 1. Corrigir RPC `update_task_status` (CRITICO)
Atualizar a funcao para aceitar os status `aguardando_aprovacao` e `rejeitada`. Quando o status for `rejeitada`, reverter para `pendente`. Logica:
- Usuario simples so pode mudar `pendente` -> `aguardando_aprovacao`
- Master pode mudar `aguardando_aprovacao` -> `concluida` (delega para `complete_task_with_reward`) ou `rejeitada`
- Rejeicao volta o status para `pendente`

### 2. Restringir politicas RLS
Para `pantry_items`, `shopping_items`, `meal_plans`: manter INSERT/UPDATE liberado para todos autenticados (faz sentido no contexto familiar), mas isso e uma decisao de design aceita para este app.

### 3. Remover `fetchAll()` das operacoes CRUD
O realtime ja escuta as mudancas e chama fetch por tabela. Remover o `fetchAll()` redundante de `addTask`, `editTask`, `deleteTask`, `addPantryItem`, `editPantryItem`, etc. Deixar apenas no `updateTaskStatus` caso a RPC afete multiplas tabelas.

### 4. Filtrar usuarios inativos no ranking e relatorios
Adicionar `.filter(u => u.ativo)` no ranking do Dashboard e na lista de desempenho do ReportsPage.

---

## E - ENHANCE (Melhorias)

### 5. Historico de recompensas vazio - sem paginacao
A pagina RewardsPage mostra todos os registros sem limite. Adicionar scroll virtual ou paginacao para familias com historico longo.

### 6. Sidebar nao mostra avatar do usuario
O rodape da sidebar mostra apenas a inicial do nome. Deveria mostrar o avatar se disponivel.

### 7. Relatorios sem graficos
A pagina de relatorios mostra apenas barras CSS simples. Adicionar graficos visuais (pizza para distribuicao de tarefas, barras para evolucao semanal).

### 8. Validacao de validade na despensa
Itens com validade vencida nao sao destacados visualmente. Adicionar indicador de "vencido" na PantryPage.

### 9. Notificacoes perdem-se ao recarregar
As notificacoes sao armazenadas apenas em memoria (useState). Ao recarregar a pagina, todas somem.

---

## Prioridade de implementacao

```text
CRITICO (implementar primeiro):
  └── Corrigir RPC update_task_status para aceitar todos os status

ALTO (corrigir em seguida):
  └── Remover fetchAll redundante das operacoes CRUD

MEDIO (melhorias):
  ├── Filtrar usuarios inativos no ranking/relatorios
  ├── Avatar do usuario na sidebar
  └── Destaque de itens vencidos na despensa

BAIXO (implementar depois):
  ├── Paginacao no historico de recompensas
  ├── Graficos nos relatorios
  └── Persistir notificacoes no banco
```

