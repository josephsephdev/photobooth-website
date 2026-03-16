/**
 * Appwrite Function: sync-xendit-payment-history
 *
 * Periodic sync of payment records from Xendit to Appwrite.
 * Can be triggered via a scheduled CRON execution or manually.
 *
 * Environment variables:
 *   XENDIT_SECRET_KEY
 *   DATABASE_ID, COLLECTION_PAYMENTS
 */

import { Client, Databases, ID, Query } from 'node-appwrite';

const PLANS = {
  event_pass: { id: 'event_pass', name: 'Event Pass', price: 15000, currency: 'PHP', durationDays: 1 },
  monthly:    { id: 'monthly',    name: 'Pro Monthly', price: 70000, currency: 'PHP', durationDays: 30 },
  yearly:     { id: 'yearly',     name: 'Studio Annual', price: 700000, currency: 'PHP', durationDays: 365 },
};

export default async ({ req, res, log, error }) => {
  try {
    const client = new Client()
      .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
      .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
      .setKey(req.headers['x-appwrite-key'] ?? '');

    const databases = new Databases(client);
    const DATABASE_ID = process.env.DATABASE_ID || 'photobooth_db';
    const COLLECTION_PAYMENTS = process.env.COLLECTION_PAYMENTS || 'payments';
    const XENDIT_SECRET = process.env.XENDIT_SECRET_KEY;

    // ── 1. Fetch recent invoices from Xendit ─────────────────────
    const xenditRes = await fetch('https://api.xendit.co/v2/invoices?limit=50', {
      headers: {
        Authorization: `Basic ${Buffer.from(XENDIT_SECRET + ':').toString('base64')}`,
      },
    });

    if (!xenditRes.ok) {
      error(`Xendit API error: ${xenditRes.status}`);
      return res.json({ error: 'Failed to fetch Xendit invoices' }, 502);
    }

    const invoices = await xenditRes.json();
    let synced = 0;
    let skipped = 0;

    // ── 2. For each invoice, check if we have a matching record ──
    for (const invoice of invoices) {
      const externalId = invoice.external_id;

      const existing = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_PAYMENTS,
        [Query.equal('providerPaymentId', externalId), Query.limit(1)],
      );

      if (existing.total > 0) {
        const doc = existing.documents[0];
        const newStatus = mapXenditStatus(invoice.status);
        if (doc.status !== newStatus) {
          await databases.updateDocument(
            DATABASE_ID,
            COLLECTION_PAYMENTS,
            doc.$id,
            {
              status: newStatus,
              method: invoice.payment_method || invoice.payment_channel || doc.method,
              paidAt: invoice.paid_at || doc.paidAt,
            },
          );
          synced++;
        } else {
          skipped++;
        }
      } else {
        // PHASE 3 FIX: Properly extract userId from external_id
        // External ID format: pb_[planId]_[userId]_[timestamp]
        // We cannot simply split on '_' because planId can contain '_' (e.g., "event_pass")
        
        const userId = extractUserIdFromExternalId(externalId, log);
        if (userId === 'unknown') {
          log(`Warning: Could not extract userId from external_id: ${externalId}; skipping record creation`);
          skipped++;
          continue;
        }

        await databases.createDocument(
          DATABASE_ID,
          COLLECTION_PAYMENTS,
          ID.unique(),
          {
            userId,
            subscriptionId: '',
            providerPaymentId: externalId,
            amount: Math.round((invoice.amount || 0) * 100),
            currency: invoice.currency || 'PHP',
            status: mapXenditStatus(invoice.status),
            method: invoice.payment_method || invoice.payment_channel || '',
            paidAt: invoice.paid_at || '',
            createdAt: invoice.created || new Date().toISOString(),
          },
        );
        synced++;
      }
    }

    log(`Sync complete: ${synced} synced, ${skipped} skipped, ${invoices.length} total`);
    return res.json({ synced, skipped, total: invoices.length });
  } catch (err) {
    error(`sync-xendit-payment-history error: ${err.message}`);
    return res.json({ error: 'Internal server error' }, 500);
  }
};

/**
 * PHASE 3 FIX: Properly extract userId from external_id.
 * 
 * External ID format:
 *   pb_{planId}_{userId}_{timestamp}          – new purchase
 *   pb_renew_{planId}_{userId}_{timestamp}    – renewal
 *
 * Plan IDs may contain underscores (e.g., "event_pass"), so we cannot
 * simply split on "_". Instead we try each known plan ID (longest first).
 */
function extractUserIdFromExternalId(externalId, log) {
  const prefix = 'pb_';
  if (!externalId || !externalId.startsWith(prefix)) {
    return 'unknown';
  }

  let rest = externalId.slice(prefix.length);

  // Strip the renewal marker if present
  if (rest.startsWith('renew_')) {
    rest = rest.slice('renew_'.length);
  }

  // Try known plan IDs, longest first, so "event_pass" is matched before "event"
  const knownIds = Object.keys(PLANS).sort((a, b) => b.length - a.length);
  for (const planId of knownIds) {
    if (rest.startsWith(planId + '_')) {
      rest = rest.slice((planId + '_').length);
      // Now rest = "{userId}_{timestamp}"
      const parts = rest.split('_');
      const userId = parts[0];
      if (userId && userId.length > 0) {
        return userId;
      }
    }
  }

  log(`Warning: Could not match any known plan in external_id: ${externalId}`);
  return 'unknown';
}

function mapXenditStatus(xenditStatus) {
  const s = (xenditStatus || '').toUpperCase();
  if (s === 'PAID' || s === 'SETTLED') return 'paid';
  if (s === 'EXPIRED') return 'expired';
  if (s === 'FAILED') return 'failed';
  return 'pending';
}
