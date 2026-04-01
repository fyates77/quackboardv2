# Quackboard — Investor Pitch Deck

---

## Slide 1: Cover

**Quackboard**
*The SQL-Powered Dashboard Builder That Ships Websites, Not Screenshots*

---

## Slide 2: The Problem — Data Teams

**Your data team is stuck in the last decade.**

- Business intelligence tools were designed for a world before the modern data stack
- Data engineers write SQL, manage dbt models, and think in Git — then hand off to Tableau and lose all control
- Dashboard authoring is disconnected from the workflows data teams already use
- The result: brittle, unversioned, ungoverned dashboards that nobody fully owns

**The tools haven't kept up. The data teams have.**

---

## Slide 3: The Problem — Stakeholders

**Your stakeholders deserve better than a login screen.**

- Every major BI tool delivers dashboards the same way: a proprietary viewer behind an account wall
- Sharing means provisioning licenses, managing access, and onboarding people into software they didn't ask for
- The output looks like software — grids, toolbar chrome, export buttons — not a polished presentation of your work
- Leaders, clients, and boards don't want a BI tool. They want answers, beautifully presented.

**The audience for your data has changed. The delivery format hasn't.**

---

## Slide 4: The Insight

**A dashboard should be a website.**

Every other artifact in the modern stack is a first-class deliverable:
- Code ships as a product
- Design ships as a prototype
- Data transformations ship as versioned models

**Dashboards ship as... a link to someone else's software.**

Quackboard changes this. Every dashboard you build is also a website — brandable, publishable, shareable via URL, no login required.

---

## Slide 5: The Solution

**Quackboard is a SQL-powered dashboard builder that compiles dashboards to standalone web pages.**

- Write real SQL against your data
- Build dashboards with 21+ visualization types, full branding controls, and web-native layout components
- Publish as a self-contained website — no backend, no per-seat licensing, no proprietary viewer
- Built on DuckDB, the fastest-growing query engine in the modern data ecosystem

**For data teams who think in code. For stakeholders who think in design.**

---

## Slide 6: Value Proposition — Data Teams & Developers

**Quackboard is built for how data teams actually work.**

- **Real SQL, always.** No drag-and-drop abstraction layer. CTEs, window functions, JSON, regex — full DuckDB dialect.
- **Schema-aware autocomplete.** CodeMirror 6 editor with intelligent hints from your actual data schema.
- **Git-native by design.** Dashboards are portable JSON artifacts that live in your repo, get reviewed in PRs, and deploy via CI/CD. *(Roadmap)*
- **Filters and parameters as first-class citizens.** Dynamic WHERE injection, what-if sliders, cross-panel filtering — all driven by SQL.
- **The modern data stack's missing piece.** dbt handles transforms. Quackboard handles presentation. Same workflow, same tools, same team.
- **DuckDB foundation.** Query CSV, Parquet, and JSON locally at in-memory speed. Cloud data sources on the roadmap via MotherDuck integration.

---

## Slide 7: Value Proposition — Business Stakeholders & Consumers

**Quackboard dashboards don't look like dashboards.**

- **Branded, bespoke presentation.** Custom fonts, colors, spacing, and layout — dashboards that match your brand, not Tableau's.
- **Web-native components.** Navigation bars, branded headers, prose narratives with live data interpolation, embedded content. Website anatomy, not BI tool anatomy.
- **A URL, not a login.** Published dashboards are standalone web pages. Share a link. Anyone can view it. No accounts, no software to install.
- **Narrative + data in one canvas.** Combine charts with live-updating text: *"Revenue grew {{panels.kpi.growth}}% this quarter, driven by..."*
- **Consumer view.** A clean, editing-free presentation mode purpose-built for the audience, not the author.
- **Interactive without complexity.** Drilldowns, cross-filtering, tabs, and parameter controls give stakeholders interactivity without exposing them to a BI tool.

---

## Slide 8: Key Differentiator — Publish to Static Site

**The feature that incumbents cannot copy.**

| Capability | Tableau | QuickSight | Metabase | Quackboard |
|---|---|---|---|---|
| Share via URL (no login) | ✗ | ✗ | Limited | ✓ |
| Self-contained static export | ✗ | ✗ | ✗ | ✓ |
| Embed anywhere (no SDK licensing) | ✗ | Paid add-on | ✗ | ✓ |
| Custom branding | Limited | Limited | Limited | Full |

Tableau, QuickSight, and Metabase are subscription businesses. Letting dashboards escape their viewer would undermine their licensing model. They are structurally prevented from building this.

**Quackboard can. And does.**

