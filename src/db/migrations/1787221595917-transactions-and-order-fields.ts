import { MigrationInterface, QueryRunner } from 'typeorm';

export class TransactionsAndOrderFields1787221595917
  implements MigrationInterface
{
  name = 'TransactionsAndOrderFields1787221595917';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`transaction\` (\`id\` varchar(10) NOT NULL, \`orderId\` varchar(10) NOT NULL, \`storeId\` varchar(10) NOT NULL, \`method\` enum ('CASH', 'QR', 'DELIVERY_PLATFORM') NOT NULL, \`amount\` decimal(10,2) NOT NULL, \`receivedAmount\` decimal(10,2) NULL, \`change\` decimal(10,2) NULL, \`receiptId\` varchar(255) NOT NULL, \`orderNumber\` varchar(255) NOT NULL, \`orderType\` varchar(255) NULL, \`tableNumber\` varchar(255) NULL, \`customerName\` varchar(255) NULL, \`deliveryPlatform\` varchar(255) NULL, \`deliveryOrderNumber\` varchar(255) NULL, \`items\` json NULL, \`status\` enum ('PAID', 'REFUNDED', 'CANCELLED') NOT NULL DEFAULT 'PAID', \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_36607669bcd9352b3317a315a6\` (\`receiptId\`), UNIQUE INDEX \`REL_a6e45c89cfbe8d92840266fd30\` (\`orderId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`product\` ADD \`price\` decimal(10,2) NOT NULL DEFAULT '0.00'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`product\` ADD \`cost\` decimal(10,2) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`order\` ADD \`orderType\` enum ('DINE_IN', 'TOGO', 'DELIVERY') NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`order\` ADD \`tableNumber\` varchar(255) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`order\` ADD \`customerName\` varchar(255) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`order\` ADD \`deliveryPlatform\` varchar(255) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`order\` ADD \`deliveryOrderNumber\` varchar(255) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`order\` ADD \`isWaitingInStore\` tinyint NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE \`order_item\` ADD \`name\` varchar(255) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`order_item\` ADD \`price\` decimal(10,2) NOT NULL DEFAULT '0.00'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`order\` CHANGE \`status\` \`status\` enum ('NEW', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'NEW'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`order_item\` CHANGE \`status\` \`status\` enum ('NEW', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'NEW'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`transaction\` ADD CONSTRAINT \`FK_a6e45c89cfbe8d92840266fd30f\` FOREIGN KEY (\`orderId\`) REFERENCES \`order\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`transaction\` ADD CONSTRAINT \`FK_37096c1d619bbd8865042bede28\` FOREIGN KEY (\`storeId\`) REFERENCES \`store\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`transaction\` DROP FOREIGN KEY \`FK_37096c1d619bbd8865042bede28\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`transaction\` DROP FOREIGN KEY \`FK_a6e45c89cfbe8d92840266fd30f\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`order_item\` CHANGE \`status\` \`status\` enum ('NEW', 'PREPARING', 'READY') NOT NULL DEFAULT 'NEW'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`order\` CHANGE \`status\` \`status\` enum ('NEW', 'PREPARING', 'READY') NOT NULL DEFAULT 'NEW'`,
    );
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
    await queryRunner.query(`ALTER TABLE \`product\` DROP COLUMN \`cost\``);
    await queryRunner.query(`ALTER TABLE \`product\` DROP COLUMN \`price\``);
    await queryRunner.query(
      `DROP INDEX \`REL_a6e45c89cfbe8d92840266fd30\` ON \`transaction\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_36607669bcd9352b3317a315a6\` ON \`transaction\``,
    );
    await queryRunner.query(`DROP TABLE \`transaction\``);
  }
}
