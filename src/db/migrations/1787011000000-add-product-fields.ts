import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProductFields1787011000000 implements MigrationInterface {
  name = 'AddProductFields1787011000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`product\` ADD \`price\` decimal(10,2) NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE \`product\` ADD \`cost\` decimal(10,2) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`product\` ADD \`isBestSeller\` tinyint NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE \`product\` ADD \`imageUrl\` longtext NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`product\` DROP COLUMN \`imageUrl\``);
    await queryRunner.query(
      `ALTER TABLE \`product\` DROP COLUMN \`isBestSeller\``,
    );
    await queryRunner.query(`ALTER TABLE \`product\` DROP COLUMN \`cost\``);
    await queryRunner.query(`ALTER TABLE \`product\` DROP COLUMN \`price\``);
  }
}
