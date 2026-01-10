import 'module-alias/register';
import c from 'ansi-colors';
import moment from 'moment-timezone';
import { getApp } from 'mas-server';
import path from 'path';
import { getConfig, isBeta } from './config';
moment.tz.setDefault('Asia/Shanghai');
// 加载配置
const config = getConfig();
const PORT = config.port;

// 根据 beta 参数可以调整应用配置
const app = await getApp(path.resolve(__dirname, '..'), {
  openCors: true,
  exposeApiDocs: true,
  // 当启用 beta 模式时，可以调整一些配置
  logs: {
    open: true,
    debug: isBeta, // 如果是 beta 模式，则启用调试日志
    logRequestBody: isBeta, // 如果是 beta 模式，记录请求体
    logResponseBody: isBeta, // 如果是 beta 模式，记录响应体
  },
});

const server = app.listen(PORT, () => {
  console.log(
    `Server is running on port ${PORT} - ${c.green(`http://localhost:${PORT}/api/`)}`
  );

  if (isBeta) {
    console.log(c.yellow('Beta mode is enabled - Verbose logging activated'));
  }
});

server.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EADDRINUSE') {
    console.error(
      c.bgRed(
        `端口 ${PORT} 已被占用，无法启动服务器。请检查是否有其他进程正在使用该端口。`
      )
    );
    process.exit(1);
  } else {
    console.error(c.bgRed(`服务器启动失败: ${err.message}`));
    process.exit(1);
  }
});
