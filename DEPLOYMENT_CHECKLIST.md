# 🚀 Deployment Checklist - Phases 1-6 (Payment System Audit Fix)

**Last Updated:** March 9, 2026  
**Deployment Status:** READY FOR PRODUCTION  
**Estimated Deployment Time:** 45 minutes - 1 hour

---

## 📋 Pre-Deployment Review

### Code Quality Verification
- [x] Zero TypeScript/JavaScript syntax errors
- [x] All imports and type references resolved
- [x] All backend functions verified
- [x] All frontend components tested
- [x] Database schema backward compatible (no migration needed)

### Critical Issues Fixed
- [x] **Phase 1:** Webhook handler is now idempotent (no duplicate subscriptions)
- [x] **Phase 2:** Cancel button actually calls Xendit API to expire invoices
- [x] **Phase 3:** Sync function correctly extracts userIds (no orphaned records)
- [x] **Phase 4:** Authentication required for subscription access (no privacy leak)
- [x] **Phase 5:** Audit trail fields added (cancelledAt, supersededAt, replacementTransactionId)
- [x] **Phase 6:** Cancel button added to UI with proper status handling

---

## 🔄 Step 1: Backup Current State

### Step 1.1: Backup Appwrite Function Code
**Time:** 5 minutes

Before deploying new functions, download current versions:

1. Open **Appwrite Console** → Functions
2. For each function below, click → "Code" tab → Copy entire code
3. Save to local file with naming: `BACKUP_[function-name]_[date].js`

**Functions to backup:**
- [ ] cancel-xendit-payment
- [ ] check-user-subscription-access
- [ ] xendit-webhook-handler
- [ ] create-xendit-subscription
- [ ] renew-xendit-subscription
- [ ] sync-xendit-payment-history

**Where to save:** Create folder `./backups/` in your repository root

### Step 1.2: Document Current Database State
**Time:** 3 minutes

**Export sample of current payments for reference:**
1. Appwrite Console → Collections → payments
2. Click "Export"
3. Save as `payments_backup_[date].json`

**Why:** So you can compare before/after to ensure data integrity

---

## 🔑 Step 2: Deploy Appwrite Functions (CRITICAL FIRST)

**⚠️ IMPORTANT:** Deploy in this exact order. Do NOT deploy all at once.

### Step 2.1: Deploy `cancel-xendit-payment` (CRITICAL - First)
**Time:** 3 minutes

This function now calls Xendit API to actually expire invoices.

**Via Appwrite Console:**
1. Open Appwrite Console → Functions
2. Click "cancel-xendit-payment"
3. Go to "Code" tab
4. Copy code from: `functions/cancel-xendit-payment/src/main.js`
5. Paste into console editor
6. Click "Deploy"
7. Wait for "Deployment successful" message
8. ✅ Note the timestamp in console

**Via CLI (if using Appwrite CLI):**
```bash
cd functions/cancel-xendit-payment
appwrite deploy function
```

**After deployment:**
- [ ] Verify function appears in list
- [ ] Check "Executions" tab - should show the deployment
- [ ] No error messages in console

