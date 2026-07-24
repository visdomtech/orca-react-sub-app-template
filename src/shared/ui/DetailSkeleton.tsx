import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";

export interface DetailSkeletonProps {
  /** Render the tab-bar strip (tabbed detail pages). Default false. */
  tabs?: boolean;
  /** Content line count. Default 5. */
  lines?: number;
}

export function DetailSkeleton({ tabs = false, lines = 5 }: DetailSkeletonProps) {
  return (
    <Box role="progressbar" aria-label="Loading details" sx={{ maxWidth: 600 }}>
      <Skeleton variant="text" width={120} height={32} />
      <Skeleton variant="text" width={220} height={40} />
      <Skeleton variant="text" width={160} />
      {tabs && (
        <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
          <Skeleton variant="rounded" width={80} height={40} />
          <Skeleton variant="rounded" width={80} height={40} />
          <Skeleton variant="rounded" width={80} height={40} />
        </Stack>
      )}
      <Stack spacing={1} sx={{ mt: 2 }}>
        {Array.from({ length: lines }, (_, i) => (
          <Skeleton key={i} variant="text" />
        ))}
      </Stack>
    </Box>
  );
}
