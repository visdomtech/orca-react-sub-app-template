---
name: governance-service-integration
description: "Integrate with the Orca HR AI Governance Document Generation Service (`/orcaagents/orca/governance`). Operations: generateGovernanceContent."
compatibility: "Orcaagents backend v2+ (Huma OpenAPI compliant)"
---

# HR AI Governance Service Integration Guide

The **HR AI Governance Service** generates compliant HR artificial intelligence policy disclosures, evaluation narratives, and risk assessment documentation powered by Gemini LLMs.

---

## 1. Overview & Scope

- **Route Prefix**: `/orcaagents/orca/governance`
- **Base URL**: Set via `ORCA_API_BASE` or defaults to `/orcaagents/orca/governance`
- **Auth & RBAC**: Authenticated workspace users
- **Key Responsibilities**:
  - LLM-assisted document generation for HR AI governance frameworks
  - Automatic audit logging of generation actions

---

## 2. Endpoint Reference Table

| Method | Path | Operation ID | Request Type | Response Type | Description |
|---|---|---|---|---|---|
| `POST` | `/orcaagents/orca/governance/generate` | `generateGovernanceContent` | `GovernanceGenerateRequest` | `GovernanceGenerateResponse` | Generates HR AI governance document text |

---

## 3. TypeScript Interfaces & Enums

```typescript
export interface GovernanceGenerateRequest {
  prompt: string;
  type: 'evaluation_summary' | 'risk_assessment' | 'policy_clause' | string;
}

export interface GovernanceGenerateResponse {
  data: {
    text: string;
  };
}
```

---

## 4. Client SDK / Integration Functions

```typescript
import { orcaFetch } from '../common';

export const governanceClient = {
  /**
   * Generate HR AI governance policy content using LLM.
   */
  async generateContent(req: GovernanceGenerateRequest): Promise<string> {
    const res = await orcaFetch<GovernanceGenerateResponse>('/orcaagents/orca/governance/generate', {
      method: 'POST',
      body: JSON.stringify(req),
    });
    return res.data.text;
  },
};
```

---

## 5. Code Examples & Real-World Flows

### Flow: Generating an AI Vendor Risk Summary
```typescript
import { governanceClient } from './governanceClient';

async function createVendorRiskSummary(vendorName: string, features: string[]) {
  const prompt = `Draft an HR AI governance risk assessment for vendor ${vendorName} implementing features: ${features.join(', ')}.`;
  const summary = await governanceClient.generateContent({
    prompt,
    type: 'risk_assessment',
  });
  console.log('Generated Governance Document:\n', summary);
}
```

---

## 6. Common Gotchas & Edge Cases

1. **Timeout Handling**: Generation uses Gemini with up to 5-minute timeout. Ensure client timeout is configured appropriately.
2. **Audit Tracking**: Every generation call automatically records an audit log entry with `entityType: governance` and `action: create`.
