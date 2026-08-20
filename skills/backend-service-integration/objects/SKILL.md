---
name: objects-service-integration
description: "Integrate with the Orca Generic Objects & Types API (`/orcaagents/objects`). Operations: listObjects, getObject, createObject, updateObject, deleteObject, setObjectStatus, listObjectTypes, getObjectType, createObjectType, updateObjectType, deleteObjectType, setObjectTypeStatus."
compatibility: "Orcaagents backend v2+ (Huma OpenAPI compliant)"
---

# Generic Objects & Types Service Integration Guide

The **Generic Objects Service** manages extensible domain object definitions (`orca.objects`) and per-object variants (`orca.object_types`). It features hierarchical system/tenant inheritance, shadow-row overrides, and UI editor layouts.

---

## 1. Overview & Scope

- **Route Prefix**: `/orcaagents/objects`
- **Base URL**: Set via `ORCA_API_BASE` or defaults to `/orcaagents/objects`
- **Auth & RBAC**:
  - `GET`: Authenticated workspace users (sees system objects + workspace shadow overrides)
  - `POST` / `PUT` / `DELETE`: Requires **`SYSTEM_ADMIN`** role
- **Key Responsibilities**:
  - Generic entity schema definition and layout metadata
  - Object type variants, behavior flags, and validation rules catalog
  - System vs Workspace scope inheritance with `?scope=` query filter

---

## 2. Endpoint Reference Table

| Method | Path | Operation ID | Request Type | Response Type | Description |
|---|---|---|---|---|---|
| `GET` | `/orcaagents/objects` | `listObjects` | `?scope=...` | `GenericObject[]` | Lists objects with tenant shadow resolution |
| `GET` | `/orcaagents/objects/{code}` | `getObject` | `?scope=...` | `GenericObject` | Gets object definition by code |
| `POST` | `/orcaagents/objects` | `createObject` | `CreateObjectRequest` | `GenericObject` | Creates a new object definition (System Admin) |
| `PUT` | `/orcaagents/objects/{code}` | `updateObject` | `UpdateObjectRequest` | `GenericObject` | Updates an object definition (System Admin) |
| `DELETE` | `/orcaagents/objects/{code}` | `deleteObject` | `?scope=...` | `OkResponse` | Deletes an object (System Admin) |
| `POST` | `/orcaagents/objects/{code}/status` | `setObjectStatus` | `SetStatusRequest` | `GenericObject` | Sets object status (System Admin) |
| `GET` | `/orcaagents/objects/{code}/types` | `listObjectTypes` | `?scope=...` | `ObjectType[]` | Lists types for an object with tenant override |
| `GET` | `/orcaagents/objects/{code}/types/{typeCode}` | `getObjectType` | `?scope=...` | `ObjectType` | Gets specific object type by code |
| `POST` | `/orcaagents/objects/{code}/types` | `createObjectType` | `CreateObjectTypeRequest` | `ObjectType` | Creates an object type variant (System Admin) |
| `PUT` | `/orcaagents/objects/{code}/types/{typeCode}` | `updateObjectType` | `UpdateObjectTypeRequest` | `ObjectType` | Updates an object type variant (System Admin) |
| `DELETE` | `/orcaagents/objects/{code}/types/{typeCode}` | `deleteObjectType` | `?scope=...` | `OkResponse` | Deletes an object type (System Admin) |
| `POST` | `/orcaagents/objects/{code}/types/{typeCode}/status` | `setObjectTypeStatus` | `SetStatusRequest` | `ObjectType` | Sets object type status (System Admin) |

---

## 3. TypeScript Interfaces & Enums

```typescript
export interface GenericObject {
  objectId: string;           // int64 serialized as string
  workspaceId: string | null;
  code: string;
  name: string;
  idAttribute: string;
  status: 'ACTIVE' | 'DISABLED';
  scope: string;
  createdAt: string;
  updatedAt: string;
}

export interface ObjectType {
  objectTypeId: string;       // int64 serialized as string
  workspaceId: string | null;
  objectCode: string;
  code: string;
  name: string;
  layout: Record<string, any> | null;
  behaviors: Record<string, any> | null;
  rules: Record<string, any> | null;
  status: 'ACTIVE' | 'DISABLED';
  sortOrder: number;
  scope: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateObjectRequest {
  code: string;
  name: string;
  idAttribute?: string;
  scope?: string;
}

export interface UpdateObjectRequest {
  name: string;
  idAttribute?: string;
}

export interface CreateObjectTypeRequest {
  objectCode?: string;    // Set from path param by server
  code: string;
  name: string;
  layout?: Record<string, any>;
  behaviors?: Record<string, any>;
  rules?: Record<string, any>;
  sortOrder?: number;
  scope?: string;
}

export interface UpdateObjectTypeRequest {
  name: string;
  layout?: Record<string, any>;
  behaviors?: Record<string, any>;
  rules?: Record<string, any>;
  sortOrder?: number;     // Nullable — only sent when explicitly changing
}

export interface SetStatusRequest {
  status: 'ACTIVE' | 'DISABLED';
}

export interface OkResponse {
  status: string;
}
```

