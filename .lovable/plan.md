

## Plano: Banner de Instalação PWA (beforeinstallprompt)

### O que será feito
Um banner discreto aparecerá na parte inferior da tela quando o app detectar que pode ser instalado. O usuário poderá instalar com um clique ou dispensar o banner.

### Implementação

**1. Criar hook `useInstallPrompt` (`src/hooks/use-install-prompt.ts`)**
- Captura o evento `beforeinstallprompt` e armazena no state
- Expõe `canInstall`, `promptInstall()` e `dismissInstall()`
- Guarda flag no `localStorage` para não mostrar novamente após dispensar
- Verifica se já está em modo standalone (já instalado) para não exibir

**2. Criar componente `InstallBanner` (`src/components/InstallBanner.tsx`)**
- Banner fixo no bottom da tela com animação de entrada (slide up)
- Ícone de download, texto "Instale o OrganiCésar para acesso rápido" 
- Botão "Instalar" (primário) e botão "X" para dispensar
- Usa cores do tema (gradient-primary)
- Responsivo para o viewport atual (411px)

**3. Adicionar `InstallBanner` no `AppLayout.tsx`**
- Renderizar dentro do `<main>` antes do conteúdo, para não interferir na sidebar

### Detalhes técnicos
- O evento `beforeinstallprompt` só dispara em navegadores compatíveis (Chrome, Edge, Samsung Internet) e apenas quando servido via HTTPS — funciona na versão publicada, não no preview do editor.
- Nenhuma dependência nova necessária.

