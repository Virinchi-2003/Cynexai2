# Scope: M3 (Routing & Roles)

## Architecture
- Routes are protected via authentication.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | M3 | Secure `/admin` with `RequireAuth`; fix DM role (`'DM'` vs `'Digital Marketer'`); remove orphaned pages | none | IN_PROGRESS |

## Interface Contracts
- Admin route requires valid auth token.
- Role checks for Digital Marketer must match the database value exactly.
