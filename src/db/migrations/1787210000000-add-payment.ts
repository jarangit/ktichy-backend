import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPayment1787210000000 implements MigrationInterface {
  name = 'AddPayment1787210000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`payment\` (
        \`id\` varchar(10) NOT NULL,
        \`orderId\` varchar(10) NOT NULL,
        \`storeId\` varchar(10) NOT NULL,
        \`method\` enum('CASH','QR','DELIVERY_PLATFORM') NOT NULL,
        \`amount\` decimal(10,2) NOT NULL DEFAULT '0.00',
        \`receivedAmount\` decimal(10,2) NULL,
        \`change\` decimal(10,2) NULL,
        \`receiptId\` varchar(100) NOT NULL,
        \`status\` enum('PAID','REFUNDED') NOT NULL DEFAULT 'PAID',
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        KEY \`FK_payment_order\` (\`orderId\`),
        KEY \`FK_payment_store\` (\`storeId\`),
        CONSTRAINT \`FK_payment_order\` FOREIGN KEY (\`orderId\`) REFERENCES \`order\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT \`FK_payment_store\` FOREIGN KEY (\`storeId\`) REFERENCES \`store\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION
      ) ENGINE=InnoDB`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE \`payment\``);
  }
}
