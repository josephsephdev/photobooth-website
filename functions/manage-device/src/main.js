/**
 * Appwrite Function: manage-device
 *
 * Handles device registration and removal for per-account device limits.
 *
 * Actions:
 *   register — Register a device for the authenticated user.
 *              Returns 429 if the device limit is reached.
 *              Idempotent: re-registering an existing device updates lastActive.
 *   remove   — Remove a registered device by deviceId.
 *
 * Environment variables:
 *   DATABASE_ID, COLLECTION_SUBSCRIPTIONS, COLLECTION_DEVICES
 */

import { Client, Databases, ID, Query, Permission, Role } from 'node-appwrite';

const DEFAULT_DEVICE_LIMIT = 2;

export default async ({ req, res, log, error }) => {
  try {
    // ── Auth ──────────────────────────────────────────────────────
    const userId = req.headers['x-appwrite-user-id'];
    if (!userId) {
      return res.json({ error: 'Authentication required' }, 401);
    }

    // ── Parse body ───────────────────────────────────────────────
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body ?? {});
    const { action } = body;

    if (!action || !['register', 'remove'].includes(action)) {
      return res.json({ error: 'Invalid action. Use "register" or "remove".' }, 400);
    }

    // ── Init Appwrite ────────────────────────────────────────────
    const client = new Client()
      .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
      .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
      .setKey(req.headers['x-appwrite-key'] ?? '');

    const databases = new Databases(client);
    const DATABASE_ID = process.env.DATABASE_ID || 'photobooth_db';
    const COLLECTION_SUBSCRIPTIONS = process.env.COLLECTION_SUBSCRIPTIONS || 'subscriptions';
    const COLLECTION_DEVICES = process.env.COLLECTION_DEVICES || 'devices';

    // ── REGISTER ─────────────────────────────────────────────────
    if (action === 'register') {
      const { deviceId, deviceName, platform } = body;

      if (!deviceId || typeof deviceId !== 'string') {
        return res.json({ error: 'deviceId is required' }, 400);
      }
      if (!deviceName || typeof deviceName !== 'string') {
        return res.json({ error: 'deviceName is required' }, 400);
      }

      // 1. Get device limit from active subscription
      const now = new Date().toISOString();
      const subs = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_SUBSCRIPTIONS,
        [
          Query.equal('userId', userId),
          Query.equal('status', 'active'),
          Query.greaterThan('expiresAt', now),
          Query.orderDesc('expiresAt'),
          Query.limit(1),
        ],
      );

      if (subs.total === 0) {
        return res.json({ error: 'No active subscription found' }, 403);
      }

      const subscription = subs.documents[0];
      const deviceLimit = subscription.deviceLimit ?? DEFAULT_DEVICE_LIMIT;

      // 2. Get current devices for this user
      const existingDevices = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_DEVICES,
        [
          Query.equal('userId', userId),
          Query.limit(100),
        ],
      );

      // 3. Check if this device is already registered (idempotent)
      const existingDevice = existingDevices.documents.find(d => d.deviceId === deviceId);
      if (existingDevice) {
        await databases.updateDocument(
          DATABASE_ID,
          COLLECTION_DEVICES,
          existingDevice.$id,
          {
            lastActive: new Date().toISOString(),
            deviceName: deviceName,
            platform: platform || existingDevice.platform,
          },
        );
        log(`Device ${deviceId} already registered for user ${userId}; updated lastActive`);
        return res.json({
          success: true,
          device: { ...existingDevice, lastActive: new Date().toISOString() },
          totalDevices: existingDevices.total,
          deviceLimit,
        });
      }

      // 4. Check device limit
      if (existingDevices.total >= deviceLimit) {
        log(`Device limit reached for user ${userId}: ${existingDevices.total}/${deviceLimit}`);
        return res.json({
          error: 'device_limit_reached',
          message: `You have reached your device limit (${deviceLimit}). Remove a device to register a new one.`,
          devices: existingDevices.documents.map(d => ({
            $id: d.$id,
            deviceId: d.deviceId,
            deviceName: d.deviceName,
            platform: d.platform,
            lastActive: d.lastActive,
            createdAt: d.createdAt,
          })),
          deviceLimit,
        }, 429);
      }

      // 5. Create new device doc
      const newDevice = await databases.createDocument(
        DATABASE_ID,
        COLLECTION_DEVICES,
        ID.unique(),
        {
          userId,
          deviceId: deviceId.slice(0, 64),
          deviceName: deviceName.slice(0, 100),
          platform: (platform || 'unknown').slice(0, 20),
          lastActive: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        },
        [
          Permission.read(Role.user(userId)),
          Permission.delete(Role.user(userId)),
        ],
      );

      log(`Device ${deviceId} registered for user ${userId} (${existingDevices.total + 1}/${deviceLimit})`);
      return res.json({
        success: true,
        device: newDevice,
        totalDevices: existingDevices.total + 1,
        deviceLimit,
      });
    }

    // ── REMOVE ───────────────────────────────────────────────────
    if (action === 'remove') {
      const { deviceId } = body;

      if (!deviceId || typeof deviceId !== 'string') {
        return res.json({ error: 'deviceId is required' }, 400);
      }

      // Find the device doc
      const deviceDocs = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_DEVICES,
        [
          Query.equal('userId', userId),
          Query.equal('deviceId', deviceId),
          Query.limit(1),
        ],
      );

      if (deviceDocs.total === 0) {
        return res.json({ error: 'Device not found' }, 404);
      }

      await databases.deleteDocument(
        DATABASE_ID,
        COLLECTION_DEVICES,
        deviceDocs.documents[0].$id,
      );

      log(`Device ${deviceId} removed for user ${userId}`);
      return res.json({ success: true });
    }
  } catch (err) {
    error(`manage-device error: ${err.message}`);
    return res.json({ error: 'Internal server error' }, 500);
  }
};
