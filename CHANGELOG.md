# Changelog

All notable changes to the Genergy Dashboard are documented here.

## [2.13.2] - 2025-07-15

### Improved
- **Daily Helper "Unknown" State UX** — Newly created utility meter helpers start as "unknown" in Home Assistant (normal HA behavior). Added clear user guidance:
  - Info note below the "Create Daily Helper" button explaining the temporary unknown state
  - Post-creation message confirming the helper may show "unknown" for a few minutes
  - Force-initialization: after creating a utility meter, the dashboard now calls `homeassistant.update_entity` on the source sensor to trigger an immediate state update, significantly reducing the time the helper stays in "unknown" state

### Documentation
- **README — Troubleshooting** — Added entry for daily helpers showing "unknown" with explanation and resolution steps
- **README — Daily Energy Totals** — Added note about auto-created utility meter helpers and temporary unknown state after creation

## [2.13.1] - 2026-03-29

### Fixed
- **Label Overflow in Entity Rows** — Long entity row labels (e.g. "Battery Reserved SoC") were overflowing their container and overlapping input fields. Replaced `white-space: nowrap` with `overflow: hidden; text-overflow: ellipsis` on `.row-label`, widened max-width to 140px.
- **Hardcoded Entity Fallbacks Removed** — Nine chart series and mushroom status cards had `|| 'sensor.xxx'` fallbacks that showed "entity not found" errors on fresh installs. All series and cards are now conditional — they only render when the entity is actually configured.
- **EMHASS False-Positive Auto-Detect** — The EMS auto-detect was too broad: any entity containing "emhass" triggered EMHASS mode, and backward-compat migration used `!== false` (truthy for `undefined`). Now requires both the mode entity AND MPC entities to be present, and uses strict `=== true` check.
- **Daily Energy Helper Auto-Creation** — `_autoDetectDailyEnergy` only queried `energy/get_prefs` with no fallback. Now uses a 3-step process: HA energy preferences → pattern matching → automatic `utility_meter` helper creation via `_ensureDailyMeter()` for cumulative sensors that lack daily variants.
- **Unit of Measurement in Entity Picker** — Candidate entities in the picker dropdown and autocomplete now show their unit of measurement (e.g. "sensor.grid_power — W"), making it easier to distinguish between similarly-named sensors with different units.
- **"Create Daily Helper" Button** — Entity rows for cumulative energy sensors now show a dedicated button to create a `utility_meter` daily helper on demand, providing a one-click solution when auto-detect doesn't find a daily sensor.

### Notes
- **HACS Icon** — Investigated the HACS dashboard not showing the Genergy brand icon. This is a HACS limitation: HACS 2.x hardcodes CDN URLs (`brands.home-assistant.io`) for entity pictures. The local `brand/` directory works correctly in native HA UI. No fix possible on our side — requires a HACS update or accepted brands PR.

## [2.13.0] - 2026-03-29

### Changed
- **Production-Ready Defaults** — Removed ALL developer-specific hardcoded entity defaults from the integration. Previous defaults referenced Deye inverter entities (`sensor.deyeinvertermaster_*`), Gobel Battery Monitor entities (`sensor.battery_monitor_pack_*`), Belgium Nordpool (`sensor.nordpool_kwh_be_*`), and a custom grid template sensor. All entity fields now default to empty — users configure their own entities via auto-detect or manual entry.
- **EMS Provider Defaults to None** — New installations no longer default to EMHASS. The EMS provider is set to "None" and financial tracking is disabled by default. Battery packs default to 0.
- **Pricing Source Defaults to Custom** — No longer defaults to Nordpool, which is Europe-specific.
- **Battery Pack Details Derived from Config** — The battery pack detail panels (SoH, voltage, current, cell voltages, temperature) now derive entity prefixes from the configured pack SoC entity instead of hardcoding the Gobel Battery Monitor naming pattern.

## [2.12.9] - 2026-03-29

### Fixed
- **EMHASS Entities No Longer Pre-Filled by Default** — Cleared all EMHASS-specific entity defaults (28 entities: `sensor.emhass_*`, `sensor.mpc_*`, `automation.emhass_*`, `input_boolean.emhass_enabled`). Non-EMHASS users no longer see “❌ Not found” errors on fields they never configured. The auto-detect button fills these in when EMHASS is actually installed.
- **EMHASS Enabled Field Now Conditional** — The "EMHASS Enabled" entity row under the System section now only appears when EMHASS is selected as the EMS provider, eliminating confusion about duplicate EMHASS on/off controls.

