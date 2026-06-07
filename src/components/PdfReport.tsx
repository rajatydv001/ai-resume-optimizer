import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#1a1a1a",
  },
  header: {
    marginBottom: 24,
    borderBottomWidth: 2,
    borderBottomColor: "#6366f1",
    paddingBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 10,
    color: "#666",
  },
  scoreSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 24,
    padding: 16,
    backgroundColor: "#f8f8ff",
    borderRadius: 8,
  },
  scoreNumber: {
    fontSize: 48,
    fontWeight: "bold",
  },
  scoreMeta: {
    flex: 1,
  },
  scoreLabel: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 2,
  },
  rating: {
    fontSize: 10,
    padding: "4 12",
    borderRadius: 999,
  },
  ratingExcellent: {
    color: "#166534",
    backgroundColor: "#dcfce7",
  },
  ratingGood: {
    color: "#854d0e",
    backgroundColor: "#fef9c3",
  },
  ratingNeeds: {
    color: "#991b1b",
    backgroundColor: "#fee2e2",
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#6366f1",
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingBottom: 4,
  },
  sectionTitleNoAI: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#374151",
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingBottom: 4,
  },
  keywordRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginBottom: 4,
  },
  badge: {
    fontSize: 8,
    padding: "3 8",
    borderRadius: 999,
  },
  badgeMatched: {
    backgroundColor: "#dcfce7",
    color: "#166534",
  },
  badgeMissing: {
    backgroundColor: "#fee2e2",
    color: "#991b1b",
  },
  badgeNew: {
    backgroundColor: "#dbeafe",
    color: "#1e40af",
  },
  listItem: {
    fontSize: 10,
    marginBottom: 4,
    lineHeight: 1.5,
    paddingLeft: 8,
  },
  metaRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 4,
  },
  metaLabel: {
    color: "#666",
    fontSize: 9,
  },
  metaValue: {
    fontSize: 10,
  },
  versionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
    padding: "6 8",
    backgroundColor: "#f9fafb",
    borderRadius: 4,
  },
  versionScore: {
    fontSize: 16,
    fontWeight: "bold",
    width: 40,
  },
  versionInfo: {
    flex: 1,
  },
  versionLabel: {
    fontSize: 10,
    fontWeight: "bold",
  },
  versionDate: {
    fontSize: 8,
    color: "#666",
  },
  summaryText: {
    fontSize: 10,
    lineHeight: 1.6,
    fontStyle: "italic",
    color: "#4b5563",
    padding: 8,
    backgroundColor: "#f9fafb",
    borderRadius: 4,
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    fontSize: 8,
    color: "#999",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 8,
    textAlign: "center",
  },
  grid3: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  gridCard: {
    flex: 1,
    padding: 8,
    borderRadius: 4,
  },
  gridCardGreen: {
    backgroundColor: "#f0fdf4",
  },
  gridCardBlue: {
    backgroundColor: "#eff6ff",
  },
  gridCardRed: {
    backgroundColor: "#fef2f2",
  },
  gridCardTitle: {
    fontSize: 8,
    fontWeight: "bold",
    marginBottom: 4,
  },
  gridCardBadge: {
    fontSize: 7,
    padding: "1 4",
    borderRadius: 999,
    marginBottom: 2,
  },
  scoreChange: {
    fontSize: 10,
    fontWeight: "bold",
    marginTop: 4,
  },
  scoreChangeUp: {
    color: "#166534",
  },
  scoreChangeDown: {
    color: "#991b1b",
  },
  scoreChangeNeutral: {
    color: "#666",
  },
});

function getScoreColor(score: number): string {
  if (score >= 90) return "#16a34a";
  if (score >= 70) return "#ca8a04";
  return "#dc2626";
}

function getRating(score: number): string {
  if (score >= 90) return "Excellent";
  if (score >= 70) return "Good";
  return "Needs Improvement";
}

interface PdfReportProps {
  fileName: string;
  jobRole: string | null;
  keywordSource: string;
  atsScore: number;
  keywords: string | null;
  missingKeywords: string | null;
  suggestions: string | null;
  jobDescription: string | null;
  jdKeywords: string | null;
  aiMissingSkills: string | null;
  aiSuggestions: string | null;
  aiSummary: string | null;
  aiInterviewQuestions: string | null;
  createdAt: string;
  versions?: Array<{
    id: string;
    atsScore: number | null;
    fileName: string;
    createdAt: string;
    keywords: string | null;
  }>;
  currentVersionIndex?: number;
}

