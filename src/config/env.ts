import 'dotenv/config';

export interface JiraConfig {
  instanceUrl: string;
  userEmail: string;
  apiToken: string;
}

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === '') {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
      `Please set it in your .env file. See .env.example for reference.`
    );
  }
  return value.trim();
}

export function loadConfig(): JiraConfig {
  return {
    instanceUrl: getRequiredEnv('JIRA_INSTANCE_URL'),
    userEmail: getRequiredEnv('JIRA_USER_EMAIL'),
    apiToken: getRequiredEnv('JIRA_API_TOKEN'),
  };
}
