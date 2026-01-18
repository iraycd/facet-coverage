# Compliance Requirements

## PCI-DSS Payment Requirements
[](#pci-dss)

We handle credit card data, so PCI-DSS compliance is mandatory:

1. **Encryption in transit** [](#tls) - TLS 1.2+ required
2. **No CVV storage** [](#cvv) - Use payment gateway, never store CVV
3. **Card masking** [](#masking) - Display only last 4 digits
4. **Transaction logging** [](#logging) - All payments must be audited
5. **Fraud monitoring** [](#fraud) - Failed attempts tracked

**Reference:** PCI-DSS v3.2.1, Requirements 3, 4, 8

### What Must Be Tested
- TLS encryption enforced
- No CVV in database or logs
- Card numbers properly masked
- Complete audit trail
- Rate limiting on payment attempts

## GDPR Data Handling
[](#gdpr)

User data must be handled according to GDPR requirements.

### Requirements
- Explicit consent for data collection [](#consent)
- Right to data export [](#export)
- Right to deletion [](#deletion)
- Data minimization [](#minimization)
- Clear privacy policy [](#privacy-policy)
