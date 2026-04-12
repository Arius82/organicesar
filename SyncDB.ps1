# Script para Sincronizar Banco de Dados Supabase (Alternativa ao Lovable)
# Este script envia as migrações locais diretamente para o seu Supabase

$PROJECT_REF = "pywccymjgthtrwgccvuv"

Write-Host "--- Sincronizador de Banco de Dados Supabase ---" -ForegroundColor Cyan

# 1. Verificar se o Supabase CLI está instalado
Write-Host "[1/3] Verificando conexão..." -ForegroundColor Yellow
npx supabase --version
if ($LASTEXITCODE -ne 0) {
    Write-Host "Erro: Supabase CLI não encontrado. Rode 'npm install' primeiro." -ForegroundColor Red
    exit
}

# 2. Login (Necessário apenas uma vez)
Write-Host "[2/3] Autenticando com Supabase..." -ForegroundColor Yellow
Write-Host "Se uma janela do navegador abrir, autorize o acesso com a conta danelle.isabella@gmail.com" -ForegroundColor Gray
npx supabase login

# 3. Vincular e Enviar
Write-Host "[3/3] Sincronizando tabelas com o projeto $PROJECT_REF..." -ForegroundColor Yellow
npx supabase link --project-ref $PROJECT_REF
if ($LASTEXITCODE -eq 0) {
    Write-Host "Enviando alterações para o Supabase..." -ForegroundColor Green
    npx supabase db push
    Write-Host "`nSucesso! Seu banco de dados foi atualizado." -ForegroundColor Green
} else {
    Write-Host "`nErro ao vincular projeto. Verifique sua conexão ou senha do banco." -ForegroundColor Red
}

Write-Host "`nFinalizado. Pressione qualquer tecla para sair..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
