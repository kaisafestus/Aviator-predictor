# Fix Payment Creation - Null Phone Constraint ✅

## Steps

### 1. ✅ Add strict phone validation and normalization in src/app/api/create-payment/route.ts
- Trim, check length >=10
- Normalize to 254...

### 2. ✅ Fix amount computation consistency
- Use single `amount` var from packageId or Amount

### 3. ✅ Move Supabase insert AFTER all validations

### 4. ✅ Fix TS errors (undefined 'amount')

### 5. ✅ Add CreatePaymentRequest interface in src/types/payment.ts

### 6. [ ] Test endpoint

### 7. [ ] Mark complete