export function PdfReport({
  fileName,
  jobRole,
  keywordSource,
  atsScore,
  keywords,
  missingKeywords,
  suggestions,
  jobDescription,
  jdKeywords,
  aiMissingSkills,
  aiSuggestions,
  aiSummary,
  aiInterviewQuestions,
  createdAt,
  versions,
  currentVersionIndex,
}: PdfReportProps) {
  const score = atsScore ?? 0;
  const rating = getRating(score);
  const ratingStyle =
    rating === "Excellent"
      ? styles.ratingExcellent
      : rating === "Good"
        ? styles.ratingGood
        : styles.ratingNeeds;
  const scoreColor = getScoreColor(score);

  const keywordList = keywords?.split(", ").filter(Boolean) || [];
  const missingList = missingKeywords?.split(", ").filter(Boolean) || [];
  const hasAi =
    aiMissingSkills || aiSuggestions || aiSummary || aiInterviewQuestions;

  const totalKw = keywordList.length + missingList.length;

  // Version comparison data
  const isVersioned = versions && versions.length > 1 && currentVersionIndex !== undefined;
  const previousVersion = isVersioned && currentVersionIndex! > 0
    ? versions![currentVersionIndex! - 1]
    : null;

  const currentKw = keywords?.split(", ").filter(Boolean) || [];
  const prevKw = previousVersion?.keywords?.split(", ").filter(Boolean) || [];
  const prevSet = new Set(prevKw);
  const newKw = currentKw.filter(k => !prevSet.has(k));
  const retainedKw = currentKw.filter(k => prevSet.has(k));
  const droppedKw = prevKw.filter(k => !new Set(currentKw).has(k));

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>ATS Resume Report</Text>
          <View style={styles.metaRow}>
            <Text style={styles.subtitle}>{fileName}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Role:</Text>
            <Text style={styles.metaValue}>{jobRole || "N/A"}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Analyzed:</Text>
            <Text style={styles.metaValue}>{new Date(createdAt).toLocaleDateString()}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Source:</Text>
            <Text style={styles.metaValue}>{keywordSource === "jd" ? "Job Description" : "Role Library"}</Text>
          </View>
        </View>

        {/* ATS Score */}
        <View style={styles.scoreSection}>
          <Text style={[styles.scoreNumber, { color: scoreColor }]}>{score}</Text>
          <View style={styles.scoreMeta}>
            <Text style={styles.scoreLabel}>ATS Score</Text>
            <Text style={[styles.rating, ratingStyle]}>{rating}</Text>
          </View>
        </View>

        {/* Version History */}
        {isVersioned && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Version History</Text>
            {versions!.map((v, i) => {
              const vScore = v.atsScore ?? 0;
              const isCurrent = i === currentVersionIndex;
              const versionRowStyle = isCurrent
                ? { ...styles.versionRow, backgroundColor: "#eef2ff" as const }
                : styles.versionRow;
              return (
                <View key={v.id} style={versionRowStyle}>
                  <Text style={[styles.versionScore, { color: getScoreColor(vScore) }]}>{vScore}</Text>
                  <View style={styles.versionInfo}>
                    <Text style={styles.versionLabel}>Version {i + 1}{isCurrent ? " (current)" : ""}</Text>
                    <Text style={styles.versionDate}>{v.fileName} &middot; {new Date(v.createdAt).toLocaleDateString()}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* vs Previous Version */}
        {previousVersion && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>vs Version {currentVersionIndex!} (Previous)</Text>
            <View style={styles.grid3}>
              <View style={[styles.gridCard, styles.gridCardGreen]}>
                <Text style={[styles.gridCardTitle, { color: "#166534" }]}>New ({newKw.length})</Text>
                {newKw.length > 0
                  ? newKw.map(k => <Text key={k} style={[styles.gridCardBadge, { backgroundColor: "#dcfce7", color: "#166534" }]}>{k}</Text>)
                  : <Text style={{ fontSize: 8, color: "#999" }}>None</Text>}
              </View>
              <View style={[styles.gridCard, styles.gridCardBlue]}>
                <Text style={[styles.gridCardTitle, { color: "#1e40af" }]}>Retained ({retainedKw.length})</Text>
                {retainedKw.length > 0
                  ? retainedKw.map(k => <Text key={k} style={[styles.gridCardBadge, { backgroundColor: "#dbeafe", color: "#1e40af" }]}>{k}</Text>)
                  : <Text style={{ fontSize: 8, color: "#999" }}>None</Text>}
              </View>
              <View style={[styles.gridCard, styles.gridCardRed]}>
                <Text style={[styles.gridCardTitle, { color: "#991b1b" }]}>Dropped ({droppedKw.length})</Text>
                {droppedKw.length > 0
                  ? droppedKw.map(k => <Text key={k} style={[styles.gridCardBadge, { backgroundColor: "#fee2e2", color: "#991b1b" }]}>{k}</Text>)
                  : <Text style={{ fontSize: 8, color: "#999" }}>None</Text>}
              </View>
            </View>
            <Text style={[
              styles.scoreChange,
              score > (previousVersion.atsScore ?? 0)
                ? styles.scoreChangeUp
                : score < (previousVersion.atsScore ?? 0)
                  ? styles.scoreChangeDown
                  : styles.scoreChangeNeutral,
            ]}>
              Score change: {score - (previousVersion.atsScore ?? 0) > 0 ? "+" : ""}{score - (previousVersion.atsScore ?? 0)}
            </Text>
          </View>
        )}

        {/* Keyword Match */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, styles.sectionTitleNoAI]}>Keyword Match</Text>
          <Text style={{ fontSize: 10, marginBottom: 6 }}>
            {keywordList.length} of {totalKw} keywords matched
          </Text>
          {keywordList.length > 0 && (
            <View style={styles.keywordRow}>
              {keywordList.map(k => (
                <Text key={k} style={[styles.badge, styles.badgeMatched]}>{k}</Text>
              ))}
            </View>
          )}
        </View>

        {/* Missing Keywords */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, styles.sectionTitleNoAI]}>Missing Keywords</Text>
          {missingList.length > 0 ? (
            <View style={styles.keywordRow}>
              {missingList.map(k => (
                <Text key={k} style={[styles.badge, styles.badgeMissing]}>{k}</Text>
              ))}
            </View>
          ) : (
            <Text style={{ fontSize: 10, color: "#166534" }}>No missing keywords!</Text>
          )}
        </View>

        {/* Improvement Suggestions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, styles.sectionTitleNoAI]}>Suggestions</Text>
          {suggestions ? (
            suggestions.split(". ").filter(Boolean).map((s, i) => (
              <Text key={i} style={styles.listItem}>- {s.replace(/\.$/, "")}</Text>
            ))
          ) : (
            <Text style={{ fontSize: 10, color: "#166534" }}>No suggestions needed.</Text>
          )}
        </View>

        {/* JD Keywords */}
        {jdKeywords && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, styles.sectionTitleNoAI]}>Job Description Keywords</Text>
            <Text style={{ fontSize: 10 }}>{jdKeywords}</Text>
          </View>
        )}

        {/* AI Analysis */}
        {hasAi && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>AI Analysis</Text>

            {aiMissingSkills && (
              <View style={{ marginBottom: 8 }}>
                <Text style={{ fontSize: 10, fontWeight: "bold", marginBottom: 4, color: "#6366f1" }}>Missing Skills</Text>
                <View style={styles.keywordRow}>
                  {aiMissingSkills.split(", ").filter(Boolean).map((s, i) => (
                    <Text key={i} style={[styles.badge, { backgroundColor: "#f0f0ff", color: "#6366f1" }]}>{s}</Text>
                  ))}
                </View>
              </View>
            )}

            {aiSuggestions && (
              <View style={{ marginBottom: 8 }}>
                <Text style={{ fontSize: 10, fontWeight: "bold", marginBottom: 4, color: "#6366f1" }}>Improvement Suggestions</Text>
                {aiSuggestions.split("\n").filter(Boolean).map((s, i) => (
                  <Text key={i} style={styles.listItem}>- {s}</Text>
                ))}
              </View>
            )}

            {aiSummary && (
              <View style={{ marginBottom: 8 }}>
                <Text style={{ fontSize: 10, fontWeight: "bold", marginBottom: 4, color: "#6366f1" }}>Optimized Summary</Text>
                <Text style={styles.summaryText}>{aiSummary}</Text>
              </View>
            )}

            {aiInterviewQuestions && (
              <View style={{ marginBottom: 8 }}>
                <Text style={{ fontSize: 10, fontWeight: "bold", marginBottom: 4, color: "#6366f1" }}>Interview Questions</Text>
                {aiInterviewQuestions.split("\n").filter(Boolean).map((q, i) => (
                  <Text key={i} style={styles.listItem}>Q{i + 1}. {q}</Text>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Footer */}
        <Text style={styles.footer}>Generated by ATS Resume Optimizer</Text>
      </Page>
    </Document>
  );
}
