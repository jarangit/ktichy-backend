import { MigrationInterface, QueryRunner } from 'typeorm';

export class ResetStoreSchemaAndPurgeData1772968346000
  implements MigrationInterface
{
  name = 'ResetStoreSchemaAndPurgeData1772968346000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const currentDatabase = await queryRunner.query(
      'SELECT DATABASE() AS dbName',
    );

    const dbName = currentDatabase?.[0]?.dbName;
    if (!dbName) {
      throw new Error('Cannot determine current database name');
    }

    const tables = await queryRunner.query(
      `SELECT TABLE_NAME AS tableName FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ?`,
      [dbName],
    );

    const keepTables = new Set(['migrations']);

    await queryRunner.query('SET FOREIGN_KEY_CHECKS = 0');

    for (const row of tables) {
      const tableName = row?.tableName as string | undefined;
      if (!tableName || keepTables.has(tableName)) {
        continue;
      }

      await queryRunner.query(`DROP TABLE IF EXISTS \`${tableName}\``);
    }

    await queryRunner.query('SET FOREIGN_KEY_CHECKS = 1');
  }

  public async down(): Promise<void> {
    // Irreversible migration by design: this reset intentionally drops all app tables.
  }
}
