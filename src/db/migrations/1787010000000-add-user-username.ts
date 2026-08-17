import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserUsername1787010000000 implements MigrationInterface {
  name = 'AddUserUsername1787010000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`user\` ADD \`username\` varchar(30) NULL`,
    );
    await queryRunner.query(
      `UPDATE \`user\` SET \`username\` = CONCAT('u_', \`id\`) WHERE \`username\` IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user\` MODIFY \`username\` varchar(30) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user\` ADD UNIQUE INDEX \`IDX_user_username\` (\`username\`)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`user\` DROP INDEX \`IDX_user_username\``,
    );
    await queryRunner.query(`ALTER TABLE \`user\` DROP COLUMN \`username\``);
  }
}