## [2.12.8] - 2026-03-29

### Fixed
- **Entity Input Fields Now Span Full Width** — Entity input boxes in the Settings card were only ~150px wide instead of filling the available row space. The `.row-input` inside `.entity-input-wrap` lacked `width: 100%` — the `flex: 1` property had no effect since the parent wrapper is not a flex container. Entity names are now fully visible without truncation.

## [2.12.7] - 2026-03-29

### Removed
- **Removed legacy bootstrap YAML** — Deleted `dashboards/genergy.yaml` (formerly `sigenergy.yaml`) and the `dashboards/` directory. This file was legacy code from before the config flow was implemented. The dashboard is now fully auto-created by the integration's config flow and dashboard generator — no manual YAML pasting needed.

## [2.12.6] - 2026-03-29

### Changed
- **Rebrand Bootstrap YAML** — Renamed `dashboards/sigenergy.yaml` to `dashboards/genergy.yaml`. Updated all user-visible text (title, comments) from "Sigenergy" to "Genergy". The `dashboard-sigenergy` URL path and `custom:sigenergy-settings-card` element name are kept unchanged for backward compatibility.

## [2.12.5] - 2026-03-29

### Fixed
- **Price Lines Now Visible on Chart** — Changed the price Y-axis from `show: false` to `show: true`. ApexCharts.js has a known issue where hidden Y-axes don't properly map series data to independent scales — price values (~0.2 $/kWh) were being plotted against the power axis (-100 to 10 kW) making them invisible at the zero line. The price axis now renders as a subtle secondary axis on the right side with muted styling.

## [2.12.4] - 2026-03-29

### Fixed
- **Duplicate Price Lines in Legend** — When both `buy_price` (EMHASS entity) and `current_import_price` (actual price sensor) are configured, only one "Import Price" state-tracked line now appears. The `buy_price` state-tracked line is suppressed when a separate `current_import_price` exists, preventing two near-identical values in the chart legend. Same logic applied for export prices.

## [2.12.3] - 2026-03-29

### Fixed
- **Price Chart Works With Any EMS Provider** — Moved price series (buy_price, sell_price, current_import_price, current_export_price) out of the EMHASS-only code block. Price overlays now render for HAEO, standalone, and any EMS provider — not just EMHASS.
- **Price Y-Axis Always Created** — The `price` Y-axis is now added whenever price entities are configured, even without EMHASS or HAEO forecasts enabled. Previously, apexcharts silently dropped price series because no matching yaxis_id existed.
- **Dynamic Currency Everywhere** — Fixed hardcoded `€/kWh` in the Price Entities section header; now uses the configured currency symbol. Fixed HAEO optim cost unit from hardcoded `$` to use configured currency.
- **Currency Change Re-renders UI** — Changing the Currency Symbol input now immediately re-renders the Pricing tab so threshold labels update to the new currency.
- **Extended Chart for Price Entities** — The chart now uses the 48h extended view when price entities are configured with `show_price_overlay`, so Amber/Nordpool forecast data is visible beyond 24h.

## [2.12.2] - 2026-03-29

### Fixed
- **Entity Input Fields Wider** — Reduced label min-width from 130px to 110px, reduced state column from 90px to 80px, added `min-width: 0` to entity-input-wrap and row-input for proper flex shrinking. Entity names like `sensor.deyeinvertermaster_battery_power` are no longer cut off.
- **Input Font Size** — Reduced entity input font from 12px to 11px to fit more characters.
- **Text Overflow** — Added `text-overflow: ellipsis` on inputs and `white-space: nowrap` on labels/states for cleaner overflow handling.

## [2.12.1] - 2026-03-29

### Fixed
- **Amber Electric Price Support** — Price chart series now use universal data_generators that handle EMHASS forecast attributes, Amber Electric forecast arrays (`per_kwh`, `start_time`), and plain state-history price sensors. Previously only EMHASS-specific `unit_load_cost_forecasts` attributes were supported, causing Amber entities to show no data.
- **Dynamic Currency** — Replaced all hardcoded `EUR` references in charts, Y-axis titles, and EMHASS financial headers with the user's configured currency symbol from Pricing tab. Thresholds now display the configured currency.
- **Buy/Sell Price as Actual Lines** — When `buy_price`/`sell_price` entities are set, they now also render as state-tracked history lines (not just forecast overlays). This means any simple price sensor (Amber, Tibber, Nordpool) shows actual price history on the chart.
- **Duplicate Price Lines** — When `current_import_price` is the same entity as `buy_price`, only one line is rendered (prevents duplicate series).

