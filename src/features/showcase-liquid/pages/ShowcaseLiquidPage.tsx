import { useMemo, useState, type ReactNode } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import InputLabel from "@mui/material/InputLabel";
import FormControl from "@mui/material/FormControl";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Select from "@mui/material/Select";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { ThemeProvider } from "@mui/material/styles";
import AddIcon from "@mui/icons-material/Add";
import ArticleIcon from "@mui/icons-material/Article";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import EditNoteIcon from "@mui/icons-material/EditNote";
import InboxIcon from "@mui/icons-material/Inbox";
import PaletteIcon from "@mui/icons-material/Palette";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import StyleIcon from "@mui/icons-material/Style";
import TableRowsIcon from "@mui/icons-material/TableRows";
import TouchAppIcon from "@mui/icons-material/TouchApp";
import WidgetsIcon from "@mui/icons-material/Widgets";
import {
  AdminTable,
  DetailLayout,
  DetailRow,
  DetailSkeleton,
  EmptyState,
  FormSection,
  StatusPill,
  TableSkeleton,
  type AdminTableColumn,
  type StatusPillTone,
} from "@doublefin/orca-ui";
import { useSubAppRouterBasePath } from "../../../shared/SubAppLink";
import { theme as liquidTheme } from "../../../theme/theme-liquid";
import { LiquidHero } from "../components/LiquidHero";
import { LiquidSectionHeader } from "../components/LiquidSectionHeader";
import { LiquidSectionNav } from "../components/LiquidSectionNav";
import { LiquidStatsStrip } from "../components/LiquidStatsStrip";
import { LiquidTokenSwatches } from "../components/LiquidTokenSwatches";

// -- Types --

type Severity = "CRITICAL" | "WARNING" | "INFO";
type ReviewStatus = "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";
type DocStatus = "INDEXED" | "UPLOADING" | "PROCESSING" | "FAILED";

interface Policy {
  id: string;
  name: string;
  severity: Severity;
  reviewStatus: ReviewStatus;
  docStatus: DocStatus;
  score: number;
  updatedBy: string;
  updatedAt: string;
  active: boolean;
  category: string;
}

// -- Badge Wrappers (tone mapping from styles.md 4.2) --

const SEVERITY_TONE: Record<Severity, StatusPillTone> = {
  CRITICAL: "error",
  WARNING: "warning",
  INFO: "info",
};
const REVIEW_TONE: Record<ReviewStatus, StatusPillTone> = {
  PENDING: "warning",
  RUNNING: "info",
  COMPLETED: "success",
  FAILED: "error",
};
const DOC_TONE: Record<DocStatus, StatusPillTone> = {
  INDEXED: "success",
  UPLOADING: "info",
  PROCESSING: "warning",
  FAILED: "error",
};

function SeverityBadge({ value }: { value: Severity }) {
  return <StatusPill tone={SEVERITY_TONE[value]} label={value} />;
}
function ReviewStatusBadge({ value }: { value: ReviewStatus }) {
  return <StatusPill tone={REVIEW_TONE[value]} label={value} />;
}
function DocStatusBadge({ value }: { value: DocStatus }) {
  return <StatusPill tone={DOC_TONE[value]} label={value} />;
}
function ActiveBadge({ value }: { value: boolean }) {
  return (
    <StatusPill
      tone={value ? "success" : "neutral"}
      label={value ? "Active" : "Inactive"}
    />
  );
}

// -- Pre-generated Data --

