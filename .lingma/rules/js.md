---
trigger: always_on
---

- typescript 类型和函数注释尽量都使用jsdoc的形式
- react代码中除非用户主动说明，否则禁止出现usecallback和usememo
- 如果需要进行node库安装，如果是bun项目，使用bun安装，如果是node项目，使用cnpm
- 如果是typescript代码，每次执行任务完成后，还需要执行ts检查和eslint检查，如果是由本次任务引起的警告或错误，则需要进行修复