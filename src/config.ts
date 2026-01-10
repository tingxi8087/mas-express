import type { MasAppConfig } from 'mas-server';
import type { PoolOptions } from 'mysql2';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
const argv: any = yargs(hideBin(process.argv)).parse();
interface serverConfig {
  mysql: PoolOptions;
  port: number;
  mcp: boolean;
  http: boolean;
  appConfig: MasAppConfig;
}
export const betaConfig: serverConfig = {
  mysql: {
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '123456',
    database: 'test',
  },
  port: 8087,
  mcp: true,
  http: true,
  appConfig: {
    openCors: true,
    exposeApiDocs: true,
  },
};

export const isBeta = argv.beta;
export const getConfig = (): serverConfig => {
  return betaConfig;
};
