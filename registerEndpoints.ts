import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { endpoints, BacklogEndpoint } from "./endpoints.js";
import { fetchFromBacklog } from "./backlogApi.js";

// レスポンスの型定義
interface McpResponse {
  content: Array<{
    type: "text";
    text: string;
  }>;
  isError?: boolean;
  [key: string]: unknown;
}

// ZodスキーマからJSONスキーマに変換する関数
function zodToJsonSchema(schema: any) {
  // 簡易的なJSONスキーマ変換
  // 実際のプロダクションコードでは、より堅牢な変換が必要
  try {
    // スキーマが_defプロパティを持っている場合
    if (schema._def && schema._def.objectType) {
      const properties: Record<string, any> = {};
      const required: string[] = [];
      
      // オブジェクトの各プロパティを処理
      if (typeof schema._def.shape === 'function') {
        const shape = schema._def.shape();
        for (const [key, val] of Object.entries(shape)) {
          properties[key] = { type: "string" }; // 簡易的に全てstringとして扱う
          
          // 必須フィールドの判定（簡易的な実装）
          if (val && typeof val === 'object' && '_def' in val) {
            const valDef = val as { _def: { isOptional?: boolean } };
            if (!valDef._def.isOptional) {
              required.push(key);
            }
          }
        }
      }
      
      return {
        type: "object",
        properties,
        required: required.length > 0 ? required : undefined
      };
    }
    
    // 基本的なスキーマの場合
    return { type: "object", properties: {} };
  } catch (error) {
    console.error("JSONスキーマ変換エラー:", error);
    // フォールバックとして空のオブジェクトスキーマを返す
    return { type: "object", properties: {} };
  }
}

export function registerEndpoints(server: McpServer) {
  // ツールとリソースの登録
  endpoints.forEach((endpoint: BacklogEndpoint) => {
    const handler = async (params: Record<string, unknown>): Promise<McpResponse> => {
      try {
        // パラメータのバリデーション
        const validatedParams = await endpoint.schema.parseAsync(params);

        // URL中のプレースホルダーを置換
        let path = endpoint.path;
        
        // URIスキーム（例：space://info）の場合はBacklog APIのパスに変換
        if (path.includes('://')) {
          // URIスキームを取り除いてAPIパスに変換
          const uriParts = path.split('://');
          const resourceType = uriParts[0];
          const resourcePath = uriParts[1];
          
          // リソースタイプに応じてAPIパスを構築
          switch (resourceType) {
            case 'space':
              path = 'space';
              break;
            case 'projects':
              if (resourcePath === 'list') {
                path = 'projects';
              } else {
                path = `projects/${resourcePath}`;
              }
              break;
            case 'issues':
              if (resourcePath.includes('/list')) {
                const projectPart = resourcePath.split('/')[0];
                path = 'issues';
                validatedParams.projectIdOrKey = projectPart;
              } else if (resourcePath.includes('/details')) {
                const issuePart = resourcePath.split('/')[0];
                path = `issues/${issuePart}`;
              }
              break;
            case 'wikis':
              if (resourcePath.includes('/list')) {
                const projectPart = resourcePath.split('/')[0];
                path = 'wikis';
                validatedParams.projectIdOrKey = projectPart;
              }
              break;
            case 'users':
              path = 'users';
              break;
            default:
              path = resourcePath;
          }
        }
        
        // 通常のパスパラメータの置換処理
        for (const [key, value] of Object.entries(validatedParams)) {
          if (typeof value === "string" || typeof value === "number") {
            const placeholder = `{${key}}`;
            if (path.includes(placeholder)) {
              path = path.replace(placeholder, String(value));
              // プレースホルダーとして使用したパラメータは削除
              delete validatedParams[key];
            }
          }
        }

        // メソッドの追加
        if (endpoint.method !== "GET") {
          validatedParams.method = endpoint.method;
        }

        // APIリクエストの実行
        const data = await fetchFromBacklog(path, validatedParams);
        return {
          content: [{ 
            type: "text" as const, 
            text: JSON.stringify(data, null, 2) 
          }],
        };
      } catch (error: any) {
        // エラーメッセージの整形
        const errorMessage = error.errors 
          ? `バリデーションエラー: ${JSON.stringify(error.errors)}`
          : `エラー: ${error.message}`;

        return {
          content: [{ 
            type: "text" as const, 
            text: errorMessage 
          }],
          isError: true,
        };
      }
    };

    // エンドポイントの種類に応じて登録
    if (endpoint.type === "tool") {
      // ツールの登録
      server.tool(
        endpoint.name,
        endpoint.description,
        async (args: Record<string, unknown>) => handler(args)
      );
    } else if (endpoint.type === "resource") {
      // リソーステンプレートを作成して登録
      const template = new ResourceTemplate(endpoint.path, { list: undefined });
      server.resource(
        endpoint.name, 
        template,
        async (uri, params) => {
          const result = await handler(params);
          return { 
            contents: [{ 
              uri: uri.href, 
              text: result.content[0].text 
            }] 
          };
        }
      );
    }
  });
} 