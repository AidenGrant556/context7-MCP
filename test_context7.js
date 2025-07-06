#!/usr/bin/env node

/**
 * Context7 MCP 测试脚本
 * 用于验证Context7 MCP服务器的功能
 */

const { spawn } = require('child_process');
const readline = require('readline');

class Context7Tester {
  constructor() {
    this.mcpProcess = null;
    this.rl = null;
  }

  async startMCPServer() {
    console.log('🚀 启动Context7 MCP服务器...');
    
    this.mcpProcess = spawn('npx', ['-y', '@upstash/context7-mcp@latest'], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    this.mcpProcess.stderr.on('data', (data) => {
      console.error('MCP错误:', data.toString());
    });

    this.mcpProcess.on('close', (code) => {
      console.log(`MCP进程退出，代码: ${code}`);
    });

    // 等待服务器启动
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('✅ Context7 MCP服务器已启动');
  }

  async sendMCPRequest(method, params = {}) {
    const request = {
      jsonrpc: '2.0',
      id: Date.now(),
      method: method,
      params: params
    };

    console.log('📤 发送请求:', JSON.stringify(request, null, 2));
    
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('请求超时'));
      }, 10000);

      this.mcpProcess.stdout.once('data', (data) => {
        clearTimeout(timeout);
        try {
          const response = JSON.parse(data.toString());
          console.log('📥 收到响应:', JSON.stringify(response, null, 2));
          resolve(response);
        } catch (error) {
          console.log('📥 原始响应:', data.toString());
          reject(error);
        }
      });

      this.mcpProcess.stdin.write(JSON.stringify(request) + '\n');
    });
  }

  async testInitialize() {
    console.log('\n🔧 测试初始化...');
    try {
      const response = await this.sendMCPRequest('initialize', {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: {}
        },
        clientInfo: {
          name: 'context7-tester',
          version: '1.0.0'
        }
      });
      console.log('✅ 初始化成功');
      return response;
    } catch (error) {
      console.error('❌ 初始化失败:', error.message);
      throw error;
    }
  }

  async testListTools() {
    console.log('\n🛠️ 测试获取工具列表...');
    try {
      const response = await this.sendMCPRequest('tools/list');
      console.log('✅ 获取工具列表成功');
      if (response.result && response.result.tools) {
        console.log('📋 可用工具:');
        response.result.tools.forEach(tool => {
          console.log(`  - ${tool.name}: ${tool.description}`);
        });
      }
      return response;
    } catch (error) {
      console.error('❌ 获取工具列表失败:', error.message);
      throw error;
    }
  }

  async testResolveLibrary() {
    console.log('\n🔍 测试解析库ID...');
    try {
      const response = await this.sendMCPRequest('tools/call', {
        name: 'resolve-library-id',
        arguments: {
          libraryName: 'react'
        }
      });
      console.log('✅ 解析库ID成功');
      return response;
    } catch (error) {
      console.error('❌ 解析库ID失败:', error.message);
      throw error;
    }
  }

  async runTests() {
    try {
      await this.startMCPServer();
      await this.testInitialize();
      await this.testListTools();
      await this.testResolveLibrary();
      
      console.log('\n🎉 所有测试完成！');
    } catch (error) {
      console.error('\n💥 测试失败:', error.message);
    } finally {
      this.cleanup();
    }
  }

  cleanup() {
    console.log('\n🧹 清理资源...');
    if (this.mcpProcess) {
      this.mcpProcess.kill();
    }
    if (this.rl) {
      this.rl.close();
    }
  }
}

// 运行测试
if (require.main === module) {
  const tester = new Context7Tester();
  
  process.on('SIGINT', () => {
    console.log('\n👋 收到中断信号，正在退出...');
    tester.cleanup();
    process.exit(0);
  });
  
  tester.runTests();
}

module.exports = Context7Tester;