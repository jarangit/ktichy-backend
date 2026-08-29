import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStorePinHash1786000000001 implements MigrationInterface {
  name = 'AddStorePinHash1786000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`store\`
      ADD COLUMN \`pin_hash\` varchar(255) NULL AFTER \`settings\`
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`store\`
      DROP COLUMN \`pin_hash\`
    `);
  }
}
