import fetch from "node-fetch";
import type { RequestInit } from "node-fetch";

// エラー型の定義
interface BacklogError {
  errors: Array<{
    message: string;
    code: number;
    moreInfo: string;
  }>;
}

// レスポンスがBacklogErrorかどうかを判定
function isBacklogError(obj: any): obj is BacklogError {
  return obj && Array.isArray(obj.errors) && obj.errors.length > 0;
}

/**
 * Backlog APIにリクエストを送信する関数
 * 
 * @param endpoint APIエンドポイントのパス
 * @param params リクエストパラメータ
 * @returns APIレスポンス
 * @throws エラー発生時
 */
export async function fetchFromBacklog(
  endpoint: string,
  params: Record<string, any> = {}
): Promise<any> {
  try {
    // 環境変数のバリデーション
    const domain = process.env.BACKLOG_DOMAIN?.trim();
    const apiKey = process.env.BACKLOG_API_KEY?.trim();
    
    if (!domain || !apiKey) {
      throw new Error(
        "環境変数BACKLOG_DOMAINまたはBACKLOG_API_KEYが設定されていません"
      );
    }

    // パラメータのサニタイズ
    const sanitizedParams = Object.fromEntries(
      Object.entries(params).map(([key, value]) => [
        key,
        typeof value === "string" ? value.trim() : value
      ])
    );

    // エンドポイントのパスパラメータを置換
    let processedEndpoint = endpoint;
    if (endpoint.includes("{")) {
      // {issueId}のようなパスパラメータを実際の値で置換
      const matches = endpoint.match(/\{([^}]+)\}/g) || [];
      for (const match of matches) {
        const paramName = match.slice(1, -1); // {issueId} -> issueId
        if (sanitizedParams[paramName]) {
          processedEndpoint = processedEndpoint.replace(
            match,
            sanitizedParams[paramName]
          );
          delete sanitizedParams[paramName]; // URLに埋め込んだパラメータは削除
        } else {
          throw new Error(`パスパラメータ ${paramName} が指定されていません`);
        }
      }
    }

    // URLの構築
    const url = new URL(`https://${domain}/api/v2/${processedEndpoint}`);
    url.searchParams.append("apiKey", apiKey);

    // メソッドの判定
    const method = sanitizedParams.method || (endpoint.toLowerCase().includes("post") ? "POST" : "GET");
    delete sanitizedParams.method; // methodパラメータは削除

    // リクエストオプションの準備
    const options: RequestInit = {
      method,
      headers: {
        "User-Agent": "Backlog-MCP-Server/1.0.0",
        "Accept": "application/json"
      }
    };

    // POSTリクエストの場合はボディにパラメータを設定
    if (method === "POST") {
      // POSTリクエストの場合はFormDataを使用（Backlog APIの仕様に合わせる）
      const formData = new URLSearchParams();
      for (const [key, value] of Object.entries(sanitizedParams)) {
        if (value !== undefined && value !== null) {
          // 配列の場合は複数のパラメータとして追加
          if (Array.isArray(value)) {
            value.forEach(item => {
              formData.append(`${key}[]`, String(item));
            });
          } else {
            formData.append(key, String(value));
          }
        }
      }
      options.body = formData.toString();
      options.headers = {
        ...options.headers,
        "Content-Type": "application/x-www-form-urlencoded"
      };
    } else {
      // GETリクエストの場合はURLにパラメータを追加
      for (const [key, value] of Object.entries(sanitizedParams)) {
        if (value !== undefined && value !== null) {
          // 配列の場合は複数のパラメータとして追加
          if (Array.isArray(value)) {
            value.forEach(item => {
              url.searchParams.append(`${key}[]`, String(item));
            });
          } else {
            url.searchParams.append(key, String(value));
          }
        }
      }
    }

    // デバッグ情報（開発時のみ使用）
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEBUG] リクエスト: ${method} ${url.toString()}`);
      if (method === 'POST') {
        console.log(`[DEBUG] リクエストボディ: ${options.body}`);
      }
    }

    // リクエストの実行
    const response = await fetch(url.toString(), options);
    const data = await response.json();

    // Backlogエラーレスポンスのチェックとハンドリング
    if (isBacklogError(data)) {
      const error = data.errors[0];
      const errorDetails = error.moreInfo ? ` (詳細: ${error.moreInfo})` : '';
      throw new Error(`Backlogエラー [${error.code}]: ${error.message}${errorDetails}`);
    }

    if (!response.ok) {
      throw new Error(`HTTPエラー ${response.status}: ${response.statusText}`);
    }

    return data;
  } catch (error) {
    if (error instanceof Error) {
      // エラーの種類に応じて詳細なメッセージを提供
      if (error.message.includes('ENOTFOUND')) {
        throw new Error(`Backlog API接続エラー: ドメイン ${process.env.BACKLOG_DOMAIN} に接続できません`);
      } else if (error.message.includes('ETIMEDOUT')) {
        throw new Error(`Backlog API接続タイムアウト: リクエストがタイムアウトしました`);
      } else if (error.message.includes('SyntaxError')) {
        throw new Error(`Backlog APIレスポースエラー: 不正なJSONレスポンスを受信しました`);
      } else {
        throw new Error(`Backlog API呼び出しエラー: ${error.message}`);
      }
    }
    throw error;
  }
} 