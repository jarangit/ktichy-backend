import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOrderFields1787200000000 implements MigrationInterface {
  name = 'AddOrderFields1787200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`order\` MODIFY \`status\` enum('NEW','PREPARING','READY','COMPLETED','CANCELLED') NOT NULL DEFAULT 'NEW'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`order\` ADD \`orderType\` enum('DINE_IN','TOGO','DELIVERY') NOT NULL DEFAULT 'DINE_IN'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`order\` ADD \`tableNumber\` varchar(50) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`order\` ADD \`customerName\` varchar(255) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`order\` ADD \`deliveryPlatform\` varchar(100) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`order\` ADD \`deliveryOrderNumber\` varchar(100) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`order\` ADD \`isWaitingInStore\` tinyint NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE \`order_item\` ADD \`name\` varchar(255) NOT NULL DEFAULT ''`,
    );
    await queryRunner.query(
      `ALTER TABLE \`order_item\` ADD \`price\` decimal(10,2) NOT NULL DEFAULT 0`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`order_item\` DROP COLUMN \`price\``);
    await queryRunner.query(`ALTER TABLE \`order_item\` DROP COLUMN \`name\``);
    await queryRunner.query(
      `ALTER TABLE \`order\` DROP COLUMN \`isWaitingInStore\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`order\` DROP COLUMN \`deliveryOrderNumber\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`order\` DROP COLUMN \`deliveryPlatform\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`order\` DROP COLUMN \`customerName\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`order\` DROP COLUMN \`tableNumber\``,
    );
    await queryRunner.query(`ALTER TABLE \`order\` DROP COLUMN \`orderType\``);
    await queryRunner.query(
      `ALTER TABLE \`order\` MODIFY \`status\` enum('NEW','PREPARING','READY') NOT NULL DEFAULT 'NEW'`,
    );
  }
}
