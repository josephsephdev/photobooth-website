#!/bin/bash

##
# Toggle Xendit between test and live mode
# 
# Usage:
#   ./toggle-xendit-mode.sh           # Toggle to opposite mode
#   ./toggle-xendit-mode.sh test      # Switch to test
#   ./toggle-xendit-mode.sh live      # Switch to live
##

set -e

CONFIG_FILE="appwrite/functions/xendit-config.js"
LIVE_SECRET_KEY="xnd_production_zOsu3KMkhbVKV3tYhsNbjWohDSR7UJlt7cU43qztjJQZwyqzyxzxlspgWne"
LIVE_WEBHOOK_TOKEN="xwttqFPZuIA79uL2stbpig9ijRAcOiibLPxUZ3uErka1tWYD"

TEST_SECRET_KEY="xnd_development_nvOb3Cbyg7lt60XRUmqQs5zcKgoCpNRoWH59EQN6gSgN2VWnl4WyOiwm4LDSuiM"
TEST_WEBHOOK_TOKEN="KoqQVhwe3lCPfWr5EusPLJVN5YCj85ypAmkisgiVV8C8yGbs"

FUNCTIONS=(
    "create-xendit-subscription"
    "cancel-xendit-payment"
    "cancel-xendit-subscription"
    "renew-xendit-subscription"
    "sync-xendit-payment-history"
    "xendit-webhook-handler"
)

# Detect current mode
if [ ! -f "$CONFIG_FILE" ]; then
    echo "ERROR: Config file not found at $CONFIG_FILE"
    exit 1
fi

CURRENT_MODE=$(grep "const MODE = " "$CONFIG_FILE" | grep -oP "'[^']*'" | head -1 | tr -d "'")
echo "Current mode: $CURRENT_MODE"

# Determine target mode
if [ -z "$1" ]; then
    # Toggle
    if [ "$CURRENT_MODE" = "test" ]; then
        TARGET_MODE="live"
    else
        TARGET_MODE="test"
    fi
else
    TARGET_MODE="$1"
    if [ "$TARGET_MODE" != "test" ] && [ "$TARGET_MODE" != "live" ]; then
        echo "Invalid mode: $TARGET_MODE (use 'test' or 'live')"
        exit 1
    fi
fi

if [ "$TARGET_MODE" = "$CURRENT_MODE" ]; then
    echo "Already in $CURRENT_MODE mode. Exiting."
    exit 0
fi

# Set credentials
if [ "$TARGET_MODE" = "test" ]; then
    SECRET_KEY="$TEST_SECRET_KEY"
    WEBHOOK_TOKEN="$TEST_WEBHOOK_TOKEN"
    ICON="🧪"
    COLOR="\033[0;32m"  # Green
else
    SECRET_KEY="$LIVE_SECRET_KEY"
    WEBHOOK_TOKEN="$LIVE_WEBHOOK_TOKEN"
    ICON="🔴"
    COLOR="\033[0;31m"  # Red
fi

NC="\033[0m"  # No Color

echo ""
echo -e "${COLOR}${ICON} Switching from $CURRENT_MODE → $TARGET_MODE mode${NC}"
echo ""

# Update config file
echo "Updating config file..."
sed -i "s/const MODE = '[^']*';/const MODE = '$TARGET_MODE';/" "$CONFIG_FILE"
echo "   ✓ Config file updated"

# Update Appwrite functions
echo ""
echo "Updating Appwrite functions..."

SUCCESS=0
FAIL=0

for func in "${FUNCTIONS[@]}"; do
    echo "   $func"
    
    # Update secret key
    if appwrite functions update-variable \
        --function-id="$func" \
        --variable-key="XENDIT_SECRET_KEY" \
        --variable-value="$SECRET_KEY" > /dev/null 2>&1; then
        echo "      ✓ Secret key"
        ((SUCCESS++))
    else
        echo "      ✗ Secret key"
        ((FAIL++))
    fi
    
    # Update webhook token (might fail, that's OK)
    if appwrite functions update-variable \
        --function-id="$func" \
        --variable-key="XENDIT_WEBHOOK_VERIFICATION_TOKEN" \
        --variable-value="$WEBHOOK_TOKEN" > /dev/null 2>&1; then
        echo "      ✓ Webhook token"
    else
        echo "      ⚠ Webhook token (may not exist)"
    fi
done

# Summary
echo ""
echo -e "${COLOR}${ICON} All done! Now in $TARGET_MODE mode${NC}"
echo ""

if [ "$TARGET_MODE" = "test" ]; then
    echo "Next steps:"
    echo "  1. npm run dev"
    echo "  2. Test at http://localhost:5173/pricing"
    echo "  3. Use test card: 4111 1111 1111 1111"
else
    echo "⚠️  LIVE MODE ACTIVATED"
    echo "Next steps:"
    echo "  1. Make sure you're on production website"
    echo "  2. Test carefully with real card"
fi

echo ""
