import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateDeviceIdType1762016110675 implements MigrationInterface {
    name = 'UpdateDeviceIdType1762016110675'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`menu\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(255) NOT NULL, \`isActive\` tinyint NOT NULL DEFAULT 1, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`restaurantId\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`device\` ADD \`restaurantId\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`menu\` ADD CONSTRAINT \`FK_085156de3c3a44eba017a6a0846\` FOREIGN KEY (\`restaurantId\`) REFERENCES \`restaurant\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`device\` ADD CONSTRAINT \`FK_e12179fca52f55e6d2034d8e81d\` FOREIGN KEY (\`restaurantId\`) REFERENCES \`restaurant\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`device\` DROP FOREIGN KEY \`FK_e12179fca52f55e6d2034d8e81d\``);
        await queryRunner.query(`ALTER TABLE \`menu\` DROP FOREIGN KEY \`FK_085156de3c3a44eba017a6a0846\``);
        await queryRunner.query(`ALTER TABLE \`device\` DROP COLUMN \`restaurantId\``);
        await queryRunner.query(`DROP TABLE \`menu\``);
    }

}
