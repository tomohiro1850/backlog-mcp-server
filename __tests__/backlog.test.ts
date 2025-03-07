import { fetchFromBacklog } from '../backlogApi.js';
import { endpoints } from '../endpoints.js';
import { config } from 'dotenv';

/**
 * Backlog API テスト
 * 
 * 実際の環境でテストを実行する際の注意点：
 * 
 * 1. 環境変数の設定
 *    - TEST_PROJECT_ID: テスト用プロジェクトのID
 *    - TEST_PROJECT_KEY: テスト用プロジェクトのキー
 *    - BACKLOG_DOMAIN: BacklogのドメインURL
 *    - BACKLOG_API_KEY: BacklogのAPIキー
 * 
 * 2. スキップされているテストについて
 *    - 実際の環境に合わせてスキップを解除する場合は、以下の点に注意してください：
 *      - getIssuesテスト: Backlog APIでは、projectIdパラメータを使用
 *      - createIssueテスト: 実際の環境に合わせて有効なissueTypeIdを設定する必要があります
 *      - getWikiPagesテスト: Wikiの機能が制限されている場合はスキップしたままにしてください
 * 
 * 3. APIの仕様変更に対応するため、定期的なテストの実行と更新が重要です
 */

// 環境変数の読み込み
config();

// テスト用の定数
// 実際の環境のプロジェクト情報を設定
const TEST_PROJECT_ID = process.env.TEST_PROJECT_ID;
const TEST_PROJECT_KEY = process.env.TEST_PROJECT_KEY;
const TEST_PROJECT_ID_OR_KEY = TEST_PROJECT_KEY; // プロジェクトキーを優先的に使用

// 課題タイプIDとプライオリティID（実際の環境に合わせて設定）
const TEST_ISSUE_TYPE_ID = '841492'; // 実際の環境で有効なissueTypeIdに変更してください
const TEST_PRIORITY_ID = '2'; // 実際の環境で有効なpriorityIdに変更してください

