-- Run once on existing SQLite / LibSQL databases if `npm run db:push` cannot apply the change automatically.
ALTER TABLE project ADD COLUMN admin_sidebar_hidden_at integer;
