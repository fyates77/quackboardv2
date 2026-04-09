# Quackboard

SQL-powered dashboard builder that compiles to standalone web pages. Build dashboards with real SQL, publish them as bespoke websites your stakeholders actually want to use.

**To creators** (BI team): A better authoring tool with real SQL, 21 visualization types, a semantic layer, and full control over the consumer experience.

**To consumers** (stakeholders): Quackboard doesn't exist. They see a polished, purpose-built web page the BI team made for them.

## Key Features

### SQL-First Analytics
- Write real DuckDB SQL (CTEs, window functions, JSON, UNNEST, regex)
- Schema-aware autocomplete in the CodeMirror editor
- Dashboard-level filters with automatic WHERE injection or `{{template}}` syntax for precise control
- Parameters for what-if analysis: sliders, toggles, and dropdowns that feed directly into SQL queries
- **Play Pond** — multi-tab SQL scratchpad with schema browser, execution timing, and CSV/JSON export

### Semantic Layer
- **Models** — named DuckDB VIEWs defined from a table or raw SQL, with labeled dimensions and measures
- **Joins** — visual join builder that generates multi-table VIEWs (inner, left, right, full)
- **Macros** — reusable DuckDB SQL functions; 8 built-in macros (safe_divide, pct_of_total, yoy_growth, running_total, and more)
- All definitions persist to IndexedDB and are re-executed on startup; models and macros are queryable from any dashboard panel

### 21 Visualization Types
**Charts:** Bar, Line, Area, Scatter, Histogram, Box Plot, Heatmap, Waffle, Pie, Density, Difference, Tree, Flow/Arrow, Funnel, Treemap

**Data:** Table, KPI Card

**Content:** Markdown (with template variables), Image, Embed (iframe), HTML

Each chart type has deep configuration: axis labels, grid lines, color schemes (16 palettes), tooltips, crosshairs, trend lines, normalization, rolling windows, faceting, reference lines, scale types, and more.

### Presentation Layer
- **Drilldown system** with breadcrumb navigation and drill-to-data drawers
- **Conditional visibility** — panels show/hide based on filter state or query results
- **Tabs** for multi-view dashboards
- **Parameters** for what-if scenario modeling with live SQL re-execution
- **Cmd+K search palette** for quick panel navigation
- **Markdown panels** with `{{panels.panelId.column}}` template variables for data-driven narratives

### Dashboard Authoring
- Blank-canvas editor — dot-grid background with a centered page, similar to Figma/Webflow
- Drag-and-drop grid layout with panel duplication and inline title editing
- Export/import dashboards as JSON
- CSV/JSON result export per panel

### Local-First Architecture
- Runs entirely in-browser via DuckDB-WASM
- Data never leaves your machine
- IndexedDB persistence (survives page refresh)
- Drop in CSV, Parquet, JSON/JSONL/NDJSON files as data sources

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Browser-only, DuckDB-WASM |
| Framework | React 19, TypeScript, Vite 6 |
| Charting | Observable Plot |
| SQL Editor | CodeMirror 6 |
| Layout | react-grid-layout |
| State | Zustand + IndexedDB persistence |
| Routing | TanStack Router |
| UI | shadcn/ui (Radix + Tailwind 4) |

## Getting Started

```bash
npm install
npm run dev
```

Requires Node.js 18+. The dev server starts at `http://localhost:5173` with COOP/COEP headers enabled for DuckDB-WASM SharedArrayBuffer support.

### Quick Start

1. Navigate to **Data** and drop in a CSV, Parquet, or JSON file
2. (Optional) Go to **Data Tools** to define models, joins, or macros on top of your data
3. Go to **Dashboards** and create a new dashboard
4. Add a panel, write SQL against your tables or models, hit Cmd+Enter
5. Configure the visualization type and column mappings
6. Drag and resize panels to build your layout
7. Use **Play Pond** to explore data ad-hoc with a multi-tab SQL console

## Project Structure

```
src/
  engine/          # DuckDB abstraction (QueryEngine interface + WASM impl + rehydration)
  stores/          # Zustand stores (dashboards, data sources, semantic layer, UI)
  types/           # TypeScript type definitions
  routes/          # TanStack Router file-based routes
  components/
    dashboard/     # Canvas, panels, toolbar, filters, tabs, parameters
    visualizations/# Chart renderer, Observable Plot charts, config
    query/         # SQL editor, results table
    data-sources/  # File drop zone, schema browser
    semantic/      # Models, joins, and macros authoring UI
    play-pond/     # Multi-tab SQL scratchpad
    layout/        # App shell, theme toggle
  lib/             # Utilities, SQL template engine, semantic DDL builders, caching
  hooks/           # Custom hooks (file drop, debounce, resize, auto-run)
```

## Navigation

| Route | Description |
|-------|-------------|
| `/dashboards` | Dashboard list and editor |
| `/data-sources` | Upload and manage data files |
| `/semantic` | Define models, joins, and macros (Data Tools) |
| `/play` | Play Pond — interactive SQL console |
| `/settings` | App settings |

## Roadmap

- **Phases 1–7:** Complete (scaffold, data sources, CRUD, query/viz, polish, viz enhancement, presentation layer)
- **Phase 8:** Semantic layer — models, joins, macros ✓
- **Phase 9:** Canvas redesign — blank-canvas editor feel ✓
- **Phase 10:** Performance & robustness (parallel execution, debouncing, row limits, tests)
- **Phase 11:** Editor/renderer separation
- **Phase 12:** Publish ("export as website")
- **Phase 13:** Query proxy (live data for published dashboards)
- **Phase 14:** Git version control (isomorphic-git, local history, GitHub sync)

## License

MIT
