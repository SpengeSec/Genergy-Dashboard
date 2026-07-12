// HAEO Events Card
// Combines Future Decisions (forecast) and Past Events (history) in one card
// Enhanced with: Smart Alert Pills, single-pass day totals, improved formatting
// Requires: sensor.grid_net_cost + associated HAEO sensors
// Copy to /config/www/haeo-events-card.js
// Add resource: /local/haeo-events-card.js (type: JavaScript module)
//
// Card YAML config options (all optional — defaults used if omitted):
//   type: custom:haeo-events-card
//   grid_options:
//     columns: full
//
// ── FUTURE tab: HAEO optimizer sensors (forecast attributes) ──
// Units are auto-detected from unit_of_measurement and normalised to kW internally.
//   entity_haeo_battery:       sensor.battery_active_power       # +ve=discharge, -ve=charge
//   entity_haeo_grid:          sensor.grid_active_power          # +ve=import, -ve=export
//   entity_haeo_load:          sensor.load_power
//   entity_haeo_solar:         sensor.solar_power
//   entity_haeo_soc:           sensor.battery_state_of_charge
//   entity_haeo_buy_price:     number.grid_import_price
//   entity_haeo_sell_price:    number.grid_export_price
//   entity_haeo_grid_net_cost: sensor.grid_net_cost
//
// ── PAST tab: inverter power sensors (actual measured values) ──
// Defaults are Sigenergy Local Modbus. Override for other inverter integrations.
//   entity_past_battery_power: sensor.sigen_plant_battery_power      # -ve=discharge, +ve=charge
//   entity_past_load_power:    sensor.sigen_plant_total_load_power    # always +ve
//   entity_past_solar_power:   sensor.sigen_plant_pv_power            # always +ve
//   entity_past_grid_power:    sensor.sigen_plant_grid_active_power   # +ve=import, -ve=export
//
// ── PAST tab: inverter energy sensors (total_increasing, for kWh delta columns) ──
// IMPORTANT: Use lifetime/total sensors wherever possible. Daily or monthly sensors
// reset at midnight/month-end causing gaps (shown as —) across multi-day lookbacks.
//   entity_past_load_energy:               sensor.sigen_plant_total_load_consumption        # Lifetime
//   entity_past_solar_energy:              sensor.sigen_plant_total_pv_generation            # Lifetime
//   entity_past_grid_import_energy:        sensor.sigen_plant_total_imported_energy          # Lifetime
//   entity_past_grid_export_energy:        sensor.sigen_plant_total_exported_energy          # Lifetime
//   entity_past_battery_charge_energy:     sensor.sigen_plant_daily_battery_charge_energy    # Daily reset
//   entity_past_battery_discharge_energy:  sensor.sigen_plant_daily_battery_discharge_energy # Daily reset

const _HAEO_VERSION = 'v2.7.1';

let _HAEO_CUR = '$';

// ── Default sensor entity IDs ────────────────────────────────────────────────
// Power sensors: provided by HAEO optimizer — same for all installs
// Energy sensors: provided by inverter integration — Sigenergy Local Modbus defaults
const _HAEO_DEFAULTS = {
  // ── FUTURE tab: HAEO optimizer sensors ──
  haeo_battery:       'sensor.battery_active_power',    // +ve=discharge, -ve=charge
  haeo_grid:          'sensor.grid_active_power',        // +ve=import,    -ve=export
  haeo_load:          'sensor.load_power',
  haeo_solar:         'sensor.solar_power',
  haeo_soc:           'sensor.battery_state_of_charge',
  haeo_buy_price:     'number.grid_import_price',
  haeo_sell_price:    'number.grid_export_price',
  haeo_grid_net_cost: 'sensor.grid_net_cost',
  haeo_export_limit:  'number.grid_export_limit',
  haeo_import_limit:  'number.grid_import_limit',
  haeo_batt_charge_limit:    'number.battery_max_charge_power',
  haeo_batt_discharge_limit: 'number.battery_max_discharge_power',
  haeo_ev_power:      'sensor.ev_active_power',
  haeo_ev_soc:        'sensor.ev_state_of_charge',
  haeo_ev1_power:     'sensor.ev1_active_power',
  haeo_ev1_soc:       'sensor.ev1_state_of_charge',
  haeo_ev2_power:     'sensor.ev2_active_power',
  haeo_ev2_soc:       'sensor.ev2_state_of_charge',
  // ── PAST tab: inverter power sensors (Sigenergy Local Modbus defaults) ──
  past_battery_power: 'sensor.sigen_plant_battery_power',       // -ve=discharge, +ve=charge
  past_load_power:    'sensor.sigen_plant_total_load_power',    // always +ve
  past_solar_power:   'sensor.sigen_plant_pv_power',            // always +ve
  past_grid_power:    'sensor.sigen_plant_grid_active_power',   // +ve=import, -ve=export
  // ── PAST tab: inverter energy sensors (total_increasing, Sigenergy Local Modbus defaults) ──
  past_load_energy:              'sensor.sigen_plant_total_load_consumption',        // Lifetime
  past_solar_energy:             'sensor.sigen_plant_total_pv_generation',            // Lifetime
  past_grid_import_energy:       'sensor.sigen_plant_total_imported_energy',          // Lifetime
  past_grid_export_energy:       'sensor.sigen_plant_total_exported_energy',          // Lifetime
  past_battery_charge_energy:    'sensor.sigen_plant_daily_battery_charge_energy',    // Daily reset
  past_battery_discharge_energy: 'sensor.sigen_plant_daily_battery_discharge_energy', // Daily reset
};

// ── Colour scheme ─────────────────────────────────────────────────────────────
const _HAEO_COLOURS = {
  solar_green: { bg: '#ccffcc', txt: '#333333', cost: '#333333' },
  solar:       { bg: '#ffffcc', txt: '#333333', cost: '#333333' },
  teal:        { bg: '#ccfff5', txt: '#333333', cost: '#333333' },
  pink:        { bg: '#ffe0e0', txt: '#333333', cost: '#cc3333' },
  pink_dark:   { bg: '#ffb3b3', txt: '#333333', cost: '#cc3333' },
  red:         { bg: 'rgba(180,50,50,0.35)', txt: '#ffffff', cost: '#ffaaaa' },
  green:       { bg: 'rgba(30,150,80,0.55)',  txt: '#ffffff', cost: '#90ffb0' },
};

// ── Legend ────────────────────────────────────────────────────────────────────
const _HAEO_LEG_L = [
  ['#ccffcc','#333','🌞 Solar → 🏠 Home','Self Consumption - Solar'],
  ['#ccffcc','#333','🌞 Solar → 🏠 Home + 🔋 Battery','Self Consumption - Charge Battery'],
  ['#ccffcc','#333','🌞 Solar → 🏠 Home + 🚗 EV','Self Consumption - Solar to EV'],
  ['#ccffcc','#333','🌞 Solar → 🏠 Home + 🔋 Battery + 🚗 EV','Self Consumption - Solar to Home + Battery + EV'],
  ['#ccffcc','#333','🌞 Solar → 🏠 Home + ⚡ Grid','Profit - Grid Export (Solar)'],
  ['#ccffcc','#333','🌞 Solar → 🏠 Home + 🔋 Battery + ⚡ Grid','Profit - Grid Export + Charge Battery'],
  ['#ccfff5','#333','🌞 Solar + 🔋 Battery → 🏠 Home','Self Consumption - Solar + Battery'],
  ['#ccfff5','#333','🌞 Solar + 🔋 Battery → 🏠 Home + 🚗 EV','Self Consumption - Solar + Battery to Home + EV'],
  ['#ccfff5','#333','🌞 Solar + 🔋 Battery + 🚗 EV → 🏠 Home','Self Consumption - Solar + Battery + EV'],
  ['#ffb3b3','#333','🌞 Solar + 🔋 Battery → 🏠 Home + ⚡ Grid (Force)','Profit - Grid Export (Forced Battery)'],
  ['#ffe0e0','#333','🌞 Solar + ⚡ Grid → 🏠 Home','Cost - Solar + Grid Import'],
  ['#ffe0e0','#333','🌞 Solar + ⚡ Grid → 🏠 Home + 🚗 EV','Cost - Solar + Grid to Home + EV'],
  ['#ffe0e0','#333','🌞 Solar + ⚡ Grid → 🏠 Home + 🔋 Battery (Force)','Cost - Solar + Grid Import + Charge Battery'],
];

const _HAEO_LEG_R = [
  ['#ccfff5','#333','🔋 Battery → 🏠 Home','Self Consumption - Battery'],
  ['#ccfff5','#333','🔋 Battery → 🏠 Home + 🚗 EV','Self Consumption - Battery to Home + EV'],
  ['#ccfff5','#333','🔋 Battery + 🚗 EV → 🏠 Home','Self Consumption - Battery + EV to Home'],
  ['#ffffcc','#333','🔋 Battery → 🏠 Home + ⚡ Grid (Force)','Profit - Grid Export (Forced)'],
  ['#ffe0e0','#333','🔋 Battery + ⚡ Grid → 🏠 Home','Cost - Battery + Grid Import'],
  ['#ffe0e0','#333','🔋 Battery + 🚗 EV + ⚡ Grid → 🏠 Home','Cost - Battery + EV + Grid to Home'],
  ['rgba(180,50,50,0.35)','#fff','⚡ Grid → 🏠 Home','Cost - Grid Import (Battery Idle | No Solar)'],
  ['rgba(180,50,50,0.35)','#fff','⚡ Grid → 🏠 Home + 🚗 EV','Cost - Grid Import to Home + EV'],
  ['rgba(180,50,50,0.35)','#fff','🚗 EV → 🏠 Home','Cost - EV to Home'],
  ['#ccfff5','#333','❄️ 🚿 Scheduled Load(s)','Placeholder - HVAC, HWS - Deferrable Loads'],
];

// ── Determine Mode and Focus from classification ────────────────────────────
function _haeo_getModeAndFocus(label) {
  let mode = '', focus = '';
  let modeColor = '#9c27b0', focusColor = '#555';
  
  // Determine mode from label keywords
  if (label.includes('Self Consumption') || label.includes('Battery → 🏠') || label.includes('Solar → 🏠')) {
    mode = 'SELF CONSUMPTION';
    modeColor = '#28a745'; // green
    focus = 'Optimising Self Use';
    focusColor = '#28a745';
  } else if (label.includes('Profit') || label.includes('Grid Export') || label.includes('→ ⚡ Grid')) {
    mode = 'MAXIMISE PROFIT';
    modeColor = '#FF6B2C'; // orange
    focus = 'Optimising Grid Export';
    focusColor = '#FF6B2C';
  } else if (label.includes('Cost') || label.includes('Grid Import') || label.includes('⚡ Grid →')) {
    mode = 'MINIMISE COST';
    modeColor = '#2196F3'; // blue
    focus = 'Optimising Grid Import';
    focusColor = '#2196F3';
  }
  
  return { mode, focus, modeColor, focusColor };
}

// ── Event Descriptions (for hover tooltips & legend modal) ──────────────────────
const _HAEO_DESCRIPTIONS = {
  // Self Consumption - Solar scenarios
  '🌞 Solar → 🏠 Home Load': 
    'Solar is supplying home load only. Battery idle and no grid activity. Optimal self-consumption with zero import/export.',
  
  '🌞 Solar → 🏠 Home Load + 🔋 Battery': 
    'Solar is supplying home load and charging battery. No grid activity. Battery will be available for discharge during peak demand or low solar periods.',
  
  '🌞 Solar + 🔋 Battery → 🏠 Home Load': 
    'Solar and battery together supplying home load. Battery is discharging to supplement solar. No grid activity.',
  
  '🌞 Solar → 🏠 Home Load + ⚡ Grid': 
    'Solar supplying home load with surplus exported to grid. Battery idle. Export occurs when solar generation exceeds home load.',
  
  '🌞 Solar → 🏠 Home Load + 🔋 Battery + ⚡ Grid': 
    'Solar supplying home load, charging battery, and exporting surplus to grid simultaneously. Optimal three-way allocation.',
  
  '🌞 Solar + 🔋 Battery → 🏠 Home Load + ⚡ Grid': 
    'Solar and battery together supplying home load with remaining power exported to grid. Battery discharging to maximize export.',
  
  '🌞 Solar → 🏠 Home Load + ⚡ Grid + 🔋 Battery (Force)': 
    'Solar supplying home load, charging battery, and exporting surplus to grid. Scheduled battery charge at optimal solar window.',
  
  '🌞 Solar + ⚡ Grid → 🏠 Home Load': 
    'Solar with grid supplement covering home load. Solar alone is insufficient; grid imports additional power.',
  
  '🌞 Solar + 🔋 Battery + ⚡ Grid → 🏠 Home Load': 
    'Solar, battery, and grid together covering home load. Battery discharging but solar and grid both needed due to high home demand.',
  
  '🌞 Solar → 🏠 Home Load + 🚗 EV': 
    'Solar supplying home load and charging EV. Battery idle. Pure solar-to-load and solar-to-EV scenario.',
  
  '🌞 Solar + 🔋 Battery → 🏠 Home Load + 🚗 EV': 
    'Solar and battery supplying home load and charging EV. No grid activity. Battery available for EV charging.',
  
  '🌞 Solar + ⚡ Grid → 🏠 Home Load + 🚗 EV': 
    'Solar and grid together covering home load while charging EV. Solar plus grid import needed for all three loads.',
  
  // Cost scenarios - Grid import (forced charge)
  '⚡ Grid → 🏠 Home Load': 
    'Grid supplying home load only. Battery idle. Occurs during off-peak tariffs or when solar unavailable.',
  
  '⚡ Grid → 🏠 Home Load + 🔋 Battery (Force)': 
    'Grid supplying home load and force-charging battery at low tariff rate during cheap import window. Battery will discharge during peak tariff periods for cost savings.',
  
  '⚡ Grid → 🏠 Home Load + 🚗 EV (Force)': 
    'Grid supplying home load and charging EV at low tariff rate. EV charging optimized for lowest cost periods.',
  
  '⚡ Grid → 🏠 Home Load + 🔋 Battery + 🚗 EV (Force)': 
    'Grid supplying home load, charging battery, and charging EV all at low tariff rate. Multiple loads optimized for cost savings.',
  
  '🌞 Solar + ⚡ Grid → 🏠 Home Load + 🔋 Battery (Force)': 
    'Solar with grid supplement covering home load while force-charging battery at low tariff rate. Battery will be available for peak discharge.',
  
  // Profit scenarios - Grid export (forced discharge)
  '🔋 Battery → 🏠 Home Load + ⚡ Grid (Force)': 
    'Battery discharging to cover home load and force-export to grid at high tariff rate. Scheduled export during peak pricing window for profit.',
  
  '🌞 Solar + 🔋 Battery → 🏠 Home Load + ⚡ Grid (Force)': 
    'Solar and battery together covering home load with forced battery export to grid at peak tariff rate. Maximizes export revenue.',
  
  '🔋 Battery + 🚗 EV → ⚡ Grid (Force)': 
    'Battery and EV both discharging to grid at high tariff rate. EV used as flexible storage asset for export during peak pricing.',
  
  '🌞 Solar + 🔋 Battery + 🚗 EV → ⚡ Grid': 
    'Solar, battery, and EV all exporting to grid simultaneously at peak tariff. Maximum export revenue from all available sources.',
  
  // Battery scenarios - no solar, no grid
  '🔋 Battery → 🏠 Home Load': 
    'Battery powering home load only. No solar generation and no grid activity. Battery will deplete; grid import will follow if battery low.',
  
  '🔋 Battery + ⚡ Grid → 🏠 Home Load': 
    'Battery discharging but grid supplement needed due to high home load exceeding battery capacity. Hybrid support scenario.',
  
  // EV scenarios
  '🚗 EV → 🏠 Home Load': 
    'EV discharging to cover home load (V2H/V2L). Vehicle is supplying power to home. No battery or grid involvement.',
  
  '🚗 EV + ⚡ Grid → 🏠 Home Load': 
    'EV discharging plus grid covering home load. Vehicle and grid both needed for home load demand.',
  
  '🔋 Battery + 🚗 EV → 🏠 Home Load': 
    'Battery and EV both discharging to cover home load. No solar or grid; using stored energy from both sources.',
  
  '🌞 Solar + 🔋 Battery + 🚗 EV → 🏠 Home Load': 
    'Solar, battery, and EV together supplying home load. All available sources optimized for load coverage.',
  
  '🌞 Solar + ⚡ Grid → 🏠 Home Load + 🚗 EV': 
    'Solar and grid together covering home load while charging EV. Solar plus grid import needed for all three loads.',
  
  '🌞 Solar → 🏠 Home Load + 🚗 EV + 🔋 Battery (Force)': 
    'Solar supplying home load and charging both EV and battery at low tariff rate. Battery will discharge during peak periods.',
  
  '🌞 Solar + ⚡ Grid → 🏠 Home Load + 🚗 EV + 🔋 Battery (Force)': 
    'Solar with grid supplement covering home load while force-charging both battery and EV at low tariff rate. Maximizes both storage assets.',
  
  '⚡ Grid → 🏠 Home Load + 🚗 EV + 🔋 Battery (Force)': 
    'Grid covering home load and force-charging both EV and battery at low tariff rate during cheap import window. Both will discharge during peak tariff periods for cost savings.',
  
  '🔋 Battery → 🚗 EV + 🏠 Home Load': 
    'Battery covering both home load and charging EV simultaneously. No solar or grid activity. Battery powering two loads.',
  
  '🔋 Battery → 🚗 EV (Charging)': 
    'Battery charging EV only. No solar, no grid, no home load involvement. Pure battery-to-vehicle charge transfer.',
};

