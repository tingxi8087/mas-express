import type {
  PluginTransformQueryArgs,
  PluginTransformResultArgs,
  RootOperationNode,
  UpdateQueryNode,
  DeleteQueryNode,
} from 'kysely';

/**
 * 要求 WHERE 条件插件
 * 如果 UPDATE 和 DELETE 操作没有 WHERE 条件，自动添加一个不可能成功的条件（1 = 0）
 * 这样可以防止误操作导致全表更新或删除
 */
export class RequireWherePlugin {
  /**
   * 转换查询，为没有 WHERE 条件的 UPDATE 和 DELETE 添加不可能成功的条件
   * @param args - 包含查询节点的参数对象
   * @returns 修改后的查询节点
   */
  transformQuery(args: PluginTransformQueryArgs): RootOperationNode {
    const { node } = args;

    // 只处理 UPDATE 和 DELETE 查询
    if (node.kind === 'UpdateQueryNode') {
      return this.ensureWhereCondition(node as UpdateQueryNode);
    } else if (node.kind === 'DeleteQueryNode') {
      return this.ensureWhereCondition(node as DeleteQueryNode);
    }

    return node;
  }

  /**
   * 确保查询有 WHERE 条件，如果没有则添加不可能成功的条件
   * @param node - UPDATE 或 DELETE 查询节点
   * @returns 修改后的查询节点
   */
  private ensureWhereCondition(
    node: UpdateQueryNode | DeleteQueryNode
  ): UpdateQueryNode | DeleteQueryNode {
    // 检查是否已有 WHERE 条件
    if (node.where) {
      // 已有 WHERE 条件，直接返回
      return node;
    }

    // 没有 WHERE 条件，添加一个不可能成功的条件：1 = 0
    const impossibleCondition = {
      kind: 'WhereNode' as const,
      where: {
        kind: 'BinaryOperationNode' as const,
        leftOperand: {
          kind: 'ValueNode' as const,
          value: 1,
        },
        operator: {
          kind: 'OperatorNode' as const,
          operator: '=',
        },
        rightOperand: {
          kind: 'ValueNode' as const,
          value: 0,
        },
      },
    };

    return {
      ...node,
      where: impossibleCondition as any,
    };
  }
  /**
   * 转换查询结果（此插件不需要修改结果）
   * @param args - 包含查询结果和查询节点的参数对象
   * @returns 原始查询结果
   */
  transformResult(
    args: PluginTransformResultArgs
  ): Promise<import('kysely').QueryResult<import('kysely').UnknownRow>> {
    // 此插件不需要修改结果，直接返回
    return Promise.resolve(args.result);
  }
}
