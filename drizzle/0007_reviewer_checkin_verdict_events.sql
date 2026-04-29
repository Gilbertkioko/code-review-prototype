CREATE TABLE `reviewer_checkin` (
	`project_id` text NOT NULL,
	`reviewer_user_id` text NOT NULL,
	`persona` text NOT NULL,
	`accepted_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	PRIMARY KEY(`project_id`, `reviewer_user_id`),
	FOREIGN KEY (`project_id`) REFERENCES `project`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`reviewer_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);

CREATE TABLE `testing_verdict_event` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`item_id` text NOT NULL,
	`persona` text NOT NULL,
	`verdict` text NOT NULL,
	`testing_round` integer NOT NULL,
	`changed_at` integer NOT NULL,
	`changed_by_user_id` text,
	FOREIGN KEY (`project_id`) REFERENCES `project`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`changed_by_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
