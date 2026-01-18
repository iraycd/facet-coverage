# Developer Experience

## Error Messages

Provide clear, actionable error messages for all failure scenarios.

### Requirements

- Include file paths in error messages for easy navigation
- Include line numbers where applicable
- Explain what went wrong and how to fix it
- Distinguish between errors (blocking) and warnings (informational)
- Use consistent message formatting across all modules

## API Design

Design clean, intuitive APIs for programmatic usage.

### Requirements

- Export all core classes from main package entry point
- Use TypeScript interfaces for all configuration and return types
- Provide sensible defaults for all optional configuration
- Support method chaining where appropriate
- Document public methods with JSDoc comments
