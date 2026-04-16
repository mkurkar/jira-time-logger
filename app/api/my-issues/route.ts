import { NextRequest, NextResponse } from 'next/server';
import { JiraClient } from '@/src/api/jira-client';
import { loadConfig } from '@/src/config/env';
import {
  JiraAuthenticationError,
  JiraRateLimitError,
} from '@/src/errors/jira-errors';

export async function GET(request: NextRequest) {
  try {
    const config = loadConfig();
    const client = new JiraClient(config);

    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Scope to worklogs in date range if provided, otherwise fall back to recent
    let jql: string;
    if (startDate && endDate) {
      jql = `(assignee = currentUser() OR worklogAuthor = currentUser()) AND worklogDate >= "${startDate}" AND worklogDate <= "${endDate}" ORDER BY updated DESC`;
    } else {
      jql = '(assignee = currentUser() OR worklogAuthor = currentUser()) ORDER BY updated DESC';
    }
    const result = await client.searchIssues(jql, { maxResults: 50 });

    return NextResponse.json({
      issues: result.issues,
      total: result.issues.length,
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
