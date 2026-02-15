# mas-express

基于 [mas-server](https://www.npmjs.com/package/mas-server) 与 [Kysely](https://kysely.dev/) 的后端 API 项目，使用 **Bun** 运行，提供类型安全的 HTTP 接口与 MySQL 数据库访问。

## 技术栈

- **运行时**: [Bun](https://bun.sh/)
- **HTTP 框架**: [mas-server](https://www.npmjs.com/package/mas-server)（API 路由、请求校验、文档等）
- **数据库**: MySQL + [Kysely](https://kysely.dev/)（类型安全查询）+ [mysql2](https://www.npmjs.com/package/mysql2)
- **类型生成**: [kysely-codegen](https://github.com/kysely-org/kysely-codegen)（从数据库生成 `db.type.ts`）

## 环境要求

- [Bun](https://bun.sh/)（推荐最新版）

## 快速开始

### 安装依赖

```bash
bun install
```

### 开发模式（带 watch + 预发配置）

```bash
bun run start:dev
# 或
bun run start
```

- 预发模式下会开启 CORS、API 文档、调试日志与 SQL 日志。

### 生产模式

```bash
bun run start:prod
```

### 预发模式（显式传参）

通过 `--beta` 启用预发配置（CORS、文档、调试日志等）：

```bash
bun run start:dev -- --beta
```

## 项目结构

```
src/
├── main.ts              # 入口：加载配置、挂载 mas-server、启动服务
├── config.ts            # 服务与 MySQL 配置，beta 参数解析
├── apis/
│   └── index.ts         # API 定义：请求/响应格式、handler
├── middleware/
│   └── server-error-handler.middleware.ts  # 端口占用等启动错误处理
└── mysqlOperate/
    ├── index.ts         # Kysely 实例、插件、连接池
    ├── db.type.ts       # 由 kysely-codegen 生成的表类型（勿手改）
    ├── tableSql/        # 建表 SQL 示例
    ├── custom-queries/  # 自定义查询
    └── plugins/         # Kysely 插件（如 require-where、软删除等）
```

## 配置说明

在 `src/config.ts` 中可配置：

- **port**: 服务监听端口（默认如 8087）
- **mysql**: MySQL 连接池选项（`PoolOptions`），不需要时可注释
- **mcp / http**: 是否启用 MCP、HTTP
- **appConfig**: mas-server 的 `MasAppConfig`（如 `openCors`、`exposeApiDocs`）

预发模式（`--beta` 或 `start:dev`）下会启用 CORS、API 文档与调试相关选项。

## 数据库与类型生成

- 表结构示例见 `src/mysqlOperate/tableSql/createTable.sql`。
- 从现有 MySQL 生成 TypeScript 类型到 `src/mysqlOperate/db.type.ts`：

```bash
bun run sql-gen
```

- `sql-gen` 使用的连接串在 `package.json` 的 `scripts["sql-gen"]` 中，按需修改 URL（用户名、密码、库名等）。

## 编写 API

在 `src/apis/` 下按 mas-server 约定编写接口：

- 使用 `requestFormat` / `responseFormat` 定义校验（如 `_String`、`_Number`）。
- 使用 `config` 指定接口名、方法、contentType、是否需要 token 等。
- 在 `handler` 中通过 `res.reply()` 返回数据，可从 `@/mysqlOperate` 引入 `db` 做 Kysely 查询。

## 测试

```bash
bun test
```

## 脚本一览

| 命令 | 说明 |
|------|------|
| `bun run start` / `bun run start:dev` | 开发模式（watch + 预发配置） |
| `bun run start:prod` | 生产模式启动 |
| `bun run sql-gen` | 根据 MySQL 生成 `db.type.ts` |
| `bun test` | 运行测试 |

## License

Private.
