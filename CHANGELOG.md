# Changelog

All notable changes to the Genergy Dashboard are documented here.

## [2.7.0] - 2025-07-25

### Fixed
- **Sankey: Grid source not connecting to destinations** — Grid import energy was only linked to Home/Load as a child, missing Battery (charge). This caused Grid source to appear disconnected in the Sankey chart when grid energy primarily charged the battery. Added `battery_charge_today` to `gridImportChildren`.
- **Sankey: HP/EV percentage not showing** — When Heat Pump or EV was enabled in the Sankey graph, the percentage labels showed nothing (var undefined). Root cause: the Jinja `:host {}` CSS variable block (which calculates `--pct-dst-hp` and `--pct-dst-ev`) was never regenerated when HP/EV toggles changed — only the CSS rules referencing these variables were added. Fixed by rebuilding the entire Jinja `:host {}` block on every dashboard build, dynamically including `--pct-dst-hp`/`--pct-dst-ev` when those features are enabled. The destination sum now correctly includes HP/EV energy for percentage calculations.

### Improved
- **Theme compatibility** — Replaced hardcoded dark-theme colors with HA CSS variable fallbacks across all cards:
  - Stat cards / status cards: `background` → `var(--ha-card-background, ...)`, `border` → `var(--divider-color, ...)`
  - Apex chart: Removed hardcoded white legend labels and grid border colors (let HA theme handle them)
  - Sankey chart: `ha-card` background uses `var(--ha-card-background, #1a1f2e)` instead of hardcoded `#1a1f2e`
  - Sankey title: Uses `var(--primary-text-color, #fff)` instead of hardcoded `white`
  - Device card / battery card: Background, text, and pill colors use CSS variables
  - House card container: Uses `var(--ha-card-background, #1a1f2e)` 
  - Settings: PV strings select dropdown, prereq banner, dismiss button all use CSS variables
  - This allows the dashboard to adapt to both light and dark HA themes

## [2.6.4] - 2025-07-25

### Fixed
- **Exported card layout** — The "Exported" energy stat card appeared on its own row instead of alongside Discharged and Imported in a 3-column grid. Root cause: the responsive CSS injection (MutationObserver) was being applied to ALL `grid-layout` shadow DOMs, including nested ones (stat cards, status cards). The desktop CSS rules (`nth-child(5): span 2`, `nth-child(6): 1 / -1`) intended for the 6 top-level dashboard cards were also hitting the 5th/6th stat card inside the inner grid, forcing "Imported" to span 2 columns and "Exported" to span the full width. Fixed by only injecting responsive CSS into the outermost grid-layout (ancestor check traverses shadow DOM boundaries to skip nested grids).
- **Sankey chart vertical rendering** — Reverted the 3-section Sankey layout introduced in v2.6.1 back to the flat 2-section layout (Sources → Destinations). The 3-section passthrough layout caused the chart to render vertically at narrow container widths. Added `layout: 'horizontal'` to force horizontal rendering at all widths. EV and HP are now children of all source nodes (Battery/Solar/Grid) as in v2.6.0.
- **Sankey CSS accumulation** — Added deduplication for accumulated Sankey CSS rules that were being appended on each `_buildDashboard()` call.

## [2.6.2] - 2025-07-25

### Fixed
- **CRITICAL: Configuration Error on load** — Fixed duplicate `sankeySections` variable declaration (dead legacy code from an earlier version conflicted with the new 3-section Sankey builder). ES modules throw `SyntaxError` on duplicate `const`/`let` in the same scope, which prevented `customElements.define()` from running, causing all custom cards to show "Configuration Error". Removed the dead code block.

## [2.6.1] - 2025-07-25

### Fixed
- **Sankey HP/EV flow topology** — *(Reverted in v2.6.3 — the 3-section layout caused vertical rendering at narrow widths.)* Originally changed to a 3-section layout showing HP/EV as sub-consumers of Home; reverted to flat 2-section layout with `layout: 'horizontal'`.
- **Daily meter auto-creation** — The `_ensureDailyMeter` function now accepts `state_class: total` in addition to `total_increasing`, lowered the cumulative threshold from 100→50 kWh, and supports MWh/Wh unit conversions. Entities with "daily", "today", or "summary_day" in their name are now correctly skipped (already daily-resetting). This fixes auto-detect not creating daily utility meters for some integrations.

## [2.6.0] - 2025-07-25

### Added
- **sigenergy2mqtt compatibility** — Added fallback entity patterns for the [seud0nym/sigenergy2mqtt](https://github.com/seud0nym/sigenergy2mqtt) integration. 8 auto-detect patterns were missing sigenergy2mqtt entity names (load_power, battery_soc, daily energy sensors, inverter_temp, battery_temp, grid import/export daily). All now have `||` fallback patterns using `endsWith()`.

### Changed
- **Genergy branding** — Renamed all user-facing "Sigenergy" text to "Genergy" (Settings header, card registry names, console banner, file header, documentation URL). Internal identifiers (element types, localStorage keys, JS class names, dashboard URL path) remain unchanged for backward compatibility.

## [2.5.5] - 2025-07-25

### Fixed
- **Sigenergy auto-detect pattern matching** — Changed all inverter-level entity matching from `includes()` to `endsWith()`. Fixes detection failure on systems with numbered inverters (e.g., `sensor.sigen_inverter_1_active_power` was not matched by `includes('inverter_active_power')`). This was the root cause of "2W" instead of "2kW" on SigenStor and wrong PV values.
- **House card image path** — Removed stale `image_path: /local/Sigenergy` from dashboard template and added explicit cleanup in `_buildDashboard()` to remove old values from existing dashboard YAML. The house card now correctly auto-detects the image path from `import.meta.url`.
- **Decimal places setting** — Wired up the `display.decimal_places` setting to all device panel values (temperature, voltage, current, Hz, %, Ah, rated power). Previously this setting was stored but never read.

### Added
- **3-phase voltage detection** — Added `_phase_b_voltage` pattern for Sigenergy naming and `phase_a/phase_b/phase_c` name inference for L1/L2/L3.
- **Disabled entity hints** — When auto-detect can't find grid_frequency, battery_temp, rated_power, or phase_voltage, a helpful message tells the user to enable these entities in HA (disabled by default in TypQxQ/Sigenergy-Local-Modbus).
- **Plant entity fallbacks** — Added alternative entity name patterns for TypQxQ (plant_ess_power, plant_consumed_power, plant_grid_sensor_active_power, plant_daily_consumed_energy).