---

## Slide 9: Feature Overview

**A complete dashboard authoring platform.**

**Visualization (21 types)**
- Bar, Line, Area, Scatter, Histogram, Box, Heatmap, Waffle, Combo
- Pie/Donut, Funnel (with conversion rates), Treemap/Sunburst, Network Graph
- Sortable Data Table, Grouped Table (subtotals/totals), Crosstab/Pivot
- KPI Card with threshold rules

**Content & Layout**
- Markdown panels with live data interpolation
- HTML, Image, and Embed (iframe) panels
- Navigation bar with brand slot, dropdowns, and nested items
- Branded site header with logo, nav links, and last-updated timestamp
- Drag-and-drop 12-column grid layout with scroll layout option

**Interactivity**
- Cross-panel click-to-filter
- Multi-level drilldown with breadcrumb navigation
- What-if parameters (sliders, dropdowns, toggles)
- Dashboard-level filters with automatic SQL injection
- Conditional panel visibility based on filter state
- Tab groups for multi-page dashboards
- Cmd+K search palette

**Data**
- CSV, Parquet, JSON/JSONL/NDJSON file upload
- Schema browser with column type inference
- In-memory query caching and result deduplication
- Full IndexedDB persistence — survives page refresh

---

## Slide 10: Tech Stack

**Built on the modern data stack's best tools.**

| Layer | Technology | Why It Matters |
|---|---|---|
| **Query Engine** | DuckDB-WASM | Full SQL in the browser, no server required. The fastest-growing analytical query engine in the ecosystem. |
| **Framework** | React 19 + TypeScript (strict) | Modern, type-safe, production-grade frontend foundation. |
| **State Management** | Zustand + IndexedDB | Lightweight, persistent, designed for complex UI state. |
| **Charting** | Observable Plot + D3 | The standard for expressive, code-driven data visualization. |
| **SQL Editor** | CodeMirror 6 | Industry-standard editor with schema-aware autocomplete. |
| **Routing** | TanStack Router | File-based, type-safe routing with first-class code splitting. |
| **UI Components** | shadcn/ui (Radix + Tailwind v4) | Accessible, composable primitives with full design control. |
| **Build** | Vite 8 | Sub-second HMR, optimized production builds. |

**No proprietary lock-in. Every dependency is best-in-class open source.**

---

## Slide 11: Architecture

**Local-first. Backend-optional. Built to scale.**

```
┌─────────────────────────────────────────────────────┐
│                   Browser Runtime                    │
│                                                      │
│  ┌──────────────┐    ┌─────────────────────────┐    │
│  │  Dashboard   │    │      QueryEngine         │    │
│  │   Authoring  │───▶│  (Abstraction Interface) │    │
│  │  (React UI)  │    └────────────┬────────────┘    │
│  └──────────────┘                 │                  │
│                          ┌────────▼────────┐         │
│  ┌──────────────┐        │  DuckDB-WASM    │         │
│  │   Zustand    │        │  (Web Worker)   │         │
│  │    Stores    │        │                 │         │
│  │  + IndexedDB │        │  CSV / Parquet  │         │
│  └──────────────┘        │  JSON / NDJSON  │         │
│                          └─────────────────┘         │
└─────────────────────────────────────────────────────┘
                           │
                    ┌──────▼──────┐
                    │  Published  │
                    │ Static Site │
                    │  (Any CDN)  │
                    └─────────────┘
```

**The `QueryEngine` interface is the key architectural decision.**
Today it wraps DuckDB-WASM. Tomorrow it wraps MotherDuck, Snowflake, BigQuery, or a query proxy — without changing a single line of dashboard or visualization code.

**The abstraction future-proofs every connector on the roadmap.**

---

## Slide 12: The QueryEngine Abstraction

**One interface. Infinite backends.**

```typescript
interface QueryEngine {
  query(sql: string): Promise<QueryResult>
  registerFile(name: string, buffer: ArrayBuffer): Promise<void>
  getSchema(): Promise<SchemaInfo>
}
```

Current implementation: `DuckDBWasmEngine`
Roadmap implementations:
- `MotherDuckEngine` — DuckDB in the cloud, same dialect, zero friction
- `SnowflakeProxyEngine` — Push-down queries, return Arrow results
- `BigQueryProxyEngine`
- `SalesforceEngine`

**The connector roadmap is an engineering execution problem, not an architecture problem. The foundation is already there.**

---

## Slide 13: Competitive Landscape

**The BI market is large, crowded, and ripe for disruption.**

