# Technical Requirements

## TypeScript Support

Full TypeScript support with proper type definitions.

### Requirements

- All source code written in TypeScript
- Export type definitions for all public interfaces
- Use strict TypeScript configuration
- Support ESM module system (NodeNext)

## Bun Compatibility

Work correctly with Bun runtime and package manager.

### Requirements

- All dependencies compatible with Bun
- Build scripts work with `bun run`
- File system operations work in Bun
- Glob patterns work correctly in Bun

## Glob Pattern Handling

Correctly handle glob patterns for file discovery.

### Requirements

- Support standard glob syntax (`**`, `*`, etc.)
- Handle multiple patterns in configuration
- Work with both relative and absolute paths
- Handle edge cases (empty directories, no matches)

## Markdown Parsing Accuracy

Accurately parse markdown files for section extraction.

### Requirements

- Handle all heading levels (h1-h6)
- Correctly generate slugs from heading text
- Handle special characters in headings
- Support markdown with code blocks and fences
- Ignore headings inside code blocks
