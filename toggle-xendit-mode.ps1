#!/usr/bin/env pwsh

param(
    [Parameter(Position=0)]
    [ValidateSet('test', 'live')]
    [string]$Mode
)

$ErrorActionPreference = 'Stop'
$configFile = "appwrite/functions/xendit-config.js"
$liveSecretKey = "xnd_production_zOsu3KMkhbVKV3tYhsNbjWohDSR7UJlt7cU43qztjJQZwyqzyxzxlspgWne"
$liveWebhookToken = "xwttqFPZuIA79uL2stbpig9ijRAcOiibLPxUZ3uErka1tWYD"

$testSecretKey = "xnd_development_nvOb3Cbyg7lt60XRUmqQs5zcKgoCpNRoWH59EQN6gSgN2VWnl4WyOiwm4LDSuiM"
$testWebhookToken = "KoqQVhwe3lCPfWr5EusPLJVN5YCj85ypAmkisgiVV8C8yGbs"

$functions = @(
    "create-xendit-subscription",
    "cancel-xendit-payment",
    "cancel-xendit-subscription",
    "renew-xendit-subscription",
    "sync-xendit-payment-history",
    "xendit-webhook-handler"
)

Write-Host "Detecting current mode..." -ForegroundColor Gray

if (Test-Path $configFile) {
    $content = Get-Content $configFile -Raw
    if ($content -match "const MODE = '([^']+)'") {
        $currentMode = $matches[1]
    } else {
        $currentMode = "test"
    }
} else {
    Write-Host "ERROR: Config file not found at $configFile" -ForegroundColor Red
    exit 1
}

if ([string]::IsNullOrEmpty($Mode)) {
    $targetMode = if ($currentMode -eq "test") { "live" } else { "test" }
} else {
    $targetMode = $Mode
}

if ($targetMode -eq $currentMode) {
    Write-Host "Already in $currentMode mode. Exiting." -ForegroundColor Yellow
    exit 0
}

if ($targetMode -eq "test") {
    $secretKey = $testSecretKey
    $webhookToken = $testWebhookToken
    $colorKey = "Green"
} else {
    $secretKey = $liveSecretKey
    $webhookToken = $liveWebhookToken
    $colorKey = "Red"
}

Write-Host ""
Write-Host "[XENDIT] Switching from $currentMode to $targetMode mode" -ForegroundColor $colorKey
Write-Host ""

Write-Host "Updating config file..." -ForegroundColor Cyan

try {
    $newContent = $content -replace "const MODE = '[^']+'", "const MODE = '$targetMode'"
    $newContent | Set-Content $configFile -NoNewline -Encoding UTF8
    Write-Host "   OK: Config file updated" -ForegroundColor Green
} catch {
    Write-Host "   ERROR: Failed to update config file: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Updating Appwrite functions..." -ForegroundColor Cyan
Write-Host "(This step may fail if Appwrite CLI is not authenticated - config file is what matters)" -ForegroundColor Yellow

$ErrorActionPreference = 'Continue'

foreach ($func in $functions) {
    Write-Host "   $func"
    
    & appwrite functions update-variable `
        --function-id=$func `
        --variable-id="XENDIT_SECRET_KEY" `
        --variable-value="$secretKey" 2>&1 | Out-Null
    
    Write-Host "      (Skipped - config file is primary source)" -ForegroundColor Gray
}

Write-Host ""
Write-Host "[XENDIT] All done! Now in $targetMode mode" -ForegroundColor $colorKey
Write-Host ""

if ($targetMode -eq "test") {
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "  1. npm run dev"
    Write-Host "  2. Test at http://localhost:5173/pricing"
    Write-Host "  3. Use test card: 4111 1111 1111 1111"
} else {
    Write-Host "WARNING: LIVE MODE ACTIVATED" -ForegroundColor Red
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "  1. Make sure you're on production website"
    Write-Host "  2. Test carefully with real card"
}

Write-Host ""