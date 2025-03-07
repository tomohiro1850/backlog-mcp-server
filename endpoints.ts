import { z } from "zod";

export interface BacklogEndpoint {
  name: string;
  description: string;
  path: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  schema: any;
  type: "tool" | "resource";
}

// 共通のスキーマ定義
const projectIdSchema = z.union([z.string().min(1), z.number().int().positive()]);
const projectKeySchema = z.string().min(1);
const projectIdOrKeySchema = z.union([projectIdSchema, projectKeySchema]);
const issueIdSchema = z.union([z.string().min(1), z.number().int().positive()]);
const summarySchema = z.string().min(1).max(200);
const descriptionSchema = z.string().optional();
const issueTypeIdSchema = z.union([z.string().min(1), z.number().int().positive()]);
const priorityIdSchema = z.union([z.string().min(1), z.number().int().positive()]).optional();
const dateFormatSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional();

// ソート順のスキーマ
const sortSchema = z.enum(["created", "updated"], {
  errorMap: () => ({ message: "ソート順は 'created' または 'updated' である必要があります" })
});
const orderSchema = z.enum(["asc", "desc"], {
  errorMap: () => ({ message: "ソート方向は 'asc' または 'desc' である必要があります" })
});

// ページネーションのスキーマ
const offsetSchema = z.number().int().nonnegative("オフセットは0以上である必要があります").optional();
const countSchema = z.number().int().positive("取得件数は1以上である必要があります").max(100, "取得件数は最大100件までです").optional();

export const endpoints: BacklogEndpoint[] = [
  // スペース／プロジェクト関連 - ツール
  {
    name: "getSpaces",
    description: "スペース情報の取得",
    path: "space",
    method: "GET",
    schema: z.object({}),
    type: "tool",
  },
  {
    name: "getProjects",
    description: "プロジェクト一覧の取得",
    path: "projects",
    method: "GET",
    schema: z.object({
      archived: z.boolean().optional(),
      all: z.boolean().optional()
    }),
    type: "tool",
  },
  
  // スペース／プロジェクト関連 - リソース
  {
    name: "spaceInfo",
    description: "スペース情報をリソースとして提供",
    path: "space://info",
    method: "GET",
    schema: z.object({}),
    type: "resource",
  },
  {
    name: "projectList",
    description: "プロジェクト一覧をリソースとして提供",
    path: "projects://list",
    method: "GET",
    schema: z.object({
      archived: z.boolean().optional(),
      all: z.boolean().optional()
    }),
    type: "resource",
  },
  {
    name: "projectInfo",
    description: "特定のプロジェクト情報をリソースとして提供",
    path: "projects://{projectIdOrKey}",
    method: "GET",
    schema: z.object({
      projectIdOrKey: projectIdOrKeySchema
    }),
    type: "resource",
  },
  
  // 課題関連 - ツール
  {
    name: "getIssues",
    description: "課題一覧の取得",
    path: "issues",
    method: "GET",
    schema: z.object({
      projectId: projectIdSchema.optional(),
      projectIdOrKey: projectIdOrKeySchema.optional(),
      statusId: z.array(z.number()).or(z.number()).optional(),
      assigneeId: z.array(z.number()).or(z.number()).optional(),
      createdSince: dateFormatSchema,
      createdUntil: dateFormatSchema,
      updatedSince: dateFormatSchema,
      updatedUntil: dateFormatSchema,
      sort: z.string().optional(),
      order: z.enum(['asc', 'desc']).optional(),
      offset: z.number().int().nonnegative().optional(),
      count: z.number().int().positive().optional(),
    }),
    type: "tool",
  },
  {
    name: "getIssue",
    description: "特定の課題情報の取得",
    path: "issues/{issueId}",
    method: "GET",
    schema: z.object({ issueId: issueIdSchema }),
    type: "tool",
  },
  {
    name: "createIssue",
    description: "課題の追加",
    path: "issues",
    method: "POST",
    schema: z.object({
      projectId: projectIdSchema,
      summary: summarySchema,
      description: descriptionSchema,
      issueTypeId: issueTypeIdSchema,
      priorityId: priorityIdSchema,
      startDate: dateFormatSchema,
      dueDate: dateFormatSchema,
    }),
    type: "tool",
  },
  
  // 課題関連 - リソース
  {
    name: "issueList",
    description: "課題一覧をリソースとして提供",
    path: "issues://{projectIdOrKey}/list",
    method: "GET",
    schema: z.object({
      projectIdOrKey: projectIdOrKeySchema,
      statusId: z.array(z.number()).or(z.number()).optional(),
      assigneeId: z.array(z.number()).or(z.number()).optional(),
      sort: z.string().optional(),
      order: z.enum(['asc', 'desc']).optional(),
    }),
    type: "resource",
  },
  {
    name: "issueDetails",
    description: "特定の課題の詳細情報をリソースとして提供",
    path: "issues://{issueId}/details",
    method: "GET",
    schema: z.object({ issueId: issueIdSchema }),
    type: "resource",
  },
  
  // Wiki／ファイル関連 - ツール
  {
    name: "getWikiPages",
    description: "Wikiページ一覧の取得",
    path: "wikis",
    method: "GET",
    schema: z.object({ 
      projectIdOrKey: projectIdOrKeySchema.optional(),
      keyword: z.string().max(1000, "検索キーワードは1000文字以内である必要があります").optional(),
      sort: sortSchema.optional(),
      order: orderSchema.optional(),
      offset: offsetSchema,
      count: countSchema,
    }),
    type: "tool",
  },
  
  // Wiki／ファイル関連 - リソース
  {
    name: "wikiList",
    description: "Wikiページ一覧をリソースとして提供",
    path: "wikis://{projectIdOrKey}/list",
    method: "GET",
    schema: z.object({
      projectIdOrKey: projectIdOrKeySchema,
      keyword: z.string().max(1000).optional(),
    }),
    type: "resource",
  },
  
  // ユーザー／グループ関連 - ツール
  {
    name: "getUsers",
    description: "ユーザー一覧の取得",
    path: "users",
    method: "GET",
    schema: z.object({
      keyword: z.string().max(1000, "検索キーワードは1000文字以内である必要があります").optional(),
      roleType: z.enum(["admin", "user", "reporter", "viewer", "guest"], {
        errorMap: () => ({ message: "ロールタイプは 'admin', 'user', 'reporter', 'viewer', 'guest' のいずれかである必要があります" })
      }).optional(),
      offset: offsetSchema,
      count: countSchema,
    }),
    type: "tool",
  },
  
  // ユーザー／グループ関連 - リソース
  {
    name: "userList",
    description: "ユーザー一覧をリソースとして提供",
    path: "users://list",
    method: "GET",
    schema: z.object({
      keyword: z.string().max(1000).optional(),
      roleType: z.enum(["admin", "user", "reporter", "viewer", "guest"]).optional(),
    }),
    type: "resource",
  },
  
  // Webhook／通知関連 - ツール
  {
    name: "getWebhooks",
    description: "Webhook一覧の取得",
    path: "projects/{projectIdOrKey}/webhooks",
    method: "GET",
    schema: z.object({ projectIdOrKey: projectIdOrKeySchema }),
    type: "tool",
  },
]; 