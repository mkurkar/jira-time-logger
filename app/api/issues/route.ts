import { NextRequest, NextResponse } from 'next/server';
import { JiraClient } from '@/src/api/jira-client';
import { loadConfig } from '@/src/config/env';
import {
  JiraAuthenticationError,
  JiraRateLimitError,
} from '@/src/errors/jira-errors';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const jql = searchParams.get('jql');
  const maxResults = searchParams.get('maxResults');

  if (!jql) {
    return NextResponse.json(
      { error: 'Missing required parameter: jql' },
      { status: 400 },
    );
  }

  try {
    const config = loadConfig();
    const client = new JiraClient(config);
    const result = await client.searchIssues(jql, {
      maxResults: maxResults ? parseInt(maxResults, 10) : 20,
    });
    return NextResponse.json({
      issues: result.issues,
      total: result.issues.length,
      nextPageToken: result.nextPageToken,
      isLast: result.isLast,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    if (error instanceof JiraAuthenticationError) {
      return NextResponse.json(
        { error: 'Authentication failed. Check your Jira API credentials.' },
        { status: 401 },
      );
    }
    if (error instanceof JiraRateLimitError) {
      return NextResponse.json(
        { error: 'Rate limited by Jira. Please wait and try again.' },
        { status: 429 },
      );
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
