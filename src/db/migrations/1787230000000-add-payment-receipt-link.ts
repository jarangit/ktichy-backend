import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPaymentReceiptLink1787230000000 implements MigrationInterface {
  name = 'AddPaymentReceiptLink1787230000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`payment\` ADD \`receiptToken\` varchar(80) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`payment\` ADD \`receiptExpiresAt\` datetime NULL`,
    );
    await queryRunner.query(
      `UPDATE \`payment\` SET \`receiptToken\` = CONCAT('legacy_', \`id\`), \`receiptExpiresAt\` = DATE_ADD(COALESCE(\`createdAt\`, NOW()), INTERVAL 7 DAY) WHERE \`receiptToken\` IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`payment\` MODIFY \`receiptToken\` varchar(80) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`payment\` MODIFY \`receiptExpiresAt\` datetime NOT NULL`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX \`IDX_payment_receiptToken\` ON \`payment\` (\`receiptToken\`)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX \`IDX_payment_receiptToken\` ON \`payment\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`payment\` DROP COLUMN \`receiptExpiresAt\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`payment\` DROP COLUMN \`receiptToken\``,
    );
  }
}
