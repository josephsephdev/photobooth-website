# cancel-xendit-payment

Cancels a payment document in Appwrite if its status is `pending` or `superseded`.

## Usage
- Expects `paymentId` in the request body.
- Authenticates user via `x-appwrite-user-id` header.
- Only allows cancellation if the payment belongs to the user and is in a cancellable state.

## Environment Variables
- `APPWRITE_ENDPOINT`
- `APPWRITE_PROJECT_ID`
- `APPWRITE_API_KEY`
- `DATABASE_ID` (default: `photobooth_db`)
- `COLLECTION_PAYMENTS` (default: `payments`)

## Response
- Success: `{ message: 'Payment cancelled successfully' }`
- Error: `{ error: '...' }`
