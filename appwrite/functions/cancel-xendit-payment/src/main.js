import { Client, Databases } from 'node-appwrite';

export default async function main({ req, res, log, error }) {
  try {
    const body = JSON.parse(req.body || '{}');
    const { paymentId } = body;
    const userId = req.headers['x-appwrite-user-id'];
    if (!userId) {
      return res.json({ error: 'Authentication required' }, 401);
    }
    if (!paymentId) {
      return res.json({ error: 'paymentId is required' }, 400);
    }

    const client = new Client()
      .setEndpoint(process.env.APPWRITE_ENDPOINT)
      .setProject(process.env.APPWRITE_PROJECT_ID)
      .setKey(process.env.APPWRITE_API_KEY);
    const databases = new Databases(client);
    const DATABASE_ID = process.env.DATABASE_ID || 'photobooth_db';
    const COLLECTION_PAYMENTS = process.env.COLLECTION_PAYMENTS || 'payments';

    // Fetch payment document
    const paymentDoc = await databases.getDocument(
      DATABASE_ID,
      COLLECTION_PAYMENTS,
      paymentId
    );

    // Verify ownership
    if (paymentDoc.userId !== userId) {
      return res.json({ error: 'Forbidden' }, 403);
    }

    // Only allow cancelling if status is 'pending' or 'superseded'
    if (!['pending', 'superseded'].includes(paymentDoc.status)) {
      return res.json({ error: 'Payment cannot be cancelled' }, 400);
    }

    // Update payment status to 'cancelled'
    await databases.updateDocument(
      DATABASE_ID,
      COLLECTION_PAYMENTS,
      paymentId,
      {
        status: 'cancelled',
        cancelledAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    );

    log(`Cancelled payment ${paymentId} for user ${userId}`);
    return res.json({ message: 'Payment cancelled successfully' });
  } catch (err) {
    error(`cancel-xendit-payment error: ${err.message}`);
    return res.json({ error: 'Internal server error' }, 500);
  }
}
