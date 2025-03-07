#!/usr/bin/env node

import { config } from "dotenv";
config();

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerEndpoints } from "./registerEndpoints.js";

/**
 * Backlog MCP サーバー
 * 
 * このサーバーは、Backlog APIへのアクセスを提供するMCPサーバーです。
 * リソースとツールを通じて、Backlogの機能にアクセスできます。
 * 
 * リソース: データの取得に使用（例: プロジェクト一覧、課題情報など）
 * ツール: アクションの実行に使用（例: 課題の作成、更新など）
 */

// MCPサーバーの初期化
const server = new McpServer({
  name: "Backlog-MCP-Server",
  version: "1.0.0",
  description: "Backlog APIへのアクセスを提供するMCPサーバー"
});

// 全エンドポイントの登録
process.stderr.write("Backlog MCPサーバーを起動しています...\n");
registerEndpoints(server);
process.stderr.write("エンドポイントの登録が完了しました\n");

// サーバーの起動（ここではstdioを使用）
const transport = new StdioServerTransport();
process.stderr.write("サーバーを起動しています...\n");
await server.connect(transport);
process.stderr.write("サーバーが起動しました\n"); 