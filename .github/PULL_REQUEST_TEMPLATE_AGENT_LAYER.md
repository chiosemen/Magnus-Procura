PR CHECKLIST — Agent Layer (Aligned to Spec)

🔐 Agent Layer PR Checklist

Deterministic Core Protection
	•	Agent does NOT write directly to database
	•	Agent does NOT determine compliance
	•	Agent does NOT determine score
	•	All state changes go through tools
	•	All tools call deterministic services only

⸻

Boundary Enforcement
	•	Web does NOT import provider SDK
	•	Web does NOT import scoring-engine
	•	Provider adapters isolated in agent-providers/*
	•	Tool registry enforces schema validation

⸻

Security & RBAC
	•	RBAC enforced for every tool
	•	Tenant boundary validated
	•	Risk-tier enforcement active
	•	Tier 2+ actions require confirmation or approval
	•	No client-side secrets introduced

⸻

Idempotency
	•	scoring.trigger requires idempotency key
	•	Duplicate suppression tested
	•	Tool execution logged with correlation ID

⸻

Observability
	•	Structured logs emitted
	•	AgentRun persisted
	•	Tool calls persisted
	•	Provider + model + prompt_version stored

⸻

Fail-Closed Behavior
	•	Provider failure blocks tool execution
	•	Schema validation failure blocks tool execution
	•	RBAC failure returns structured denial
	•	No silent fallback provider

⸻

Test Coverage
	•	Unit tests for provider parsing
	•	Unit tests for tool schema
	•	Unit tests for RBAC denial
	•	Integration test for read-only AgentRun
	•	Integration test for denied Tier 2 action
	•	Integration test for idempotency suppression
	•	Boundary tests passing

⸻

CI & Governance
	•	CI green
	•	Boundary guard PASS
	•	Governor PASS
	•	Production Readiness Score ≥ 90

⸻

Anti-Patterns Verified Absent
	•	No schema-less tool execution
	•	No implicit role escalation
	•	No silent compliance override
	•	No fallback without logging
	•	No direct DB writes from agent layer

⸻

Final Approval Statement

This PR preserves deterministic governance and introduces no boundary violations.

Reviewer Signature: ___________________

⸻

What You Now Have

You now possess:
	•	A one-shot scaffold generator
	•	A governance-enforced PR gate
	•	A constitutional boundary for agent behavior

This is not “adding AI.”

This is installing a controlled orchestration surface inside enterprise infrastructure.
