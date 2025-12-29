# Stripe Test Cards

When testing payments in Stripe test mode, you can use these test card numbers. **Any future expiration date and any 3-digit CVC will work** for all test cards.

## Successful Payments

### Visa (Default)
- **Card Number:** `4242 4242 4242 4242`
- **Expiry:** Any future date (e.g., `12/34`)
- **CVC:** Any 3 digits (e.g., `123`)

### Visa (Debit)
- **Card Number:** `4000 0566 5566 5556`
- **Expiry:** Any future date
- **CVC:** Any 3 digits

### Mastercard
- **Card Number:** `5555 5555 5555 4444`
- **Expiry:** Any future date
- **CVC:** Any 3 digits

### American Express
- **Card Number:** `3782 822463 10005`
- **Expiry:** Any future date
- **CVC:** Any 4 digits (Amex uses 4-digit CVC)

## Payment Failures

### Card Declined (Generic)
- **Card Number:** `4000 0000 0000 0002`
- **Expiry:** Any future date
- **CVC:** Any 3 digits

### Insufficient Funds
- **Card Number:** `4000 0000 0000 9995`
- **Expiry:** Any future date
- **CVC:** Any 3 digits

### Lost Card
- **Card Number:** `4000 0000 0000 9987`
- **Expiry:** Any future date
- **CVC:** Any 3 digits

### Stolen Card
- **Card Number:** `4000 0000 0000 9979`
- **Expiry:** Any future date
- **CVC:** Any 3 digits

### Expired Card
- **Card Number:** `4000 0000 0000 0069`
- **Expiry:** Any past date
- **CVC:** Any 3 digits

### Incorrect CVC
- **Card Number:** `4000 0000 0000 0127`
- **Expiry:** Any future date
- **CVC:** Any incorrect CVC (will fail on second attempt)

### Processing Error
- **Card Number:** `4000 0000 0000 0119`
- **Expiry:** Any future date
- **CVC:** Any 3 digits

## 3D Secure Authentication

### Requires Authentication
- **Card Number:** `4000 0027 6000 3184`
- **Expiry:** Any future date
- **CVC:** Any 3 digits
- **Note:** Will prompt for 3D Secure authentication

### Authentication Fails
- **Card Number:** `4000 0082 6000 3178`
- **Expiry:** Any future date
- **CVC:** Any 3 digits

## International Cards

### UK Debit Card
- **Card Number:** `4000 0566 5566 5556`
- **Expiry:** Any future date
- **CVC:** Any 3 digits

### Brazilian Card
- **Card Number:** `4000 0076 0000 0002`
- **Expiry:** Any future date
- **CVC:** Any 3 digits

## Important Notes

1. **Expiration Date:** Use any future date (e.g., `12/34`, `01/25`, `06/30`)
2. **CVC:** Use any 3 digits (e.g., `123`, `456`, `789`)
   - **Exception:** American Express requires 4 digits
3. **ZIP/Postal Code:** Any valid format (e.g., `12345`, `90210`, `SW1A 1AA`)
4. **All test cards work in test mode only** - they will not work with live API keys

## Testing in Your Application

When testing the booking payment flow:

1. **Successful Payment:** Use `4242 4242 4242 4242` with any future date and CVC
2. **Payment Failure:** Use `4000 0000 0000 0002` to test error handling
3. **3D Secure:** Use `4000 0027 6000 3184` to test authentication flow

## Reference

For the complete list of test cards, see: https://stripe.com/docs/testing

