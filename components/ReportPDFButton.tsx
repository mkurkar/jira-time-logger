'use client';

import { PDFDownloadLink, Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import { format } from 'date-fns';
import { formatSeconds, secondsToHours, type MonthlyReport } from '@/types/report';

// ── PDF Styles ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    padding: 40,
    color: '#1a1a1a',
  },
  // Header
  header: {
    marginBottom: 24,
    borderBottom: '2px solid #0052CC',
    paddingBottom: 12,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    color: '#0052CC',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 11,
    color: '#555',
  },
  // Summary cards
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  summaryCard: {
    flex: 1,
    padding: 10,
    backgroundColor: '#F4F5F7',
    borderRadius: 4,
  },
  summaryLabel: {
    fontSize: 8,
    color: '#6B778C',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  summaryValue: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: '#0052CC',
  },
  // Section headers
  sectionTitle: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    color: '#0052CC',
    marginTop: 20,
    marginBottom: 8,
    borderBottom: '1px solid #DFE1E6',
    paddingBottom: 4,
  },
  // Tables
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F4F5F7',
    padding: '6 8',
    borderBottom: '1px solid #C1C7D0',
  },
  tableRow: {
    flexDirection: 'row',
    padding: '5 8',
    borderBottom: '1px solid #EBECF0',
  },
  tableRowAlt: {
    flexDirection: 'row',
    padding: '5 8',
    borderBottom: '1px solid #EBECF0',
    backgroundColor: '#FAFBFC',
  },
  colHeaderText: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#6B778C',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  cellText: {
    fontSize: 9,
    color: '#1a1a1a',
  },
  cellTextMuted: {
    fontSize: 9,
    color: '#6B778C',
  },
  cellTextRight: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#1a1a1a',
    textAlign: 'right',
  },
  keyBadge: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#0052CC',
    backgroundColor: '#DEEBFF',
    padding: '2 4',
    borderRadius: 2,
  },
  totalRow: {
    flexDirection: 'row',
    padding: '6 8',
    backgroundColor: '#E3F2FD',
    borderTop: '1px solid #0052CC',
  },
  totalText: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#0052CC',
  },
  // Project block
  projectBlock: {
    marginBottom: 14,
    border: '1px solid #DFE1E6',
    borderRadius: 4,
    overflow: 'hidden',
  },
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#0052CC',
    padding: '7 10',
  },
  projectHeaderText: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#FFFFFF',
  },
  // Day bar chart
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  dayLabel: {
    width: 80,
    fontSize: 8,
    color: '#6B778C',
  },
  dayBarBg: {
    flex: 1,
    height: 10,
    backgroundColor: '#F4F5F7',
    borderRadius: 2,
    marginHorizontal: 8,
  },
  dayBar: {
    height: 10,
    backgroundColor: '#0052CC',
    borderRadius: 2,
    opacity: 0.85,
  },
  dayValue: {
    width: 50,
    fontSize: 8,
    textAlign: 'right',
    fontFamily: 'Helvetica-Bold',
    color: '#1a1a1a',
  },
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTop: '1px solid #DFE1E6',
    paddingTop: 6,
  },
  footerText: {
    fontSize: 8,
    color: '#6B778C',
  },
});

// ── PDF Document ──────────────────────────────────────────────────────────────

