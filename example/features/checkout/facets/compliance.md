# Compliance Requirements

## PCI-DSS Payment Requirements

We handle credit card data, so PCI-DSS compliance is mandatory:

1. **Encryption in transit** - TLS 1.2+ required
2. **No CVV storage** - Use payment gateway, never store CVV
3. **Card masking** - Display only last 4 digits
4. **Transaction logging** - All payments must be audited
5. **Fraud monitoring** - Failed attempts tracked

**Reference:** PCI-DSS v3.2.1, Requirements 3, 4, 8

### What Must Be Tested
- TLS encryption enforced
- No CVV in database or logs
- Card numbers properly masked
- Complete audit trail
- Rate limiting on payment attempts

## GDPR Data Handling

User data must be handled according to GDPR requirements.

### Requirements
- Explicit consent for data collection
- Right to data export
- Right to deletion
- Data minimization
- Clear privacy policy
