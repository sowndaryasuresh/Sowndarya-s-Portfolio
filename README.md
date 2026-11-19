# Sowndarya Sureshkumar — Portfolio

[Live portfolio](https://sowndaryasuresh.github.io/Sowndarya-s-Portfolio/) · [Two-page A4 résumé](https://sowndaryasuresh.github.io/Sowndarya-s-Portfolio/assets/Sowndarya-Sureshkumar-Resume.pdf)

Lightweight HTML, CSS and JavaScript. No client framework or production dependencies. All professional content and icons are static. Fonts are self-hosted Latin subsets; original OFL notices are in `assets/fonts/`.

- `index.html`: factual content, conceptual workflow examples and metadata.
- `style.css`: mobile-first design tokens, layouts, motion and accessibility states.
- `app.js`: progressive enhancements, finite workflow animation and event-driven cursor.
- `scripts/build_resume.py`: reproducible two-page A4 PDF with embedded brand fonts; requires `reportlab` and `pypdf`.
- `scripts/qa.cjs`: browser QA under the GitHub Pages base path.
- `docs/role-tailoring.md`: four headline / summary variants and evidence questions.
- `docs/ats-research.md`: hiring-language sources and factual limits.

[Audit, wording changes and verified QA results](docs/audit-and-qa.md)

## Validation

Run `npm ci`, `npx playwright install --with-deps chromium firefox webkit`, then `npm test`. Development dependencies are only used for tests. GitHub Actions also generates mobile Lighthouse reports and screenshots. Automated accessibility testing is not a claim of full WCAG conformance. Field INP is not inferred from laboratory measurements.

GitHub Pages serves the root of `main`. Relative asset URLs preserve `/Sowndarya-s-Portfolio/`. The existing abstract artwork is retained. Recheck resume details when employment or qualifications change.
