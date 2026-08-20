import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterUserPasswordHashNullable1787000000000
  implements MigrationInterface
{
  name = 'AlterUserPasswordHashNullable1787000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`user\` CHANGE \`passwordHash\` \`passwordHash\` varchar(255) NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`user\` CHANGE \`passwordHash\` \`passwordHash\` varchar(255) NOT NULL`,
    );
  }
}
