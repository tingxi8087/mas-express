import { sql } from 'kysely';
import { db } from '..';

// 查询示例
export const exampleQuery = async (name: string) => {
  const res = await sql<any>`SELECT * FROM users WHERE name = ${name}`.execute(
    db
  );
  return res;
};
