/**
 * Appwrite Function: cleanup-unverified-users
 *
 * Scheduled to run daily. Deletes Auth users who have not verified
 * their email within 24 hours of account creation.
 *
 * Environment variables (set in Appwrite Console → Function → Settings):
 *   APPWRITE_FUNCTION_API_ENDPOINT  — auto-injected by Appwrite
 *   APPWRITE_FUNCTION_PROJECT_ID    — auto-injected by Appwrite
 */

import { Client, Users, Query } from 'node-appwrite';

/** How old an unverified account must be before deletion (ms) */
const EXPIRATION_MS = 24 * 60 * 60 * 1000; // 24 hours

export default async ({ req, res, log, error }) => {
  try {
    const client = new Client()
      .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
      .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
      .setKey(req.headers['x-appwrite-key'] ?? '');

    const users = new Users(client);
    const cutoff = new Date(Date.now() - EXPIRATION_MS).toISOString();

    let deleted = 0;
    let cursor = undefined;

    // Paginate through all unverified users created before the cutoff
    while (true) {
      const queries = [
        Query.equal('emailVerification', false),
        Query.lessThan('$createdAt', cutoff),
        Query.limit(100),
      ];

      if (cursor) {
        queries.push(Query.cursorAfter(cursor));
      }

      const batch = await users.list(queries);

      if (batch.users.length === 0) break;

      for (const user of batch.users) {
        try {
          await users.delete(user.$id);
          deleted++;
          log(`Deleted unverified user: ${user.email} (${user.$id}), created ${user.$createdAt}`);
        } catch (err) {
          error(`Failed to delete user ${user.$id}: ${err.message}`);
        }
      }

      // If we got fewer than the limit, we've reached the end
      if (batch.users.length < 100) break;

      cursor = batch.users[batch.users.length - 1].$id;
    }

    log(`Cleanup complete. Deleted ${deleted} unverified user(s).`);
    return res.json({ success: true, deleted });
  } catch (err) {
    error(`cleanup-unverified-users error: ${err.message}`);
    return res.json({ error: 'Internal server error' }, 500);
  }
};
