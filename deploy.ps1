# Build e deploy para GitHub Pages
Write-Host "Instalando gh-pages..." -ForegroundColor Cyan
npm install --save-dev gh-pages

Write-Host "Buildando o projeto..." -ForegroundColor Cyan
npm run build

Write-Host "Deployando para GitHub Pages..." -ForegroundColor Cyan
npx gh-pages -d dist -b gh-pages -m "Deploy $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"

Write-Host "Deploy concluído! Acesse: https://Odranoel29.github.io/Vizinho-Indica/" -ForegroundColor Green
