CREATE TABLE IF NOT EXISTS ai_review_job (
  id text PRIMARY KEY NOT NULL,
  project_id text NOT NULL,
  repo_url text NOT NULL,
  repo_url_normalized text NOT NULL,
  questions_hash text NOT NULL,
  prompt_version text NOT NULL,
  status text NOT NULL,
  attempt_count integer NOT NULL DEFAULT 0,
  max_attempts integer NOT NULL DEFAULT 3,
  next_run_at integer NOT NULL,
  locked_at integer,
  last_error text,
  created_at integer NOT NULL,
  updated_at integer NOT NULL,
  finished_at integer,
  FOREIGN KEY(project_id) REFERENCES project(id) ON DELETE CASCADE
);