### Added
- **Amber Auto-Setup** — Selecting "Amber Electric" on the Pricing tab now auto-populates `buy_price` and `sell_price` with detected Amber entities and sets currency to `$`.
- **Amber Auto-Detect** — Price auto-detect now sets currency to `$` and source to `amber` when Amber Electric entities are found.
- **Broader Price Patterns** — Added `general_price`, `import_price`, and Amber-specific patterns to price auto-detection.

## [2.12.0] - 2026-03-29

### Added
- **Universal Multi-Candidate Entity Picker** — All auto-detect methods (Core Power, Prices, EMS, System) now support multi-candidate selection. When multiple matching entities are found, a clickable picker appears below the entity input showing entity ID, friendly name, current value, and disabled badge. Users choose the correct entity for their setup.
- **Generic Inverter Support** — Core Power auto-detect no longer requires Sigenergy-specific entities. Generic power/SoC/capacity patterns match entities from Deye, Goodwe, Huawei, SolarEdge, Fronius, and other inverter brands with candidate picker for disambiguation.
- **Universal `_findEntityCandidates()` Helper** — Centralized entity search supporting string, regex, and function pattern matchers with unit filtering, domain filtering, exclude patterns, and HA entity registry lookup for disabled entities.
- **Universal `_assignCandidate()` Helper** — Automatic single-match assignment with multi-candidate picker fallback for all entity keys.
- **Detect All Candidate Integration** — The main "Detect All" button now also populates candidate pickers for price, weather, and SoC entities when multiple matches exist.

### Improved
- **Entity Picker UX** — Candidate items now show friendly name (italic) alongside entity ID for easier identification.
- **Refactored Auto-Detect** — All 5 per-section detect methods plus Detect All now use the same candidate infrastructure, ensuring consistent behavior across all entity types.

## [2.11.1] - 2026-03-29

### Added
- **Multi-Candidate SoC Entity Picker** — When auto-detecting SoC limit entities (Max SoC, Min SoC, Reserved SoC), the system now queries the HA entity registry to discover both enabled and disabled entities. If multiple candidates are found, a clickable candidate picker appears below each entity input showing entity ID, current value, and a "disabled" badge for entities that are disabled in HA. Single candidates are auto-assigned; multiple candidates let the user choose.

### Fixed
- **SoC Auto-Detect for Sigenergy Users** — Previously, SoC limit entities (charge/discharge cutoff) would not auto-detect when those entities were disabled (common for Sigenergy users using HAEO). Now disabled entities are shown as candidates with guidance to enable them in HA or set values manually on the Features tab.

## [2.11.0] - 2026-03-29

### Added
- **Entity Autocomplete Dropdown** — All entity input fields now show a filterable dropdown of matching HA entities as you type, with entity ID, friendly name, and current state. Replaces manual entity ID entry.
- **Per-Section Auto-Detect** — Each entity section (Core Power, Daily Energy, Prices, EMS, System) now has its own 🔍 auto-detect button. Only detects entities for that section, preserving manually configured entities in other sections.
- **Settings Profiles** — Save up to 3 named configuration profiles on the Display tab. Save current settings, load a previous profile, or delete a slot. Each profile stores a complete snapshot of all entities, features, pricing, and display settings.
- **Detect All Warning** — The main "Detect All" button now shows a warning that it may overwrite manual changes, directing users to per-section buttons instead.

### Fixed
- **HAEO Auto-Detect** — Fixed entity patterns to match HAEO's actual naming convention: `*_network_optimization_status` (not `*_optimization_status`), `*_battery_power_charge/discharge`, `*_battery_state_of_charge`. Entity hints updated accordingly.
- **HAEO Chart Forecasts** — HAEO forecast overlays now correctly read the `forecast` attribute (array of `{time, value}` points) from HAEO sensors and render as dashed overlay lines on the ApexCharts energy chart.

