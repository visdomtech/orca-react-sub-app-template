import Paper from "@mui/material/Paper";
import Skeleton from "@mui/material/Skeleton";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";

export interface TableSkeletonProps {
  columns: number;
  /** Body skeleton rows. Default 8 — approximate first-viewport height; pass the page size if known. */
  rows?: number;
}

/** Standalone table loading placeholder. For data tables prefer AdminTable's `loading` prop,
 * which keeps the real headers visible. */
export function TableSkeleton({ columns, rows = 8 }: TableSkeletonProps) {
  return (
    <Paper>
      <TableContainer role="progressbar" aria-label="Loading table">
        <Table size="small">
          <TableHead>
            <TableRow>
              {Array.from({ length: columns }, (_, i) => (
                <TableCell key={i}>
                  <Skeleton variant="text" width="60%" />
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {Array.from({ length: rows }, (_, r) => (
              <TableRow key={r}>
                {Array.from({ length: columns }, (_, c) => (
                  <TableCell key={c}>
                    <Skeleton variant="text" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}
