# Changelog

All notable changes to the Genergy Dashboard are documented here.

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