### Improved
- **HAEO Support Matured** — Full auto-detection, chart overlay, status card, and EMS provider toggle now work end-to-end with the HAEO (Home Assistant Energy Optimizer) integration.

## [2.10.1] - 2026-03-29

### Improved
- **Global Save & Apply Action Bar** — "Save All Settings" and "Apply Settings to Dashboard" buttons now visible at the bottom of **every tab** (Entities, Features, Pricing, Display), not just the Display tab. Users no longer need to navigate to a specific tab to apply changes.
- **Apply Reminder Banner** — Prominent yellow warning banner above the action buttons reminds users to click Apply after making changes.
- **README — Restart Emphasis** — New "When to Restart" section with clear table, red 🔴 callouts on all installation steps, updated prerequisite notes.
- **README — Save & Apply Section** — New dedicated section explaining what Apply does and why it's essential.
- **Quick Start Guide Updated** — Apply step emphasized with yellow callout.

## [2.10.0] - 2026-03-29

### Added
- **HAEO (Home Assistant Energy Optimizer) Support** — Full integration of HAEO as an alternative energy management system alongside EMHASS. HAEO is a native HA integration using HiGHS linear programming for energy optimization with a flexible graph-based topology.
- **EMS Provider Selector** — Replaced the single EMHASS toggle with a 3-way EMS provider selector (None / EMHASS / HAEO) in both the Entities and Features tabs. Backward-compatible: existing configs with `emhass: true` automatically migrate to `ems_provider: 'emhass'`.
- **HAEO Entity Slots** — 9 new entity fields in the Entities tab when HAEO is selected: battery charge/discharge/SoC, grid power, solar power, load power, optimization status/cost/duration.
- **HAEO Forecast Overlays** — When EMS = HAEO and HAEO Forecasts enabled, the energy chart shows 7 dashed forecast series (battery charge, battery discharge, solar, grid, load, SoC on secondary axis, prices) read from HAEO sensor `forecast` attributes.
- **HAEO Status Card** — Purple-gradient status card showing optimization status, cost, and solve duration (parallel to the green EMHASS status card showing mode/reason).
- **HAEO Auto-Detection** — The auto-detect button now searches for `*_optimization_status` sensors to identify HAEO networks, then automatically maps battery, grid, solar, and load sensors with `forecast` attributes.
- **HAEO Feature Toggle in Config Flow** — Added "Enable HAEO" checkbox in the config flow extras step.

### Improved
- **README Documentation** — Added HAEO entity reference table, updated Feature Toggles table with EMS Provider row, updated troubleshooting section for HAEO forecasts, added HAEO to optional integrations table.

## [2.9.0] - 2026-03-29

### Added
- **Reserved SoC (Backup Reserve)** — New "Reserved SoC" concept for grid outage backup reserves. Supports both entity-based (`battery_reserved_soc`) and manual percentage (`battery_reserved_soc_pct`) configuration. When discharging, runtime estimate shows time-to-reserve instead of time-to-min. Auto-detected for Sigenergy (`ess_backup_state_of_charge`) and generic patterns (`*backup*soc*`, `*reserve*soc*`).
- **SoC Entity Rows in Entities Tab** — Added entity selector rows for `battery_max_soc`, `battery_min_soc`, and `battery_reserved_soc` in the Entities tab. Previously these were only auto-detected with no way to set them manually.
- **Reserved SoC % Manual Input** — Added "Reserved SoC (%)" input in Features → Battery section alongside existing Max/Min SoC targets.
- **Generic Reserved SoC Auto-Detection** — The auto-detect button now searches for backup/reserve SoC entities across all brands using pattern matching.

### Improved
- **README Clarity** — Rewrote Step 3 instructions with explicit guidance for non-Sigenergy users (leave toggle off, pick entities from dropdowns). Added all-brands instructions before the Sigenergy note. Updated entity reference with Reserved SoC. Added battery_label and runtime toggle to documented settings.
- **Sigenergy Auto-Detect** — Backup SoC (`ess_backup_state_of_charge`) is now mapped to `battery_reserved_soc` (separate from `battery_min_soc`), and discharge cutoff (`ess_discharge_cut_off_state_of_charge`) is mapped to `battery_min_soc`.

## [2.8.4] - 2026-03-29

