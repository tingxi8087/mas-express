import 'module-alias/register';
import { Kysely, MysqlDialect } from 'kysely';
import { createPool } from 'mysql2';
import c from 'ansi-colors';
import type { DB } from 'kysely-codegen';
import { RequireWherePlugin } from './plugins/require-where.plugin';
import { installSelectQueryBuilderExtensions } from './plugins/select-query-builder.extensions';
import { SoftDeleteSelectPlugin } from './plugins/soft-delete-select.plugin';
import { betaConfig } from '@/config';

/**
 * 创建数据库连接池
 */
const pool = createPool(betaConfig.mysql);
export const db = new Kysely<DB>({
  dialect: new MysqlDialect({
    pool,
  }),
  // 软删除，更新和删除条件保护
  plugins: [new RequireWherePlugin(), new SoftDeleteSelectPlugin()],
  log(event) {
    console.log(c.bgGreen(event.query.sql?.trim() ?? ''), c.gray('log'));
    console.log(event.query.parameters);
    console.log(c.gray('log'));
  },
});
// 扩展kysely
installSelectQueryBuilderExtensions(db);
