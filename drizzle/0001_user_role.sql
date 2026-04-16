PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_user` (
	`id` text PRIMARY KEY NOT NULL,
	`username` text NOT NULL,
	`password_hash` text NOT NULL,
	`role` text DEFAULT 'submitter' NOT NULL,
	CONSTRAINT "user_role_check" CHECK("__new_user"."role" in ('admin', 'submitter', 'reviewer'))
);
--> statement-breakpoint
INSERT INTO `__new_user`("id", "username", "password_hash", "role") SELECT "id", "username", "password_hash", 'submitter' FROM `user`;--> statement-breakpoint
DROP TABLE `user`;--> statement-breakpoint
ALTER TABLE `__new_user` RENAME TO `user`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `user_username_unique` ON `user` (`username`);