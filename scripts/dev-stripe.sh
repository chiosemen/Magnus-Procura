#!/usr/bin/env bash
# Stripe CLI forwarder for local webhook testing
# Usage: ./scripts/dev-stripe.sh

set -euo pipefail

if ! command -v stripe &> /dev/null; then
    echo "Stripe CLI not found. Install via: brew install stripe/stripe-cli/stripe"
    exit 1
fi

echo "Forwarding Stripe events to http://localhost:8787/webhooks/stripe..."
stripe listen --forward-to localhost:8787/webhooks/stripe