---

## 4. Client SDK / Integration Functions

```typescript
import { orcaFetch } from '../common';

export const objectsClient = {
  /**
   * List all objects available to the workspace.
   */
  async listObjects(scope?: string): Promise<GenericObject[]> {
    const qs = scope ? `?scope=${encodeURIComponent(scope)}` : '';
    return orcaFetch<GenericObject[]>(`/orcaagents/objects${qs}`, {
      method: 'GET',
    });
  },

  /**
   * Get an object definition by its code.
   */
  async getObject(code: string, scope?: string): Promise<GenericObject> {
    const qs = scope ? `?scope=${encodeURIComponent(scope)}` : '';
    return orcaFetch<GenericObject>(`/orcaagents/objects/${encodeURIComponent(code)}${qs}`, {
      method: 'GET',
    });
  },

  /**
   * Create a new object definition (System Admin).
   */
  async createObject(req: CreateObjectRequest): Promise<GenericObject> {
    return orcaFetch<GenericObject>('/orcaagents/objects', {
      method: 'POST',
      body: JSON.stringify(req),
    });
  },

  /**
   * Update an existing object definition (System Admin).
   */
  async updateObject(code: string, req: UpdateObjectRequest, scope?: string): Promise<GenericObject> {
    const qs = scope ? `?scope=${encodeURIComponent(scope)}` : '';
    return orcaFetch<GenericObject>(`/orcaagents/objects/${encodeURIComponent(code)}${qs}`, {
      method: 'PUT',
      body: JSON.stringify(req),
    });
  },

  /**
   * Delete an object (System Admin).
   */
  async deleteObject(code: string, scope?: string): Promise<OkResponse> {
    const qs = scope ? `?scope=${encodeURIComponent(scope)}` : '';
    return orcaFetch<OkResponse>(`/orcaagents/objects/${encodeURIComponent(code)}${qs}`, {
      method: 'DELETE',
    });
  },

  /**
   * Set object status (System Admin).
   */
  async setObjectStatus(code: string, status: 'ACTIVE' | 'DISABLED', scope?: string): Promise<GenericObject> {
    const qs = scope ? `?scope=${encodeURIComponent(scope)}` : '';
    return orcaFetch<GenericObject>(`/orcaagents/objects/${encodeURIComponent(code)}/status${qs}`, {
      method: 'POST',
      body: JSON.stringify({ status }),
    });
  },

  /**
   * List types for a given object.
   */
  async listObjectTypes(objectCode: string, scope?: string): Promise<ObjectType[]> {
    const qs = scope ? `?scope=${encodeURIComponent(scope)}` : '';
    return orcaFetch<ObjectType[]>(`/orcaagents/objects/${encodeURIComponent(objectCode)}/types${qs}`, {
      method: 'GET',
    });
  },

  /**
   * Get an object type variant.
   */
  async getObjectType(objectCode: string, typeCode: string, scope?: string): Promise<ObjectType> {
    const qs = scope ? `?scope=${encodeURIComponent(scope)}` : '';
    return orcaFetch<ObjectType>(`/orcaagents/objects/${encodeURIComponent(objectCode)}/types/${encodeURIComponent(typeCode)}${qs}`, {
      method: 'GET',
    });
  },

  /**
   * Create an object type variant (System Admin).
   */
  async createObjectType(objectCode: string, req: CreateObjectTypeRequest): Promise<ObjectType> {
    return orcaFetch<ObjectType>(`/orcaagents/objects/${encodeURIComponent(objectCode)}/types`, {
      method: 'POST',
      body: JSON.stringify(req),
    });
  },

  /**
   * Update an object type variant (System Admin).
   */
  async updateObjectType(objectCode: string, typeCode: string, req: UpdateObjectTypeRequest, scope?: string): Promise<ObjectType> {
    const qs = scope ? `?scope=${encodeURIComponent(scope)}` : '';
    return orcaFetch<ObjectType>(`/orcaagents/objects/${encodeURIComponent(objectCode)}/types/${encodeURIComponent(typeCode)}${qs}`, {
      method: 'PUT',
      body: JSON.stringify(req),
    });
  },

  /**
   * Delete an object type (System Admin).
   */
  async deleteObjectType(objectCode: string, typeCode: string, scope?: string): Promise<OkResponse> {
    const qs = scope ? `?scope=${encodeURIComponent(scope)}` : '';
    return orcaFetch<OkResponse>(`/orcaagents/objects/${encodeURIComponent(objectCode)}/types/${encodeURIComponent(typeCode)}${qs}`, {
      method: 'DELETE',
    });
  },

  /**
   * Set object type status (System Admin).
   */
  async setObjectTypeStatus(objectCode: string, typeCode: string, status: 'ACTIVE' | 'DISABLED', scope?: string): Promise<ObjectType> {
    const qs = scope ? `?scope=${encodeURIComponent(scope)}` : '';
    return orcaFetch<ObjectType>(`/orcaagents/objects/${encodeURIComponent(objectCode)}/types/${encodeURIComponent(typeCode)}/status${qs}`, {
      method: 'POST',
      body: JSON.stringify({ status }),
    });
  },
};
```

