cynexai-website/schema.sql:133-138 — add ON DELETE CASCADE to tasks.
cynexai-website/schema.sql:187-190 — add ON DELETE CASCADE to crm_activities.
cynexai-website/migrate_m1_1.js:42-47 — add ON DELETE CASCADE to tasks migration.
cynexai-website/migrate_m1_1.js:93-96 — add ON DELETE CASCADE to crm_activities migration.
cynexai-website/src/lib/api/m1_schema.test.ts:88-103 — assert ON DELETE CASCADE for foreign keys.
verified: vitest passed.