function _haeo_classifyFuture(solarKw, loadKw, battKw, gridKw, evKw) {
  const T = 0.05;
  const charging    = battKw < -T;
  const discharging = battKw > T;
  const exporting   = gridKw < -T;  // negative = export
  const importing   = gridKw > T;   // positive = import
  const evCharging  = evKw < -T;
  const evDischarging = evKw > T;

  // ── EV Scenarios ──
  if (evDischarging && exporting && discharging && solarKw > T)
    return { label: '🌞 Solar + 🔋 Battery + 🚗 EV → ⚡ Grid', note: 'Solar, battery and EV all exporting to grid', color: 'green' };
  if (evDischarging && exporting && discharging)
    return { label: '🔋 Battery + 🚗 EV → ⚡ Grid (Force)', note: 'Battery and EV exporting to grid', color: 'solar' };
  if (evDischarging && importing && charging && solarKw > T)
    return { label: '🌞 Solar + ⚡ Grid → 🏠 Home + 🔋 Battery + 🚗 EV', note: 'Solar and grid covering home, battery and EV', color: 'pink' };
  if (evDischarging && importing && charging)
    return { label: '⚡ Grid → 🏠 Home + 🔋 Battery + 🚗 EV (Force)', note: 'Grid covering home and charging battery + EV', color: 'red' };
  if (evDischarging && discharging && solarKw > T)
    return { label: '🌞 Solar + 🔋 Battery + 🚗 EV → 🏠 Home', note: 'Solar, battery and EV covering home', color: 'teal' };
  if (evDischarging && discharging)
    return { label: '🔋 Battery + 🚗 EV → 🏠 Home', note: 'Battery and EV covering home', color: 'teal' };
  if (evDischarging && importing)
    return { label: '🚗 EV + ⚡ Grid → 🏠 Home', note: 'EV and grid covering home', color: 'pink' };
  if (evDischarging)
    return { label: '🚗 EV → 🏠 Home', note: 'EV covering home', color: 'teal' };
  if (evCharging && solarKw > T && discharging)
    return { label: '🌞 Solar + 🔋 Battery → 🏠 Home + 🚗 EV', note: 'Solar and battery covering home and charging EV', color: 'solar_green' };
  if (evCharging && solarKw > T && importing)
    return { label: '🌞 Solar + ⚡ Grid → 🏠 Home + 🚗 EV', note: 'Solar and grid covering home and charging EV', color: 'pink' };
  if (evCharging && solarKw > T && charging)
    return { label: '🌞 Solar → 🏠 Home + 🚗 EV + 🔋 Battery (Force)', note: 'Solar covering home and charging both EV and battery at low tariff', color: 'solar_green' };
  if (evCharging && solarKw > T)
    return { label: '🌞 Solar → 🏠 Home + 🚗 EV', note: 'Solar covering home and charging EV', color: 'solar_green' };
  if (evCharging && importing && charging && solarKw > T)
    return { label: '🌞 Solar + ⚡ Grid → 🏠 Home + 🚗 EV + 🔋 Battery (Force)', note: 'Solar with grid supplement covering home and charging both EV and battery at low tariff', color: 'pink' };
  if (evCharging && importing && charging)
    return { label: '⚡ Grid → 🏠 Home + 🚗 EV + 🔋 Battery (Force)', note: 'Grid covering home and charging both EV and battery at low tariff rate', color: 'red' };
  if (evCharging && importing)
    return { label: '⚡ Grid → 🏠 Home + 🚗 EV (Force)', note: 'Grid covering home and charging EV', color: 'red' };
  if (evCharging && charging)
    return { label: '🔋 Battery → 🚗 EV + 🏠 Home Load', note: 'Battery covering home load and charging EV', color: 'teal' };
  if (evCharging)
    return { label: '🔋 Battery → 🚗 EV (Charging)', note: 'Battery charging EV', color: 'teal' };

  // ── Force export (battery discharging to grid) ──
  if (exporting && discharging && solarKw > T)
    return { label: '🌞 Solar + 🔋 Battery → 🏠 Home + ⚡ Grid (Force)', note: 'Forced export: solar and battery exporting to grid', color: 'pink_dark' };
  if (exporting && discharging)
    return { label: '🔋 Battery → 🏠 Home + ⚡ Grid (Force)', note: 'Forced discharge: battery exporting to grid', color: 'solar' };

  // ── Forced grid charge ──
  if (charging && importing && solarKw > T)
    return { label: '🌞 Solar + ⚡ Grid → 🏠 Home + 🔋 Battery (Force)', note: 'Solar + forced grid charging battery', color: 'pink' };
  if (charging && importing)
    return { label: '⚡ Grid → 🏠 Home + 🔋 Battery (Force)', note: 'Forced grid charging — cheap rate window', color: 'red' };
  if (charging && solarKw > T)
    return { label: '🌞 Solar → 🏠 Home + 🔋 Battery', note: 'Solar covering home and charging battery — no grid', color: 'solar_green' };

  // ── Solar scenarios ──
  if (solarKw > T && exporting && battKw > T)
    return { label: '🌞 Solar + 🔋 Battery → 🏠 Home + ⚡ Grid (Force)', note: 'Solar and battery covering home and exporting', color: 'green' };
  if (solarKw > T && exporting && charging)
    return { label: '🌞 Solar → 🏠 Home + 🔋 Battery + ⚡ Grid', note: 'Solar covering home, charging battery and exporting', color: 'solar_green' };
  if (solarKw > T && exporting)
    return { label: '🌞 Solar → 🏠 Home + ⚡ Grid', note: 'Solar covering home and exporting surplus', color: 'solar_green' };
  if (solarKw > T && discharging && importing)
    return { label: '🌞 Solar + 🔋 Battery + ⚡ Grid → 🏠 Home', note: 'Solar and battery discharging but grid also needed', color: 'pink' };
  if (solarKw > T && discharging)
    return { label: '🌞 Solar + 🔋 Battery → 🏠 Home', note: 'Solar and battery together covering home — no grid', color: 'teal' };
  if (solarKw > T && importing)
    return { label: '🌞 Solar + ⚡ Grid → 🏠 Home', note: 'Solar and grid together covering home', color: 'pink' };
  if (solarKw > T && charging)
    return { label: '🌞 Solar → 🏠 Home + 🔋 Battery', note: 'Solar covering home and charging battery — no grid', color: 'solar_green' };
  if (solarKw > T)
    return { label: '🌞 Solar → 🏠 Home', note: 'Solar covering home — no battery, no grid', color: 'solar_green' };

  // ── No solar ──
  if (discharging && exporting)
    return { label: '🔋 Battery → 🏠 Home + ⚡ Grid (Force)', note: 'Forced discharge: battery exporting to grid', color: 'solar' };
  if (discharging && importing)
    return { label: '🔋 Battery + ⚡ Grid → 🏠 Home', note: 'Battery discharging but grid supplement needed', color: 'pink' };
  if (discharging)
    return { label: '🔋 Battery → 🏠 Home', note: 'Battery powering home — no solar, no grid', color: 'teal' };
  if (importing && charging)
    return { label: '⚡ Grid → 🏠 Home + 🔋 Battery (Force)', note: 'Forced grid charging — cheap rate window', color: 'red' };
  if (importing)
    return { label: '⚡ Grid → 🏠 Home', note: 'Grid covering home — battery idle', color: 'red' };
  // Fallback: load present but source not explicit in forecast
  if (loadKw > T)
    return { label: '🔋 Battery → 🏠 Home', note: 'Inferred: battery powering home — no explicit source in forecast', color: 'teal' };
  return { label: '—', note: '', color: '' };
}

// ── Classify past ─────────────────────────────────────────────────────────────
function _haeo_classifyPast(solarKw, loadKw, battKw, gridKw, evKw) {
  const T = 0.10;
  const charging    = battKw < -T;
  const discharging = battKw > T;
  const exporting   = gridKw < -T;  // negative = export
  const importing   = gridKw > T;   // positive = import
  const evCharging  = evKw < -T;
  const evDischarging = evKw > T;

  // ── EV Scenarios ──
  if (evDischarging && exporting && discharging && solarKw > T)
    return { label: '🌞 Solar + 🔋 Battery + 🚗 EV → ⚡ Grid', color: 'green' };
  if (evDischarging && exporting && discharging)
    return { label: '🔋 Battery + 🚗 EV → ⚡ Grid (Force)', color: 'solar' };
  if (evDischarging && discharging && solarKw > T)
    return { label: '🌞 Solar + 🔋 Battery + 🚗 EV → 🏠 Home', color: 'teal' };
  if (evDischarging && discharging)
    return { label: '🔋 Battery + 🚗 EV → 🏠 Home', color: 'teal' };
  if (evDischarging && importing)
    return { label: '🚗 EV + ⚡ Grid → 🏠 Home', color: 'pink' };
  if (evDischarging)
    return { label: '🚗 EV → 🏠 Home', color: 'teal' };
  if (evCharging && solarKw > T && discharging)
    return { label: '🌞 Solar + 🔋 Battery → 🏠 Home + 🚗 EV', color: 'solar_green' };
  if (evCharging && solarKw > T && importing)
    return { label: '🌞 Solar + ⚡ Grid → 🏠 Home + 🚗 EV', color: 'pink' };
  if (evCharging && solarKw > T && charging)
    return { label: '🌞 Solar → 🏠 Home + 🚗 EV + 🔋 Battery (Force)', color: 'solar_green' };
  if (evCharging && solarKw > T)
    return { label: '🌞 Solar → 🏠 Home + 🚗 EV', color: 'solar_green' };
  if (evCharging && importing && charging)
    return { label: '⚡ Grid → 🏠 Home + 🚗 EV + 🔋 Battery (Force)', color: 'red' };
  if (evCharging && importing)
    return { label: '⚡ Grid → 🏠 Home + 🚗 EV (Force)', color: 'red' };
  if (evCharging && charging)
    return { label: '🔋 Battery → 🚗 EV + 🏠 Home Load', color: 'teal' };
  if (evCharging)
    return { label: '🔋 Battery → 🚗 EV (Charging)', color: 'teal' };

  // Force export (battery discharging to grid)
  if (exporting && discharging && solarKw > T)
    return { label: '🌞 Solar + 🔋 Battery → 🏠 Home + ⚡ Grid (Force)', color: 'pink_dark' };
  if (exporting && discharging)
    return { label: '🔋 Battery → 🏠 Home + ⚡ Grid (Force)', color: 'solar' };
  // Solar with export
  if (solarKw > T && exporting && charging)
    return { label: '🌞 Solar → 🏠 Home + 🔋 Battery + ⚡ Grid', color: 'solar_green' };
  if (solarKw > T && exporting)
    return { label: '🌞 Solar → 🏠 Home + ⚡ Grid', color: 'solar_green' };
  // Forced grid charge
  if (charging && importing && solarKw > T)
    return { label: '🌞 Solar + ⚡ Grid → 🏠 Home + 🔋 Battery (Force)', color: 'pink' };
  if (charging && importing)
    return { label: '⚡ Grid → 🏠 Home + 🔋 Battery (Force)', color: 'red' };
  if (charging && solarKw > T)
    return { label: '🌞 Solar → 🏠 Home + 🔋 Battery', color: 'solar_green' };
  // Solar self-consumption
  if (solarKw > T && discharging && importing)
    return { label: '🌞 Solar + 🔋 Battery + ⚡ Grid → 🏠 Home', color: 'pink' };
  if (solarKw > T && discharging)
    return { label: '🌞 Solar + 🔋 Battery → 🏠 Home', color: 'teal' };
  if (solarKw > T && importing)
    return { label: '🌞 Solar + ⚡ Grid → 🏠 Home', color: 'pink' };
  if (solarKw > T)
    return { label: '🌞 Solar → 🏠 Home', color: 'solar_green' };
  // No solar
  if (discharging && importing)
    return { label: '🔋 Battery + ⚡ Grid → 🏠 Home', color: 'pink' };
  if (discharging)
    return { label: '🔋 Battery → 🏠 Home', color: 'teal' };
  if (importing && charging)
    return { label: '⚡ Grid → 🏠 Home + 🔋 Battery (Force)', color: 'red' };
  if (importing)
    return { label: '⚡ Grid → 🏠 Home', color: 'red' };
  if (loadKw > T)
    return { label: '⚡ Grid → 🏠 Home', color: 'red' };
  return { label: '—', color: '' };
}