| | Tableau | QuickSight | Metabase | Superset | Evidence.dev | **Quackboard** |
|---|---|---|---|---|---|---|
| **Target User** | Business analyst | AWS data teams | SQL + no-code | Data engineers | Data engineers | SQL power users |
| **SQL-first** | Partial | Partial | Partial | ✓ | ✓ | ✓ |
| **Live DB connections** | ✓ | ✓ | ✓ | ✓ | ✓ | Roadmap |
| **Static publish** | ✗ | ✗ | ✗ | ✗ | ✓ | ✓ |
| **Custom branding** | Limited | Limited | Limited | Limited | Limited | **Full** |
| **No login to view** | ✗ | ✗ | ✗ | ✗ | Partial | ✓ |
| **Git-native** | ✗ | ✗ | ✗ | ✗ | ✓ | Roadmap |
| **Local-first / private data** | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ |
| **Pricing** | $70-115/user/mo | $18+/user/mo | Free/Paid | Free | Free/Paid | TBD |

---

## Slide 14: vs. Tableau

**Tableau is the incumbent. It's also showing its age.**

**What Tableau does well:**
- Best-in-class drag-and-drop for non-technical users
- Deep enterprise governance (SSO, row-level security, audit logs)
- 100+ connectors, 20 years of polish
- Strong brand recognition in enterprise procurement

**Where Tableau is vulnerable:**
- **Price**: $70–$115/user/month. Organizations are actively looking for off-ramps.
- **Salesforce acquisition drag**: Product velocity has slowed measurably since 2019. Customers feel it.
- **Developer hostile**: No Git, no code review, no CI/CD. The modern data team doesn't want to work this way.
- **Dashboards are trapped**: Every output lives behind Tableau's viewer. Sharing means buying more licenses.
- **Looks like Tableau**: Every dashboard is instantly recognizable as a Tableau dashboard. No bespoke presentation possible.

**Quackboard's wedge**: Data teams who have outgrown Tableau's workflow and stakeholders who deserve presentation-quality output without the per-seat cost.

---

## Slide 15: vs. QuickSight

**QuickSight is aggressive on price. It's also deeply AWS-dependent.**

**What QuickSight does well:**
- Native AWS integration (S3, Redshift, Athena, RDS — zero friction)
- SPICE in-memory engine for fast dashboard loading
- Embedded analytics at competitive pricing
- Pay-per-session model for external sharing

**Where QuickSight is vulnerable:**
- **AWS lock-in**: Weak experience outside the AWS ecosystem. Multi-cloud is increasingly the enterprise reality.
- **UX lags the market**: Chart types are limited, customization is minimal, the editor feels dated.
- **SPICE friction**: Dataset size caps, quirky refresh behavior, and manual extract management frustrate data teams.
- **Generic output**: Dashboards look like QuickSight dashboards. No brand expression.
- **Embedded complexity**: The embedded SDK requires significant engineering effort and licensing overhead.

**Quackboard's wedge**: Teams not fully committed to AWS, and any use case where the output needs to look like *your product*, not Amazon's.

---

## Slide 16: vs. Metabase & Superset

**The open source incumbents: powerful but aging.**

**Metabase:**
- Strong bottoms-up adoption via free tier
- Good GUI query builder for non-SQL users
- Self-hosted or cloud, reasonable pricing
- Weakness: GUI-first means SQL power users hit walls. No static publish. No Git. Dashboards are trapped in the Metabase viewer.

**Apache Superset:**
- SQL-first, highly configurable, free
- Strong semantic layer and explore mode
- Weakness: Notoriously hard to self-host and maintain. Complex setup is a real barrier. No publish story. No web design layer.

**Quackboard's wedge vs. both**: Git-native workflow, static publish, and a design layer that makes outputs presentable to non-technical audiences — without the self-hosting complexity.

---

## Slide 17: vs. Evidence.dev

**Evidence is the closest philosophical cousin. The differences matter.**

Evidence.dev compiles Markdown + SQL into static data sites — a similar "dashboards as websites" concept with real traction and VC backing.

**Where Evidence leads today:**
- Live database connections (Snowflake, BigQuery, DuckDB, etc.)
- Markdown-first authoring — feels like writing a document
- Strong developer community, growing fast

**Where Quackboard differentiates:**
- **Visual authoring**: Quackboard has a full drag-and-drop dashboard builder. Evidence requires writing Markdown and code — it's a developer tool, not an analyst tool.
- **Richer interactivity**: Cross-filtering, drilldown, parameters, tab groups — Quackboard's interaction model is significantly more advanced.
- **Web design layer**: Nav bars, branded headers, full theming — Quackboard's output can look like a product. Evidence outputs look like a document.
- **Local-first**: Quackboard works with local files, no database connection required. Evidence needs a configured data source.

