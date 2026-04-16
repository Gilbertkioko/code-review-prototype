CREATE TABLE `project` (
	`id` text PRIMARY KEY NOT NULL,
	`submitter_id` text NOT NULL,
	`instructions` text NOT NULL,
	`gitea_url` text,
	`status` text NOT NULL,
	`code_review_json` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`submitter_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `project_comment` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`author_id` text NOT NULL,
	`parent_id` text,
	`body` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `project`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`author_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `review_pair` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`reviewer_a_id` text NOT NULL,
	`reviewer_b_id` text NOT NULL,
	`categories_a_json` text NOT NULL,
	`categories_b_json` text NOT NULL,
	`created_by_id` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `project`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`reviewer_a_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`reviewer_b_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "review_pair_distinct" CHECK("review_pair"."reviewer_a_id" != "review_pair"."reviewer_b_id")
);
--> statement-breakpoint
CREATE UNIQUE INDEX `review_pair_project_id_unique` ON `review_pair` (`project_id`);