// ── Formatters ────────────────────────────────────────────────────────────────
function _haeo_fmtP(v) {
  return (v < 0 ? '-' : '') + _HAEO_CUR + Math.abs(v).toFixed(4);
}

// Returns {disp, col} — cost > 0 = money spent (import), cost < 0 = money earned (export)
function _haeo_fmtCost(cost) {
  if (cost > 0.0001)  return { disp: '-' + _HAEO_CUR + cost.toFixed(3),           col: null };
  if (cost < -0.0001) return { disp: _HAEO_CUR  + Math.abs(cost).toFixed(3), col: '#4caf50' };
  return { disp: '—', col: null };
}

// Binary search: most recent state value at or before timestamp ts
function _haeo_getAt(arr, ts) {
  if (!arr || !arr.length) return null;
  let lo = 0, hi = arr.length - 1, best = null;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (arr[mid].t <= ts) { best = arr[mid].s; lo = mid + 1; }
    else hi = mid - 1;
  }
  return best;
}

// Energy delta between two consecutive slots from a total_increasing sensor.
// mult normalises the result to kWh (auto-detected from unit_of_measurement).
// Returns null if no data; 0 if reset detected (delta < 0 — daily/monthly sensor reset).
// Note: daily-reset sensors (e.g. battery charge/discharge) produce a 0 delta at midnight
// rather than a gap, which shows as — in the table. Lifetime sensors are preferred to
// avoid this — see config comments at top of file.
function _haeo_getDelta(arr, ts, prevTs, mult) {
  if (!arr || !arr.length) return null;
  const curr = parseFloat(_haeo_getAt(arr, ts));
  const prev = parseFloat(_haeo_getAt(arr, prevTs));
  if (isNaN(curr) || isNaN(prev)) return null;
  const delta = curr - prev;
  return delta < 0 ? 0 : delta * (mult || 1);
}

// ── Unit normalisation ───────────────────────────────────────────────────────
// Read unit_of_measurement from hass state and return a multiplier so all
// values are normalised to kW (power) or kWh (energy) internally.
// Power:  W→÷1000, kW→×1, MW→×1000
// Energy: Wh→÷1000, kWh→×1, MWh→×1000, GWh→×1000000
function _haeo_powerMult(hass, entityId) {
  // Normalise to uppercase and trim whitespace before comparing
  const u = (hass?.states[entityId]?.attributes?.unit_of_measurement || 'kW').trim().toUpperCase();
  if (u === 'W')   return 0.001;
  if (u === 'KW')  return 1;
  if (u === 'MW')  return 1000;
  return 1; // default kW for unknown/missing unit
}

function _haeo_energyMult(hass, entityId) {
  const u = (hass?.states[entityId]?.attributes?.unit_of_measurement || 'kWh').trim().toUpperCase();
  if (u === 'WH')  return 0.001;
  if (u === 'KWH') return 1;
  if (u === 'MWH') return 1000;
  if (u === 'GWH') return 1000000;
  return 1; // default kWh for unknown/missing unit
}

// ── Legend HTML ───────────────────────────────────────────────────────────────
function _haeo_legTable(items) {
  const rows = items.map(([bg, txt, label, desc]) => {
    if (!label) return '<tr><td colspan="2" style="border:none;padding:2px 0;"></td></tr>';
    return '<tr>' +
      '<td style="background-color:' + bg + ';color:' + txt + ';padding:3px 8px;white-space:nowrap;border:none;font-size:11px;">' + label + '</td>' +
      '<td style="padding:3px 8px;color:var(--primary-text-color);border:none;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:11px;">' + desc + '</td>' +
      '</tr>';
  }).join('');
  return '<table style="width:100%;border-collapse:collapse;table-layout:auto;border-spacing:0;">' + rows + '</table>';
}

function _haeo_buildLegend() {
  return '<div class="leg" style="font-size:11px;margin-top:12px;">' +
    '<div style="display:flex;justify-content:space-between;align-items:center;padding-bottom:6px;">' +
    '<button id="legend-view-btn" title="View legend" style="background:#000099;border:none;cursor:pointer;color:#fff;font-size:11px;font-weight:600;padding:4px 10px;border-radius:12px;">View Legend</button>' +
    '<span style="color:var(--secondary-text-color);font-size:10px;font-weight:normal;">' + _HAEO_VERSION + '</span>' +
    '</div>' +
    '</div>';
}

// ── Shared column definitions ─────────────────────────────────────────────────
// Time(52) | Event(auto 70%) | Buy(68) | Sell(68) | Load kW(44) kWh(46) | PV kW(44) kWh(46) | Grid kW(44) kWh(46) | Batt kW(44) kWh(46) SoC(46) | EV kW(44) kWh(46) SoC(46) | EV2 kW(44) kWh(46) SoC(46) | Cost(72)
// Event column reduced to 70% of previous width
const _HAEO_COLGROUP =
  '<colgroup>' +
  '<col style="width:52px;">' +                    // Time
  '<col style="width:auto; min-width:154px;">' +   // Event — 70% of 220px = 154px
  '<col style="width:68px;">' +                    // Buy $
  '<col style="width:68px;">' +                    // Sell $
  '<col style="width:44px;">' +                    // Load kW
  '<col style="width:46px;">' +                    // Load kWh
  '<col style="width:44px;">' +                    // PV kW
  '<col style="width:46px;">' +                    // PV kWh
  '<col style="width:44px;">' +                    // Grid kW
  '<col style="width:46px;">' +                    // Grid kWh
  '<col style="width:44px;">' +                    // Batt kW
  '<col style="width:46px;">' +                    // Batt kWh
  '<col style="width:46px;">' +                    // Batt SoC
  '<col style="width:44px;">' +                    // EV kW
  '<col style="width:46px;">' +                    // EV kWh
  '<col style="width:46px;">' +                    // EV SoC
  '<col style="width:44px;">' +                    // EV2 kW
  '<col style="width:46px;">' +                    // EV2 kWh
  '<col style="width:46px;">' +                    // EV2 SoC
  '<col style="width:72px;">' +                    // Cost/Profit
  '</colgroup>';

const _HAEO_THEAD =
  '<thead>' +
  '<tr>' +
  '<th rowspan="2" style="text-align:left;vertical-align:bottom;">Time</th>' +
  '<th rowspan="2" style="text-align:center;vertical-align:bottom;">Event</th>' +
  '<th rowspan="2" style="text-align:center;vertical-align:bottom;box-shadow:inset 2px 0 0 #666;">Buy<br>$</th>' +
  '<th rowspan="2" style="text-align:center;vertical-align:bottom;box-shadow:inset 1px 0 0 #555;">Sell<br>$</th>' +
  '<th colspan="2" style="text-align:center;box-shadow:inset 2px 0 0 #666;border-bottom:1px solid #666;">Load</th>' +
  '<th colspan="2" style="text-align:center;box-shadow:inset 2px 0 0 #666;border-bottom:1px solid #666;">PV</th>' +
  '<th colspan="2" style="text-align:center;box-shadow:inset 2px 0 0 #666;border-bottom:1px solid #666;">Grid</th>' +
  '<th colspan="3" style="text-align:center;box-shadow:inset 2px 0 0 #666;border-bottom:1px solid #666;">Battery</th>' +
  '<th colspan="3" style="text-align:center;box-shadow:inset 2px 0 0 #666;border-bottom:1px solid #666;">EV</th>' +
  '<th colspan="3" style="text-align:center;box-shadow:inset 2px 0 0 #666;border-bottom:1px solid #666;">EV2</th>' +
  '<th rowspan="2" style="text-align:center;vertical-align:bottom;box-shadow:inset 2px 0 0 #666;">Cost/<br>Profit</th>' +
  '</tr>' +
  '<tr>' +
  '<th style="box-shadow:inset 2px 0 0 #666;text-align:right;">kW</th>' +
  '<th class="bgi" style="text-align:right;">kWh</th>' +
  '<th style="box-shadow:inset 2px 0 0 #666;text-align:right;">kW</th>' +
  '<th class="bgi" style="text-align:right;">kWh</th>' +
  '<th style="box-shadow:inset 2px 0 0 #666;text-align:right;">kW</th>' +
  '<th class="bgi" style="text-align:right;">kWh</th>' +
  '<th style="box-shadow:inset 2px 0 0 #666;text-align:right;">kW</th>' +
  '<th class="bgi" style="text-align:right;">kWh</th>' +
  '<th class="bgi" style="text-align:right;">SoC %</th>' +
  '<th style="box-shadow:inset 2px 0 0 #666;text-align:right;">kW</th>' +
  '<th class="bgi" style="text-align:right;">kWh</th>' +
  '<th class="bgi" style="text-align:right;">SoC %</th>' +
  '<th style="box-shadow:inset 2px 0 0 #666;text-align:right;">kW</th>' +
  '<th class="bgi" style="text-align:right;">kWh</th>' +
  '<th class="bgi" style="text-align:right;">SoC %</th>' +
  '</tr>' +
  '</thead>';

// ── CSS ───────────────────────────────────────────────────────────────────────
const _HAEO_STYLE = [
  ':host { display: block; width: 100%; }',
  'ha-card { width: 100%; box-sizing: border-box; }',
  '.card { padding: 8px 12px; font-family: var(--primary-font-family, sans-serif); font-size: 12px; width: 100%; box-sizing: border-box; }',
  '.tabs { display: flex; gap: 0; border-bottom: 2px solid var(--divider-color,#444); margin-bottom: 10px; align-items: stretch; }',
  '.tab { padding: 6px 18px; font-size: 13px; font-weight: 500; cursor: pointer; color: var(--secondary-text-color); border-bottom: 3px solid transparent; margin-bottom: -2px; }',
  '.tab.active { color: #2196F3; border-bottom-color: #2196F3; background: rgba(33,150,243,0.07); }',
  '.sbar { display: flex; gap: 8px; align-items: center; padding: 4px 0 8px 0; font-size: 12px; flex-wrap: wrap; width: 100%; border-bottom: 2px solid #888; margin-bottom: 0; }',
  '.pill { padding: 3px 10px; border-radius: 12px; font-weight: 500; font-size: 11px; color: #fff; }',
  '.stxt { color: var(--secondary-text-color); font-size: 11px; }',
  '.wrap { overflow-y: auto; width: 100%; }',
  '.pane { display: none; }',
  '.pane.active { display: block; }',
  '.dt { border-collapse: collapse; width: 100%; table-layout: fixed; }',
  '.dt th, .dt td { padding: 4px 6px; border-bottom: 1px solid var(--divider-color,#444); font-size: 12px; line-height: 1.3; white-space: nowrap; text-align: right; }',
  '.dt td { padding-right: 8px; }',
  '.dt th:nth-child(1) { text-align: left; box-shadow: inset -1px 0 0 #555; }',
  '.dt td:nth-child(1) { text-align: left !important; box-shadow: inset -1px 0 0 #555; }',
  '.dt td:nth-child(2) { text-align: left; white-space: normal; box-shadow: inset -1px 0 0 #555; }',
  '.dt th:nth-child(2) { white-space: normal; box-shadow: inset -1px 0 0 #555; }',
  '.dt thead { background-color: var(--card-background-color,#1c1c1c); }',
  '.dt thead th { background-color: var(--card-background-color,#1c1c1c); font-weight: bold; color: var(--primary-text-color); border-bottom: 1px solid #666; }',
  '.dt thead tr:last-child th { border-bottom: 2px solid #888; }',
  '.bgl { box-shadow: inset 2px 0 0 #666; }',
  '.bgi { box-shadow: inset 1px 0 0 #555; }',
  '.dr td { background: var(--secondary-background-color); font-weight: bold; border-top: 2px solid var(--divider-color); text-align: left !important; padding: 5px 6px; }',
  '.dr td.bgi, .dr td.bgl { text-align: right !important; }',
  '.msg { padding: 20px; text-align: center; color: var(--secondary-text-color); }',
  '.err { padding: 10px; color: #f44336; }',
  '.tooltip { position: absolute; background: var(--card-background-color); color: var(--primary-text-color); padding: 8px 12px; border-radius: 4px; font-size: 11px; max-width: 350px; white-space: normal; z-index: 999; box-shadow: 0 2px 8px rgba(0,0,0,0.3); line-height: 1.4; }',
  '.legend-modal { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }',
  '.legend-modal-content { background: var(--card-background-color); color: var(--primary-text-color); border-radius: 8px; max-width: 700px; max-height: 85vh; overflow-y: auto; box-shadow: 0 4px 8px rgba(0,0,0,0.3); }',
  '.legend-modal-header { display: flex; justify-content: space-between; align-items: center; padding: 16px; border-bottom: 1px solid var(--divider-color); position: sticky; top: 0; background: var(--card-background-color); }',
  '.legend-modal-header h2 { margin: 0; font-size: 18px; }',
  '.legend-modal-close { background: none; border: none; font-size: 20px; cursor: pointer; color: var(--primary-text-color); }',
  '.legend-modal-body { padding: 16px; }',
  '.legend-category { margin-bottom: 20px; }',
  '.legend-category-title { font-weight: bold; font-size: 13px; margin-bottom: 10px; color: var(--secondary-text-color); }',
  '.legend-item { display: flex; gap: 12px; margin-bottom: 10px; padding: 8px; border-radius: 4px; background: rgba(0,0,0,0.1); }',
  '.legend-item-color { width: 24px; height: 24px; border-radius: 4px; flex-shrink: 0; }',
  '.legend-item-content { flex: 1; }',
  '.legend-item-label { font-weight: 600; font-size: 12px; margin-bottom: 3px; }',
  '.legend-item-desc { font-size: 11px; color: var(--secondary-text-color); line-height: 1.4; }',
].join('\n');

