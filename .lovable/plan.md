

# Varredura RACE - OrganiCésar

O método RACE (Review, Analyze, Correct, Enhance) aplicado ao app identifica os seguintes pontos:

---

## R - REVIEW (Problemas encontrados)

### 1. Notificações hardcoded (mock)
O `NotificationContext.tsx` inicia com 2 notificações fake fixas (linhas 29-32): "Sofia marcou..." e "Feijão e Ovos...". Esses dados mock devem ser removidos.

### 2. Bug na edição de tarefas - filtro de responsáveis
Em `TasksPage.tsx` linha 35, o `simpleUsers` filtra apenas `tipo === 'simples'` para o dropdown de edição, mas o `CreateTaskDialog` já foi corrigido para mostrar todos os ativos. Inconsistência: ao editar uma tarefa atribuída a um master, ele não aparece no select.

### 3. Realtime causa `fetchAll()` excessivo
Cada mudança em qualquer tabela dispara `fetchAll()` que recarrega TODAS as tabelas. Com 6 tabelas monitoradas, uma única edição pode causar cascade de reloads desnecessários.

### 4. Race condition no `updateTaskStatus`
Ao concluir uma tarefa, o saldo e pontos são atualizados com valores lidos do estado local (`users.find()`), não do banco. Se dois masters aprovarem tarefas simultaneamente, o saldo pode ser sobrescrito incorretamente.

### 5. Botão "Novo Usuário" cria apenas localmente
O `addUser` em `AppContext.tsx` (linha 183) é um placeholder vazio - apenas chama `fetchAll()`. O formulário de "Novo Usuário" na `UsersPage` não faz nada real.

### 6. `editUser` permite alterar email no form mas não no auth
O formulário de edição permite mudar o email do perfil, mas isso não atualiza o email na tabela `auth.users`, criando dessincronização.

---

## A - ANALYZE (Problemas de segurança e performance)

### 7. Atualização de saldo/pontos feita no client-side
O `updateTaskStatus` calcula e atualiza `saldo` e `pontos` diretamente do frontend. Um usuário mal-intencionado poderia manipular esses valores. Isso deveria ser uma database function (trigger ou RPC).

### 8. Master pode editar seu próprio perfil via RLS, mas RLS de profiles só permite `auth.uid() = id`
Se um master tenta editar o perfil de OUTRO usuário via `editUser`, o update na tabela `profiles` vai falhar silenciosamente porque a policy só permite editar o próprio perfil. Falta uma policy para masters editarem outros perfis.

### 9. Sem tratamento de erros nas operações CRUD
Nenhuma das funções em `AppContext` (addTask, editTask, deletePantryItem, etc.) verifica o resultado do Supabase (`error`). Falhas são silenciosas.

### 10. Sem paginação
Todas as queries carregam todos os registros. Com o limite padrão de 1000 linhas do Supabase, dados podem ser perdidos silenciosamente em famílias com muitos registros históricos.

---

## C - CORRECT (Correções prioritárias)

| # | Correção | Impacto |
|---|----------|---------|
| 1 | Remover notificações mock do `NotificationContext` | Baixo |
| 2 | Corrigir filtro de responsáveis na edição de tarefas (usar `activeUsers` como no CreateTaskDialog) | Médio |
| 3 | Adicionar policy RLS para masters editarem outros perfis | Alto |
| 4 | Adicionar tratamento de erros em todas as operações CRUD do AppContext | Alto |
| 5 | Remover/desabilitar botão "Novo Usuário" (funcionalidade vazia) ou implementar via convite | Médio |
| 6 | Remover campo email do formulário de edição de usuário (não pode ser alterado) | Baixo |

---

## E - ENHANCE (Melhorias recomendadas)

| # | Melhoria | Complexidade |
|---|----------|-------------|
| 1 | Mover lógica de recompensas para uma database function (RPC ou trigger) para evitar race conditions e manipulação | Alta |
| 2 | Otimizar realtime: recarregar apenas a tabela que mudou em vez de fazer fetchAll() | Média |
| 3 | Adicionar loading states individuais nos botões de ação (aprovar, concluir, excluir) | Baixa |
| 4 | Adicionar empty states visuais com ilustrações nas páginas sem dados | Baixa |
| 5 | Adicionar confirmação antes de aprovar/rejeitar tarefas no Dashboard | Baixa |
| 6 | Persistir notificações no banco de dados em vez de manter apenas em memória | Média |
| 7 | Adicionar validação de data limite (não permitir datas passadas ao criar tarefas) | Baixa |
| 8 | Wrapping de `PageTransition` faltando nas páginas: ShoppingListPage, PantryPage, RewardsPage, UsersPage, ReportsPage, ProfilePage | Baixa |

---

## Resumo de Prioridades

```text
CRÍTICO (corrigir primeiro):
  ├── RLS: masters não conseguem editar perfis de outros
  ├── Race condition na atualização de saldo/pontos
  └── Erros silenciosos em operações CRUD

IMPORTANTE (corrigir em seguida):
  ├── Filtro inconsistente na edição de tarefas
  ├── Botão "Novo Usuário" sem funcionalidade
  └── Notificações mock hardcoded

MELHORIAS (implementar depois):
  ├── Otimizar realtime (fetch por tabela)
  ├── Loading states nos botões
  └── Persistir notificações no banco
```

Deseja que eu implemente as correções por ordem de prioridade?

