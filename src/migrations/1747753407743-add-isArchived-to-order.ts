import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIsArchivedToOrder1747753407743 implements MigrationInterface {
  name = 'AddIsArchivedToOrder1747753407743';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`order\` ADD \`isArchived\` tinyint NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE \`order\` ADD \`archivedAt\` timestamp NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`order\` ADD \`waitingOrderNumber\` varchar(255) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`order\` ADD \`isWaitingInStore\` tinyint NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE \`order\` CHANGE \`status\` \`status\` enum ('PENDING', 'COMPLETED') NOT NULL DEFAULT 'PENDING'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`order\` CHANGE \`status\` \`status\` enum ('PENDING', 'PREPARING', 'READY') NOT NULL DEFAULT 'PENDING'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`order\` DROP COLUMN \`isWaitingInStore\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`order\` DROP COLUMN \`waitingOrderNumber\``,
    );
    await queryRunner.query(`ALTER TABLE \`order\` DROP COLUMN \`archivedAt\``);
    await queryRunner.query(`ALTER TABLE \`order\` DROP COLUMN \`isArchived\``);
  }
}
