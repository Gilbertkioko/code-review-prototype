CREATE TABLE `code_review_verdict_event` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`category_id` text NOT NULL,
	`observation_id` text NOT NULL,
	`persona` text NOT NULL,
	`verdict` text NOT NULL,
	`code_review_round` integer NOT NULL,
	`changed_at` integer NOT NULL,
	`changed_by_user_id` text,
	FOREIGN KEY (`project_id`) REFERENCES `project`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`changed_by_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
