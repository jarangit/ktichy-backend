import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOrderItemModifier1787250000000
  implements MigrationInterface
{
  name = 'CreateOrderItemModifier1787250000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`order_item_modifier\` (
        \`id\` varchar(10) NOT NULL,
        \`orderItemId\` varchar(10) NOT NULL,
        \`modifierGroupId\` varchar(10) NOT NULL,
        \`modifierGroupName\` varchar(255) NOT NULL,
        \`modifierOptionId\` varchar(10) NOT NULL,
        \`modifierOptionName\` varchar(255) NOT NULL,
        \`priceAdjustment\` decimal(10,2) NOT NULL DEFAULT '0.00',
        PRIMARY KEY (\`id\`),
        KEY \`FK_order_item_modifier_item\` (\`orderItemId\`),
        CONSTRAINT \`FK_order_item_modifier_item\` FOREIGN KEY (\`orderItemId\`) REFERENCES \`order_item\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS \`order_item_modifier\``);
  }
}
