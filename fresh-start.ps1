$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

$ports = @(4173, 4180)
foreach ($port in $ports) {
  $connections = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
  foreach ($connection in @($connections)) {
    try {
      Stop-Process -Id $connection.OwningProcess -Force -ErrorAction Stop
      Write-Host "Processo antigo encerrado na porta ${port}." -ForegroundColor Yellow
    } catch {
      Write-Host "Nao foi possivel encerrar o processo da porta ${port}: $($_.Exception.Message)" -ForegroundColor Yellow
    }
  }
}

Write-Host ""
Write-Host "Iniciando Self-Education em ambiente limpo..." -ForegroundColor Cyan
Write-Host "Pasta: $PSScriptRoot" -ForegroundColor DarkGray
Write-Host "URL: http://localhost:4180" -ForegroundColor Green
Write-Host ""

node .\server.cjs
