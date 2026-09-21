## What changed

<!-- What this PR does, and why. Link the issue or task if there is one. -->

## Security reasoning

<!-- Required. Answer in your own words BEFORE implementation, not after.
     "None" is only acceptable if this touches no input, no authorization
     decision, no secret, no RLS policy and no external call. -->

**What are the security risks of this approach, and how does this change avoid them?**

Relevant OWASP categories (delete those that do not apply):
- [ ] A01 Broken Access Control
- [ ] A02 Cryptographic Failures
- [ ] A03 Injection
- [ ] A04 Insecure Design
- [ ] A05 Security Misconfiguration
- [ ] A06 Vulnerable Components
- [ ] A07 Authentication Failures
- [ ] A08 Data Integrity Failures
- [ ] A09 Logging & Monitoring Failures
- [ ] A10 SSRF
- [ ] None — this change touches none of the above

## Policy checklist

Per `docs/SECURITY-POLICY.md`:

- [ ] No secret is reachable from browser-delivered code (S1)
- [ ] Any new table has `ENABLE` + `FORCE ROW LEVEL SECURITY` and a policy (S2)
- [ ] No hardcoded credentials; secrets arrive by injection (S3)
- [ ] External input is Zod-validated at the trust boundary (S5)
- [ ] All SQL is parameterised (S6)
- [ ] Security controls fail closed (S8)
- [ ] New features ship with tests (S9)
- [ ] Schema changes are proven by execution, not by matching migration text (S10)

## Invariants

- [ ] `docs/INVARIANTS.md` is unchanged by this PR, **or** updated with proof for any invariant it touches

## Verification

<!-- What you actually ran, and what it printed. Not what you expect to pass. -->

- [ ] `pnpm db:setup && pnpm test && pnpm test:invariants` passes locally
- [ ] For security controls: the test was confirmed to FAIL with the control removed
