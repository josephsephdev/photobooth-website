import { Client, Databases } from 'node-appwrite';

/**
 * Expire a Xendit invoice so it can no longer be paid.
 * 
 * PHASE 2 FIX: Critical function to actually invalidate the invoice in Xendit.
 * Without this, the invoice remains payable even after local cancellation.
 */
async function expireXenditInvoice(xenditInvoiceId, xenditSecret, log) {
  if (!xenditInvoiceId) {
    log('Warning: no xenditInvoiceId provided to expireXenditInvoice');
    return { success: false, reason: 'no_invoice_id' };
  }

  try {
    const response = await fetch(`https://api.xendit.co/invoices/${xenditInvoiceId}/expire!`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(xenditSecret + ':').toString('base64')}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errText = await response.text();
      log(`Xendit API error (${response.status}): ${errText}`);
      return { success: false, reason: 'xendit_error', statusCode: response.status };
    }

    log(`Successfully expired Xendit invoice ${xenditInvoiceId}`);
    return { success: true };
  } catch (e) {
    log(`Error calling Xendit API to expire invoice ${xenditInvoiceId}: ${e.message}`);
    return { success: false, reason: 'network_error', details: e.message };
  }
}

export default async function main({ req, res, log, error }) {
  try {
    const body = JSON.parse(req.body || '{}');
    const { paymentId } = body;

    // Use Appwrite's trusted header — cannot be spoofed by the caller
    const userId = req.headers['x-appwrite-user-id'];
    if (!userId) {
      return res.json({ error: 'Authentication required' }, 401);
    }
    if (!paymentId || typeof paymentId !== 'string') {
      return res.json({ error: 'paymentId is required' }, 400);
    }

    const XENDIT_SECRET = process.env.XENDIT_SECRET_KEY;

    const client = new Client()
      .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
      .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
      .setKey(req.headers['x-appwrite-key'] ?? '');
    const databases = new Databases(client);
    const DATABASE_ID = process.env.DATABASE_ID || 'photobooth_db';
    const COLLECTION_PAYMENTS = process.env.COLLECTION_PAYMENTS || 'payments';

    // ── 1. Fetch payment document ──────────────────────────────
    const paymentDoc = await databases.getDocument(
      DATABASE_ID,
      COLLECTION_PAYMENTS,
      paymentId
    );

    // ── 2. Verify ownership ────────────────────────────────────
    if (paymentDoc.userId !== userId) {
      return res.json({ error: 'Forbidden' }, 403);
    }

    // ── 3. Verify cancellation is allowed ──────────────────────
    if (!['pending', 'superseded'].includes(paymentDoc.status)) {
      return res.json({
        error: 'Payment cannot be cancelled',
        details: `Current status is '${paymentDoc.status}'; can only cancel 'pending' or 'superseded'`,
        currentStatus: paymentDoc.status,
      }, 400);
    }

    log(`Beginning cancellation of payment ${paymentId} (status: ${paymentDoc.status}, xenditId: ${paymentDoc.xenditInvoiceId})`);

    // ── 4. PHASE 2 FIX: Expire the invoice in Xendit ───────────
    // This is CRITICAL—without this, the invoice remains payable.
    const xenditResult = await expireXenditInvoice(paymentDoc.xenditInvoiceId, XENDIT_SECRET, log);

    if (!xenditResult.success) {
      log(`Warning: could not expire invoice in Xendit (${xenditResult.reason}); proceeding with local cancellation`);
      // Continue anyway—mark local cancelled even if Xendit call failed
      // This is a fallback; ideally this should not happen
    } else {
      log(`Xendit invoice successfully expired`);
    }

    // ── 5. Update local database record ────────────────────────
    const now = new Date().toISOString();
    const updatedPayment = await databases.updateDocument(
      DATABASE_ID,
      COLLECTION_PAYMENTS,
      paymentId,
      {
        status: 'cancelled',
        cancelledAt: now,
        updatedAt: now,
      }
    );

    log(`Payment ${paymentId} marked as cancelled in database`);
    
    // ── 6. Return the updated payment document ─────────────────
    return res.json({
      message: 'Payment cancelled successfully',
      payment: updatedPayment,
      xenditResult: xenditResult,
    });

  } catch (err) {
    error(`cancel-xendit-payment error: ${err.message}`);
    return res.json({
      error: 'Internal server error',
      details: err.message,
    }, 500);
  }
}
