import { NextResponse } from 'next/server';
import { JiraClient } from '@/src/api/jira-client';
import { loadConfig } from '@/src/config/env';
import {
  JiraAuthenticationError,
  JiraRateLimitError,
} from '@/src/errors/jira-errors';

export async function GET() {
  try {
    const config = loadConfig();
    const client = new JiraClient(config);

    // Fetch issues assigned to or worked on by the current user
    const jql =
      '(assignee = currentUser() OR worklogAuthor = currentUser()) ORDER BY updated DESC';
    const result = await client.searchIssues(jql, { maxResults: 30 });

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
