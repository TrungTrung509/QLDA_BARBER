# Project vault — SCHEMA.md
# Bootstrapped by wiki-migrate per v2.1 spec §1(C).

vault_scope: project
vault_id: project

hardcoded:
  - path: memory/
    frozen: true
    description: "Project-scoped facts agents share. Replaces scattered .crewly/knowledge/learnings.md."
    referenced_by:
      - skill:remember
      - skill:recall

  - path: sop-overrides/
    frozen: true
    description: "Project-specific SOP deltas. get-sops reads team-vault sop/ first, then this override layer."
    referenced_by:
      - skill:get-sops

  - path: okr/
    frozen: true
    description: "Authored OKR narrative for this project. Mirrors approved Missions; agents read-only, Steve authors."
    referenced_by:
      - service:okr-cascade.service

llm_curated:
  - path: llm-curated/
    frozen: false
    seed_subdirs:
      - decisions
      - patterns
      - people
      - log.md
      - index.md
    llm_can_create_subdirs: true
    lint_may_restructure: true

write_policy:
  canonical:
    - team-leader
    - orchestrator
  proposed_only:
    - worker
    - researcher
  schema_writer:
    - steve
    - architect
