# Technical Requirements

## HTTP Server
[](#http)

Bun-based HTTP server for serving the dashboard.

### Requirements

- Serve static assets (JS bundle) [](#static)
- Handle API routes [](#api)
- Serve SPA shell for client routing [](#spa)

## WebSocket Server
[](#websocket)

Real-time communication with connected clients.

### Requirements

- Accept client connections [](#connect)
- Broadcast coverage updates [](#broadcast)
- Handle client disconnection gracefully [](#disconnect)

## File Watching
[](#file-watch)

Monitor filesystem for relevant changes.

### Requirements

- Use glob patterns for facet files [](#glob)
- Ignore irrelevant changes [](#ignore)
- Regenerate structure on markdown changes [](#regenerate)
