# desktop-auth-handoff

Appwrite Function that handles the desktop app authentication handoff using a secure one-time code flow.

## Actions

### `create-code` (POST)

Called by the website frontend after the user signs in/signs up via Appwrite Auth, when `?source=desktop` is detected.

**Requires:** Authenticated Appwrite session (the `x-appwrite-user-id` header is automatically set by the SDK).

**Request body:**
```json
{ "action": "create-code" }
```

**Response:**
```json
{ "ok": true, "code": "<one-time-code>" }
```

### `exchange-code` (POST)

Called by the desktop Electron app to exchange the one-time code for user data + a session secret.

**Does NOT require authentication** — the code itself is the credential.

**Request body:**
```json
{ "action": "exchange-code", "code": "<one-time-code>" }
```

**Response:**
```json
{
  "ok": true,
  "userId": "abc123",
  "email": "user@example.com",
  "name": "John Doe",
  "emailVerification": true,
  "secret": "<appwrite-session-secret>"
}
```

The desktop app uses `secret` with `account.createSession(userId, secret)` to establish an Appwrite session.

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `DATABASE_ID` | `photobooth_db` | Appwrite Database ID |
| `COLLECTION_DESKTOP_AUTH_CODES` | `desktop_auth_codes` | Collection ID for auth codes |
| `CODE_TTL_MINUTES` | `2` | Code expiry time in minutes |

## Security

- Codes are cryptographically random (48 chars, URL-safe)
- Codes expire after 2 minutes (configurable)
- Codes are single-use (marked `used` then deleted after exchange)
- Old unused codes for a user are cleaned up on each new `create-code` call
- No passwords or raw credentials are transmitted
- The `exchange-code` action returns an Appwrite session secret, not a raw JWT
