import { MigrationInterface, QueryRunner } from "typeorm";

export class InitLatest1773056038982 implements MigrationInterface {
    name = 'InitLatest1773056038982'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`product\` (\`id\` varchar(10) NOT NULL, \`name\` varchar(255) NOT NULL, \`isActive\` tinyint NOT NULL DEFAULT 1, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`storeId\` varchar(10) NULL, \`stationId\` varchar(10) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`order\` (\`id\` varchar(10) NOT NULL, \`orderNumber\` varchar(255) NOT NULL, \`status\` enum ('NEW', 'PREPARING', 'READY') NOT NULL DEFAULT 'NEW', \`isArchived\` tinyint NOT NULL DEFAULT 0, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`storeId\` varchar(10) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`order_item\` (\`id\` varchar(10) NOT NULL, \`status\` enum ('NEW', 'PREPARING', 'READY') NOT NULL DEFAULT 'NEW', \`notes\` varchar(255) NULL, \`quantity\` int NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`productId\` varchar(10) NULL, \`orderId\` varchar(10) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`order_station_item\` (\`id\` varchar(10) NOT NULL, \`status\` varchar(255) NOT NULL DEFAULT 'pending', \`stationId\` varchar(10) NULL, \`orderItemId\` varchar(10) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`pairing_code\` (\`id\` varchar(10) NOT NULL, \`store_id\` varchar(10) NOT NULL, \`station_id\` varchar(10) NULL, \`code\` varchar(32) NOT NULL, \`status\` enum ('PENDING', 'EXPIRED', 'CLOSED') NOT NULL DEFAULT 'PENDING', \`expires_at\` datetime NULL, \`created_by\` varchar(10) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`storeId\` varchar(10) NULL, INDEX \`IDX_d89ef015c8975318f4a313128f\` (\`store_id\`), UNIQUE INDEX \`IDX_57b37422060287f31e98a503a5\` (\`code\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`station\` (\`id\` varchar(10) NOT NULL, \`storeId\` varchar(10) NOT NULL, \`name\` varchar(255) NOT NULL, \`color\` varchar(255) NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`store\` (\`id\` varchar(10) NOT NULL, \`name\` varchar(255) NOT NULL, \`owner_id\` varchar(10) NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`user\` (\`id\` varchar(10) NOT NULL, \`email\` varchar(255) NOT NULL, \`passwordHash\` varchar(255) NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_e12875dfb3b1d92d7d7c5377e2\` (\`email\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`device\` (\`id\` varchar(10) NOT NULL, \`deviceName\` varchar(255) NOT NULL, \`fingerprint\` varchar(255) NOT NULL, \`storeId\` varchar(10) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`product\` ADD CONSTRAINT \`FK_32eaa54ad96b26459158464379a\` FOREIGN KEY (\`storeId\`) REFERENCES \`store\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`product\` ADD CONSTRAINT \`FK_7f9ea9c05dfd08825bb48e0ecf8\` FOREIGN KEY (\`stationId\`) REFERENCES \`station\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`order\` ADD CONSTRAINT \`FK_1a79b2f719ecd9f307d62b81093\` FOREIGN KEY (\`storeId\`) REFERENCES \`store\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`order_item\` ADD CONSTRAINT \`FK_904370c093ceea4369659a3c810\` FOREIGN KEY (\`productId\`) REFERENCES \`product\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`order_item\` ADD CONSTRAINT \`FK_646bf9ece6f45dbe41c203e06e0\` FOREIGN KEY (\`orderId\`) REFERENCES \`order\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`order_station_item\` ADD CONSTRAINT \`FK_0ed6e0e1255ccef90b642c49f93\` FOREIGN KEY (\`stationId\`) REFERENCES \`station\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`order_station_item\` ADD CONSTRAINT \`FK_4f9e50e4f919f0233c63b844a62\` FOREIGN KEY (\`orderItemId\`) REFERENCES \`order_item\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`pairing_code\` ADD CONSTRAINT \`FK_471b4400dfa1a720ddde3879464\` FOREIGN KEY (\`storeId\`) REFERENCES \`store\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`station\` ADD CONSTRAINT \`FK_19f83bd21cf93fb0f6f59dbff2f\` FOREIGN KEY (\`storeId\`) REFERENCES \`store\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`store\` ADD CONSTRAINT \`FK_8ce7c0371b6fca43a17f523ce44\` FOREIGN KEY (\`owner_id\`) REFERENCES \`user\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`device\` ADD CONSTRAINT \`FK_99c4fe04e4561b80ccdca53b817\` FOREIGN KEY (\`storeId\`) REFERENCES \`store\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`device\` DROP FOREIGN KEY \`FK_99c4fe04e4561b80ccdca53b817\``);
        await queryRunner.query(`ALTER TABLE \`store\` DROP FOREIGN KEY \`FK_8ce7c0371b6fca43a17f523ce44\``);
        await queryRunner.query(`ALTER TABLE \`station\` DROP FOREIGN KEY \`FK_19f83bd21cf93fb0f6f59dbff2f\``);
        await queryRunner.query(`ALTER TABLE \`pairing_code\` DROP FOREIGN KEY \`FK_471b4400dfa1a720ddde3879464\``);
        await queryRunner.query(`ALTER TABLE \`order_station_item\` DROP FOREIGN KEY \`FK_4f9e50e4f919f0233c63b844a62\``);
        await queryRunner.query(`ALTER TABLE \`order_station_item\` DROP FOREIGN KEY \`FK_0ed6e0e1255ccef90b642c49f93\``);
        await queryRunner.query(`ALTER TABLE \`order_item\` DROP FOREIGN KEY \`FK_646bf9ece6f45dbe41c203e06e0\``);
        await queryRunner.query(`ALTER TABLE \`order_item\` DROP FOREIGN KEY \`FK_904370c093ceea4369659a3c810\``);
        await queryRunner.query(`ALTER TABLE \`order\` DROP FOREIGN KEY \`FK_1a79b2f719ecd9f307d62b81093\``);
        await queryRunner.query(`ALTER TABLE \`product\` DROP FOREIGN KEY \`FK_7f9ea9c05dfd08825bb48e0ecf8\``);
        await queryRunner.query(`ALTER TABLE \`product\` DROP FOREIGN KEY \`FK_32eaa54ad96b26459158464379a\``);
        await queryRunner.query(`DROP TABLE \`device\``);
        await queryRunner.query(`DROP INDEX \`IDX_e12875dfb3b1d92d7d7c5377e2\` ON \`user\``);
        await queryRunner.query(`DROP TABLE \`user\``);
        await queryRunner.query(`DROP TABLE \`store\``);
        await queryRunner.query(`DROP TABLE \`station\``);
        await queryRunner.query(`DROP INDEX \`IDX_57b37422060287f31e98a503a5\` ON \`pairing_code\``);
        await queryRunner.query(`DROP INDEX \`IDX_d89ef015c8975318f4a313128f\` ON \`pairing_code\``);
        await queryRunner.query(`DROP TABLE \`pairing_code\``);
        await queryRunner.query(`DROP TABLE \`order_station_item\``);
        await queryRunner.query(`DROP TABLE \`order_item\``);
        await queryRunner.query(`DROP TABLE \`order\``);
        await queryRunner.query(`DROP TABLE \`product\``);
    }

}
