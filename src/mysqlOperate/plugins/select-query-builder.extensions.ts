import { sql, type Kysely } from 'kysely';

declare module 'kysely' {
  interface SelectQueryBuilder<DB, TB extends keyof DB, O> {
    /**
     * 分页（page 从 1 开始），等价于 `limit(pageSize).offset((page - 1) * pageSize)`。
     *
     * @param page - 页码，从 1 开始
     * @param pageSize - 每页大小（会自动向下取整，且最小为 1）
     */
    paging(page: number, pageSize: number): SelectQueryBuilder<DB, TB, O>;

    /**
     * 获取当前查询的总数（`count(*)`）。
     *
     * 实现方式：将当前查询作为子查询，再对外层执行 `count(*)`。
     * 这样不会受当前查询的 select 列表影响（即使你前面 `.selectAll()` 了也可以正确计数）。
     *
     * 注意：如果你在当前查询上使用了 `limit/offset`，那么 count 也会受影响（因为它们属于子查询的一部分）。
     */
    total(this: SelectQueryBuilder<DB, TB, O>): Promise<number>;
  }
}

/**
 * 安装 SelectQueryBuilder 的扩展方法（`.paging()` / `.total()`）。
 *
 * @param db - Kysely 实例（用于拿到 SelectQueryBuilder 的原型，以及构造外层 count 查询）
 */
export function installSelectQueryBuilderExtensions(db: Kysely<any>): void {
  // 取一个 SelectQueryBuilder 实例用来定位其 prototype（不会执行任何 SQL）
  const sample = db.selectFrom('__kysely_ext__' as any).selectAll();
  const proto = Object.getPrototypeOf(sample) as any;

  if (typeof proto?.paging !== 'function') {
    proto.paging = function paging(this: any, page: number, pageSize: number) {
      const safePageSize = Math.max(1, Math.floor(pageSize));
      const safePage = Math.max(1, Math.floor(page));
      const offset = (safePage - 1) * safePageSize;
      return this.limit(safePageSize).offset(offset);
    };
  }

  if (typeof proto?.total !== 'function') {
    proto.total = async function total(this: any): Promise<number> {
      const subQuery = this.select(sql`1`.as('__kysely_total_one__')).as(
        '__kysely_total_sub__'
      );
      const row = await db
        .selectFrom(subQuery)
        .select(sql<number>`count(*)`.as('total'))
        .executeTakeFirst();
      return Number(row?.total ?? 0);
    };
  }
}