function ReportPDFDocument({ report }: { report: MonthlyReport }) {
  const monthLabel = format(new Date(report.year, report.month - 1, 1), 'MMMM yyyy');
  const maxDaySeconds = Math.max(...report.byDay.map((d) => d.totalSeconds), 1);

  return (
    <Document title={`Monthly Report — ${monthLabel}`} author={report.authorName}>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Monthly Time Report</Text>
          <Text style={styles.subtitle}>{report.authorName} · {monthLabel}</Text>
        </View>

        {/* Summary */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total Hours</Text>
            <Text style={styles.summaryValue}>{secondsToHours(report.totalSeconds)}h</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Issues Worked</Text>
            <Text style={styles.summaryValue}>{report.byIssue.length}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Projects</Text>
            <Text style={styles.summaryValue}>{report.byProject.length}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Days Active</Text>
            <Text style={styles.summaryValue}>{report.byDay.length}</Text>
          </View>
        </View>

        {/* Time by Issue */}
        <Text style={styles.sectionTitle}>Time by Issue</Text>
        <View style={styles.tableHeader}>
          <Text style={{ ...styles.colHeaderText, width: 80 }}>Issue</Text>
          <Text style={{ ...styles.colHeaderText, flex: 1 }}>Summary</Text>
          <Text style={{ ...styles.colHeaderText, width: 80 }}>Project</Text>
          <Text style={{ ...styles.colHeaderText, width: 60, textAlign: 'right' }}>Time</Text>
        </View>
        {report.byIssue.map((row, i) => (
          <View key={row.issueKey} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
            <Text style={{ ...styles.keyBadge, width: 80 }}>{row.issueKey}</Text>
            <Text style={{ ...styles.cellText, flex: 1 }}>{row.issueSummary}</Text>
            <Text style={{ ...styles.cellTextMuted, width: 80 }}>{row.projectName}</Text>
            <Text style={{ ...styles.cellTextRight, width: 60 }}>{formatSeconds(row.totalSeconds)}</Text>
          </View>
        ))}
        <View style={styles.totalRow}>
          <Text style={{ ...styles.totalText, flex: 1 }}>Total</Text>
          <Text style={{ ...styles.totalText, width: 60, textAlign: 'right' }}>{formatSeconds(report.totalSeconds)}</Text>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>Jira Time Logger · {report.authorName} · {monthLabel}</Text>
          <Text style={styles.footerText} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>

      {/* Page 2: By Project */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionTitle}>Time by Project</Text>
        {report.byProject.map((proj) => (
          <View key={proj.projectKey} style={styles.projectBlock}>
            <View style={styles.projectHeader}>
              <Text style={styles.projectHeaderText}>{proj.projectName}</Text>
              <Text style={styles.projectHeaderText}>{formatSeconds(proj.totalSeconds)}</Text>
            </View>
            {proj.issues.map((issue, i) => (
              <View key={issue.issueKey} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                <Text style={{ ...styles.keyBadge, width: 80 }}>{issue.issueKey}</Text>
                <Text style={{ ...styles.cellText, flex: 1 }}>{issue.issueSummary}</Text>
                <Text style={{ ...styles.cellTextRight, width: 60 }}>{formatSeconds(issue.totalSeconds)}</Text>
              </View>
            ))}
          </View>
        ))}

        {/* Daily breakdown */}
        <Text style={styles.sectionTitle}>Daily Activity</Text>
        {report.byDay.map((day) => (
          <View key={day.date} style={styles.dayRow}>
            <Text style={styles.dayLabel}>{format(new Date(day.date), 'EEE, MMM d')}</Text>
            <View style={styles.dayBarBg}>
              <View style={{ ...styles.dayBar, width: `${(day.totalSeconds / maxDaySeconds) * 100}%` as unknown as number }} />
            </View>
            <Text style={styles.dayValue}>{formatSeconds(day.totalSeconds)}</Text>
          </View>
        ))}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>Jira Time Logger · {report.authorName} · {monthLabel}</Text>
          <Text style={styles.footerText} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>

      {/* Page 3: Comments (only if there are any) */}
      {report.byDay.some((d) => d.entries.some((e) => e.comment)) && (
        <Page size="A4" style={styles.page}>
          <Text style={styles.sectionTitle}>Worklog Comments</Text>
          <View style={styles.tableHeader}>
            <Text style={{ ...styles.colHeaderText, width: 60 }}>Date</Text>
            <Text style={{ ...styles.colHeaderText, width: 80 }}>Issue</Text>
            <Text style={{ ...styles.colHeaderText, flex: 1 }}>Comment</Text>
            <Text style={{ ...styles.colHeaderText, width: 60, textAlign: 'right' }}>Time</Text>
          </View>
          {report.byDay.flatMap((d) =>
            d.entries
              .filter((e) => e.comment)
              .map((e, i) => (
                <View key={e.worklogId} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                  <Text style={{ ...styles.cellTextMuted, width: 60 }}>{format(new Date(e.date), 'MMM d')}</Text>
                  <Text style={{ ...styles.keyBadge, width: 80 }}>{e.issueKey}</Text>
                  <Text style={{ ...styles.cellText, flex: 1 }}>{e.comment}</Text>
                  <Text style={{ ...styles.cellTextRight, width: 60 }}>{formatSeconds(e.timeSpentSeconds)}</Text>
                </View>
              ))
          )}

          {/* Footer */}
          <View style={styles.footer} fixed>
            <Text style={styles.footerText}>Jira Time Logger · {report.authorName} · {monthLabel}</Text>
            <Text style={styles.footerText} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
          </View>
        </Page>
      )}
    </Document>
  );
}

// ── Download Button ───────────────────────────────────────────────────────────

interface ReportPDFButtonProps {
  report: MonthlyReport;
}

export default function ReportPDFButton({ report }: ReportPDFButtonProps) {
  const monthLabel = format(new Date(report.year, report.month - 1, 1), 'MMMM-yyyy');
  const fileName = `time-report-${monthLabel}-${report.authorName.replace(/\s+/g, '-')}.pdf`;

  return (
    <PDFDownloadLink
      document={<ReportPDFDocument report={report} />}
      fileName={fileName}
    >
      {({ loading }) => (
        <button
          disabled={loading}
          style={{
            padding: '7px 18px',
            background: loading ? '#e0e0e0' : '#36B37E',
            color: loading ? '#999' : '#fff',
            border: 'none',
            borderRadius: 4,
            fontWeight: 600,
            fontSize: 14,
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'background 0.2s',
          }}
        >
          {loading ? 'Preparing PDF…' : '⬇ Export PDF'}
        </button>
      )}
    </PDFDownloadLink>
  );
}
