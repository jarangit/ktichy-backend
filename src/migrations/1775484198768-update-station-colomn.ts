import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateStationColomn1775484198768 implements MigrationInterface {
    name = 'UpdateStationColomn1775484198768'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`station\` DROP FOREIGN KEY \`FK_ee1fa8b17a5e13a6c4584b4ef73\``);
        await queryRunner.query(`ALTER TABLE \`station\` CHANGE \`device_id\` \`deviceId\` varchar(10) NULL`);
        await queryRunner.query(`ALTER TABLE \`station\` ADD CONSTRAINT \`FK_46136532261b1c39f6c483d4344\` FOREIGN KEY (\`deviceId\`) REFERENCES \`device\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`station\` DROP FOREIGN KEY \`FK_46136532261b1c39f6c483d4344\``);
        await queryRunner.query(`ALTER TABLE \`station\` CHANGE \`deviceId\` \`device_id\` varchar(10) NULL`);
        await queryRunner.query(`ALTER TABLE \`station\` ADD CONSTRAINT \`FK_ee1fa8b17a5e13a6c4584b4ef73\` FOREIGN KEY (\`device_id\`) REFERENCES \`device\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

}
