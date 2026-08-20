---
name: proxy-service-integration
description: "Integrate with the Orca External RSS Proxy API (`/orcaagents/proxy`). Operations: forwardProxyRequest."
compatibility: "Orcaagents backend v2+ (Huma OpenAPI compliant)"
---

# RSS Proxy Service Integration Guide

The **Proxy Service** securely fetches and proxies external RSS news feeds and legal regulatory updates from government departments (DOL, EEOC, NY DOL, CA LWDA, WA ESD) to avoid browser CORS restrictions.

---

## 1. Overview & Scope

- **Route Prefix**: `/orcaagents/proxy`
- **Base URL**: Set via `ORCA_API_BASE` or defaults to `/orcaagents/proxy`
- **Auth & RBAC**: None (unauthenticated — no JWT or role check required)
- **Key Responsibilities**:
  - Secure outbound RSS fetching with server-side caching and timeout
  - CORS-compliant feed content delivery to the frontend

---

## 2. Endpoint Reference Table

| Method | Path | Operation ID | Request Type | Response Type | Description |
|---|---|---|---|---|---|
| `GET` | `/orcaagents/proxy/name/{name}/forward` | `forwardProxyRequest` | `{ name: string }` | `ProxyResponse` | Fetches and forwards external RSS feed |

### Supported Proxy Identifiers
- `rss-dol`: US Department of Labor releases (`https://www.dol.gov/rss/releases.xml`)
- `rss-eeoc`: EEOC newsroom (`https://www.eeoc.gov/rss/newsroom`)
- `rss-nydol`: New York State Department of Labor (`https://dol.ny.gov/rss.xml`)
- `rss-calwda`: California Labor and Workforce Development (`https://www.labor.ca.gov/feed/`)
- `rss-waesd`: Washington Employment Security Department (`https://esd.wa.gov/rss.xml`)

---

## 3. TypeScript Interfaces & Enums

```typescript
export interface ProxyResponseData {
  statusCode: number;
  body: string; // Raw XML RSS feed content
}

export interface ProxyResponse {
  success: boolean;
  data: ProxyResponseData;
}
```

---

## 4. Client SDK / Integration Functions

```typescript
import { orcaFetch } from '../common';

export const proxyClient = {
  /**
   * Fetch external RSS feed content by proxy name.
   */
  async fetchFeed(name: 'rss-dol' | 'rss-eeoc' | 'rss-nydol' | 'rss-calwda' | 'rss-waesd' | string): Promise<string> {
    const res = await orcaFetch<ProxyResponse>(`/orcaagents/proxy/name/${encodeURIComponent(name)}/forward`, {
      method: 'GET',
    });
    return res.data.body;
  },
};
```

---

## 5. Code Examples & Real-World Flows

### Flow: Parsing Live Regulatory News Feeds
```typescript
import { proxyClient } from './proxyClient';

async function loadDOLLatestNews() {
  const xmlText = await proxyClient.fetchFeed('rss-dol');
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
  const items = xmlDoc.querySelectorAll('item');

  return Array.from(items).map((item) => ({
    title: item.querySelector('title')?.textContent,
    link: item.querySelector('link')?.textContent,
    pubDate: item.querySelector('pubDate')?.textContent,
    description: item.querySelector('description')?.textContent,
  }));
}
```

---

## 6. Common Gotchas & Edge Cases

1. **XML Parsing**: The response body is a raw XML string. Parse it using `DOMParser` or an XML parser library in the browser.
2. **Invalid Proxy Name**: Requesting an unregistered proxy name returns HTTP 404.
