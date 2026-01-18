# Developer Experience

## CLI Ergonomics {#cli-ergonomics}

Provide intuitive command-line interface with helpful feedback.

### Requirements

- Support both `facet` and `facet-coverage` as command names {#command-names}
- Display help text with usage examples {#help-text}
- Show progress indicators during long operations {#progress-indicators}
- Use color coding for success/warning/error messages {#color-coding}
- Display emoji indicators for quick visual scanning {#emoji-indicators}
- Support common flags like `--help` and `--version` {#common-flags}

## Configuration Discovery {#config-discovery}

Automatically find and load configuration files.

### Requirements

- Look for configuration in standard locations {#config-locations}
- Support multiple config file formats (js, mjs, json) {#config-formats}
- Support custom config path via `-c` flag {#config-flag}
- Merge user config with sensible defaults {#config-merge}
- Warn when no config file is found {#config-warning}