---

## 5. Query & Path Parameters

| Endpoint | Parameter | Location | Type | Required | Description |
|---|---|---|---|---|---|
| `listObjects` | `scope` | query | `string` | no | Scope filter |
| `getObject` | `code` | path | `string` | yes | Object code |
| `getObject` | `scope` | query | `string` | no | Scope filter |
| `updateObject` | `code` | path | `string` | yes | Object code |
| `updateObject` | `scope` | query | `string` | no | Scope filter |
| `deleteObject` | `code` | path | `string` | yes | Object code |
| `deleteObject` | `scope` | query | `string` | no | Scope filter |
| `setObjectStatus` | `code` | path | `string` | yes | Object code |
| `setObjectStatus` | `scope` | query | `string` | no | Scope filter |
| `listObjectTypes` | `code` | path | `string` | yes | Object code |
| `listObjectTypes` | `scope` | query | `string` | no | Scope filter |
| `getObjectType` | `code` | path | `string` | yes | Object code |
| `getObjectType` | `typeCode` | path | `string` | yes | Type code |
| `getObjectType` | `scope` | query | `string` | no | Scope filter |
| `updateObjectType` | `code` | path | `string` | yes | Object code |
| `updateObjectType` | `typeCode` | path | `string` | yes | Type code |
| `updateObjectType` | `scope` | query | `string` | no | Scope filter |
| `deleteObjectType` | `code` | path | `string` | yes | Object code |
| `deleteObjectType` | `typeCode` | path | `string` | yes | Type code |
| `deleteObjectType` | `scope` | query | `string` | no | Scope filter |
| `setObjectTypeStatus` | `code` | path | `string` | yes | Object code |
| `setObjectTypeStatus` | `typeCode` | path | `string` | yes | Type code |
| `setObjectTypeStatus` | `scope` | query | `string` | no | Scope filter |

---

## 6. SSE/Binary

No SSE or binary endpoints in this service. All responses are JSON.

---

## 7. Error Scenarios

| HTTP Status | Condition | Details |
|---|---|---|
| `400` | Invalid status value | Bad request |
| `400` | Immutable field change attempt | `"immutable field"` |
| `400` | Validation failure | `"objects: validation failed"` |
| `400` | Unknown rule type | `"objects: unknown rule type"` |
| `400` | Unknown behavior type | `"objects: unknown behavior type"` |
| `400` | Invalid rule/behavior/layout payload | Specific validation message |
| `401` | Missing or invalid auth token | `"authentication required"` |
| `403` | Non-SYSTEM_ADMIN calling write endpoints | `"SYSTEM_ADMIN role required"` |
| `403` | Attempting to modify system-reserved object | `"system-reserved"` |
| `404` | Object or type not found | `"not found"` |
| `404` | Scope not found | `"objects: scope not found"` |
| `409` | Duplicate code on create | `"duplicate code"` |
| `409` | Delete object/type that is in use | `"in use"` |
| `500` | Database or unexpected error | Internal server error |

### Key Behaviors

1. **Shadow-Row Semantics**: When a workspace defines an object or type with the same code as a `SYSTEM` record, the workspace row shadows/overrides the system row for that workspace.
2. **In-Use Checks**: Deleting an object type that is actively referenced by live entities returns HTTP 409 Conflict.
3. **ID Serialization**: `objectId` and `objectTypeId` are int64 values serialized as JSON strings (e.g., `"12345"`) due to the `json:",string"` tag.
4. **System-Reserved Protection**: Builtin objects (`employee`, `requisition`) cannot be deleted.
