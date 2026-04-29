CREATE TABLE IF NOT EXISTS ai_review_cache (
  id text PRIMARY KEY NOT NULL,
  repo_url_normalized text NOT NULL,
  questions_hash text NOT NULL,
  prompt_version text NOT NULL,
  model text NOT NULL,
  status text NOT NULL,
  result_json text,
  raw_response text,
  error text,
  created_at integer NOT NULL,
  updated_at integer NOT NULL,
  completed_at integer
);

CREATE TABLE IF NOT EXISTS project_ai_review (
  project_id text NOT NULL,
  ai_review_cache_id text NOT NULL,
  linked_at integer NOT NULL,
  PRIMARY KEY(project_id, ai_review_cache_id),
  FOREIGN KEY(project_id) REFERENCES project(id) ON DELETE CASCADE,
  FOREIGN KEY(ai_review_cache_id) REFERENCES ai_review_cache(id) ON DELETE CASCADE
);
