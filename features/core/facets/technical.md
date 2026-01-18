# Technical Requirements

## TypeScript Support {#typescript}

Full TypeScript support with proper type definitions.

### Requirements

- All source code written in TypeScript [](#typescript-source)
- Export type definitions for all public interfaces [](#typescript-exports)
- Use strict TypeScript configuration [](#typescript-strict)
- Support ESM module system (NodeNext) [](#typescript-esm)

## Bun Compatibility {#bun}

Work correctly with Bun runtime and package manager.

### Requirements

- All dependencies compatible with Bun [](#bun-deps)
- Build scripts work with `bun run` [](#bun-scripts)
- File system operations work in Bun [](#bun-fs)
- Glob patterns work correctly in Bun [](#bun-glob)

## Glob Pattern Handling {#glob}

Correctly handle glob patterns for file discovery.

### Requirements

- Support standard glob syntax (`**`, `*`, etc.) [](#glob-syntax)
- Handle multiple patterns in configuration [](#glob-multiple)
- Work with both relative and absolute paths [](#glob-paths)
- Handle edge cases (empty directories, no matches) [](#glob-edge-cases)

## Markdown Parsing Accuracy {#markdown-parsing}

Accurately parse markdown files for section extraction.

### Requirements

- Handle all heading levels (h1-h6) [](#md-heading-levels)
- Correctly generate slugs from heading text [](#md-slug-gen)
- Handle special characters in headings [](#md-special-chars)
- Support markdown with code blocks and fences [](#md-code-blocks)
- Ignore headings inside code blocks [](#md-ignore-code-headings)
