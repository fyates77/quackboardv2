# Quackboard

SQL-powered dashboard builder that compiles to standalone web pages. Build dashboards with real SQL, publish them as bespoke websites your stakeholders actually want to use.

**To creators** (BI team): A better authoring tool with real SQL, 21 visualization types, and full control over the consumer experience.

**To consumers** (stakeholders): Quackboard doesn't exist. They see a polished, purpose-built web page the BI team made for them.

## Key Features

### SQL-First Analytics
- Write real DuckDB SQL (CTEs, window functions, JSON, UNNEST, regex)
- Schema-aware autocomplete in the CodeMirror editor
- Dashboard-level filters with automatic WHERE injection or `{{template}}` syntax for precise control
- Parameters for what-if analysis: sliders, toggles, and dropdowns that feed directly into SQL queries

### 21 Visualization Types
**Charts:** Bar, Line, Area, Scatter, Histogram, Box Plot, Heatmap, Waffle, Pie, Density, Difference, Tree, Flow/Arrow, Funnel, Treemap

**Data:** Table, KPI Card

**Content:** Markdown (with template variables), Image, Embed (iframe), HTML

Each chart type has deep configuration: axis labels, grid lines, color schemes (16 palettes), tooltips, crosshairs, trend lines, normalization, rolling windows, faceting, reference lines, scale types, and more.

### Presentation Layer
- **Drilldown system** with breadcrumb navigation and drill-to-data drawers
- **Conditional visibility** -- panels show/hide based on filter state or query results
- **Tabs** for multi-view dashboards
- **Parameters** for what-if scenario modeling with live SQL re-execution
- **Cmd+K search palette** for quick panel navigation
- **Markdown panels** with `{{panels.panelId.column}}` template variables for data-driven narratives

### Dashboard Authoring
- Drag-and-drop grid layout (react-grid-layout)
- Panel duplication, inline title editing
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

1. Navigate to **Data Sources** and drop a CSV/Parquet file
2. Go to **Dashboards** and create a new dashboard
3. Add a panel, write a SQL query, hit Cmd+Enter
4. Configure the visualization type and column mappings
5. Drag and resize panels to build your layout

## Project Structure

```
src/
  engine/          # DuckDB abstraction (QueryEngine interface + WASM impl)
  stores/          # Zustand stores (dashboards, UI, interactions)
  types/           # TypeScript type definitions
  routes/          # TanStack Router file-based routes
  components/
    dashboard/     # Canvas, panels, toolbar, filters, tabs, parameters
    visualizations/# Chart renderer, Plot charts, custom charts, config
    query/         # SQL editor, results table
    data-sources/  # File drop zone, schema browser
    layout/        # App shell, sidebar, theme toggle
  lib/             # Utilities, SQL template engine, viz defaults, caching
  hooks/           # Custom hooks (file drop, debounce, resize, auto-run)
```

## Roadmap

- **Phase 1-6:** Complete (scaffold, data sources, CRUD, query/viz, polish, viz enhancement)
- **Phase 6.5:** Complete (6 additional chart types: tree, density, difference, flow, funnel, treemap)
- **Phase 7:** Complete (presentation layer: drilldown, content panels, parameters, tabs, conditional visibility, search)
- **Phase 8:** Performance & robustness (parallel execution, debouncing, row limits, tests)
- **Phase 9:** Cross-panel interaction (click-to-filter across panels)
- **Phase 10:** Git version control (isomorphic-git, local history, GitHub sync)
- **Phase 11:** Editor/renderer separation
- **Phase 12:** Publish ("export as website")
- **Phase 13:** Query proxy (live data for published dashboards)

## License

MIT
