import c from 'ansi-colors';
import moment from 'moment-timezone';
import { getApp } from 'mas-server';
import path from 'path';
import { getConfig, isBeta } from '@/config';
import { createServerErrorHandler } from './middleware/server-error-handler.middleware';

moment.tz.setDefault('Asia/Shanghai');
// 加载配置
const config = getConfig();
const PORT = config.port;

// 根据 beta 参数可以调整应用配置
export const app = await getApp(path.resolve(__dirname, '..'), {
  openCors: isBeta,
  exposeApiDocs: isBeta,
  logs: {
    debug: isBeta, // 如果是 beta 模式，则启用调试日志
  },
});

const server = app.listen(PORT, () => {
  if (isBeta) {
    console.log(c.yellow('当前为预发环境'));
  }
  console.log(
    `Server is running on port ${PORT} - ${c.green('http://localhost:' + PORT + '/api/')}`
  );
});
// 服务器错误处理
server.on('error', createServerErrorHandler(PORT));
