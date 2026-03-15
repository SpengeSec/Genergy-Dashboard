# Genergy  Dashboard — Sigenergy Inspired Dashboard

[![hacs_badge](https://img.shields.io/badge/HACS-Custom-41BDF5.svg)](https://github.com/hacs/integration)
[![License: CC BY-NC-SA 4.0](https://img.shields.io/badge/License-CC%20BY--NC--SA%204.0-lightgrey.svg)](LICENSE)

> **⚠️ Early Development Stage**
>
> This project is under active development. Expect bugs and incomplete features.
> - The **Overview** view is the only fully presentable (done) view at this time.
> - Some options shown in the **Settings** view do not currently have a working implementation.
> - Other views (History, Devices, etc.) are work-in-progress and may be empty or broken.
>
> Feedback and bug reports are welcome!

A fully configurable Home Assistant Lovelace dashboard for monitoring solar, battery, and grid energy systems. Features animated power flow visualization, real-time energy charts with EMHASS forecast overlays, battery pack monitoring, and a 4-tab settings UI for complete customization — no YAML editing required.

> **Inverter-agnostic**: Works with **any** solar/battery inverter (Deye, SunSynk, Sigenergy, Huawei, Fronius, SolarEdge, Enphase, etc.) — just map your entity IDs in the Settings tab.

---

## Screenshots

### Dashboard Overview
Animated house card with real-time power flow, sankey energy diagram, and battery system status — all in one view.

![Dashboard Overview](screenshots/overview.png)

### Energy Charts & EMHASS Forecasts
48-hour time-series chart with solar, battery, grid, and consumption traces — plus EMHASS MPC forecast overlays, price curves, and deferrable load schedules.

![Energy Charts](screenshots/energy-chart.png)

### Settings Card
4-tab configuration UI with live entity validation — no YAML editing required. Map your entities, toggle features, configure pricing, and set display preferences.

![Settings](screenshots/settings.png)

### Responsive House Design
Toggle EV Charger and Heat Pump in the settings to dynamically update the house card — the garage gate opens to show the EV charging, and the heat pump unit appears on the side of the house.

![Responsive House with EV & Heat Pump](screenshots/responsive-house.png)

### Cable Path Editor
Built-in visual cable path editor for customizing the animated power flow routes on the house card. Drag control points to reposition cables, snap to grid, and apply changes instantly.

![Cable Path Editor](screenshots/cable-editor.png)

---

## Table of Contents

- [Screenshots](#screenshots)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Quick Start Guide](#quick-start-guide)
- [Configuration Guide](#configuration-guide)
- [Entity Reference](#entity-reference)
- [Feature Toggles](#feature-toggles)
- [Pricing Configuration](#pricing-configuration)
- [Display Preferences](#display-preferences)
- [House Card Customization](#house-card-customization)
- [Responsive Layout](#responsive-layout)
- [Dependencies](#dependencies)
- [Troubleshooting](#troubleshooting)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)

---

## Features

### Overview Dashboard
- **Animated House Card** — Isometric 3D house with real-time animated power flow "comets" showing solar generation, battery charge/discharge, grid import/export, EV charging, and heat pump usage
- **Responsive House Design** — Toggle EV charger/heat pump in settings and the house card updates dynamically: garage gate opens to show EV charging, heat pump unit appears on the house exterior
- **Cable Path Editor** — Built-in visual editor for customizing animated power flow cable routes with drag-to-reposition control points and snap-to-grid
- **Sankey Energy Flow** — Visual energy flow diagram showing power distribution from sources (Solar, Grid, Battery) to sinks (Home, Battery, Grid)
- **Battery System Card** — SVG-based battery stack visualization with expandable detail panels for each inverter and battery pack (SoC, SoH, voltage, current, cycles, cell voltages, temperatures)
- **Status Cards** — Real-time power values (Solar, Home, Battery, Grid) and daily energy totals (kWh)

### Energy Charts
- **ApexCharts Integration** — 24h or 48h time-series chart with Solar, Battery, Grid, and Consumption traces
- **EMHASS Forecast Overlay** — Dashed forecast lines for planned PV, battery, grid, load, SOC, and price targets
- **Price Overlay** — Import/export electricity price curves on secondary Y-axis
- **Deferrable Load Tracking** — Heat pump, boiler, and other deferrable load schedules

### Settings UI (No YAML Required)
- **4-tab configuration card** with live entity validation
- **Entity Configuration** — Map your HA entities to ~70 dashboard slots with real-time state badges
- **Feature Toggles** — Enable/disable EV charger, heat pump, EMHASS, solar forecast, financial tracking
- **Pricing Setup** — Configure price entities, thresholds, currency
- **Display Preferences** — Decimal places, chart range, SoC ring thresholds, power auto-scaling

### Theme & Responsiveness
- **Bundled dark theme** (`sigenergy_dark`) — consistent appearance regardless of your HA theme
- **Responsive layout** — Adapts from 3-column desktop to 2-column tablet to single-column mobile

---

## Prerequisites

### Required

- **Home Assistant** 2024.1.0 or newer
- **HACS** (Home Assistant Community Store) — [Installation Guide](https://hacs.xyz/docs/setup/download)

### Required HACS Frontend Plugins

Install these **before** installing the Sigenergy Dashboard:

| Plugin | HACS Search Name | Purpose |
|---|---|---|
| [Layout Card](https://github.com/thomasloven/lovelace-layout-card) | `layout-card` | Responsive grid layout |
| [ApexCharts Card](https://github.com/RomRider/apexcharts-card) | `apexcharts-card` | Energy time-series charts |
| [Sankey Chart Card](https://github.com/MindFreeze/ha-sankey-chart) | `sankey-chart` | Energy flow diagram |
| [Mushroom Cards](https://github.com/piitaya/lovelace-mushroom) | `mushroom` | Status pills and cards |
| [Card Mod](https://github.com/thomasloven/lovelace-card-mod) | `card-mod` | CSS styling injection |

### Optional Integrations

| Integration | Purpose |
|---|---|
| [EMHASS](https://github.com/davidusb-geern/emhass) | Energy optimization, MPC forecasts, financial tracking |
| [Nordpool](https://github.com/custom-components/nordpool) | Electricity spot prices (Europe) |
| [Solcast PV Forecast](https://github.com/oziee/ha-solcast-solar) | Solar production forecasts |
| Gobel Battery Monitor or similar BMS | Per-pack cell voltage and temperature monitoring |

---

## Installation

### Step 1: Install Dependencies

Open HACS → Frontend, and install all 5 required plugins listed above. Restart Home Assistant after installing.

### Step 2: Install Sigenergy Dashboard

#### Via HACS (Recommended)

1. Open **HACS** → **Frontend** → click the three dots (⋮) → **Custom repositories**
2. Paste the GitHub repository URL, select **Lovelace** (or **Plugin**) as category, click **Add**
3. Search for **Sigenergy Dashboard** and click **Install**
4. Restart Home Assistant
5. Hard-refresh your browser: **Ctrl+Shift+R** (Windows/Linux) or **Cmd+Shift+R** (Mac)

> **Note**: HACS automatically registers the main JS file as a Lovelace resource. The dashboard JS auto-imports the house card, so only one resource entry is needed. The resource URL will be something like `/hacsfiles/Genergy-Dashboard/dist/genergy-dashboard.js` — this is correct and expected.
>
> **Important**: HACS installs the JS resource but **cannot create a dashboard automatically** — this is a HACS limitation, not a bug. You must create the dashboard manually using the bootstrap YAML provided below (see [Step 5](#step-5-create-the-dashboard)).

#### Manual Installation

1. Download the latest release ZIP
2. Extract the `dist/` folder (it contains everything: JS files, images)
3. Copy the `dist/` contents to your HA config:
   ```
   dist/sigenergy-dashboard.js  → /config/www/sigenergy-dashboard/dist/sigenergy-dashboard.js
   dist/sigenergy-house-card.js → /config/www/sigenergy-dashboard/dist/sigenergy-house-card.js
   dist/images/                 → /config/www/sigenergy-dashboard/dist/images/
   ```
4. In Home Assistant: **Settings** → **Dashboards** → **⋮** → **Resources**
5. Add **one** resource:
   ```
   URL: /local/sigenergy-dashboard/dist/sigenergy-dashboard.js
   Type: JavaScript Module
   ```
   > The dashboard JS automatically imports the house card from the same directory — no need to add it separately.
6. Restart Home Assistant

### Step 3: Install Theme

1. Copy `themes/sigenergy_dark.yaml` to your `/config/themes/` directory
2. Restart Home Assistant (or call `homeassistant.reload_themes`)
3. The dashboard automatically applies this theme to its views

> **Important**: Without the theme file, cards use CSS fallback styling but the page background may not match the dark design.

### Step 4: Copy Images

> **HACS users**: Images are automatically installed in the correct location — skip this step.
>
> **Manual users**: Images are already included in the `dist/images/` folder. If you copied the full `dist/` directory in Step 2, images are already in place.

The package includes 13 images used by the dashboard:
- **Battery Device Card**: `1inverter1battery.png` … `1inverter6battery.png` (6 battery stack renders)
- **House Card**: `home_has_solar_has_car.png`, `dark_home_has_solar_has_car.png`, `home_has_solar_no_car.png`, `sigenstor_home.png`, `ammeter_home.png`, `ac_charger_bg.png`, `device_heat_pump.png`

### Step 5: Create the Dashboard

1. In Home Assistant go to **Settings → Dashboards → Add Dashboard**
2. Set:
   - **Title**: `Sigenergy`
   - **URL path**: `dashboard-sigenergy` — exact spelling, case-sensitive
   - **Icon**: `mdi:solar-power` (optional)
3. Click **Create**
4. Open the new dashboard
5. Click the **three-dot menu (⋮) → Edit → Raw configuration editor**
6. Select all existing content and delete it
7. Paste the entire contents of [`dashboards/sigenergy.yaml`](dashboards/sigenergy.yaml)
8. Click **Save**
9. The Sigenergy Settings card will appear — use it to configure your entities, features, and preferences. The full dashboard builds automatically after saving your first configuration.

> **Warning**: The URL path **must** be exactly `dashboard-sigenergy` — the settings card uses this path to persist your configuration. A different path means settings will not save correctly.

---

## Quick Start Guide

After installation, the dashboard is empty until you configure your entities:

1. Navigate to your Sigenergy dashboard
2. Open the **Settings** tab (⚙️ gear icon)
3. In the **⚡ Entities** tab, fill in your entity IDs:
   - At minimum, configure: `solar_power`, `load_power`, `battery_power`, `battery_soc`, `grid_power`
   - Each field shows a live state badge — **green ✓** = entity found, **red ✗** = not found
4. In the **🔧 Features** tab, enable your equipment (EV charger, heat pump, etc.)
5. Click **💾 Save & Apply** at the bottom of the Display tab
6. The dashboard rebuilds automatically with your configured entities

---

## Configuration Guide

### Finding Your Entity IDs

Go to **Developer Tools** → **States** in Home Assistant and search for your inverter's entities. Common patterns by brand:

| Inverter | Solar Power | Battery Power | Grid Power |
|---|---|---|---|
| **Deye** | `sensor.deyeinverter_pv_power` | `sensor.deyeinverter_battery_output_power` | `sensor.deyeinverter_grid_load_l1` |
| **SunSynk** | `sensor.sunsynk_pv_power` | `sensor.sunsynk_battery_power` | `sensor.sunsynk_grid_power` |
| **Sigenergy** | `sensor.sigenergy_pv_power` | `sensor.sigenergy_battery_power` | `sensor.sigenergy_grid_power` |
| **Huawei** | `sensor.inverter_input_power` | `sensor.battery_charge_discharge_power` | `sensor.power_meter_active_power` |
| **SolarEdge** | `sensor.solaredge_current_power` | `sensor.solaredge_storage_power` | `sensor.solaredge_grid_power` |
| **Fronius** | `sensor.fronius_pv_power` | `sensor.fronius_battery_power` | `sensor.fronius_grid_power` |

> These are examples — actual entity names depend on your specific setup. Check Developer Tools → States.

### Config Persistence

Your settings are stored in two places for reliability:
1. **Browser localStorage** — instant load on page open (fast cache)
2. **HA dashboard config** — synced via WebSocket, survives browser cache clears

Settings auto-sync between browsers on the same HA instance.

---

## Entity Reference

### Core Power Entities (Required)

| Settings Field | Description | Example |
|---|---|---|
| `solar_power` | Real-time solar generation (W) | `sensor.inverter_pv_power` |
| `load_power` | Real-time home consumption (W) | `sensor.inverter_load_power` |
| `battery_power` | Battery charge/discharge power (W) | `sensor.inverter_battery_power` |
| `battery_soc` | Battery state of charge (%) | `sensor.inverter_battery_soc` |
| `grid_power` | Grid import/export power (W) | `sensor.inverter_grid_power` |

### Daily Energy Totals (Recommended)

| Settings Field | Description |
|---|---|
| `solar_energy_today` | Total solar generation today (kWh) |
| `load_energy_today` | Total consumption today (kWh) |
| `battery_charge_today` | Energy charged into battery today (kWh) |
| `battery_discharge_today` | Energy discharged from battery today (kWh) |
| `grid_import_today` | Grid import today (kWh) |
| `grid_export_today` | Grid export today (kWh) |

### EV Charger Entities (Optional — Enable in Features)

| Settings Field | Description |
|---|---|
| `ev_charger_power` | EV charger power draw (W) |
| `ev_charger_status` | Charger status (charging/idle/etc.) |
| `ev_soc` | Electric vehicle battery state of charge (%) |
| `ev_charger_energy_today` | EV energy charged today (kWh) |

### Heat Pump Entity (Optional — Enable in Features)

| Settings Field | Description |
|---|---|
| `heat_pump_power` | Heat pump power consumption (W) |

### EMHASS MPC Entities (Optional — Enable EMHASS in Features)

| Settings Field | Description |
|---|---|
| `emhass_mode` | Current optimization mode (CHARGE/DISCHARGE/IDLE) |
| `emhass_reason` | Human-readable decision reason |
| `emhass_battery_action` | Battery action command summary |
| `mpc_battery` | MPC battery power forecast (attribute: `battery_scheduled_power`) |
| `mpc_grid` | MPC grid power forecast (attribute: `forecasts`) |
| `mpc_pv` | MPC PV generation forecast (attribute: `forecasts`) |
| `mpc_soc` | MPC battery SoC forecast (attribute: `battery_scheduled_soc`) |
| `mpc_load` | MPC load forecast (attribute: `forecasts`) |

### EMHASS Financial Entities (Optional — Enable Financial Tracking)

| Settings Field | Description |
|---|---|
| `buy_price` | EMHASS buy price forecast (attribute: `unit_load_cost_forecasts`) |
| `sell_price` | EMHASS sell price forecast (attribute: `unit_prod_price_forecasts`) |
| `cost_today` | Today's electricity cost |
| `savings_today` | Today's estimated savings |

### Price Entities (Optional)

| Settings Field | Description |
|---|---|
| `nordpool` | Nordpool spot price sensor |
| `current_import_price` | Live import electricity price (€/kWh) |
| `current_export_price` | Live export electricity price (€/kWh) |

### Battery Pack Monitoring (Optional)

| Settings Field | Description |
|---|---|
| `battery_pack1_soc` – `battery_pack4_soc` | Individual pack SoC sensors |
| `battery_pack_prefix` | BMS entity prefix (e.g., `sensor.battery_monitor_pack_`) for expandable detail panels showing cell voltages, temperatures, SoH, and cycle count |

### Inverter & System Detail Entities (Optional)

| Settings Field | Description |
|---|---|
| `inverter_temp` | Inverter temperature |
| `inverter_output_power` | Inverter output power (W) |
| `rated_power` | Inverter rated power (W) |
| `pv1_power` / `pv2_power` | Individual PV string power |
| `grid_voltage` | Grid voltage (V) |
| `grid_frequency` | Grid frequency (Hz) |

### Solar Forecast Entities (Optional — Enable in Features)

| Settings Field | Description |
|---|---|
| `solar_forecast_today` | Forecast total solar production today (kWh) |
| `solar_forecast_tomorrow` | Forecast total solar production tomorrow (kWh) |
| `solar_forecast_remaining` | Remaining forecast production today (kWh) |
| `solar_forecast_power` | Current forecast power (W) |

### Automation Entities (Optional)

| Settings Field | Description |
|---|---|
| `automation_charge` | Automation entity for force charge |
| `automation_discharge` | Automation entity for force discharge |

### Deferrable Load Entities (Optional — Enable in Features)

| Settings Field | Description |
|---|---|
| `deferrable_load_1` – `deferrable_load_3` | Deferrable load power sensors (heat pump, boiler, etc.) |
| `deferrable_load_1_name` – `deferrable_load_3_name` | Display names for deferrable loads |

---

## Feature Toggles

Configure in Settings → **🔧 Features** tab:

| Toggle | Default | What It Does |
|---|---|---|
| **EV Charger** | Off | Shows EV charger power flow on house card, adds EV comet animation path |
| **EV Vehicle** | Off | Shows car in garage illustration on house card |
| **Heat Pump** | Off | Shows heat pump power flow on house card |
| **Grid Connection** | On | Turn **off** for off-grid systems — hides grid cable and animation |
| **Hide Cables** | Off | Hides static cable lines, shows only animated power flow comets |
| **Battery Packs** | 2 | Number of battery modules (1–8) — controls device card layout and entity slots |
| **EMHASS** | On | Enables EMHASS status card, forecast overlays on chart, and financial tracking |
| **EMHASS Forecasts** | On | Adds MPC forecast dashed lines to energy chart |
| **Deferrable Loads** | Off | Enables 3 deferrable load entity slots and schedule display |
| **Financial Tracking** | On | Shows Cost Today and Savings Today metrics in chart header |
| **Solar Forecast** | Off | Enables Solcast/forecast.solar entity slots and chip display |
| **Weather Widget** | On | Shows weather emoji + temperature badge on house card |
| **Sunrise/Sunset** | On | Shows sunrise/sunset times on house card |

> **Note**: Toggling EMHASS, Forecasts, Deferrable Loads, Financial Tracking, or Solar Forecast triggers a full dashboard rebuild to add/remove the relevant chart series and cards.

---

## Pricing Configuration

Configure in Settings → **💰 Pricing** tab:

| Setting | Default | Description |
|---|---|---|
| **Price Source** | Nordpool | Label selector: Nordpool, Tibber, Amber, or Custom |
| **Cheap Threshold** | 0.10 | Prices below this are highlighted green |
| **Expensive Threshold** | 0.25 | Prices above this are highlighted red |
| **Currency** | € | Currency symbol for price display |
| **Price Overlay** | On | Show import/export price curves on energy chart (secondary Y-axis) |
| **Price Badge** | On | Show current electricity price on house card |
| **Color Coding** | On | Green/yellow/red price bands based on thresholds |

> ⚠️ **Important**: The price source buttons (Nordpool / Tibber / Amber / Custom) are **display labels only** — they do not automatically configure any entities or change behavior. You must manually set the price-related entity fields (`buy_price`, `sell_price`, `nordpool`, `current_import_price`, `current_export_price`) in the **Entities** tab for price features to work.

---

## Display Preferences

Configure in Settings → **🎨 Display** tab:

| Setting | Default | Description |
|---|---|---|
| **Power Threshold** | 1000 W | Below: show Watts. Above: auto-scale to kW |
| **Decimal Places** | 1 | Number formatting precision (0, 1, or 2) |
| **Chart Range** | Today | Default chart time span: Today, 24h, or 7 days |
| **SoC Ring Low** | 40% | Below this: SoC ring pulses red on house card |
| **SoC Ring High** | 60% | Above this: green ring. Between low and high: orange |

---

## House Card Customization

The house card (`custom:sigenergy-house-card`) supports customization through its YAML configuration:

### Cable/Flow Colors
```yaml
type: custom:sigenergy-house-card
colors:
  solar: "#f5c542"
  battery_charge: "#e74c3c"
  battery_discharge: "#2ecc71"
  grid_import: "#e74c3c"
  grid_export: "#2ecc71"
  home: "#3498db"
  ev: "#9b59b6"
  heat_pump: "#e67e22"
```

### Path Editor Mode (Advanced)

For advanced users who want to customize cable routing on the house card:

1. Add `edit_paths: true` to the house card YAML config
2. Reload the dashboard
3. Control points appear on each cable path — drag to reposition
4. The SoC ring position and perspective skew are also adjustable
5. Copy the resulting path coordinates from the browser console as JSON
6. Remove `edit_paths: true` when done

### Visual Layers
The house card composites multiple PNG layers:
- **House**: `home_has_solar_has_car.png` (day) / `dark_home_has_solar_has_car.png` (night) — switches automatically
- **No-EV variant**: `home_has_solar_no_car.png` — used when no EV charger entity is configured
- **Overlays**: `sigenstor_home.png` (battery), `ammeter_home.png` (meter), `ac_charger_bg.png` (EV charger), `device_heat_pump.png` (heat pump)
- **SVG Overlay**: Animated cable paths with power flow comets
- **SoC Ring**: Battery percentage indicator with color + pulse based on thresholds
- **Weather Badge**: Top-right weather icon + temperature
- **Power Labels**: Real-time wattage at each connection point

---

## Responsive Layout

| Viewport Width | Columns | Layout Description |
|---|---|---|
| **≤ 500px** | 1 | Compact mobile — cards stacked vertically |
| **501–800px** | 1 | Standard mobile — single column with full-width cards |
| **801–1200px** | 2 | Tablet — house card + charts side by side |
| **≥ 1201px** | 3 | Desktop — House (33%) / Energy Flow (29%) / Battery (38%) |

---

## Troubleshooting

| Problem | Solution |
|---|---|
| **Cards not appearing** | Clear browser cache (Ctrl+Shift+Delete), hard-refresh (Ctrl+Shift+R) |
| **"Custom element doesn't exist"** | Install the 5 required HACS dependencies (layout-card, apexcharts-card, sankey-chart, mushroom, card-mod) and restart HA |
| **Entity not found (red ✗ badge)** | Check entity ID in Developer Tools → States. Entity IDs are case-sensitive |
| **Light/wrong theme** | Install `themes/sigenergy_dark.yaml` to `/config/themes/` and restart HA |
| **House card shows no image** | Ensure `dist/images/` folder exists alongside the JS files (e.g., `/config/www/sigenergy-dashboard/dist/images/`) |
| **Charts show no data** | Ensure core entities (`solar_power`, `load_power`, etc.) are correctly set and have history data |
| **Forecast lines not showing** | Enable EMHASS + EMHASS Forecasts in Features tab, then set MPC entity fields in Entities tab |
| **Settings don't persist across browsers** | Make sure dashboard URL is exactly `dashboard-sigenergy` (case-sensitive) |
| **Battery detail panel empty** | Set `battery_pack_prefix` (e.g., `sensor.battery_monitor_pack_`) in Entities tab |
| **Cards overlap or misaligned** | Ensure `layout-card` is installed. Try: Settings → Dashboards → Resources → check both JS resources are listed |
| **Price badge not showing** | Enable Price Badge in Pricing tab AND set a price entity in Entities tab |

---

## Project Structure

```
sigenergy-dashboard/
├── .github/
│   └── workflows/
│       └── validate.yaml              # HACS validation CI
├── hacs.json                          # HACS plugin metadata
├── LICENSE                            # CC BY-NC-SA 4.0 license
├── README.md                          # This file
├── dashboards/
│   └── sigenergy.yaml                 # Bootstrap dashboard YAML (paste into Raw Editor)
├── dist/
│   ├── sigenergy-dashboard.js         # Bundle: settings card + device card + dashboard builder
│   ├── sigenergy-house-card.js        # Animated house card (Lit Element)
│   └── images/                        # Runtime images (battery renders, house card assets)
│       ├── 1inverter[1-6]battery.png  # Battery stack renders (6 files)
│       ├── home_has_solar_has_car.png # House card day base
│       ├── dark_home_has_solar_has_car.png # House card night base
│       ├── home_has_solar_no_car.png  # House card no-EV variant
│       ├── sigenstor_home.png         # Battery overlay
│       ├── ammeter_home.png           # Meter overlay
│       ├── ac_charger_bg.png          # EV charger overlay
│       └── device_heat_pump.png       # Heat pump overlay
├── screenshots/                       # README screenshots
├── src/
│   ├── cards/
│   │   └── sigenergy-settings-card.js # Settings UI source
│   ├── styles/
│   │   └── theme.js                   # Design tokens & color constants
│   └── utils/
│       ├── config-store.js            # Config persistence (localStorage + HA WebSocket)
│       └── entity-helpers.js          # Entity state formatting helpers
└── themes/
    └── sigenergy_dark.yaml            # HA theme (required for consistent dark appearance)
```

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Make your changes
4. Test with multiple HA themes and viewport sizes
5. Submit a pull request

---

## License

This project is licensed under the **Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International** (CC BY-NC-SA 4.0) license.

You are free to:
- **Share** — copy and redistribute the material
- **Adapt** — remix, transform, and build upon the material

Under the following terms:
- **Attribution** — You must give appropriate credit
- **NonCommercial** — You may not use the material for commercial purposes
- **ShareAlike** — Derivative works must use the same license

See [LICENSE](LICENSE) for the full license text.
