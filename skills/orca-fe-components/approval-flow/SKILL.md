---
name: add-approval-flow
description: Add an approval workflow UI to any object in an Orca sub-app using the ApprovalFlow component injected by the host.
---

# Add ApprovalFlow to a Sub-App

The host (OrcaAgents) injects the `ApprovalFlow` component into every sub-app as a prop on `OrcaApp`. Your sub-app receives it via `OrcaHostContext` — no npm install, no federation config.

---

## How it works

```
Host renders: <YourApp basename={...} ApprovalFlow={ApprovalFlow} />
                                        ↓
OrcaApp puts it in OrcaHostContext
                                        ↓
Any page calls: const { ApprovalFlow } = useOrcaHost()
```

---

## Step 1 — Access ApprovalFlow in a page

```tsx
import { useOrcaHost } from "../../../shared/OrcaHostContext";

export function MyDetailPage() {
  const { ApprovalFlow } = useOrcaHost();

  if (!ApprovalFlow) return null; // not running inside the host

  return (
    <ApprovalFlow
      objectType="my_object_type"
      objectId={itemId}
      currentUserId={currentUserEmail}
      onApproved={() => refetch()}
      onRejected={() => refetch()}
    />
  );
}
```

---

## Props reference

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `objectType` | `string` | Yes | Unique identifier for this kind of object (e.g. `"expense_report"`). Use snake_case, consistent across your app. |
| `objectId` | `string` | Yes | The ID of the specific record being approved. |
| `definitionId` | `number` | No | ID of a pre-configured approval blueprint from the host admin UI. |
| `phases` | `ApprovalPhaseSpec[]` | No | Inline phase config — use when you don't have a `definitionId`. |
| `currentUserId` | `string` | No | Email of the current user. Highlights their row and shows Approve/Reject buttons. |
| `onApproved` | `() => void` | No | Called when the process reaches APPROVED. |
| `onRejected` | `() => void` | No | Called when the process reaches REJECTED. |
| `adminMode` | `boolean` | No | Shows admin controls (add/remove approvers, change thresholds). |
| `displayMode` | `"full" \| "compact"` | No | `"compact"` renders only a status chip. Default: `"full"`. |

Either `definitionId` or `phases` must be provided for the approval process to be bootstrapped. If neither is provided, the component shows "No approval process configured."

---

## Using inline phases (no definitionId)

```tsx
<ApprovalFlow
  objectType="expense_report"
  objectId={report.id}
  currentUserId={user.email}
  phases={[
    { approvers: ["manager@company.com"], minRequiredApprovers: 1 },
    { approvers: ["finance@company.com", "cfo@company.com"], minRequiredApprovers: 1 },
  ]}
  onApproved={() => setStatus("approved")}
  onRejected={() => setStatus("rejected")}
/>
```

---

## Compact status chip

Use `displayMode="compact"` to show only a small colored status badge, e.g. in a table row or list item:

```tsx
<ApprovalFlow
  objectType="expense_report"
  objectId={report.id}
  displayMode="compact"
/>
```

---

## Guard for standalone dev

`ApprovalFlow` is `undefined` when the sub-app runs standalone (`bun run dev`) because the host isn't present. Always guard before rendering:

```tsx
const { ApprovalFlow } = useOrcaHost();

// Option A — skip the section entirely
if (!ApprovalFlow) return <p>Approval not available in standalone mode.</p>;

// Option B — conditional render inline
{ApprovalFlow && (
  <ApprovalFlow objectType="my_type" objectId={id} currentUserId={email} />
)}
```

---

## TypeScript types

These types are defined in `src/shared/OrcaHostContext.tsx` — import from there, not from the host.

```ts
import type { ApprovalFlowProps, ApprovalPhaseSpec } from "../../../shared/OrcaHostContext";
```

---

## Register your object types for admin binding

When registering your app in the host's Sub-App Registry (`/orca/sysadmin/apps`), fill in the **Approval Object Types** field so your object types appear in the Approval Flows bindings table (`/orca/admin/approval-flows`). Admins can then assign a definition to each object type without touching your code.

**Format** — one entry per line, `objectType:Label`:

```
expense_report:Expense Report
purchase_order:Purchase Order
```

- `objectType` must match exactly what you pass to `<ApprovalFlow objectType="..." />` in your code
- `Label` is the human-readable name shown in the admin UI

Without this registration step, your object types still work (approvals run) but admins can't configure a default definition for them through the UI.