**The gap**: Evidence has live DB connections today. Quackboard is closing that gap. The interaction model and design layer are Quackboard's durable advantages.

---

## Slide 18: Market Opportunity

**Three overlapping markets, each substantial.**

**1. Business Intelligence & Analytics Tools**
~$35B global market (2024), growing at ~12% CAGR
- Dominated by Tableau, QuickSight, Power BI, Metabase
- Increasing demand for SQL-first, developer-friendly tooling

**2. Embedded Analytics**
~$60B addressable by 2030
- Every SaaS product eventually needs analytics for its customers
- Current solutions (Tableau Embedded, QuickSight Q) are expensive and complex
- Quackboard's static publish model is a fundamentally cheaper and simpler alternative

**3. Modern Data Stack Tooling**
~$10B+ and growing fastest
- dbt, Fivetran, Snowflake, Databricks have created a generation of SQL-native data teams
- The presentation layer — dashboards — hasn't been rebuilt for this world
- This is Quackboard's most defensible home

**The highest-conviction bet**: Own the presentation layer of the modern data stack the way dbt owns the transformation layer.

---

## Slide 19: Go-To-Market Strategy

**Bottoms-up, developer-led. The playbook that built the modern data stack.**

**Phase 1 — Land with data teams (Now)**
- Free tier, open core, or low-cost self-hosted
- Target analytics engineers, data engineers, and SQL-fluent analysts
- The same audience that adopted dbt, Metabase, and Superset from the ground up
- Content marketing: "Dashboards as code", "Your stakeholders deserve a URL not a login"

**Phase 2 — Expand to stakeholder value (6–12 months)**
- The data team lands Quackboard, stakeholders love the output
- Natural expansion: more dashboards, more users, more data sources
- Publish-to-website story drives organic sharing and word-of-mouth

**Phase 3 — Enterprise motion (12–24 months)**
- Team collaboration, SSO, and governance features unlock top-down sales
- Git-native workflow appeals to engineering-led organizations
- Displacement of Tableau in organizations with active cost-reduction mandates

---

## Slide 20: Roadmap

**A clear path from prototype to platform.**

**Now — Foundation Complete**
- ✅ Full SQL dashboard authoring (DuckDB-WASM)
- ✅ 21 visualization types with deep configuration
- ✅ Cross-filtering, drilldown, parameters, tabs
- ✅ Web design layer (nav bar, site header, theming, custom branding)
- ✅ Consumer view (clean read-only presentation mode)
- ✅ Local file support (CSV, Parquet, JSON)

**Near-term — Make It Shippable**
- 🔲 Publish to static site (one-click export to self-contained web page)
- 🔲 Git integration (dashboards as versioned files, branch/deploy via CI)
- 🔲 First live connector (MotherDuck — DuckDB in the cloud, zero new dialect)

**Medium-term — Make It a Platform**
- 🔲 Cloud data source connectors (Snowflake, BigQuery, Redshift)
- 🔲 Team collaboration (shared workspaces, comments, access control)
- 🔲 Salesforce + SaaS API connectors
- 🔲 AI-assisted query generation and chart recommendation

**Long-term — Own the Category**
- 🔲 Enterprise governance (SSO, row-level security, audit logs)
- 🔲 Embedded analytics SDK (white-label dashboards in your product)
- 🔲 Semantic layer (reusable metrics, governed definitions)
- 🔲 Scheduled refresh and alerting

---

## Slide 21: The Thesis

**The modern data stack rebuilt the entire data pipeline — except the last mile.**

dbt → versioned, code-reviewed, CI/CD-deployed transformations
Fivetran/Airbyte → reliable, observable data ingestion
Snowflake/BigQuery → scalable, SQL-native storage and compute

**And then... Tableau. A tool built in 2003.**

The presentation layer — the part stakeholders actually see — has not been rebuilt for the world that exists today. It still requires licenses, proprietary viewers, and outputs that look like software tools rather than polished communications.

**Quackboard rebuilds the last mile.**

SQL-native. Git-native. Ships websites, not screenshots. Built on DuckDB — the query engine the modern data stack is already converging on.

**The data team's tools have grown up. Their dashboards should too.**

---

## Slide 22: Ask

**[To be completed by team]**

- Funding amount
- Use of proceeds breakdown
- Team slide
- Traction / metrics to date
- Contact information

---

*Quackboard — Every dashboard is a website.*
