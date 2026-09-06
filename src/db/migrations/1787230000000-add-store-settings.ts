import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStoreSettings1787230000000 implements MigrationInterface {
  name = 'AddStoreSettings1787230000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`store\` ADD \`order_limit\` int NOT NULL DEFAULT '20'`,
    );
    await queryRunner.query(`ALTER TABLE \`store\` ADD \`settings\` json NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`store\` DROP COLUMN \`settings\``);
    await queryRunner.query(
      `ALTER TABLE \`store\` DROP COLUMN \`order_limit\``,
    );
  }
}
