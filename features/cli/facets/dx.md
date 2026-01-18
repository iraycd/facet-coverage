# Developer Experience

## CLI Ergonomics

Provide intuitive command-line interface with helpful feedback.

### Requirements

- Support both `facet` and `facet-coverage` as command names
- Display help text with usage examples
- Show progress indicators during long operations
- Use color coding for success/warning/error messages
- Display emoji indicators for quick visual scanning
- Support common flags like `--help` and `--version`

## Configuration Discovery

Automatically find and load configuration files.

### Requirements

- Look for configuration in standard locations
- Support multiple config file formats (js, mjs, json)
- Support custom config path via `-c` flag
- Merge user config with sensible defaults
- Warn when no config file is found