### Fixed
- **Mushroom Chips W/kW Display** — Fixed Jinja template in overview status chips (Solar, Home, Grid) that always showed watts regardless of sensor unit. The old template used `| default('W')` which doesn't replace `None` in all HA Jinja environments. New template normalizes to watts via `(state_attr(...) or 'W')`, then auto-scales by magnitude (≥1000 W → kW), matching the house card behavior. Sigenergy users (sensors in kW) now see correct "9.81 kW" instead of "10 W".

## [2.8.3] - 2026-03-29

### Fixed
- **Dashboard Name** — Dashboard sidebar title changed from "Sigenergy" to "Genergy" so non-Sigenergy users don't see a brand-specific name.
- **Config Entry Title** — Config flow entries now display as "Genergy Dashboard" instead of "Sigenergy Dashboard".

### Improved
- **Config Flow UX** — Rewrote the initial setup step description to clearly explain: if you have a Sigenergy inverter, enable the toggle for pre-filled defaults; otherwise leave it off and select your entities manually. Toggle renamed from "Use Sigenergy defaults" to "I have a Sigenergy inverter — use pre-filled defaults".

### Added
- **Configurable Battery Label** — The house card battery label (previously hardcoded as "SigenStor") now defaults to "BATTERY" and can be customized via Settings → Display → Battery Label. Sigenergy auto-detect sets it to "SigenStor" automatically.

## [2.8.2] - 2026-03-29

### Fixed
- **ApexCharts W/kW Unit Mismatch** — Fixed bug where the energy overview chart always divided sensor values by 1000ergardless of the sensor's unit of measurement. Sensors reporting in kW (e.g. Sigenergy) were being double-divided, while sensors in W showed the raw value with "kW" suffix. The transform now reads `entity.attributes.unit_of_measurement` and only divides when the source is W.
- **ApexCharts Decimal Precision** — Chart header, legend, and tooltip now respect the Display → "Decimal Places" setting instead of hardcoded `1`.
- **EMHASS Forecast Double Transform Removed** — Removed redundant `transform: 'return x / 1000;'` from all data_generator series (PV, Battery, Grid, Load forecasts). The data_generator already divides by 1000 internally, and the apexcharts-card ignores `transform` for data_generator series — so while harmless, the dead code was confusing.

### Added
- **Electricity Price Auto-Detection** — Auto-detect now identifies common electricity price entities: Amber Electric (`sensor.amber_general_price`, `sensor.amber_feed_in_price`), Tibber (`sensor.electricity_price`), Nordpool, EnergiDataService, Octopus Energy, and generic patterns (`*spot_price*`, `*energy_price*`, `*buy_price*`, `*feed_in_price*`).
- **Sigenergy Battery Capacity Auto-Detection** — Added `sensor.sigen_plant_rated_energy_capacity` to the Sigenergy auto-detect map. Previously, battery capacity was only detected for non-Sigenergy brands via the generic detection patterns.
- **Sigenergy SoC Limit Auto-Detection** — Added detection for Sigenergy ESS charge/discharge cutoff SoC entities (`ess_charge_cut_off_state_of_charge`, `ess_discharge_cut_off_state_of_charge`, `ess_backup_state_of_charge`).

## [2.8.1] - 2026-03-28

### Fixed
- **Battery Runtime Not Showing** — Fixed runtime prediction not displaying below "Discharging"/"Charging" status. Root cause: battery_capacity entity was not populated automatically during dashboard builds, requiring manual "Auto Detect" click. Dashboard build now auto-fills the battery capacity entity when not configured.
- **Settings Resetting After Feature Toggle** — Fixed race condition where `_buildDashboard()` could read stale dashboard config before the config store finished writing. Dashboard rebuild now awaits pending store saves before proceeding.
- **SoC Target Persistence** — Fixed explicit set/delete logic for `battery_capacity_kwh`, `battery_max_soc_pct`, and `battery_min_soc_pct` during dashboard rebuilds. Previously, clearing a manual override had no effect because the value was only *set* (never deleted).
- **Min SoC 0% Not Applied** — Fixed falsy check for `"0"` string in `_syncSocTargetsToDashboard()`. `parseInt("0")` is `0` which is falsy in JavaScript, causing the value to be treated as "not set". Now uses proper null/empty-string checks.

## [2.8.0] - 2026-03-28

