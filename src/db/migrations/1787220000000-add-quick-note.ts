import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddQuickNote1787220000000 implements MigrationInterface {
  name = 'AddQuickNote1787220000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`quick_note\` (
        \`id\` varchar(10) NOT NULL,
        \`storeId\` varchar(10) NOT NULL,
        \`text\` varchar(60) NOT NULL,
        \`sortOrder\` int NOT NULL DEFAULT '0',
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        KEY \`FK_quick_note_store\` (\`storeId\`),
        CONSTRAINT \`FK_quick_note_store\` FOREIGN KEY (\`storeId\`) REFERENCES \`store\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION
      ) ENGINE=InnoDB`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE \`quick_note\``);
  }
}
