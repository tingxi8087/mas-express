import 'module-alias/register';
import c from 'ansi-colors';
import moment from 'moment-timezone';
import { getApp } from 'mas-server';
import path from 'path';
moment.tz.setDefault('Asia/Shanghai');
const PORT = 8087;
const app = await getApp(path.resolve(__dirname, '..'), {
  openCors: true,
  exposeApiDocs: true,
});

const server = app.listen(PORT, () => {
  console.log(
    `Server is running on port ${PORT} - ${c.green(`http://localhost:${PORT}/api/`)}`
  );
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
