# Developer Experience

## Error Messages
Provide clear, actionable error messages for all failure scenarios.

### Requirements

- Include file paths in error messages for easy navigation [](#error-file-paths)
- Include line numbers where applicable [](#error-line-numbers)
- Explain what went wrong and how to fix it [](#error-explanation)
- Distinguish between errors (blocking) and warnings (informational) [](#error-severity)
- Use consistent message formatting across all modules [](#error-formatting)

## API Design
Design clean, intuitive APIs for programmatic usage.

### Requirements

- Export all core classes from main package entry point [](#api-exports)
- Use TypeScript interfaces for all configuration and return types [](#api-types)
- Provide sensible defaults for all optional configuration [](#api-defaults)
- Support method chaining where appropriate [](#api-chaining)
- Document public methods with JSDoc comments [](#api-docs)