### Added
- **Solar Forecast Chart Overlay** — Reads Solcast `detailedForecast` attribute from `sensor.solcast_pv_forecast_today` (and optionally tomorrow) and overlays the forecast as a dashed gold area series on the ApexCharts energy overview. Chart span extends to 48h when solar forecast feature is enabled.
- **Battery Runtime Estimate** — Computes estimated time-to-full or time-to-empty based on battery capacity, current SoC, charge/discharge power, and configurable SoC targets. Displayed on a separate line below the battery "Charging"/"Discharging" status on the house card.
- **Manual SoC Targets (%)** — New "Max SoC Target" and "Min SoC Target" numeric inputs on the Features → Battery section let you set charge/discharge cutoff percentages directly (e.g. 95% max, 10% min) without needing an entity.
- **Manual Battery Capacity Override** — New "Manual Capacity (kWh)" input in Settings → Features → Battery. Set capacity manually when no capacity entity is available.
- **Ah-to-kWh Conversion** — Battery capacity entities reporting in Ah are now automatically converted to kWh using nominal voltage (configurable, defaults to 51.2V for LFP).
- **Battery Polarity Auto-Detection** — Auto-detect now identifies the correct battery sign convention from the entity name: entities containing "output" or "discharge" are set to positive = discharging (correct for Deye, Goodwe, etc.). Sigenergy entities keep positive = charging.
- **Broadened Auto-Detection** — Battery capacity detection now matches `rated_capacity`, `rated_energy`, `capacity_kwh`, and `capacity_ah` patterns. SoC limit detection matches charge cutoff, discharge cutoff, battery_shutdown, backup_soc, reserve_soc, min_soc, and max_soc patterns across all inverter brands.

### Changed
- **Settings UI Overhaul** — All four tabs (Entities, Features, Pricing, Display) restructured with clearer sections, unit hints (W/kWh/°C/V/Hz), cross-references between tabs, and contextual help text for each entity group.
- **Features Tab Reorganized** — Grouped into logical sections: System Components, EMHASS Optimizer, Solar Forecast, Optional Equipment, Battery, Developer. Each section includes links to relevant integrations and references to the Entities tab.
- **Battery Runtime Display** — Runtime prediction ("Xh Ym to N%") is now shown on a **separate line** below the "Charging"/"Discharging" status label.
- **Battery SoC Entity Rows Removed** — "Battery Max SoC" and "Battery Min SoC" entity pickers removed from the Entities tab. Replaced by simpler numeric % inputs on the Features tab. Entity-based SoC targets still work via auto-detection for supported inverters.

### Fixed
- **Features Tab Not Loading** — Fixed critical bug where the Features tab showed a blank page due to an undefined variable reference (`e` instead of `cfg.entities`).
- **Battery Showing "Charging" When Discharging** — Fixed incorrect battery status on Deye and similar inverters where positive power = discharging. The default `battery_positive_charging` setting is now properly auto-detected based on entity naming conventions.

## [2.7.3] - 2025-07-25

### Fixed
- **Transparent card backgrounds** — House card, Sankey chart, and Battery device card backgrounds are now transparent so they blend seamlessly with the dashboard background color instead of showing a contrasting `#1a1f2e` / `#22273a` background.
  - House card: `.house-container` background set to `transparent`
  - Battery device card: `.card` background set to `transparent` (both compact and full layouts)
  - Settings card: `.card` background set to `transparent`
  - Sankey chart: Runtime patch replaces ha-card's adopted stylesheet `:host` background with `transparent !important` (required because ha-card uses adopted stylesheets that cannot be overridden from outside its shadow DOM)

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

## [2.5.3] - 2025-07-24

### Added
- **Lifetime→daily auto-conversion** — Auto-detect now checks all core energy entities for cumulative/lifetime values. If state > 100 kWh with `state_class: total_increasing`, automatically creates a HA daily `utility_meter` helper and uses that in the Sankey chart and stats.
- **Config versioning (anti-overwrite)** — Settings now include a timestamp (`_ts`). On page refresh, the dashboard config only overwrites localStorage if it has a newer timestamp, preventing manually entered entities from being reverted.
- **Heat pump power auto-detect** — When a heat pump is found via HA Energy Dashboard device consumption, auto-detect now also scans for matching power entities (W/kW).
- **3-phase voltage auto-detect** — Scans for phase 2/3 voltage entities (L2/L3 patterns) and auto-enables 3-phase mode.
- **Auto-rebuild after detect** — After successful auto-detect, the dashboard is automatically rebuilt. No more manual "Apply Settings to Dashboard" needed.

