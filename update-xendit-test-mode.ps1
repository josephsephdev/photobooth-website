#!/usr/bin/env pwsh
<#
.SYNOPSIS
Update all Xendit functions to test mode via Appwrite CLI
.DESCRIPTION
Updates XENDIT_SECRET_KEY and XENDIT_WEBHOOK_VERIFICATION_TOKEN for all 6 functions
#>

# Test/Live keys
$testKey = "xnd_development_nvOb3Cbyg7lt60XRUmqQs5zcKgoCpNRoWH59EQN6gSgN2VWnl4WyOiwm4LDSuiM"
$testWebhookToken = "KoqQVhwe3lCPfWr5EusPLJVN5YCj85ypAmkisgiVV8C8yGbs"

$functions = @(
    "create-xendit-subscription",
    "cancel-xendit-payment",
    "cancel-xendit-subscription",
    "renew-xendit-subscription",
    "sync-xendit-payment-history",
    "xendit-webhook-handler"
)

Write-Host "Updating Xendit functions to TEST mode..."
Write-Host ""

foreach ($func in $functions) {
    Write-Host "Updating: $func"
    
    # Update XENDIT_SECRET_KEY
    & appwrite functions update-variable --function-id=$func --variable-key="XENDIT_SECRET_KEY" --variable-value="$testKey"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   OK: XENDIT_SECRET_KEY updated"
    } else {
        Write-Host "   ERROR: Failed to update XENDIT_SECRET_KEY"
    }
    
    # Update XENDIT_WEBHOOK_VERIFICATION_TOKEN
    & appwrite functions update-variable --function-id=$func --variable-key="XENDIT_WEBHOOK_VERIFICATION_TOKEN" --variable-value="$testWebhookToken"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   OK: XENDIT_WEBHOOK_VERIFICATION_TOKEN updated"
    } else {
        Write-Host "   (variable may not exist, continuing)"
    }
    
    Write-Host ""
}

Write-Host "All functions updated to TEST mode!"
Write-Host ""
Write-Host "Next: npm run dev and test at http://localhost:5173/pricing"
