import type {
  JiraUser,
  JiraProject,
  JiraIssue,
  JiraWorklog,
  JiraSearchResult,
  WorklogCreatePayload,
  WorklogUpdatePayload,
} from '../types/jira';
import {
  JiraApiError,
  JiraAuthenticationError,
  JiraForbiddenError,
  JiraNotFoundError,
  JiraRateLimitError,
} from '../errors/jira-errors';

export class JiraClient {
  private baseUrl: string;
  private authHeader: string;

  constructor(config: { instanceUrl: string; userEmail: string; apiToken: string }) {
    this.baseUrl = config.instanceUrl.replace(/\/+$/, '');
    this.authHeader = `Basic ${Buffer.from(`${config.userEmail}:${config.apiToken}`).toString('base64')}`;
  }

  /** Health check — returns the authenticated user. */
  async getMyself(): Promise<JiraUser> {
    return this.request<JiraUser>('/rest/api/3/myself');
  }

  /** List all visible projects. */
  async getProjects(): Promise<JiraProject[]> {
    return this.request<JiraProject[]>('/rest/api/3/project');
  }

  /** Get a single project by key. */
  async getProject(projectKey: string): Promise<JiraProject> {
    return this.request<JiraProject>(`/rest/api/3/project/${encodeURIComponent(projectKey)}`);
  }

  /** Get users assignable to a project. */
  async getAssignableUsers(projectKey: string): Promise<JiraUser[]> {
    const params = new URLSearchParams({
      project: projectKey,
      maxResults: '200',
    });
    return this.request<JiraUser[]>(
      `/rest/api/3/user/assignable/search?${params.toString()}`,
    );
  }

  /** Search issues via JQL (uses /rest/api/3/search/jql). */
  async searchIssues(
    jql: string,
    options?: { maxResults?: number; nextPageToken?: string },
  ): Promise<JiraSearchResult> {
    const params = new URLSearchParams({ jql });
    params.set('fields', 'summary,status,assignee,project,timespent,timeoriginalestimate');
    if (options?.maxResults !== undefined) params.set('maxResults', String(options.maxResults));
    if (options?.nextPageToken) params.set('nextPageToken', options.nextPageToken);
    return this.request<JiraSearchResult>(`/rest/api/3/search/jql?${params.toString()}`);
  }

  /** Get a single issue by key. */
  async getIssue(issueKey: string): Promise<JiraIssue> {
    return this.request<JiraIssue>(`/rest/api/3/issue/${encodeURIComponent(issueKey)}`);
  }

  /** Get worklogs for an issue. */
  async getWorklogs(
    issueKey: string,
    options?: { startedAfter?: number; startedBefore?: number },
  ): Promise<JiraWorklog[]> {
    const params = new URLSearchParams();
    if (options?.startedAfter !== undefined) params.set('startedAfter', String(options.startedAfter));
    if (options?.startedBefore !== undefined) params.set('startedBefore', String(options.startedBefore));
    const query = params.toString();
    const endpoint = `/rest/api/3/issue/${encodeURIComponent(issueKey)}/worklog${query ? `?${query}` : ''}`;
    const res = await this.request<{ worklogs: JiraWorklog[] }>(endpoint);
    return res.worklogs;
  }

  /** Create a worklog on an issue. */
  async createWorklog(
    issueKey: string,
    data: WorklogCreatePayload,
  ): Promise<JiraWorklog> {
    return this.request<JiraWorklog>(
      `/rest/api/3/issue/${encodeURIComponent(issueKey)}/worklog`,
      { method: 'POST', body: JSON.stringify(data) },
    );
  }

  /** Update an existing worklog. */
  async updateWorklog(
    issueKey: string,
    worklogId: string,
    data: WorklogUpdatePayload,
  ): Promise<JiraWorklog> {
    return this.request<JiraWorklog>(
      `/rest/api/3/issue/${encodeURIComponent(issueKey)}/worklog/${encodeURIComponent(worklogId)}`,
      { method: 'PUT', body: JSON.stringify(data) },
    );
  }

  /** Delete a worklog. Returns void on success (204). */
  async deleteWorklog(issueKey: string, worklogId: string): Promise<void> {
    const endpoint = `/rest/api/3/issue/${encodeURIComponent(issueKey)}/worklog/${encodeURIComponent(worklogId)}`;
    const url = `${this.baseUrl}${endpoint}`;

    const headers: Record<string, string> = {
      Authorization: this.authHeader,
      Accept: 'application/json',
    };

    let response: Response;
    try {
      response = await fetch(url, { method: 'DELETE', headers });
    } catch (err) {
      throw new JiraApiError(
        `Network error while requesting ${endpoint}: ${(err as Error).message}`,
        0,
        endpoint,
      );
    }

    if (!response.ok) {
      const body = await response.text();
      switch (response.status) {
        case 401:
          throw new JiraAuthenticationError(endpoint, body);
        case 403:
          throw new JiraForbiddenError(endpoint, body);
        case 404:
          throw new JiraNotFoundError(endpoint, body);
        case 429: {
          const retryAfter = response.headers.get('Retry-After');
          throw new JiraRateLimitError(
            endpoint,
            retryAfter ? Number(retryAfter) : null,
            body,
          );
        }
        default:
          throw new JiraApiError(
            `Jira API error ${response.status} on ${endpoint}: ${response.statusText}`,
            response.status,
            endpoint,
            body,
          );
      }
    }
    // 204 No Content — success, nothing to return
  }

  // ── private ──────────────────────────────────────────────

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const maxRetries = 3;

    const headers: Record<string, string> = {
      Authorization: this.authHeader,
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> | undefined),
    };

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      let response: Response;
      try {
        response = await fetch(url, { ...options, headers });
      } catch (err) {
        throw new JiraApiError(
          `Network error while requesting ${endpoint}: ${(err as Error).message}`,
          0,
          endpoint,
        );
      }

      if (response.ok) {
        return (await response.json()) as T;
      }

      const body = await response.text();

      if (response.status === 429 && attempt < maxRetries) {
        const retryAfterHeader = response.headers.get('Retry-After');
        const retryAfterSeconds = retryAfterHeader ? Number(retryAfterHeader) : 1;
        const waitSeconds = retryAfterSeconds * Math.pow(2, attempt - 1);
        console.warn(`Rate limited on ${endpoint}, retry ${attempt}/${maxRetries} after ${waitSeconds}s`);
        await new Promise((resolve) => setTimeout(resolve, waitSeconds * 1000));
        continue;
      }

      switch (response.status) {
        case 401:
          throw new JiraAuthenticationError(endpoint, body);
        case 403:
          throw new JiraForbiddenError(endpoint, body);
        case 404:
          throw new JiraNotFoundError(endpoint, body);
        case 429: {
          const retryAfter = response.headers.get('Retry-After');
          throw new JiraRateLimitError(
            endpoint,
            retryAfter ? Number(retryAfter) : null,
            body,
          );
        }
        default:
          throw new JiraApiError(
            `Jira API error ${response.status} on ${endpoint}: ${response.statusText}`,
            response.status,
            endpoint,
            body,
          );
      }
    }

    // TypeScript exhaustiveness — the loop always returns or throws above
    throw new JiraApiError(`Unexpected exit from retry loop on ${endpoint}`, 0, endpoint);
  }
}