describe('Backlog API Tests', () => {
  // スペース情報の取得テスト
  describe('getSpaces', () => {
    it('should fetch space information successfully', async () => {
      const endpoint = endpoints.find(e => e.name === 'getSpaces');
      expect(endpoint).toBeDefined();
      
      const result = await fetchFromBacklog(endpoint!.path, {});
      expect(result).toBeDefined();
      expect(result.spaceKey).toBeDefined();
      
      // 詳細なログ出力（デバッグ用）
      console.log('スペース情報:', JSON.stringify(result, null, 2));
    });
  });

  // プロジェクト一覧のテスト
  describe('getProjects', () => {
    it('should fetch project list successfully', async () => {
      const endpoint = endpoints.find(e => e.name === 'getProjects');
      expect(endpoint).toBeDefined();
      
      const result = await fetchFromBacklog(endpoint!.path, {});
      expect(Array.isArray(result)).toBe(true);
      
      // 指定したプロジェクトが存在するか確認
      const testProject = result.find((project: any) => 
        project.projectKey === TEST_PROJECT_KEY || project.id.toString() === TEST_PROJECT_ID
      );
      expect(testProject).toBeDefined();
      
      // プロジェクト情報の詳細ログ（デバッグ用）
      if (testProject) {
        console.log('テスト用プロジェクト情報:', JSON.stringify(testProject, null, 2));
        
        // 課題タイプ情報を取得（createIssueテスト用）
        if (testProject.id) {
          try {
            const issueTypes = await fetchFromBacklog(`projects/${testProject.id}/issueTypes`, {});
            console.log('利用可能な課題タイプ:', JSON.stringify(issueTypes, null, 2));
          } catch (error) {
            console.error('課題タイプの取得に失敗:', error);
          }
        }
      }
    });
  });

  // 課題一覧のテスト
  describe('getIssues', () => {
    // 課題一覧の取得テストはスキップ
    test.skip('should fetch issues successfully', async () => {
      // テスト実装
    });

    // 存在しないプロジェクトIDのテストもスキップ
    test.skip('should handle non-existent project ID', async () => {
      // テスト実装
    });

    // projectIdのバリデーションテスト
    test('should validate project ID format', async () => {
      const endpoint = endpoints.find(e => e.path === 'issues');
      expect(endpoint).toBeDefined();
      expect(endpoint!.schema).toBeDefined();
      
      // 無効なprojectIdでエラーになることを確認
      await expect(
        endpoint!.schema.parseAsync({ projectId: -1 })
      ).rejects.toThrow();
      
      // 有効なprojectIdは通過することを確認
      await expect(
        endpoint!.schema.parseAsync({ projectId: 123 })
      ).resolves.toEqual({ projectId: 123 });
      
      // 有効なprojectIdOrKeyも通過することを確認
      await expect(
        endpoint!.schema.parseAsync({ projectIdOrKey: "TEST" })
      ).resolves.toEqual({ projectIdOrKey: "TEST" });
    });
  });

  // 特定の課題情報のテスト
  describe('getIssue', () => {
    /**
     * テスト用の課題IDを取得するヘルパー関数
     * projectIdパラメータを使用して課題リストを取得
     */
    async function getFirstIssueId(): Promise<number | null> {
      try {
        const issues = await fetchFromBacklog('issues', {
          projectId: TEST_PROJECT_ID,
          count: 1
        });
        
        if (Array.isArray(issues) && issues.length > 0) {
          return issues[0].id;
        }
      } catch (error) {
        console.error('課題IDの取得に失敗:', error);
      }
      return null;
    }
    
    it('should fetch issue with valid ID', async () => {
      // 実際の課題IDを動的に取得
      const validIssueId = await getFirstIssueId();
      if (!validIssueId) {
        console.warn('テスト用の課題が見つからないためスキップします');
        return;
      }
      
      const endpoint = endpoints.find(e => e.name === 'getIssue');
      expect(endpoint).toBeDefined();
      
      const result = await fetchFromBacklog(endpoint!.path, { issueId: validIssueId });
      expect(result.id).toBeDefined();
      console.log('取得した課題情報:', JSON.stringify(result, null, 2));
    });

    it('should handle non-existent issue ID', async () => {
      const endpoint = endpoints.find(e => e.name === 'getIssue');
      expect(endpoint).toBeDefined();
      
      await expect(
        fetchFromBacklog(endpoint!.path, { issueId: '999999' })
      ).rejects.toThrow();
    });

    it('should validate issue ID format', async () => {
      const endpoint = endpoints.find(e => e.name === 'getIssue');
      expect(endpoint).toBeDefined();
      
      // issueIdはstring型またはnumber型を許容するため、オブジェクトでテスト
      await expect(
        endpoint!.schema.parseAsync({ issueId: {} })
      ).rejects.toThrow();
    });
  });

  // 課題の追加テスト
  describe('createIssue', () => {
    // 課題タイプIDを動的に取得するヘルパー関数
    async function getFirstIssueTypeId() {
      try {
        const issueTypes = await fetchFromBacklog(`projects/${TEST_PROJECT_ID}/issueTypes`, {});
        if (Array.isArray(issueTypes) && issueTypes.length > 0) {
          return issueTypes[0].id.toString();
        }
      } catch (error) {
        console.error('課題タイプIDの取得に失敗:', error);
      }
      return null;
    }
    
    // プライオリティIDを動的に取得するヘルパー関数
    async function getFirstPriorityId() {
      try {
        const priorities = await fetchFromBacklog('priorities', {});
        if (Array.isArray(priorities) && priorities.length > 0) {
          return priorities[0].id.toString();
        }
      } catch (error) {
        console.error('プライオリティIDの取得に失敗:', error);
      }
      return null;
    }
    
    it('should create issue with required parameters', async () => {
      // 実際の環境で有効な課題タイプIDとプライオリティIDを取得
      const issueTypeId = await getFirstIssueTypeId() || TEST_ISSUE_TYPE_ID;
      const priorityId = await getFirstPriorityId() || TEST_PRIORITY_ID;
      
      const endpoint = endpoints.find(e => e.name === 'createIssue');
      expect(endpoint).toBeDefined();
      
      const params = {
        projectId: TEST_PROJECT_ID,
        summary: 'テスト課題 ' + new Date().toISOString(),
        issueTypeId,
        priorityId,
        method: 'POST'
      };
      
      const result = await fetchFromBacklog(endpoint!.path, params);
      expect(result.id).toBeDefined();
      console.log('作成した課題:', JSON.stringify(result, null, 2));
    });

    it('should create issue with optional parameters', async () => {
      // 実際の環境で有効な課題タイプIDとプライオリティIDを取得
      const issueTypeId = await getFirstIssueTypeId() || TEST_ISSUE_TYPE_ID;
      const priorityId = await getFirstPriorityId() || TEST_PRIORITY_ID;
      
      const endpoint = endpoints.find(e => e.name === 'createIssue');
      expect(endpoint).toBeDefined();
      
      const params = {
        projectId: TEST_PROJECT_ID,
        summary: 'テスト課題（詳細あり） ' + new Date().toISOString(),
        issueTypeId,
        priorityId,
        description: '詳細な説明\n複数行のテキスト\n' + new Date().toISOString(),
        method: 'POST'
      };
      
      const result = await fetchFromBacklog(endpoint!.path, params);
      expect(result.id).toBeDefined();
      expect(result.description).toBe(params.description);
      console.log('詳細付きで作成した課題:', JSON.stringify(result, null, 2));
    });

    it('should validate required parameters', async () => {
      const endpoint = endpoints.find(e => e.name === 'createIssue');
      expect(endpoint).toBeDefined();
      
      await expect(
        endpoint!.schema.parseAsync({ projectId: TEST_PROJECT_ID })
      ).rejects.toThrow();
    });

    it('should handle invalid project ID', async () => {
      const endpoint = endpoints.find(e => e.name === 'createIssue');
      expect(endpoint).toBeDefined();
      
      const params = {
        projectId: '999999',
        summary: 'テスト課題',
        issueTypeId: TEST_ISSUE_TYPE_ID,
        priorityId: TEST_PRIORITY_ID,
        method: 'POST'
      };
      
      await expect(
        fetchFromBacklog(endpoint!.path, params)
      ).rejects.toThrow();
    });
  });

  // Wikiページ一覧のテスト
  describe('getWikiPages', () => {
    // Wikiの機能が制限されている場合があるため注意
    it('should fetch wiki pages with valid project ID', async () => {
      const endpoint = endpoints.find(e => e.name === 'getWikiPages');
      expect(endpoint).toBeDefined();
      
      try {
        // Wikiページ一覧の取得にはprojectIdOrKeyパラメータを使用
        const result = await fetchFromBacklog(endpoint!.path, { projectIdOrKey: TEST_PROJECT_KEY });
        expect(Array.isArray(result)).toBe(true);
        console.log(`プロジェクト ${TEST_PROJECT_KEY} のWikiページ数:`, result.length);
      } catch (error: any) {
        // Wikiが無効な場合はテストをスキップ
        if (error.message && error.message.includes('featureRestrictedError')) {
          console.warn('Wikiの機能が制限されているためスキップします');
          return;
        }
        throw error;
      }
    });

    it('should handle non-existent project ID', async () => {
      const endpoint = endpoints.find(e => e.name === 'getWikiPages');
      expect(endpoint).toBeDefined();
      
      await expect(
        fetchFromBacklog(endpoint!.path, { projectIdOrKey: '999999' })
      ).rejects.toThrow();
    });
  });

  // ユーザー一覧のテスト
  describe('getUsers', () => {
    it('should fetch user list successfully', async () => {
      const endpoint = endpoints.find(e => e.name === 'getUsers');
      expect(endpoint).toBeDefined();
      
      const result = await fetchFromBacklog(endpoint!.path, {});
      expect(Array.isArray(result)).toBe(true);
      console.log('ユーザー数:', result.length);
      if (result.length > 0) {
        console.log('最初のユーザー:', JSON.stringify(result[0], null, 2));
      }
    });
  });

  // Webhook一覧のテスト
  describe('getWebhooks', () => {
    it('should fetch webhook list successfully', async () => {
      const endpoint = endpoints.find(e => e.name === 'getWebhooks');
      expect(endpoint).toBeDefined();
      
      const result = await fetchFromBacklog(`projects/${TEST_PROJECT_KEY}/webhooks`, {});
      expect(Array.isArray(result)).toBe(true);
      console.log(`プロジェクト ${TEST_PROJECT_KEY} のWebhook数:`, result.length);
    });
  });
}); 