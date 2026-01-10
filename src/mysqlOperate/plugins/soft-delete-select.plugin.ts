import type {
  PluginTransformQueryArgs,
  PluginTransformResultArgs,
  RootOperationNode,
} from 'kysely';

/**
 * 软删除插件
 * 自动在所有查询中添加 `is_delete = 0` 条件。
 *
 * 注意：包含 JOIN 的查询会为 FROM 和 JOIN 的所有表都追加 `${table}.is_delete = 0`，
 * 避免字段名歧义，也符合“所有相关表都必须是未删除”的预期。
 */
export class SoftDeleteSelectPlugin {
  /**
   * 转换查询，自动添加软删除条件
   * @param args - 包含查询节点的参数对象
   * @returns 修改后的查询节点
   */
  transformQuery(args: PluginTransformQueryArgs): RootOperationNode {
    const { node } = args;

    // 只对 SELECT、UPDATE、DELETE 查询添加软删除条件
    if (
      node.kind !== 'SelectQueryNode' &&
      node.kind !== 'UpdateQueryNode' &&
      node.kind !== 'DeleteQueryNode'
    ) {
      return node;
    }

    return this.transformOperationNode(node) as RootOperationNode;
  }

  /**
   * 递归转换查询节点：
   * - 主查询：追加软删条件
   * - **CTE 定义**：递归进入 CTE 的 expression 并追加软删条件
   * - **JOIN 子查询 / 派生表**：递归进入子查询并追加软删条件
   *
   * 这样能保证“CTE + 子查询 JOIN”场景下，最终 SQL 里底层真实表都带上 `is_delete = 0`。
   */
  private transformOperationNode(node: any): any {
    if (!node) return node;

    if (node.kind === 'SelectQueryNode') {
      return this.transformSelectQueryNode(node);
    }

    if (node.kind === 'UpdateQueryNode') {
      return this.transformUpdateQueryNode(node);
    }

    if (node.kind === 'DeleteQueryNode') {
      return this.transformDeleteQueryNode(node);
    }

    return node;
  }

  /**
   * 转换查询结果（此插件不需要修改结果）
   * @param args - 包含查询结果和查询节点的参数对象
   * @returns 原始查询结果
   */
  transformResult(
    args: PluginTransformResultArgs
  ): Promise<import('kysely').QueryResult<import('kysely').UnknownRow>> {
    // 软删除插件不需要修改结果，直接返回
    return Promise.resolve(args.result);
  }

  /**
   * 转换 SelectQueryNode（递归处理 CTE/派生表后，再给本层真实表加软删条件）。
   */
  private transformSelectQueryNode(node: any): any {
    const withNode = node.with ? this.transformWithNode(node.with) : undefined;
    const cteNames = this.collectCteNames(withNode);

    const from = node.from ? this.transformFromNode(node.from) : undefined;
    const joins = node.joins
      ? node.joins.map((j: any) => this.transformJoinNode(j))
      : undefined;

    const next = {
      ...node,
      ...(withNode && { with: withNode }),
      ...(from && { from }),
      ...(joins && { joins }),
    };

    return this.addSoftDeleteToQueryNode(next, cteNames);
  }

  /**
   * 转换 UpdateQueryNode（递归处理 CTE/派生表后，再给本层真实表加软删条件）。
   */
  private transformUpdateQueryNode(node: any): any {
    const withNode = node.with ? this.transformWithNode(node.with) : undefined;
    const cteNames = this.collectCteNames(withNode);

    const table =
      node.table !== undefined
        ? this.transformTableExpressionNode(node.table)
        : undefined;
    const from = node.from ? this.transformFromNode(node.from) : undefined;
    const joins = node.joins
      ? node.joins.map((j: any) => this.transformJoinNode(j))
      : undefined;

    const next = {
      ...node,
      ...(withNode && { with: withNode }),
      ...(table && { table }),
      ...(from && { from }),
      ...(joins && { joins }),
    };

    return this.addSoftDeleteToQueryNode(next, cteNames);
  }

  /**
   * 转换 DeleteQueryNode（递归处理 CTE/派生表后，再给本层真实表加软删条件）。
   */
  private transformDeleteQueryNode(node: any): any {
    const withNode = node.with ? this.transformWithNode(node.with) : undefined;
    const cteNames = this.collectCteNames(withNode);

    const from = node.from ? this.transformFromNode(node.from) : undefined;
    const using = node.using ? this.transformUsingNode(node.using) : undefined;
    const joins = node.joins
      ? node.joins.map((j: any) => this.transformJoinNode(j))
      : undefined;

    const next = {
      ...node,
      ...(withNode && { with: withNode }),
      ...(from && { from }),
      ...(using && { using }),
      ...(joins && { joins }),
    };

    return this.addSoftDeleteToQueryNode(next, cteNames);
  }

