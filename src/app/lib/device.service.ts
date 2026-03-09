/**
 * Device Service — Frontend device management via Appwrite Functions
 *
 * Provides helpers to list and remove registered devices for the current user.
 */

import { ExecutionMethod, Functions } from 'appwrite';
import { client, databases } from './appwrite';
import { DATABASE_ID, COLLECTION } from './database.constants';
import { Query } from 'appwrite';

const functions = new Functions(client);

const FUNCTION_ID = 'manage-device';

// ── Types ──────────────────────────────────────────────────────────

export interface DeviceDocument {
  $id: string;
  userId: string;
  deviceId: string;
  deviceName: string;
  platform: string;
  lastActive: string;
  createdAt: string;
}

// ── Queries ────────────────────────────────────────────────────────

/**
 * Fetch all registered devices for the current user.
 */
export async function getUserDevices(userId: string): Promise<DeviceDocument[]> {
  const result = await databases.listDocuments(
    DATABASE_ID,
    COLLECTION.DEVICES,
    [
      Query.equal('userId', userId),
      Query.orderDesc('lastActive'),
      Query.limit(100),
    ],
  );
  return result.documents as unknown as DeviceDocument[];
}

// ── Actions ────────────────────────────────────────────────────────

/**
 * Remove a registered device by calling the manage-device function.
 */
export async function removeDevice(deviceId: string): Promise<void> {
  const execution = await functions.createExecution(
    FUNCTION_ID,
    JSON.stringify({ action: 'remove', deviceId }),
    false,
    undefined,
    ExecutionMethod.POST,
  );

  if (execution.responseStatusCode >= 400) {
    const body = tryParseJson(execution.responseBody);
    throw new Error(body?.error || 'Failed to remove device');
  }
}

// ── Util ───────────────────────────────────────────────────────────

function tryParseJson(str: string): any {
  try { return JSON.parse(str); } catch { return null; }
}
