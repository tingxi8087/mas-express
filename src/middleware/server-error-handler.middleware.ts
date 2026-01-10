import c from 'ansi-colors';

/**
 * 处理服务器启动错误
 * @param err 错误对象
 * @param port 端口号
 */
export const handleServerError = (err: NodeJS.ErrnoException, port: number) => {
  if (err.code === 'EADDRINUSE') {
    console.error(
      c.bgRed(
        `端口 ${port} 已被占用，无法启动服务器。请检查是否有其他进程正在使用该端口。`
      )
    );
    process.exit(1);
  } else {
    console.error(c.bgRed(`服务器启动失败: ${err.message}`));
    process.exit(1);
  }
};

/**
 * 创建服务器错误处理函数
 * @param port 端口号
 * @returns 错误处理函数
 */
export const createServerErrorHandler = (port: number) => {
  return (err: NodeJS.ErrnoException) => {
    handleServerError(err, port);
  };
};