  /**
   * 递归转换 WithNode（处理每个 CTE 的 expression）。
   */
  private transformWithNode(withNode: any): any {
    if (!withNode || withNode.kind !== 'WithNode') return withNode;

    const expressions = Array.isArray(withNode.expressions)
      ? withNode.expressions.map((cte: any) => {
          return this.transformCommonTableExpressionNode(cte);
        })
      : withNode.expressions;

    return {
      ...withNode,
      expressions,
    };
  }

  /**
   * 转换单个 CTE：递归进入 expression。
   */
  private transformCommonTableExpressionNode(cte: any): any {
    if (!cte || cte.kind !== 'CommonTableExpressionNode') return cte;

    const expression = this.transformOperationNode(cte.expression);
    return {
      ...cte,
      expression,
    };
  }

  /**
   * 转换 FromNode。
   */
  private transformFromNode(fromNode: any): any {
    if (!fromNode || fromNode.kind !== 'FromNode') return fromNode;

    const froms = Array.isArray(fromNode.froms)
      ? fromNode.froms.map((f: any) => this.transformTableExpressionNode(f))
      : fromNode.froms;

    return {
      ...fromNode,
      froms,
    };
  }

  /**
   * 转换 JoinNode（主要处理 join.table 可能是 AliasNode(SelectQueryNode)）。
   */
  private transformJoinNode(joinNode: any): any {
    if (!joinNode || joinNode.kind !== 'JoinNode') return joinNode;

    const table = this.transformTableExpressionNode(joinNode.table);
    return {
      ...joinNode,
      table,
    };
  }

  /**
   * 转换 UsingNode（DELETE ... USING ...）。
   */
  private transformUsingNode(usingNode: any): any {
    if (!usingNode || usingNode.kind !== 'UsingNode') return usingNode;

    const tables = Array.isArray(usingNode.tables)
      ? usingNode.tables.map((t: any) => this.transformTableExpressionNode(t))
      : usingNode.tables;

    return {
      ...usingNode,
      tables,
    };
  }

  /**
   * 转换“表表达式”：
   * - TableNode：原样返回
   * - AliasNode(TableNode)：原样返回
   * - AliasNode(SelectQueryNode)：递归转换内部子查询
   * - ListNode：递归转换每个 item（用于 UPDATE 多表更新）
   */
  private transformTableExpressionNode(node: any): any {
    if (!node) return node;

    if (node.kind === 'AliasNode') {
      const inner = node.node;
      // JOIN 子查询 / 派生表
      if (
        inner &&
        (inner.kind === 'SelectQueryNode' ||
          inner.kind === 'UpdateQueryNode' ||
          inner.kind === 'DeleteQueryNode')
      ) {
        return {
          ...node,
          node: this.transformOperationNode(inner),
        };
      }
      return node;
    }

    if (node.kind === 'ListNode' && Array.isArray(node.items)) {
      return {
        ...node,
        items: node.items.map((it: any) => {
          return this.transformTableExpressionNode(it);
        }),
      };
    }

    return node;
  }

  /**
   * 收集本层查询的 CTE 名称集合，用于避免对 CTE 名/别名直接加 `is_delete`。
   */
  private collectCteNames(withNode: any): Set<string> {
    const names = new Set<string>();
    if (!withNode || withNode.kind !== 'WithNode') return names;

    const exprs: any[] = Array.isArray(withNode.expressions)
      ? withNode.expressions
      : [];
    for (const cte of exprs) {
      const tableName =
        cte?.name?.table?.table?.identifier?.name ??
        cte?.name?.table?.table?.name;
      if (tableName) names.add(tableName);
    }

    return names;
  }

  /**
   * 给单个查询节点（Select/Update/Delete）追加软删条件。
   * @param node - 查询节点
   * @param cteNames - 本层 CTE 名称集合（用于跳过）
   */
  private addSoftDeleteToQueryNode(node: any, cteNames: Set<string>): any {
    const tableRefs = this.collectPhysicalTableRefsAtThisLevel(node, cteNames);
    if (tableRefs.length === 0) return node;

    const conditions = tableRefs.map((ref) => this.buildIsDeleteCondition(ref));
    const softDeleteExpr = this.andAll(conditions);
    if (!softDeleteExpr) return node;

    const existingWhereExpr = this.unwrapWhere(node.where);
    const mergedExpr = existingWhereExpr
      ? this.andAll([existingWhereExpr, softDeleteExpr])
      : softDeleteExpr;

    if (!mergedExpr) return node;

    return {
      ...node,
      where: {
        kind: 'WhereNode' as const,
        where: mergedExpr,
      } as any,
    };
  }