// ── HTML template ─────────────────────────────────────────────────────────────
function _haeo_buildHTML() {
  return '<style>' + _HAEO_STYLE + '</style>' +
    '<ha-card><div class="card">' +

    '<div class="tabs">' +
    '<div class="tab active" id="tab-future">📅 Future Decisions</div>' +
    '<div class="tab" id="tab-past">📋 Past Events</div>' +
    '<span id="grid-export-alert" style="margin-left:auto;align-self:center;padding-right:8px;"></span>' +
    '<span id="range-past-wrap" style="display:none;align-self:center;padding-right:4px;margin-left:auto;">' +
    '<select id="range-past" style="font-size:11px;background:var(--card-background-color);color:var(--primary-text-color);border:1px solid var(--divider-color);border-radius:4px;padding:2px 6px;cursor:pointer;">' +
    '<option value="today">Today</option>' +
    '<option value="yesterday">Yesterday</option>' +
    '<option value="24">Last 24h</option>' +
    '<option value="48">Last 48h</option>' +
    '<option value="72">Last 72h</option>' +
    '<option value="96">Last 96h</option>' +
    '<option value="168">Last 7 days</option>' +
    '</select></span>' +
    '</div>' +

    '<div class="pane active" id="pane-future">' +
    '<div class="sbar" id="sbar-future">⏳ Loading...</div>' +
    '<table class="dt dt-head" style="margin-bottom:0;">' + _HAEO_COLGROUP + _HAEO_THEAD + '</table>' +
    '<div class="wrap"><table class="dt">' + _HAEO_COLGROUP +
    '<tbody id="tb-future"><tr><td colspan="14" class="msg">⏳ Loading...</td></tr></tbody>' +
    '</table></div>' +
    '</div>' +

    '<div class="pane" id="pane-past">' +
    '<div class="sbar">' +
    '<strong style="color:var(--primary-text-color);">Past Events</strong>' +
    '<span class="stxt" id="st-past">Select a range to load</span>' +
    '</div>' +
    '<table class="dt dt-head" style="margin-bottom:0;">' + _HAEO_COLGROUP + _HAEO_THEAD + '</table>' +
    '<div class="wrap"><table class="dt">' + _HAEO_COLGROUP +
    '<tbody id="tb-past"><tr><td colspan="14" class="msg">⏳ Select range to load...</td></tr></tbody>' +
    '</table></div>' +
    '</div>' +

    _haeo_buildLegend() +
    
    '<div id="legend-modal" class="legend-modal" style="display:none;">' +
    '<div class="legend-modal-content">' +
    '<div class="legend-modal-header">' +
    '<h2>Event Legend</h2>' +
    '<button id="legend-modal-close" class="legend-modal-close" title="Close">&times;</button>' +
    '</div>' +
    '<div class="legend-modal-body">' +
    '<div style="display:flex;gap:12px;margin-bottom:16px;flex-wrap:wrap;">' +
    '<label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:12px;">' +
    '<input type="checkbox" id="filter-solar" class="legend-filter" checked style="cursor:pointer;"> ☀️ Solar' +
    '</label>' +
    '<label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:12px;">' +
    '<input type="checkbox" id="filter-battery" class="legend-filter" checked style="cursor:pointer;"> 🔋 Battery' +
    '</label>' +
    '<label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:12px;">' +
    '<input type="checkbox" id="filter-grid" class="legend-filter" checked style="cursor:pointer;"> ⚡ Grid' +
    '</label>' +
    '<label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:12px;">' +
    '<input type="checkbox" id="filter-ev" class="legend-filter" checked style="cursor:pointer;"> 🚗 EV' +
    '</label>' +
    '</div>' +
    '<div id="legend-categories-wrap"></div>' +
    '</div>' +
    '</div>' +
    '</div>' +
    
    '</div></ha-card>';
}

