---
name: structuredlaw-service-integration
description: "Integrate with the Orca Structured Law Catalog & Regulation Linkage API (`/orcaagents/structuredlaws`). Operations: listStructuredLaws, linkRegulationToLaw, unlinkRegulationFromLaw."
compatibility: "Orcaagents backend v2+ (Huma OpenAPI compliant)"
---

# Structured Law Service Integration Guide

The **Structured Law Service** exposes codified laws and statutes stored in Firestore alongside relational mappings (`orca.structure_law_links`) linking structured laws to source regulation documents.

---

## 1. Overview & Scope

- **Route Prefix**: `/orcaagents/structuredlaws`
- **Handler**: `handler/web/structuredlaw_handler.go`
- **Base URL**: Set via `ORCA_API_BASE` or defaults to `/orcaagents/structuredlaws`
- **Auth & RBAC**:
  - `GET /orcaagents/structuredlaws`: Authenticated workspace users
  - Link/Unlink operations: Requires **`ADMIN`** or **`SYSTEM_ADMIN`** role
- **Key Responsibilities**:
  - Structured statute/code catalog browsing
  - Bi-directional linking between codified law records and regulation upload sources

---

## 2. Endpoint Reference Table

| Method | Path | Operation ID | Request Type | Response Type | Description |
|---|---|---|---|---|---|
| `GET` | `/orcaagents/structuredlaws` | `listStructuredLaws` | `void` | `StructuredLaw[]` | Lists all structured laws with linked regulation IDs |
| `POST` | `/orcaagents/structuredlaws/{lawId}/regulations/{regulationId}/link` | `linkRegulationToLaw` | `{ lawId: string, regulationId: number }` | `OkResponse` | Links a regulation to a structured law (Admin) |
| `POST` | `/orcaagents/structuredlaws/{lawId}/regulations/{regulationId}/unlink` | `unlinkRegulationFromLaw` | `{ lawId: string, regulationId: number }` | `OkResponse` | Unlinks a regulation from a structured law (Admin) |

---

## 3. TypeScript Interfaces & Enums

```typescript
export interface StructureLawMeta {
  title?: string;
  url?: string;
  contentFormat?: string;
  pdfFilename?: string;
}

export interface StructuredLaw {
  lawId: string;              // Document ID in Firestore
  name: string;
  meta?: StructureLawMeta;
  regulationIds: number[];    // Relational links in PostgreSQL
}
```

---

## 4. Client SDK / Integration Functions

```typescript
import { orcaFetch } from '../common';

export const structuredLawClient = {
  /**
   * List all structured laws and their linked regulation IDs.
   */
  async listLaws(): Promise<StructuredLaw[]> {
    return orcaFetch<StructuredLaw[]>('/orcaagents/structuredlaws', {
      method: 'GET',
    });
  },

  /**
   * Link a regulation source document to a structured law record.
   */
  async linkRegulation(lawId: string, regulationId: number): Promise<void> {
    await orcaFetch(`/orcaagents/structuredlaws/${encodeURIComponent(lawId)}/regulations/${regulationId}/link`, {
      method: 'POST',
    });
  },

  /**
   * Unlink a regulation source document from a structured law record.
   */
  async unlinkRegulation(lawId: string, regulationId: number): Promise<void> {
    await orcaFetch(`/orcaagents/structuredlaws/${encodeURIComponent(lawId)}/regulations/${regulationId}/unlink`, {
      method: 'POST',
    });
  },
};
```

---

## 5. Code Examples & Real-World Flows

### Flow: Linking a Freshly Extracted Regulation to Its Statute
```typescript
import { structuredLawClient } from './structuredLawClient';

async function associateRegulationWithLaw(statuteDocId: string, newRegulationId: number) {
  await structuredLawClient.linkRegulation(statuteDocId, newRegulationId);
  console.log(`Regulation #${newRegulationId} successfully linked to statute ${statuteDocId}`);
}
```

---

## 6. Common Gotchas & Edge Cases

1. **Law ID Format**: `lawId` is the Firestore document identifier (often URL-encoded or contains punctuation). Always encode the path parameter.
2. **Idempotent Linking**: Linking an already-linked regulation is idempotent (`ON CONFLICT DO NOTHING`).
