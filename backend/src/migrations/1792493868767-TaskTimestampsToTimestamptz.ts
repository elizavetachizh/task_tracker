import { MigrationInterface, QueryRunner } from 'typeorm';

export class TaskTimestampsToTimestamptz1792493868767 implements MigrationInterface {
  name = 'TaskTimestampsToTimestamptz1792493868767';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Rows were stored as UTC wall-clock in "timestamp without time zone"
    // (Postgres in Docker). Interpret that clock as UTC while widening.
    await queryRunner.query(`SET TIME ZONE 'UTC'`);
    await queryRunner.query(
      `ALTER TABLE "tasks" ALTER COLUMN "createdAt" TYPE TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "tasks" ALTER COLUMN "updatedAt" TYPE TIMESTAMP WITH TIME ZONE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`SET TIME ZONE 'UTC'`);
    await queryRunner.query(
      `ALTER TABLE "tasks" ALTER COLUMN "createdAt" TYPE TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "tasks" ALTER COLUMN "updatedAt" TYPE TIMESTAMP`,
    );
  }
}
