import { db } from '@/mysqlOperate';
import { _Number, _String, type MasConfig, type MasHandler } from 'mas-server';

// 请求格式
const requestFormat = {
  name: _String,
  // age: Number,
  // strArray: [String],
  // grade: {
  //   chinese: Number,
  //   math: Number,
  //   english: Number,
  // },
};
// 响应格式
const responseFormat = {};
const header = {};
// 接口配置
export const config: MasConfig<
  typeof requestFormat,
  typeof responseFormat,
  typeof header
> = {
  name: '测试接口',
  strict: false,
  methods: 'get',
  contentType: 'application/json',
  header,
  requestFormat,
  responseFormat,
  // token: true,
  // permission: ['test'],
};
export const handler: MasHandler<typeof config> = async (req, res) => {
  // const studentResult = await db
  //   .insertInto('student')
  //   .values({
  //     name: '测试学生',
  //     age: 18,
  //   })
  //   .execute();
  // const teacherResult = await db
  //   .insertInto('teacher')
  //   .values({
  //     name: '测试老师',
  //     age: '30',
  //   })
  //   .execute();
  // console.log(studentResult[0]?.insertId, teacherResult.insertId);

  res.reply({});
};
