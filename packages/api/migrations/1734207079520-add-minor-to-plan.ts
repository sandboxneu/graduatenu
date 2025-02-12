import { MigrationInterface, QueryRunner } from "typeorm";

export class addMinorToPlan1734207079520 implements MigrationInterface {
  name = "addMinorToPlan1734207079520";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "plan" RENAME COLUMN "notes" TO "minor"`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "plan" RENAME COLUMN "minor" TO "notes"`
    );
  }
}
