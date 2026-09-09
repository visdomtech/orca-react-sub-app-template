---
name: objects-service-integration
description: "Integrate with the Orca Generic Objects, Types & Records API (`/orcaagents/objects`). All 17 endpoints are canonically documented in the Datamodel Guide → scoped-object-crud.md. This file provides the operation-ID-to-section lookup for the skill resolver."
compatibility: "Orcaagents backend v2+ (Huma OpenAPI compliant)"
---

# Generic Objects Service Integration Guide

> **Delegation guide.** All objects-service endpoints are canonically documented
> in the [Datamodel Guide](../datamodel/SKILL.md), specifically in
> [scoped-object-crud.md](../datamodel/scoped-object-crud.md). This file
> provides the operation-ID → canonical-section lookup so the skill resolver
> finds the right documentation for the `objects` service keyword.

---

## Endpoint Delegation Table

### Object Definitions — Schema CRUD

| Operation ID | Method | Path | Canonical Reference |
|---|---|---|---|
| `listObjects` | `GET` | `/orcaagents/objects` | [scoped-object-crud.md §8.1](../datamodel/scoped-object-crud.md#81-endpoints) |
| `getObject` | `GET` | `/orcaagents/objects/{code}` | [scoped-object-crud.md §8.1](../datamodel/scoped-object-crud.md#81-endpoints) |
| `createObject` | `POST` | `/orcaagents/objects` | [scoped-object-crud.md §8.2](../datamodel/scoped-object-crud.md#82-create-object-body) |
| `updateObject` | `PUT` | `/orcaagents/objects/{code}` | [scoped-object-crud.md §8.1](../datamodel/scoped-object-crud.md#81-endpoints) |
| `deleteObject` | `DELETE` | `/orcaagents/objects/{code}` | [scoped-object-crud.md §8.1](../datamodel/scoped-object-crud.md#81-endpoints) |
| `setObjectStatus` | `POST` | `/orcaagents/objects/{code}/status` | [scoped-object-crud.md §8.1](../datamodel/scoped-object-crud.md#81-endpoints) |

### Object Types — Variant CRUD

| Operation ID | Method | Path | Canonical Reference |
|---|---|---|---|
| `listObjectTypes` | `GET` | `/orcaagents/objects/{code}/types` | [scoped-object-crud.md §9.1](../datamodel/scoped-object-crud.md#91-endpoints) |
| `getObjectType` | `GET` | `/orcaagents/objects/{code}/types/{typeCode}` | [scoped-object-crud.md §9.1](../datamodel/scoped-object-crud.md#91-endpoints) |
| `createObjectType` | `POST` | `/orcaagents/objects/{code}/types` | [scoped-object-crud.md §9.2](../datamodel/scoped-object-crud.md#92-create-object-type-body) |
| `updateObjectType` | `PUT` | `/orcaagents/objects/{code}/types/{typeCode}` | [scoped-object-crud.md §9.1](../datamodel/scoped-object-crud.md#91-endpoints) |
| `deleteObjectType` | `DELETE` | `/orcaagents/objects/{code}/types/{typeCode}` | [scoped-object-crud.md §9.1](../datamodel/scoped-object-crud.md#91-endpoints) |
| `setObjectTypeStatus` | `POST` | `/orcaagents/objects/{code}/types/{typeCode}/status` | [scoped-object-crud.md §9.1](../datamodel/scoped-object-crud.md#91-endpoints) |

### Scoped-Object Records — CRUD

| Operation ID | Method | Path | Canonical Reference |
|---|---|---|---|
| `listObjectRecords` | `GET` | `/orcaagents/objects/{code}/records` | [scoped-object-crud.md §1](../datamodel/scoped-object-crud.md#1-get-orcaagentsobjectscoderecords--list-object-records) |
| `getObjectRecord` | `GET` | `/orcaagents/objects/{code}/records/{codeValue}` | [scoped-object-crud.md §2](../datamodel/scoped-object-crud.md#2-get-orcaagentsobjectscoderecordscodevalue--get-single-record) |
| `createObjectRecord` | `POST` | `/orcaagents/objects/{code}/records` | [scoped-object-crud.md §3](../datamodel/scoped-object-crud.md#3-post-orcaagentsobjectscoderecords--create-record) |
| `updateObjectRecord` | `PUT` | `/orcaagents/objects/{code}/records/{codeValue}` | [scoped-object-crud.md §4](../datamodel/scoped-object-crud.md#4-put-orcaagentsobjectscoderecordscodevalue--update-record) |
| `deleteObjectRecord` | `DELETE` | `/orcaagents/objects/{code}/records/{codeValue}` | [scoped-object-crud.md §5](../datamodel/scoped-object-crud.md#5-delete-orcaagentsobjectscoderecordscodevalue--delete-record) |
| `listScopeRecords` | `GET` | `/orcaagents/objects/scope-records` | [scoped-object-crud.md §6](../datamodel/scoped-object-crud.md#6-get-orcaagentsobjectsscope-records--list-all-records-in-a-scope) |

---

## Error Format

All endpoints return errors as `{ "error": "human-readable description" }`.
See [scoped-object-crud.md §13](../datamodel/scoped-object-crud.md#13-gotchas) for the full error catalogue and gotchas.
