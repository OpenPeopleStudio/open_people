# Incident Tracker

This folder is the source of truth for incident tracking until the in-app system ships.

## How to use

1) Create an incident file: `INC-YYYY-NNNN.md` in this folder.
2) If postmortem is required, create a postmortem file: `POSTMORTEMS/PM-YYYY-NNNN.md`.
3) Link the postmortem in the incident file and update status when closed.
4) Log a short summary + next owner in `docs/company/coordination.md`.

## Numbering

- `YYYY` = calendar year
- `NNNN` = zero-padded sequence (0001, 0002, ...)

## Templates

- Incident template: `docs/incidents/INC-TEMPLATE.md`
- Postmortem template: `docs/incidents/POSTMORTEMS/PM-TEMPLATE.md`
