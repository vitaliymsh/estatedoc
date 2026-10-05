ALTER TABLE `offers` ADD `price_sqm` int;--> statement-breakpoint
CREATE INDEX `price_sqm_idx` ON `offers` (`price_sqm`);
