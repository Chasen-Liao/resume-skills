# Resume Skills Implementation Plan

## Global constraints

- Keep the project focused on two skills: HTML resume creation and JD-based resume tailoring.
- Preserve existing user changes; do not revert unrelated work.
- Do not commit or push automatically.
- All subagents use model `gpt-5.6-luna`.
- Never invent candidate facts, numbers, skills, employers, dates, or outcomes.
- Keep visual HTML and ATS-safe HTML as separate output modes.
- Verify generated HTML/PDF for semantic completeness, clipping, page count, and text preservation.

## Tasks

1. Add a resume facts contract and evidence-aware content-writing rules.
2. Add deterministic HTML/PDF validation and export helpers with tests.
3. Normalize template semantics, assets, fonts, print behavior, and ATS-safe structure.
4. Rebuild JD tailoring around structured requirements, weighted evidence matching, and change tracking.
5. Integrate SKILL.md, README, package independence, and run full validation.
