# Changelog

All notable changes to the Genergy Dashboard are documented here.

## [2.6.1] - 2025-07-25

### Fixed
- **Sankey HP/EV flow topology** — Heat Pump and EV energy are now correctly shown as sub-consumers of Home, not as separate direct flows from Grid/Solar/Battery. The Sankey chart now uses a 3-section layout (Sources → Home → Sub-consumers) when EV or HP are enabled, fixing the visually incorrect Grid→HP direct flow. When no sub-consumers are configured, the simpler 2-section layout is preserved.
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
