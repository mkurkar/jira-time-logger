export class JiraApiError extends Error {
  public readonly statusCode: number;
  public readonly endpoint: string;
  public readonly responseBody: string;

  constructor(message: string, statusCode: number, endpoint: string, responseBody: string = '') {
    super(message);
    this.name = 'JiraApiError';
    this.statusCode = statusCode;
    this.endpoint = endpoint;
    this.responseBody = responseBody;
  }
}

export class JiraAuthenticationError extends JiraApiError {
  constructor(endpoint: string, responseBody: string = '') {
    super(
      `Authentication failed for ${endpoint}. Check your JIRA_USER_EMAIL and JIRA_API_TOKEN.`,
      401,
      endpoint,
      responseBody
    );
    this.name = 'JiraAuthenticationError';
  }
}

export class JiraForbiddenError extends JiraApiError {
  constructor(endpoint: string, responseBody: string = '') {
    super(
      `Access forbidden for ${endpoint}. Your API token may lack the required permissions.`,
      403,
      endpoint,
      responseBody
    );
    this.name = 'JiraForbiddenError';
  }
}

export class JiraRateLimitError extends JiraApiError {
  public readonly retryAfter: number | null;

  constructor(endpoint: string, retryAfter: number | null = null, responseBody: string = '') {
    const retryMsg = retryAfter ? ` Retry after ${retryAfter} seconds.` : '';
    super(
      `Rate limited on ${endpoint}.${retryMsg}`,
      429,
      endpoint,
      responseBody
    );
    this.name = 'JiraRateLimitError';
    this.retryAfter = retryAfter;
  }
}

export class JiraNotFoundError extends JiraApiError {
  constructor(endpoint: string, responseBody: string = '') {
    super(
      `Resource not found: ${endpoint}.`,
      404,
      endpoint,
      responseBody
    );
    this.name = 'JiraNotFoundError';
  }
}
