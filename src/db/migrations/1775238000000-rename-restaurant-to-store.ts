import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameRestaurantToStore1775238000000
  implements MigrationInterface
{
  name = 'RenameRestaurantToStore1775238000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasRestaurant = await this.tableExists(queryRunner, 'restaurant');
    const hasStore = await this.tableExists(queryRunner, 'store');

    if (hasRestaurant && !hasStore) {
      await queryRunner.query('RENAME TABLE `restaurant` TO `store`');
    }

    if (hasRestaurant && hasStore) {
      await queryRunner.query(`
        INSERT INTO \`store\` (\`id\`, \`name\`, \`owner_id\`, \`createdAt\`, \`updatedAt\`)
        SELECT r.\`id\`, r.\`name\`, r.\`owner_id\`, r.\`createdAt\`, r.\`updatedAt\`
        FROM \`restaurant\` r
        LEFT JOIN \`store\` s ON s.\`id\` = r.\`id\`
        WHERE s.\`id\` IS NULL
      `);
    }

    await this.renameFkColumn(queryRunner, 'station', 'restaurantId', 'storeId');
    await this.renameFkColumn(queryRunner, 'menu', 'restaurantId', 'storeId');
    await this.renameFkColumn(queryRunner, 'product', 'restaurantId', 'storeId');
    await this.renameFkColumn(queryRunner, 'order', 'restaurantId', 'storeId');
    await this.renameFkColumn(queryRunner, 'device', 'restaurantId', 'store_id');
    await this.renameFkColumn(queryRunner, 'device', 'storeId', 'store_id');

    await this.ensureFkToStore(queryRunner, 'station', 'storeId', 'FK_station_store_id');
    await this.ensureFkToStore(queryRunner, 'menu', 'storeId', 'FK_menu_store_id');
    await this.ensureFkToStore(queryRunner, 'product', 'storeId', 'FK_product_store_id');
    await this.ensureFkToStore(queryRunner, 'order', 'storeId', 'FK_order_store_id');
    await this.ensureFkToStore(queryRunner, 'device', 'store_id', 'FK_device_store_id');

    if (await this.tableExists(queryRunner, 'restaurant')) {
      await this.dropIncomingRefsToRestaurant(queryRunner);
      await queryRunner.query('DROP TABLE `restaurant`');
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Intentionally left blank:
    // this migration consolidates old schemas and is not safe to auto-revert.
  }

  private async tableExists(
    queryRunner: QueryRunner,
    tableName: string,
  ): Promise<boolean> {
    const rows = await queryRunner.query(
      `
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = DATABASE() AND table_name = ?
      LIMIT 1
      `,
      [tableName],
    );
    return rows.length > 0;
  }

  private async columnExists(
    queryRunner: QueryRunner,
    tableName: string,
    columnName: string,
  ): Promise<boolean> {
    const rows = await queryRunner.query(
      `
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?
      LIMIT 1
      `,
      [tableName, columnName],
    );
    return rows.length > 0;
  }

  private async renameFkColumn(
    queryRunner: QueryRunner,
    tableName: string,
    fromColumn: string,
    toColumn: string,
  ): Promise<void> {
    const hasTable = await this.tableExists(queryRunner, tableName);
    if (!hasTable) return;

    const hasFrom = await this.columnExists(queryRunner, tableName, fromColumn);
    const hasTo = await this.columnExists(queryRunner, tableName, toColumn);
    if (!hasFrom || hasTo) return;

    await this.dropForeignKeysForColumn(queryRunner, tableName, fromColumn);
    await queryRunner.query(
      `ALTER TABLE \`${tableName}\` RENAME COLUMN \`${fromColumn}\` TO \`${toColumn}\``,
    );
  }

  private async dropForeignKeysForColumn(
    queryRunner: QueryRunner,
    tableName: string,
    columnName: string,
  ): Promise<void> {
    const rows = await queryRunner.query(
      `
      SELECT kcu.CONSTRAINT_NAME AS constraintName
      FROM information_schema.KEY_COLUMN_USAGE kcu
      JOIN information_schema.TABLE_CONSTRAINTS tc
        ON tc.CONSTRAINT_SCHEMA = kcu.CONSTRAINT_SCHEMA
       AND tc.TABLE_NAME = kcu.TABLE_NAME
       AND tc.CONSTRAINT_NAME = kcu.CONSTRAINT_NAME
      WHERE kcu.TABLE_SCHEMA = DATABASE()
        AND kcu.TABLE_NAME = ?
        AND kcu.COLUMN_NAME = ?
        AND tc.CONSTRAINT_TYPE = 'FOREIGN KEY'
      `,
      [tableName, columnName],
    );

    for (const row of rows) {
      await queryRunner.query(
        `ALTER TABLE \`${tableName}\` DROP FOREIGN KEY \`${row.constraintName}\``,
      );
    }
  }

  private async ensureFkToStore(
    queryRunner: QueryRunner,
    tableName: string,
    columnName: string,
    fkName: string,
  ): Promise<void> {
    if (!(await this.tableExists(queryRunner, tableName))) return;
    if (!(await this.columnExists(queryRunner, tableName, columnName))) return;
    if (!(await this.tableExists(queryRunner, 'store'))) return;

    const existing = await queryRunner.query(
      `
      SELECT 1
      FROM information_schema.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = ?
        AND COLUMN_NAME = ?
        AND REFERENCED_TABLE_NAME = 'store'
      LIMIT 1
      `,
      [tableName, columnName],
    );
    if (existing.length > 0) return;

    await this.dropForeignKeysForColumn(queryRunner, tableName, columnName);
    await queryRunner.query(
      `ALTER TABLE \`${tableName}\` ADD CONSTRAINT \`${fkName}\` FOREIGN KEY (\`${columnName}\`) REFERENCES \`store\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  private async dropIncomingRefsToRestaurant(
    queryRunner: QueryRunner,
  ): Promise<void> {
    const rows = await queryRunner.query(`
      SELECT TABLE_NAME AS tableName, CONSTRAINT_NAME AS constraintName
      FROM information_schema.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = DATABASE()
        AND REFERENCED_TABLE_NAME = 'restaurant'
    `);

    for (const row of rows) {
      await queryRunner.query(
        `ALTER TABLE \`${row.tableName}\` DROP FOREIGN KEY \`${row.constraintName}\``,
      );
    }
  }
}
