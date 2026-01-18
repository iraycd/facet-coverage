# Server Features

## Live Coverage Dashboard
[](#dashboard)

Real-time coverage metrics displayed in a web-based dashboard.

### Requirements

- Display total/covered/uncovered facet counts [](#counts)
- Show coverage percentage by facet type [](#by-type)
- List features with their coverage stats [](#features)
- Show uncovered facets for quick identification [](#uncovered)

## Hot Reload
[](#hot-reload)

Automatically refresh coverage when files change.

### Requirements

- Watch facet markdown files for changes [](#facets)
- Watch test files for changes [](#tests)
- Broadcast updates via WebSocket [](#websocket)
- Debounce rapid file changes [](#debounce)

## Facet Documentation Viewer
[](#doc-viewer)

Browse facet markdown with inline coverage badges.

### Requirements

- Render markdown to HTML [](#markdown)
- Show coverage badge per facet [](#badges)
- Display linked tests for each facet [](#linked-tests)
- View test source code excerpts [](#source)
