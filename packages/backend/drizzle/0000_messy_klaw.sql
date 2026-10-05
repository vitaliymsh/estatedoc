CREATE TABLE `offers` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`portal` varchar(32) NOT NULL,
	`external_id` varchar(128) NOT NULL,
	`url` text NOT NULL,
	`title` varchar(255) NOT NULL,
	`price` decimal(12,2),
	`area_sqm` decimal(8,2),
	`rooms_count` int,
	`city` varchar(64) NOT NULL,
	`description` text,
	`metadata` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `offers_id` PRIMARY KEY(`id`),
	CONSTRAINT `portal_external_id_uidx` UNIQUE(`portal`,`external_id`)
);
--> statement-breakpoint
CREATE INDEX `city_price_idx` ON `offers` (`city`,`price`);