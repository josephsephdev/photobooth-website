# Future Architecture Plan: Consolidate Appwrite Functions to 2

## Current Development Strategy
- Keep the current separate function setup (about 10 functions) during active development.
- This keeps features isolated and easier to debug while requirements are still changing.

## Future Cost Optimization Goal
- Consolidate to 2 Appwrite Functions later so the project can fit lower-tier limits.

## Target 2-Function Architecture

### 1) User API Function (execute: users)
Use this function for authenticated user actions:
- Check subscription access
- Create Xendit checkout
- Renew subscription
- Cancel subscription (cancel at period end)
- Cancel pending payment
- Manage devices
- Desktop auth handoff (if still needed)

### 2) System and Webhook Function (execute: any or restricted secret)
Use this function for internal and provider-triggered actions:
- Xendit webhook handling
- Scheduled cleanup tasks
- Scheduled sync tasks
- Any system-only jobs

## Migration Approach (When Ready)
1. Extract each existing function's business logic into shared handler modules.
2. Add a router entrypoint that dispatches by action or path.
3. Keep strict per-action auth and authorization checks.
4. Migrate one endpoint at a time with compatibility wrappers.
5. Remove old standalone functions only after parity tests pass.

## Security Notes
- Function-level scopes are shared once consolidated.
- Enforce auth, role checks, and input validation per action inside the router.
- Keep secrets and webhook verification checks isolated in system routes.

## Operational Notes
- With 2 functions, each deploy affects more features.
- Add stronger tests before and after consolidation.
- If multiple schedules are needed, use one scheduler route that fans out internally.

## Trigger to Start Consolidation
Start this migration after the product feature set stabilizes and release cadence slows.
