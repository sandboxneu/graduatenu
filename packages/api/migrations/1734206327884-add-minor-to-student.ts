import { MigrationInterface, QueryRunner } from "typeorm";

export class addMinorToStudent1734206327884 implements MigrationInterface {
  name = "addMinorToStudent1734206327884";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "student" ADD "minor" character varying`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "student" DROP COLUMN "minor"`);
  }
}
