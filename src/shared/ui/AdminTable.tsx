import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Skeleton from "@mui/material/Skeleton";
import type { SxProps, Theme } from "@mui/material/styles";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import type { ReactNode } from "react";

export interface AdminTableColumn<T> {
  /** Stable React key for the column. Not a path into T — composite columns are expected. */
  key: string;
  label?: ReactNode;
  align?: "left" | "center" | "right";
  /** Applied to the header cell via the plain style attribute (no emotion serialization). */
  width?: number | string;
  render: (row: T) => ReactNode;
}

export interface AdminTableProps<T> {
  /** Define at module level in the page (identity-stable). */
  columns: AdminTableColumn<T>[];
  rows: T[];
  /** Id field on T (e.g. "userAccountId"). Required — index keys break under infinite-scroll append. */
  rowKey: keyof T;
  /** Real headers + skeleton body rows in the same table shell (no layout jump). */
  loading?: boolean;
  /** Rendered in a full-width row when !loading && rows.length === 0. Pass <EmptyState/>. */
  empty: ReactNode;
  onRowClick?: (row: T) => void;
  /** Below the table, inside the same Paper — Load-more button or pagination. */
  footer?: ReactNode;
  /** Skeleton body rows while loading. Default 8. */
  skeletonRows?: number;
}

// Hoisted: serialized once per theme, shared by every clickable row of every table.
const CLICKABLE_ROW_SX: SxProps<Theme> = { cursor: "pointer" };

export function AdminTable<T>({
  columns,
  rows,
  rowKey,
  loading = false,
  empty,
  onRowClick,
  footer,
  skeletonRows = 8,
}: AdminTableProps<T>) {
  return (
    <Paper>
      <TableContainer {...(loading ? { role: "progressbar", "aria-label": "Loading table" } : {})}>
        <Table size="small">
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={column.key}
                  align={column.align}
                  style={column.width === undefined ? undefined : { width: column.width }}
                >
                  {column.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              Array.from({ length: skeletonRows }, (_, rowIndex) => (
                <TableRow key={rowIndex}>
                  {columns.map((column) => (
                    <TableCell key={column.key} align={column.align}>
                      <Skeleton variant="text" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length}>{empty}</TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow
                  key={String(row[rowKey])}
                  hover={onRowClick !== undefined}
                  sx={onRowClick === undefined ? undefined : CLICKABLE_ROW_SX}
                  onClick={onRowClick === undefined ? undefined : () => onRowClick(row)}
                >
                  {columns.map((column) => (
                    <TableCell key={column.key} align={column.align}>
                      {column.render(row)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      {footer && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 1.5, borderTop: 1, borderColor: "divider" }}>
          {footer}
        </Box>
      )}
    </Paper>
  );
}
