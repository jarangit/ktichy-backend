import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateStationDeviceRelation1775482411081 implements MigrationInterface {
    name = 'UpdateStationDeviceRelation1775482411081'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`device\` DROP FOREIGN KEY \`FK_device_station_id\``);
        await queryRunner.query(`ALTER TABLE \`device\` DROP FOREIGN KEY \`FK_device_store_id\``);
        await queryRunner.query(`DROP INDEX \`UQ_device_device_id\` ON \`device\``);
        await queryRunner.query(`CREATE TABLE \`menu\` (\`id\` varchar(10) NOT NULL, \`name\` varchar(255) NOT NULL, \`isActive\` tinyint NOT NULL DEFAULT 1, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`storeId\` varchar(10) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`pairing_requests\` (\`id\` varchar(10) NOT NULL, \`pairing_code_id\` varchar(10) NOT NULL, \`store_id\` varchar(10) NOT NULL, \`station_id\` varchar(10) NULL, \`device_id\` varchar(10) NOT NULL, \`requested_alias\` varchar(255) NULL, \`requested_fingerprint\` varchar(255) NULL, \`requested_app_version\` varchar(255) NULL, \`status\` enum ('WAITING_APPROVAL', 'APPROVED', 'REJECTED', 'EXPIRED', 'CANCELLED') NOT NULL DEFAULT 'WAITING_APPROVAL', \`approved_by\` varchar(10) NULL, \`approved_at\` datetime NULL, \`expires_at\` datetime NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`station\` ADD \`deviceId\` varchar(10) NULL`);
        await queryRunner.query(`ALTER TABLE \`device\` ADD UNIQUE INDEX \`IDX_17d554d4f6b44ff0e200ee4b92\` (\`device_id\`)`);
        await queryRunner.query(`ALTER TABLE \`device\` ADD CONSTRAINT \`FK_365f3de9d913e0b8340be2597ed\` FOREIGN KEY (\`store_id\`) REFERENCES \`store\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`device\` ADD CONSTRAINT \`FK_a0a83b0c68388c80416cbf34c3c\` FOREIGN KEY (\`station_id\`) REFERENCES \`station\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`menu\` ADD CONSTRAINT \`FK_266438f8f09ba25d8ebbb9f9310\` FOREIGN KEY (\`storeId\`) REFERENCES \`store\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`pairing_requests\` ADD CONSTRAINT \`FK_8f53274011041abb3d652a8fed8\` FOREIGN KEY (\`pairing_code_id\`) REFERENCES \`pairing_code\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`pairing_requests\` ADD CONSTRAINT \`FK_55c2116e42fb798ba70849bfe19\` FOREIGN KEY (\`store_id\`) REFERENCES \`store\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`pairing_requests\` ADD CONSTRAINT \`FK_68ef2c0b6e11114627b36d409e0\` FOREIGN KEY (\`station_id\`) REFERENCES \`station\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`pairing_requests\` ADD CONSTRAINT \`FK_32223847d43d3ccd3a8b349fb2e\` FOREIGN KEY (\`device_id\`) REFERENCES \`device\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`pairing_requests\` DROP FOREIGN KEY \`FK_32223847d43d3ccd3a8b349fb2e\``);
        await queryRunner.query(`ALTER TABLE \`pairing_requests\` DROP FOREIGN KEY \`FK_68ef2c0b6e11114627b36d409e0\``);
        await queryRunner.query(`ALTER TABLE \`pairing_requests\` DROP FOREIGN KEY \`FK_55c2116e42fb798ba70849bfe19\``);
        await queryRunner.query(`ALTER TABLE \`pairing_requests\` DROP FOREIGN KEY \`FK_8f53274011041abb3d652a8fed8\``);
        await queryRunner.query(`ALTER TABLE \`menu\` DROP FOREIGN KEY \`FK_266438f8f09ba25d8ebbb9f9310\``);
        await queryRunner.query(`ALTER TABLE \`device\` DROP FOREIGN KEY \`FK_a0a83b0c68388c80416cbf34c3c\``);
        await queryRunner.query(`ALTER TABLE \`device\` DROP FOREIGN KEY \`FK_365f3de9d913e0b8340be2597ed\``);
        await queryRunner.query(`ALTER TABLE \`device\` DROP INDEX \`IDX_17d554d4f6b44ff0e200ee4b92\``);
        await queryRunner.query(`ALTER TABLE \`station\` DROP COLUMN \`deviceId\``);
        await queryRunner.query(`DROP TABLE \`pairing_requests\``);
        await queryRunner.query(`DROP TABLE \`menu\``);
        await queryRunner.query(`CREATE UNIQUE INDEX \`UQ_device_device_id\` ON \`device\` (\`device_id\`)`);
        await queryRunner.query(`ALTER TABLE \`device\` ADD CONSTRAINT \`FK_device_store_id\` FOREIGN KEY (\`store_id\`) REFERENCES \`store\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`device\` ADD CONSTRAINT \`FK_device_station_id\` FOREIGN KEY (\`station_id\`) REFERENCES \`station\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

}
