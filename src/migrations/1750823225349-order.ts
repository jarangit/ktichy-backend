import { MigrationInterface, QueryRunner } from "typeorm";

export class Order1750823225349 implements MigrationInterface {
    name = 'Order1750823225349'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`order_item\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(255) NOT NULL, \`status\` enum ('NEW', 'PREPARING', 'READY') NOT NULL DEFAULT 'NEW', \`notes\` varchar(255) NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`order_station_item\` (\`id\` int NOT NULL AUTO_INCREMENT, \`status\` varchar(255) NOT NULL DEFAULT 'pending', \`stationId\` int NULL, \`orderItemId\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`order_station_item\` ADD CONSTRAINT \`FK_0ed6e0e1255ccef90b642c49f93\` FOREIGN KEY (\`stationId\`) REFERENCES \`station\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`order_station_item\` ADD CONSTRAINT \`FK_4f9e50e4f919f0233c63b844a62\` FOREIGN KEY (\`orderItemId\`) REFERENCES \`order_item\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`order_station_item\` DROP FOREIGN KEY \`FK_4f9e50e4f919f0233c63b844a62\``);
        await queryRunner.query(`ALTER TABLE \`order_station_item\` DROP FOREIGN KEY \`FK_0ed6e0e1255ccef90b642c49f93\``);
        await queryRunner.query(`DROP TABLE \`order_station_item\``);
        await queryRunner.query(`DROP TABLE \`order_item\``);
    }

}
