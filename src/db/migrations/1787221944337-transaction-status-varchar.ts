import { MigrationInterface, QueryRunner } from "typeorm";

export class TransactionStatusVarchar1787221944337 implements MigrationInterface {
    name = 'TransactionStatusVarchar1787221944337'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`transaction\` DROP COLUMN \`status\``);
        await queryRunner.query(`ALTER TABLE \`transaction\` ADD \`status\` varchar(30) NOT NULL DEFAULT 'NEW'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`transaction\` DROP COLUMN \`status\``);
        await queryRunner.query(`ALTER TABLE \`transaction\` ADD \`status\` enum ('PAID', 'REFUNDED', 'CANCELLED') NOT NULL DEFAULT 'PAID'`);
    }

}
