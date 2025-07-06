#!/usr/bin/env node

/**
 * Context7 MCP 使用示例
 * 演示如何在实际项目中使用Context7获取最新文档
 */

const { spawn } = require('child_process');
const readline = require('readline');

class Context7Client {
  constructor() {
    this.mcpProcess = null;
    this.requestId = 1;
    this.pendingRequests = new Map();
  }

  async start() {
    console.log('🚀 启动Context7 MCP客户端...');
    
    this.mcpProcess = spawn('npx', ['-y', '@upstash/context7-mcp@latest'], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    this.mcpProcess.stderr.on('data', (data) => {
      console.error('MCP错误:', data.toString());
    });

    this.mcpProcess.stdout.on('data', (data) => {
      this.handleResponse(data.toString());
    });

    this.mcpProcess.on('close', (code) => {
      console.log(`MCP进程退出，代码: ${code}`);
    });

    // 初始化
    await this.initialize();
    console.log('✅ Context7客户端已就绪');
  }

  handleResponse(data) {
    try {
      const lines = data.trim().split('\n');
      for (const line of lines) {
        if (line.trim()) {
          const response = JSON.parse(line);
          if (response.id && this.pendingRequests.has(response.id)) {
            const { resolve } = this.pendingRequests.get(response.id);
            this.pendingRequests.delete(response.id);
            resolve(response);
          }
        }
      }
    } catch (error) {
      console.error('解析响应失败:', error.message);
      console.log('原始数据:', data);
    }
  }

  async sendRequest(method, params = {}) {
    const id = this.requestId++;
    const request = {
      jsonrpc: '2.0',
      id: id,
      method: method,
      params: params
    };

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(id, { resolve, reject });
      
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new Error('请求超时'));
      }, 30000);

      this.pendingRequests.set(id, { 
        resolve: (response) => {
          clearTimeout(timeout);
          resolve(response);
        }, 
        reject 
      });

      this.mcpProcess.stdin.write(JSON.stringify(request) + '\n');
    });
  }

  async initialize() {
    const response = await this.sendRequest('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {
        tools: {}
      },
      clientInfo: {
        name: 'context7-example',
        version: '1.0.0'
      }
    });
    return response;
  }

  async resolveLibraryId(libraryName) {
    console.log(`🔍 解析库ID: ${libraryName}`);
    const response = await this.sendRequest('tools/call', {
      name: 'resolve-library-id',
      arguments: {
        libraryName: libraryName
      }
    });
    
    if (response.result && response.result.content) {
      const content = response.result.content[0];
      if (content.type === 'text') {
        console.log(`✅ 库ID: ${content.text}`);
        return content.text;
      }
    }
    throw new Error('无法解析库ID');
  }

  async getLibraryDocs(libraryId, topic = null, tokens = 10000) {
    console.log(`📚 获取文档: ${libraryId}${topic ? ` (主题: ${topic})` : ''}`);
    const params = {
      name: 'get-library-docs',
      arguments: {
        context7CompatibleLibraryID: libraryId,
        tokens: tokens
      }
    };
    
    if (topic) {
      params.arguments.topic = topic;
    }

    const response = await this.sendRequest('tools/call', params);
    
    if (response.result && response.result.content) {
      const content = response.result.content[0];
      if (content.type === 'text') {
        console.log(`✅ 获取到 ${content.text.length} 字符的文档`);
        return content.text;
      }
    }
    throw new Error('无法获取文档');
  }

  async getLatestDocs(libraryName, topic = null) {
    try {
      // 1. 解析库ID
      const libraryId = await this.resolveLibraryId(libraryName);
      
      // 2. 获取文档
      const docs = await this.getLibraryDocs(libraryId, topic);
      
      return {
        libraryName,
        libraryId,
        topic,
        docs
      };
    } catch (error) {
      console.error(`❌ 获取 ${libraryName} 文档失败:`, error.message);
      throw error;
    }
  }

  stop() {
    console.log('🛑 停止Context7客户端...');
    if (this.mcpProcess) {
      this.mcpProcess.kill();
    }
  }
}

// 使用示例
async function examples() {
  const client = new Context7Client();
  
  try {
    await client.start();
    
    console.log('\n=== Context7 使用示例 ===\n');
    
    // 示例1: 获取React最新文档
    console.log('📖 示例1: 获取React hooks文档');
    const reactDocs = await client.getLatestDocs('react', 'hooks');
    console.log(`React hooks文档预览:\n${reactDocs.docs.substring(0, 500)}...\n`);
    
    // 示例2: 获取Next.js路由文档
    console.log('📖 示例2: 获取Next.js路由文档');
    const nextjsDocs = await client.getLatestDocs('next.js', 'routing');
    console.log(`Next.js路由文档预览:\n${nextjsDocs.docs.substring(0, 500)}...\n`);
    
    // 示例3: 获取Express.js文档
    console.log('📖 示例3: 获取Express.js文档');
    const expressDocs = await client.getLatestDocs('express');
    console.log(`Express.js文档预览:\n${expressDocs.docs.substring(0, 500)}...\n`);
    
    console.log('🎉 所有示例完成！');
    
  } catch (error) {
    console.error('💥 示例执行失败:', error.message);
  } finally {
    client.stop();
  }
}

// 交互式模式
async function interactiveMode() {
  const client = new Context7Client();
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  try {
    await client.start();
    
    console.log('\n🎮 进入交互模式');
    console.log('输入库名称获取文档，输入 "quit" 退出\n');
    
    while (true) {
      const libraryName = await new Promise(resolve => {
        rl.question('请输入库名称: ', resolve);
      });
      
      if (libraryName.toLowerCase() === 'quit') {
        break;
      }
      
      const topic = await new Promise(resolve => {
        rl.question('请输入主题 (可选，直接回车跳过): ', resolve);
      });
      
      try {
        const result = await client.getLatestDocs(
          libraryName, 
          topic.trim() || null
        );
        console.log(`\n📚 ${libraryName} 文档:\n`);
        console.log(result.docs.substring(0, 1000));
        if (result.docs.length > 1000) {
          console.log('\n... (文档已截断，完整内容请查看返回结果)');
        }
        console.log('\n' + '='.repeat(50) + '\n');
      } catch (error) {
        console.error(`❌ 获取文档失败: ${error.message}\n`);
      }
    }
    
  } catch (error) {
    console.error('💥 交互模式失败:', error.message);
  } finally {
    rl.close();
    client.stop();
  }
}

// 主程序
if (require.main === module) {
  const mode = process.argv[2];
  
  process.on('SIGINT', () => {
    console.log('\n👋 收到中断信号，正在退出...');
    process.exit(0);
  });
  
  if (mode === 'interactive') {
    interactiveMode();
  } else {
    examples();
  }
}

module.exports = Context7Client;