import { useMemo, useState } from "react";
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
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import InboxIcon from "@mui/icons-material/Inbox";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import {
  AdminTable,
  DetailLayout,
  DetailRow,
  DetailSkeleton,
  EmptyState,
  FormSection,
  PageHeader,
  StatusPill,
  TableSkeleton,
  type AdminTableColumn,
  type StatusPillTone,
} from "@doublefin/orca-ui";

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

// -- Showcase Page --

export function ShowcasePage() {
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loadingDemo, setLoadingDemo] = useState(false);

  const filtered = useMemo(
    () => POLICIES.filter((p) => p.name.toLowerCase().includes(search.toLowerCase())),
    [search]
  );

  return (
    <Box sx={{ p: 3, maxWidth: 1100 }}>
      <PageHeader
        title="Mercury Console Showcase"
        subtitle="Design system component reference - all kit elements and common MUI components"
        backHref="/"
        actions={
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button variant="outlined" size="small" startIcon={<RefreshIcon />}>
              Refresh
            </Button>
            <Button variant="contained" size="small" startIcon={<AddIcon />}>
              New Policy
            </Button>
          </Box>
        }
      />

      {/* -- Section 1: AdminTable -- */}
      <FormSection title="Admin Table" description="Data table with columns config, row click, search, and status badges">
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
          sx={{ mb: 2, maxWidth: 320 }}
        />
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
      </FormSection>

      {/* -- Section 2: Tabs for remaining demos -- */}
      <Box sx={{ mb: 3, borderBottom: 1, borderColor: "divider" }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label="Status & Badges" />
          <Tab label="Detail View" />
          <Tab label="Forms & Inputs" />
          <Tab label="MUI Components" />
          <Tab label="Skeletons" />
        </Tabs>
      </Box>

      {/* -- Tab 0: Status & Badges -- */}
      {tab === 0 && (
        <Box sx={{ mb: 4 }}>
          <FormSection title="StatusPill Tones" description="Five tone variants for status indicators">
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }}>
              <StatusPill tone="success" label="Success" />
              <StatusPill tone="warning" label="Warning" />
              <StatusPill tone="error" label="Error" />
              <StatusPill tone="info" label="Info" />
              <StatusPill tone="neutral" label="Neutral" />
            </Box>
          </FormSection>

          <FormSection title="Badge Wrapper Pattern" description="Domain-specific badge components wrapping StatusPill with tone maps">
            <Typography variant="overline" sx={{ display: "block", mb: 1, color: "text.secondary" }}>
              Severity
            </Typography>
            <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
              <SeverityBadge value="CRITICAL" />
              <SeverityBadge value="WARNING" />
              <SeverityBadge value="INFO" />
            </Box>

            <Typography variant="overline" sx={{ display: "block", mb: 1, color: "text.secondary" }}>
              Review Status
            </Typography>
            <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
              <ReviewStatusBadge value="PENDING" />
              <ReviewStatusBadge value="RUNNING" />
              <ReviewStatusBadge value="COMPLETED" />
              <ReviewStatusBadge value="FAILED" />
            </Box>

            <Typography variant="overline" sx={{ display: "block", mb: 1, color: "text.secondary" }}>
              Document Status
            </Typography>
            <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
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

          <FormSection title="Domain Tag Chips" description="Entity-type tags use outlined Chip (not StatusPill) with palette-based colors">
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              <Chip label="Compliance" size="small" variant="outlined" sx={{ borderColor: "primary.main", color: "primary.main" }} />
              <Chip label="Security" size="small" variant="outlined" sx={{ borderColor: "error.main", color: "error.main" }} />
              <Chip label="Infrastructure" size="small" variant="outlined" sx={{ borderColor: "info.main", color: "info.main" }} />
              <Chip label="Operations" size="small" variant="outlined" sx={{ borderColor: "warning.main", color: "warning.main" }} />
            </Box>
          </FormSection>
        </Box>
      )}

      {/* -- Tab 1: Detail View -- */}
      {tab === 1 && (
        <Box sx={{ mb: 4 }}>
          {selectedPolicy ? (
            <DetailLayout
              title={selectedPolicy.name}
              subtitle={`Updated by ${selectedPolicy.updatedBy} on ${selectedPolicy.updatedAt}`}
              backHref="/showcase"
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
            <Paper sx={{ p: 3, border: "1px solid", borderColor: "divider" }}>
              <Typography variant="body2" color="text.secondary">
                Click a row in the table above to view its detail layout here.
              </Typography>
            </Paper>
          )}
        </Box>
      )}

      {/* -- Tab 2: Forms & Inputs -- */}
      {tab === 2 && (
        <Box sx={{ mb: 4, maxWidth: 560 }}>
          <FormSection title="Text Fields" description="Standard MUI OutlinedInput with theme overrides (13px, white bg, focus ring)">
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <TextField label="Policy Name" size="small" defaultValue="Data Retention Policy" />
              <TextField label="Description" size="small" multiline minRows={2} defaultValue="Governs how long data is retained across all systems." />
              <TextField label="Disabled" size="small" disabled defaultValue="Cannot edit this field" />
            </Box>
          </FormSection>

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

          <FormSection title="Buttons" description="Contained (accent), outlined (neutral secondary), and text variants">
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              <Button variant="contained" size="small">Contained</Button>
              <Button variant="outlined" size="small">Outlined</Button>
              <Button variant="text" size="small">Text</Button>
              <Button variant="contained" size="small" disabled>Disabled</Button>
              <Button variant="outlined" size="small" disabled>Disabled</Button>
              <Button variant="contained" size="small" color="error">Delete</Button>
            </Box>
          </FormSection>
        </Box>
      )}

      {/* -- Tab 3: MUI Components -- */}
      {tab === 3 && (
        <Box sx={{ mb: 4 }}>
          <FormSection title="Typography" description="Heading hierarchy and body text with theme tokens">
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
          </FormSection>

          <FormSection title="Alert" description="MUI Alert with standard severity levels">
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <Alert severity="info">Informational alert - policy review in progress.</Alert>
              <Alert severity="warning">Warning - score below threshold.</Alert>
              <Alert severity="error">Error - document upload failed.</Alert>
              <Alert severity="success">Success - policy published.</Alert>
            </Box>
          </FormSection>

          <FormSection title="Dialog" description="OVERLAY_SHADOW + hairline border + 12px radius (theme-owned)">
            <Button variant="outlined" size="small" onClick={() => setDialogOpen(true)}>
              Open Dialog
            </Button>
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

          <FormSection title="Tooltip" description="Dark slate micro-tooltip (11px, weight 500, 6px radius)">
            <Box sx={{ display: "flex", gap: 2 }}>
              <Tooltip title="Refresh data from server">
                <Button variant="outlined" size="small" startIcon={<RefreshIcon />}>
                  Hover me
                </Button>
              </Tooltip>
              <Tooltip title="Edit this policy">
                <IconButton size="small"><EditIcon fontSize="small" /></IconButton>
              </Tooltip>
            </Box>
          </FormSection>

          <FormSection title="Divider & Paper" description="Hairline borders, elevation-0 Paper with auto-border">
            <Paper sx={{ p: 2, mb: 1 }}>
              <Typography variant="body2">Elevation-0 Paper with automatic hairline border.</Typography>
            </Paper>
            <Divider sx={{ my: 2 }} />
            <Typography variant="caption" color="text.secondary">Divider above uses the hairline token.</Typography>
          </FormSection>
        </Box>
      )}

      {/* -- Tab 4: Skeletons -- */}
      {tab === 4 && (
        <Box sx={{ mb: 4 }}>
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

          <FormSection title="Detail Skeleton" description="Loading placeholder for detail pages">
            <DetailSkeleton lines={6} />
          </FormSection>

          <FormSection title="Detail Skeleton (with tabs)" description="Tabbed detail page loading state">
            <DetailSkeleton tabs lines={4} />
          </FormSection>

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
        </Box>
      )}
    </Box>
  );
}
