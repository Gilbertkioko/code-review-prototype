ALTER TABLE `project` ADD COLUMN `submission_progress` text NOT NULL DEFAULT 'awaiting_repo';
--> statement-breakpoint
ALTER TABLE `testing_thread_message` ADD COLUMN `author_user_id` text;
--> statement-breakpoint
ALTER TABLE `code_review_thread_message` ADD COLUMN `author_user_id` text;
