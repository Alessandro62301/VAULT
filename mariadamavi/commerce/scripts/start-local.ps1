param([string]$Php = 'C:\tools\php82\php.exe')
$ErrorActionPreference = 'Stop'
$commerceRoot = Split-Path $PSScriptRoot -Parent
$wpRoot = Join-Path $commerceRoot '.local/wordpress'
$themeTarget = Join-Path $wpRoot 'wp-content/themes/mariadamavi-store'
New-Item -ItemType Directory -Force -Path $themeTarget | Out-Null
Copy-Item -Path (Join-Path $commerceRoot 'theme/*') -Destination $themeTarget -Recurse -Force
& $Php -d extension=pdo_sqlite -d extension=sqlite3 -d memory_limit=512M -S 127.0.0.1:8088 -t $wpRoot (Join-Path $PSScriptRoot 'router.php')
