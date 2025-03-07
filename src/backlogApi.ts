import fetch, { RequestInit } from "node-fetch";

/**
 * Backlog API クライアント
 * エラーハンドリングと環境変数のバリデーションを強化
 */

// Backlogエラーのインターフェース定義
export interface BacklogError {
  errors: Array<{
    message: string;
    code: number;
    moreInfo: string;
  }>;
}

/**
 * レスポンスがBacklogエラーかどうかを判定する
 * @param response APIレスポンス
 * @returns BacklogErrorかどうか
 */
export function isBacklogError(response: any): response is BacklogError {
  return response && Array.isArray(response.errors) && response.errors.length > 0;
}

/**
 * Backlog APIからデータを取得する
 * @param endpoint APIエンドポイント
 * @param params リクエストパラメータ
 * @returns APIレスポンス
 */
export async function fetchFromBacklog(endpoint: string, params: Record<string, any> = {}): Promise<any> {
  // 環境変数のバリデーション
  const domain = process.env.BACKLOG_DOMAIN;
  const apiKey = process.env.BACKLOG_API_KEY;

  if (!domain) {
    throw new Error('環境変数 BACKLOG_DOMAIN が設定されていません');
  }

  if (!apiKey) {
    throw new Error('環境変数 BACKLOG_API_KEY が設定されていません');
  }

  try {
    // パラメータのサニタイズ
    const sanitizedParams: Record<string, any> = {};
    
    // projectIdOrKeyパラメータをprojectIdに変換（互換性のため）
    if (params.projectIdOrKey !== undefined) {
      sanitizedParams.projectId = params.projectIdOrKey;
      delete params.projectIdOrKey;
    }
    
    // その他のパラメータをコピー
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        sanitizedParams[key] = params[key];
      }
    });

    // エンドポイントのパスパラメータを置換
    let processedEndpoint = endpoint;
    const pathParams = processedEndpoint.match(/:([a-zA-Z0-9_]+)/g) || [];
    
    for (const param of pathParams) {
      const paramName = param.substring(1); // :を除去
      if (sanitizedParams[paramName] === undefined) {
        throw new Error(`パスパラメータ ${paramName} が指定されていません`);
      }
      
      processedEndpoint = processedEndpoint.replace(param, sanitizedParams[paramName]);
      delete sanitizedParams[paramName];
    }

    // リクエストURLの構築
    const baseUrl = `https://${domain}/api/v2/${processedEndpoint}`;
    const isPost = processedEndpoint.includes('POST');
    
    let url = baseUrl;
    let requestOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
      },
    };

    // GETリクエストの場合はクエリパラメータを追加
    if (!isPost) {
      const queryParams = new URLSearchParams();
      queryParams.append('apiKey', apiKey);
      
      Object.keys(sanitizedParams).forEach(key => {
        if (Array.isArray(sanitizedParams[key])) {
          sanitizedParams[key].forEach((value: any) => {
            queryParams.append(`${key}[]`, value.toString());
          });
        } else {
          queryParams.append(key, sanitizedParams[key].toString());
        }
      });
      
      url = `${baseUrl}?${queryParams.toString()}`;
    } else {
      // POSTリクエストの場合はボディにパラメータを設定
      requestOptions.method = 'POST';
      requestOptions.body = JSON.stringify(sanitizedParams);
      url = `${baseUrl}?apiKey=${apiKey}`;
    }

    // デバッグ用ログ（開発時のみ）
    if (process.env.NODE_ENV === 'development') {
      console.debug(`Backlog API リクエスト: ${url}`);
      console.debug('パラメータ:', sanitizedParams);
    }

    // APIリクエストの実行
    const response = await fetch(url, requestOptions);
    
    // レスポンスのステータスコードチェック
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `Backlog API エラー: HTTP ${response.status}`;
      
      try {
        const errorJson = JSON.parse(errorText);
        if (isBacklogError(errorJson)) {
          const error = errorJson.errors[0];
          errorMessage = `Backlog API呼び出しエラー: Backlogエラー [${error.code}]: ${error.message}${error.moreInfo ? ` - ${error.moreInfo}` : ''}`;
        }
      } catch (e) {
        errorMessage += ` - ${errorText}`;
      }
      
      throw new Error(errorMessage);
    }

    // レスポンスのJSONパース
    try {
      const data = await response.json();
      
      // Backlogエラーのチェックとエラーメッセージのフォーマット
      if (isBacklogError(data)) {
        const error = data.errors[0];
        throw new Error(`Backlog API呼び出しエラー: Backlogエラー [${error.code}]: ${error.message}${error.moreInfo ? ` - ${error.moreInfo}` : ''}`);
      }
      
      return data;
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error(`Backlog API呼び出しエラー: JSONパースエラー - ${error.message}`);
      }
      throw error;
    }
  } catch (error) {
    // ネットワークエラーなどの例外処理
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error(`Backlog API接続エラー: ${error.message}`);
    }
    
    // タイムアウトエラー
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Backlog APIタイムアウトエラー: リクエストがタイムアウトしました');
    }
    
    // その他のエラーはそのまま再スロー
    throw error;
  }
} 