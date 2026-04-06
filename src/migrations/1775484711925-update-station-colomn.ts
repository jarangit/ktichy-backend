import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateStationColomn1775484711925 implements MigrationInterface {
    name = 'UpdateStationColomn1775484711925'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`station\` DROP FOREIGN KEY \`FK_ee1fa8b17a5e13a6c4584b4ef73\``);
        await queryRunner.query(`ALTER TABLE \`station\` CHANGE \`device_id\` \`devicesId\` varchar(10) NULL`);
        await queryRunner.query(`ALTER TABLE \`station\` ADD CONSTRAINT \`FK_da5d67ffa82f7d584df25398330\` FOREIGN KEY (\`devicesId\`) REFERENCES \`device\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`station\` DROP FOREIGN KEY \`FK_da5d67ffa82f7d584df25398330\``);
        await queryRunner.query(`ALTER TABLE \`station\` CHANGE \`devicesId\` \`device_id\` varchar(10) NULL`);
        await queryRunner.query(`ALTER TABLE \`station\` ADD CONSTRAINT \`FK_ee1fa8b17a5e13a6c4584b4ef73\` FOREIGN KEY (\`device_id\`) REFERENCES \`device\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

}