### Fixed
- **House card HP entity fix** — Dashboard builder now uses the explicit `heat_pump_power` entity instead of always falling back to EMHASS `deferrable0_power`.
- **Settings view decimal cleanup** — Entity state badges now display rounded values instead of raw float precision.

## [2.5.2] - 2025-07-24

### Added
- **Missing cards notification on Overview** — Amber warning banner when required HACS plugins are not installed, with direct HACS install links and dismiss button.
- **HACS integration icon** — Added `icon.png` (48×48 green "G" logo) for the HACS store listing.
- **HACS install button** — README badge now opens in a new tab with `&category=integration` parameter.

## [2.5.1] - 2025-07-24

### Fixed
- **Battery image height fix** — Corrected battery stack image heights for 7-pack and 8-pack layouts in the device card.

## [2.5.0] - 2025-07-24

### Added
- **Sigenergy auto-detect** — Comprehensive entity auto-detection for Sigenergy inverter systems. Scans `sensor.sigen_*` entities and automatically maps plant-level and inverter-level sensors.
- **Dynamic PV strings (1–6)** — New "PV Strings" dropdown in Settings → Inverter & PV.
- **Battery packs extended to 8** — Battery pack support increased from 6 to 8 modules.
- **Unit-aware power templates** — Mushroom status cards use a smart Jinja template that checks `unit_of_measurement` and formats correctly (kW with 2dp, W with 0dp).
- **Battery sign convention** — `battery_positive_charging` configuration with Settings toggle in Features → Battery.

### Fixed
- **Prerequisite detection race condition** — Fixed false positives by deferring check using `EVENT_HOMEASSISTANT_STARTED`.

## [2.4.0] - 2025-07-23

### Added
- **Automated prerequisite detection** — Two-layer system checking for required HACS plugins on both backend startup and in the frontend Settings view.
- **Prerequisite install banner** — Red banner in Settings with direct "Install via HACS" buttons using my.home-assistant.io redirects.
- **Backend notifications** — Missing cards trigger persistent notifications and Repair issues.

## [2.3.0] - 2025-07-22

### Added
- **Sankey graph threshold** — Entities below 0.1 kWh auto-hidden (`min_state: 0.1`).
- **Broadened auto-detect keywords** — 30+ EV brands and 20+ heat pump brands.
- **Cumulative sensor support** — Detects lifetime-total sensors and creates daily utility meters.

### Changed
- **Compact Sankey labels** — Heat Pump renamed to "HP" for narrow charts.
- **EV color changed to pink** — Differentiated from Grid's purple/blue.

### Fixed
- **Responsive settings UI** — State updates now refresh badges inline instead of full DOM rebuild.
- **Removed duplicate feature toggles** — Grid/Sankey toggles consolidated to Entities tab.

## [2.2.0] - 2025-07-21

### Added
- **Dual tariff + 3-phase support** — Separate high/low tariff entities with `DualTariffSumSensor`. Per-phase voltage monitoring.
- **Conditional toggle UI** — Grid Metering, Voltage, EMHASS, Solar sections expand inline.
- **EV & Heat Pump in Sankey** — Toggle to add as destination nodes in the Sankey chart.

### Fixed
- **Weather entity reset** — Find-and-replace now uses previous value instead of default.
- **Dashboard builder** — Reads from config store instead of cached value.

## [2.1.0] - 2025-07-20

### Changed
- **Robust custom element registration** — Multi-attempt registration with fallbacks.
- **No-cache JS serving** — `Cache-Control: no-store` headers prevent stale caching.
- **Error card recovery** — Automatic detection and replacement of "Configuration error" placeholders.

### Fixed
- **Improved stability** — Class initialization order, image path resolution, and silent module failures.
- **Config flow** — Extended Deye/SunSynk default entity mappings.

## [2.0.0] - 2025-07-19

### Added
- **Converted to HA integration** — Full config flow with guided entity mapping, auto-dashboard creation, and sidebar registration.
- **Settings card** — 4-tab UI for entity mapping, feature toggles, pricing, and display preferences.
- **Device card** — Battery stack visualization with expandable pack details.
- **House card** — Animated isometric house with power flow comets, cable path editor, and responsive design.
- **Bundled theme** — Auto-installed `sigenergy_dark` theme.
