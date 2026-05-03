export interface WorklogTemplate {
  id: string;
  name: string;
  issueKey: string;
  issueSummary: string;
  projectName?: string;
  defaultHours: number;
}

export const TEMPLATES_STORAGE_KEY = 'worklog-templates';

export function loadTemplates(): WorklogTemplate[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(TEMPLATES_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as WorklogTemplate[]) : [];
  } catch {
    return [];
  }
}

export function saveTemplates(templates: WorklogTemplate[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(templates));
}
