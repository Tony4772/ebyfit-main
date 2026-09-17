CREATE TABLE `check_ins` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`checkInDate` varchar(10) NOT NULL,
	`mood` varchar(40) NOT NULL,
	`energy` int NOT NULL,
	`note` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `check_ins_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `weight_entries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`entryDate` varchar(10) NOT NULL,
	`value` decimal(5,2) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `weight_entries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workout_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`workoutId` varchar(120) NOT NULL,
	`workoutDate` varchar(10) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `workout_logs_id` PRIMARY KEY(`id`)
);
