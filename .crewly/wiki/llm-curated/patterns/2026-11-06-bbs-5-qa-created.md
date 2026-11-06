---
title: "[[BBS-5]] QA-created"
migrated_from: "agent/qlda-team-fe-developer-690d736f/memory.json"
original_id: "67f3af8d-6b17-43a7-974f-fa7bfcead27b"
original_author: "qlda-team-fe-developer-690d736f"
original_date: "2026-11-06T17:13:49.203Z"
category: "best-practice"
confidence: 0.3
routing_uncertain: false
---

# [[BBS-5]] QA-created

[[BBS-5]] QA-created .env enables VITE_API_URL and exposes hardcoded relative URL expectations in frontend API tests. Failed assertions bypass inline mockRestore, polluting later tests and creating misleading Content-Type failures. Tests should honor configured API origin and restore mocks in afterEach regardless of assertion outcomes.
