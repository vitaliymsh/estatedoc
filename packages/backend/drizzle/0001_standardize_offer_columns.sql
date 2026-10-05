ALTER TABLE `offers` ADD `floor` int;--> statement-breakpoint
ALTER TABLE `offers` ADD `total_floors` int;--> statement-breakpoint
ALTER TABLE `offers` ADD `property_type` varchar(32);--> statement-breakpoint
ALTER TABLE `offers` ADD `transaction_type` varchar(16);--> statement-breakpoint
ALTER TABLE `offers` ADD `district` varchar(64);--> statement-breakpoint
ALTER TABLE `offers` ADD `street` varchar(128);--> statement-breakpoint
ALTER TABLE `offers` ADD `seller_type` varchar(32);--> statement-breakpoint
ALTER TABLE `offers` ADD `images` json;--> statement-breakpoint
CREATE INDEX `city_district_idx` ON `offers` (`city`,`district`);--> statement-breakpoint
CREATE INDEX `type_idx` ON `offers` (`property_type`,`transaction_type`);