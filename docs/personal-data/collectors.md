# Collector Setup

## Phone
- **Android**: ActivityWatch (aw-android) for app/window stats; GPS logger (e.g., OpenTracks) exporting to webhook; Health Connect exports for sleep/steps.
- **iOS**: Shortcuts automations -> HTTPS POST to `/api/personal-data/ingest` with `source=ios` and `kind` per shortcut; use Background Location or Fitness export where possible.
- **Both**: Send via VPN (Tailscale) to keep the endpoint private. Include `X-INGEST-KEY: $PERSONAL_DATA_INGEST_KEY`.

## Laptop/Desktop
- ActivityWatch desktop agent for app/window usage (`kind=app_usage`).
- Hammerspoon/Autohotkey key-frequency counters (no content) emitting JSON to local queue then batch posting.
- Optional shell logger: `scripts/personal-data/log-manual.js --kind=timeblock --label "Deep Work" --duration 3600`.

## Browser
- Lightweight extension that records active tab URL/title every N seconds; batch POST as `kind=browser_history`.
- Until the extension exists, use ActivityWatch browser plugin with the same ingest endpoint.

## Data shape (examples)
- `location`: `{ "lat": 37.77, "lon": -122.4, "accuracy": 12 }`
- `notification`: `{ "app": "slack", "title": "ping", "text": "…" }`
- `browser_history`: `{ "url": "https://example.com", "title": "Example", "duration_ms": 5000 }`
- `app_usage`: `{ "app": "VS Code", "window": "main.tsx", "duration_ms": 120000 }`
- `timeblock`: `{ "label": "Focus", "start": "...", "end": "..." }`

## Transport
- All collectors should:
  - Include `source` (device/name) and `kind`.
  - Encrypt payload with the shared age public key before upload, or rely on VPN + HTTPS and keep payload minimal.
  - Batch events where possible to reduce overhead.
