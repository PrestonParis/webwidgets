# Traversal Report

**Generated:** 2026-05-20T23:20:05.915Z

## Summary

| Metric            | Value |
| ----------------- | ----- |
| Total Routes      | 2     |
| Successful        | 0 ✓   |
| Failed            | 2 ✗   |
| Skipped           | 0 ⊘   |
| Average Load Time | 85ms  |

## Failures by Category

| Category | Count |
| -------- | ----- |
| critical | 2     |

## Slowest Routes

| Route      | Duration |
| ---------- | -------- |
| /dashboard | 116ms    |
| /          | 53ms     |

## Route Details

### ✗ /

**Load Duration:** 53ms
**Category:** core
**Priority:** critical

**Failures:**

- 🔴 [critical] page.goto: NS_ERROR_CONNECTION_REFUSED
  Call log:
  [2m - navigating to "http://localhost:3000/", waiting until "load"[22m
  (error)

---

### ✗ /dashboard

**Load Duration:** 116ms
**Category:** core
**Priority:** critical

**Failures:**

- 🔴 [critical] page.goto: NS_ERROR_CONNECTION_REFUSED
  Call log:
  [2m - navigating to "http://localhost:3000/dashboard", waiting until "load"[22m
  (error)

---
