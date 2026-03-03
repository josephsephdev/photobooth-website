/**
 * Appwrite Function: sync-xendit-payment-history
 *
 * Periodic sync of payment records from Xendit to Appwrite.
 * Can be triggered via a scheduled CRON execution or manually.
 *
 * This function fetches recent invoices from Xendit and ensures
 * corresponding payment documents exist in Appwrite, handling any
 * that might have been missed by webhooks.
 *
 * Environment variables:
 *   APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, APPWRITE_API_KEY
 *   XENDIT_SECRET_KEY
 *   DATABASE_ID, COLLECTION_PAYMENTS
 */

import { Client, Databases, ID, Query } from 'node-appwrite';

export default async function main({ req, res, log, error }) {
  try {
    const client = new Client()
      .setEndpoint(process.env.APPWRITE_ENDPOINT)
      .setProject(process.env.APPWRITE_PROJECT_ID)
      .setKey(process.env.APPWRITE_API_KEY);

    const databases = new Databases(client);
    const DATABASE_ID = process.env.DATABASE_ID || 'photobooth_db';
    const COLLECTION_PAYMENTS = process.env.COLLECTION_PAYMENTS || 'payments';
    const XENDIT_SECRET = process.env.XENDIT_SECRET_KEY;

    // ── 1. Fetch recent invoices from Xendit ─────────────────────
    // Xendit List Invoices API: https://developers.xendit.co/api-reference/#list-all-invoices
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

      // Check if already exists
      const existing = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_PAYMENTS,
        [Query.equal('providerPaymentId', externalId), Query.limit(1)],
      );

      if (existing.total > 0) {
        // Update status if changed
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
        // Extract userId from external_id pattern: pb_{planId}_{userId}_{timestamp}
        const parts = externalId.split('_');
        const userId = parts.length >= 3 ? parts[2] : 'unknown';

        await databases.createDocument(
          DATABASE_ID,
          COLLECTION_PAYMENTS,
          ID.unique(),
          {
            userId,
            subscriptionId: '',
            providerPaymentId: externalId,
            amount: Math.round((invoice.amount || 0) * 100), // Convert to centavos
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
}

function mapXenditStatus(xenditStatus) {
  const s = (xenditStatus || '').toUpperCase();
  if (s === 'PAID' || s === 'SETTLED') return 'paid';
  if (s === 'EXPIRED') return 'expired';
  if (s === 'FAILED') return 'failed';
  return 'pending';
}
