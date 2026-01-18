## Guest Purchase Flow

A user who isn't logged in should be able to buy products. They add
items to cart, click checkout, provide email and payment details,
and get an order confirmation.

The process must be seamless - no friction, no unnecessary steps.

### Edge Cases

- Empty cart at checkout
- Invalid email format
- Payment gateway timeout
- Card declined

### Success Criteria

- User can complete purchase without account
- Payment processed securely
- Order confirmation email sent
- Works smoothly on mobile (70% of traffic)

## Cart Management

Users should be able to add, remove, and update quantities of items
in their shopping cart. The cart should persist across sessions.

### Requirements

- Add items with single click
- Update quantities inline
- Remove items with confirmation
- Show running total
- Apply discount codes
