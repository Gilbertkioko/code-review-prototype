CREATE TABLE `testing_item_progress` (
	`project_id` text NOT NULL,
	`item_id` text NOT NULL,
	`section` text NOT NULL,
	`item_summary` text NOT NULL,
	`mandatory_owner` text,
	`jane_verdict` text NOT NULL,
	`joe_verdict` text NOT NULL,
	`testing_round` integer NOT NULL,
	`updated_at` integer NOT NULL,
	PRIMARY KEY (`project_id`, `item_id`),
	FOREIGN KEY (`project_id`) REFERENCES `project`(`id`) ON UPDATE no action ON DELETE CASCADE
);
--> statement-breakpoint
CREATE INDEX `testing_item_progress_project_id_idx` ON `testing_item_progress` (`project_id`);
--> statement-breakpoint
CREATE TABLE `testing_thread_message` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`item_id` text NOT NULL,
	`round` integer NOT NULL,
	`author_persona` text NOT NULL,
	`body` text NOT NULL,
	`posted_at` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `project`(`id`) ON UPDATE no action ON DELETE CASCADE
);
--> statement-breakpoint
CREATE INDEX `testing_thread_message_project_id_idx` ON `testing_thread_message` (`project_id`);
--> statement-breakpoint
CREATE INDEX `testing_thread_message_item_idx` ON `testing_thread_message` (`project_id`, `item_id`);
--> statement-breakpoint
CREATE TABLE `code_review_observation_progress` (
	`project_id` text NOT NULL,
	`category_id` text NOT NULL,
	`observation_id` text NOT NULL,
	`jane_verdict` text NOT NULL,
	`joe_verdict` text NOT NULL,
	`code_review_round` integer NOT NULL,
	`updated_at` integer NOT NULL,
	PRIMARY KEY (`project_id`, `category_id`, `observation_id`),
	FOREIGN KEY (`project_id`) REFERENCES `project`(`id`) ON UPDATE no action ON DELETE CASCADE
);
--> statement-breakpoint
CREATE INDEX `code_review_obs_progress_project_id_idx` ON `code_review_observation_progress` (`project_id`);
--> statement-breakpoint
CREATE TABLE `code_review_thread_message` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`category_id` text NOT NULL,
	`observation_id` text NOT NULL,
	`round` integer NOT NULL,
	`author_persona` text NOT NULL,
	`body` text NOT NULL,
	`posted_at` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `project`(`id`) ON UPDATE no action ON DELETE CASCADE
);
--> statement-breakpoint
CREATE INDEX `code_review_thread_message_project_id_idx` ON `code_review_thread_message` (`project_id`);
