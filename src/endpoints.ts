import { z } from 'zod';

export interface BacklogEndpoint {
  name: string;
  description: string;
  path: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  schema: z.ZodObject<any>;
  type: "tool" | "resource";
}

export const endpoints: BacklogEndpoint[] = [
  {
    name: "getSpaces",
    description: "スペース情報の取得",
    path: "space",
    method: "GET",
    schema: z.object({}).strict(),
    type: "tool"
  },
  {
    name: "getProjects",
    description: "プロジェクト一覧の取得",
    path: "projects",
    method: "GET",
    schema: z.object({}).strict(),
    type: "tool"
  },
  {
    name: "getIssues",
    description: "課題一覧の取得",
    path: "issues",
    method: "GET",
    schema: z.object({
      projectKey: z.string()
    }).strict(),
    type: "tool"
  },
  {
    name: "getIssue",
    description: "特定の課題情報の取得",
    path: "issues/{issueId}",
    method: "GET",
    schema: z.object({
      issueId: z.string()
    }).strict(),
    type: "tool"
  },
  {
    name: "createIssue",
    description: "課題の追加",
    path: "issues",
    method: "POST",
    schema: z.object({
      projectKey: z.string(),
      summary: z.string(),
      issueTypeId: z.string(),
      priorityId: z.string().optional(),
      description: z.string().optional(),
      startDate: z.string().optional(),
      dueDate: z.string().optional(),
      estimatedHours: z.number().optional(),
      actualHours: z.number().optional(),
      parentIssueId: z.string().optional(),
      assigneeId: z.string().optional(),
    }).strict(),
    type: "tool"
  },
  {
    name: "getWikiPages",
    description: "Wikiページ一覧の取得",
    path: "wikis",
    method: "GET",
    schema: z.object({
      projectKey: z.string()
    }).strict(),
    type: "tool"
  },
  {
    name: "getUsers",
    description: "ユーザー一覧の取得",
    path: "users",
    method: "GET",
    schema: z.object({}).strict(),
    type: "tool"
  },
  {
    name: "getWebhooks",
    description: "Webhook一覧の取得",
    path: "projects/{projectKey}/webhooks",
    method: "GET",
    schema: z.object({
      projectKey: z.string()
    }).strict(),
    type: "tool"
  }
]; 