const POLICIES: Policy[] = [
  { id: "pol-001", name: "Data Retention Policy", severity: "CRITICAL", reviewStatus: "COMPLETED", docStatus: "INDEXED", score: 92, updatedBy: "alice@corp.io", updatedAt: "2025-07-20", active: true, category: "Compliance" },
  { id: "pol-002", name: "Access Control Standard", severity: "WARNING", reviewStatus: "RUNNING", docStatus: "PROCESSING", score: 74, updatedBy: "bob@corp.io", updatedAt: "2025-07-19", active: true, category: "Security" },
  { id: "pol-003", name: "Incident Response Plan", severity: "CRITICAL", reviewStatus: "PENDING", docStatus: "UPLOADING", score: 45, updatedBy: "carol@corp.io", updatedAt: "2025-07-18", active: false, category: "Operations" },
  { id: "pol-004", name: "Encryption at Rest", severity: "INFO", reviewStatus: "COMPLETED", docStatus: "INDEXED", score: 88, updatedBy: "dave@corp.io", updatedAt: "2025-07-17", active: true, category: "Security" },
  { id: "pol-005", name: "Vendor Risk Assessment", severity: "WARNING", reviewStatus: "FAILED", docStatus: "FAILED", score: 31, updatedBy: "eve@corp.io", updatedAt: "2025-07-16", active: true, category: "Compliance" },
  { id: "pol-006", name: "Cloud Infrastructure Baseline", severity: "INFO", reviewStatus: "COMPLETED", docStatus: "INDEXED", score: 96, updatedBy: "frank@corp.io", updatedAt: "2025-07-15", active: true, category: "Infrastructure" },
  { id: "pol-007", name: "Third-Party Audit Requirements", severity: "CRITICAL", reviewStatus: "RUNNING", docStatus: "PROCESSING", score: 67, updatedBy: "grace@corp.io", updatedAt: "2025-07-14", active: false, category: "Compliance" },
];

// -- Module-level columns (identity-stable) --

const COLUMNS: AdminTableColumn<Policy>[] = [
  { key: "name", label: "Policy", width: "30%", render: (r) => (
    <Typography variant="body2" sx={{ fontWeight: 500 }}>{r.name}</Typography>
  )},
  { key: "severity", label: "Severity", width: 110, render: (r) => <SeverityBadge value={r.severity} /> },
  { key: "reviewStatus", label: "Review", width: 120, render: (r) => <ReviewStatusBadge value={r.reviewStatus} /> },
  { key: "docStatus", label: "Document", width: 120, render: (r) => <DocStatusBadge value={r.docStatus} /> },
  { key: "score", label: "Score", width: 80, align: "right", render: (r) => (
    <StatusPill
      tone={r.score >= 80 ? "success" : r.score >= 60 ? "warning" : "error"}
      label={String(r.score)}
    />
  )},
  { key: "active", label: "Status", width: 100, render: (r) => <ActiveBadge value={r.active} /> },
  { key: "updated", label: "Updated", render: (r) => (
    <Typography variant="caption" color="text.secondary">{r.updatedAt}</Typography>
  )},
];

// -- Anchored section wrapper --

function Section({ id, children }: { id: string; children: ReactNode }) {
  return (
    <Box component="section" id={id} sx={{ scrollMarginTop: "72px", mb: 6 }}>
      {children}
    </Box>
  );
}

// -- Showcase Liquid Page --

