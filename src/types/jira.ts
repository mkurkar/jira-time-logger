/** Atlassian Document Format (ADF) — used by Jira v3 for rich text fields */
export interface ADFNode {
  type: string;
  text?: string;
  content?: ADFNode[];
  attrs?: Record<string, unknown>;
  marks?: Array<{ type: string; attrs?: Record<string, unknown> }>;
  version?: number;
}

/** ADF document root */
export interface ADFDocument {
  type: 'doc';
  version: 1;
  content: ADFNode[];
}

export interface JiraUser {
  accountId: string;
  displayName: string;
  emailAddress: string;
  active: boolean;
}

export interface JiraProject {
  id: string;
  key: string;
  name: string;
  projectTypeKey: string;
}

export interface JiraIssueFields {
  summary: string;
  status: {
    name: string;
    id: string;
  };
  assignee: JiraUser | null;
  project: JiraProject;
  timespent: number | null;
  timeoriginalestimate: number | null;
}

export interface JiraIssue {
  id: string;
  key: string;
  fields: JiraIssueFields;
}

export interface JiraWorklog {
  id: string;
  issueId: string;
  timeSpent: string;
  timeSpentSeconds: number;
  started: string;
  author: JiraUser;
  comment?: ADFDocument;
}

export interface JiraSearchResult {
  issues: JiraIssue[];
  nextPageToken?: string;
  isLast?: boolean;
}

export interface JiraPaginatedResponse<T> {
  values: T[];
  total: number;
  maxResults: number;
  startAt: number;
  isLast: boolean;
}

/** Payload for creating a worklog */
export interface WorklogCreatePayload {
  timeSpentSeconds: number;
  started: string; // ISO datetime string (Jira format: "2024-01-15T09:00:00.000+0000")
  comment?: ADFDocument;
}

/** Payload for updating a worklog */
export interface WorklogUpdatePayload {
  timeSpentSeconds?: number;
  started?: string;
  comment?: ADFDocument;
}