// ── Custom Element ────────────────────────────────────────────────────────────
class HaeoEventsCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._hass         = null;
    this._config       = {};
    this._activeTab    = 'future';
    this._lastCostTs   = null;
    this._lastRenderTs = 0;
    this._pastState    = 'idle';
    this._pastLoadTs   = 0;     // timestamp when _pastState entered 'loading'
  }

  // Detect if HA is in light mode and return appropriate text color for light backgrounds
  _getTextColorForLightBg() {
    // Check if in light mode by looking at computed background color brightness
    const htmlStyle = getComputedStyle(document.documentElement);
    const bgColor = htmlStyle.getPropertyValue('--card-background-color') || 
                    htmlStyle.getPropertyValue('--ha-card-background') || '#fff';
    
    // Simple brightness check: if background is light, use black text
    const rgb = bgColor.match(/\d+/g);
    if (rgb && rgb.length >= 3) {
      const brightness = (parseInt(rgb[0]) * 299 + parseInt(rgb[1]) * 587 + parseInt(rgb[2]) * 114) / 1000;
      return brightness > 128 ? '#000' : 'var(--primary-text-color)';
    }
    
    // Fallback: check if bgColor looks light (contains 'f' for white-ish)
    return (bgColor.toLowerCase().includes('fff') || bgColor.toLowerCase().includes('ffe')) 
      ? '#000' 
      : 'var(--primary-text-color)';
  }

  // Resolve a sensor entity ID: config override → default → fallback (for EV1)
  _eid(key) {
    let eid = this._config['entity_' + key] || _HAEO_DEFAULTS[key];
    // EV1 fallback: try haeo_ev_power first, fall back to haeo_ev1_power if needed
    if (key === 'haeo_ev_power') {
      const primary = this._config['entity_haeo_ev_power'] || _HAEO_DEFAULTS['haeo_ev_power'];
      const fallback = this._config['entity_haeo_ev1_power'] || _HAEO_DEFAULTS['haeo_ev1_power'];
      return (this._hass?.states[primary]) ? primary : fallback;
    }
    // EV1 SoC fallback
    if (key === 'haeo_ev_soc') {
      const primary = this._config['entity_haeo_ev_soc'] || _HAEO_DEFAULTS['haeo_ev_soc'];
      const fallback = this._config['entity_haeo_ev1_soc'] || _HAEO_DEFAULTS['haeo_ev1_soc'];
      return (this._hass?.states[primary]) ? primary : fallback;
    }
    return eid;
  }

  // Check if an EV sensor entity exists in hass
  _evSensorExists(key) {
    const eid = this._eid(key);
    return eid && this._hass?.states[eid] !== undefined;
  }

  setConfig(config) {
    this._config = config || {};
    _HAEO_CUR = this._config.currency_symbol || '$';
    if (!this.shadowRoot.getElementById('tb-future')) {
      this.shadowRoot.innerHTML = _haeo_buildHTML();
      this._wireEvents();
      // Shadow DOM was rebuilt (e.g. navigating back to dashboard) — reset past state
      // so the next set hass triggers a fresh fetch rather than staying stuck.
      this._pastState  = 'idle';
      this._lastCostTs = null;
      requestAnimationFrame(() => this._setWrapHeight());
      if (!this._ro) {
        this._ro = new ResizeObserver(() => this._setWrapHeight());
        this._ro.observe(document.documentElement);
      }
      this._scheduleRefresh();
      if (!this._visHandler) {
        this._visHandler = () => {
          if (document.visibilityState === 'visible' && this._hass) {
            const staleMins = (Date.now() - this._lastRenderTs) / 60000;
            if (staleMins > 1) this._doRefresh();
          }
        };
        document.addEventListener('visibilitychange', this._visHandler);
      }
    }
  }

  // Smart refresh: fires at :01, :06, :11 ... past the hour (1 min after each 5-min HA boundary)
  _msUntilNextBoundary() {
    const now      = new Date();
    const secInHr  = now.getMinutes() * 60 + now.getSeconds();
    const targets  = [1,6,11,16,21,26,31,36,41,46,51,56];
    const minNow   = now.getMinutes() + now.getSeconds() / 60;
    let nextMin    = targets.find(t => t > minNow);
    if (nextMin === undefined) nextMin = targets[0] + 60;
    return Math.max(1000, (nextMin * 60 - secInHr) * 1000 - now.getMilliseconds());
  }

  _scheduleRefresh() {
    if (this._refreshTimer) clearTimeout(this._refreshTimer);
    this._refreshTimer = setTimeout(() => {
      if (document.visibilityState !== 'hidden' && this._hass) this._doRefresh();
      this._scheduleRefresh();
    }, this._msUntilNextBoundary());
  }

  _doRefresh() {
    this._lastCostTs = null;
    this._renderFuture();
    if (this._activeTab === 'past' && this._pastState === 'ready') {
      this._pastState = 'loading';
      this._loadPast();
    }
    this._lastRenderTs = Date.now();
  }

  _setWrapHeight() {
    const wraps = this.shadowRoot.querySelectorAll('.wrap');
    wraps.forEach(w => {
      const top = w.getBoundingClientRect().top;
      if (top < 10) return;
      const leg  = this.shadowRoot.querySelector('.leg');
      const legH = leg ? leg.getBoundingClientRect().height + 12 : 0;
      w.style.height = Math.max(120, window.innerHeight - top - legH - 12) + 'px';
    });
    const wrap = this.shadowRoot.querySelector('.pane.active .wrap');
    if (!wrap) return;
    const scrollbarW = wrap.offsetWidth - wrap.clientWidth;
    this.shadowRoot.querySelectorAll('.pane.active table.dt-head').forEach(t => {
      t.style.width = 'calc(100% - ' + scrollbarW + 'px)';
    });
  }

  set hass(hass) {
    this._hass = hass;
    if (!this.shadowRoot.getElementById('tb-future')) {
      this.shadowRoot.innerHTML = _haeo_buildHTML();
      this._wireEvents();
    }
    // Watch battery sensor for forecast updates — it has the richest data
    const costState = hass.states[this._eid('haeo_battery')];
    const costTs    = costState?.last_changed;
    if (costTs !== this._lastCostTs) {
      this._lastCostTs = costTs;
      this._renderFuture();
    }
    // Stuck-loading recovery: if _pastState has been 'loading' for >30s the
    // WebSocket call likely failed silently — reset to 'idle' to trigger a retry.
    if (this._pastState === 'loading' && (Date.now() - this._pastLoadTs) > 30000) {
      this._pastState = 'idle';
    }
    if (this._pastState === 'idle') {
      this._pastState  = 'loading';
      this._pastLoadTs = Date.now();
      this._loadPast();
    }
  }

  _switchTab(tab) {
    this._activeTab = tab;
    const sr = this.shadowRoot;
    ['future', 'past'].forEach(t => {
      sr.getElementById('tab-'  + t).classList.toggle('active', t === tab);
      sr.getElementById('pane-' + t).classList.toggle('active', t === tab);
    });
    const wrap = sr.getElementById('range-past-wrap');
    if (wrap) wrap.style.display = tab === 'past' ? 'inline-flex' : 'none';
    const alertEl = sr.getElementById('grid-export-alert');
    if (alertEl) alertEl.style.display = tab === 'future' ? 'inline' : 'none';
    requestAnimationFrame(() => this._setWrapHeight());
  }

  _wireEvents() {
    const tabFuture = this.shadowRoot.getElementById('tab-future');
    const tabPast   = this.shadowRoot.getElementById('tab-past');
    if (tabFuture && !tabFuture._wired) {
      tabFuture._wired = true;
      tabFuture.addEventListener('click', () => this._switchTab('future'));
    }
    if (tabPast && !tabPast._wired) {
      tabPast._wired = true;
      tabPast.addEventListener('click', () => this._switchTab('past'));
    }
    const sel = this.shadowRoot.getElementById('range-past');
    if (sel && !sel._wired) {
      sel._wired = true;
      sel.addEventListener('change', () => {
        this._pastState = 'loading';
        const tb = this.shadowRoot.getElementById('tb-past');
        if (tb) tb.innerHTML = '<tr><td colspan="14" class="msg">⏳ Fetching history...</td></tr>';
        this._loadPast();
      });
    }
    
    // Legend modal handlers
    const legendViewBtn = this.shadowRoot.getElementById('legend-view-btn');
    const legendModal = this.shadowRoot.getElementById('legend-modal');
    const legendClose = this.shadowRoot.getElementById('legend-modal-close');
    
    if (legendViewBtn && !legendViewBtn._wired) {
      legendViewBtn._wired = true;
      legendViewBtn.addEventListener('click', () => this._openLegendModal());
    }
    
    if (legendClose && !legendClose._wired) {
      legendClose._wired = true;
      legendClose.addEventListener('click', () => {
        if (legendModal) legendModal.style.display = 'none';
      });
    }
    
    if (legendModal && !legendModal._wired) {
      legendModal._wired = true;
      legendModal.addEventListener('click', (e) => {
        if (e.target === legendModal) legendModal.style.display = 'none';
      });
    }
    
    // Filter checkbox handlers
    const filterCheckboxes = this.shadowRoot.querySelectorAll('.legend-filter');
    filterCheckboxes.forEach(cb => {
      if (!cb._wired) {
        cb._wired = true;
        cb.addEventListener('change', () => this._applyLegendFilters());
      }
    });
  }

  // ── Future tab render ───────────────────────────────────────────────────────
  _renderFuture() {
    this._lastRenderTs = Date.now();
    const sbar  = this.shadowRoot.getElementById('sbar-future');
    const tbody = this.shadowRoot.getElementById('tb-future');
    if (!sbar || !tbody) return;
    try {
      this._renderFutureInner(sbar, tbody);
    } catch (e) {
      console.error('HAEO card _renderFuture error:', e);
      tbody.innerHTML = '<tr><td colspan="14" class="err">⚠️ Render error: ' + e.message + '</td></tr>';
      sbar.innerHTML = '<span style="color:#f44336;">⚠️ ' + e.message + '</span>';
    }
  }

  _renderFutureInner(sbar, tbody) {

    // Build UTC-epoch-ms → value Map from a sensor's {time, value} forecast attribute.
    // Keying by epoch ms is timezone-safe regardless of UTC offset in time strings.
    // mult: unit multiplier to normalise to kW — auto-detected from unit_of_measurement.
    const buildMap = (entityId, mult) => {
      const fc = this._hass?.states[entityId]?.attributes?.forecast;
      if (!Array.isArray(fc)) return new Map();
      const m = new Map();
      for (const row of fc) {
        if (!row || row.time == null) continue;
        const ts = new Date(row.time).getTime();
        if (!isNaN(ts)) m.set(ts, (row.value != null ? parseFloat(row.value) || 0 : 0) * mult);
      }
      return m;
    };

    // Primary axis: battery_active_power — has the richest power forecast data.
    // Other sensors (prices, cost) have different step sizes so we use nearest-timestamp
    // lookup for those rather than exact epoch-ms matching.
    const battState = this._hass?.states[this._eid('haeo_battery')];
    if (!battState) {
      tbody.innerHTML = '<tr><td colspan="14" class="err">⚠️ ' + this._eid('haeo_battery') + ' not found</td></tr>';
      return;
    }
    const primaryFc = battState.attributes?.forecast;
    if (!Array.isArray(primaryFc) || !primaryFc.length) {
      tbody.innerHTML = '<tr><td colspan="14" class="err">⚠️ No forecast data on ' + this._eid('haeo_battery') + '</td></tr>';
      return;
    }

    // Auto-detect unit_of_measurement for each power sensor and normalise to kW
    // Forecast attribute values are always in kW/% / $/kWh regardless of live sensor unit
    // — do NOT apply powerMult here, that is only for history sensor reads.
    // Grid forecast: HAEO uses negative=export, positive=import — negate to match
    // our display convention (positive=export, negative=import).
    const battMap  = buildMap(this._eid('haeo_battery'),        1);
    const gridMap  = buildMap(this._eid('haeo_grid'),           1); // positive=import, negative=export — matches display
    const loadMap  = buildMap(this._eid('haeo_load'),           1);
    const solarMap = buildMap(this._eid('haeo_solar'),          1);
    const socMap   = buildMap(this._eid('haeo_soc'),            1);
    const evPowerMap = buildMap(this._eid('haeo_ev_power'),     1);
    const evSocMap   = buildMap(this._eid('haeo_ev_soc'),       1);
    const ev2PowerMap = buildMap(this._eid('haeo_ev2_power'),    1);
    const ev2SocMap   = buildMap(this._eid('haeo_ev2_soc'),      1);
    const buyMap   = buildMap(this._eid('haeo_buy_price'),      1);
    const sellMap  = buildMap(this._eid('haeo_sell_price'),     1);
    // Cost/Profit calculated directly: export profit = |gridKwh| × sellP, import cost = gridKwh × buyP
    // sensor.grid_net_cost is not used for per-slot calculation (cumulative running total,
    // timestamps misalign with battery forecast axis causing nearestGet errors)

    // Nearest-timestamp lookup: for sensors with coarser step sizes (prices, cost)
    // find the Map entry whose key is closest to the target timestamp.
    const nearestGet = (map, ts) => {
      if (map.has(ts)) return map.get(ts);
      let best = null, bestDiff = Infinity;
      for (const [k, v] of map) {
        const d = Math.abs(k - ts);
        if (d < bestDiff) { bestDiff = d; best = v; }
      }
      return best ?? 0;
    };

    // Pre-build sorted timestamp array for step-size calculation
    const fcTimestamps = primaryFc
      .map(r => new Date(r.time).getTime())
      .filter(t => !isNaN(t))
      .sort((a, b) => a - b);
    // stepH(ts): hours between this timestamp and the next forecast row
    const stepHFor = (ts) => {
      const idx = fcTimestamps.indexOf(ts);
      if (idx >= 0 && idx < fcTimestamps.length - 1)
        return (fcTimestamps[idx + 1] - ts) / 3600000;
      return 1; // fallback 1h for last row
    };

    const nowTs    = Date.now();
    const todayStr = new Date().toLocaleDateString('en-CA');

    // Check if EV sensors exist
    const evSensorsExist = this._evSensorExists('haeo_ev_power') && this._evSensorExists('haeo_ev_soc');
    const ev2SensorsExist = this._evSensorExists('haeo_ev2_power') && this._evSensorExists('haeo_ev2_soc');

    // ── Status bar ──
    const nowSoc  = parseFloat(this._hass?.states[this._eid('haeo_soc')]?.state)       || null;
    const nowBuy  = parseFloat(this._hass?.states[this._eid('haeo_buy_price')]?.state)  || null;
    const nowSell = parseFloat(this._hass?.states[this._eid('haeo_sell_price')]?.state) || null;
    const exportLimit = parseFloat(this._hass?.states[this._eid('haeo_export_limit')]?.state) || null;
    const importLimit = parseFloat(this._hass?.states[this._eid('haeo_import_limit')]?.state) || null;
    const battChargeLimit = parseFloat(this._hass?.states[this._eid('haeo_batt_charge_limit')]?.state) || null;
    const battDischargeLimit = parseFloat(this._hass?.states[this._eid('haeo_batt_discharge_limit')]?.state) || null;

    // Current activity: use live sensors, fallback to forecast if unavailable
    const liveGridKw = parseFloat(this._hass?.states[this._eid('haeo_grid')]?.state) || null;
    const liveBattKw = parseFloat(this._hass?.states[this._eid('haeo_battery')]?.state) || null;
    const currentGridKw = liveGridKw != null ? liveGridKw : gridMap.get(nowTs) || 0;
    const currentBattKw = liveBattKw != null ? liveBattKw : battMap.get(nowTs) || 0;
    const isGridImporting = currentGridKw > 0.05;  // 50W threshold
    const isBattCharging = currentBattKw < -0.1;   // 100W threshold
    const isGridExporting = currentGridKw < -0.05; // 50W threshold
    const isBattExporting = currentBattKw > 0.1 && isGridExporting; // discharge + grid export

    // Get current Mode and Focus
    const nowClassification = _haeo_classifyFuture(solarMap.get(nowTs) || 0, loadMap.get(nowTs) || 0, currentBattKw, currentGridKw);
    const { mode, focus, modeColor, focusColor } = _haeo_getModeAndFocus(nowClassification.label);

    // Morning SoC / Peak SoC — same logic as EM card
    let closestDiff = Infinity, chargingNow = false;
    for (const row of primaryFc) {
      const ts   = new Date(row.time).getTime();
      const diff = Math.abs(ts - nowTs);
      if (diff < closestDiff) {
        closestDiff = diff;
        chargingNow = (solarMap.get(ts) || 0) > 0.5 && (battMap.get(ts) || 0) < -0.1;
      }
    }
    let dawnSoc = null, dawnTime = '', dawnLabel = '';
    if (chargingNow) {
      let pkSoc = 0, pkTime = '';
      for (const row of primaryFc) {
        const ts = new Date(row.time).getTime();
        if (isNaN(ts) || ts < nowTs) continue;
        const soc = socMap.get(ts) || 0;
        if ((solarMap.get(ts) || 0) > 0.5 && (battMap.get(ts) || 0) < -0.01 && soc > pkSoc) {
          pkSoc  = soc;
          pkTime = new Date(ts).toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', hour12: true });
        }
      }
      if (pkSoc > 0) { dawnSoc = pkSoc; dawnTime = pkTime; dawnLabel = 'Peak SoC'; }
    } else {
      for (const row of primaryFc) {
        if (dawnSoc !== null) break;
        const ts = new Date(row.time).getTime();
        if (isNaN(ts) || ts <= nowTs) continue;
        if ((solarMap.get(ts) || 0) > 0.5 && (battMap.get(ts) || 0) < -0.1) {
          dawnSoc   = socMap.get(ts) || 0;
          dawnTime  = new Date(ts).toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', hour12: true });
          dawnLabel = 'Morning SoC';
        }
      }
    }

    // Smart alert pills: next grid import/export & force charge/discharge windows (FUTURE TAB ONLY)
    let gridImportTime = '', gridExportTime = '', forceChargeTime = '', forceDischargeTime = '';
    const fmtSbarTime = (ts) => new Date(ts).toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase();
    const fmtAlertTime = (ts) => {
      const d = new Date(ts);
      const todayStr = new Date().toLocaleDateString('en-CA');
      const eventDayStr = d.toLocaleDateString('en-CA');
      const timeStr = fmtSbarTime(ts);
      if (eventDayStr !== todayStr) {
        const dayName = d.toLocaleDateString('en-AU', { weekday: 'short' });
        return dayName + ' ' + timeStr;
      }
      return timeStr;
    };
    for (const row of primaryFc) {
      const ts = new Date(row.time).getTime();
      if (isNaN(ts) || ts < nowTs) continue;
      const gridKw = gridMap.get(ts) || 0;
      const battKw = battMap.get(ts) || 0;
      const solarKw = solarMap.get(ts) || 0;
      const loadKw = loadMap.get(ts) || 0;
      
      // Grid Import (grid > 0.1 kW)
      if (!gridImportTime && gridKw > 0.1)
        gridImportTime = fmtAlertTime(ts);
      
      // Grid Export (grid < -0.1 kW)
      if (!gridExportTime && gridKw < -0.1)
        gridExportTime = fmtAlertTime(ts);
      
      // Force Charge: battery charging from grid (battKw < -0.1 and gridKw > 0.1 and solarKw < 0.05)
      if (!forceChargeTime && battKw < -0.1 && gridKw > 0.1 && solarKw < 0.05)
        forceChargeTime = fmtAlertTime(ts);
      
      // Force Discharge: battery discharging to grid (battKw > 0.1 and gridKw < -0.1)
      if (!forceDischargeTime && battKw > 0.1 && gridKw < -0.1)
        forceDischargeTime = fmtAlertTime(ts);
    }

    const socColor  = nowSoc  != null ? (nowSoc  <= 20 ? '#f44336' : nowSoc  >= 75 ? '#4caf50' : 'var(--primary-text-color)') : '';
    const dawnColor = dawnSoc != null ? (dawnSoc <= 20 ? '#f44336' : dawnSoc <= 35 ? '#ff9800' : '#4caf50') : '';

    sbar.innerHTML =
      (mode ? '📌 Mode: <span class="pill" style="background-color:' + (modeColor || '#555') + ' !important;color:#fff;padding:2px 10px;border-radius:12px;font-weight:600;display:inline-block;">' + mode + '</span>' : '') +
      (focus ? '🎯 Focus: <span class="pill" style="background-color:' + (focusColor || '#555') + ' !important;color:#fff;padding:2px 10px;border-radius:12px;font-weight:600;display:inline-block;">' + focus + '</span>' : '') +
      (nowSoc   != null ? '🔋 SoC now: <span class="pill" style="background:#555;color:#fff;padding:2px 10px;border-radius:12px;font-weight:600;display:inline-block;">' + nowSoc.toFixed(1)  + '%</span>' : '') +
      (dawnSoc  != null ? '☀️ ' + dawnLabel + ': <span class="pill" style="background:#555;color:#fff;padding:2px 10px;border-radius:12px;font-weight:600;display:inline-block;">' + dawnSoc.toFixed(1) + '% (' + dawnTime + ')</span>' : '') +
      (nowBuy   != null ? '💲 Buy: <span class="pill" style="background:#555;color:#fff;padding:2px 10px;border-radius:12px;font-weight:600;display:inline-block;">$' + nowBuy.toFixed(4)  + '</span>' : '') +
      (nowSell  != null ? '💲 Sell: <span class="pill" style="background:#555;color:#fff;padding:2px 10px;border-radius:12px;font-weight:600;display:inline-block;">$' + nowSell.toFixed(4) + '</span>' : '') +
      (exportLimit != null ? '📤 Export Limit: <span class="pill" style="background:#555;color:#fff;padding:2px 10px;border-radius:12px;font-weight:600;display:inline-block;">' + exportLimit.toFixed(2) + ' kW</span>' : '') +
      (isGridImporting && importLimit != null ? '⚡ Import Limit: <span class="pill" style="background:#555;color:#fff;padding:2px 10px;border-radius:12px;font-weight:600;display:inline-block;">' + importLimit.toFixed(2) + ' kW</span>' : '') +
      (isBattCharging && battChargeLimit != null ? '🔋 ESS Charge Limit: <span class="pill" style="background:#555;color:#fff;padding:2px 10px;border-radius:12px;font-weight:600;display:inline-block;">' + battChargeLimit.toFixed(2) + ' kW</span>' : '') +
      (isBattExporting && battDischargeLimit != null ? '🔋 ESS Discharge Limit: <span class="pill" style="background:#555;color:#fff;padding:2px 10px;border-radius:12px;font-weight:600;display:inline-block;">' + battDischargeLimit.toFixed(2) + ' kW</span>' : '');

    // Set grid export alert in tab bar (FUTURE TAB ONLY - hide when on Past tab)
    const alertEl = this.shadowRoot.getElementById('grid-export-alert');
    if (alertEl) {
      let alertHtml = '';
      if (gridImportTime) alertHtml += '<span class="pill" style="background:#ff6b6b;color:#fff;padding:2px 10px;border-radius:12px;font-weight:600;display:inline-block;margin-right:4px;">⚡ Grid import from ' + gridImportTime + '</span>';
      if (gridExportTime) alertHtml += '<span class="pill" style="background:#2e7d32;color:#fff;padding:2px 10px;border-radius:12px;font-weight:600;display:inline-block;margin-right:4px;">📤 Grid export from ' + gridExportTime + '</span>';
      if (forceChargeTime) alertHtml += '<span class="pill" style="background:#ff9800;color:#fff;padding:2px 10px;border-radius:12px;font-weight:600;display:inline-block;margin-right:4px;">🔋 Force charge from ' + forceChargeTime + '</span>';
      if (forceDischargeTime) alertHtml += '<span class="pill" style="background:#f44336;color:#fff;padding:2px 10px;border-radius:12px;font-weight:600;display:inline-block;">🔋 Force discharge from ' + forceDischargeTime + '</span>';
      alertEl.innerHTML = alertHtml;
      alertEl.style.display = this._activeTab === 'future' && alertHtml ? 'flex' : 'none';
      if (alertEl.style.display === 'flex') alertEl.style.gap = '4px';
    }

    // ── Single-pass day totals: accumulate while iterating ──
    // Pre-pass: daily cost and kWh totals (single loop)
    const dailyCosts = {};
    const dailyKwh   = {};
    const dailyOrder = [];  // Track order of first appearance

    for (const row of primaryFc) {
      const ts = new Date(row.time).getTime();
      if (isNaN(ts) || ts < nowTs) continue;
      const dayStr = new Date(ts).toLocaleDateString('en-CA');
      const battKw  = battMap.get(ts)  || 0;
      const gridKw  = gridMap.get(ts)  || 0;
      const loadKw  = loadMap.get(ts)  || 0;
      const solarKw = solarMap.get(ts) || 0;
      const stepH   = stepHFor(ts);

      // Cost/Profit: export = |gridKwh| × sellP (negative = profit), import = gridKwh × buyP (positive = cost)
      const buyP0   = nearestGet(buyMap, ts);
      const sellP0  = nearestGet(sellMap, ts);
      const gridKwh0 = gridKw * stepH;
      const cost    = gridKw < -0.05 ? -(Math.abs(gridKwh0) * sellP0)
                    : gridKw >  0.05 ?   Math.abs(gridKwh0) * buyP0
                    : 0;

      if (!dailyCosts.hasOwnProperty(dayStr)) {
        dailyOrder.push(dayStr);
        dailyCosts[dayStr] = 0;
        dailyKwh[dayStr] = { load: 0, pv: 0, grid: 0, batt: 0, ev: 0, ev2: 0 };
      }

      dailyCosts[dayStr] += cost;
      const dk = dailyKwh[dayStr];
      dk.load += loadKw  * stepH;
      dk.pv   += solarKw * stepH;
      dk.grid += gridKw  * stepH;
      dk.batt += battKw  * stepH;
      dk.ev   += (evPowerMap.get(ts) || 0) * stepH;
      dk.ev2  += (ev2PowerMap.get(ts) || 0) * stepH;
    }

    // ── Build day header row ──
    const _buildDayHeaderRow = (day) => {
      const dayTotal = dailyCosts[day] || 0;
      const dk       = dailyKwh[day]  || { load:0, pv:0, grid:0, batt:0, ev:0, ev2:0 };
      const dayColor = dayTotal <= 0 ? '#4caf50' : '#f44336';
      const dayLabel = day === todayStr ? '📅 Today' : '📅 ' + new Date(day + 'T00:00:00').toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' });
      const dayCostLabel = dayTotal <= 0 ? _HAEO_CUR + Math.abs(dayTotal).toFixed(2) : '-' + _HAEO_CUR + dayTotal.toFixed(2);
      const fmtKd = (v) => Math.abs(v) > 0.001 ? (v < 0 ? '-' : '') + Math.abs(v).toFixed(2) : '—';
      const fmtGrid = (v) => {
        if (Math.abs(v) <= 0.001) return '—';
        const col = v < 0 ? '#4caf50' : '#f44336';
        return '<span style="color:' + col + ';">' + (v < 0 ? '-' : '') + Math.abs(v).toFixed(2) + '</span>';
      };
      const fmtBatt = (v) => {
        if (Math.abs(v) <= 0.001) return '—';
        const col = v < 0 ? '#f44336' : '#4caf50';
        return '<span style="color:' + col + ';">' + (v < 0 ? '-' : '') + Math.abs(v).toFixed(2) + '</span>';
      };
      return '<tr class="dr">' +
        '<td colspan="2">' + dayLabel + '</td>' +
        '<td class="bgl" colspan="2"></td>' +
        '<td class="bgl"></td>' +
        '<td class="bgi" style="text-align:right;">' + fmtKd(dk.load) + '</td>' +
        '<td class="bgl"></td>' +
        '<td class="bgi" style="text-align:right;">' + fmtKd(dk.pv) + '</td>' +
        '<td class="bgl"></td>' +
        '<td class="bgi" style="text-align:right;">' + fmtGrid(dk.grid) + '</td>' +
        '<td class="bgl"></td>' +
        '<td class="bgi" style="text-align:right;">' + fmtBatt(-dk.batt) + '</td>' +
        '<td class="bgi" style="text-align:right;"></td>' +
        '<td class="bgl"></td>' +
        '<td class="bgi" style="text-align:right;">' + fmtKd(dk.ev) + '</td>' +
        '<td class="bgi" style="text-align:right;"></td>' +
        '<td class="bgl"></td>' +
        '<td class="bgi" style="text-align:right;">' + fmtKd(dk.ev2) + '</td>' +
        '<td class="bgi" style="text-align:right;"></td>' +
        '<td class="bgl" style="text-align:right;color:' + dayColor + ';">' + dayCostLabel + '</td>' +
        '</tr>';
    };

    // ── Table rows: single pass with day header injection ──
    const rows = [];
    let lastDay = '';

    for (const row of primaryFc) {
      const ts = new Date(row.time).getTime();
      if (isNaN(ts) || ts < nowTs) continue;

      const dayStr  = new Date(ts).toLocaleDateString('en-CA');
      const timeStr = new Date(ts).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', hour12: false });

      // Inject day header when day changes
      if (dayStr !== lastDay) {
        lastDay = dayStr;
        rows.push(_buildDayHeaderRow(dayStr));
      }

      // Power sensors share the battery timestamp axis — exact match
      const battKw  = battMap.get(ts)       || 0;
      const gridKw  = gridMap.get(ts)       || 0;
      const loadKw  = loadMap.get(ts)       || 0;
      const solarKw = solarMap.get(ts)      || 0;
      const soc     = socMap.get(ts)        || 0;
      const evKw    = evPowerMap.get(ts)    || 0;
      const evSoc   = evSocMap.get(ts)      || 0;
      const ev2Kw   = ev2PowerMap.get(ts)   || 0;
      const ev2Soc  = ev2SocMap.get(ts)     || 0;
      // Price/cost sensors have coarser steps — use nearest timestamp
      const buyP    = nearestGet(buyMap,  ts);
      const sellP   = nearestGet(sellMap, ts);
      // kWh = kW × stepH where stepH is inferred from gap to next forecast timestamp
      const stepH    = stepHFor(ts);
      // Cost/Profit: export profit = |gridKwh| × sellP (negative), import cost = gridKwh × buyP (positive)
      const gridKwh  = gridKw * stepH;
      const cost     = gridKw < -0.05 ? -(Math.abs(gridKwh) * sellP)
                     : gridKw >  0.05 ?   Math.abs(gridKwh) * buyP
                     : 0;

      const cls = _haeo_classifyFuture(solarKw, loadKw, battKw, gridKw, evKw);
      const c   = _HAEO_COLOURS[cls.color] || { bg: 'transparent', txt: 'var(--primary-text-color)', cost: 'var(--primary-text-color)' };

      // For light backgrounds, use black text for better contrast
      const isLightBg = c.bg.includes('fff') || c.bg.includes('ffe') || c.bg.includes('ccf');
      const textColor = isLightBg ? '#000' : c.txt;
      const costColor = isLightBg ? '#000' : c.cost;

      // Grid: positive=import (red=costing), negative=export (green=earning)
      const gridCol  = gridKw > 0.1 ? '#f44336' : gridKw < -0.1 ? '#4caf50' : c.txt;
      // Battery display: negate for display (positive kW = charging now shows as positive, negative = discharging)
      // Color: positive=charging, negative=discharging
      // Charging from grid=red, charging from solar=green, discharging=red
      const battDisplay = -battKw;  // Negate for display
      const battCol  = battDisplay > 0.1 ? (gridKw > 0.1 ? '#f44336' : '#4caf50')  // charging: red if from grid, green if from solar
                     : battDisplay < -0.1 ? '#f44336'  // discharging: red
                     : c.txt;
      
      // EV display: negate for display (positive kW = charging now shows as positive, negative = discharging)
      // Color: discharging to house=amber, discharging to grid=red, charging from solar=green, charging from grid=red
      const evDisplay = -evKw;  // Negate for display
      const evCol = evDisplay > 0.1 ? (gridKw < -0.1 ? '#f44336' : '#ff9800')  // discharging: red if to grid, amber if to home
                  : evDisplay < -0.1 ? (gridKw > 0.1 ? '#f44336' : '#4caf50')  // charging: red if from grid, green if from solar
                  : c.txt;
      
      // EV2 same as EV
      const ev2Display = -ev2Kw;
      const ev2Col = ev2Display > 0.1 ? (gridKw < -0.1 ? '#f44336' : '#ff9800')  // discharging: red if to grid, amber if to home
                   : ev2Display < -0.1 ? (gridKw > 0.1 ? '#f44336' : '#4caf50')  // charging: red if from grid, green if from solar
                   : c.txt;
      
      const socCol   = soc <= 20 ? '#f44336' : soc >= 75 ? '#4caf50' : c.txt;
      const costFmt  = _haeo_fmtCost(cost);
      const costCol  = costFmt.col || (cost > 0.0001 ? c.cost : c.txt);
      const fmtKwh   = (v) => Math.abs(v * stepH) > 0.001 ? (v * stepH).toFixed(3) : '—';
      const fmtKwhC  = (v, col) => {
        const kwh = v * stepH;
        if (Math.abs(kwh) <= 0.001) return '—';
        return '<span style="color:' + col + ';">' + kwh.toFixed(3) + '</span>';
      };

      rows.push('<tr style="background-color:' + c.bg + ';color:' + textColor + ';">' +
        '<td>' + timeStr + '</td>' +
        '<td><span title="' + cls.note + '">' + cls.label + '</span></td>' +
        '<td class="bgl">' + _haeo_fmtP(buyP)   + '</td>' +
        '<td class="bgi">' + _haeo_fmtP(sellP)  + '</td>' +
        '<td class="bgl">' + loadKw.toFixed(2)  + '</td>' +
        '<td class="bgi">' + fmtKwh(loadKw)     + '</td>' +
        '<td class="bgl">' + (solarKw >= 0.05 ? solarKw.toFixed(2) : '—') + '</td>' +
        '<td class="bgi">' + (solarKw >= 0.05 ? fmtKwh(solarKw) : '—') + '</td>' +
        '<td class="bgl">' + (Math.abs(gridKw) >= 0.1 ? '<span style="color:' + gridCol + ';">' + gridKw.toFixed(2) + '</span>' : '—') + '</td>' +
        '<td class="bgi">' + (Math.abs(gridKw) >= 0.1 ? fmtKwhC(gridKw, gridCol) : '—') + '</td>' +
        '<td class="bgl">' + (Math.abs(battDisplay) >= 0.1 ? '<span style="color:' + battCol + ';">' + battDisplay.toFixed(2) + '</span>' : '—') + '</td>' +
        '<td class="bgi">' + (Math.abs(battDisplay) >= 0.1 ? '<span style="color:' + battCol + ';">' + fmtKwh(battDisplay) + '</span>' : '—') + '</td>' +
        '<td class="bgi"><span style="color:' + socCol + ';">' + soc.toFixed(1) + '</span></td>' +
        '<td class="bgl">' + (evSensorsExist ? (Math.abs(evDisplay) >= 0.1 ? '<span style="color:' + evCol + ';">' + evDisplay.toFixed(2) + '</span>' : '—') : 'x') + '</td>' +
        '<td class="bgi">' + (evSensorsExist ? (Math.abs(evDisplay) >= 0.1 ? '<span style="color:' + evCol + ';">' + fmtKwh(evDisplay) + '</span>' : '—') : 'x') + '</td>' +
        '<td class="bgi"><span style="color:' + (evSoc <= 20 ? '#f44336' : evSoc >= 80 ? '#4caf50' : textColor) + ';">' + (evSensorsExist ? (evSoc > 0 ? evSoc.toFixed(1) : '—') : 'x') + '</span></td>' +
        '<td class="bgl">' + (ev2SensorsExist ? (Math.abs(ev2Display) >= 0.1 ? '<span style="color:' + ev2Col + ';">' + ev2Display.toFixed(2) + '</span>' : '—') : 'x') + '</td>' +
        '<td class="bgi">' + (ev2SensorsExist ? (Math.abs(ev2Display) >= 0.1 ? '<span style="color:' + ev2Col + ';">' + fmtKwh(ev2Display) + '</span>' : '—') : 'x') + '</td>' +
        '<td class="bgi"><span style="color:' + (ev2Soc <= 20 ? '#f44336' : ev2Soc >= 80 ? '#4caf50' : textColor) + ';">' + (ev2SensorsExist ? (ev2Soc > 0 ? ev2Soc.toFixed(1) : '—') : 'x') + '</span></td>' +
        '<td class="bgl"><span style="color:' + costColor + ';font-weight:bold;">' + costFmt.disp + '</span></td>' +
        '</tr>');
    }

    tbody.innerHTML = rows.length ? rows.join('') : '<tr><td colspan="14" class="msg">No future forecast rows available.</td></tr>';
    
    // Add tooltip handlers to event cells
    if (rows.length) {
      const eventCells = tbody.querySelectorAll('td:nth-child(2)');
      eventCells.forEach(cell => {
        const label = cell.textContent.trim();
        if (label && label !== '—') {
          this._addTooltipHandler(cell, label);
        }
      });
    }
    
    requestAnimationFrame(() => this._setWrapHeight());
  } // end _renderFutureInner

  // ── Past tab ────────────────────────────────────────────────────────────────
  _getRangeP() {
    const sel = this.shadowRoot.getElementById('range-past');
    const val = sel ? sel.value : 'today';
    const now = new Date();
    let start, end;
    if (val === 'today') {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      end   = now;
    } else if (val === 'yesterday') {
      end   = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      start = new Date(end - 86400000);
    } else {
      end   = now;
      start = new Date(end - parseInt(val) * 3600000);
    }
    return { start, end };
  }

  async _loadPast() {
    const st = this.shadowRoot.getElementById('st-past');
    const tb = this.shadowRoot.getElementById('tb-past');
    if (!st || !tb) return;

    try {
      const { start, end } = this._getRangeP();
      st.textContent = 'Fetching...';

      // Past power sensors — actual inverter measurements (Sigenergy defaults)
      const powerSensors = [
        this._eid('past_battery_power'),
        this._eid('past_load_power'),
        this._eid('past_solar_power'),
        this._eid('past_grid_power'),
        this._eid('haeo_soc'),
        this._eid('haeo_buy_price'),
        this._eid('haeo_sell_price'),
        this._eid('haeo_ev_power'),
        this._eid('haeo_ev_soc'),
        this._eid('haeo_ev2_power'),
        this._eid('haeo_ev2_soc'),
        // Add EV1 fallback sensors to lookup (in case primary doesn't exist)
        this._config['entity_haeo_ev1_power'] || _HAEO_DEFAULTS['haeo_ev1_power'],
        this._config['entity_haeo_ev1_soc'] || _HAEO_DEFAULTS['haeo_ev1_soc'],
      ];
      // Energy sensors for kWh delta columns
      const energySensors = [
        this._eid('past_load_energy'),
        this._eid('past_solar_energy'),
        this._eid('past_grid_import_energy'),
        this._eid('past_grid_export_energy'),
        this._eid('past_battery_charge_energy'),
        this._eid('past_battery_discharge_energy'),
      ];

      // Check if EV sensors exist
      const evSensorsExist = this._evSensorExists('haeo_ev_power') && this._evSensorExists('haeo_ev_soc');
      const ev2SensorsExist = this._evSensorExists('haeo_ev2_power') && this._evSensorExists('haeo_ev2_soc');

      const result = await this._hass.callWS({
        type:             'history/history_during_period',
        start_time:       start.toISOString(),
        end_time:         end.toISOString(),
        entity_ids:       [...new Set([...powerSensors, ...energySensors])],
        minimal_response: true,
        no_attributes:    true,
      });

      const lookup = {};
      for (const [eid, states] of Object.entries(result)) {
        lookup[eid] = states.map(s => ({
          t: (s.lu !== undefined ? s.lu : s.lc) * 1000,
          s: s.s
        })).sort((a, b) => a.t - b.t);
      }

      // Build unit multiplier maps from LIVE sensor state unit_of_measurement.
      this._pwrMult = {
        battery: _haeo_powerMult(this._hass, this._eid('past_battery_power')),
        grid:    _haeo_powerMult(this._hass, this._eid('past_grid_power')),
        load:    _haeo_powerMult(this._hass, this._eid('past_load_power')),
        solar:   _haeo_powerMult(this._hass, this._eid('past_solar_power')),
      };
      this._engMult = {
        past_load_energy:              _haeo_energyMult(this._hass, this._eid('past_load_energy')),
        past_solar_energy:             _haeo_energyMult(this._hass, this._eid('past_solar_energy')),
        past_grid_import_energy:       _haeo_energyMult(this._hass, this._eid('past_grid_import_energy')),
        past_grid_export_energy:       _haeo_energyMult(this._hass, this._eid('past_grid_export_energy')),
        past_battery_charge_energy:    _haeo_energyMult(this._hass, this._eid('past_battery_charge_energy')),
        past_battery_discharge_energy: _haeo_energyMult(this._hass, this._eid('past_battery_discharge_energy')),
      };

      // Auto-switch to Last 24h if today has no load data
      if (!lookup[this._eid('past_load_power')]?.length) {
        const sel = this.shadowRoot.getElementById('range-past');
        if (sel && sel.value === 'today') {
          st.textContent = 'No data yet — switching to Last 24h...';
          sel.value = '24';
          this._pastState = 'loading';
          setTimeout(() => this._loadPast(), 500);
          return;
        }
        tb.innerHTML = '<tr><td colspan="14" class="msg">⚠️ No sensor data for this period.</td></tr>';
        st.textContent = 'No data';
        this._pastState = 'ready';
        return;
      }

      const step    = 5 * 60 * 1000;
      const startMs = Math.ceil(start.getTime() / step) * step;
      const entries = [];
      for (let t = startMs; t <= end.getTime(); t += step) entries.push(t);
      entries.reverse();

      // ── Single-pass day totals ──
      const pastDailyCosts = {};
      const pastDailyKwh   = {};
      const pastDailyOrder = [];

      for (const ts of entries) {
        const dt     = new Date(ts);
        const dayStr = dt.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

        // Sigenergy battery: -ve=discharge, +ve=charge → negate to internal convention (+ve=discharge)
        const battKwR= (parseFloat(_haeo_getAt(lookup[this._eid('past_battery_power')], ts)) || 0) * this._pwrMult.battery;
        const battKw = -battKwR;
        // Sigenergy grid: +ve=import, -ve=export (matches display convention — no negation)
        const gridKw = (parseFloat(_haeo_getAt(lookup[this._eid('past_grid_power')],   ts)) || 0) * this._pwrMult.grid;
        const loadKw = (parseFloat(_haeo_getAt(lookup[this._eid('past_load_power')],   ts)) || 0) * this._pwrMult.load;
        const solarKw= (parseFloat(_haeo_getAt(lookup[this._eid('past_solar_power')],  ts)) || 0) * this._pwrMult.solar;
        const evKw   = parseFloat(_haeo_getAt(lookup[this._eid('haeo_ev_power')],      ts)) || 0;
        const ev2Kw  = parseFloat(_haeo_getAt(lookup[this._eid('haeo_ev2_power')],     ts)) || 0;
        const buyP   = parseFloat(_haeo_getAt(lookup[this._eid('haeo_buy_price')],     ts)) || 0;
        const sellP  = parseFloat(_haeo_getAt(lookup[this._eid('haeo_sell_price')],    ts)) || 0;
        const stepH  = 5 / 60;

        const importing = gridKw > 0.1;
        const exporting = gridKw < -0.1;
        const cost = importing ? Math.abs(gridKw) * buyP * stepH : exporting ? gridKw * sellP * stepH : 0;

        if (!pastDailyCosts.hasOwnProperty(dayStr)) {
          pastDailyOrder.push(dayStr);
          pastDailyCosts[dayStr] = 0;
          pastDailyKwh[dayStr] = { 
            load: 0, pv: 0, 
            gridImp: 0, gridExp: 0, 
            battChg: 0, battDis: 0, 
            evChg: 0, evDis: 0, 
            ev2Chg: 0, ev2Dis: 0 
          };
        }

        pastDailyCosts[dayStr] += cost;
        const dk = pastDailyKwh[dayStr];
        dk.load += loadKw  * stepH;
        dk.pv   += solarKw * stepH;
        
        // Grid: import (positive) vs export (negative)
        if (gridKw > 0.1) dk.gridImp += gridKw * stepH;
        if (gridKw < -0.1) dk.gridExp += (-gridKw) * stepH;
        
        // Battery: charge (negative kw) vs discharge (positive kw)
        if (battKw > 0.1) dk.battDis += battKw * stepH;
        if (battKw < -0.1) dk.battChg += (-battKw) * stepH;
        
        // EV: charge (negative kw) vs discharge (positive kw)
        if (evKw > 0.1) dk.evDis += evKw * stepH;
        if (evKw < -0.1) dk.evChg += (-evKw) * stepH;
        
        // EV2: charge (negative kw) vs discharge (positive kw)
        if (ev2Kw > 0.1) dk.ev2Dis += ev2Kw * stepH;
        if (ev2Kw < -0.1) dk.ev2Chg += (-ev2Kw) * stepH;
      }

      // ── Build 2-row day header (Row 1: Import/Charge; Row 2: Export/Discharge) ──
      const _buildDayHeaderRowPast = (day) => {
        const dayTotal = pastDailyCosts[day] || 0;
        const dk = pastDailyKwh[day] || { load:0, pv:0, gridImp:0, gridExp:0, battChg:0, battDis:0, evChg:0, evDis:0, ev2Chg:0, ev2Dis:0 };
        const dayColor = dayTotal <= 0 ? '#4caf50' : '#f44336';
        const dayCostLbl = dayTotal <= 0 ? _HAEO_CUR + Math.abs(dayTotal).toFixed(2) : '-' + _HAEO_CUR + dayTotal.toFixed(2);
        const fmtKd = (v) => Math.abs(v) > 0.001 ? v.toFixed(3) : '—';
        const fmtGridImp = (v) => Math.abs(v) > 0.001 ? '<span style="color:#f44336;">' + v.toFixed(3) + '</span>' : '—';
        const fmtGridExp = (v) => Math.abs(v) > 0.001 ? '<span style="color:#4caf50;">' + v.toFixed(3) + '</span>' : '—';
        const fmtBattChg = (v) => Math.abs(v) > 0.001 ? '<span style="color:#4caf50;">' + v.toFixed(3) + '</span>' : '—';
        const fmtBattDis = (v) => Math.abs(v) > 0.001 ? '<span style="color:#f44336;">' + v.toFixed(3) + '</span>' : '—';
        const fmtEVChg = (v) => Math.abs(v) > 0.001 ? '<span style="color:#4caf50;">' + v.toFixed(3) + '</span>' : '—';
        const fmtEVDis = (v) => Math.abs(v) > 0.001 ? '<span style="color:#ff9800;">' + v.toFixed(3) + '</span>' : '—';
        
        // Row 1: Load, PV, Grid "Import" label, Battery "Charge" label, EV "Charge" label, EV2 "Charge" label, Cost
        const row1 = '<tr class="dr" style="border-bottom: 1px solid var(--divider-color,#444);vertical-align:middle;height:auto;">' +
          '<td colspan="2" style="vertical-align:middle;">📅 ' + day + '</td>' +
          '<td class="bgl" colspan="2"></td>' +
          '<td class="bgl"></td>' +
          '<td class="bgi" style="text-align:right;vertical-align:middle;">' + fmtKd(dk.load) + '</td>' +
          '<td class="bgl"></td>' +
          '<td class="bgi" style="text-align:right;vertical-align:middle;">' + fmtKd(dk.pv) + '</td>' +
          '<td class="bgl" style="text-align:right;font-weight:bold;font-size:10px;color:#666;vertical-align:middle;">Import</td>' +
          '<td class="bgi" style="text-align:right;vertical-align:middle;">' + fmtGridImp(dk.gridImp) + '</td>' +
          '<td class="bgl" style="text-align:right;font-weight:bold;font-size:10px;color:#666;vertical-align:middle;">Charge</td>' +
          '<td class="bgi" style="text-align:right;vertical-align:middle;">' + fmtBattChg(dk.battChg) + '</td>' +
          '<td class="bgi" style="text-align:right;"></td>' +
          '<td class="bgl" style="text-align:right;font-weight:bold;font-size:10px;color:#666;vertical-align:middle;">Charge</td>' +
          '<td class="bgi" style="text-align:right;vertical-align:middle;">' + fmtEVChg(dk.evChg) + '</td>' +
          '<td class="bgi" style="text-align:right;"></td>' +
          '<td class="bgl" style="text-align:right;font-weight:bold;font-size:10px;color:#666;vertical-align:middle;">Charge</td>' +
          '<td class="bgi" style="text-align:right;vertical-align:middle;">' + fmtEVChg(dk.ev2Chg) + '</td>' +
          '<td class="bgi" style="text-align:right;"></td>' +
          '<td class="bgl" style="text-align:right;color:' + dayColor + ';font-weight:bold;vertical-align:middle;">' + dayCostLbl + '</td>' +
          '</tr>';
        
        // Row 2: Empty Load/PV, Grid "Export" label, Battery "Discharge" label, EV "Discharge" label, EV2 "Discharge" label
        const row2 = '<tr class="dr" style="border-top: 1px solid var(--divider-color,#444);vertical-align:middle;height:auto;">' +
          '<td colspan="2" style="vertical-align:middle;"></td>' +
          '<td class="bgl" colspan="2"></td>' +
          '<td class="bgl"></td>' +
          '<td class="bgi" style="vertical-align:middle;"></td>' +
          '<td class="bgl"></td>' +
          '<td class="bgi" style="vertical-align:middle;"></td>' +
          '<td class="bgl" style="text-align:right;font-weight:bold;font-size:10px;color:#666;vertical-align:middle;">Export</td>' +
          '<td class="bgi" style="text-align:right;vertical-align:middle;">' + fmtGridExp(dk.gridExp) + '</td>' +
          '<td class="bgl" style="text-align:right;font-weight:bold;font-size:10px;color:#666;vertical-align:middle;">Disch.</td>' +
          '<td class="bgi" style="text-align:right;vertical-align:middle;">' + fmtBattDis(dk.battDis) + '</td>' +
          '<td class="bgi" style="text-align:right;"></td>' +
          '<td class="bgl" style="text-align:right;font-weight:bold;font-size:10px;color:#666;vertical-align:middle;">Disch.</td>' +
          '<td class="bgi" style="text-align:right;vertical-align:middle;">' + fmtEVDis(dk.evDis) + '</td>' +
          '<td class="bgi" style="text-align:right;"></td>' +
          '<td class="bgl" style="text-align:right;font-weight:bold;font-size:10px;color:#666;vertical-align:middle;">Disch.</td>' +
          '<td class="bgi" style="text-align:right;vertical-align:middle;">' + fmtEVDis(dk.ev2Dis) + '</td>' +
          '<td class="bgi" style="text-align:right;"></td>' +
          '<td class="bgl" style="vertical-align:middle;box-shadow:inset 2px 0 0 #666;"></td>' +
          '</tr>';
        
        return row1 + row2;
      };

      // ── Pass 2: render rows with day header injection ──
      const rows = [];
      let lastDay = '';

      for (const ts of entries) {
        const dt      = new Date(ts);
        const dayStr  = dt.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
        const timeStr = dt.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', hour12: false });

        // Inject day header when day changes
        if (dayStr !== lastDay) {
          lastDay = dayStr;
          rows.push(_buildDayHeaderRowPast(dayStr));
        }

        // Power values from Sigenergy inverter sensors
        const battKwR = (parseFloat(_haeo_getAt(lookup[this._eid('past_battery_power')], ts)) || 0) * this._pwrMult.battery;
        const battKw  = -battKwR;
        const gridKw  = (parseFloat(_haeo_getAt(lookup[this._eid('past_grid_power')],   ts)) || 0) * this._pwrMult.grid;
        const loadKw  = (parseFloat(_haeo_getAt(lookup[this._eid('past_load_power')],   ts)) || 0) * this._pwrMult.load;
        const solarKw = (parseFloat(_haeo_getAt(lookup[this._eid('past_solar_power')],  ts)) || 0) * this._pwrMult.solar;
        const soc     = parseFloat(_haeo_getAt(lookup[this._eid('haeo_soc')],           ts)) || 0;
        const buyP    = parseFloat(_haeo_getAt(lookup[this._eid('haeo_buy_price')],     ts)) || 0;
        const sellP   = parseFloat(_haeo_getAt(lookup[this._eid('haeo_sell_price')],    ts)) || 0;
        const evKw    = parseFloat(_haeo_getAt(lookup[this._eid('haeo_ev_power')],      ts)) || 0;
        const evSoc   = parseFloat(_haeo_getAt(lookup[this._eid('haeo_ev_soc')],        ts)) || 0;
        const ev2Kw   = parseFloat(_haeo_getAt(lookup[this._eid('haeo_ev2_power')],     ts)) || 0;
        const ev2Soc  = parseFloat(_haeo_getAt(lookup[this._eid('haeo_ev2_soc')],       ts)) || 0;

        if (soc === 0 && Math.abs(battKw) < 0.01 && Math.abs(gridKw) < 0.01 && loadKw < 0.01 && solarKw < 0.01) continue;

        const cls = _haeo_classifyPast(solarKw, loadKw, battKw, gridKw, evKw);
        const c   = _HAEO_COLOURS[cls.color] || { bg: '#ffffcc', txt: '#888888', cost: '#888888' };

        // Grid: positive=import (red=costing), negative=export (green=earning)
        const gridCol = gridKw > 0.1 ? '#f44336' : gridKw < -0.1 ? '#4caf50' : c.txt;
        // Battery display: negate for display (positive kW = charging now shows as positive, negative = discharging)
        // Color: positive=charging, negative=discharging
        // Charging from grid=red, charging from solar=green, discharging=red
        const battDisplay = -battKw;
        const battCol = battDisplay > 0.05 ? (gridKw > 0.05 ? '#f44336' : '#4caf50')  // charging: red if from grid, green if from solar
                      : battDisplay < -0.05 ? '#f44336'  // discharging: red
                      : c.txt;
        
        // EV display: negate for display (positive kW = charging now shows as positive, negative = discharging)
        // Color: discharging to house=amber, discharging to grid=red, charging from solar=green, charging from grid=red
        const evDisplay = -evKw;
        const evCol = evDisplay > 0.05 ? (gridKw < -0.1 ? '#f44336' : '#ff9800')  // discharging: red if to grid, amber if to home
                    : evDisplay < -0.05 ? (gridKw > 0.05 ? '#f44336' : '#4caf50')  // charging: red if from grid, green if from solar
                    : c.txt;
        
        // EV2 same as EV
        const ev2Display = -ev2Kw;
        const ev2Col = ev2Display > 0.05 ? (gridKw < -0.1 ? '#f44336' : '#ff9800')  // discharging: red if to grid, amber if to home
                     : ev2Display < -0.05 ? (gridKw > 0.05 ? '#f44336' : '#4caf50')  // charging: red if from grid, green if from solar
                     : c.txt;
        
        const socCol  = soc <= 20 ? '#f44336' : soc >= 75 ? '#4caf50' : c.txt;

        // Cost for this slot
        const stepH    = 5 / 60;
        const importing = gridKw > 0.1;
        const exporting = gridKw < -0.1;
        const slotCost  = importing ? Math.abs(gridKw) * buyP * stepH : exporting ? gridKw * sellP * stepH : 0;
        const costFmt   = _haeo_fmtCost(slotCost);
        const costCol   = costFmt.col || (slotCost > 0.0001 ? c.cost : c.txt);

        // For light backgrounds, use black text for better contrast
        const isLightBg = c.bg.includes('fff') || c.bg.includes('ffe') || c.bg.includes('ccf');
        const textColor = isLightBg ? '#000' : c.txt;
        const costColorAdapt = isLightBg ? '#000' : costCol;

        // Energy kWh deltas from total_increasing sensors
        const prevTs  = ts - step;
        const eLoad   = _haeo_getDelta(lookup[this._eid('past_load_energy')],              ts, prevTs, this._engMult.past_load_energy);
        const eSolar  = _haeo_getDelta(lookup[this._eid('past_solar_energy')],             ts, prevTs, this._engMult.past_solar_energy);
        const eGImp   = _haeo_getDelta(lookup[this._eid('past_grid_import_energy')],       ts, prevTs, this._engMult.past_grid_import_energy);
        const eGExp   = _haeo_getDelta(lookup[this._eid('past_grid_export_energy')],       ts, prevTs, this._engMult.past_grid_export_energy);
        const eBattC  = _haeo_getDelta(lookup[this._eid('past_battery_charge_energy')],    ts, prevTs, this._engMult.past_battery_charge_energy);
        const eBattD  = _haeo_getDelta(lookup[this._eid('past_battery_discharge_energy')], ts, prevTs, this._engMult.past_battery_discharge_energy);

        const stepHG  = 5 / 60;
        const eGrid   = exporting ? (eGExp !== null ? -eGExp : -(Math.abs(gridKw) * stepHG))
                      : importing ? (eGImp !== null ?  eGImp :   Math.abs(gridKw) * stepHG)
                      : null;
        const stepHB  = 5 / 60;
        const eBatt   = battKw > 0.1
          ? (eBattD !== null ? -eBattD : -(battKw * stepHB))
          : battKw < -0.1
          ? (eBattC !== null ? eBattC  :  (-battKw * stepHB))
          : null;

        const fmtE = (v) => v !== null && Math.abs(v) > 0.005 ? v.toFixed(3) : '—';

        rows.push('<tr style="background-color:' + c.bg + ';color:' + textColor + ';">' +
          '<td>' + timeStr + '</td>' +
          '<td>' + cls.label + '</td>' +
          '<td class="bgl">' + _haeo_fmtP(buyP)   + '</td>' +
          '<td class="bgi">' + _haeo_fmtP(sellP)  + '</td>' +
          '<td class="bgl">' + loadKw.toFixed(2)  + '</td>' +
          '<td class="bgi">' + fmtE(eLoad)  + '</td>' +
          '<td class="bgl">' + (solarKw >= 0.05 ? solarKw.toFixed(2) : '—') + '</td>' +
          '<td class="bgi">' + (solarKw >= 0.05 ? fmtE(eSolar) : '—') + '</td>' +
          '<td class="bgl">' + (Math.abs(gridKw) >= 0.1 ? '<span style="color:' + gridCol + ';">' + gridKw.toFixed(2) + '</span>' : '—') + '</td>' +
          '<td class="bgi">' + (Math.abs(gridKw) >= 0.1 && eGrid !== null && Math.abs(eGrid) > 0.005 ? '<span style="color:' + gridCol + ';">' + eGrid.toFixed(3) + '</span>' : '—') + '</td>' +
          '<td class="bgl">' + (Math.abs(battDisplay) >= 0.1 ? '<span style="color:' + battCol + ';">' + battDisplay.toFixed(2) + '</span>' : '—') + '</td>' +
          '<td class="bgi">' + (Math.abs(battDisplay) >= 0.1 && eBatt !== null && Math.abs(eBatt) > 0.005 ? '<span style="color:' + battCol + ';">' + eBatt.toFixed(3) + '</span>' : '—') + '</td>' +
          '<td class="bgi"><span style="color:' + socCol + ';">' + soc.toFixed(1) + '</span></td>' +
          '<td class="bgl">' + (evSensorsExist ? (Math.abs(evDisplay) >= 0.1 ? '<span style="color:' + evCol + ';">' + evDisplay.toFixed(2) + '</span>' : '—') : 'x') + '</td>' +
          '<td class="bgi">' + (evSensorsExist ? (Math.abs(evDisplay) >= 0.1 ? '<span style="color:' + evCol + ';">' + fmtE(evDisplay * stepH) + '</span>' : '—') : 'x') + '</td>' +
          '<td class="bgi"><span style="color:' + (evSoc <= 20 ? '#f44336' : evSoc >= 80 ? '#4caf50' : textColor) + ';">' + (evSensorsExist ? (evSoc > 0 ? evSoc.toFixed(1) : '—') : 'x') + '</span></td>' +
          '<td class="bgl">' + (ev2SensorsExist ? (Math.abs(ev2Display) >= 0.1 ? '<span style="color:' + ev2Col + ';">' + ev2Display.toFixed(2) + '</span>' : '—') : 'x') + '</td>' +
          '<td class="bgi">' + (ev2SensorsExist ? (Math.abs(ev2Display) >= 0.1 ? '<span style="color:' + ev2Col + ';">' + fmtE(ev2Display * stepH) + '</span>' : '—') : 'x') + '</td>' +
          '<td class="bgi"><span style="color:' + (ev2Soc <= 20 ? '#f44336' : ev2Soc >= 80 ? '#4caf50' : textColor) + ';">' + (ev2SensorsExist ? (ev2Soc > 0 ? ev2Soc.toFixed(1) : '—') : 'x') + '</span></td>' +
          '<td class="bgl"><span style="color:' + costColorAdapt + ';font-weight:bold;">' + costFmt.disp + '</span></td>' +
          '</tr>');
      }

      tb.innerHTML = rows.length ? rows.join('') : '<tr><td colspan="20" class="msg">⚠️ No readings for this period.</td></tr>';
      
      // Add tooltip handlers to event cells
      if (rows.length) {
        const eventCells = tb.querySelectorAll('td:nth-child(2)');
        eventCells.forEach(cell => {
          const label = cell.textContent.trim();
          if (label && label !== '—') {
            this._addTooltipHandler(cell, label);
          }
        });
      }
      
      requestAnimationFrame(() => this._setWrapHeight());
      const sel2 = this.shadowRoot.getElementById('range-past');
      st.textContent = entries.length + ' readings — ' + (sel2 ? sel2.options[sel2.selectedIndex].text : '');
      this._pastState = 'ready';

    } catch (e) {
      const tb2 = this.shadowRoot.getElementById('tb-past');
      if (tb2) tb2.innerHTML = '<tr><td colspan="20" class="err">⚠️ ' + e.message + '</td></tr>';
      const st2 = this.shadowRoot.getElementById('st-past');
      if (st2) st2.textContent = 'Error — ' + e.message.slice(0, 60);
      this._pastState = 'ready';
    }
  }

  _openLegendModal() {
    const modal = this.shadowRoot.getElementById('legend-modal');
    if (!modal) return;
    this._populateLegendModal();
    modal.style.display = 'flex';
  }

  _populateLegendModal() {
    const wrap = this.shadowRoot.getElementById('legend-categories-wrap');
    if (!wrap || wrap._populated) return;
    
    const categories = {
      'Self Consumption': [],
      'Cost': [],
      'Profit': []
    };
    
    // Categorize events
    for (const [label, desc] of Object.entries(_HAEO_DESCRIPTIONS)) {
      let cat = 'Self Consumption';
      if (desc.includes('low tariff') || desc.includes('cheap') || label.includes('Grid Import') || label.includes('Grid →')) {
        cat = 'Cost';
      } else if (desc.includes('peak') || desc.includes('export') || label.includes('Grid Export') || label.includes('→ Grid')) {
        cat = 'Profit';
      }
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push({ label, desc });
    }
    
    // Sort items alphabetically within each category
    for (const cat in categories) {
      categories[cat].sort((a, b) => a.label.localeCompare(b.label));
    }
    
    let html = '';
    for (const [cat, events] of Object.entries(categories)) {
      html += '<div class="legend-category">' +
        '<div class="legend-category-title">' + cat + ' (' + events.length + ')</div>';
      
      for (const { label, desc } of events) {
        const color = this._getColorForLabel(label);
        html += '<div class="legend-item">' +
          '<div class="legend-item-color" style="background:' + color + ';"></div>' +
          '<div class="legend-item-content">' +
          '<div class="legend-item-label">' + label + '</div>' +
          '<div class="legend-item-desc">' + desc + '</div>' +
          '</div>' +
          '</div>';
      }
      html += '</div>';
    }
    wrap.innerHTML = html;
    wrap._populated = true;
  }

  _applyLegendFilters() {
    const solarChecked = this.shadowRoot.getElementById('filter-solar')?.checked ?? true;
    const batteryChecked = this.shadowRoot.getElementById('filter-battery')?.checked ?? true;
    const gridChecked = this.shadowRoot.getElementById('filter-grid')?.checked ?? true;
    const evChecked = this.shadowRoot.getElementById('filter-ev')?.checked ?? true;

    const items = this.shadowRoot.querySelectorAll('.legend-item');
    items.forEach(item => {
      const label = item.querySelector('.legend-item-label')?.textContent || '';
      
      // Check which power sources are in this label
      const hasSolar = label.includes('🌞');
      const hasBattery = label.includes('🔋');
      const hasGrid = label.includes('⚡');
      const hasEV = label.includes('🚗');

      // Show if ANY selected source is in this label
      const shouldShow = (hasSolar && solarChecked) || 
                         (hasBattery && batteryChecked) || 
                         (hasGrid && gridChecked) || 
                         (hasEV && evChecked);
      
      item.style.display = shouldShow ? 'flex' : 'none';
    });
  }

  _getColorForLabel(label) {
    // Map event labels to their display colors based on scenario type
    if (label.includes('🌞') && !label.includes('Grid') && !label.includes('⚡')) return '#ccffcc'; // solar_green
    if (label.includes('→ ⚡ Grid') && label.includes('🌞')) return '#ffb3b3'; // pink_dark (force)
    if (label.includes('→ ⚡ Grid')) return '#ffe0e0'; // pink (export)
    if (label.includes('⚡ Grid →') && label.includes('Force')) return '#ffaaaa'; // red (forced charge)
    if (label.includes('⚡ Grid →')) return '#ffcccc'; // red (import)
    if (label.includes('🔋')) return '#ccfff5'; // teal (battery)
    return '#ffffcc'; // default yellow
  }

  _addTooltipHandler(eventCell, label) {
    const desc = _HAEO_DESCRIPTIONS[label];
    if (!desc) return;
    
    eventCell.addEventListener('mouseenter', (e) => {
      const tooltip = this.shadowRoot.querySelector('.tooltip');
      if (tooltip) tooltip.remove();
      
      const newTooltip = document.createElement('div');
      newTooltip.className = 'tooltip';
      newTooltip.textContent = desc;
      
      const rect = eventCell.getBoundingClientRect();
      const cardRect = this.shadowRoot.host.getBoundingClientRect();
      
      newTooltip.style.position = 'fixed';
      newTooltip.style.left = (rect.left) + 'px';
      newTooltip.style.top = (rect.bottom + 4) + 'px';
      
      this.shadowRoot.appendChild(newTooltip);
      
      setTimeout(() => {
        if (this.shadowRoot.contains(newTooltip)) {
          newTooltip.remove();
        }
      }, 5000);
    });
    
    eventCell.addEventListener('mouseleave', () => {
      const tooltip = this.shadowRoot.querySelector('.tooltip');
      if (tooltip) tooltip.remove();
    });
  }

  getCardSize() { return 12; }
}

if (!customElements.get('haeo-events-card')) {
  customElements.define('haeo-events-card', HaeoEventsCard);
}

window.customCards = window.customCards || [];
if (!window.customCards.find(c => c.type === 'haeo-events-card')) {
  window.customCards.push({
    type: 'haeo-events-card',
    name: 'HAEO Events Card',
    description: 'HAEO Optimizer future forecast and past events in one card',
  });
}