export function ShowcaseLiquidPage() {
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loadingDemo, setLoadingDemo] = useState(false);
  const [demoTab, setDemoTab] = useState(0);
  const basePath = useSubAppRouterBasePath();

  const filtered = useMemo(
    () => POLICIES.filter((p) => p.name.toLowerCase().includes(search.toLowerCase())),
    [search]
  );

  const tableStats = useMemo(() => {
    const total = POLICIES.length;
    const critical = POLICIES.filter((p) => p.severity === "CRITICAL").length;
    const running = POLICIES.filter((p) => p.reviewStatus === "RUNNING").length;
    const avgScore = Math.round(POLICIES.reduce((sum, p) => sum + p.score, 0) / total);
    return { total, critical, running, avgScore };
  }, []);

  return (
    <ThemeProvider theme={liquidTheme}>
      <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1200, mx: "auto" }}>
        <LiquidHero />
        <LiquidStatsStrip />
        <LiquidSectionNav />

        {/* -- Colors -- */}
        <Section id="colors">
          <LiquidSectionHeader
            icon={<PaletteIcon fontSize="small" />}
            color="primary"
            title="Color Tokens"
            description="Every surface reads from theme tokens - the palette below is rendered live from useTheme(), so swatches can never drift from the real liquid metal values."
          />
          <LiquidTokenSwatches />
        </Section>

        {/* -- Data Table -- */}
        <Section id="table">
          <LiquidSectionHeader
            icon={<TableRowsIcon fontSize="small" />}
            color="info"
            title="Data Table"
            description="AdminTable owns columns config, loading skeletons, and empty states - the page owns search, summary stats, and row actions."
          />
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              flexWrap: "wrap",
              gap: 2,
              mb: 2,
            }}
          >
            <Box sx={{ display: "flex", gap: 3.5, flexWrap: "wrap" }}>
              <Box>
                <Typography sx={{ fontSize: "1.125rem", fontWeight: 700, lineHeight: 1.25 }}>
                  {tableStats.total}
                </Typography>
                <Typography variant="caption" color="text.secondary">Policies</Typography>
              </Box>
              <Box>
                <Typography sx={{ fontSize: "1.125rem", fontWeight: 700, lineHeight: 1.25, color: "error.dark" }}>
                  {tableStats.critical}
                </Typography>
                <Typography variant="caption" color="text.secondary">Critical</Typography>
              </Box>
              <Box>
                <Typography sx={{ fontSize: "1.125rem", fontWeight: 700, lineHeight: 1.25, color: "info.dark" }}>
                  {tableStats.running}
                </Typography>
                <Typography variant="caption" color="text.secondary">In review</Typography>
              </Box>
              <Box>
                <Typography sx={{ fontSize: "1.125rem", fontWeight: 700, lineHeight: 1.25, color: tableStats.avgScore >= 80 ? "success.dark" : tableStats.avgScore >= 60 ? "warning.dark" : "error.dark" }}>
                  {tableStats.avgScore}
                </Typography>
                <Typography variant="caption" color="text.secondary">Avg score</Typography>
              </Box>
            </Box>
            <TextField
              size="small"
              placeholder="Search policies..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: "text.secondary", fontSize: 18 }} />
                    </InputAdornment>
                  ),
                },
              }}
              sx={{ width: { xs: "100%", sm: 280 } }}
            />
          </Box>
          <AdminTable
            columns={COLUMNS}
            rows={filtered}
            rowKey="id"
            onRowClick={(row) => setSelectedPolicy(row)}
            empty={
              <EmptyState
                icon={<InboxIcon />}
                title="No policies found"
                description="Try adjusting your search or create a new policy."
                action={
                  <Button variant="contained" size="small" startIcon={<AddIcon />}>
                    Create Policy
                  </Button>
                }
              />
            }
          />
        </Section>

        {/* -- Status & Badges -- */}
        <Section id="status">
          <LiquidSectionHeader
            icon={<StyleIcon fontSize="small" />}
            color="success"
            title="Status & Badges"
            description="StatusPill for statuses, outlined Chip for domain tags - tones map by convention (styles.md 4.2), never ad hoc."
          />
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
              gap: 2,
              alignItems: "start",
            }}
          >
            <Paper sx={{ p: 2.5 }}>
              <FormSection title="StatusPill Tones" description="Five tone variants for status indicators">
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                  <StatusPill tone="success" label="Success" />
                  <StatusPill tone="warning" label="Warning" />
                  <StatusPill tone="error" label="Error" />
                  <StatusPill tone="info" label="Info" />
                  <StatusPill tone="neutral" label="Neutral" />
                </Box>
              </FormSection>
              <FormSection title="Domain Tag Chips" description="Entity-type tags use outlined Chip (not StatusPill) with palette-based colors">
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                  <Chip label="Compliance" size="small" variant="outlined" sx={{ borderColor: "primary.main", color: "primary.main" }} />
                  <Chip label="Security" size="small" variant="outlined" sx={{ borderColor: "error.main", color: "error.main" }} />
                  <Chip label="Infrastructure" size="small" variant="outlined" sx={{ borderColor: "info.main", color: "info.main" }} />
                  <Chip label="Operations" size="small" variant="outlined" sx={{ borderColor: "warning.main", color: "warning.main" }} />
                </Box>
              </FormSection>
            </Paper>
            <Paper sx={{ p: 2.5 }}>
              <FormSection title="Badge Wrapper Pattern" description="Domain-specific badge components wrapping StatusPill with tone maps">
                <Typography variant="overline" sx={{ display: "block", mb: 1, color: "text.secondary" }}>
                  Severity
                </Typography>
                <Box sx={{ display: "flex", gap: 1, mb: 2, flexWrap: "wrap" }}>
                  <SeverityBadge value="CRITICAL" />
                  <SeverityBadge value="WARNING" />
                  <SeverityBadge value="INFO" />
                </Box>

                <Typography variant="overline" sx={{ display: "block", mb: 1, color: "text.secondary" }}>
                  Review Status
                </Typography>
                <Box sx={{ display: "flex", gap: 1, mb: 2, flexWrap: "wrap" }}>
                  <ReviewStatusBadge value="PENDING" />
                  <ReviewStatusBadge value="RUNNING" />
                  <ReviewStatusBadge value="COMPLETED" />
                  <ReviewStatusBadge value="FAILED" />
                </Box>

                <Typography variant="overline" sx={{ display: "block", mb: 1, color: "text.secondary" }}>
                  Document Status
                </Typography>
                <Box sx={{ display: "flex", gap: 1, mb: 2, flexWrap: "wrap" }}>
                  <DocStatusBadge value="INDEXED" />
                  <DocStatusBadge value="UPLOADING" />
                  <DocStatusBadge value="PROCESSING" />
                  <DocStatusBadge value="FAILED" />
                </Box>

                <Typography variant="overline" sx={{ display: "block", mb: 1, color: "text.secondary" }}>
                  Active Flags
                </Typography>
                <Box sx={{ display: "flex", gap: 1 }}>
                  <ActiveBadge value={true} />
                  <ActiveBadge value={false} />
                </Box>
              </FormSection>
            </Paper>
          </Box>
        </Section>

        {/* -- Detail Layout -- */}
        <Section id="detail">
          <LiquidSectionHeader
            icon={<ArticleIcon fontSize="small" />}
            color="warning"
            title="Detail Layout"
            description="DetailLayout scaffolds back link, title, status pill, and actions - sections compose below it as children."
          />
          {selectedPolicy ? (
            <DetailLayout
              title={selectedPolicy.name}
              subtitle={`Updated by ${selectedPolicy.updatedBy} on ${selectedPolicy.updatedAt}`}
              backHref={`${basePath}/showcase-liquid`}
              status={<ReviewStatusBadge value={selectedPolicy.reviewStatus} />}
              actions={
                <Box sx={{ display: "flex", gap: 1 }}>
                  <Tooltip title="Edit">
                    <IconButton size="small"><EditIcon fontSize="small" /></IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton size="small" color="error"><DeleteIcon fontSize="small" /></IconButton>
                  </Tooltip>
                </Box>
              }
            >
              <FormSection title="Policy Details">
                <DetailRow label="ID">{selectedPolicy.id}</DetailRow>
                <DetailRow label="Category">
                  <Chip label={selectedPolicy.category} size="small" variant="outlined" />
                </DetailRow>
                <DetailRow label="Severity">
                  <SeverityBadge value={selectedPolicy.severity} />
                </DetailRow>
                <DetailRow label="Document Status">
                  <DocStatusBadge value={selectedPolicy.docStatus} />
                </DetailRow>
                <DetailRow label="Score">
                  <StatusPill
                    tone={selectedPolicy.score >= 80 ? "success" : selectedPolicy.score >= 60 ? "warning" : "error"}
                    label={`${selectedPolicy.score}/100`}
                  />
                </DetailRow>
                <DetailRow label="Active">
                  <ActiveBadge value={selectedPolicy.active} />
                </DetailRow>
              </FormSection>
            </DetailLayout>
          ) : (
            <Paper>
              <EmptyState
                icon={<TouchAppIcon />}
                title="No policy selected"
                description="Click any row in the data table above to preview the detail layout with real data."
                action={
                  <Button variant="outlined" size="small" onClick={() => setSelectedPolicy(POLICIES[0])}>
                    Preview first policy
                  </Button>
                }
              />
            </Paper>
          )}
        </Section>

        {/* -- Forms -- */}
        <Section id="forms">
          <LiquidSectionHeader
            icon={<EditNoteIcon fontSize="small" />}
            color="error"
            title="Forms & Inputs"
            description="Outlined inputs with the liquid metal focus ring - labels always visible above the field, never placeholder-only."
          />
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
              gap: 2,
              alignItems: "start",
            }}
          >
            <Paper sx={{ p: 2.5 }}>
              <FormSection title="Text Fields" description="Standard MUI OutlinedInput with liquid metal theme overrides (13px, white bg, metallic focus ring)">
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <TextField label="Policy Name" size="small" defaultValue="Data Retention Policy" />
                  <TextField label="Description" size="small" multiline minRows={2} defaultValue="Governs how long data is retained across all systems." />
                  <TextField label="Disabled" size="small" disabled defaultValue="Cannot edit this field" />
                </Box>
              </FormSection>
            </Paper>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Paper sx={{ p: 2.5 }}>
                <FormSection title="Select" description="MUI Select with outlined variant">
                  <FormControl size="small" sx={{ minWidth: 200 }}>
                    <InputLabel>Severity</InputLabel>
                    <Select label="Severity" defaultValue="WARNING">
                      <MenuItem value="CRITICAL">Critical</MenuItem>
                      <MenuItem value="WARNING">Warning</MenuItem>
                      <MenuItem value="INFO">Info</MenuItem>
                    </Select>
                  </FormControl>
                </FormSection>
              </Paper>
              <Paper sx={{ p: 2.5 }}>
                <FormSection title="Buttons" description="Contained primary gets the accent gradient + sheen sweep; outlined primary reads as the neutral secondary action">
                  <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                    <Button variant="contained" size="small">Contained</Button>
                    <Button variant="outlined" size="small">Outlined</Button>
                    <Button variant="text" size="small">Text</Button>
                    <Button variant="contained" size="small" disabled>Disabled</Button>
                    <Button variant="outlined" size="small" disabled>Disabled</Button>
                    <Button variant="contained" size="small" color="error">Delete</Button>
                  </Box>
                </FormSection>
              </Paper>
            </Box>
          </Box>
        </Section>

        {/* -- MUI Components -- */}
        <Section id="components">
          <LiquidSectionHeader
            icon={<WidgetsIcon fontSize="small" />}
            color="primary"
            title="MUI Components"
            description="MUI primitives under the Liquid Metal overrides - typography, alerts, dialogs, tooltips, and tabs all inherit the theme."
          />
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
              gap: 2,
              alignItems: "start",
            }}
          >
            <Paper sx={{ p: 2.5 }}>
              <FormSection title="Typography" description="Heading hierarchy and body text with liquid metal theme tokens">
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  <Typography variant="h4">Heading 4</Typography>
                  <Typography variant="h5">Heading 5</Typography>
                  <Typography variant="h6">Heading 6</Typography>
                  <Typography variant="subtitle1">Subtitle 1 - supporting text</Typography>
                  <Typography variant="body1">Body 1 - primary body text for content areas.</Typography>
                  <Typography variant="body2" color="text.secondary">Body 2 - secondary text, smaller and muted.</Typography>
                  <Typography variant="caption" color="text.secondary">Caption - metadata and timestamps</Typography>
                  <Typography variant="overline">Overline - section labels</Typography>
                </Box>
                <Divider sx={{ my: 2 }} />
                <Typography variant="caption" color="text.secondary">
                  The divider above uses the hairline token - glass Papers carry the same border automatically.
                </Typography>
              </FormSection>
            </Paper>
            <Paper sx={{ p: 2.5 }}>
              <FormSection title="Alert" description="MUI Alert with standard severity levels">
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  <Alert severity="info">Informational alert - policy review in progress.</Alert>
                  <Alert severity="warning">Warning - score below threshold.</Alert>
                  <Alert severity="error">Error - document upload failed.</Alert>
                  <Alert severity="success">Success - policy published.</Alert>
                </Box>
              </FormSection>
            </Paper>
            <Paper sx={{ p: 2.5 }}>
              <FormSection title="Dialog & Tooltip" description="Glass overlays + accent-tinted shadow; dark slate micro-tooltips">
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                  <Button variant="outlined" size="small" onClick={() => setDialogOpen(true)}>
                    Open Dialog
                  </Button>
                  <Tooltip title="Refresh data from server">
                    <Button variant="outlined" size="small" startIcon={<RefreshIcon />}>
                      Hover me
                    </Button>
                  </Tooltip>
                  <Tooltip title="Edit this policy">
                    <IconButton size="small"><EditIcon fontSize="small" /></IconButton>
                  </Tooltip>
                </Box>
                <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth>
                  <DialogTitle>Confirm Deletion</DialogTitle>
                  <DialogContent>
                    <Typography variant="body2" color="text.secondary">
                      Are you sure you want to delete this policy? This action cannot be undone.
                    </Typography>
                  </DialogContent>
                  <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button variant="outlined" size="small" onClick={() => setDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button variant="contained" size="small" color="error" onClick={() => setDialogOpen(false)}>
                      Delete
                    </Button>
                  </DialogActions>
                </Dialog>
              </FormSection>
            </Paper>
            <Paper sx={{ p: 2.5 }}>
              <FormSection title="Tabs" description="Underline style, sentence-case 13px tabs, ink when selected">
                <Tabs value={demoTab} onChange={(_, v) => setDemoTab(v)} sx={{ mb: 2 }}>
                  <Tab label="Overview" />
                  <Tab label="Activity" />
                  <Tab label="Settings" />
                </Tabs>
                <Typography variant="body2" color="text.secondary">
                  {[
                    "Overview panel - summary content for the selected policy.",
                    "Activity panel - recent changes and audit events.",
                    "Settings panel - configuration and preferences.",
                  ][demoTab]}
                </Typography>
              </FormSection>
            </Paper>
          </Box>
        </Section>

        {/* -- Loading & Empty States -- */}
        <Section id="states">
          <LiquidSectionHeader
            icon={<AutorenewIcon fontSize="small" />}
            color="info"
            title="Loading & Empty States"
            description="Skeletons keep layouts stable during load - spinners survive only as 16px inline action states."
          />
          <Paper sx={{ p: 2.5, mb: 2 }}>
            <FormSection title="Table Skeleton" description="Standalone table loading placeholder (prefer AdminTable loading prop in real pages)">
              <Button
                variant="outlined"
                size="small"
                onClick={() => { setLoadingDemo(true); setTimeout(() => setLoadingDemo(false), 2000); }}
                sx={{ mb: 2 }}
              >
                Toggle 2s loading
              </Button>
              {loadingDemo ? (
                <TableSkeleton columns={5} rows={4} />
              ) : (
                <Paper sx={{ p: 3, border: "1px solid", borderColor: "divider" }}>
                  <Typography variant="body2" color="text.secondary">
                    Click the button above to see a 2-second table skeleton animation.
                  </Typography>
                </Paper>
              )}
            </FormSection>
          </Paper>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
              gap: 2,
              alignItems: "start",
              mb: 2,
            }}
          >
            <Paper sx={{ p: 2.5 }}>
              <FormSection title="Detail Skeleton" description="Loading placeholder for detail pages">
                <DetailSkeleton lines={6} />
              </FormSection>
            </Paper>
            <Paper sx={{ p: 2.5 }}>
              <FormSection title="Detail Skeleton (with tabs)" description="Tabbed detail page loading state">
                <DetailSkeleton tabs lines={4} />
              </FormSection>
            </Paper>
          </Box>
          <Paper sx={{ p: 2.5, mb: 3 }}>
            <FormSection title="EmptyState" description="Designed empty state with icon, title, description, and action">
              <Paper sx={{ border: "1px solid", borderColor: "divider" }}>
                <EmptyState
                  icon={<InboxIcon />}
                  title="No policies configured"
                  description="Create your first policy to start tracking compliance across your organization."
                  action={
                    <Button variant="contained" size="small" startIcon={<AddIcon />}>
                      Create Policy
                    </Button>
                  }
                />
              </Paper>
            </FormSection>
          </Paper>

          <Alert severity="info">
            This page is the living reference of the Liquid Metal design system - token rules,
            tone mappings, and migration checklists live in skills/orca-fe-liquid/styles.md.
          </Alert>
        </Section>
      </Box>
    </ThemeProvider>
  );
}
