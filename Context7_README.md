# Context7 MCP 使用指南

Context7 是一个强大的 MCP (Model Context Protocol) 服务器，专门用于获取最新的开源库文档和代码示例。它可以帮助开发者快速获取准确、最新的技术文档。

## 🚀 快速开始

### 1. 环境要求

- Node.js 18+ 
- npm 或 yarn
- 网络连接（用于下载和更新文档）

### 2. 安装和配置

#### 方式一：直接使用 npx（推荐）
```bash
npx -y @upstash/context7-mcp@latest
```

#### 方式二：在 Trae AI 中配置 MCP

1. 创建 MCP 配置文件 `mcp_config.json`：
```json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp@latest"]
    }
  }
}
```

2. 在 Trae AI 中加载此配置文件

### 3. 基本使用

#### 测试连接
```bash
node test_context7.js
```

#### 运行示例
```bash
# 运行预设示例
node context7_example.js

# 交互式模式
node context7_example.js interactive
```

## 🛠️ 主要功能

### 1. 解析库ID

将库名称转换为 Context7 兼容的库ID：

```javascript
const libraryId = await client.resolveLibraryId('react');
console.log(libraryId); // 输出: react
```

### 2. 获取库文档

获取指定库的最新文档：

```javascript
// 获取完整文档
const docs = await client.getLibraryDocs('react');

// 获取特定主题的文档
const hooksDocs = await client.getLibraryDocs('react', 'hooks');

// 限制返回的token数量
const limitedDocs = await client.getLibraryDocs('react', null, 5000);
```

### 3. 一键获取最新文档

结合解析和获取功能：

```javascript
const result = await client.getLatestDocs('next.js', 'routing');
console.log(result.docs);
```

## 📚 支持的库

Context7 支持大量流行的开源库，包括但不限于：

### 前端框架
- React
- Vue.js
- Angular
- Svelte
- Next.js
- Nuxt.js

### 后端框架
- Express.js
- Koa.js
- Fastify
- NestJS
- Django
- Flask

### 工具库
- Lodash
- Axios
- Moment.js
- Day.js
- Ramda

### 数据库
- Mongoose
- Sequelize
- Prisma
- TypeORM

### 测试框架
- Jest
- Mocha
- Cypress
- Playwright

## 🎯 使用场景

### 1. AI 助手增强

为 AI 助手提供最新的技术文档，确保回答的准确性：

```javascript
// 在 AI 对话中获取最新的 React hooks 文档
const reactHooks = await client.getLatestDocs('react', 'hooks');
// 将文档作为上下文提供给 AI 模型
```

### 2. 代码生成

获取最新的 API 文档来生成准确的代码：

```javascript
// 获取 Express.js 路由文档
const expressRouting = await client.getLatestDocs('express', 'routing');
// 基于最新文档生成路由代码
```

### 3. 文档同步

保持本地文档与官方文档同步：

```javascript
// 定期更新本地文档缓存
setInterval(async () => {
  const latestDocs = await client.getLatestDocs('react');
  // 更新本地缓存
}, 24 * 60 * 60 * 1000); // 每24小时更新一次
```

### 4. 学习和研究

快速获取技术资料进行学习：

```javascript
// 学习新技术时获取相关文档
const svelteDocs = await client.getLatestDocs('svelte', 'components');
const vueDocs = await client.getLatestDocs('vue', 'composition-api');
```

## 🔧 高级配置

### 自定义客户端

```javascript
class CustomContext7Client extends Context7Client {
  constructor(options = {}) {
    super();
    this.cacheEnabled = options.cache || false;
    this.cacheDir = options.cacheDir || './cache';
  }

  async getLatestDocsWithCache(libraryName, topic) {
    if (this.cacheEnabled) {
      // 实现缓存逻辑
      const cacheKey = `${libraryName}-${topic || 'default'}`;
      // 检查缓存...
    }
    
    return await super.getLatestDocs(libraryName, topic);
  }
}
```

### 批量处理

```javascript
async function batchGetDocs(libraries) {
  const client = new Context7Client();
  await client.start();
  
  const results = [];
  for (const lib of libraries) {
    try {
      const docs = await client.getLatestDocs(lib.name, lib.topic);
      results.push({ ...lib, docs, success: true });
    } catch (error) {
      results.push({ ...lib, error: error.message, success: false });
    }
  }
  
  client.stop();
  return results;
}

// 使用示例
const libraries = [
  { name: 'react', topic: 'hooks' },
  { name: 'vue', topic: 'composition-api' },
  { name: 'express', topic: 'middleware' }
];

const results = await batchGetDocs(libraries);
```

## 🚨 注意事项

1. **网络依赖**：Context7 需要网络连接来获取最新文档
2. **速率限制**：避免过于频繁的请求，建议实现缓存机制
3. **错误处理**：网络问题可能导致请求失败，需要适当的错误处理
4. **资源管理**：使用完毕后记得调用 `client.stop()` 释放资源

## 🔍 故障排除

### 常见问题

1. **连接超时**
   ```bash
   # 检查网络连接
   ping upstash.com
   
   # 检查 npm 配置
   npm config list
   ```

2. **库ID解析失败**
   ```javascript
   // 尝试不同的库名称格式
   await client.resolveLibraryId('react');
   await client.resolveLibraryId('reactjs');
   await client.resolveLibraryId('react.js');
   ```

3. **文档获取失败**
   ```javascript
   // 减少请求的token数量
   await client.getLibraryDocs(libraryId, topic, 5000);
   ```

### 调试模式

```javascript
// 启用详细日志
process.env.DEBUG = 'context7:*';

// 或者在代码中添加调试信息
class DebugContext7Client extends Context7Client {
  async sendRequest(method, params) {
    console.log('发送请求:', { method, params });
    const response = await super.sendRequest(method, params);
    console.log('收到响应:', response);
    return response;
  }
}
```

## 📖 更多资源

- [Context7 官方文档](https://github.com/upstash/context7)
- [MCP 协议规范](https://modelcontextprotocol.io/)
- [Upstash 官网](https://upstash.com/)

## 🤝 贡献

如果您发现问题或有改进建议，欢迎：

1. 提交 Issue
2. 发起 Pull Request
3. 完善文档
4. 分享使用经验

---

**祝您使用愉快！** 🎉