import { MigrationInterface, QueryRunner } from "typeorm";

export class MoveEntity1775434456899 implements MigrationInterface {
    name = 'MoveEntity1775434456899'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`menu\` (\`id\` varchar(10) NOT NULL, \`name\` varchar(255) NOT NULL, \`isActive\` tinyint NOT NULL DEFAULT 1, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`storeId\` varchar(10) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`user\` CHANGE \`id\` \`id\` int NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`user\` DROP PRIMARY KEY`);
        await queryRunner.query(`ALTER TABLE \`user\` DROP COLUMN \`id\``);
        await queryRunner.query(`ALTER TABLE \`user\` ADD \`id\` varchar(10) NOT NULL PRIMARY KEY`);
        await queryRunner.query(`ALTER TABLE \`device\` DROP PRIMARY KEY`);
        await queryRunner.query(`ALTER TABLE \`device\` DROP COLUMN \`id\``);
        await queryRunner.query(`ALTER TABLE \`device\` ADD \`id\` varchar(10) NOT NULL PRIMARY KEY`);
        await queryRunner.query(`CREATE INDEX \`IDX_d89ef015c8975318f4a313128f\` ON \`pairing_code\` (\`store_id\`)`);
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
        await queryRunner.query(`ALTER TABLE \`device\` ADD CONSTRAINT \`FK_365f3de9d913e0b8340be2597ed\` FOREIGN KEY (\`store_id\`) REFERENCES \`store\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`device\` ADD CONSTRAINT \`FK_a0a83b0c68388c80416cbf34c3c\` FOREIGN KEY (\`station_id\`) REFERENCES \`station\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`pairing_requests\` ADD CONSTRAINT \`FK_8f53274011041abb3d652a8fed8\` FOREIGN KEY (\`pairing_code_id\`) REFERENCES \`pairing_code\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`pairing_requests\` ADD CONSTRAINT \`FK_55c2116e42fb798ba70849bfe19\` FOREIGN KEY (\`store_id\`) REFERENCES \`store\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`pairing_requests\` ADD CONSTRAINT \`FK_68ef2c0b6e11114627b36d409e0\` FOREIGN KEY (\`station_id\`) REFERENCES \`station\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`pairing_requests\` ADD CONSTRAINT \`FK_32223847d43d3ccd3a8b349fb2e\` FOREIGN KEY (\`device_id\`) REFERENCES \`device\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`menu\` ADD CONSTRAINT \`FK_266438f8f09ba25d8ebbb9f9310\` FOREIGN KEY (\`storeId\`) REFERENCES \`store\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`menu\` DROP FOREIGN KEY \`FK_266438f8f09ba25d8ebbb9f9310\``);
        await queryRunner.query(`ALTER TABLE \`pairing_requests\` DROP FOREIGN KEY \`FK_32223847d43d3ccd3a8b349fb2e\``);
        await queryRunner.query(`ALTER TABLE \`pairing_requests\` DROP FOREIGN KEY \`FK_68ef2c0b6e11114627b36d409e0\``);
        await queryRunner.query(`ALTER TABLE \`pairing_requests\` DROP FOREIGN KEY \`FK_55c2116e42fb798ba70849bfe19\``);
        await queryRunner.query(`ALTER TABLE \`pairing_requests\` DROP FOREIGN KEY \`FK_8f53274011041abb3d652a8fed8\``);
        await queryRunner.query(`ALTER TABLE \`device\` DROP FOREIGN KEY \`FK_a0a83b0c68388c80416cbf34c3c\``);
        await queryRunner.query(`ALTER TABLE \`device\` DROP FOREIGN KEY \`FK_365f3de9d913e0b8340be2597ed\``);
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
        await queryRunner.query(`DROP INDEX \`IDX_d89ef015c8975318f4a313128f\` ON \`pairing_code\``);
        await queryRunner.query(`ALTER TABLE \`device\` DROP COLUMN \`id\``);
        await queryRunner.query(`ALTER TABLE \`device\` ADD \`id\` varchar(36) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`device\` ADD PRIMARY KEY (\`id\`)`);
        await queryRunner.query(`ALTER TABLE \`user\` DROP COLUMN \`id\``);
        await queryRunner.query(`ALTER TABLE \`user\` ADD \`id\` int NOT NULL AUTO_INCREMENT`);
        await queryRunner.query(`ALTER TABLE \`user\` ADD PRIMARY KEY (\`id\`)`);
        await queryRunner.query(`ALTER TABLE \`user\` CHANGE \`id\` \`id\` int NOT NULL AUTO_INCREMENT`);
        await queryRunner.query(`DROP TABLE \`menu\``);
    }

}