**Test (Quick Smoke Test):**
- Go to Account page
- Verify you can see cancel buttons on pending payments (don't click yet)

---

### Step 2.2: Deploy `check-user-subscription-access` (CRITICAL - Second)
**Time:** 3 minutes

This function NOW REQUIRES authentication. This closes a privacy leak.

**Via Appwrite Console:**
1. Click "check-user-subscription-access"
2. Go to "Code" tab
3. Copy code from: `functions/check-user-subscription-access/src/main.js`
4. Paste and Deploy
5. ✅ Wait for success

**After deployment:**
- [ ] Function deployed successfully
- [ ] No errors in execution logs

**Important:** This change means:
- ❌ Unauthenticated requests will now be rejected (401 Unauthorized)
- ✅ This is CORRECT behavior and closes the security leak
- If any code tries to call this without authentication, it will fail

---

### Step 2.3: Deploy `xendit-webhook-handler` (HIGH Priority - Third)
**Time:** 3 minutes

This function is now idempotent and won't create duplicate subscriptions.

**Via Appwrite Console:**
1. Click "xendit-webhook-handler"
2. Paste code from: `functions/xendit-webhook-handler/src/main.js`
3. Deploy

**After deployment:**
- [ ] Deployment successful
- [ ] Check "Executions" tab for any recent webhook calls
- [ ] No error patterns in logs

**What changed:**
- Webhooks are now processed idempotently
- Duplicate webhooks will be silently skipped (logged but not processed)
- HTTP error responses (500) on failure instead of (200)

---

### Step 2.4: Deploy `create-xendit-subscription` (HIGH Priority)
**Time:** 3 minutes

This function now stores additional audit trail fields.

**Via Appwrite Console:**
1. Click "create-xendit-subscription"
2. Paste code from: `functions/create-xendit-subscription/src/main.js`
3. Deploy

**After deployment:**
- [ ] Function deployed
- [ ] New payments will have: cancelledAt, supersededAt, replacementTransactionId (all null initially)

---

### Step 2.5: Deploy `renew-xendit-subscription` (HIGH Priority)
**Time:** 3 minutes

This function now creates links between superseded payments and replacement payments.

**Via Appwrite Console:**
1. Click "renew-xendit-subscription"
2. Paste code from: `functions/renew-xendit-subscription/src/main.js`
3. Deploy

**After deployment:**
- [ ] Function deployed
- [ ] Superseded payments now get: supersededAt timestamp and replacementTransactionId link

---

### Step 2.6: Deploy `sync-xendit-payment-history` (MEDIUM Priority)
**Time:** 3 minutes

This function now correctly extracts userIds from external_id.

**Via Appwrite Console:**
1. Click "sync-xendit-payment-history"
2. Paste code from: `functions/sync-xendit-payment-history/src/main.js`
3. Deploy

**After deployment:**
- [ ] Function deployed
- [ ] Future syncs will extract userIds correctly (no more orphaned records)

---

## 📱 Step 3: Deploy Frontend

**Time:** 10-15 minutes

### Step 3.1: Build Frontend
**Time:** 5 minutes

```bash
# From project root
npm run build

# Wait for build to complete
# You should see: "dist/" folder created with optimized files
```

**After build:**
- [ ] No build errors
- [ ] `dist/` folder exists
- [ ] `dist/index.html` exists
- [ ] Check terminal: build completed successfully

### Step 3.2: Deploy Built Frontend
**Time:** 5-10 minutes

**If using Vercel:**
```bash
npm run deploy
# Or: vercel --prod
```

**If using Netlify:**
```bash
npm run deploy
# Or: netlify deploy --prod
```

**If using manual hosting (S3/GCS/etc):**
```bash
# Copy dist/ folder to your web server
# Example (AWS S3):
aws s3 sync dist/ s3://your-bucket-name --delete
```

**After deployment:**
- [ ] Website accessible at your domain
- [ ] No 404 errors
- [ ] Pay attention to web server cache settings (you may want to bust cache if using CDN)

---

## ✅ Step 4: Post-Deployment Validation

**Time:** 10 minutes

### Step 4.1: Verify Basic Functionality
**Time:** 5 minutes

1. **Access website**
   - [ ] Homepage loads without errors
   - [ ] No JavaScript console errors (check DevTools)

2. **Login and navigate to Account**
   - [ ] Login works
   - [ ] Account page loads
   - [ ] Payment history loads

3. **Check new UI elements**
   - [ ] Cancel button visible on pending payments
   - [ ] Status badges show correct colors:
     - [ ] Green for "paid"
     - [ ] Red for "cancelled"/"expired"
     - [ ] Orange for "superseded"
     - [ ] Blue for "pending"

4. **Verify cancel button behavior (DO NOT click yet)**
   - [ ] Button is disabled/grayed for paid/cancelled/expired payments
   - [ ] Button is enabled for pending/superseded payments
   - [ ] Hover shows tooltip (if implemented)

### Step 4.2: Verify Functions Are Active
**Time:** 3 minutes

1. **Appwrite Console → Functions**
   - [ ] All 6 functions show as "Deployed"
   - [ ] No error badges on any function
   - [ ] Click each function → Executions tab (should be recent activity)

2. **Check Logs**
   - [ ] No ERROR level messages in logs
   - [ ] Any INFO/DEBUG messages look normal

### Step 4.3: Test Critical Path (Without Real Payment)
**Time:** 2 minutes

1. **Go to Pricing page**
   - [ ] Page loads
   - [ ] Select a plan (do NOT complete payment)
   - [ ] Checkout URL generated and payment shows in Account history as "pending"

2. **Navigate back**
   - [ ] Same plan selected again
   - [ ] **Same checkout URL returned** (not a new one)
   - [ ] No duplicate pending payments created

---

## 🧪 Step 5: Run Critical Test Scenarios

**Time:** 20-30 minutes

**IMPORTANT:** These tests verify the core fixes are working. Complete all tests before considering deployment successful.

### Test A: Same-Plan Reuse (Phase 5 - Pending Reuse Logic)
**⏱️ Time: 3 minutes**

**Objective:** Verify pending invoices are reused, not duplicated

**Steps:**
1. Log in to website
2. Go to Pricing → Select "Event Pass" (or any plan)
3. Save the checkout URL displayed: `____________________`
4. Note in Account → Payment History: a "pending" payment appears
5. Go back to Pricing
6. Select "Event Pass" again
7. **Verify:**
   - [ ] Same checkout URL returned (matches step 3)
   - [ ] Still only ONE "pending" payment in history (not duplicated)
   - [ ] ExternalId is the same

**If fails:** 
- Duplicate payments created → Rollback `create-xendit-subscription` and `renew-xendit-subscription`

---

### Test B: Different-Plan Supersede (Phase 5 - Supersede Logic)
**⏱️ Time: 5 minutes**

**Objective:** Verify old pending becomes superseded when user changes plan

**Steps:**
1. Log in
2. Go to Pricing → Select "Pro Monthly"
3. See pending payment created
4. Go back to Pricing (do NOT pay)
5. Select "Studio Annual" instead
6. New checkout URL generated
7. Go to Account → Payment History

**Verify:**
- [ ] OLD "Pro Monthly" payment now shows: status = "superseded"
- [ ] NEW "Studio Annual" payment shows: status = "pending"
- [ ] Timestamps: `supersededAt` populated on old payment
- [ ] Fields: `replacementTransactionId` points to new payment ID
- [ ] BOTH payments visible in history
- [ ] OLD payment has "Cancel" button available

**If fails:**
- Supersede logic broken → Rollback `renew-xendit-subscription` function

---

### Test C: Cancel Button Works (Phase 2 & 6)
**⏱️ Time: 3 minutes**

**Objective:** Verify cancel button updates UI and calls backend

**Steps:**
1. Go to Account → Payment History
2. Find any "pending" or "superseded" payment
3. Click "Cancel" button
4. Verify UI response:
   - [ ] Button shows loading spinner immediately
   - [ ] Button becomes disabled

5. **Wait for response:**
   - [ ] Success toast appears: "Payment cancelled successfully"
   - [ ] Payment status changes to "cancelled"
   - [ ] Cancel button disappears (no longer visible for cancelled status)

6. Refresh page (F5)
   - [ ] Status still shows "cancelled" (persisted to DB)

**If fails:**
- Cancel button error → Check browser console for JavaScript errors
- If backend error → Check `cancel-xendit-payment` function logs in Appwrite

---

### Test D: Cannot See Other User's Subscription (Phase 4 - Security Fix)
**⏱️ Time: 5 minutes**

**Objective:** Verify authentication is required and privacy is protected

**Steps:**

1. **Test 1: Valid authenticated request (should work)**
   - Log in normally
   - Go to Account page
   - Pay attention to whether it loads (it should)
   - [ ] Subscription access loads without errors

2. **Test 2: Unauthenticated request (should fail)**
   - Open your browser's developer tools (F12)
   - Go to Console tab
   - Paste and run:
   ```javascript
   fetch('YOUR_FUNCTION_URL', {
     method: 'GET',
     headers: {'Content-Type': 'application/json'}
   })
   .then(r => r.json())
   .then(d => console.log(d))
   ```
   Replace `YOUR_FUNCTION_URL` with your actual function URL from Appwrite Console

   Expected response:
   ```json
   {
     "hasAccess": false,
     "accountType": "free",
     "subscriptionStatus": "none",
     "error": "Authentication required. Must use authenticated session..."
   }
   ```

3. **Verify:**
   - [ ] Response includes error message about authentication
   - [ ] NO subscription data leaked (even for free status)
   - [ ] Response status is 401 Unauthorized

**If fails:**
- Old code is still active → Re-deploy `check-user-subscription-access` function

---

### Test E: Status Badge Colors (Phase 6 - UI Display)
**⏱️ Time: 2 minutes**

**Objective:** Verify all payment statuses display with correct colors

**In Account → Payment History:**_

1. **Find payments with each status (or note missing ones):**
   - [ ] "paid" → Green badge with checkmark
   - [ ] "pending" → Blue badge
   - [ ] "superseded" → Orange badge
   - [ ] "cancelled" → Red badge
   - [ ] "expired" → Red badge

2. **Verify visual distinction:**
   - [ ] Each status has distinct color
   - [ ] Colors match the design intent

**If fails:**
- CSS not loading → Check frontend deployment logs
- Colors wrong → Check Account.tsx StatusBadge component

---

### Test F: Webhook Idempotency (Phase 1 - Advanced Test)
**⏱️ Time: 5 minutes**

**Note:** This test requires access to Appwrite function execution logs. Skip if not available.

**Objective:** Verify duplicate webhooks don't create duplicate subscriptions

**Steps:**

1. Complete a payment successfully (OR check recent successful payment in history)
2. Note the payment ID: `____________________`
3. Open Appwrite Console → Functions → xendit-webhook-handler
4. Go to "Executions" tab
5. Look for recent PAID webhook execution
6. Check the execution logs for the message:
   ```
   "Payment already marked paid; skipping duplicate webhook"
   ```

**Verify:**
- [ ] If webhook executed multiple times, see idempotency message
- [ ] Subscription was created only ONCE (not extended multiple times)
- [ ] Logs show: "skipping duplicate webhook" or similar

**If webhook logs don't show any duplicate processing yet:**
- [ ] That's ok - it means no duplicate webhooks have arrived
- [ ] Idempotency is ready to handle them if they do

**If fails:**
- Duplicates still being processed → Rollback `xendit-webhook-handler`

---

## ⚠️ Step 6: Monitor for Issues (First 24 Hours)

**Time:** Continuous (5-min checks)

### Things to Watch
- [ ] **No spike in error logs** in Appwrite Console
- [ ] **Webhook success rate** remains ~100% (check Functions → xendit-webhook-handler → Executions)
- [ ] **No user complaints** about cancellation or authentication
- [ ] **Payment creation still working** (users can view costs, create orders)
- [ ] **Subscription activation working** (users who pay get access)

### Log Locations to Check
- **Backend errors:** Appwrite Console → Functions → [function name] → Executions → Scroll through logs
- **Frontend errors:** Browser DevTools → Console tab (check user browsers)
- **Network errors:** Appwrite Console → Browse deployed functions → Execution history

---

## 🔙 Step 7: Rollback Procedures (If Issues Found)

**ONLY IF critical issues discovered. Otherwise, keep deployment.**

### Critical Issues Requiring Rollback

| Issue | Function | Rollback | Risk |
|-------|----------|----------|------|
| **Users cannot cancel payments** | cancel-xendit-payment | Rollback to previous version | Users lose cancel feature temporarily |
| **Webhook processing broken** | xendit-webhook-handler | Rollback to previous version | Payments may not activate subscriptions |
| **Cannot check own subscription** | check-user-subscription-access | Rollback to previous version | Re-opens privacy leak |
| **Frontend won't load** | Account.tsx | Rollback frontend build | Website may be unavailable |

### How to Rollback Function
**Time:** 2-3 minutes per function

1. **Appwrite Console → Functions → [function name]**
2. Click "Deployments" tab
3. Click the deployment from BEFORE this deployment
4. Click "Make Active" button
5. Confirm rollback
6. Test the function
7. Document what failed

### How to Rollback Frontend
**Time:** 5-10 minutes

**If using Vercel/Netlify:**
- Go to Dashboard → Deployments
- Find previous deployment
- Click "Promote to Production"

**If using manual hosting:**
- Restore previous dist/ folder from backup
- Redeploy to web server

---

## 📊 Step 8: Post-Deployment Sign-Off

**Complete ONLY after all tests pass:**

### Checklist
- [ ] All 6 functions deployed successfully
- [ ] Frontend deployed and accessible
- [ ] All 6 test scenarios passed
- [ ] No critical issues in logs
- [ ] User access is working
- [ ] Cancel functionality verified
- [ ] Payments can still be created
- [ ] No security issues detected
- [ ] No user complaints (first 24h check)

### Deployment Record
**Save this information:**

```
Deployment Date: _______________
Deployed By: _______________
Deployment Environment: [ ] Staging [ ] Production
Backend Version Deployed: Phases 1-6 (Payment System Audit Fix)
Frontend Version Deployed: _______________

Function Deployment Times:
- cancel-xendit-payment: _______________
- check-user-subscription-access: _______________
- xendit-webhook-handler: _______________
- create-xendit-subscription: _______________
- renew-xendit-subscription: _______________
- sync-xendit-payment-history: _______________

Test Results:
- Test A (Pending Reuse): [ ] Pass [ ] Fail
- Test B (Supersede): [ ] Pass [ ] Fail
- Test C (Cancel Button): [ ] Pass [ ] Fail
- Test D (Security): [ ] Pass [ ] Fail
- Test E (Status Colors): [ ] Pass [ ] Fail
- Test F (Webhook): [ ] Pass [ ] Fail

Approval:
- Product Owner: _______________  Date: _______________
- Technical Lead: _______________  Date: _______________

Issues Found & Resolved:
___________________________________________________________
___________________________________________________________

Notes:
___________________________________________________________
___________________________________________________________
```

---

## 📚 Reference: What Files Were Changed

### Backend Functions (Deploy these)
- `functions/cancel-xendit-payment/src/main.js`
- `functions/check-user-subscription-access/src/main.js`
- `functions/xendit-webhook-handler/src/main.js`
- `functions/create-xendit-subscription/src/main.js`
- `functions/renew-xendit-subscription/src/main.js`
- `functions/sync-xendit-payment-history/src/main.js`

### Appwrite Versions (Also updated)
- `appwrite/functions/*/src/main.js` (all 5 updated to match)

### Frontend (Deploy updated website)
- `src/app/pages/Account.tsx` (cancel button + handlers)
- `src/app/lib/subscription.service.ts` (cancelXenditPayment function added)
- `src/app/lib/database.service.ts` (new fields + helpers + PaymentDocument interface)

---

## 🆘 Troubleshooting Quick Reference

### All tests pass except Test C (Cancel Button)
**Issue:** Click cancel → nothing happens or error appears

**Debug:**
1. Check browser console (F12) for JavaScript errors
2. Check Appwrite function execution logs for `cancel-xendit-payment`
3. Verify function is deployed and active

**Solution:**
- Redeploy `cancel-xendit-payment` function
- Check Xendit API key is set in environment variables
- Verify XENDIT_SECRET_KEY is accessible to function

---

### Test D fails (Can see subscription without auth)
**Issue:** Unauthenticated request returns subscription data

**Danger:** 🚨 SECURITY ISSUE - Privacy leak still present

**Solution (Immediate):**
1. Rollback `check-user-subscription-access` function
2. Re-deploy from `functions/check-user-subscription-access/src/main.js`
3. Verify code includes `if (!userId) return res.json(..., 401);`

---

### Test F shows webhooks duplicated but not skipped
**Issue:** Multiple webhook executions, but subscription extended multiple times

**Danger:** ⚠️ Users get double the subscription time (not critical but wrong)

**Solution:**
1. Check `xendit-webhook-handler` logs for "already marked paid" message
2. If message absent, function not deployed correctly
3. Redeploy `xendit-webhook-handler` function
4. Verify code includes idle potency check

---

### Frontend won't load after deployment
**Issue:** Website 404 or blank page

**Likely Cause:** Frontend not deployed OR dist/ not accessible

**Solution:**
1. Check build produced dist/ folder: `ls dist/` (should have index.html)
2. Check deployment logs for errors
3. Verify correct hosting path configured
4. Rollback to previous frontend version
5. Try deploy again

---

## ✨ Success Criteria

**Deployment is successful when:**
- ✅ All 6 functions deployed
- ✅ Frontend accessible and loads without errors
- ✅ All 6 test scenarios pass
- ✅ No ERROR level logs in Appwrite function executions
- ✅ Users can view payment history
- ✅ Users can cancel pending/superseded payments
- ✅ Cancelled payments cannot be paid in Xendit
- ✅ No duplicate pending payments created
- ✅ No orphaned user records from sync
- ✅ Status badges display correctly

---

**Questions? Check the Testing & Deployment Guide for more details.**

**Ready to deploy?** Start at Step 1 and follow each step in order. Good luck! 🚀
