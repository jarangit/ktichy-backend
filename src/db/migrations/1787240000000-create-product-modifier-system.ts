import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProductModifierSystem1787240000000
  implements MigrationInterface
{
  name = 'CreateProductModifierSystem1787240000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`modifier_group\` (
        \`id\` varchar(10) NOT NULL,
        \`storeId\` varchar(10) NOT NULL,
        \`name\` varchar(255) NOT NULL,
        \`selectionType\` enum('SINGLE','MULTIPLE') NOT NULL DEFAULT 'SINGLE',
        \`minSelect\` int NOT NULL DEFAULT '1',
        \`maxSelect\` int NOT NULL DEFAULT '1',
        \`isActive\` tinyint NOT NULL DEFAULT '1',
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        KEY \`FK_modifier_group_store\` (\`storeId\`),
        CONSTRAINT \`FK_modifier_group_store\` FOREIGN KEY (\`storeId\`) REFERENCES \`store\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
    `);

    await queryRunner.query(`
      CREATE TABLE \`modifier_option\` (
        \`id\` varchar(10) NOT NULL,
        \`modifierGroupId\` varchar(10) NOT NULL,
        \`name\` varchar(255) NOT NULL,
        \`priceAdjustment\` decimal(10,2) NOT NULL DEFAULT '0.00',
        \`sortOrder\` int NOT NULL DEFAULT '0',
        \`isAvailable\` tinyint NOT NULL DEFAULT '1',
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        KEY \`FK_modifier_option_group\` (\`modifierGroupId\`),
        CONSTRAINT \`FK_modifier_option_group\` FOREIGN KEY (\`modifierGroupId\`) REFERENCES \`modifier_group\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
    `);

    await queryRunner.query(`
      CREATE TABLE \`product_modifier_group\` (
        \`id\` varchar(10) NOT NULL,
        \`productId\` varchar(10) NOT NULL,
        \`modifierGroupId\` varchar(10) NOT NULL,
        \`sortOrder\` int NOT NULL DEFAULT '0',
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`UQ_product_modifier_group\` (\`productId\`, \`modifierGroupId\`),
        KEY \`FK_pmg_product\` (\`productId\`),
        KEY \`FK_pmg_group\` (\`modifierGroupId\`),
        CONSTRAINT \`FK_pmg_product\` FOREIGN KEY (\`productId\`) REFERENCES \`product\` (\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`FK_pmg_group\` FOREIGN KEY (\`modifierGroupId\`) REFERENCES \`modifier_group\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS \`product_modifier_group\``);
    await queryRunner.query(`DROP TABLE IF EXISTS \`modifier_option\``);
    await queryRunner.query(`DROP TABLE IF EXISTS \`modifier_group\``);
  }
}
