DROP TABLE IF EXISTS `authorization_codes`;

CREATE TABLE `authorization_codes` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`user_id` text NOT NULL,
	`client_id` text NOT NULL,
	`redirect_uri` text NOT NULL,
	`scope` text,
	`state` text,
	`code_challenge` text,
	`code_challenge_method` text,
	`expires_at` integer NOT NULL,
	`is_used` integer DEFAULT false,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`client_id`) REFERENCES `applications`(`client_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `authorization_codes_code_unique` ON `authorization_codes` (`code`);