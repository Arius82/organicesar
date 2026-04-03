

# Varredura RACE - OrganiCesar (Abril 2026)

---

## R - REVIEW (Problemas encontrados)

### 1. Permissoes restritas demais para usuarios simples
Usuarios simples nao conseguem adicionar itens na despensa, lista de compras ou cardapio (`isMaster && <AddPantryItemDialog />`). Apenas o botao e escondido no frontend -- as politicas RLS permitem, mas a UI bloqueia. Isso impede a colaboracao da familia.

### 2. Dashboard sem acoes diretas
A secao "Aguardando aprovacao" no Dashboard mostra tarefas pendentes mas nao tem botoes de Aprovar/Rejeitar inline. O master precisa navegar ate a pagina de Tarefas para agir.

### 3. Marcar como comprado restrito a master
Em `ShoppingListPage.tsx` linha 47-48, `toggleShoppingItem` so funciona se `isMaster`. Qualquer membro da familia deveria poder marcar itens como comprados na lista de compras.

### 4. Sincronizacao despensa-compras nao atualiza estoque ao comprar
O trigger `sync_pantry_to_shopping` gera itens automaticos na lista, mas quando um item e marcado como "comprado", a quantidade na despensa nao e atualizada. O fluxo e incompleto.

### 5. Formulario "Novo Usuario" ainda existe (placeholder vazio)
Em `UsersPage.tsx` linhas 164-169, o dialog de "Novo Usuario" ainda existe no codigo, mesmo que o botao tenha sido substituido por "Convidar Membro". O formulario `handleAdd` chama `addUser` que e um placeholder vazio.

### 6. Avatar do usuario nao aparece no ranking e cards
No `DashboardPage.tsx` (ranking) e `UsersPage.tsx` (cards), o avatar usa apenas a inicial do nome. O campo `avatar` do usuario nunca e renderizado nesses locais, apesar do `AvatarPicker` existir.

---

## A - ANALYZE (Seguranca, performance e UX)

### 7. Notificacoes perdidas ao recarregar pagina
Todas as notificacoes sao armazenadas apenas em `useState` no `NotificationContext`. Ao recarregar o navegador, todas sao perdidas. Nao ha persistencia.

### 8. Sequencia de dias (`sequencia_dias`) nunca e atualizada
O campo `sequencia_dias` e exibido no Dashboard e Perfil, mas nenhuma logica o incrementa ou reseta. O valor sera sempre 0.

### 9. Nivel do usuario nunca muda
O campo `nivel` exibe "Iniciante", "Organizado" ou "Mestre da Casa", mas nao existe logica para progredir entre niveis. A barra de progresso no Dashboard calcula `pontos / 500` mas o nivel permanece fixo.

### 10. Realtime ainda chama `fetchAll()` para a maioria das tabelas
Na varredura anterior, apenas `profiles` foi otimizado. Mudancas em `tasks`, `meal_plans`, `pantry_items`, `shopping_items` e `rewards` ainda disparam `fetchAll()` completo.

### 11. Tarefas recorrentes nao sao recriadas
O campo `frequencia` (diaria, semanal, mensal) existe, mas ao concluir uma tarefa recorrente ela simplesmente fica como "concluida" permanentemente. Nao ha logica para gerar a proxima ocorrencia.

### 12. Cardapio sem navegacao por semana
Todas as refeicoes sao listadas sem filtro de data. Com o tempo, a pagina ficara muito longa. Falta navegacao semanal (semana anterior / proxima).

---

## C - CORRECT (Correcoes prioritarias)

| # | Correcao | Impacto |
|---|----------|---------|
| 1 | Permitir usuarios simples marcar itens como comprados na lista | Alto |
| 2 | Permitir usuarios simples adicionar itens na despensa, compras e cardapio | Alto |
| 3 | Adicionar botoes Aprovar/Rejeitar no Dashboard | Medio |
| 4 | Remover dialog/formulario "Novo Usuario" residual do UsersPage | Baixo |
| 5 | Exibir avatar do usuario nos cards e ranking (usar componente Avatar) | Baixo |
| 6 | Criar trigger para atualizar despensa quando item da lista e marcado como comprado | Alto |

---

## E - ENHANCE (Melhorias recomendadas)

| # | Melhoria | Complexidade |
|---|----------|-------------|
| 1 | Implementar progressao de nivel automatica via database function (ex: 0-100 pts = Iniciante, 101-300 = Organizado, 301+ = Mestre da Casa) | Media |
| 2 | Implementar calculo de `sequencia_dias` via trigger ao concluir tarefas | Media |
| 3 | Adicionar recriacao automatica de tarefas recorrentes (trigger ao concluir tarefa diaria/semanal/mensal) | Alta |
| 4 | Adicionar navegacao semanal no Cardapio (setas para navegar entre semanas) | Baixa |
| 5 | Otimizar realtime: fetch individual por tabela em vez de fetchAll global | Media |
| 6 | Adicionar empty states visuais com ilustracoes nas listas vazias | Baixa |
| 7 | Persistir notificacoes no banco para manter historico entre sessoes | Media |
| 8 | Adicionar grafico visual (barras ou pizza) na pagina de Relatorios | Media |

---

## Resumo de Prioridades

```text
CRITICO (corrigir primeiro):
  ├── Usuarios simples nao podem marcar compras como compradas
  ├── Fluxo despensa<->compras incompleto (comprar nao atualiza estoque)
  └── Usuarios simples bloqueados de adicionar itens

IMPORTANTE (corrigir em seguida):
  ├── Botoes de acao no Dashboard (aprovar/rejeitar)
  ├── Avatar nao exibido nos cards e ranking
  └── Remover formulario "Novo Usuario" residual

MELHORIAS (implementar depois):
  ├── Progressao de nivel e sequencia de dias
  ├── Tarefas recorrentes automaticas
  ├── Navegacao semanal no cardapio
  └── Graficos nos relatorios
```

