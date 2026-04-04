import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixDeviceSchema1775242000000 implements MigrationInterface {
  name = 'FixDeviceSchema1775242000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (!(await this.tableExists(queryRunner, 'device'))) return;

    // Normalize legacy store column naming.
    await this.renameColumnIfNeeded(
      queryRunner,
      'device',
      'storeId',
      'store_id',
    );
    await this.renameColumnIfNeeded(
      queryRunner,
      'device',
      'restaurantId',
      'store_id',
    );

    // Add missing columns required by current entity model.
    await this.addColumnIfMissing(
      queryRunner,
      'device',
      'device_id',
      '`device_id` varchar(64) NULL',
    );
    await this.addColumnIfMissing(
      queryRunner,
      'device',
      'station_id',
      '`station_id` varchar(10) NULL',
    );
    await this.addColumnIfMissing(
      queryRunner,
      'device',
      'alias',
      '`alias` varchar(255) NULL',
    );
    await this.addColumnIfMissing(
      queryRunner,
      'device',
      'app_version',
      '`app_version` varchar(255) NULL',
    );
    await this.addColumnIfMissing(
      queryRunner,
      'device',
      'status',
      "`status` enum ('UNPAIRED','PENDING','PAIRED','DISABLED') NULL",
    );
    await this.addColumnIfMissing(
      queryRunner,
      'device',
      'last_seen_at',
      '`last_seen_at` datetime NULL',
    );
    await this.addColumnIfMissing(
      queryRunner,
      'device',
      'created_at',
      '`created_at` datetime(6) NULL',
    );
    await this.addColumnIfMissing(
      queryRunner,
      'device',
      'updated_at',
      '`updated_at` datetime(6) NULL',
    );

    // Backfill and enforce expected values.
    await queryRunner.query(
      'UPDATE `device` SET `device_id` = `id` WHERE `device_id` IS NULL OR `device_id` = ""',
    );
    await queryRunner.query(
      "UPDATE `device` SET `status` = CASE WHEN `store_id` IS NULL THEN 'UNPAIRED' ELSE 'PAIRED' END WHERE `status` IS NULL",
    );
    await queryRunner.query(
      'UPDATE `device` SET `created_at` = NOW(6) WHERE `created_at` IS NULL',
    );
    await queryRunner.query(
      'UPDATE `device` SET `updated_at` = NOW(6) WHERE `updated_at` IS NULL',
    );

    // Align nullability with entity (legacy table had NOT NULL for these).
    if (await this.columnExists(queryRunner, 'device', 'deviceName')) {
      await queryRunner.query(
        'ALTER TABLE `device` MODIFY `deviceName` varchar(255) NULL',
      );
    }
    if (await this.columnExists(queryRunner, 'device', 'fingerprint')) {
      await queryRunner.query(
        'ALTER TABLE `device` MODIFY `fingerprint` varchar(255) NULL',
      );
    }

    // Enforce final column definitions.
    await queryRunner.query(
      'ALTER TABLE `device` MODIFY `device_id` varchar(64) NOT NULL',
    );
    await queryRunner.query(
      "ALTER TABLE `device` MODIFY `status` enum ('UNPAIRED','PENDING','PAIRED','DISABLED') NOT NULL DEFAULT 'UNPAIRED'",
    );
    await queryRunner.query(
      'ALTER TABLE `device` MODIFY `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)',
    );
    await queryRunner.query(
      'ALTER TABLE `device` MODIFY `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)',
    );

    await this.ensureUniqueIndex(queryRunner, 'device', 'UQ_device_device_id', [
      'device_id',
    ]);

    // Keep a single FK for store_id -> store(id)
    await this.dropForeignKeysForColumn(queryRunner, 'device', 'store_id');
    if (await this.columnExists(queryRunner, 'device', 'store_id')) {
      await queryRunner.query(
        'ALTER TABLE `device` ADD CONSTRAINT `FK_device_store_id` FOREIGN KEY (`store_id`) REFERENCES `store`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION',
      );
    }

    // station_id -> station(id) on delete set null
    await this.dropForeignKeysForColumn(queryRunner, 'device', 'station_id');
    if (await this.columnExists(queryRunner, 'device', 'station_id')) {
      await queryRunner.query(
        'ALTER TABLE `device` ADD CONSTRAINT `FK_device_station_id` FOREIGN KEY (`station_id`) REFERENCES `station`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION',
      );
    }
  }

  public async down(): Promise<void> {
    // Non-destructive forward-fix migration: no automatic down.
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

  private async addColumnIfMissing(
    queryRunner: QueryRunner,
    tableName: string,
    columnName: string,
    columnDefinition: string,
  ): Promise<void> {
    if (await this.columnExists(queryRunner, tableName, columnName)) return;
    await queryRunner.query(
      `ALTER TABLE \`${tableName}\` ADD ${columnDefinition}`,
    );
  }

  private async renameColumnIfNeeded(
    queryRunner: QueryRunner,
    tableName: string,
    fromColumn: string,
    toColumn: string,
  ): Promise<void> {
    const hasFrom = await this.columnExists(queryRunner, tableName, fromColumn);
    const hasTo = await this.columnExists(queryRunner, tableName, toColumn);
    if (!hasFrom || hasTo) return;

    await this.dropForeignKeysForColumn(queryRunner, tableName, fromColumn);
    await queryRunner.query(
      `ALTER TABLE \`${tableName}\` RENAME COLUMN \`${fromColumn}\` TO \`${toColumn}\``,
    );
  }

  private async ensureUniqueIndex(
    queryRunner: QueryRunner,
    tableName: string,
    indexName: string,
    columns: string[],
  ): Promise<void> {
    const rows = await queryRunner.query(
      `
      SELECT 1
      FROM information_schema.statistics
      WHERE table_schema = DATABASE()
        AND table_name = ?
        AND index_name = ?
      LIMIT 1
      `,
      [tableName, indexName],
    );
    if (rows.length > 0) return;

    const columnSql = columns.map((c) => `\`${c}\``).join(', ');
    await queryRunner.query(
      `CREATE UNIQUE INDEX \`${indexName}\` ON \`${tableName}\` (${columnSql})`,
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
}