  /**
   * 仅收集“本层查询作用域内的真实表引用”（用于拼 `tableRef.is_delete`）：
   * - TableNode：使用表名
   * - AliasNode(TableNode)：使用别名
   *
   * **不会**收集：
   * - AliasNode(SelectQueryNode)：派生表（会在子查询内部添加软删）
   * - CTE 名称/其别名：避免生成 `cte.is_delete` 这种无效条件
   */
  private collectPhysicalTableRefsAtThisLevel(
    node: any,
    cteNames: Set<string>
  ): string[] {
    const refs: string[] = [];
    const addRef = (ref: string | undefined) => {
      if (!ref) return;
      if (!refs.includes(ref)) refs.push(ref);
    };

    const addFromTableExpr = (expr: any) => {
      if (!expr) return;

      // UPDATE 多表更新：ListNode(items)
      if (expr.kind === 'ListNode' && Array.isArray(expr.items)) {
        expr.items.forEach(addFromTableExpr);
        return;
      }

      const ref = this.getPhysicalTableRef(expr, cteNames);
      addRef(ref);
    };

    if (node.kind === 'SelectQueryNode') {
      node.from?.froms?.forEach?.(addFromTableExpr);
      node.joins?.forEach?.((j: any) => addFromTableExpr(j?.table));
      return refs;
    }

    if (node.kind === 'UpdateQueryNode') {
      addFromTableExpr(node.table);
      node.from?.froms?.forEach?.(addFromTableExpr);
      node.joins?.forEach?.((j: any) => addFromTableExpr(j?.table));
      return refs;
    }

    if (node.kind === 'DeleteQueryNode') {
      node.from?.froms?.forEach?.(addFromTableExpr);
      node.using?.tables?.forEach?.(addFromTableExpr);
      node.joins?.forEach?.((j: any) => addFromTableExpr(j?.table));
      return refs;
    }

    return refs;
  }

  /**
   * 从本层表表达式中解析出“可用于追加软删条件”的表引用名（别名优先）。
   * @param tableLike - TableNode / AliasNode / ListNode
   * @param cteNames - CTE 名集合（用于跳过 CTE）
   */
  private getPhysicalTableRef(
    tableLike: any,
    cteNames: Set<string>
  ): string | undefined {
    if (!tableLike) return undefined;

    // UPDATE 多表更新：ListNode(items)
    if (tableLike.kind === 'ListNode' && Array.isArray(tableLike.items)) {
      // 这里返回 undefined，外层会分别 addFromTableExpr 调用到每个 item
      return undefined;
    }

    if (tableLike.kind === 'AliasNode') {
      const inner = tableLike.node;
      // 派生表/子查询：不在本层加
      if (inner?.kind === 'SelectQueryNode') return undefined;

      // AliasNode(TableNode)
      if (inner?.kind === 'TableNode') {
        const innerName = this.getTableNameFromTableNode(inner);
        if (innerName && cteNames.has(innerName)) return undefined;
        return tableLike.alias?.name;
      }

      return tableLike.alias?.name;
    }

    if (tableLike.kind === 'TableNode') {
      const name = this.getTableNameFromTableNode(tableLike);
      if (name && cteNames.has(name)) return undefined;
      return name;
    }

    return undefined;
  }

  /**
   * 从 TableNode 中提取表名。
   */
  private getTableNameFromTableNode(tableNode: any): string | undefined {
    return tableNode?.table?.identifier?.name ?? tableNode?.table?.name;
  }

  /**
   * 构建 `${tableRef}.is_delete = 0` 的表达式节点。
   * @param tableRef - 表名或别名
   */
  private buildIsDeleteCondition(tableRef: string): any {
    return {
      kind: 'BinaryOperationNode' as const,
      leftOperand: {
        kind: 'ReferenceNode' as const,
        table: {
          kind: 'TableNode' as const,
          table: {
            kind: 'SchemableIdentifierNode' as const,
            identifier: {
              kind: 'IdentifierNode' as const,
              name: tableRef,
            },
          },
        },
        column: {
          kind: 'ColumnNode' as const,
          column: {
            kind: 'IdentifierNode' as const,
            name: 'is_delete',
          },
        },
      },
      operator: {
        kind: 'OperatorNode' as const,
        operator: '=',
      },
      rightOperand: {
        kind: 'ValueNode' as const,
        value: 0,
      },
    };
  }

  /**
   * 取出 WhereNode 内部的表达式节点。
   * @param whereNode - WhereNode 或表达式节点
   */
  private unwrapWhere(whereNode: any): any | undefined {
    if (!whereNode) return undefined;
    return whereNode.where ?? whereNode;
  }

  /**
   * 将多个表达式用 AND 串起来。
   * @param exprs - 表达式数组
   */
  private andAll(exprs: any[]): any | undefined {
    const normalized = exprs.filter(Boolean);
    if (normalized.length === 0) return undefined;

    let out = normalized[0];
    for (let i = 1; i < normalized.length; i += 1) {
      out = {
        kind: 'AndNode' as const,
        left: out,
        right: normalized[i],
      };
    }
    return out;
  }
}
