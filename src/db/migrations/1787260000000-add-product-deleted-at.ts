import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProductDeletedAt1787260000000 implements MigrationInterface {
  name = 'AddProductDeletedAt1787260000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`product\`
      ADD COLUMN \`deletedAt\` datetime(6) NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`product\`
      DROP COLUMN \`deletedAt\`
    `);
  }
}
