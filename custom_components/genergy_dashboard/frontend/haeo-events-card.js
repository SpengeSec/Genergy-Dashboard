// HAEO Events Card
// Combines Future Decisions (forecast) and Past Events (history) in one card
// Enhanced with: Smart Alert Pills, single-pass day totals, improved formatting
// Requires: sensor.grid_net_cost + associated HAEO sensors
// Copy to /config/www/haeo-events-card.js
// Add resource: /local/haeo-events-card.js (type: JavaScript module)
//
// Card YAML example with all overrides:
//
//   type: custom:haeo-events-card
//   grid_options:
//     columns: full
//     rows: auto


const _HAEO_VERSION = 'v3.2.69';

// Global currency symbol — initialized to '$', overridden by setConfig or auto-detected from HA
let _HAEO_CUR = '$';

// Map ISO 4217 currency codes to symbols
const _HAEO_CUR_MAP = {
  AUD:'$', USD:'$', CAD:'$', NZD:'$', SGD:'$', HKD:'$',
  GBP:'£', EUR:'€', JPY:'¥', CNY:'¥', CHF:'Fr', SEK:'kr',
  NOK:'kr', DKK:'kr', INR:'₹', KRW:'₩', BRL:'R$', MXN:'$',
  ZAR:'R', THB:'฿', TWD:'NT$', IDR:'Rp', MYR:'RM', PHP:'₱',
};

function _haeo_curSymbol(code) {
  if (!code) return '$';
  return _HAEO_CUR_MAP[code.toUpperCase()] || code;
}

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
  haeo_deferrable_load: 'sensor.deferrable_loads_power_forecast',
  // ── PAST tab: inverter power sensors (Sigenergy Local Modbus defaults) ──
  past_battery_power: 'sensor.sigen_plant_battery_power',       // -ve=discharge, +ve=charge
  past_load_power:    'sensor.sigen_plant_total_load_power',    // always +ve
  past_solar_power:   'sensor.sigen_plant_pv_power',            // always +ve
  past_grid_power:    'sensor.sigen_plant_grid_active_power',   // +ve=import, -ve=export
  past_deferrable_load: 'sensor.deferrable_loads_power',        // Deferrable loads power (PAST)
  // ── PAST tab: inverter energy sensors (total_increasing, Sigenergy Local Modbus defaults) ──
  past_load_energy:              'sensor.sigen_plant_total_load_consumption',        // Lifetime
  past_solar_energy:             'sensor.sigen_plant_total_pv_generation',            // Lifetime
  past_grid_import_energy:       'sensor.sigen_plant_total_imported_energy',          // Lifetime
  past_grid_export_energy:       'sensor.sigen_plant_total_exported_energy',          // Lifetime
  past_battery_charge_energy:    'sensor.sigen_plant_daily_battery_charge_energy',    // Daily reset
  past_battery_discharge_energy: 'sensor.sigen_plant_daily_battery_discharge_energy', // Daily reset
};

// Past power keys → their slot in the card's saved load-entities config (see _eid)
const _HAEO_PAST_KIND = {
  past_battery_power: 'battery',
  past_load_power:    'base',
  past_solar_power:   'pv',
  past_grid_power:    'grid',
};

// ── Colour scheme ─────────────────────────────────────────────────────────────
// Colors mapped to event types for clear semantics
const _HAEO_COLOURS = {
  // Event classification colors (alphabetically sorted by classification name)
  battery_ev_charge:                    { bg: '#ccfff5', txt: '#333333', cost: '#333333' },  // Battery → EV (charging)
  battery_ev_to_baseload:               { bg: '#ccfff5', txt: '#333333', cost: '#333333' },  // Battery → EV + Base Load
  battery_ev_to_grid_force:             { bg: '#ffffcc', txt: '#333333', cost: '#333333' },  // Battery + EV → Grid (Force)
  battery_ev_to_loads:                  { bg: '#ccfff5', txt: '#333333', cost: '#333333' },  // Battery + EV → Loads
  battery_grid_to_loads:                { bg: '#FFD4E5', txt: '#333333', cost: '#cc3333' },  // Battery + Grid → Loads
  battery_to_baseload_grid_force:       { bg: '#ffffcc', txt: '#333333', cost: '#333333' },  // Battery → Base Load + Grid (Force)
  battery_to_grid_force:                { bg: '#ffffcc', txt: '#333333', cost: '#333333' },  // Battery → Grid (Force)
  battery_to_loads_grid_force:          { bg: '#ffffcc', txt: '#333333', cost: '#333333' },  // Battery → Loads + Grid (Force)
  battery_to_loads_inferred:            { bg: '#ccfff5', txt: '#333333', cost: '#333333' },  // Battery → Loads (inferred)
  battery_to_loads_only:                { bg: '#ccfff5', txt: '#333333', cost: '#333333' },  // Battery → Loads only
  grid_to_baseload_battery_force:       { bg: '#ffe0e0', txt: '#333333', cost: '#cc3333' },  // Grid → Base Load + Battery (Force)
  grid_to_baseload_ev_battery_force:    { bg: '#ffe0e0', txt: '#333333', cost: '#cc3333' },  // Grid → Base Load + EV + Battery (Force)
  grid_to_baseload_ev_force:            { bg: '#ffe0e0', txt: '#333333', cost: '#cc3333' },  // Grid → Base Load + EV (Force)
  grid_to_loads_battery_force:          { bg: '#ffe0e0', txt: '#333333', cost: '#cc3333' },  // Grid → Loads + Battery (Force)
  grid_to_loads_only:                   { bg: '#ffe0e0', txt: '#333333', cost: '#cc3333' },  // Grid → Loads only
  pv_battery_ev_to_grid_export:         { bg: '#ccffcc', txt: '#333333', cost: '#333333' },  // 🌞 Solar + Battery + EV → Grid (Export)
  pv_battery_ev_to_loads:               { bg: '#ccfff5', txt: '#333333', cost: '#333333' },  // 🌞 Solar + Battery + EV → Loads
  pv_battery_grid_to_loads:             { bg: '#FFD4E5', txt: '#333333', cost: '#cc3333' },  // 🌞 Solar + Battery + Grid → Loads
  pv_battery_to_baseload_ev_charge:     { bg: '#ccffcc', txt: '#333333', cost: '#333333' },  // 🌞 Solar + Battery → Base Load + EV (Charge)
  pv_battery_to_baseload_grid_force:    { bg: '#ccffcc', txt: '#333333', cost: '#333333' },  // 🌞 Solar + Battery → Base Load + Grid (Force)
  pv_battery_to_loads_grid_force:       { bg: '#ccffcc', txt: '#333333', cost: '#333333' },  // 🌞 Solar + Battery → Loads + Grid (Force)
  pv_battery_to_loads_no_grid:          { bg: '#ccfff5', txt: '#333333', cost: '#333333' },  // 🌞 Solar + Battery → Loads (no Grid)
  pv_ev_to_loads:                       { bg: '#ccfff5', txt: '#333333', cost: '#333333' },  // 🌞 Solar + EV → Loads
  pv_grid_to_baseload_battery_force:    { bg: '#FFD4E5', txt: '#333333', cost: '#cc3333' },  // 🌞 Solar + Grid → Base Load + Battery (Force)
  pv_grid_to_baseload_ev_battery_force: { bg: '#FFD4E5', txt: '#333333', cost: '#cc3333' },  // 🌞 Solar + Grid → Base Load + EV + Battery (Force)
  pv_grid_to_baseload_ev_charge:        { bg: '#FFD4E5', txt: '#333333', cost: '#cc3333' },  // 🌞 Solar + Grid → Base Load + EV (Charge)
  pv_grid_to_loads:                     { bg: '#FFD4E5', txt: '#333333', cost: '#cc3333' },  // 🌞 Solar + Grid → Loads
  pv_to_baseload_battery:               { bg: '#ccffcc', txt: '#333333', cost: '#333333' },  // 🌞 Solar → Base Load + Battery
  pv_to_baseload_battery_grid:          { bg: '#ccffcc', txt: '#333333', cost: '#333333' },  // 🌞 Solar → Base Load + Battery + Grid
  pv_to_baseload_ev:                    { bg: '#ccffcc', txt: '#333333', cost: '#333333' },  // 🌞 Solar → Base Load + EV
  pv_to_baseload_ev_battery_force:      { bg: '#ccffcc', txt: '#333333', cost: '#333333' },  // 🌞 Solar → Base Load + EV + Battery (Force)
  pv_to_loads_battery:                  { bg: '#ccffcc', txt: '#333333', cost: '#333333' },  // 🌞 Solar → Loads + Battery
  pv_to_loads_battery_grid:             { bg: '#ccffcc', txt: '#333333', cost: '#333333' },  // 🌞 Solar → Loads + Battery + Grid
  pv_to_loads_grid:                     { bg: '#ccffcc', txt: '#333333', cost: '#333333' },  // 🌞 Solar → Loads + Grid
  pv_to_loads_only:                     { bg: '#ccffcc', txt: '#333333', cost: '#333333' },  // 🌞 Solar → Loads only
  
  // Legacy color keys (mapped to new event classifications)
  self_consumption: { bg: '#ccffcc', txt: '#333333', cost: '#333333' },  // → solar_to_loads_only
  profit:           { bg: '#ffffcc', txt: '#333333', cost: '#333333' },  // → solar_battery_to_loads_grid_force
  battery:          { bg: '#ccfff5', txt: '#333333', cost: '#333333' },  // → battery_to_loads_only
  cost:             { bg: '#ffe0e0', txt: '#333333', cost: '#cc3333' },  // → grid_to_loads_only
  forced_export:    { bg: '#ccffcc', txt: '#333333', cost: '#333333' },  // → solar_battery_to_baseload_grid_force
  loss:             { bg: '#ffe0e0', txt: '#333333', cost: '#cc3333' },  // → grid_to_loads_only
  gain:             { bg: '#ccffcc', txt: '#333333', cost: '#333333' },  // → solar_battery_ev_to_grid_export
};

// ── Event label descriptions for settings display ──────────────────────────────
const _HAEO_EVENT_LABELS = {
  battery_ev_charge:                    '🔋 Battery → 🚗 EV (Charge)',
  battery_ev_to_baseload:               '🔋 Battery + 🚗 EV → 🏠 Base Load',
  battery_ev_to_grid_force:             '🔋 Battery + 🚗 EV → ⚡ Grid (Force)',
  battery_ev_to_loads:                  '🔋 Battery + 🚗 EV → Loads',
  battery_grid_to_loads:                '🔋 Battery + ⚡ Grid → Loads',
  battery_to_baseload_grid_force:       '🔋 Battery → 🏠 Base Load + ⚡ Grid (Force)',
  battery_to_grid_force:                '🔋 Battery → ⚡ Grid (Force)',
  battery_to_loads_grid_force:          '🔋 Battery → Loads + ⚡ Grid (Force)',
  battery_to_loads_inferred:            '🔋 Battery → Loads (Inferred)',
  battery_to_loads_only:                '🔋 Battery → Loads Only',
  grid_to_baseload_battery_force:       '⚡ Grid → 🏠 Base Load + 🔋 Battery (Force)',
  grid_to_baseload_ev_battery_force:    '⚡ Grid → 🏠 Base Load + 🚗 EV + 🔋 Battery (Force)',
  grid_to_baseload_ev_force:            '⚡ Grid → 🏠 Base Load + 🚗 EV (Force)',
  grid_to_loads_battery_force:          '⚡ Grid → Loads + 🔋 Battery (Force)',
  grid_to_loads_only:                   '⚡ Grid → Loads Only',
  pv_battery_ev_to_grid_export:         '🌞 Solar + 🔋 Battery + 🚗 EV → ⚡ Grid',
  pv_battery_ev_to_loads:               '🌞 Solar + 🔋 Battery + 🚗 EV → Loads',
  pv_battery_grid_to_loads:             '🌞 Solar + 🔋 Battery + ⚡ Grid → Loads',
  pv_battery_to_baseload_ev_charge:     '🌞 Solar + 🔋 Battery → 🏠 Base Load + 🚗 EV (Charge)',
  pv_battery_to_baseload_grid_force:    '🌞 Solar + 🔋 Battery → 🏠 Base Load + ⚡ Grid (Force)',
  pv_battery_to_loads_grid_force:       '🌞 Solar + 🔋 Battery → Loads + ⚡ Grid (Force)',
  pv_battery_to_loads_no_grid:          '🌞 Solar + 🔋 Battery → Loads (No Grid)',
  pv_ev_to_loads:                       '🌞 Solar + 🚗 EV → Loads',
  pv_grid_to_baseload_battery_force:    '🌞 Solar + ⚡ Grid → 🏠 Base Load + 🔋 Battery (Force)',
  pv_grid_to_baseload_ev_battery_force: '🌞 Solar + ⚡ Grid → 🏠 Base Load + 🚗 EV + 🔋 Battery (Force)',
  pv_grid_to_baseload_ev_charge:        '🌞 Solar + ⚡ Grid → 🏠 Base Load + 🚗 EV (Charge)',
  pv_grid_to_loads:                     '🌞 Solar + ⚡ Grid → Loads',
  pv_to_baseload_battery:               '🌞 Solar → 🏠 Base Load + 🔋 Battery',
  pv_to_baseload_battery_grid:          '🌞 Solar → 🏠 Base Load + 🔋 Battery + ⚡ Grid',
  pv_to_baseload_ev:                    '🌞 Solar → 🏠 Base Load + 🚗 EV (Charge)',
  pv_to_baseload_ev_battery_force:      '🌞 Solar → 🏠 Base Load + 🚗 EV + 🔋 Battery (Force)',
  pv_to_loads_battery:                  '🌞 Solar + 🔋 Battery → Loads',
  pv_to_loads_battery_grid:             '🌞 Solar + 🔋 Battery → Loads + ⚡ Grid',
  pv_to_loads_grid:                     '🌞 Solar → Loads + ⚡ Grid',
  pv_to_loads_only:                     '🌞 Solar → Loads Only'
};

// ── Deferrable Loads Presets ───────────────────────────────────────────────
const _HAEO_DEFERRABLE_PRESETS = [
  { name: 'Circuit',          displayName: 'Circuit',                  abbr: 'Circuit',   emoji: '⚡',  defaultForecast: 'sensor.circuit_power_X_power',          defaultSensor: 'sensor.circuit_power_X_active_power',   defaultEnergy: 'sensor.circuit_power_X_energy' },
  { name: 'Air Conditioner',  displayName: 'Air Conditioner (HVAC)',   abbr: 'HVAC',      emoji: '🌡️', defaultForecast: 'sensor.air_conditioner_power',           defaultSensor: 'sensor.air_conditioner_active_power',   defaultEnergy: 'sensor.air_conditioner_energy' },
  { name: 'Hot Water System', displayName: 'Hot Water System (HWS)',   abbr: 'HWS',       emoji: '🚿', defaultForecast: 'sensor.hot_water_system_power',          defaultSensor: 'sensor.hot_water_system_active_power',  defaultEnergy: 'sensor.hot_water_system_energy' },
  { name: 'Clothes Dryer',    displayName: 'Clothes Dryer',            abbr: 'C. Dryer',  emoji: '👚', defaultForecast: 'sensor.clothes_dryer_power',             defaultSensor: 'sensor.clothes_dryer_active_power',     defaultEnergy: 'sensor.clothes_dryer_energy' },
  { name: 'Washing Machine',  displayName: 'Washing Machine',          abbr: 'W. Machine',emoji: '🧺', defaultForecast: 'sensor.washing_machine_power',           defaultSensor: 'sensor.washing_machine_active_power',   defaultEnergy: 'sensor.washing_machine_energy' },
  { name: 'Dishwasher',       displayName: 'Dishwasher',               abbr: 'Dishw.',    emoji: '🍽️', defaultForecast: 'sensor.dishwasher_power',                defaultSensor: 'sensor.dishwasher_active_power',        defaultEnergy: 'sensor.dishwasher_energy' },
  { name: 'IT Hardware',      displayName: 'IT Hardware',              abbr: 'IT H/W',    emoji: '💻', defaultForecast: 'sensor.it_hardware_power',               defaultSensor: 'sensor.it_hardware_active_power',       defaultEnergy: 'sensor.it_hardware_energy' },
  { name: 'Pool',             displayName: 'Pool Heater/Pump',         abbr: 'Pool',      emoji: '🏊', defaultForecast: 'sensor.pool_power',                      defaultSensor: 'sensor.pool_active_power',              defaultEnergy: 'sensor.pool_energy' },
  { name: 'Generic Load',     displayName: 'Generic Load',             abbr: 'Generic',   emoji: '🔌', defaultForecast: 'sensor.generic_load_power',              defaultSensor: 'sensor.generic_load_active_power',      defaultEnergy: 'sensor.generic_load_energy' },
];

// ── Legend ────────────────────────────────────────────────────────────────────
const _HAEO_LEG_L = [
  ['#ccffcc','#333','🌞 Solar → 🏠 Base Load','Self Consumption - Solar'],
  ['#ccffcc','#333','🌞 Solar → 🏠 Base Load + 🔋 Battery','Self Consumption - Charge Battery'],
  ['#ccffcc','#333','🌞 Solar → 🏠 Base Load + 🚗 EV','Self Consumption - Solar to EV'],
  ['#ccffcc','#333','🌞 Solar → 🏠 Base Load + 🔋 Battery + 🚗 EV','Self Consumption - Solar to Home Load + Battery + EV'],
  [_HAEO_COLOURS.self_consumption.bg,_HAEO_COLOURS.self_consumption.txt,'🌞 Solar → 🏠 Base Load + ⚡ Grid','Profit - Grid Export (Solar)'],
  [_HAEO_COLOURS.self_consumption.bg,_HAEO_COLOURS.self_consumption.txt,'🌞 Solar → 🏠 Base Load + 🔋 Battery + ⚡ Grid','Profit - Grid Export + Charge Battery'],
  [_HAEO_COLOURS.self_consumption.bg,_HAEO_COLOURS.self_consumption.txt,'🌞 Solar → 🏠 Base Load + ⏰ Defer. Loads','Self Consumption - Solar to Deferrable Load'],
  [_HAEO_COLOURS.self_consumption.bg,_HAEO_COLOURS.self_consumption.txt,'🌞 Solar → 🏠 Base Load + ⏰ Defer. Loads + 🔋 Battery','Self Consumption - Solar to Home Load + Deferrable Load + Battery'],
  [_HAEO_COLOURS.battery.bg,_HAEO_COLOURS.battery.txt,'🌞 Solar + 🔋 Battery → 🏠 Base Load','Self Consumption - Solar + Battery'],
  [_HAEO_COLOURS.battery.bg,_HAEO_COLOURS.battery.txt,'🌞 Solar + 🔋 Battery → 🏠 Base Load + 🚗 EV','Self Consumption - Solar + Battery to Home Load + EV'],
  [_HAEO_COLOURS.battery.bg,_HAEO_COLOURS.battery.txt,'🌞 Solar + 🔋 Battery + 🚗 EV → 🏠 Base Load','Self Consumption - Solar + Battery + EV'],
  [_HAEO_COLOURS.forced_export.bg,_HAEO_COLOURS.forced_export.txt,'🌞 Solar + 🔋 Battery → 🏠 Base Load + ⚡ Grid (Force)','Profit - Grid Export (Forced Battery)'],
  [_HAEO_COLOURS.cost.bg,_HAEO_COLOURS.cost.txt,'🌞 Solar + ⚡ Grid → 🏠 Base Load','Cost - Solar + Grid Import'],
  [_HAEO_COLOURS.cost.bg,_HAEO_COLOURS.cost.txt,'🌞 Solar + ⚡ Grid → 🏠 Base Load + 🚗 EV','Cost - Solar + Grid to Home Load + EV'],
  [_HAEO_COLOURS.cost.bg,_HAEO_COLOURS.cost.txt,'🌞 Solar + ⚡ Grid → 🏠 Base Load + 🔋 Battery (Force)','Cost - Solar + Grid Import + Charge Battery'],
];

const _HAEO_LEG_R = [
  [_HAEO_COLOURS.battery.bg,_HAEO_COLOURS.battery.txt,'🔋 Battery → 🏠 Base Load','Self Consumption - Battery'],
  [_HAEO_COLOURS.battery.bg,_HAEO_COLOURS.battery.txt,'🔋 Battery → 🏠 Base Load + 🚗 EV','Self Consumption - Battery to Home Load + EV'],
  [_HAEO_COLOURS.battery.bg,_HAEO_COLOURS.battery.txt,'🔋 Battery + 🚗 EV → 🏠 Base Load','Self Consumption - Battery + EV to Home Load'],
  [_HAEO_COLOURS.battery.bg,_HAEO_COLOURS.battery.txt,'🔋 Battery → 🏠 Base Load + ⏰ Defer. Loads','Self Consumption - Battery to Home Load + Deferrable Load'],
  [_HAEO_COLOURS.profit.bg,_HAEO_COLOURS.profit.txt,'🔋 Battery → 🏠 Base Load + ⚡ Grid (Force)','Profit - Grid Export (Forced)'],
  [_HAEO_COLOURS.cost.bg,_HAEO_COLOURS.cost.txt,'🔋 Battery + ⚡ Grid → 🏠 Base Load','Cost - Battery + Grid Import'],
  [_HAEO_COLOURS.cost.bg,_HAEO_COLOURS.cost.txt,'🔋 Battery + 🚗 EV + ⚡ Grid → 🏠 Base Load','Cost - Battery + EV + Grid to Home Load'],
  [_HAEO_COLOURS.loss.bg,_HAEO_COLOURS.loss.txt,'⚡ Grid → 🏠 Base Load','Cost - Grid Import (Battery Idle | No Solar)'],
  [_HAEO_COLOURS.loss.bg,_HAEO_COLOURS.loss.txt,'⚡ Grid → 🏠 Base Load + 🚗 EV','Cost - Grid Import to Home Load + EV'],
  [_HAEO_COLOURS.loss.bg,_HAEO_COLOURS.loss.txt,'⚡ Grid → 🏠 Base Load + ⏰ Defer. Loads','Cost - Grid Import to Home Load + Deferrable Load'],
  [_HAEO_COLOURS.loss.bg,_HAEO_COLOURS.loss.txt,'🚗 EV → 🏠 Base Load','Cost - EV to Home Load'],
  [_HAEO_COLOURS.battery.bg,_HAEO_COLOURS.battery.txt,'❄️ 🚿 ⏰ Deferrable Loads','Placeholder - HVAC, HWS - Scheduled Loads'],
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
  '🌞 Solar → 🏠 Base Load': 
    'Solar is supplying home load only. Battery idle and no grid activity. Optimal self-consumption with zero import/export.',
  
  '🌞 Solar → 🏠 Base Load + 🔋 Battery': 
    'Solar is supplying home load and charging battery. No grid activity. Battery will be available for discharge during peak demand or low solar periods.',
  
  '🌞 Solar + 🔋 Battery → 🏠 Base Load': 
    'Solar and battery together supplying home load. Battery is discharging to supplement solar. No grid activity.',
  
  '🌞 Solar → 🏠 Base Load + ⚡ Grid': 
    'Solar supplying home load with surplus exported to grid. Battery idle. Export occurs when solar generation exceeds home load.',
  
  '🌞 Solar → 🏠 Base Load + 🔋 Battery + ⚡ Grid': 
    'Solar supplying home load, charging battery, and exporting surplus to grid simultaneously. Optimal three-way allocation.',
  
  '🌞 Solar + 🔋 Battery → 🏠 Base Load + ⚡ Grid': 
    'Solar and battery together supplying home load with remaining power exported to grid. Battery discharging to maximize export.',
  
  '🌞 Solar → 🏠 Base Load + ⚡ Grid + 🔋 Battery (Force)': 
    'Solar supplying home load, charging battery, and exporting surplus to grid. Scheduled battery charge at optimal solar window.',
  
  '🌞 Solar + ⚡ Grid → 🏠 Base Load': 
    'Solar with grid supplement covering home load. Solar alone is insufficient; grid imports additional power.',
  
  '🌞 Solar + 🔋 Battery + ⚡ Grid → 🏠 Base Load': 
    'Solar, battery, and grid together covering home load. Battery discharging but solar and grid both needed due to high home demand.',
  
  '🌞 Solar → 🏠 Base Load + 🚗 EV': 
    'Solar supplying home load and charging EV. Battery idle. Pure solar-to-load and solar-to-EV scenario.',
  
  '🌞 Solar + 🔋 Battery → 🏠 Base Load + 🚗 EV': 
    'Solar and battery supplying home load and charging EV. No grid activity. Battery available for EV charging.',
  
  '🌞 Solar + ⚡ Grid → 🏠 Base Load + 🚗 EV': 
    'Solar and grid together covering home load while charging EV. Solar plus grid import needed for all three loads.',
  
  // Cost scenarios - Grid import (forced charge)
  '⚡ Grid → 🏠 Base Load': 
    'Grid supplying home load only. Battery idle. Occurs during off-peak tariffs or when solar unavailable.',
  
  '⚡ Grid → 🏠 Base Load + 🔋 Battery (Force)': 
    'Grid supplying home load and force-charging battery at low tariff rate during cheap import window. Battery will discharge during peak tariff periods for cost savings.',
  
  '⚡ Grid → 🏠 Base Load + 🚗 EV (Force)': 
    'Grid supplying home load and charging EV at low tariff rate. EV charging optimized for lowest cost periods.',
  
  '⚡ Grid → 🏠 Base Load + 🔋 Battery + 🚗 EV (Force)': 
    'Grid supplying home load, charging battery, and charging EV all at low tariff rate. Multiple loads optimized for cost savings.',
  
  '🌞 Solar + ⚡ Grid → 🏠 Base Load + 🔋 Battery (Force)': 
    'Solar with grid supplement covering home load while force-charging battery at low tariff rate. Battery will be available for peak discharge.',
  
  // Profit scenarios - Grid export (forced discharge)
  '🔋 Battery → 🏠 Base Load + ⚡ Grid (Force)': 
    'Battery discharging to cover home load and force-export to grid at high tariff rate. Scheduled export during peak pricing window for profit.',
  
  '🌞 Solar + 🔋 Battery → 🏠 Base Load + ⚡ Grid (Force)': 
    'Solar and battery together covering home load with forced battery export to grid at peak tariff rate. Maximizes export revenue.',
  
  '🔋 Battery + 🚗 EV → ⚡ Grid (Force)': 
    'Battery and EV both discharging to grid at high tariff rate. EV used as flexible storage asset for export during peak pricing.',
  
  '🌞 Solar + 🔋 Battery + 🚗 EV → ⚡ Grid': 
    'Solar, battery, and EV all exporting to grid simultaneously at peak tariff. Maximum export revenue from all available sources.',
  
  // Battery scenarios - no solar, no grid
  '🔋 Battery → 🏠 Base Load': 
    'Battery powering home load only. No solar generation and no grid activity. Battery will deplete; grid import will follow if battery low.',
  
  '🔋 Battery + ⚡ Grid → 🏠 Base Load': 
    'Battery discharging but grid supplement needed due to high home load exceeding battery capacity. Hybrid support scenario.',
  
  // EV scenarios
  '🚗 EV → 🏠 Base Load': 
    'EV discharging to cover home load (V2H/V2L). Vehicle is supplying power to home. No battery or grid involvement.',
  
  '🚗 EV + ⚡ Grid → 🏠 Base Load': 
    'EV discharging plus grid covering home load. Vehicle and grid both needed for home load demand.',
  
  '🔋 Battery + 🚗 EV → 🏠 Base Load': 
    'Battery and EV both discharging to cover home load. No solar or grid; using stored energy from both sources.',
  
  '🌞 Solar + 🔋 Battery + 🚗 EV → 🏠 Base Load': 
    'Solar, battery, and EV together supplying home load. All available sources optimized for load coverage.',
  
  '🌞 Solar + ⚡ Grid → 🏠 Base Load + 🚗 EV': 
    'Solar and grid together covering home load while charging EV. Solar plus grid import needed for all three loads.',
  
  '🌞 Solar → 🏠 Base Load + 🚗 EV + 🔋 Battery (Force)': 
    'Solar supplying home load and charging both EV and battery at low tariff rate. Battery will discharge during peak periods.',
  
  '🌞 Solar + ⚡ Grid → 🏠 Base Load + 🚗 EV + 🔋 Battery (Force)': 
    'Solar with grid supplement covering home load while force-charging both battery and EV at low tariff rate. Maximizes both storage assets.',
  
  '⚡ Grid → 🏠 Base Load + 🚗 EV + 🔋 Battery (Force)': 
    'Grid covering home load and force-charging both EV and battery at low tariff rate during cheap import window. Both will discharge during peak tariff periods for cost savings.',
  
  '🔋 Battery → 🚗 EV + 🏠 Base Load': 
    'Battery covering both home load and charging EV simultaneously. No solar or grid activity. Battery powering two loads.',
  
  '🔋 Battery → 🚗 EV (Charging)': 
    'Battery charging EV only. No solar, no grid, no home load involvement. Pure battery-to-vehicle charge transfer.',
  
  '🌞 Solar +    Battery → Loads (No Grid)': 
    'Solar and battery together supplying all loads with no grid involvement. Pure self-consumption with battery discharge. Occurs during high demand periods with sufficient solar generation.',
  
  '🌞 Solar + 🔋 Battery → 🏠 Base Load + 🚗 EV (Charge)': 
    'Solar and battery together covering home load and charging EV simultaneously. No grid activity. Both home and EV drawing from solar and battery discharge.',
  
  '🌞 Solar → 🏠 Base Load + 🚗 EV + 🔋 Battery (Force)': 
    'Solar supplying home load, charging EV, and force-charging battery at low tariff rate simultaneously. Battery will discharge during peak periods for cost optimization.',
};

function _haeo_classifyFuture(solarKw, loadKw, battKw, gridKw, evKw, deferLoadKw = 0, ev2Kw = 0, optionalLoadsKw = [], optionalLoadsConfig = []) {
  const T = 0.05;
  const charging    = battKw < -T;
  const discharging = battKw > T;
  const exporting   = gridKw < -T;  // negative = export
  const importing   = gridKw > T;   // positive = import
  const evCharging  = evKw < -T;
  const evDischarging = evKw > T;
  const ev2Charging = ev2Kw < -T;
  const ev2Discharging = ev2Kw > T;
  const hasDeferLoad = deferLoadKw > T;
  
  // Build optional loads label with custom names
  let optionalLoadsLabel = '';
  if (optionalLoadsConfig && optionalLoadsConfig.length > 0) {
    const activeOptional = [];
    optionalLoadsConfig.forEach((config, idx) => {
      if (config.enabled && optionalLoadsKw[idx] > T) {
        const displayInfo = _haeo_getOptionalLoadDisplay(config);
        activeOptional.push(displayInfo.emoji + ' ' + displayInfo.name);
      }
    });
    if (activeOptional.length > 0) {
      optionalLoadsLabel = ' + ' + activeOptional.join(' + ');
    }
  }
  
  // Build dynamic labels for active loads
  let activeLoadsStr = '🏠 Base Load';
  if (hasDeferLoad) activeLoadsStr += ' + ⏰ Defer. Loads';
  if (optionalLoadsLabel) activeLoadsStr += optionalLoadsLabel;
  if (evCharging) activeLoadsStr += ' + 🚗 EV';
  if (ev2Charging) activeLoadsStr += ' + 🚙 EV2';

  // ── EV/EV2 Discharging Scenarios (to grid) ──
  if ((evDischarging || ev2Discharging) && exporting && discharging && solarKw > T) {
    const evLabel = evDischarging && ev2Discharging ? '🚗 EV + 🚙 EV2' : evDischarging ? '🚗 EV' : '🚙 EV2';
    return { label: '🌞 Solar + 🔋 Battery + ' + evLabel + ' → ⚡ Grid', note: 'Solar, battery and EV(s) exporting to grid', color: 'pv_battery_ev_to_grid_export' };
  }
  if ((evDischarging || ev2Discharging) && exporting && discharging) {
    const evLabel = evDischarging && ev2Discharging ? '🚗 EV + 🚙 EV2' : evDischarging ? '🚗 EV' : '🚙 EV2';
    return { label: '🔋 Battery + ' + evLabel + ' → ⚡ Grid (Force)', note: 'Battery and EV(s) exporting to grid', color: 'battery_ev_to_grid_force' };
  }
  if ((evDischarging || ev2Discharging) && discharging && solarKw > T) {
    const evLabel = evDischarging && ev2Discharging ? '🚗 EV + 🚙 EV2' : evDischarging ? '🚗 EV' : '🚙 EV2';
    return { label: '🌞 Solar + 🔋 Battery + ' + evLabel + ' → ' + activeLoadsStr, note: 'Solar, battery and EV(s) covering loads', color: 'pv_battery_ev_to_loads' };
  }
  if ((evDischarging || ev2Discharging) && discharging) {
    const evLabel = evDischarging && ev2Discharging ? '🚗 EV + 🚙 EV2' : evDischarging ? '🚗 EV' : '🚙 EV2';
    return { label: '🔋 Battery + ' + evLabel + ' → ' + activeLoadsStr, note: 'Battery and EV(s) covering loads', color: 'battery_ev_to_loads' };
  }
  if ((evDischarging || ev2Discharging) && importing) {
    const evLabel = evDischarging && ev2Discharging ? '🚗 EV + 🚙 EV2' : evDischarging ? '🚗 EV' : '🚙 EV2';
    return { label: evLabel + ' + ⚡ Grid → ' + activeLoadsStr, note: 'EV(s) and grid covering loads', color: 'battery_grid_to_loads' };
  }
  if (evDischarging || ev2Discharging) {
    const evLabel = evDischarging && ev2Discharging ? '🚗 EV + 🚙 EV2' : evDischarging ? '🚗 EV' : '🚙 EV2';
    return { label: evLabel + ' → ' + activeLoadsStr, note: 'EV(s) covering loads', color: 'pv_ev_to_loads' };
  }
  
  // ── EV/EV2 Charging Scenarios ──
  if ((evCharging || ev2Charging) && solarKw > T && discharging) {
    const evLabel = evCharging && ev2Charging ? '🚗 EV + 🚙 EV2' : evCharging ? '🚗 EV' : '🚙 EV2';
    return { label: '🌞 Solar + 🔋 Battery → 🏠 Base Load + ' + evLabel, note: 'Solar and battery covering home and charging EV(s)', color: 'pv_battery_to_baseload_ev_charge' };
  }
  if ((evCharging || ev2Charging) && solarKw > T && importing) {
    const evLabel = evCharging && ev2Charging ? '🚗 EV + 🚙 EV2' : evCharging ? '🚗 EV' : '🚙 EV2';
    return { label: '🌞 Solar + ⚡ Grid → 🏠 Base Load + ' + evLabel, note: 'Solar and grid covering home and charging EV(s)', color: 'pv_grid_to_baseload_ev_charge' };
  }
  if ((evCharging || ev2Charging) && solarKw > T && charging) {
    const evLabel = evCharging && ev2Charging ? '🚗 EV + 🚙 EV2' : evCharging ? '🚗 EV' : '🚙 EV2';
    return { label: '🌞 Solar → 🏠 Base Load + ' + evLabel + ' + 🔋 Battery (Force)', note: 'Solar covering home and charging EV(s) and battery at low tariff', color: 'pv_to_baseload_ev_battery_force' };
  }
  if ((evCharging || ev2Charging) && solarKw > T) {
    const evLabel = evCharging && ev2Charging ? '🚗 EV + 🚙 EV2' : evCharging ? '🚗 EV' : '🚙 EV2';
    return { label: '🌞 Solar → 🏠 Base Load + ' + evLabel, note: 'Solar covering home and charging EV(s)', color: 'pv_to_baseload_ev' };
  }
  if ((evCharging || ev2Charging) && importing && charging && solarKw > T) {
    const evLabel = evCharging && ev2Charging ? '🚗 EV + 🚙 EV2' : evCharging ? '🚗 EV' : '🚙 EV2';
    return { label: '🌞 Solar + ⚡ Grid → 🏠 Base Load + ' + evLabel + ' + 🔋 Battery (Force)', note: 'Solar with grid covering home and charging EV(s) and battery', color: 'pv_grid_to_baseload_ev_battery_force' };
  }
  if ((evCharging || ev2Charging) && importing && charging) {
    const evLabel = evCharging && ev2Charging ? '🚗 EV + 🚙 EV2' : evCharging ? '🚗 EV' : '🚙 EV2';
    return { label: '⚡ Grid → 🏠 Base Load + ' + evLabel + ' + 🔋 Battery (Force)', note: 'Grid covering home and charging EV(s) and battery', color: 'grid_to_baseload_ev_battery_force' };
  }
  if ((evCharging || ev2Charging) && importing) {
    const evLabel = evCharging && ev2Charging ? '🚗 EV + 🚙 EV2' : evCharging ? '🚗 EV' : '🚙 EV2';
    return { label: '⚡ Grid → 🏠 Base Load + ' + evLabel + ' (Force)', note: 'Grid covering home and charging EV(s)', color: 'grid_to_baseload_ev_force' };
  }
  if ((evCharging || ev2Charging) && charging) {
    const evLabel = evCharging && ev2Charging ? '🚗 EV + 🚙 EV2' : evCharging ? '🚗 EV' : '🚙 EV2';
    return { label: '🔋 Battery → ' + evLabel + ' + 🏠 Base Load', note: 'Battery covering home load and charging EV(s)', color: 'battery_ev_to_baseload' };
  }
  if (evCharging || ev2Charging) {
    const evLabel = evCharging && ev2Charging ? '🚗 EV + 🚙 EV2' : evCharging ? '🚗 EV' : '🚙 EV2';
    return { label: '🔋 Battery → ' + evLabel + ' (Charging)', note: 'Battery charging EV(s)', color: 'battery_ev_charge' };
  }

  // ── Force export (battery discharging to grid) ──
  if (exporting && discharging && solarKw > T)
    return { label: '🌞 Solar + 🔋 Battery → 🏠 Base Load + ⚡ Grid (Force)', note: 'Forced export: solar and battery exporting to grid', color: 'pv_battery_to_baseload_grid_force' };
  if (exporting && discharging)
    return { label: '🔋 Battery → 🏠 Base Load + ⚡ Grid (Force)', note: 'Forced discharge: battery exporting to grid', color: 'battery_to_baseload_grid_force' };

  // ── Forced grid charge ──
  if (charging && importing && solarKw > T)
    return { label: '🌞 Solar + ⚡ Grid → 🏠 Base Load + 🔋 Battery (Force)', note: 'Solar + forced grid charging battery', color: 'pv_grid_to_baseload_battery_force' };
  if (charging && importing)
    return { label: '⚡ Grid → 🏠 Base Load + 🔋 Battery (Force)', note: 'Forced grid charging — cheap rate window', color: 'grid_to_baseload_battery_force' };
  if (charging && solarKw > T)
    return { label: '🌞 Solar → 🏠 Base Load + 🔋 Battery', note: 'Solar covering home and charging battery — no grid', color: 'pv_to_baseload_battery' };

  // ── Solar scenarios ──
  if (solarKw > T && exporting && battKw > T)
    return { label: '🌞 Solar + 🔋 Battery → ' + activeLoadsStr + ' + ⚡ Grid (Force)', note: 'Solar and battery covering home and exporting', color: 'pv_battery_to_loads_grid_force' };
  if (solarKw > T && exporting && charging)
    return { label: '🌞 Solar → ' + activeLoadsStr + ' + 🔋 Battery + ⚡ Grid', note: 'Solar covering home, charging battery and exporting', color: 'pv_to_loads_battery_grid' };
  if (solarKw > T && exporting)
    return { label: '🌞 Solar → ' + activeLoadsStr + ' + ⚡ Grid', note: 'Solar covering home and exporting surplus', color: 'pv_to_loads_grid' };
  if (solarKw > T && discharging && importing)
    return { label: '🌞 Solar + 🔋 Battery + ⚡ Grid → ' + activeLoadsStr, note: 'Solar and battery discharging but grid also needed', color: 'pv_battery_grid_to_loads' };
  if (solarKw > T && discharging)
    return { label: '🌞 Solar + 🔋 Battery → ' + activeLoadsStr, note: 'Solar and battery together covering home — no grid', color: 'pv_battery_to_loads_no_grid' };
  if (solarKw > T && importing)
    return { label: '🌞 Solar + ⚡ Grid → ' + activeLoadsStr, note: 'Solar and grid together covering home', color: 'pv_grid_to_loads' };
  if (solarKw > T && charging)
    return { label: '🌞 Solar → ' + activeLoadsStr + ' + 🔋 Battery', note: 'Solar covering home and charging battery — no grid', color: 'pv_to_loads_battery' };
  if (solarKw > T)
    return { label: '🌞 Solar → ' + activeLoadsStr, note: 'Solar covering home — no battery, no grid', color: 'pv_to_loads_only' };

  // ── No solar ──
  if (discharging && exporting)
    return { label: '🔋 Battery → ' + activeLoadsStr + ' + ⚡ Grid (Force)', note: 'Forced discharge: battery exporting to grid', color: 'battery_to_loads_grid_force' };
  if (discharging && importing)
    return { label: '🔋 Battery + ⚡ Grid → ' + activeLoadsStr, note: 'Battery discharging but grid supplement needed', color: 'battery_grid_to_loads' };
  if (discharging)
    return { label: '🔋 Battery → ' + activeLoadsStr, note: 'Battery powering home — no solar, no grid', color: 'battery_to_loads_only' };
  if (importing && charging)
    return { label: '⚡ Grid → ' + activeLoadsStr + ' + 🔋 Battery (Force)', note: 'Forced grid charging — cheap rate window', color: 'grid_to_loads_battery_force' };
  if (importing)
    return { label: '⚡ Grid → ' + activeLoadsStr, note: 'Grid covering home — battery idle', color: 'grid_to_loads_only' };
  // Fallback: load present but source not explicit in forecast
  if (loadKw > T)
    return { label: '🔋 Battery → ' + activeLoadsStr, note: 'Inferred: battery powering home — no explicit source in forecast', color: 'battery_to_loads_inferred' };
  return { label: '—', note: '', color: '' };
}

// ── Classify past ─────────────────────────────────────────────────────────────
function _haeo_classifyPast(solarKw, loadKw, battKw, gridKw, evKw, deferLoadKw = 0, ev2Kw = 0, optionalLoadsKw = [], optionalLoadsConfig = []) {
  const T = 0.10;
  const charging    = battKw < -T;
  const discharging = battKw > T;
  const exporting   = gridKw < -T;  // negative = export
  const importing   = gridKw > T;   // positive = import
  const evCharging  = evKw < -T;
  const evDischarging = evKw > T;

  // ── EV Scenarios ──
  if (evDischarging && exporting && discharging && solarKw > T)
    return { label: '🌞 Solar + 🔋 Battery + 🚗 EV → ⚡ Grid', color: 'pv_battery_ev_to_grid_export' };
  if (evDischarging && exporting && discharging)
    return { label: '🔋 Battery + 🚗 EV → ⚡ Grid (Force)', color: 'battery_ev_to_grid_force' };
  if (evDischarging && discharging && solarKw > T)
    return { label: '🌞 Solar + 🔋 Battery + 🚗 EV → 🏠 Base Load', color: 'pv_battery_ev_to_loads' };
  if (evDischarging && discharging)
    return { label: '🔋 Battery + 🚗 EV → 🏠 Base Load', color: 'battery_ev_to_loads' };
  if (evDischarging && importing)
    return { label: '🚗 EV + ⚡ Grid → 🏠 Base Load', color: 'battery_grid_to_loads' };
  if (evDischarging)
    return { label: '🚗 EV → 🏠 Base Load', color: 'pv_ev_to_loads' };
  if (evCharging && solarKw > T && discharging)
    return { label: '🌞 Solar + 🔋 Battery → 🏠 Base Load + 🚗 EV', color: 'pv_battery_to_baseload_ev_charge' };
  if (evCharging && solarKw > T && importing)
    return { label: '🌞 Solar + ⚡ Grid → 🏠 Base Load + 🚗 EV', color: 'pv_grid_to_baseload_ev_charge' };
  if (evCharging && solarKw > T && charging)
    return { label: '🌞 Solar → 🏠 Base Load + 🚗 EV + 🔋 Battery (Force)', color: 'pv_to_baseload_ev_battery_force' };
  if (evCharging && solarKw > T)
    return { label: '🌞 Solar → 🏠 Base Load + 🚗 EV', color: 'pv_to_baseload_ev' };
  if (evCharging && importing && charging)
    return { label: '⚡ Grid → 🏠 Base Load + 🚗 EV + 🔋 Battery (Force)', color: 'grid_to_baseload_ev_battery_force' };
  if (evCharging && importing)
    return { label: '⚡ Grid → 🏠 Base Load + 🚗 EV (Force)', color: 'grid_to_baseload_ev_force' };
  if (evCharging && charging)
    return { label: '🔋 Battery → 🚗 EV + 🏠 Base Load', color: 'battery_ev_to_baseload' };
  if (evCharging)
    return { label: '🔋 Battery → 🚗 EV (Charging)', color: 'battery_ev_charge' };

  // Force export (battery discharging to grid)
  if (exporting && discharging && solarKw > T)
    return { label: '🌞 Solar + 🔋 Battery → 🏠 Base Load + ⚡ Grid (Force)', color: 'pv_battery_to_baseload_grid_force' };
  if (exporting && discharging)
    return { label: '🔋 Battery → 🏠 Base Load + ⚡ Grid (Force)', color: 'battery_to_baseload_grid_force' };
  // Solar with export
  if (solarKw > T && exporting && charging)
    return { label: '🌞 Solar → 🏠 Base Load + 🔋 Battery + ⚡ Grid', note: 'Solar covering home, charging battery, and exporting to grid', color: 'pv_to_baseload_battery_grid' };
  if (solarKw > T && exporting)
    return { label: '🌞 Solar → 🏠 Base Load + ⚡ Grid', color: 'pv_to_baseload_battery' };
  // Forced grid charge
  if (charging && importing && solarKw > T)
    return { label: '🌞 Solar + ⚡ Grid → 🏠 Base Load + 🔋 Battery (Force)', color: 'pv_grid_to_baseload_battery_force' };
  if (charging && importing)
    return { label: '⚡ Grid → 🏠 Base Load + 🔋 Battery (Force)', color: 'grid_to_baseload_battery_force' };
  if (charging && solarKw > T)
    return { label: '🌞 Solar → 🏠 Base Load + 🔋 Battery', color: 'pv_to_baseload_battery' };
  // Solar self-consumption
  if (solarKw > T && discharging && importing)
    return { label: '🌞 Solar + 🔋 Battery + ⚡ Grid → 🏠 Base Load', color: 'pv_battery_grid_to_loads' };
  if (solarKw > T && discharging)
    return { label: '🌞 Solar + 🔋 Battery → 🏠 Base Load', color: 'pv_battery_to_loads_no_grid' };
  if (solarKw > T && importing)
    return { label: '🌞 Solar + ⚡ Grid → 🏠 Base Load', color: 'pv_grid_to_loads' };
  if (solarKw > T)
    return { label: '🌞 Solar → 🏠 Base Load', color: 'pv_to_loads_only' };
  // No solar
  if (discharging && importing)
    return { label: '🔋 Battery + ⚡ Grid → 🏠 Base Load', color: 'battery_grid_to_loads' };
  if (discharging)
    return { label: '🔋 Battery → 🏠 Base Load', color: 'battery_to_loads_only' };
  if (importing && charging)
    return { label: '⚡ Grid → 🏠 Base Load + 🔋 Battery (Force)', color: 'grid_to_loads_battery_force' };
  if (importing)
    return { label: '⚡ Grid → 🏠 Base Load', color: 'grid_to_loads_only' };
  if (loadKw > T)
    return { label: '⚡ Grid → 🏠 Base Load', color: 'grid_to_loads_only' };
  return { label: '—', color: '' };
}

// ── Formatters ────────────────────────────────────────────────────────────────
function _haeo_fmtP(v, priceDecimals = 4) {
  return (v < 0 ? '-' : '') + _HAEO_CUR + Math.abs(v).toFixed(priceDecimals);
}

// Returns {disp, col} — cost > 0 = money spent (import), cost < 0 = money earned (export)
function _haeo_fmtCost(cost) {
  if (cost > 0.0001)  return { disp: '-' + _HAEO_CUR + cost.toFixed(3),           col: null };
  if (cost < -0.0001) return { disp: _HAEO_CUR  + Math.abs(cost).toFixed(3), col: '#4caf50' };
  return { disp: '—', col: null };
}

// Build finances bar with current prices and daily totals
function _haeo_buildFinancesBar(buyPrice, sellPrice, dailyCost, dailyGridImportKwh, dailyGridExportKwh, dailyGridImportFmt, dailyGridExportFmt, priceDecimals = 4) {
  const buyFmt = buyPrice !== null ? _HAEO_CUR + Math.abs(buyPrice).toFixed(priceDecimals) : '—';
  const sellFmt = sellPrice !== null ? _HAEO_CUR + Math.abs(sellPrice).toFixed(priceDecimals) : '—';
  
  let netColor = '#555';
  let netDisplay = '—';
  if (dailyCost !== null && dailyCost !== undefined) {
    if (dailyCost < -0.01) {
      netColor = '#4caf50'; // Green: credit
      netDisplay = _HAEO_CUR + Math.abs(dailyCost).toFixed(2) + ' (credit)';
    } else if (dailyCost > 0.01) {
      netColor = '#f44336'; // Red: cost
      netDisplay = '-' + _HAEO_CUR + dailyCost.toFixed(2);
    } else {
      netColor = '#666'; // Grey: balanced
      netDisplay = _HAEO_CUR + '0.00';
    }
  }
  
  // Calculate import cost and export income (for future use if needed)
  let importCost = 0;
  let exportIncome = 0;
  if (dailyGridImportKwh !== null && buyPrice !== null) {
    importCost = dailyGridImportKwh * buyPrice;
  }
  if (dailyGridExportKwh !== null && sellPrice !== null) {
    exportIncome = dailyGridExportKwh * sellPrice;
  }
  
  const importDisplay = dailyGridImportFmt;
  const exportDisplay = dailyGridExportFmt;
  
  return '<span style="color:#FF9800;font-weight:bold;margin-right:12px;">FINANCES:</span>' +
         '<span style="margin-right:12px;">💲 <strong>Buy:</strong> <span style="background:#555;color:#fff;padding:2px 8px;border-radius:4px;font-weight:600;">' + buyFmt + '</span></span>' +
         '<span style="margin-right:12px;">💲 <strong>Sell:</strong> <span style="background:#555;color:#fff;padding:2px 8px;border-radius:4px;font-weight:600;">' + sellFmt + '</span></span>' +
         '<span style="margin-right:12px;">💰 <strong>Daily Net:</strong> <span style="background:' + netColor + ';color:#000;padding:2px 8px;border-radius:4px;font-weight:600;">' + netDisplay + '</span></span>' +
         '<span style="margin-right:12px;">📥 <strong>Imported:</strong> <span style="background:#555;color:#fff;padding:2px 8px;border-radius:4px;font-weight:600;">' + importDisplay + '</span></span>' +
         '<span>📤 <strong>Exported:</strong> <span style="background:#555;color:#fff;padding:2px 8px;border-radius:4px;font-weight:600;">' + exportDisplay + '</span></span>';
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

// Get display name and abbreviation for optional load (preset or custom)
function _haeo_getOptionalLoadDisplay(config) {
  if (!config) return { name: '', abbr: '', emoji: '🔌' };
  
  const emoji = config.emoji || '🔌';
  
  // If custom name exists, use it
  if (config.loadName === 'custom' && config.customName) {
    const customName = config.customName.trim();
    // Generate abbreviation from custom name (first 3-6 chars or first words)
    const abbr = customName.length > 10 
      ? customName.split(' ').map(w => w[0]).join('').substring(0, 4).toUpperCase()
      : customName.substring(0, 6);
    return { name: customName, abbr: abbr, emoji: emoji };
  }
  
  // If preset selected, use preset abbreviation map
  if (config.loadName) {
    const presetAbbrMap = {
      'Circuit':          { name: 'Circuit',          abbr: 'Circuit' },
      'Air Conditioner':  { name: 'Air Conditioner',  abbr: 'HVAC' },
      'Hot Water System': { name: 'Hot Water System', abbr: 'HWS' },
      'Clothes Dryer':    { name: 'Clothes Dryer',    abbr: 'C. Dryer' },
      'Washing Machine':  { name: 'Washing Machine',  abbr: 'W. Machine' },
      'Dishwasher':       { name: 'Dishwasher',       abbr: 'Dishw.' },
      'IT Hardware':      { name: 'IT Hardware',      abbr: 'IT H/W' },
      'Pool':             { name: 'Pool',              abbr: 'Pump' },
      'Generic Load':     { name: 'Generic Load',     abbr: 'Generic' }
    };
    
    const preset = presetAbbrMap[config.loadName];
    if (preset) {
      return { name: preset.name, abbr: preset.abbr, emoji: emoji };
    }
  }
  
  // Fallback
  return { name: '', abbr: '', emoji: emoji };
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
    '<div style="display:flex;gap:8px;align-items:center;">' +
    '<button id="settings-btn" title="Column settings" style="background:var(--card-background-color);border:1px solid var(--divider-color);cursor:pointer;color:var(--primary-text-color);font-size:11px;font-weight:600;padding:4px 10px;border-radius:12px;">⚙️ Settings</button>' +
    '<span style="color:var(--secondary-text-color);font-size:9px;font-weight:normal;">' + _HAEO_VERSION + '</span>' +
    '</div>' +
    '</div>' +
    '</div>';
}

// ── Shared column definitions ─────────────────────────────────────────────────
// Time(52) | Event(auto flex) | Buy(68) | Sell(68) | Base Load kW(44) kWh(46) | Defer. Loads kW(44) kWh(46) | Solar kW(44) kWh(46) | Grid kW(44) kWh(46) | Batt kW(44) kWh(46) SoC(46) | EV kW(44) kWh(46) SoC(46) | EV2 kW(44) kWh(46) SoC(46) | Cost(72)
// Build COLGROUP dynamically based on column settings and deferrable loads config
function _haeo_buildColgroup(colSettings = {deferLoad: false, ev: false, ev2: false}, deferLoadsConfig = [], enabledOptionalLoads = [], showKwhConfig = {}) {
  let cols = [
    '<col style="width:52px;">',                    // Time
    '<col style="width:100%;">',                    // Event - takes all remaining space in fixed layout
    '<col style="width:68px;">',                    // Buy $
    '<col style="width:68px;">',                    // Sell $
  ];

  // Total Load cols (kW + kWh) — only if deferLoad or optional loads enabled
  if (colSettings.deferLoad !== false || colSettings.ev !== false || colSettings.ev2 !== false || enabledOptionalLoads.length > 0) {
    cols.push('<col style="width:56px;">');         // Total Load kW
    cols.push('<col style="width:46px;">');         // Total Load kWh
  }

  cols.push(
    '<col style="width:56px;">',                    // Base Load kW
    '<col style="width:46px;">'                     // Base Load kWh
  );
  
  // Add Def. Loads toggle columns and optional load columns (only if deferLoad enabled)
  if (colSettings.deferLoad !== false) {
    cols.push('<col style="width:56px;">');        // Def. Loads kW
    if (showKwhConfig.deferLoad !== false) cols.push('<col style="width:46px;">');  // Def. Loads kWh
    deferLoadsConfig.forEach(config => {
      cols.push('<col style="width:56px;">');
      cols.push('<col style="width:46px;">');
    });
  }
  
  // Add enabled optional loads columns (after Def. Loads, before Solar)
  enabledOptionalLoads.forEach(load => {
    cols.push('<col style="width:56px;">');        // Optional Load kW
    if (load.showKwh !== false) cols.push('<col style="width:46px;">');  // Optional Load kWh (conditional)
  });
  
  cols.push('<col style="width:56px;">');                    // Solar kW
  cols.push('<col style="width:46px;">');                    // Solar kWh
  cols.push('<col style="width:56px;">');                    // Grid kW
  cols.push('<col style="width:46px;">');                    // Grid kWh
  cols.push('<col style="width:56px;">');                    // Batt kW
  cols.push('<col style="width:46px;">');                    // Batt kWh
  cols.push('<col style="width:46px;">');                    // Batt SoC
  
  if (colSettings.ev !== false) {
    cols.push('<col style="width:56px;">');
    if (showKwhConfig.ev !== false) cols.push('<col style="width:46px;">');
    cols.push('<col style="width:46px;">');
  }
  if (colSettings.ev2 !== false) {
    cols.push('<col style="width:56px;">');
    if (showKwhConfig.ev2 !== false) cols.push('<col style="width:46px;">');
    cols.push('<col style="width:46px;">');
  }
  
  cols.push('<col style="width:72px;">');          // Cost/Profit
  
  return '<colgroup>' + cols.join('') + '</colgroup>';
}

// Build THEAD dynamically based on column settings and deferrable loads config
function _haeo_buildThead(colSettings = {deferLoad: false, ev: false, ev2: false}, deferLoadsConfig = [], enabledOptionalLoads = [], tabType = 'future', showKwhConfig = {}) {
  let eventHeader = tabType === 'past' 
    ? '<span style="font-size:2.0em;">🔎</span> BESS Past Events' 
    : '<span style="font-size:2.0em;">🔮</span> HAEO Forecast Decisions';
  let topHeaders = [
    '<th rowspan="2" style="text-align:left;vertical-align:bottom;background-color:var(--secondary-background-color,#1a1a1a);">Time</th>',
    '<th rowspan="2" style="text-align:center;vertical-align:bottom;background-color:var(--secondary-background-color,#1a1a1a);">' + eventHeader + '</th>',
    '<th rowspan="2" style="text-align:center;vertical-align:bottom;box-shadow:inset 2px 0 0 #666;background-color:var(--secondary-background-color,#1a1a1a);">Buy<br>💲/kWh</th>',
    '<th rowspan="2" style="text-align:center;vertical-align:bottom;box-shadow:inset 1px 0 0 #555;background-color:var(--secondary-background-color,#1a1a1a);">Sell<br>💲/kWh</th>',
  ];

  // Total Load column: only show if deferLoad or any optional loads are enabled
  const _showTotalLoad = colSettings.deferLoad !== false || colSettings.ev !== false || colSettings.ev2 !== false || enabledOptionalLoads.length > 0;
  if (_showTotalLoad) {
    topHeaders.push('<th colspan="2" style="text-align:center;box-shadow:inset 2px 0 0 #666;border-bottom:1px solid #1a1a1a;background-color:var(--secondary-background-color,#1a1a1a);">🏋️ Total Load</th>');
  }

  topHeaders.push('<th colspan="2" style="text-align:center;box-shadow:inset 2px 0 0 #666;border-bottom:1px solid #1a1a1a;background-color:var(--secondary-background-color,#1a1a1a);">🏠 Base Load</th>');
  
  // Add Def. Loads header and optional load headers (only if deferLoad enabled)
  if (colSettings.deferLoad !== false) {
    const deferColspan = showKwhConfig.deferLoad !== false ? 2 : 1;
    const deferLabel = showKwhConfig.deferLoad !== false ? '⏰ Def. Loads' : '⏰';
    topHeaders.push(`<th colspan="${deferColspan}" style="text-align:center;box-shadow:inset 2px 0 0 #666;border-bottom:1px solid #1a1a1a;background-color:var(--secondary-background-color,#1a1a1a);">${deferLabel}</th>`);
    deferLoadsConfig.forEach(config => {
      const preset = _HAEO_DEFERRABLE_PRESETS.find(p => p.name === config.name);
      const displayLabel = preset ? `${preset.emoji} ${preset.abbr}` : `${config.emoji} ${config.name}`;
      topHeaders.push(`<th colspan="2" style="text-align:center;box-shadow:inset 2px 0 0 #666;border-bottom:1px solid #1a1a1a;background-color:var(--secondary-background-color,#1a1a1a);">${displayLabel}</th>`);
    });
  }
  
  // Add enabled optional loads headers (after Def. Loads, before Solar)
  enabledOptionalLoads.forEach(load => {
    const displayInfo = _haeo_getOptionalLoadDisplay(load);
    const optColspan = load.showKwh !== false ? 2 : 1;
    const optLabel = load.showKwh !== false ? displayInfo.emoji + ' ' + displayInfo.abbr : displayInfo.emoji;
    topHeaders.push(`<th colspan="${optColspan}" style="text-align:center;box-shadow:inset 2px 0 0 #666;border-bottom:1px solid #1a1a1a;background-color:var(--secondary-background-color,#1a1a1a);">${optLabel}</th>`);
  });
  
  topHeaders.push(
    '<th colspan="2" style="text-align:center;box-shadow:inset 2px 0 0 #666;border-bottom:1px solid #1a1a1a;background-color:var(--secondary-background-color,#1a1a1a);">🌞 Solar</th>',
    '<th colspan="2" style="text-align:center;box-shadow:inset 2px 0 0 #666;border-bottom:1px solid #1a1a1a;background-color:var(--secondary-background-color,#1a1a1a);">⚡ Grid</th>',
    '<th colspan="3" style="text-align:center;box-shadow:inset 2px 0 0 #666;border-bottom:1px solid #1a1a1a;background-color:var(--secondary-background-color,#1a1a1a);">🔋 Battery</th>'
  );
  
  if (colSettings.ev !== false) {
    const evColspan = showKwhConfig.ev !== false ? 3 : 2;
    const evLabel = showKwhConfig.ev !== false ? '🚗 EV' : '🚗';
    topHeaders.push(`<th colspan="${evColspan}" style="text-align:center;box-shadow:inset 2px 0 0 #666;border-bottom:1px solid #1a1a1a;background-color:var(--secondary-background-color,#1a1a1a);">${evLabel}</th>`);
  }
  if (colSettings.ev2 !== false) {
    const ev2Colspan = showKwhConfig.ev2 !== false ? 3 : 2;
    const ev2Label = showKwhConfig.ev2 !== false ? '🚙 EV2' : '🚙';
    topHeaders.push(`<th colspan="${ev2Colspan}" style="text-align:center;box-shadow:inset 2px 0 0 #666;border-bottom:1px solid #1a1a1a;background-color:var(--secondary-background-color,#1a1a1a);">${ev2Label}</th>`);
  }
  
  topHeaders.push('<th rowspan="2" style="text-align:center;vertical-align:bottom;box-shadow:inset 2px 0 0 #666;background-color:var(--secondary-background-color,#1a1a1a);">💰<br>Cost/<br>Profit</th>');
  
  let botHeaders = [];

  // Total Load sub-headers (only if deferLoad or optional loads enabled)
  if (_showTotalLoad) {
    botHeaders.push(
      '<th style="box-shadow:inset 2px 0 0 #666;text-align:center;background-color:var(--secondary-background-color,#1a1a1a);">kW</th>',
      '<th class="bgi" style="text-align:center;background-color:var(--secondary-background-color,#1a1a1a);">kWh</th>'
    );
  }

  // Base Load sub-headers
  botHeaders.push(
    '<th style="box-shadow:inset 2px 0 0 #666;text-align:center;background-color:var(--secondary-background-color,#1a1a1a);">kW</th>',
    '<th class="bgi" style="text-align:center;background-color:var(--secondary-background-color,#1a1a1a);">kWh</th>'
  );
  
  // Add Def. Loads and optional load bottom headers (only if deferLoad enabled)
  if (colSettings.deferLoad !== false) {
    botHeaders.push('<th style="box-shadow:inset 2px 0 0 #666;text-align:center;background-color:var(--secondary-background-color,#1a1a1a);">kW</th>');
    if (showKwhConfig.deferLoad !== false) botHeaders.push('<th class="bgi" style="text-align:center;background-color:var(--secondary-background-color,#1a1a1a);">kWh</th>');
    deferLoadsConfig.forEach(config => {
      botHeaders.push('<th style="box-shadow:inset 2px 0 0 #666;text-align:center;background-color:var(--secondary-background-color,#1a1a1a);">kW</th>');
      botHeaders.push('<th class="bgi" style="text-align:center;background-color:var(--secondary-background-color,#1a1a1a);">kWh</th>');
    });
  }
  
  // Add enabled optional loads bottom headers (after Def. Loads, before Solar)
  enabledOptionalLoads.forEach(load => {
    botHeaders.push('<th style="box-shadow:inset 2px 0 0 #666;text-align:center;background-color:var(--secondary-background-color,#1a1a1a);">kW</th>');
    if (load.showKwh !== false) botHeaders.push('<th class="bgi" style="text-align:center;background-color:var(--secondary-background-color,#1a1a1a);">kWh</th>');
  });
  
  botHeaders.push(
    '<th style="box-shadow:inset 2px 0 0 #666;text-align:center;background-color:var(--secondary-background-color,#1a1a1a);">kW</th>',
    '<th class="bgi" style="text-align:center;background-color:var(--secondary-background-color,#1a1a1a);">kWh</th>',
    '<th style="box-shadow:inset 2px 0 0 #666;text-align:center;background-color:var(--secondary-background-color,#1a1a1a);">kW</th>',
    '<th class="bgi" style="text-align:center;background-color:var(--secondary-background-color,#1a1a1a);">kWh</th>',
    '<th style="box-shadow:inset 2px 0 0 #666;text-align:center;background-color:var(--secondary-background-color,#1a1a1a);">kW</th>',
    '<th class="bgi" style="text-align:center;background-color:var(--secondary-background-color,#1a1a1a);">kWh</th>',
    '<th class="bgi" style="text-align:center;background-color:var(--secondary-background-color,#1a1a1a);">SoC %</th>'
  );
  
  if (colSettings.ev !== false) {
    botHeaders.push('<th style="box-shadow:inset 2px 0 0 #666;text-align:center;background-color:var(--secondary-background-color,#1a1a1a);">kW</th>');
    if (showKwhConfig.ev !== false) botHeaders.push('<th class="bgi" style="text-align:center;background-color:var(--secondary-background-color,#1a1a1a);">kWh</th>');
    botHeaders.push('<th class="bgi" style="text-align:center;background-color:var(--secondary-background-color,#1a1a1a);">SoC %</th>');
  }
  if (colSettings.ev2 !== false) {
    botHeaders.push('<th style="box-shadow:inset 2px 0 0 #666;text-align:center;background-color:var(--secondary-background-color,#1a1a1a);">kW</th>');
    if (showKwhConfig.ev2 !== false) botHeaders.push('<th class="bgi" style="text-align:center;background-color:var(--secondary-background-color,#1a1a1a);">kWh</th>');
    botHeaders.push('<th class="bgi" style="text-align:center;background-color:var(--secondary-background-color,#1a1a1a);">SoC %</th>');
  }
  
  return '<thead><tr>' + topHeaders.join('') + '</tr><tr>' + botHeaders.join('') + '</tr></thead>';
}

// ── CSS ───────────────────────────────────────────────────────────────────────
const _HAEO_STYLE = [
  ':host { display: block; width: 100%; }',
  'ha-card { width: 100%; box-sizing: border-box; }',
  '.card { padding: 8px 12px; font-family: var(--primary-font-family, sans-serif); font-size: 12px; width: 100%; box-sizing: border-box; }',
  '.tabs { display: flex; gap: 0; border-bottom: 2px solid var(--divider-color,#444); margin-bottom: 10px; align-items: stretch; }',
  '.tab { padding: 6px 18px; font-size: 13px; font-weight: 500; cursor: pointer; color: var(--secondary-text-color); border-bottom: 3px solid transparent; margin-bottom: -2px; }',
  '.tab.active { color: #2196F3; border-bottom-color: #2196F3; background: rgba(33,150,243,0.07); }',
  '.sbar { display: flex; gap: 4px; align-items: center; padding: 4px 0 8px 12px; font-size: 12px; flex-wrap: wrap; width: 100%; border-bottom: 3px solid #333; margin-bottom: 0; position: sticky; top: 0; background: var(--card-background-color); z-index: 10; }',
  '.pill { padding: 3px 10px; border-radius: 12px; font-weight: 500; font-size: 11px; color: #fff; }',
  '.stxt { color: var(--secondary-text-color); font-size: 11px; }',
  '.wrap { overflow: auto; width: 100%; }',
  '.pane { display: none; }',
  '.pane.active { display: block; }',
  '.dt-head { position: sticky; top: 0; z-index: 10; }',
  '.dt thead { position: sticky; top: 0; z-index: 10; background-color: var(--secondary-background-color, #1a1a1a); }',
  '.dt { border-collapse: collapse; width: 100%; table-layout: fixed; background: var(--card-background-color); }',
  '.dt thead { background-color: #1a1a1a; }',
  '.dt thead tr { line-height: 1; margin: 0; padding: 0; }',
  '.dt thead th { background-color: #1a1a1a; font-weight: bold; color: var(--primary-text-color); border-bottom: 1px solid #666; }',
  '.dt thead tr:last-child th { border-bottom: 2px solid #888; }',
  '.dt th, .dt td { padding: 5px 6px; font-size: 12px; line-height: 1.35; white-space: nowrap; text-align: center; box-sizing: border-box; border-bottom: none; }',
  '.dt th, .dt td { border-right: 1px solid #333; }',
  '.dt th:last-child, .dt td:last-child { border-right: none; }',
  '.dt tbody tr { border-bottom: 1px solid rgba(255,255,255,0.06); }',
  '.dt tbody tr:last-child { border-bottom: none; }',
  '.dr td { border-top: 2px solid var(--divider-color,#555) !important; border-bottom: 2px solid var(--divider-color,#555) !important; background: var(--secondary-background-color); }',
  '.dt td:nth-child(1) { text-align: left !important; }',
  '.dt th:nth-child(2), .dt td:nth-child(2) { text-align: left; }',
  '.bgl { box-shadow: inset 2px 0 0 #666; }',
  '.bgi { box-shadow: inset 1px 0 0 #555; }',
  'th.bgi { background-color: #1a1a1a; }',
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
  '.settings-modal { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }',
  '.settings-modal-content { background: var(--card-background-color); color: var(--primary-text-color); border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.3); max-height: calc(100vh - 90px); display: flex; flex-direction: column; }',
  '.settings-tab { transition: all 0.2s ease; }',
  '.settings-tab.active { color: #2196F3; border-bottom-color: #2196F3 !important; }',
  '.settings-tab-content { display: none !important; }',
  '.settings-tab-content.active { display: block !important; }',
  '.settings-modal-header { display: flex; justify-content: space-between; align-items: center; padding: 16px; border-bottom: 1px solid var(--divider-color); }',
  '.settings-modal-header h2 { margin: 0; font-size: 18px; }',
  '.settings-modal-close { background: none; border: none; font-size: 20px; cursor: pointer; color: var(--primary-text-color); }',
  '.settings-modal-body { padding: 16px; overflow-y: auto; }',
  '.defer-load-config-item { border: 1px solid var(--divider-color); border-radius: 4px; padding: 12px; background: rgba(0,0,0,0.05); }',
  '.defer-load-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px; }',
  '.defer-load-row-full { display: grid; grid-template-columns: 1fr; gap: 12px; margin-bottom: 12px; }',
  '.emoji-picker-btn { background: none; border: 1px solid var(--divider-color); border-radius: 4px; padding: 6px 12px; cursor: pointer; font-size: 18px; color: var(--primary-text-color); }',
  '.emoji-picker-modal { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: var(--card-background-color); border: 1px solid var(--divider-color); border-radius: 8px; padding: 16px; z-index: 2000; max-height: 60vh; overflow-y: auto; box-shadow: 0 4px 8px rgba(0,0,0,0.3); }',
  '.emoji-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(44px, 1fr)); gap: 8px; }',
  '.emoji-grid-item { padding: 8px; text-align: center; cursor: pointer; border-radius: 4px; font-size: 24px; }',
  '.entity-dropdown-list { position: absolute; top: 100%; left: 0; right: 0; max-height: 200px; overflow-y: auto; background: var(--card-background-color); border: 1px solid var(--divider-color); border-top: none; border-radius: 0 0 4px 4px; z-index: 100; }',
  '.entity-option { padding: 8px; border-bottom: 1px solid var(--divider-color); cursor: pointer; font-size: 12px; }',
  '.entity-option:hover { background: rgba(0,0,0,0.1); }',
].join('\n');

// ── HTML template ─────────────────────────────────────────────────────────────
function _haeo_buildHTML(colSettings = {ev: true, ev2: true}, deferLoadsConfig = [], enabledOptionalLoads = []) {
  const colgroup = _haeo_buildColgroup(colSettings, deferLoadsConfig, enabledOptionalLoads);
  const thead_future = _haeo_buildThead(colSettings, deferLoadsConfig, enabledOptionalLoads, 'future');
  const thead_past = _haeo_buildThead(colSettings, deferLoadsConfig, enabledOptionalLoads, 'past');
  
  const html = '<style>' + _HAEO_STYLE + '</style>' +
    '<ha-card><div class="card">' +
    '<div class="tabs">' +
    '<div class="tab active" id="tab-future">📅 Future Decisions</div>' +
    '<div class="tab" id="tab-past">📋 Past Events</div>' +
    '<span id="haeo-updated-badge" style="display:flex;gap:4px;align-self:center;margin-left:auto;margin-right:12px;"></span>' +
    '<span id="range-past-wrap" style="display:none;align-self:center;padding:0 4px;">' +
    '<select id="range-past" style="font-size:11px;background:var(--card-background-color);color:var(--primary-text-color);border:1px solid var(--divider-color);border-radius:4px;padding:2px 6px;cursor:pointer;">' +
    '<option value="today">Today</option><option value="yesterday">Yesterday</option><option value="24">Last 24h</option>' +
    '<option value="48">Last 48h</option><option value="72">Last 72h</option><option value="96">Last 96h</option>' +
    '<option value="168">Last 7 days</option></select></span>' +
    '</div>' +
    '<div id="grid-export-alert" style="display:flex;gap:4px;padding:8px 0 8px 12px;background:rgba(0,0,0,0.1);border-bottom:1px solid var(--divider-color);flex-wrap:wrap;align-items:center;min-height:24px;"></div>' +
    '<div class="pane active" id="pane-future">' +
    '<div class="sbar" id="sbar-future">⏳ Loading...</div>' +
    '<div class="sbar" id="finances-bar-future" style="border-bottom:2px solid #888;font-size:12px;">⏳ Loading financials...</div>' +
    '<div class="wrap">' +
    '<table class="dt" id="table-future">' + colgroup + thead_future +
    '<tbody id="tb-future"><tr><td colspan="20" class="msg">⏳ Loading...</td></tr></tbody>' +
    '</table></div></div>' +
    '<div class="pane" id="pane-past">' +
    '<div class="sbar">' +
    '<strong style="color:var(--primary-text-color);">Past Events</strong>' +
    '<span class="stxt" id="st-past">Select a range to load</span>' +
    '<span style="margin:0 auto;font-size:inherit;color:#f44336;font-weight:600;">📝 Note: Shows recorded sensor values for your inverter/battery system, not HAEO decisions.</span>' +
    '</div>' +
    '<div class="wrap">' +
    '<table class="dt" id="table-past">' + colgroup + thead_past +
    '<tbody id="tb-past"><tr><td colspan="20" class="msg">⏳ Select range to load...</td></tr></tbody>' +
    '</table></div></div>' +
    _haeo_buildLegend() +
    
    '<div id="settings-modal" class="settings-modal" style="display:none;">' +
    '<div class="settings-modal-content" style="max-width:1280px;width:90vw;max-height:85vh;display:flex;flex-direction:column;">' +
    '<div class="settings-modal-header">' +
    '<h2>HAEO Events Card Settings</h2>' +
    '<button id="settings-modal-close" class="settings-modal-close" title="Close">&times;</button>' +
    '</div>' +
    '<div style="display:flex;border-bottom:1px solid var(--divider-color);overflow-x:auto;">' +
    '<button class="settings-tab active" data-tab="base-sensors" style="flex:1;padding:14px 12px;border:none;background:transparent;color:var(--primary-text-color);cursor:pointer;font-weight:600;font-size:13px;border-bottom:4px solid transparent;">Base Sensors</button>' +
    '<button class="settings-tab" data-tab="optional-loads" style="flex:1;padding:14px 12px;border:none;background:transparent;color:var(--secondary-text-color);cursor:pointer;font-weight:600;font-size:13px;border-bottom:4px solid transparent;">Optional Loads</button>' +
    '<button class="settings-tab" data-tab="entities" style="flex:1;padding:14px 12px;border:none;background:transparent;color:var(--secondary-text-color);cursor:pointer;font-weight:600;font-size:13px;border-bottom:4px solid transparent;">Entities & Options</button>' +
    '<button class="settings-tab" data-tab="colours-self" style="flex:1;padding:14px 12px;border:none;background:transparent;color:var(--secondary-text-color);cursor:pointer;font-weight:600;font-size:13px;border-bottom:4px solid transparent;">Colours - Self Consumption</button>' +
    '<button class="settings-tab" data-tab="colours-profit" style="flex:1;padding:14px 12px;border:none;background:transparent;color:var(--secondary-text-color);cursor:pointer;font-weight:600;font-size:13px;border-bottom:4px solid transparent;">Colours - Profit</button>' +
    '<button class="settings-tab" data-tab="colours-cost" style="flex:1;padding:14px 12px;border:none;background:transparent;color:var(--secondary-text-color);cursor:pointer;font-weight:600;font-size:13px;border-bottom:4px solid transparent;">Colours - Cost</button>' +
    '<button class="settings-tab" data-tab="backup" style="flex:1;padding:14px 12px;border:none;background:transparent;color:var(--secondary-text-color);cursor:pointer;font-weight:600;font-size:13px;border-bottom:4px solid transparent;">Backup</button>' +
    '</div>' +
    '<div class="settings-modal-body" style="flex:1;overflow-y:auto;padding:16px;">' +
    '<div class="settings-tab-content active" data-content="base-sensors">' +
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">' +
    '<div style="font-size:13px;color:var(--secondary-text-color);">Configure load columns, filter thresholds, and entity sources for forecasting and historical analysis:</div>' +
    '<button id="auto-detect-energy-btn" style="background:#4CAF50;color:white;padding:8px 16px;border:none;border-radius:4px;cursor:pointer;font-weight:600;">🔍 Auto-Detect</button>' +
    '</div>' +
    '<div style="display:grid;grid-template-columns:50px 120px 90px 280px 280px 280px 90px;gap:8px;align-items:center;font-size:13px;font-weight:bold;margin-bottom:8px;padding:6px 4px;border-radius:6px;background:rgba(33,150,243,0.15);border:1px solid rgba(33,150,243,0.3);">' +
    '<div style="text-align:center;">Enable</div><div style="text-align:left;">Load Name</div>' +
    '<div style="text-align:center;">Filter (W)</div>' +
    '<div style="text-align:left;">Future Decisions Entities</div>' +
    '<div style="text-align:left;">Past Events Entities (Power)</div>' +
    '<div style="text-align:left;">Past Events Entities (Energy)</div>' +
    '<div style="text-align:center;">Invert<br>Flow</div>' +
    '</div>' +

    '<div style="display:grid;gap:8px;">' +
    '<div style="display:grid;grid-template-columns:50px 120px 90px 280px 280px 280px 90px;gap:8px;align-items:center;font-size:12px;">' +
    '<div></div>' +
    '<label>🏠 Base Load</label>' +
    '<div style="display:flex;flex-direction:column;gap:2px;align-items:center;justify-content:center;">' +
    '<input type="number" id="threshold-load" class="threshold-input" min="0" step="10" value="0" style="padding:4px;font-size:11px;width:50px;text-align:center;background:var(--card-background-color);color:var(--primary-text-color);border:1px solid var(--divider-color);border-radius:4px;">' +
    '<div style="font-size:8px;">Default - 0 W</div>' +
    '</div>' +
    '<input type="text" id="load-forecast" placeholder="sensor.base_load_power" style="padding:6px;font-size:12px;background:var(--card-background-color);color:var(--primary-text-color);border:1px solid var(--divider-color);border-radius:4px;">' +
    '<input type="text" id="load-historical" placeholder="sensor.sigen_plant_total_load_power" style="padding:6px;font-size:12px;background:var(--card-background-color);color:var(--primary-text-color);border:1px solid var(--divider-color);border-radius:4px;">' +
    '<input type="text" id="load-energy" placeholder="sensor.sigen_plant_total_load_consumption" style="padding:6px;font-size:12px;background:var(--card-background-color);color:var(--primary-text-color);border:1px solid var(--divider-color);border-radius:4px;">' +
    '<div style="display:flex;justify-content:center;align-items:center;"><input type="checkbox" id="invert-load" class="invert-toggle" style="cursor:pointer;width:18px;height:18px;accent-color:#2196F3;"></div>' +
    '</div>' +
    '<div style="border-bottom:1px solid #444;margin:8px 0 8px 0;"></div>' +
    '<div style="display:grid;grid-template-columns:50px 120px 90px 280px 280px 280px 90px;gap:8px;align-items:center;font-size:12px;">' +
    '<div></div>' +
    '<label>🌞 Solar</label>' +
    '<div style="display:flex;flex-direction:column;gap:2px;align-items:center;justify-content:center;">' +
    '<input type="number" id="threshold-pv" class="threshold-input" min="0" step="10" value="50" style="padding:4px;font-size:11px;width:50px;text-align:center;background:var(--card-background-color);color:var(--primary-text-color);border:1px solid var(--divider-color);border-radius:4px;">' +
    '<div style="font-size:8px;">Default - 50 W</div>' +
    '</div>' +
    '<input type="text" id="pv-forecast" placeholder="sensor.solar_power" style="padding:6px;font-size:12px;background:var(--card-background-color);color:var(--primary-text-color);border:1px solid var(--divider-color);border-radius:4px;">' +
    '<input type="text" id="pv-historical" placeholder="sensor.sigen_plant_pv_power" style="padding:6px;font-size:12px;background:var(--card-background-color);color:var(--primary-text-color);border:1px solid var(--divider-color);border-radius:4px;">' +
    '<input type="text" id="pv-energy" placeholder="sensor.sigen_plant_total_pv_generation" style="padding:6px;font-size:12px;background:var(--card-background-color);color:var(--primary-text-color);border:1px solid var(--divider-color);border-radius:4px;">' +
    '<div style="display:flex;justify-content:center;align-items:center;"><input type="checkbox" id="invert-pv" class="invert-toggle" style="cursor:pointer;width:18px;height:18px;accent-color:#2196F3;"></div>' +
    '</div>' +
    '<div style="border-bottom:1px solid #444;margin:8px 0 8px 0;"></div>' +
    '<div style="display:grid;grid-template-columns:50px 120px 90px 280px 280px 280px 90px;gap:8px;align-items:center;font-size:12px;">' +
    '<div></div>' +
    '<label>⚡ Grid</label>' +
    '<div style="display:flex;flex-direction:column;gap:2px;align-items:center;justify-content:center;">' +
    '<input type="number" id="threshold-grid" class="threshold-input" min="0" step="10" value="100" style="padding:4px;font-size:11px;width:50px;text-align:center;background:var(--card-background-color);color:var(--primary-text-color);border:1px solid var(--divider-color);border-radius:4px;">' +
    '<div style="font-size:8px;">Default - 100 W</div>' +
    '</div>' +
    '<input type="text" id="grid-forecast" placeholder="sensor.grid_active_power" style="padding:6px;font-size:12px;background:var(--card-background-color);color:var(--primary-text-color);border:1px solid var(--divider-color);border-radius:4px;">' +
    '<input type="text" id="grid-historical" placeholder="sensor.sigen_plant_grid_active_power" style="padding:6px;font-size:12px;background:var(--card-background-color);color:var(--primary-text-color);border:1px solid var(--divider-color);border-radius:4px;">' +
    '<div style="display:flex;flex-direction:column;gap:4px;">' +
    '<input type="text" id="grid-energy" placeholder="sensor.sigen_plant_total_imported_energy" style="padding:6px;font-size:12px;background:var(--card-background-color);color:var(--primary-text-color);border:1px solid var(--divider-color);border-radius:4px;">' +
    '<input type="text" id="grid-energy-export" placeholder="sensor.sigen_plant_total_exported_energy" style="padding:6px;font-size:12px;background:var(--card-background-color);color:var(--primary-text-color);border:1px solid var(--divider-color);border-radius:4px;">' +
    '</div>' +
    '<div style="display:flex;justify-content:center;align-items:center;"><input type="checkbox" id="invert-grid" class="invert-toggle" style="cursor:pointer;width:18px;height:18px;accent-color:#2196F3;"></div>' +
    '</div>' +
    '<div style="display:flex;flex-direction:column;gap:8px;margin-left:284px;width:280px;">' +
    '<div style="display:flex;flex-direction:column;gap:2px;">' +
    '<input type="text" id="grid-daily-import" placeholder="sensor.sigen_plant_daily_grid_import_energy" style="padding:6px;font-size:12px;background:var(--card-background-color);color:var(--primary-text-color);border:1px solid var(--divider-color);border-radius:4px;">' +
    '<div style="font-size:9px;color:#999;">Daily Grid Import (kWh)</div>' +
    '</div>' +
    '<div style="display:flex;flex-direction:column;gap:2px;">' +
    '<input type="text" id="grid-daily-export" placeholder="sensor.sigen_plant_daily_grid_export_energy" style="padding:6px;font-size:12px;background:var(--card-background-color);color:var(--primary-text-color);border:1px solid var(--divider-color);border-radius:4px;">' +
    '<div style="font-size:9px;color:#999;">Daily Grid Export (kWh)</div>' +
    '</div>' +
    '</div>' +
    '<div style="border-bottom:1px solid #444;margin:8px 0 8px 0;"></div>' +
    '<div style="display:grid;grid-template-columns:50px 120px 90px 280px 280px 280px 90px;gap:8px;align-items:center;font-size:12px;">' +
    '<div></div>' +
    '<label>🔋 Battery</label>' +
    '<div style="display:flex;flex-direction:column;gap:2px;align-items:center;justify-content:center;">' +
    '<input type="number" id="threshold-battery" class="threshold-input" min="0" step="10" value="100" style="padding:4px;font-size:11px;width:50px;text-align:center;background:var(--card-background-color);color:var(--primary-text-color);border:1px solid var(--divider-color);border-radius:4px;">' +
    '<div style="font-size:8px;">Default - 100 W</div>' +
    '</div>' +
    '<input type="text" id="battery-forecast" placeholder="sensor.battery_active_power" style="padding:6px;font-size:12px;background:var(--card-background-color);color:var(--primary-text-color);border:1px solid var(--divider-color);border-radius:4px;">' +
    '<input type="text" id="battery-historical" placeholder="sensor.sigen_plant_battery_power" style="padding:6px;font-size:12px;background:var(--card-background-color);color:var(--primary-text-color);border:1px solid var(--divider-color);border-radius:4px;">' +
    '<div style="display:flex;flex-direction:column;gap:4px;">' +
    '<input type="text" id="battery-energy" placeholder="sensor.sigen_plant_daily_battery_charge_energy" style="padding:6px;font-size:12px;background:var(--card-background-color);color:var(--primary-text-color);border:1px solid var(--divider-color);border-radius:4px;">' +
    '<input type="text" id="battery-energy-discharge" placeholder="sensor.sigen_plant_daily_battery_discharge_energy" style="padding:6px;font-size:12px;background:var(--card-background-color);color:var(--primary-text-color);border:1px solid var(--divider-color);border-radius:4px;">' +
    '</div>' +
    '<div style="display:flex;justify-content:center;align-items:center;"><input type="checkbox" id="invert-battery" class="invert-toggle" style="cursor:pointer;width:18px;height:18px;accent-color:#2196F3;"></div>' +
    '</div>' +
    '</div>' +
    '</div>' +
    '<div class="settings-tab-content" data-content="optional-loads">' +
    '<div style="font-size:13px;margin-bottom:12px;color:var(--secondary-text-color);">Fixed loads (EV, EV2, Deferrable) and up to 10 configurable optional loads:</div>' +

    // ── Fixed loads header ─────────────────────────────────────────────────────
    '<div style="display:grid;grid-template-columns:50px 60px 180px 80px 40px 251px 251px 286px;gap:8px;align-items:center;font-size:12px;font-weight:bold;margin-bottom:8px;padding:6px 4px;border-radius:6px;background:rgba(33,150,243,0.15);border:1px solid rgba(33,150,243,0.3);">' +
    '<div style="text-align:center;">Enable</div><div style="text-align:center;">Symbol</div><div style="text-align:left;">Load Name</div><div style="text-align:center;">Filter (W)</div><div style="text-align:center;font-size:11px;">Show<br>kWh</div><div style="text-align:left;">Future Decisions Entities</div><div style="text-align:left;">Past Events Entities (Power)</div><div style="text-align:left;">Past Events Entities (Energy)</div>' +
    '</div>' +

    // ── Deferrable Loads fixed row ─────────────────────────────────────────────
    '<div style="display:grid;grid-template-columns:50px 60px 180px 80px 40px 251px 251px 286px;gap:8px;align-items:center;font-size:12px;margin-bottom:4px;">' +
    '<div style="display:flex;justify-content:center;"><input type="checkbox" id="col-deferLoad" class="col-toggle" style="cursor:pointer;width:16px;height:16px;"></div>' +
    '<div style="text-align:center;font-size:16px;">⏰</div>' +
    '<label style="font-weight:500;">Deferrable Loads</label>' +
    '<div style="display:flex;flex-direction:column;gap:2px;align-items:center;">' +
    '<input type="number" id="threshold-deferLoad" class="threshold-input" min="0" step="10" value="5" style="padding:4px;font-size:11px;width:50px;text-align:center;background:var(--card-background-color);color:var(--primary-text-color);border:1px solid var(--divider-color);border-radius:4px;">' +
    '<div style="font-size:8px;">Default - 5 W</div>' +
    '</div>' +
    '<div style="display:flex;justify-content:center;align-items:center;" title="Show kWh column"><input type="checkbox" id="show-kwh-deferLoad" checked style="cursor:pointer;width:18px;height:18px;accent-color:#4CAF50;"></div>' +
    '<input type="text" id="deferLoad-forecast" placeholder="sensor.deferrable_loads_power_forecast" style="padding:6px;font-size:12px;background:var(--card-background-color);color:var(--primary-text-color);border:1px solid var(--divider-color);border-radius:4px;">' +
    '<input type="text" id="deferLoad-historical" placeholder="sensor.deferrable_loads_power" style="padding:6px;font-size:12px;background:var(--card-background-color);color:var(--primary-text-color);border:1px solid var(--divider-color);border-radius:4px;">' +
    '<input type="text" id="deferLoad-energy" placeholder="sensor.deferrable_loads_energy" style="padding:6px;font-size:12px;background:var(--card-background-color);color:var(--primary-text-color);border:1px solid var(--divider-color);border-radius:4px;">' +
    '</div>' +

    // ── EV fixed row ───────────────────────────────────────────────────────────
    '<div style="display:grid;grid-template-columns:50px 60px 180px 80px 40px 251px 251px 286px;gap:8px;align-items:start;font-size:12px;margin-bottom:4px;">' +
    '<div style="display:flex;justify-content:center;padding-top:6px;"><input type="checkbox" id="col-ev" class="col-toggle" style="cursor:pointer;width:16px;height:16px;"></div>' +
    '<div style="text-align:center;font-size:16px;padding-top:4px;">🚗</div>' +
    '<label style="font-weight:500;padding-top:6px;">EV</label>' +
    '<div style="display:flex;flex-direction:column;gap:2px;align-items:center;">' +
    '<input type="number" id="threshold-ev" class="threshold-input" min="0" step="10" value="100" style="padding:4px;font-size:11px;width:50px;text-align:center;background:var(--card-background-color);color:var(--primary-text-color);border:1px solid var(--divider-color);border-radius:4px;">' +
    '<div style="font-size:8px;">Default - 100 W</div>' +
    '</div>' +
    '<div style="display:flex;justify-content:center;align-items:flex-start;padding-top:6px;" title="Show kWh column"><input type="checkbox" id="show-kwh-ev" checked style="cursor:pointer;width:18px;height:18px;accent-color:#4CAF50;"></div>' +
    '<input type="text" id="ev-forecast" placeholder="sensor.ev_active_power" style="padding:6px;font-size:12px;background:var(--card-background-color);color:var(--primary-text-color);border:1px solid var(--divider-color);border-radius:4px;">' +
    '<input type="text" id="ev-historical" placeholder="sensor.sigen_ac_charger_charging_power" style="padding:6px;font-size:12px;background:var(--card-background-color);color:var(--primary-text-color);border:1px solid var(--divider-color);border-radius:4px;">' +
    '<div style="display:flex;flex-direction:column;gap:4px;">' +
    '<input type="text" id="ev-energy" placeholder="sensor.sigen_plant_total_charged_energy_of_the_evac" style="padding:6px;font-size:12px;background:var(--card-background-color);color:var(--primary-text-color);border:1px solid var(--divider-color);border-radius:4px;">' +
    '<input type="text" id="ev-energy-discharge" placeholder="sensor.ev_discharge_energy" style="padding:6px;font-size:12px;background:var(--card-background-color);color:var(--primary-text-color);border:1px solid var(--divider-color);border-radius:4px;">' +
    '</div>' +
    '</div>' +

    // ── EV2 fixed row ──────────────────────────────────────────────────────────
    '<div style="display:grid;grid-template-columns:50px 60px 180px 80px 40px 251px 251px 286px;gap:8px;align-items:start;font-size:12px;margin-bottom:4px;">' +
    '<div style="display:flex;justify-content:center;padding-top:6px;"><input type="checkbox" id="col-ev2" class="col-toggle" style="cursor:pointer;width:16px;height:16px;"></div>' +
    '<div style="text-align:center;font-size:16px;padding-top:4px;">🚙</div>' +
    '<label style="font-weight:500;padding-top:6px;">EV2</label>' +
    '<div style="display:flex;flex-direction:column;gap:2px;align-items:center;">' +
    '<input type="number" id="threshold-ev2" class="threshold-input" min="0" step="10" value="100" style="padding:4px;font-size:11px;width:50px;text-align:center;background:var(--card-background-color);color:var(--primary-text-color);border:1px solid var(--divider-color);border-radius:4px;">' +
    '<div style="font-size:8px;">Default - 100 W</div>' +
    '</div>' +
    '<div style="display:flex;justify-content:center;align-items:flex-start;padding-top:6px;" title="Show kWh column"><input type="checkbox" id="show-kwh-ev2" checked style="cursor:pointer;width:18px;height:18px;accent-color:#4CAF50;"></div>' +
    '<input type="text" id="ev2-forecast" placeholder="sensor.ev2_active_power" style="padding:6px;font-size:12px;background:var(--card-background-color);color:var(--primary-text-color);border:1px solid var(--divider-color);border-radius:4px;">' +
    '<input type="text" id="ev2-historical" placeholder="sensor.sigen_dc_charger_output_power" style="padding:6px;font-size:12px;background:var(--card-background-color);color:var(--primary-text-color);border:1px solid var(--divider-color);border-radius:4px;">' +
    '<div style="display:flex;flex-direction:column;gap:4px;">' +
    '<input type="text" id="ev2-energy" placeholder="sensor.sigen_plant_total_charged_energy_of_the_evdc" style="padding:6px;font-size:12px;background:var(--card-background-color);color:var(--primary-text-color);border:1px solid var(--divider-color);border-radius:4px;">' +
    '<input type="text" id="ev2-energy-discharge" placeholder="sensor.sigen_plant_total_discharged_energy_of_the_evdc" style="padding:6px;font-size:12px;background:var(--card-background-color);color:var(--primary-text-color);border:1px solid var(--divider-color);border-radius:4px;">' +
    '</div>' +
    '</div>' +

    

    // ── Optional loads column header ───────────────────────────────────────────
    '<div style="display:grid;grid-template-columns:50px 60px 180px 80px 40px 251px 251px 286px;gap:8px;align-items:center;font-size:12px;font-weight:bold;margin-bottom:16px;padding:6px 4px;border-radius:6px;background:rgba(33,150,243,0.15);border:1px solid rgba(33,150,243,0.3);">' +
    '<div style="text-align:center;">Enable</div><div style="text-align:center;">Symbol</div><div style="text-align:left;">Load Name</div><div style="text-align:center;">Filter (W)</div><div style="text-align:center;font-size:11px;">Show<br>kWh</div><div style="text-align:left;">Future Decisions Entities</div><div style="text-align:left;">Past Events Entities (Power)</div><div style="text-align:left;">Past Events Entities (Energy)</div>' +
    '</div>' +
    '<div style="display:grid;gap:8px;">' +
    (() => {
      let html = '';
      for (let i = 0; i < 10; i++) {
        html += '<div style="display:grid;grid-template-columns:50px 60px 180px 80px 40px 251px 251px 286px;gap:8px;align-items:center;font-size:12px;">' +
          '<input type="checkbox" id="optload-enable-' + i + '" class="optload-enable" style="cursor:pointer;width:18px;height:18px;">' +
          '<select id="optload-emoji-' + i + '" style="padding:4px;font-size:16px;text-align:center;background:var(--card-background-color);color:var(--primary-text-color);border:1px solid var(--divider-color);border-radius:4px;width:100%;">' +
          '<option value="🔌">🔌</option>' +
          '<option value="🌡️">🌡️</option>' +
                '<option value="🚿">🚿</option>' +
          '<option value="👚">👚</option>' +
          '<option value="🧺">🧺</option>' +
          '<option value="🍽️">🍽️</option>' +
          '<option value="💻">💻</option>' +
          '<option value="🏊">🏊</option>' +
          '<option value="⚡">⚡</option>' +
          '<option value="🔥">🔥</option>' +
          '<option value="💧">💧</option>' +
          '<option value="🌬️">🌬️</option>' +
          '<option value="📱">📱</option>' +
          '<option value="☀️">☀️</option>' +
          '<option value="🌙">🌙</option>' +
          '<option value="⏰">⏰</option>' +
          '<option value="💡">💡</option>' +
          '<option value="🚗">🚗</option>' +
          '<option value="🚙">🚙</option>' +
          '<option value="🏠">🏠</option>' +
          '</select>' +
          '<div style="display:flex;flex-direction:column;gap:4px;">' +
          '<select id="optload-preset-' + i + '" style="padding:6px;font-size:12px;background:var(--card-background-color);color:var(--primary-text-color);border:1px solid var(--divider-color);border-radius:4px;cursor:pointer;">' +
          '<option value="">-- None --</option>' +
          '<option value="Circuit">⚡ Circuit</option>' +
          '<option value="Air Conditioner">🌡️ Air Conditioner (HVAC)</option>' +
          '<option value="Hot Water System">🚿 Hot Water System (HWS)</option>' +
          '<option value="Clothes Dryer">👚 Clothes Dryer</option>' +
          '<option value="Washing Machine">🧺 Washing Machine</option>' +
          '<option value="Dishwasher">🍽️ Dishwasher</option>' +
          '<option value="IT Hardware">💻 IT Hardware</option>' +
          '<option value="Pool">🏊 Pool Pump</option>' +
          '<option value="Generic Load">🔌 Generic Load</option>' +
          '<option value="custom">✏️ Custom Name</option>' +
          '</select>' +
          '<input type="text" id="optload-customname-' + i + '" placeholder="Enter custom name..." style="padding:6px;font-size:12px;background:var(--card-background-color);color:var(--primary-text-color);border:1px solid var(--divider-color);border-radius:4px;display:none;">' +
          '</div>' +
          '<div style="display:flex;flex-direction:column;gap:2px;align-items:center;justify-content:center;">' +
          '<input type="number" id="optload-threshold-' + i + '" class="optload-threshold-input" min="0" step="10" value="10" style="padding:4px;font-size:11px;width:60px;text-align:center;background:var(--card-background-color);color:var(--primary-text-color);border:1px solid var(--divider-color);border-radius:4px;">' +
          '<div style="font-size:8px;">Default - 10 W</div>' +
          '</div>' +
          '<div style="display:flex;justify-content:center;align-items:center;" title="Show kWh column"><input type="checkbox" id="optload-show-kwh-' + i + '" checked style="cursor:pointer;width:18px;height:18px;accent-color:#4CAF50;"></div>' +
          '<input type="text" id="optload-forecast-' + i + '" placeholder="sensor.xxxx_power" style="padding:6px;font-size:12px;background:var(--card-background-color);color:var(--primary-text-color);border:1px solid var(--divider-color);border-radius:4px;">' +
          '<input type="text" id="optload-historical-' + i + '" placeholder="sensor.xxxx_active_power" style="padding:6px;font-size:12px;background:var(--card-background-color);color:var(--primary-text-color);border:1px solid var(--divider-color);border-radius:4px;">' +
          '<input type="text" id="optload-energy-' + i + '" placeholder="sensor.xxxx_energy" style="padding:6px;font-size:12px;background:var(--card-background-color);color:var(--primary-text-color);border:1px solid var(--divider-color);border-radius:4px;">' +
          '</div>';
      }
      return html;
    })() +
    '</div>' +
    '</div>' +

    '<div class="settings-tab-content" data-content="entities">' +
    '<div style="padding:16px;display:flex;flex-direction:column;gap:16px;max-width:600px;">' +
    '<div style="font-size:13px;margin-bottom:12px;color:var(--secondary-text-color);">Configure miscellaneous entities:</div>' +
    '<div style="display:flex;flex-direction:column;gap:8px;">' +
    '<div style="display:flex;align-items:center;gap:8px;">' +
    '<label style="font-weight:bold;min-width:120px;font-size:12px;">🌧️ Weather Entity:</label>' +
    '<input type="text" id="weather-entity-input" placeholder="weather.forecast_home" style="flex:1;padding:8px;font-size:12px;background:var(--card-background-color);color:var(--primary-text-color);border:1px solid var(--divider-color);border-radius:4px;">' +
    '<span style="font-size:11px;color:var(--secondary-text-color);min-width:150px;text-align:right;">Default: weather.forecast_home</span>' +
    '</div>' +
    '<div style="display:flex;align-items:center;gap:8px;">' +
    '<label style="font-weight:bold;min-width:120px;font-size:12px;">⚠️ Curtailment Switch:</label>' +
    '<input type="text" id="curtailment-entity-input" placeholder="switch.solar_curtailment" style="flex:1;padding:8px;font-size:12px;background:var(--card-background-color);color:var(--primary-text-color);border:1px solid var(--divider-color);border-radius:4px;">' +
    '<span style="font-size:11px;color:var(--secondary-text-color);min-width:150px;text-align:right;">Default: switch.solar_curtailment</span>' +
    '</div>' +
    '</div>' +
    '<div style="border-top:1px solid var(--divider-color);padding-top:16px;margin-top:16px;display:flex;flex-direction:column;gap:8px;">' +
    '<div style="font-size:13px;font-weight:bold;color:#FFC107;margin-bottom:8px;">🔢 Decimal Places / Rounding</div>' +
    '<div style="display:flex;align-items:center;gap:8px;">' +
    '<label style="font-weight:bold;min-width:180px;font-size:12px;">Buy/Sell Price Decimals:</label>' +
    '<select id="settings-price-decimals" style="padding:8px;font-size:12px;background:var(--card-background-color);color:var(--primary-text-color);border:1px solid var(--divider-color);border-radius:4px;cursor:pointer;width:220px;">' +
    '<option value="2">2 decimal places</option>' +
    '<option value="3">3 decimal places</option>' +
    '<option value="4" selected>4 decimal places</option>' +
    '<option value="5">5 decimal places</option>' +
    '</select>' +
    '</div>' +
    '<div style="display:flex;align-items:center;gap:8px;">' +
    '<label style="font-weight:bold;min-width:180px;font-size:12px;">kW Column Decimals:</label>' +
    '<select id="settings-kw-decimals" style="padding:8px;font-size:12px;background:var(--card-background-color);color:var(--primary-text-color);border:1px solid var(--divider-color);border-radius:4px;cursor:pointer;width:220px;">' +
    '<option value="1">1 decimal place</option>' +
    '<option value="2">2 decimal places</option>' +
    '<option value="3" selected>3 decimal places</option>' +
    '<option value="4">4 decimal places</option>' +
    '</select>' +
    '</div>' +
    '<div style="display:flex;align-items:center;gap:8px;">' +
    '<label style="font-weight:bold;min-width:180px;font-size:12px;">kWh Column Decimals:</label>' +
    '<select id="settings-kwh-decimals" style="padding:8px;font-size:12px;background:var(--card-background-color);color:var(--primary-text-color);border:1px solid var(--divider-color);border-radius:4px;cursor:pointer;width:220px;">' +
    '<option value="1">1 decimal place</option>' +
    '<option value="2">2 decimal places</option>' +
    '<option value="3" selected>3 decimal places</option>' +
    '<option value="4">4 decimal places</option>' +
    '</select>' +
    '</div>' +
    '<span style="font-size:11px;color:var(--secondary-text-color);">kW/kWh range: 1–4 decimal places. Price range: 2–5 decimal places.</span>' +
    '</div>' +
    '</div>' +
    '</div>' +

    '<div class="settings-tab-content" data-content="colours-self">' +
    '<div style="font-size:13px;margin-bottom:12px;color:var(--secondary-text-color);">Self Consumption - Solar/Battery scenarios (no grid):</div>' +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;max-height:500px;overflow-y:auto;padding:12px;border:1px solid var(--divider-color);border-radius:4px;">' +
    '<div style="display:grid;gap:0;align-content:start;">' +
    '<div style="display:grid;grid-template-columns:380px 40px 40px 40px;gap:6px;align-items:center;font-size:10px;font-weight:bold;margin-bottom:12px;padding:6px 4px;border-radius:6px;background:rgba(33,150,243,0.15);border:1px solid rgba(33,150,243,0.3);position:sticky;top:0;white-space:nowrap;">' +
    '<div>Event</div><div style="text-align:center;">BKG</div><div style="text-align:center;">Event</div><div style="text-align:center;">Text</div>' +
    '</div>' +
    '<div style="display:grid;grid-template-columns:380px 40px 40px 40px;gap:6px;align-items:center;font-size:12px;padding:6px 0;"><div>' + (_HAEO_EVENT_LABELS.battery_ev_charge || 'SomeText') + '</div><div style="text-align:center;"><input type="color" id="color-battery_ev_charge-bg" class="color-picker" style="width:35px;height:25px;cursor:pointer;"></div><div style="text-align:center;"><input type="color" id="color-battery_ev_charge-txt" class="color-picker" style="width:35px;height:25px;cursor:pointer;"></div><div style="text-align:center;"><input type="color" id="color-battery_ev_charge-txt" class="color-picker" style="width:35px;height:25px;cursor:pointer;"></div></div>' +
    '<div style="display:grid;grid-template-columns:380px 40px 40px 40px;gap:6px;align-items:center;font-size:12px;padding:6px 0;"><div>' + (_HAEO_EVENT_LABELS.battery_ev_to_baseload || 'SomeText') + '</div><div style="text-align:center;"><input type="color" id="color-battery_ev_to_baseload-bg" class="color-picker" style="width:35px;height:25px;cursor:pointer;"></div><div style="text-align:center;"><input type="color" id="color-battery_ev_to_baseload-txt" class="color-picker" style="width:35px;height:25px;cursor:pointer;"></div><div style="text-align:center;"><input type="color" id="color-battery_ev_to_baseload-txt" class="color-picker" style="width:35px;height:25px;cursor:pointer;"></div></div>' +
    '<div style="display:grid;grid-template-columns:380px 40px 40px 40px;gap:6px;align-items:center;font-size:12px;padding:6px 0;"><div>' + (_HAEO_EVENT_LABELS.battery_ev_to_loads || 'SomeText') + '</div><div style="text-align:center;"><input type="color" id="color-battery_ev_to_loads-bg" class="color-picker" style="width:35px;height:25px;cursor:pointer;"></div><div style="text-align:center;"><input type="color" id="color-battery_ev_to_loads-txt" class="color-picker" style="width:35px;height:25px;cursor:pointer;"></div><div style="text-align:center;"><input type="color" id="color-battery_ev_to_loads-txt" class="color-picker" style="width:35px;height:25px;cursor:pointer;"></div></div>' +
    '<div style="display:grid;grid-template-columns:380px 40px 40px 40px;gap:6px;align-items:center;font-size:12px;padding:6px 0;"><div>' + (_HAEO_EVENT_LABELS.battery_to_loads_only || 'SomeText') + '</div><div style="text-align:center;"><input type="color" id="color-battery_to_loads_only-bg" class="color-picker" style="width:35px;height:25px;cursor:pointer;"></div><div style="text-align:center;"><input type="color" id="color-battery_to_loads_only-txt" class="color-picker" style="width:35px;height:25px;cursor:pointer;"></div><div style="text-align:center;"><input type="color" id="color-battery_to_loads_only-txt" class="color-picker" style="width:35px;height:25px;cursor:pointer;"></div></div>' +
    '<div style="display:grid;grid-template-columns:380px 40px 40px 40px;gap:6px;align-items:center;font-size:12px;padding:6px 0;"><div>' + (_HAEO_EVENT_LABELS.battery_to_loads_inferred || 'SomeText') + '</div><div style="text-align:center;"><input type="color" id="color-battery_to_loads_inferred-bg" class="color-picker" style="width:35px;height:25px;cursor:pointer;"></div><div style="text-align:center;"><input type="color" id="color-battery_to_loads_inferred-txt" class="color-picker" style="width:35px;height:25px;cursor:pointer;"></div><div style="text-align:center;"><input type="color" id="color-battery_to_loads_inferred-txt" class="color-picker" style="width:35px;height:25px;cursor:pointer;"></div></div>' +
    '<div style="display:grid;grid-template-columns:380px 40px 40px 40px;gap:6px;align-items:center;font-size:12px;padding:6px 0;"><div>' + (_HAEO_EVENT_LABELS.pv_battery_ev_to_loads || 'SomeText') + '</div><div style="text-align:center;"><input type="color" id="color-pv_battery_ev_to_loads-bg" class="color-picker" style="width:35px;height:25px;cursor:pointer;"></div><div style="text-align:center;"><input type="color" id="color-pv_battery_ev_to_loads-txt" class="color-picker" style="width:35px;height:25px;cursor:pointer;"></div><div style="text-align:center;"><input type="color" id="color-pv_battery_ev_to_loads-txt" class="color-picker" style="width:35px;height:25px;cursor:pointer;"></div></div>' +
    '<div style="display:grid;grid-template-columns:380px 40px 40px 40px;gap:6px;align-items:center;font-size:12px;padding:6px 0;"><div>' + (_HAEO_EVENT_LABELS.pv_battery_to_loads_no_grid || 'SomeText') + '</div><div style="text-align:center;"><input type="color" id="color-pv_battery_to_loads_no_grid-bg" class="color-picker" style="width:35px;height:25px;cursor:pointer;"></div><div style="text-align:center;"><input type="color" id="color-pv_battery_to_loads_no_grid-txt" class="color-picker" style="width:35px;height:25px;cursor:pointer;"></div><div style="text-align:center;"><input type="color" id="color-pv_battery_to_loads_no_grid-txt" class="color-picker" style="width:35px;height:25px;cursor:pointer;"></div></div>' +
    '</div>' +
    '<div style="display:grid;gap:0;align-content:start;">' +
    '<div style="display:grid;grid-template-columns:380px 40px 40px 40px;gap:6px;align-items:center;font-size:10px;font-weight:bold;margin-bottom:12px;padding:6px 4px;border-radius:6px;background:rgba(33,150,243,0.15);border:1px solid rgba(33,150,243,0.3);position:sticky;top:0;white-space:nowrap;">' +
    '<div>Event</div><div style="text-align:center;">BKG</div><div style="text-align:center;">Event</div><div style="text-align:center;">Text</div>' +
    '</div>' +
    '<div style="display:grid;grid-template-columns:380px 40px 40px 40px;gap:6px;align-items:center;font-size:12px;padding:6px 0;"><div>' + (_HAEO_EVENT_LABELS.pv_ev_to_loads || 'SomeText') + '</div><div style="text-align:center;"><input type="color" id="color-pv_ev_to_loads-bg" class="color-picker" style="width:35px;height:25px;cursor:pointer;"></div><div style="text-align:center;"><input type="color" id="color-pv_ev_to_loads-txt" class="color-picker" style="width:35px;height:25px;cursor:pointer;"></div><div style="text-align:center;"><input type="color" id="color-pv_ev_to_loads-txt" class="color-picker" style="width:35px;height:25px;cursor:pointer;"></div></div>' +
    '<div style="display:grid;grid-template-columns:380px 40px 40px 40px;gap:6px;align-items:center;font-size:12px;padding:6px 0;"><div>' + (_HAEO_EVENT_LABELS.pv_to_baseload_battery || 'SomeText') + '</div><div style="text-align:center;"><input type="color" id="color-pv_to_baseload_battery-bg" class="color-picker" style="width:35px;height:25px;cursor:pointer;"></div><div style="text-align:center;"><input type="color" id="color-pv_to_baseload_battery-txt" class="color-picker" style="width:35px;height:25px;cursor:pointer;"></div><div style="text-align:center;"><input type="color" id="color-pv_to_baseload_battery-txt" class="color-picker" style="width:35px;height:25px;cursor:pointer;"></div></div>' +
    '<div style="display:grid;grid-template-columns:380px 40px 40px 40px;gap:6px;align-items:center;font-size:12px;padding:6px 0;"><div>' + (_HAEO_EVENT_LABELS.pv_to_baseload_ev || 'SomeText') + '</div><div style="text-align:center;"><input type="color" id="color-pv_to_baseload_ev-bg" class="color-picker" style="width:35px;height:25px;cursor:pointer;"></div><div style="text-align:center;"><input type="color" id="color-pv_to_baseload_ev-txt" class="color-picker" style="width:35px;height:25px;cursor:pointer;"></div><div style="text-align:center;"><input type="color" id="color-pv_to_baseload_ev-txt" class="color-picker" style="width:35px;height:25px;cursor:pointer;"></div></div>' +
    '<div style="display:grid;grid-template-columns:380px 40px 40px 40px;gap:6px;align-items:center;font-size:12px;padding:6px 0;"><div>' + (_HAEO_EVENT_LABELS.pv_to_loads_battery || 'SomeText') + '</div><div style="text-align:center;"><input type="color" id="color-pv_to_loads_battery-bg" class="color-picker" style="width:35px;height:25px;cursor:pointer;"></div><div style="text-align:center;"><input type="color" id="color-pv_to_loads_battery-txt" class="color-picker" style="width:35px;height:25px;cursor:pointer;"></div><div style="text-align:center;"><input type="color" id="color-pv_to_loads_battery-txt" class="color-picker" style="width:35px;height:25px;cursor:pointer;"></div></div>' +
    '<div style="display:grid;grid-template-columns:380px 40px 40px 40px;gap:6px;align-items:center;font-size:12px;padding:6px 0;"><div>' + (_HAEO_EVENT_LABELS.pv_to_loads_grid || 'SomeText') + '</div><div style="text-align:center;"><input type="color" id="color-pv_to_loads_grid-bg" class="color-picker" style="width:35px;height:25px;cursor:pointer;"></div><div style="text-align:center;"><input type="color" id="color-pv_to_loads_grid-txt" class="color-picker" style="width:35px;height:25px;cursor:pointer;"></div><div style="text-align:center;"><input type="color" id="color-pv_to_loads_grid-txt" class="color-picker" style="width:35px;height:25px;cursor:pointer;"></div></div>' +
    '<div style="display:grid;grid-template-columns:380px 40px 40px 40px;gap:6px;align-items:center;font-size:12px;padding:6px 0;"><div>' + (_HAEO_EVENT_LABELS.pv_to_loads_only || 'SomeText') + '</div><div style="text-align:center;"><input type="color" id="color-pv_to_loads_only-bg" class="color-picker" style="width:35px;height:25px;cursor:pointer;"></div><div style="text-align:center;"><input type="color" id="color-pv_to_loads_only-txt" class="color-picker" style="width:35px;height:25px;cursor:pointer;"></div><div style="text-align:center;"><input type="color" id="color-pv_to_loads_only-txt" class="color-picker" style="width:35px;height:25px;cursor:pointer;"></div></div>' +
    '</div>' +
    '</div>' +
    '</div>' +
    '<div class="settings-tab-content" data-content="colours-profit">' +
    '<div style="font-size:13px;margin-bottom:12px;color:var(--secondary-text-color);">Profit - Exporting to Grid:</div>' +
    '<div style="display:grid;gap:0;max-height:500px;overflow-y:auto;padding:12px;border:1px solid var(--divider-color);border-radius:4px;">' +
    '<div style="display:grid;grid-template-columns:380px 40px 40px 40px;gap:6px;align-items:center;font-size:10px;font-weight:bold;margin-bottom:12px;padding:6px 4px;border-radius:6px;background:rgba(33,150,243,0.15);border:1px solid rgba(33,150,243,0.3);position:sticky;top:0;white-space:nowrap;">' +
    '<div>Event</div><div style="text-align:center;">BKG</div><div style="text-align:center;">Event</div><div style="text-align:center;">Text</div>' +
    '</div>' +
    '<div style="display:grid;grid-template-columns:380px 40px 40px 40px;gap:6px;align-items:center;font-size:12px;padding:6px 0;"><div>' + (_HAEO_EVENT_LABELS.battery_ev_to_grid_force || 'SomeText') + '</div><div style="text-align:center;"><input type="color" id="color-battery_ev_to_grid_force-bg" class="color-picker" style="width:35px;height:25px;cursor:pointer;"></div><div style="text-align:center;"><input type="color" id="color-battery_ev_to_grid_force-txt" class="color-picker" style="width:35px;height:25px;cursor:pointer;"></div><div style="text-align:center;"><input type="color" id="color-battery_ev_to_grid_force-txt" class="color-picker" style="width:35px;height:25px;cursor:pointer;"></div></div>' +
    '<div style="display:grid;grid-template-columns:380px 40px 40px 40px;gap:6px;align-items:center;font-size:12px;padding:6px 0;"><div>' + (_HAEO_EVENT_LABELS.battery_to_grid_force || 'SomeText') + '</div><div style="text-align:center;"><input type="color" id="color-battery_to_grid_force-bg" class="color-picker" style="width:35px;height:25px;cursor:pointer;"></div><div style="text-align:center;"><input type="color" id="color-battery_to_grid_force-txt" class="color-picker" style="width:35px;height:25px;cursor:pointer;"></div><div style="text-align:center;"><input type="color" id="color-battery_to_grid_force-txt" class="color-picker" style="width:35px;height:25px;cursor:pointer;"></div></div>' +
    '<div style="display:grid;grid-template-columns:380px 40px 40px 40px;gap:6px;align-items:center;font-size:12px;padding:6px 0;"><div>' + (_HAEO_EVENT_LABELS.pv_battery_ev_to_grid_export || 'SomeText') + '</div><div style="text-align:center;"><input type="color" id="color-pv_battery_ev_to_grid_export-bg" class="color-picker" style="width:35px;height:25px;cursor:pointer;"></div><div style="text-align:center;"><input type="color" id="color-pv_battery_ev_to_grid_export-txt" class="color-picker" style="width:35px;height:25px;cursor:pointer;"></div><div style="text-align:center;"><input type="color" id="color-pv_battery_ev_to_grid_export-txt" class="color-picker" style="width:35px;height:25px;cursor:pointer;"></div></div>' +
    '</div>' +
    '</div>' +
    '<div class="settings-tab-content" data-content="colours-cost">' +
    '<div style="font-size:13px;margin-bottom:12px;color:var(--secondary-text-color);">Cost - Importing from Grid or Mixed:</div>' +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;max-height:500px;overflow-y:auto;padding:12px;border:1px solid var(--divider-color);border-radius:4px;">' +
    '<div style="display:grid;gap:0;align-content:start;">' +
    '<div style="display:grid;grid-template-columns:380px 40px 40px 40px;gap:6px;align-items:center;font-size:10px;font-weight:bold;margin-bottom:12px;padding:6px 4px;border-radius:6px;background:rgba(33,150,243,0.15);border:1px solid rgba(33,150,243,0.3);position:sticky;top:0;white-space:nowrap;">' +
    '<div>Event</div><div style="text-align:center;">BKG</div><div style="text-align:center;">Event</div><div style="text-align:center;">Text</div>' +
    '</div>' +
    '<div style="display:grid;grid-template-columns:380px 40px 40px 40px;gap:6px;align-items:center;font-size:12px;padding:6px 0;"><div>' + (_HAEO_EVENT_LABELS.battery_grid_to_loads || 'SomeText') + '</div><div style="text-align:center;"><input type="color" id="color-battery_grid_to_loads-bg" class="color-picker" style="width:35px;height:25px;cursor:pointer;"></div><div style="text-align:center;"><input type="color" id="color-battery_grid_to_loads-cost" class="color-picker" style="width:35px;height:25px;cursor:pointer;"></div><div style="text-align:center;"><input type="color" id="color-battery_grid_to_loads-cost" class="color-picker" style="width:35px;height:25px;cursor:pointer;"></div></div>' +
    '<div style="display:grid;grid-template-columns:380px 40px 40px 40px;gap:6px;align-items:center;font-size:12px;padding:6px 0;"><div>' + (_HAEO_EVENT_LABELS.battery_to_baseload_grid_force || 'SomeText') + '</div><div style="text-align:center;"><input type="color" id="color-battery_to_baseload_grid_force-bg" class="color-picker" style="width:35px;height:25px;cursor:pointer;"></div><div style="text-align:center;"><input type="color" id="color-battery_to_baseload_grid_force-cost" class="color-picker" style="width:35px;height:25px;cursor:pointer;"></div><div style="text-align:center;"><input type="color" id="color-battery_to_baseload_grid_force-cost" class="color-picker" style="width:35px;height:25px;cursor:pointer;"></div></div>' +
    '<div style="display:grid;grid-template-columns:380px 40px 40px 40px;gap:6px;align-items:center;font-size:12px;padding:6px 0;"><div>' + (_HAEO_EVENT_LABELS.battery_to_loads_grid_force || 'SomeText') + '</div><div style="text-align:center;"><input type="color" id="color-battery_to_loads_grid_force-bg" class="color-picker" style="width:35px;height:25px;cursor:pointer;"></div><div style="text-align:center;"><input type="color" id="color-battery_to_loads_grid_force-cost" class="color-picker" style="width:35px;height:25px;cursor:pointer;"></div><div style="text-align:center;"><input type="color" id="color-battery_to_loads_grid_force-cost" class="color-picker" style="width:35px;height:25px;cursor:pointer;"></div></div>' +
    '<div style="display:grid;grid-template-columns:380px 40px 40px 40px;gap:6px;align-items:center;font-size:12px;padding:6px 0;"><div>' + (_HAEO_EVENT_LABELS.grid_to_baseload_battery_force || 'SomeText') + '</div><div style="text-align:center;"><input type="color" id="color-grid_to_baseload_battery_force-bg" class="color-picker" style="width:35px;height:25px;cursor:pointer;"></div><div style="text-align:center;"><input type="color" id="color-grid_to_baseload_battery_force-cost" class="color-picker" style="width:35px;height:25px;cursor:pointer;"></div><div style="text-align:center;"><input type="color" id="color-grid_to_baseload_battery_force-cost" class="color-picker" style="width:35px;height:25px;cursor:pointer;"></div></div>' +
    '<div style="display:grid;grid-template-columns:380px 40px 40px 40px;gap:6px;align-items:center;font-size:12px;padding:6px 0;"><div>' + (_HAEO_EVENT_LABELS.grid_to_baseload_ev_battery_force || 'SomeText') + '</div><div style="text-align:center;"><input type="color" id="color-grid_to_baseload_ev_battery_force-bg" class="color-picker" style="width:35px;height:25px;cursor:pointer;"></div><div style="text-align:center;"><input type="color" id="color-grid_to_baseload_ev_battery_force-cost" class="color-picker" style="width:35px;height:25px;cursor:pointer;"></div><div style="text-align:center;"><input type="color" id="color-grid_to_baseload_ev_battery_force-cost" class="color-picker" style="width:35px;height:25px;cursor:pointer;"></div></div>' +
    '<div style="display:grid;grid-template-columns:380px 40px 40px 40px;gap:6px;align-items:center;font-size:12px;padding:6px 0;"><div>' + (_HAEO_EVENT_LABELS.grid_to_baseload_ev_force || 'SomeText') + '</div><div style="text-align:center;"><input type="color" id="color-grid_to_baseload_ev_force-bg" class="color-picker" style="width:35px;height:25px;cursor:pointer;"></div><div style="text-align:center;"><input type="color" id="color-grid_to_baseload_ev_force-cost" class="color-picker" style="width:35px;height:25px;cursor:pointer;"></div><div style="text-align:center;"><input type="color" id="color-grid_to_baseload_ev_force-cost" class="color-picker" style="width:35px;height:25px;cursor:pointer;"></div></div>' +
    '<div style="display:grid;grid-template-columns:380px 40px 40px 40px;gap:6px;align-items:center;font-size:12px;padding:6px 0;"><div>' + (_HAEO_EVENT_LABELS.grid_to_loads_battery_force || 'SomeText') + '</div><div style="text-align:center;"><input type="color" id="color-grid_to_loads_battery_force-bg" class="color-picker" style="width:35px;height:25px;cursor:pointer;"></div><div style="text-align:center;"><input type="color" id="color-grid_to_loads_battery_force-cost" class="color-picker" style="width:35px;height:25px;cursor:pointer;"></div><div style="text-align:center;"><input type="color" id="color-grid_to_loads_battery_force-cost" class="color-picker" style="width:35px;height:25px;cursor:pointer;"></div></div>' +
    '<div style="display:grid;grid-template-columns:380px 40px 40px 40px;gap:6px;align-items:center;font-size:12px;padding:6px 0;"><div>' + (_HAEO_EVENT_LABELS.grid_to_loads_only || 'SomeText') + '</div><div style="text-align:center;"><input type="color" id="color-grid_to_loads_only-bg" class="color-picker" style="width:35px;height:25px;cursor:pointer;"></div><div style="text-align:center;"><input type="color" id="color-grid_to_loads_only-cost" class="color-picker" style="width:35px;height:25px;cursor:pointer;"></div><div style="text-align:center;"><input type="color" id="color-grid_to_loads_only-cost" class="color-picker" style="width:35px;height:25px;cursor:pointer;"></div></div>' +
    '</div>' +
    '<div style="display:grid;gap:0;align-content:start;">' +
    '<div style="display:grid;grid-template-columns:380px 40px 40px 40px;gap:6px;align-items:center;font-size:10px;font-weight:bold;margin-bottom:12px;padding:6px 4px;border-radius:6px;background:rgba(33,150,243,0.15);border:1px solid rgba(33,150,243,0.3);position:sticky;top:0;white-space:nowrap;">' +
    '<div>Event</div><div style="text-align:center;">BKG</div><div style="text-align:center;">Event</div><div style="text-align:center;">Text</div>' +
    '</div>' +
    '<div style="display:grid;grid-template-columns:380px 40px 40px 40px;gap:6px;align-items:center;font-size:12px;padding:6px 0;"><div>' + (_HAEO_EVENT_LABELS.pv_battery_grid_to_loads || 'SomeText') + '</div><div style="text-align:center;"><input type="color" id="color-pv_battery_grid_to_loads-bg" class="color-picker" style="width:35px;height:25px;cursor:pointer;"></div><div style="text-align:center;"><input type="color" id="color-pv_battery_grid_to_loads-cost" class="color-picker" style="width:35px;height:25px;cursor:pointer;"></div><div style="text-align:center;"><input type="color" id="color-pv_battery_grid_to_loads-cost" class="color-picker" style="width:35px;height:25px;cursor:pointer;"></div></div>' +
    '<div style="display:grid;grid-template-columns:380px 40px 40px 40px;gap:6px;align-items:center;font-size:12px;padding:6px 0;"><div>' + (_HAEO_EVENT_LABELS.pv_battery_to_baseload_grid_force || 'SomeText') + '</div><div style="text-align:center;"><input type="color" id="color-pv_battery_to_baseload_grid_force-bg" class="color-picker" style="width:35px;height:25px;cursor:pointer;"></div><div style="text-align:center;"><input type="color" id="color-pv_battery_to_baseload_grid_force-cost" class="color-picker" style="width:35px;height:25px;cursor:pointer;"></div><div style="text-align:center;"><input type="color" id="color-pv_battery_to_baseload_grid_force-cost" class="color-picker" style="width:35px;height:25px;cursor:pointer;"></div></div>' +
    '<div style="display:grid;grid-template-columns:380px 40px 40px 40px;gap:6px;align-items:center;font-size:12px;padding:6px 0;"><div>' + (_HAEO_EVENT_LABELS.pv_battery_to_loads_grid_force || 'SomeText') + '</div><div style="text-align:center;"><input type="color" id="color-pv_battery_to_loads_grid_force-bg" class="color-picker" style="width:35px;height:25px;cursor:pointer;"></div><div style="text-align:center;"><input type="color" id="color-pv_battery_to_loads_grid_force-cost" class="color-picker" style="width:35px;height:25px;cursor:pointer;"></div><div style="text-align:center;"><input type="color" id="color-pv_battery_to_loads_grid_force-cost" class="color-picker" style="width:35px;height:25px;cursor:pointer;"></div></div>' +
    '<div style="display:grid;grid-template-columns:380px 40px 40px 40px;gap:6px;align-items:center;font-size:12px;padding:6px 0;"><div>' + (_HAEO_EVENT_LABELS.pv_grid_to_baseload_battery_force || 'SomeText') + '</div><div style="text-align:center;"><input type="color" id="color-pv_grid_to_baseload_battery_force-bg" class="color-picker" style="width:35px;height:25px;cursor:pointer;"></div><div style="text-align:center;"><input type="color" id="color-pv_grid_to_baseload_battery_force-cost" class="color-picker" style="width:35px;height:25px;cursor:pointer;"></div><div style="text-align:center;"><input type="color" id="color-pv_grid_to_baseload_battery_force-cost" class="color-picker" style="width:35px;height:25px;cursor:pointer;"></div></div>' +
    '<div style="display:grid;grid-template-columns:380px 40px 40px 40px;gap:6px;align-items:center;font-size:12px;padding:6px 0;"><div>' + (_HAEO_EVENT_LABELS.pv_grid_to_baseload_ev_battery_force || 'SomeText') + '</div><div style="text-align:center;"><input type="color" id="color-pv_grid_to_baseload_ev_battery_force-bg" class="color-picker" style="width:35px;height:25px;cursor:pointer;"></div><div style="text-align:center;"><input type="color" id="color-pv_grid_to_baseload_ev_battery_force-cost" class="color-picker" style="width:35px;height:25px;cursor:pointer;"></div><div style="text-align:center;"><input type="color" id="color-pv_grid_to_baseload_ev_battery_force-cost" class="color-picker" style="width:35px;height:25px;cursor:pointer;"></div></div>' +
    '<div style="display:grid;grid-template-columns:380px 40px 40px 40px;gap:6px;align-items:center;font-size:12px;padding:6px 0;"><div>' + (_HAEO_EVENT_LABELS.pv_grid_to_baseload_ev_charge || 'SomeText') + '</div><div style="text-align:center;"><input type="color" id="color-pv_grid_to_baseload_ev_charge-bg" class="color-picker" style="width:35px;height:25px;cursor:pointer;"></div><div style="text-align:center;"><input type="color" id="color-pv_grid_to_baseload_ev_charge-cost" class="color-picker" style="width:35px;height:25px;cursor:pointer;"></div><div style="text-align:center;"><input type="color" id="color-pv_grid_to_baseload_ev_charge-cost" class="color-picker" style="width:35px;height:25px;cursor:pointer;"></div></div>' +
    '<div style="display:grid;grid-template-columns:380px 40px 40px 40px;gap:6px;align-items:center;font-size:12px;padding:6px 0;"><div>' + (_HAEO_EVENT_LABELS.pv_grid_to_loads || 'SomeText') + '</div><div style="text-align:center;"><input type="color" id="color-pv_grid_to_loads-bg" class="color-picker" style="width:35px;height:25px;cursor:pointer;"></div><div style="text-align:center;"><input type="color" id="color-pv_grid_to_loads-cost" class="color-picker" style="width:35px;height:25px;cursor:pointer;"></div><div style="text-align:center;"><input type="color" id="color-pv_grid_to_loads-cost" class="color-picker" style="width:35px;height:25px;cursor:pointer;"></div></div>' +
    '<div style="display:grid;grid-template-columns:380px 40px 40px 40px;gap:6px;align-items:center;font-size:12px;padding:6px 0;"><div>' + (_HAEO_EVENT_LABELS.pv_to_baseload_battery_grid || 'SomeText') + '</div><div style="text-align:center;"><input type="color" id="color-pv_to_baseload_battery_grid-bg" class="color-picker" style="width:35px;height:25px;cursor:pointer;"></div><div style="text-align:center;"><input type="color" id="color-pv_to_baseload_battery_grid-cost" class="color-picker" style="width:35px;height:25px;cursor:pointer;"></div><div style="text-align:center;"><input type="color" id="color-pv_to_baseload_battery_grid-cost" class="color-picker" style="width:35px;height:25px;cursor:pointer;"></div></div>' +
    '<div style="display:grid;grid-template-columns:380px 40px 40px 40px;gap:6px;align-items:center;font-size:12px;padding:6px 0;"><div>' + (_HAEO_EVENT_LABELS.pv_to_loads_battery_grid || 'SomeText') + '</div><div style="text-align:center;"><input type="color" id="color-pv_to_loads_battery_grid-bg" class="color-picker" style="width:35px;height:25px;cursor:pointer;"></div><div style="text-align:center;"><input type="color" id="color-pv_to_loads_battery_grid-cost" class="color-picker" style="width:35px;height:25px;cursor:pointer;"></div><div style="text-align:center;"><input type="color" id="color-pv_to_loads_battery_grid-cost" class="color-picker" style="width:35px;height:25px;cursor:pointer;"></div></div>' +
    '<div style="display:grid;grid-template-columns:380px 40px 40px 40px;gap:6px;align-items:center;font-size:12px;padding:6px 0;"><div>' + (_HAEO_EVENT_LABELS.pv_to_baseload_ev_battery_force || 'SomeText') + '</div><div style="text-align:center;"><input type="color" id="color-pv_to_baseload_ev_battery_force-bg" class="color-picker" style="width:35px;height:25px;cursor:pointer;"></div><div style="text-align:center;"><input type="color" id="color-pv_to_baseload_ev_battery_force-txt" class="color-picker" style="width:35px;height:25px;cursor:pointer;"></div><div style="text-align:center;"><input type="color" id="color-pv_to_baseload_ev_battery_force-txt" class="color-picker" style="width:35px;height:25px;cursor:pointer;"></div></div>' +
    '<div style="display:grid;grid-template-columns:380px 40px 40px 40px;gap:6px;align-items:center;font-size:12px;padding:6px 0;"><div>' + (_HAEO_EVENT_LABELS.pv_battery_to_baseload_ev_charge || 'SomeText') + '</div><div style="text-align:center;"><input type="color" id="color-pv_battery_to_baseload_ev_charge-bg" class="color-picker" style="width:35px;height:25px;cursor:pointer;"></div><div style="text-align:center;"><input type="color" id="color-pv_battery_to_baseload_ev_charge-txt" class="color-picker" style="width:35px;height:25px;cursor:pointer;"></div><div style="text-align:center;"><input type="color" id="color-pv_battery_to_baseload_ev_charge-txt" class="color-picker" style="width:35px;height:25px;cursor:pointer;"></div></div>' +
    '</div>' +
    '</div>' +
    '</div>' +
    '<div class="settings-tab-content" data-content="backup">' +
    '<div style="padding:16px;display:flex;flex-direction:column;gap:16px;">' +
    '<div style="padding:12px;background:rgba(0,0,0,0.1);border-radius:4px;">' +
    '<div style="font-size:12px;font-weight:bold;margin-bottom:8px;">📥 Export Settings</div>' +
    '<div style="font-size:11px;margin-bottom:12px;color:var(--secondary-text-color);">Download all card settings to a JSON file.</div>' +
    '<button id="export-settings-btn" style="padding:10px 16px;background:var(--primary-color);color:var(--text-primary-color);border:none;border-radius:4px;cursor:pointer;font-size:12px;font-weight:bold;width:100%;">⬇️ Download Backup</button>' +
    '</div>' +
    '<div style="padding:12px;background:rgba(0,0,0,0.1);border-radius:4px;">' +
    '<div style="font-size:12px;font-weight:bold;margin-bottom:8px;">📤 Import Settings</div>' +
    '<div style="font-size:11px;margin-bottom:12px;color:var(--secondary-text-color);">Restore settings from a previously exported JSON file.</div>' +
    '<input type="file" id="import-settings-file" accept=".json" style="display:none;">' +
    '<button id="import-settings-btn" style="padding:10px 16px;background:var(--primary-color);color:var(--text-primary-color);border:none;border-radius:4px;cursor:pointer;font-size:12px;font-weight:bold;width:100%;">⬆️ Select Backup File</button>' +
    '</div>' +
    '</div>' +
    '</div>' +
    '</div>' +
    '<div style="border-top:1px solid var(--divider-color);padding:16px;display:flex;justify-content:space-between;align-items:center;background:var(--card-background-color);border-radius:0 0 8px 8px;">' +
    '<button id="reset-colors-btn" style="padding:8px 16px;background:var(--primary-color);color:var(--text-primary-color);border:none;border-radius:4px;cursor:pointer;font-size:12px;font-weight:bold;">↻ Reset to Defaults</button>' +
    '<button id="apply-settings-btn" style="padding:10px 20px;background:var(--primary-color);color:var(--text-primary-color);border:none;border-radius:4px;cursor:pointer;font-size:12px;font-weight:bold;">✓ Apply</button>' +
    '</div>' +
    '</div>' +
    '</div>' +
    
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
    '<div id="legend-ev-filters" style="display:flex;gap:12px;flex-wrap:wrap;"></div>' +
    '<div id="legend-optload-filters" style="display:flex;gap:12px;flex-wrap:wrap;"></div>' +
    '<div id="legend-defer-filters" style="display:flex;gap:12px;flex-wrap:wrap;"></div>' +
    '</div>' +
    '<div id="legend-categories-wrap"></div>' +
    '</div>' +
    '</div>' +
    '</div>' +
    
    '</div></ha-card>';
  return html;
}

// ── Custom Element ────────────────────────────────────────────────────────────
class HaeoEventsCard extends HTMLElement {
  // Inverter brand sensor mappings for Past Events Entities
  // Get available forecast load entities from HA
  _getAvailableForecastEntities() {
    if (!this._hass || !this._hass.states) return [];
    const entities = [];
    for (const entityId of Object.keys(this._hass.states)) {
      if (entityId.startsWith('number.') && entityId.includes('_load_forecast')) {
        entities.push(entityId);
      }
    }
    return entities.sort();
  }

  // Get available power sensors from HA
  _getAvailablePowerSensors() {
    if (!this._hass || !this._hass.states) return [];
    const sensors = [];
    const powerUnits = ['W', 'kW', 'MW'];
    for (const [entityId, state] of Object.entries(this._hass.states)) {
      if (!entityId.startsWith('sensor.')) continue;
      if (state.attributes && powerUnits.includes(state.attributes.unit_of_measurement)) {
        sensors.push(entityId);
      }
    }
    return sensors.sort();
  }

  // Get available forecast entities
  _getAvailableForecastOptions() {
    if (!this._hass || !this._hass.states) return [];
    const entities = [];
    for (const entityId of Object.keys(this._hass.states)) {
      if (entityId.startsWith('number.') && entityId.includes('_load_forecast')) {
        entities.push(entityId);
      }
    }
    return entities.sort();
  }

  // Get available historical power entities
  _getAvailableHistoricalOptions() {
    if (!this._hass || !this._hass.states) return [];
    const entities = [];
    for (const [entityId, state] of Object.entries(this._hass.states)) {
      if (!entityId.startsWith('sensor.')) continue;
      const unit = state.attributes?.unit_of_measurement || '';
      const name = state.attributes?.friendly_name || entityId;
      // Match *_power, *_active_power, *_load_power, etc.
      if (entityId.includes('_power') || entityId.includes('_load') || ['W', 'kW', 'MW'].includes(unit)) {
        entities.push(entityId);
      }
    }
    return entities.sort();
  }

  // Get available energy entities
  _getAvailableEnergyOptions() {
    if (!this._hass || !this._hass.states) return [];
    const entities = [];
    for (const [entityId, state] of Object.entries(this._hass.states)) {
      if (!entityId.startsWith('sensor.') && !entityId.startsWith('number.')) continue;
      const unit = state.attributes?.unit_of_measurement || '';
      // Match energy sensors: *_energy, *_consumption, *_generation, etc. with Wh/kWh/MWh units
      if (entityId.includes('_energy') || entityId.includes('_consumption') || entityId.includes('_generation') || entityId.includes('_charge') || entityId.includes('_discharge') || ['Wh', 'kWh', 'MWh'].includes(unit)) {
        entities.push(entityId);
      }
    }
    return entities.sort();
  }

  // Open emoji picker for optional load
  _openEmojiPicker(idx) {
    const emojis = [
      '🌡️', '🚿', '👚', '🧺', '🍽️', '🖧', '🏊', '🔌',
      '⚡', '🔥', '💧', '🌬️', '🧽', '🧹', '📺', '🎮',
      '☀️', '🌙', '⏰', '🔔', '📱', '💻', '🖥️', '🎵',
      '🚗', '🚙', '🏠', '🏡', '🏘️', '💡', '🔆'
    ];
    
    const emojiInput = this.shadowRoot.getElementById(`optload-emoji-${idx}`);
    const emojiBtn = this.shadowRoot.getElementById(`optload-emoji-btn-${idx}`);
    if (!emojiInput || !emojiBtn) return;
    
    // Check if picker already exists
    let existingPicker = this.shadowRoot.getElementById(`emoji-picker-${idx}`);
    if (existingPicker) {
      existingPicker.remove();
      return;
    }
    
    // Create picker container
    const picker = document.createElement('div');
    picker.id = `emoji-picker-${idx}`;
    picker.style.cssText = `
      position: absolute;
      background: var(--card-background-color);
      border: 1px solid var(--divider-color);
      border-radius: 8px;
      padding: 12px;
      z-index: 1000;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
      display: grid;
      grid-template-columns: repeat(8, 1fr);
      gap: 8px;
      width: 280px;
    `;
    
    // Add emojis to picker
    emojis.forEach(emoji => {
      const item = document.createElement('div');
      item.textContent = emoji;
      item.style.cssText = `
        font-size: 24px;
        cursor: pointer;
        text-align: center;
        padding: 8px;
        border-radius: 4px;
        transition: background 0.2s;
      `;
      item.addEventListener('mouseover', () => {
        item.style.background = 'rgba(255,255,255,0.1)';
      });
      item.addEventListener('mouseout', () => {
        item.style.background = 'transparent';
      });
      item.addEventListener('click', () => {
        emojiInput.value = emoji;
        picker.remove();
      });
      picker.appendChild(item);
    });
    
    // Position picker below button
    this.shadowRoot.appendChild(picker);
    const btnRect = emojiBtn.getBoundingClientRect();
    picker.style.top = (btnRect.bottom + 5) + 'px';
    picker.style.left = btnRect.left + 'px';
    
    // Close picker when clicking outside
    const closeHandler = (e) => {
      if (!picker.contains(e.target) && e.target !== emojiBtn) {
        picker.remove();
        document.removeEventListener('click', closeHandler);
      }
    };
  }

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
    this._previousLastRun = null;  // Track previous HAEO last_run to detect updates
    this._columnSettings = {
      deferLoad: false,
      ev: false,
      ev2: false
    };
    
    // Initialize deferrable loads config (empty, will load from localStorage)
    this._deferableLoadsConfig = [];

    // Initialize default threshold settings (in watts)
    this._thresholdSettings = {
      load: 0,
      deferLoad: 0,
      pv: 50,
      grid: 100,
      battery: 100,
      ev: 100,
      ev2: 100
    };
    
    // Initialize thresholds for each configured deferrable load
    this._deferableLoadsConfig.forEach((config, idx) => {
      this._thresholdSettings[`deferLoad${idx}`] = config.threshold || 50;
    });

    // Initialize default color settings
    this._colorSettings = JSON.parse(JSON.stringify(_HAEO_COLOURS));  // Deep copy to avoid reference issues
    // Each entry: { name, entityId, emoji, color, threshold }
    this._deferableLoadsConfig = [];
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
    // PAST power sensors: card config → the card's own saved "historical" setting → default.
    // _loadPast fetches and reads through this same resolution, so they can't disagree
    // (previously fetch used the saved setting first while reads used config/default →
    // "No sensor data" whenever a dashboard passed entity_past_* that differed from it).
    const _pastKind = _HAEO_PAST_KIND[key];
    if (_pastKind && !this._config['entity_' + key]) {
      let raw = null; try { raw = localStorage.getItem('haeo-events-card-load-entities'); } catch (e) {}
      if (raw === null || raw !== this._pastCfgRaw) { this._pastCfg = this._loadLoadEntitiesConfig(); this._pastCfgRaw = raw; }
      const h = this._pastCfg?.[_pastKind]?.historical;
      if (h) return h;
    }
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
    
    // Load column settings from localStorage if available
    try {
      const saved = localStorage.getItem('haeo-events-card-columns');
      if (saved) {
        const loaded = JSON.parse(saved);
        // Merge with defaults to ensure all keys exist
        this._columnSettings = { ...this._columnSettings, ...loaded };
      }
    } catch (e) {
      // localStorage unavailable or corrupted, use defaults
    }

    // Load color settings from localStorage if available
    try {
      const savedColors = localStorage.getItem('haeo-events-card-colors');
      if (savedColors) {
        const loaded = JSON.parse(savedColors);
        
        // Validate structure: has all required color categories with correct structure
        let isValid = true;
        for (const [key, colorObj] of Object.entries(_HAEO_COLOURS)) {
          if (!loaded[key] || 
              typeof loaded[key] !== 'object' ||
              !('bg' in loaded[key]) ||
              !('txt' in loaded[key]) ||
              !('cost' in loaded[key])) {
            isValid = false;
            break;
          }
        }
        
        // Use saved colors if structure is valid (values can differ from defaults)
        if (isValid) {
          this._colorSettings = loaded;
        }
        // Otherwise keep _colorSettings as initialized from _HAEO_COLOURS
      }
    } catch (e) {
      // localStorage unavailable or corrupted, use defaults
    }

    // Load threshold settings from localStorage if available
    try {
      const savedThresholds = localStorage.getItem('haeo-events-card-thresholds');
      if (savedThresholds) {
        this._thresholdSettings = JSON.parse(savedThresholds);
      }
    } catch (e) {
      // localStorage unavailable or corrupted, use defaults
    }

    // Load display settings (price/kW/kWh decimals) from localStorage if available
    try {
      const savedDisplay = localStorage.getItem('haeo-events-card-display');
      if (savedDisplay) {
        const parsed = JSON.parse(savedDisplay);
        this._displaySettings = {
          priceDecimals: parsed.priceDecimals ?? 4,
          kwDecimals:    parsed.kwDecimals    ?? 3,
          kwhDecimals:   parsed.kwhDecimals   ?? 3,
        };      } else {
        this._displaySettings = { priceDecimals: 4, kwDecimals: 3, kwhDecimals: 3 };
      }
    } catch (e) {
      this._displaySettings = { priceDecimals: 4, kwDecimals: 3, kwhDecimals: 3 };
    }

    // _deferableLoadsConfig is kept as empty array — old preset system replaced by entity-based config
    this._deferableLoadsConfig = [];

    if (!this.shadowRoot.getElementById('tb-future')) {
      const enabledOptionalLoads = this._getEnabledOptionalLoads();
      try {
        const html = _haeo_buildHTML(this._columnSettings, this._deferableLoadsConfig, enabledOptionalLoads);
        this.shadowRoot.innerHTML = html;
      } catch (e) {
      }
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
      if (!this._visHandler) {
        this._visHandler = () => {
          if (document.visibilityState === 'visible' && this._hass) {
            const staleMins = (Date.now() - this._lastRenderTs) / 60000;
            if (staleMins > 1) {
              this._lastCostTs = null;
              this._renderFuture();
              if (this._activeTab === 'past' && this._pastState === 'ready') {
                this._pastState = 'loading';
                this._loadPast();
              }
              this._lastRenderTs = Date.now();
            }
          }
        };
        document.addEventListener('visibilitychange', this._visHandler);
      }
    }
  }

  _setWrapHeight() {
    const wraps = this.shadowRoot.querySelectorAll('.wrap');
    wraps.forEach(w => {
      const top = w.getBoundingClientRect().top;
      if (top < 10) return;
      const legH = this.shadowRoot.querySelector('.leg')?.getBoundingClientRect().height || 0;
      w.style.height = Math.max(150, window.innerHeight - top - legH - 20) + 'px';
    });
  }

  set hass(hass) {
    this._hass = hass;
    
    // Auto-detect currency from HA config if not overridden in card config
    if (!this._config.currency_symbol && hass.config && hass.config.currency) {
      _HAEO_CUR = _haeo_curSymbol(hass.config.currency);
    } else if (this._config.currency_symbol) {
      _HAEO_CUR = this._config.currency_symbol;
    }
    
    if (!this.shadowRoot.getElementById('tb-future')) {
      try {
        const html = _haeo_buildHTML(this._columnSettings, this._deferableLoadsConfig);
        this.shadowRoot.innerHTML = html;
      } catch (e) {
      }
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
    
    // Settings button and modal handlers
    const settingsBtn = this.shadowRoot.getElementById('settings-btn');
    const settingsModal = this.shadowRoot.getElementById('settings-modal');
    const settingsClose = this.shadowRoot.getElementById('settings-modal-close');
    
    if (settingsBtn && !settingsBtn._wired) {
      settingsBtn._wired = true;
      settingsBtn.addEventListener('click', () => this._openSettingsModal());
    }
    
    if (settingsClose && !settingsClose._wired) {
      settingsClose._wired = true;
      settingsClose.addEventListener('click', () => this._closeSettingsModal());
    }
    
    if (settingsModal && !settingsModal._wired) {
      settingsModal._wired = true;
      settingsModal.addEventListener('click', (e) => {
        if (e.target === settingsModal) this._closeSettingsModal();
      });
    }

    // Settings tab switching
    const settingsTabs = this.shadowRoot.querySelectorAll('.settings-tab');
    const tabContents = this.shadowRoot.querySelectorAll('.settings-tab-content');
    settingsTabs.forEach(tab => {
      if (!tab._wired) {
        tab._wired = true;
        tab.addEventListener('click', () => {
          const tabName = tab.dataset.tab;
          // Remove active from all tabs and contents
          settingsTabs.forEach(t => t.classList.remove('active'));
          tabContents.forEach(c => c.classList.remove('active'));
          // Add active to clicked tab and corresponding content
          tab.classList.add('active');
          const content = this.shadowRoot.querySelector(`.settings-tab-content[data-content="${tabName}"]`);
          if (content) {
            content.classList.add('active');
          } else {
          }
        });
      }
    });

    // Threshold input handlers
    const thresholdInputs = this.shadowRoot.querySelectorAll('.threshold-input');
    thresholdInputs.forEach(input => {
      if (!input._wired) {
        input._wired = true;
        const key = input.id.replace('threshold-', '');
        input.value = this._thresholdSettings[key] || 0;
        input.addEventListener('change', () => {
          this._thresholdSettings[key] = parseInt(input.value) || 0;
          // Don't apply immediately - wait for Apply button
        });
      }
    });

    // Auto-detect energy button handler
    const autoDetectBtn = this.shadowRoot.getElementById('auto-detect-energy-btn');
    if (autoDetectBtn && !autoDetectBtn._wired) {
      autoDetectBtn._wired = true;
      autoDetectBtn.addEventListener('click', () => this._autoDetectEnergyEntities());
    }

    // Price decimals setting handler
    const priceDecimalsSelect = this.shadowRoot.getElementById('settings-price-decimals');
    if (priceDecimalsSelect && !priceDecimalsSelect._wired) {
      priceDecimalsSelect._wired = true;
      priceDecimalsSelect.value = this._displaySettings?.priceDecimals || 4;
      priceDecimalsSelect.addEventListener('change', () => {
        this._displaySettings.priceDecimals = parseInt(priceDecimalsSelect.value) || 4;
        try { localStorage.setItem('haeo-events-card-display', JSON.stringify(this._displaySettings)); } catch (e) {}
        if (this._activeTab === 'future') this._renderFuture();
      });
    }

    // kW decimals setting handler
    const kwDecimalsSelect = this.shadowRoot.getElementById('settings-kw-decimals');
    if (kwDecimalsSelect && !kwDecimalsSelect._wired) {
      kwDecimalsSelect._wired = true;
      kwDecimalsSelect.value = this._displaySettings?.kwDecimals || 3;
      kwDecimalsSelect.addEventListener('change', () => {
        this._displaySettings.kwDecimals = Math.min(4, Math.max(1, parseInt(kwDecimalsSelect.value) || 3));
        try { localStorage.setItem('haeo-events-card-display', JSON.stringify(this._displaySettings)); } catch (e) {}
        if (this._activeTab === 'future') this._renderFuture();
        if (this._activeTab === 'past') this._renderPast();
      });
    }

    // kWh decimals setting handler
    const kwhDecimalsSelect = this.shadowRoot.getElementById('settings-kwh-decimals');
    if (kwhDecimalsSelect && !kwhDecimalsSelect._wired) {
      kwhDecimalsSelect._wired = true;
      kwhDecimalsSelect.value = this._displaySettings?.kwhDecimals || 3;
      kwhDecimalsSelect.addEventListener('change', () => {
        this._displaySettings.kwhDecimals = Math.min(4, Math.max(1, parseInt(kwhDecimalsSelect.value) || 3));
        try { localStorage.setItem('haeo-events-card-display', JSON.stringify(this._displaySettings)); } catch (e) {}
        if (this._activeTab === 'future') this._renderFuture();
        if (this._activeTab === 'past') this._renderPast();
      });
    }

    // Column toggle checkboxes
    const colToggles = this.shadowRoot.querySelectorAll('.col-toggle');
    colToggles.forEach(cb => {
      if (!cb._wired) {
        cb._wired = true;
        const col = cb.id.replace('col-', '');
        cb.checked = this._columnSettings[col] !== false;
        cb.addEventListener('change', () => {
          this._columnSettings[col] = cb.checked;
          // Rebuild the active tab immediately
          if (this._activeTab === 'future') {
            this._renderFuture();
          } else if (this._activeTab === 'past') {
            this._loadPast();
          }
        });
      }
    });

    // Optional Loads handlers
    for (let i = 0; i < 10; i++) {
      // Emoji select dropdown
      const emojiSelect = this.shadowRoot.getElementById(`optload-emoji-${i}`);
      if (emojiSelect && !emojiSelect._wired) {
        emojiSelect._wired = true;
        // No extra handler needed - select works natively
      }

      // Preset dropdown (Load Name)
      const presetSelect = this.shadowRoot.getElementById(`optload-preset-${i}`);
      if (presetSelect && !presetSelect._wired) {
        presetSelect._wired = true;
        presetSelect.addEventListener('change', () => {
          const preset = presetSelect.value;
          const emojiInput = this.shadowRoot.getElementById(`optload-emoji-${i}`);
          const customNameInput = this.shadowRoot.getElementById(`optload-customname-${i}`);
          const forecastInput = this.shadowRoot.getElementById(`optload-forecast-${i}`);
          const historicalInput = this.shadowRoot.getElementById(`optload-historical-${i}`);
          
          if (preset === 'custom') {
            // Show custom name input field
            customNameInput.style.display = 'block';
            customNameInput.focus();
            // Clear other fields until user enters custom name
            forecastInput.value = '';
            historicalInput.value = '';
            emojiInput.value = '🔌';
          } else if (preset) {
            // Hide custom name input
            customNameInput.style.display = 'none';
            customNameInput.value = '';
            
            // Preset selected - auto-fill fields
            const presetMap = {
              'Circuit':          { emoji: '⚡',  abbr: 'Circuit',    defaultForecast: 'sensor.circuit_power_X_power',        defaultSensor: 'sensor.circuit_power_X_active_power',  defaultEnergy: 'sensor.circuit_power_X_energy' },
              'Air Conditioner':  { emoji: '🌡️', abbr: 'HVAC',       defaultForecast: 'sensor.air_conditioner_power',         defaultSensor: 'sensor.air_conditioner_active_power',  defaultEnergy: 'sensor.air_conditioner_energy' },
              'Hot Water System': { emoji: '🚿', abbr: 'HWS',        defaultForecast: 'sensor.hot_water_system_power',        defaultSensor: 'sensor.hot_water_system_active_power', defaultEnergy: 'sensor.hot_water_system_energy' },
              'Clothes Dryer':    { emoji: '👚', abbr: 'C. Dryer',   defaultForecast: 'sensor.clothes_dryer_power',           defaultSensor: 'sensor.clothes_dryer_active_power',    defaultEnergy: 'sensor.clothes_dryer_energy' },
              'Washing Machine':  { emoji: '🧺', abbr: 'W. Machine', defaultForecast: 'sensor.washing_machine_power',         defaultSensor: 'sensor.washing_machine_active_power',  defaultEnergy: 'sensor.washing_machine_energy' },
              'Dishwasher':       { emoji: '🍽️', abbr: 'Dishw.',     defaultForecast: 'sensor.dishwasher_power',              defaultSensor: 'sensor.dishwasher_active_power',       defaultEnergy: 'sensor.dishwasher_energy' },
              'IT Hardware':      { emoji: '💻', abbr: 'IT H/W',     defaultForecast: 'sensor.it_hardware_power',             defaultSensor: 'sensor.it_hardware_active_power',      defaultEnergy: 'sensor.it_hardware_energy' },
              'Pool':             { emoji: '🏊', abbr: 'Pump',       defaultForecast: 'sensor.pool_power',                   defaultSensor: 'sensor.pool_active_power',              defaultEnergy: 'sensor.pool_energy' },
              'Generic Load':     { emoji: '🔌', abbr: 'Generic',    defaultForecast: 'sensor.generic_load_power',            defaultSensor: 'sensor.generic_load_active_power',     defaultEnergy: 'sensor.generic_load_energy' },
            };
            
            const info = presetMap[preset];
            if (info) {
              emojiInput.value = info.emoji;
              const energyInput = this.shadowRoot.getElementById(`optload-energy-${i}`);
              if (preset === 'Circuit') {
                const slotNum = i + 1;
                forecastInput.value = `sensor.circuit_power_${slotNum}_power`;
                historicalInput.value = `sensor.circuit_power_${slotNum}_active_power`;
                if (energyInput) energyInput.value = `sensor.circuit_power_${slotNum}_energy`;
              } else {
                forecastInput.value = info.defaultForecast;
                historicalInput.value = info.defaultSensor;
                if (energyInput) energyInput.value = info.defaultEnergy;
              }
            }
          } else {
            // None selected - hide custom name input and clear fields
            customNameInput.style.display = 'none';
            customNameInput.value = '';
            emojiInput.value = '🔌';
            forecastInput.value = '';
            historicalInput.value = '';
          }
        });
      }
      
      // Custom name input handler
      const customNameInput = this.shadowRoot.getElementById(`optload-customname-${i}`);
      if (customNameInput && !customNameInput._wired) {
        customNameInput._wired = true;
        customNameInput.addEventListener('blur', () => {
          const customName = customNameInput.value.trim();
          const forecastInput = this.shadowRoot.getElementById(`optload-forecast-${i}`);
          const historicalInput = this.shadowRoot.getElementById(`optload-historical-${i}`);
          
          // Auto-generate forecast entity ID if custom name is entered
          if (customName) {
            forecastInput.value = this._generateForecastEntityId(customName);
            historicalInput.value = '';
          }
        });
      }

      // Forecast entity autocomplete
      const forecastInput = this.shadowRoot.getElementById(`optload-forecast-${i}`);
      if (forecastInput && !forecastInput._wired) {
        forecastInput._wired = true;
        forecastInput.addEventListener('input', () => {
          const query = forecastInput.value.toLowerCase();
          const options = this._getAvailableForecastOptions();
          const matches = options.filter(opt => opt.toLowerCase().includes(query)).slice(0, 5);
          
          // Remove existing datalist
          const existingList = this.shadowRoot.getElementById(`optload-forecast-list-${i}`);
          if (existingList) existingList.remove();
          
          // Create and populate datalist
          if (matches.length > 0) {
            const datalist = document.createElement('datalist');
            datalist.id = `optload-forecast-list-${i}`;
            matches.forEach(match => {
              const option = document.createElement('option');
              option.value = match;
              datalist.appendChild(option);
            });
            this.shadowRoot.appendChild(datalist);
            forecastInput.setAttribute('list', `optload-forecast-list-${i}`);
          }
        });
      }

      // Historical entity autocomplete
      const historicalInput = this.shadowRoot.getElementById(`optload-historical-${i}`);
      if (historicalInput && !historicalInput._wired) {
        historicalInput._wired = true;
        historicalInput.addEventListener('input', () => {
          const query = historicalInput.value.toLowerCase();
          const options = this._getAvailableHistoricalOptions();
          const matches = options.filter(opt => opt.toLowerCase().includes(query)).slice(0, 5);
          
          // Remove existing datalist
          const existingList = this.shadowRoot.getElementById(`optload-historical-list-${i}`);
          if (existingList) existingList.remove();
          
          // Create and populate datalist
          if (matches.length > 0) {
            const datalist = document.createElement('datalist');
            datalist.id = `optload-historical-list-${i}`;
            matches.forEach(match => {
              const option = document.createElement('option');
              option.value = match;
              datalist.appendChild(option);
            });
            this.shadowRoot.appendChild(datalist);
            historicalInput.setAttribute('list', `optload-historical-list-${i}`);
          }
        });
      }
    }

    // Load entity autocomplete handlers for all loads
    const loadTypes = ['load', 'pv', 'grid', 'battery', 'ev', 'ev2'];
    loadTypes.forEach(loadType => {
      const forecastInput = this.shadowRoot.getElementById(`${loadType}-forecast`);
      const historicalInput = this.shadowRoot.getElementById(`${loadType}-historical`);
      const energyInput = this.shadowRoot.getElementById(`${loadType}-energy`);
      
      // Forecast entity autocomplete
      if (forecastInput && !forecastInput._wired) {
        forecastInput._wired = true;
        forecastInput.addEventListener('input', () => {
          const query = forecastInput.value.toLowerCase();
          const options = this._getAvailableForecastOptions();
          const matches = options.filter(opt => opt.toLowerCase().includes(query)).slice(0, 5);
          
          const existingList = this.shadowRoot.getElementById(`${loadType}-forecast-list`);
          if (existingList) existingList.remove();
          
          if (matches.length > 0) {
            const datalist = document.createElement('datalist');
            datalist.id = `${loadType}-forecast-list`;
            matches.forEach(match => {
              const option = document.createElement('option');
              option.value = match;
              datalist.appendChild(option);
            });
            this.shadowRoot.appendChild(datalist);
            forecastInput.setAttribute('list', `${loadType}-forecast-list`);
          }
        });
      }
      
      // Historical entity autocomplete
      if (historicalInput && !historicalInput._wired) {
        historicalInput._wired = true;
        historicalInput.addEventListener('input', () => {
          const query = historicalInput.value.toLowerCase();
          const options = this._getAvailableHistoricalOptions();
          const matches = options.filter(opt => opt.toLowerCase().includes(query)).slice(0, 5);
          
          const existingList = this.shadowRoot.getElementById(`${loadType}-historical-list`);
          if (existingList) existingList.remove();
          
          if (matches.length > 0) {
            const datalist = document.createElement('datalist');
            datalist.id = `${loadType}-historical-list`;
            matches.forEach(match => {
              const option = document.createElement('option');
              option.value = match;
              datalist.appendChild(option);
            });
            this.shadowRoot.appendChild(datalist);
            historicalInput.setAttribute('list', `${loadType}-historical-list`);
          }
        });
      }
      
      // Energy entity autocomplete
      if (energyInput && !energyInput._wired) {
        energyInput._wired = true;
        energyInput.addEventListener('input', () => {
          const query = energyInput.value.toLowerCase();
          const options = this._getAvailableEnergyOptions();
          const matches = options.filter(opt => opt.toLowerCase().includes(query)).slice(0, 5);
          
          const existingList = this.shadowRoot.getElementById(`${loadType}-energy-list`);
          if (existingList) existingList.remove();
          
          if (matches.length > 0) {
            const datalist = document.createElement('datalist');
            datalist.id = `${loadType}-energy-list`;
            matches.forEach(match => {
              const option = document.createElement('option');
              option.value = match;
              datalist.appendChild(option);
            });
            this.shadowRoot.appendChild(datalist);
            energyInput.setAttribute('list', `${loadType}-energy-list`);
          }
        });
      }
    });
    
    // Special export/discharge energy field autocomplete
    const specialEnergyFields = [
      { id: 'grid-energy-export', listId: 'grid-energy-export-list' },
      { id: 'battery-energy-discharge', listId: 'battery-energy-discharge-list' },
      { id: 'ev-energy-discharge', listId: 'ev-energy-discharge-list' },
      { id: 'ev2-energy-discharge', listId: 'ev2-energy-discharge-list' }
    ];
    
    specialEnergyFields.forEach(field => {
      const input = this.shadowRoot.getElementById(field.id);
      if (input && !input._wired) {
        input._wired = true;
        input.addEventListener('input', () => {
          const query = input.value.toLowerCase();
          const options = this._getAvailableEnergyOptions();
          const matches = options.filter(opt => opt.toLowerCase().includes(query)).slice(0, 5);
          
          const existingList = this.shadowRoot.getElementById(field.listId);
          if (existingList) existingList.remove();
          
          if (matches.length > 0) {
            const datalist = document.createElement('datalist');
            datalist.id = field.listId;
            matches.forEach(match => {
              const option = document.createElement('option');
              option.value = match;
              datalist.appendChild(option);
            });
            this.shadowRoot.appendChild(datalist);
            input.setAttribute('list', field.listId);
          }
        });
      }
    });

    // Deferrable loads entity autocomplete handlers
    const deferLoadForecastInput = this.shadowRoot.getElementById('deferLoad-forecast');
    if (deferLoadForecastInput && !deferLoadForecastInput._wired) {
      deferLoadForecastInput._wired = true;
      deferLoadForecastInput.addEventListener('input', () => {
        const query = deferLoadForecastInput.value.toLowerCase();
        const options = this._getAvailableForecastOptions();
        const matches = options.filter(opt => opt.toLowerCase().includes(query)).slice(0, 5);
        
        // Remove existing datalist
        const existingList = this.shadowRoot.getElementById('deferLoad-forecast-list');
        if (existingList) existingList.remove();
        
        // Create and populate datalist
        if (matches.length > 0) {
          const datalist = document.createElement('datalist');
          datalist.id = 'deferLoad-forecast-list';
          matches.forEach(match => {
            const option = document.createElement('option');
            option.value = match;
            datalist.appendChild(option);
          });
          this.shadowRoot.appendChild(datalist);
          deferLoadForecastInput.setAttribute('list', 'deferLoad-forecast-list');
        }
      });
    }

    const deferLoadHistoricalInput = this.shadowRoot.getElementById('deferLoad-historical');
    if (deferLoadHistoricalInput && !deferLoadHistoricalInput._wired) {
      deferLoadHistoricalInput._wired = true;
      deferLoadHistoricalInput.addEventListener('input', () => {
        const query = deferLoadHistoricalInput.value.toLowerCase();
        const options = this._getAvailableHistoricalOptions();
        const matches = options.filter(opt => opt.toLowerCase().includes(query)).slice(0, 5);
        
        // Remove existing datalist
        const existingList = this.shadowRoot.getElementById('deferLoad-historical-list');
        if (existingList) existingList.remove();
        
        // Create and populate datalist
        if (matches.length > 0) {
          const datalist = document.createElement('datalist');
          datalist.id = 'deferLoad-historical-list';
          matches.forEach(match => {
            const option = document.createElement('option');
            option.value = match;
            datalist.appendChild(option);
          });
          this.shadowRoot.appendChild(datalist);
          deferLoadHistoricalInput.setAttribute('list', 'deferLoad-historical-list');
        }
      });
    }

    // Export Settings button
    const exportBtn = this.shadowRoot.getElementById('export-settings-btn');
    if (exportBtn && !exportBtn._wired) {
      exportBtn._wired = true;
      exportBtn.addEventListener('click', () => this._exportSettings());
    }

    // Import Settings button
    const importBtn = this.shadowRoot.getElementById('import-settings-btn');
    const importFile = this.shadowRoot.getElementById('import-settings-file');
    if (importBtn && !importBtn._wired) {
      importBtn._wired = true;
      importBtn.addEventListener('click', () => {
        if (importFile) importFile.click();
      });
    }
    if (importFile && !importFile._wired) {
      importFile._wired = true;
      importFile.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) this._importSettings(file);
      });
    }

    // Apply Settings button
    const applyBtn = this.shadowRoot.getElementById('apply-settings-btn');
    if (applyBtn && !applyBtn._wired) {
      applyBtn._wired = true;
      applyBtn.addEventListener('click', () => {
        // Save color settings to localStorage
        try {
          const colorInputs = this.shadowRoot.querySelectorAll('.color-picker');
          const colors = {};
          colorInputs.forEach(input => {
            colors[input.id] = input.value;
          });
          localStorage.setItem('haeo-events-card-colors', JSON.stringify(colors));
        } catch (e) {
        }
        // Save column settings to localStorage
        try {
          localStorage.setItem('haeo-events-card-columns', JSON.stringify(this._columnSettings));
        } catch (e) {
          // localStorage might be unavailable
        }
        // Save threshold settings to localStorage
        try {
          localStorage.setItem('haeo-events-card-thresholds', JSON.stringify(this._thresholdSettings));
        } catch (e) {
          // localStorage might be unavailable
        }
        // Save entity settings to localStorage
        try {
          const weatherInput = this.shadowRoot.getElementById('weather-entity-input');
          const curtailmentInput = this.shadowRoot.getElementById('curtailment-entity-input');
          const entities = {
            weatherEntity: weatherInput ? weatherInput.value || 'weather.forecast_home' : 'weather.forecast_home',
            curtailmentEntity: curtailmentInput ? curtailmentInput.value || 'switch.solar_curtailment' : 'switch.solar_curtailment'
          };
          localStorage.setItem('haeo-events-card-entities', JSON.stringify(entities));
        } catch (e) {
          // localStorage might be unavailable
        }
        // Save load entities configuration to localStorage
        try {
          this._saveLoadEntitiesConfig();
        } catch (e) {
        }
        // Save optional loads configuration to localStorage
        try {
          this._saveOptionalLoadsConfig();
        } catch (e) {
        }
        // Close modal and refresh
        if (settingsModal) settingsModal.style.display = 'none';
        // Force reload/rebuild
        window.location.reload();
      });
    }
  }

  // ── Future tab render ───────────────────────────────────────────────────────
  _renderFuture() {
    this._lastRenderTs = Date.now();
    
    // Monitor HAEO last_run and trigger refresh if it changed
    const optimizerStatusEntity = this._hass?.states['sensor.optimizer_status'];
    if (optimizerStatusEntity?.attributes?.last_run) {
      const currentLastRun = optimizerStatusEntity.attributes.last_run;
      
      // If last_run has changed, HAEO has run an optimization - refresh the data
      if (this._previousLastRun !== null && this._previousLastRun !== currentLastRun) {
        // Clear cached data to force re-fetch
        this._lastCostTs = null;
        // Refresh PAST data if it's loaded
        if (this._activeTab === 'past' && this._pastState === 'ready') {
          this._pastState = 'loading';
          this._loadPast();
        }
      }
      
      // Store the current last_run for next comparison
      this._previousLastRun = currentLastRun;
    }
    
    const sbar  = this.shadowRoot.getElementById('sbar-future');
    const tbody = this.shadowRoot.getElementById('tb-future');
    if (!sbar || !tbody) return;
    try {
      this._renderFutureInner(sbar, tbody);
    } catch (e) {
      tbody.innerHTML = '<tr><td colspan="14" class="err">⚠️ Render error: ' + e.message + '</td></tr>';
      sbar.innerHTML = '<span style="color:#f44336;">⚠️ ' + e.message + '</span>';
    }
  }

  _renderFutureInner(sbar, tbody) {

    // Build UTC-epoch-ms → value Map from a sensor's {time, value} forecast attribute.
    // Keying by epoch ms is timezone-safe regardless of UTC offset in time strings.
    // mult: unit multiplier to normalise to kW — auto-detected from unit_of_measurement.
    // If no forecast attribute exists, falls back to the live state value repeated for
    // all primary forecast timestamps (used for Base Load which is a live sensor).
    const buildMap = (entityId, mult) => {
      const stateObj = this._hass?.states[entityId];
      const fc = stateObj?.attributes?.forecast;
      if (Array.isArray(fc) && fc.length) {
        const m = new Map();
        for (const row of fc) {
          if (!row || row.time == null) continue;
          const ts = new Date(row.time).getTime();
          if (!isNaN(ts)) m.set(ts, (row.value != null ? parseFloat(row.value) || 0 : 0) * mult);
        }
        return m;
      }
      // No forecast attribute — use live state value as a constant across all slots
      const liveVal = parseFloat(stateObj?.state);
      if (!isNaN(liveVal) && isFinite(liveVal)) {
        const unit = stateObj?.attributes?.unit_of_measurement || '';
        const unitMult = unit === 'W' ? 0.001 : unit === 'MW' ? 1000 : 1;
        const m = new Map();
        m._liveValue = liveVal * mult * unitMult;  // flag for constant-value maps
        return m;
      }
      return new Map();
    };

    // Wrapper: looks up a value from a map, using live constant if map has no timestamps
    const mapGet = (m, ts) => {
      if (m._liveValue !== undefined) return m._liveValue;
      return m.get(ts) ?? 0;
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
    // Load saved entity configuration (with defaults as fallback)
    const loadEntityConfig = this._loadLoadEntitiesConfig();
    const enabledOptionalLoads = this._getEnabledOptionalLoads();

    // Invert multipliers for Future tab (sign flip for inverted sensors)
    const _inv = (key) => loadEntityConfig[key]?.invert ? -1 : 1;

    // Build forecast maps using saved or default entities
    const battMap     = buildMap(loadEntityConfig.battery.forecast || this._eid('haeo_battery'),             _inv('battery'));
    const gridMap     = buildMap(loadEntityConfig.grid.forecast || this._eid('haeo_grid'),                   _inv('grid'));
    const loadMap     = buildMap(loadEntityConfig.base.forecast || this._eid('haeo_load'),                   _inv('base'));
    const deferLoadMap= buildMap(loadEntityConfig.deferrable?.forecast || this._eid('haeo_deferrable_load'), _inv('deferLoad'));
    const solarMap    = buildMap(loadEntityConfig.pv.forecast || this._eid('haeo_solar'),                    _inv('pv'));
    const socMap      = buildMap(this._eid('haeo_soc'),            1);
    const evPowerMap  = buildMap(loadEntityConfig.ev.forecast || this._eid('haeo_ev_power'),                 _inv('ev'));
    const evSocMap    = buildMap(this._eid('haeo_ev_soc'),       1);
    const ev2PowerMap = buildMap(loadEntityConfig.ev2.forecast || this._eid('haeo_ev2_power'),               _inv('ev2'));
    const ev2SocMap   = buildMap(this._eid('haeo_ev2_soc'),      1);
    const buyMap      = buildMap(this._eid('haeo_buy_price'),      1);
    const sellMap     = buildMap(this._eid('haeo_sell_price'),     1);
    
    // Build forecast maps for each configured deferrable load
    // Build deferrable loads map using entity-based config
    const deferLoadMaps = [];
    const deferLoadForecastEntity = loadEntityConfig.deferrable?.forecast || this._eid('haeo_deferrable_load');
    if (deferLoadForecastEntity) {
      deferLoadMaps[0] = buildMap(deferLoadForecastEntity, 1);
    } else {
      deferLoadMaps[0] = new Map();
    }
    
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
    const deferLoadSensorExists = this._evSensorExists('haeo_deferrable_load');

    // ── Status bar ──
    const nowSoc  = parseFloat(this._hass?.states[this._eid('haeo_soc')]?.state) ?? null;
    const nowBuy  = parseFloat(this._hass?.states[this._eid('haeo_buy_price')]?.state) ?? null;
    const nowSell = parseFloat(this._hass?.states[this._eid('haeo_sell_price')]?.state) ?? null;
    const exportLimit = parseFloat(this._hass?.states[this._eid('haeo_export_limit')]?.state) ?? null;
    const importLimit = parseFloat(this._hass?.states[this._eid('haeo_import_limit')]?.state) ?? null;
    const battChargeLimit = parseFloat(this._hass?.states[this._eid('haeo_batt_charge_limit')]?.state) ?? null;
    const battDischargeLimit = parseFloat(this._hass?.states[this._eid('haeo_batt_discharge_limit')]?.state) ?? null;

    // Current activity: use live sensors, fallback to forecast if unavailable
    const liveGridKw = parseFloat(this._hass?.states[this._eid('haeo_grid')]?.state) ?? null;
    const liveBattKw = parseFloat(this._hass?.states[this._eid('haeo_battery')]?.state) ?? null;
    const currentGridKw = liveGridKw != null ? liveGridKw : mapGet(gridMap, nowTs);
    const currentBattKw = liveBattKw != null ? liveBattKw : mapGet(battMap, nowTs);
    const isGridImporting = currentGridKw > 0.05;  // 50W threshold
    const isBattCharging = currentBattKw < -0.1;   // 100W threshold
    const isGridExporting = currentGridKw < -0.05; // 50W threshold
    const isBattExporting = currentBattKw > 0.1 && isGridExporting; // discharge + grid export

    // Get current Mode and Focus
    const nowClassification = _haeo_classifyFuture(mapGet(solarMap, nowTs), mapGet(loadMap, nowTs), currentBattKw, currentGridKw, mapGet(evPowerMap, nowTs), mapGet(deferLoadMap, nowTs), mapGet(ev2PowerMap, nowTs), [], enabledOptionalLoads);
    const { mode, focus, modeColor, focusColor } = _haeo_getModeAndFocus(nowClassification.label);

    // Morning SoC / Peak SoC — show next day's minimum SoC during morning (00:00-12:00) or current peak
    let closestDiff = Infinity, chargingNow = false;
    for (const row of primaryFc) {
      const ts   = new Date(row.time).getTime();
      const diff = Math.abs(ts - nowTs);
      if (diff < closestDiff) {
        closestDiff = diff;
        chargingNow = (mapGet(solarMap, ts)) > 0.5 && (mapGet(battMap, ts)) < -0.1;
      }
    }
    
    let dawnSoc = null, dawnTime = '', dawnLabel = '';
    
    // Get HAEO forecast last update time
    const optimizerStatusEntity = this._hass?.states['sensor.optimizer_status'];
    let haeoUpdatedStr = null;
    if (optimizerStatusEntity?.attributes?.last_run) {
      const lastRunUtc = new Date(optimizerStatusEntity.attributes.last_run);
      const now = new Date();
      const diffMs = now - lastRunUtc;
      
      // Handle future timestamps (negative diff) - show "just now"
      if (diffMs < 0) {
        const localTime = lastRunUtc.toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true });
        haeoUpdatedStr = 'just now (' + localTime + ')';
      } else {
        const diffSecs = Math.floor(diffMs / 1000);
        const diffMins = Math.floor(diffSecs / 60);
        const diffHours = Math.floor(diffMins / 60);
        
        let timeStr = '';
        if (diffSecs < 60) {
          timeStr = diffSecs + 's ago';
        } else if (diffMins < 60) {
          timeStr = diffMins + 'm ago';
        } else {
          const remainingMins = diffMins % 60;
          timeStr = diffHours + 'h ' + remainingMins + 'm ago';
        }
        
        const localTime = lastRunUtc.toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true });
        haeoUpdatedStr = timeStr + ' (' + localTime + ')';
      }
    }
    
    // Get battery capacity if available
    const batteryCapacityStr = this._hass?.states['number.battery_capacity']?.state;
    const batteryCapacity = batteryCapacityStr ? parseFloat(batteryCapacityStr) : null;
    
    // Helper to format SoC badge with optional kWh
    const formatSocBadge = (soc, time, label) => {
      if (soc === null) return null;
      
      let display = `${label}: ${soc.toFixed(1)}%`;
      
      // Add kWh if capacity available
      if (batteryCapacity && batteryCapacity > 0) {
        const kWh = (soc / 100) * batteryCapacity;
        display += ` | ${kWh.toFixed(1)} kWh`;
      }
      
      display += ` (${time})`;
      return display;
    };
    
    if (chargingNow) {
      // Currently charging with solar: find peak SoC during this charge period
      let pkSoc = 0, pkTime = '';
      for (const row of primaryFc) {
        const ts = new Date(row.time).getTime();
        if (isNaN(ts) || ts < nowTs) continue;
        const soc = socMap.get(ts) || 0;
        if ((mapGet(solarMap, ts)) > 0.5 && (mapGet(battMap, ts)) < -0.01 && soc > pkSoc) {
          pkSoc  = soc;
          pkTime = new Date(ts).toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', hour12: true });
        }
      }
      if (pkSoc > 0) { dawnSoc = formatSocBadge(pkSoc, pkTime, 'Peak SoC'); }
    } else {
      // Not currently charging: find tomorrow's minimum SoC during morning period (00:00-12:00)
      const today = new Date(nowTs);
      const todayDate = today.toLocaleDateString('en-CA'); // YYYY-MM-DD
      
      let minSoc = 100, minTime = '';
      
      // Scan all forecast entries for next day's morning period
      for (const row of primaryFc) {
        const ts = new Date(row.time).getTime();
        if (isNaN(ts) || ts <= nowTs) continue;
        
        const forecastDate = new Date(ts).toLocaleDateString('en-CA');
        const forecastHour = new Date(ts).getHours();
        
        // Found an entry on next day
        if (forecastDate !== todayDate) {
          const soc = socMap.get(ts) || 0;
          
          // Only look at morning hours (00:00 to 12:00)
          if (forecastHour >= 12) break;
          
          // Track minimum SoC
          if (soc < minSoc) {
            minSoc = soc;
            minTime = new Date(ts).toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', hour12: true });
          }
        }
      }
      
      // Report the minimum we found
      if (minSoc < 100) {
        dawnSoc = formatSocBadge(minSoc, minTime, 'Morning SoC');
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
      const gridKw = mapGet(gridMap, ts);
      const battKw = mapGet(battMap, ts);
      const solarKw = mapGet(solarMap, ts);
      const loadKw = mapGet(loadMap, ts);
      
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

    // Get numeric SoC for color calculation (extract from dawnSoc string if it exists)
    let dawnSocNumeric = null;
    if (dawnSoc && typeof dawnSoc === 'string') {
      const match = dawnSoc.match(/(\d+\.?\d*?)%/);
      dawnSocNumeric = match ? parseFloat(match[1]) : null;
    }
    
    const socColor  = nowSoc  != null ? (nowSoc  <= 20 ? '#f44336' : nowSoc  >= 75 ? '#4caf50' : 'var(--primary-text-color)') : '';
    const dawnColor = dawnSocNumeric != null ? (dawnSocNumeric <= 20 ? '#f44336' : dawnSocNumeric <= 35 ? '#ff9800' : '#4caf50') : '';

    // Update HAEO Updated badge in tab bar (centered between tabs)
    const haeoUpdatedBadge = this.shadowRoot.getElementById('haeo-updated-badge');
    if (haeoUpdatedBadge && haeoUpdatedStr) {
      haeoUpdatedBadge.innerHTML = '🔄 HAEO Updated: <span class="pill" style="background:#555;color:#fff;padding:2px 10px;border-radius:12px;font-weight:600;display:inline-block;">' + haeoUpdatedStr + '</span>';
    }

    sbar.innerHTML =
      '<span style="color:#2196f3;font-weight:bold;margin-right:12px;">STATUS:</span>' +
      (mode ? '📌 Mode: <span class="pill" style="background-color:' + (modeColor || '#555') + ' !important;color:#fff;padding:2px 10px;border-radius:12px;font-weight:600;display:inline-block;">' + mode + '</span>' : '') +
      (focus ? '🎯 Focus: <span class="pill" style="background-color:' + (focusColor || '#555') + ' !important;color:#fff;padding:2px 10px;border-radius:12px;font-weight:600;display:inline-block;">' + focus + '</span>' : '') +
      (nowSoc   != null ? '🔋 SoC now: <span class="pill" style="background:#555;color:#fff;padding:2px 10px;border-radius:12px;font-weight:600;display:inline-block;">' + nowSoc.toFixed(1)  + '%</span>' : '') +
      (dawnSoc  != null ? '☀️ <span class="pill" style="background:#555;color:#fff;padding:2px 10px;border-radius:12px;font-weight:600;display:inline-block;">' + dawnSoc + '</span>' : '') +
      (exportLimit != null ? '📤 Export Limit: <span class="pill" style="background:#555;color:#fff;padding:2px 10px;border-radius:12px;font-weight:600;display:inline-block;">' + exportLimit.toFixed(2) + ' kW</span>' : '') +
      (isGridImporting && importLimit != null ? '⚡ Import Limit: <span class="pill" style="background:#555;color:#fff;padding:2px 10px;border-radius:12px;font-weight:600;display:inline-block;">' + importLimit.toFixed(2) + ' kW</span>' : '') +
      (isBattCharging && battChargeLimit != null ? '🔋 ESS Charge Limit: <span class="pill" style="background:#555;color:#fff;padding:2px 10px;border-radius:12px;font-weight:600;display:inline-block;">' + battChargeLimit.toFixed(2) + ' kW</span>' : '') +
      (isBattExporting && battDischargeLimit != null ? '🔋 ESS Disch. Limit: <span class="pill" style="background:#555;color:#fff;padding:2px 10px;border-radius:12px;font-weight:600;display:inline-block;">' + battDischargeLimit.toFixed(2) + ' kW</span>' : '');

    // Load settings for weather and curtailment entities
    let weatherEntity = 'weather.forecast_home';
    let curtailmentEntity = 'switch.solar_curtailment';
    const savedEntities = localStorage.getItem('haeo-events-card-entities');
    if (savedEntities) {
      try {
        const ents = JSON.parse(savedEntities);
        if (ents.weatherEntity) weatherEntity = ents.weatherEntity;
        if (ents.curtailmentEntity) curtailmentEntity = ents.curtailmentEntity;
      } catch(e) {}
    }

    // Get weather and curtailment states
    const weatherState = this._hass && this._hass.states ? this._hass.states[weatherEntity] : null;
    const curtailmentState = this._hass && this._hass.states ? this._hass.states[curtailmentEntity] : null;
    const isWeatherAffected = weatherState && ['rainy', 'pouring', 'cloudy', 'fog', 'partly_cloudy'].includes(weatherState.state);
    const isCurtailed = curtailmentState && curtailmentState.state === 'on';

    // Set grid export alert in tab bar (FUTURE TAB ONLY - hide when on Past tab)
    const alertEl = this.shadowRoot.getElementById('grid-export-alert');
    if (alertEl) {
      let alertHtml = '';
      
      // Alert order: 1. Weather, 2. Curtailment, 3. Grid Import, 4. Grid Export, 5. Force Charge, 6. Force Discharge
      if (isWeatherAffected) alertHtml += '<span class="pill" style="background:#4a90e2;color:#fff;padding:2px 10px;border-radius:12px;font-weight:600;display:inline-block;margin-right:4px;">🌧️ Weather Affected</span>';
      if (isCurtailed) alertHtml += '<span class="pill" style="background:#ff9800;color:#fff;padding:2px 10px;border-radius:12px;font-weight:600;display:inline-block;margin-right:4px;">⚠️ Curtail On</span>';
      if (gridImportTime) alertHtml += '<span class="pill" style="background:#e65100;color:#fff;padding:2px 10px;border-radius:12px;font-weight:600;display:inline-block;margin-right:4px;">⚡ Grid import from ' + gridImportTime + '</span>';
      if (gridExportTime) alertHtml += '<span class="pill" style="background:#28a745;color:#fff;padding:2px 10px;border-radius:12px;font-weight:600;display:inline-block;margin-right:4px;">💲 Grid export from ' + gridExportTime + '</span>';
      if (forceChargeTime) alertHtml += '<span class="pill" style="background:' + (gridImportTime ? '#28a745' : '#f44336') + ';color:#fff;padding:2px 10px;border-radius:12px;font-weight:600;display:inline-block;margin-right:4px;">🔋 Force charge from ' + forceChargeTime + '</span>';
      if (forceDischargeTime) alertHtml += '<span class="pill" style="background:' + (gridExportTime ? '#28a745' : '#ff9800') + ';color:#fff;padding:2px 10px;border-radius:12px;font-weight:600;display:inline-block;">🔋 Force discharge from ' + forceDischargeTime + '</span>';
      
      // Prepend ALERTS: label in red if there are alerts
      if (alertHtml) {
        alertHtml = '<span style="color:#f44336;font-weight:bold;margin-right:8px;">ALERTS:</span>' + alertHtml;
      }
      
      alertEl.innerHTML = alertHtml;
      alertEl.style.display = this._activeTab === 'future' && alertHtml ? 'flex' : 'none';
      if (alertEl.style.display === 'flex') alertEl.style.gap = '4px';
    }

    // ── Single-pass day totals: accumulate while iterating ──
    // Build optional loads forecast maps FIRST (needed for day header builder)
    const optionalLoadMaps = [];
    enabledOptionalLoads.forEach(load => {
      if (load.forecastEntity) {
        const map = buildMap(load.forecastEntity, 1);
        optionalLoadMaps.push({
          config: load,
          map: map
        });
      }
    });
    
    // Pre-pass: daily cost and kWh totals (single loop)
    const dailyCosts = {};
    const dailyKwh   = {};
    const dailyOrder = [];  // Track order of first appearance

    for (const row of primaryFc) {
      const ts = new Date(row.time).getTime();
      if (isNaN(ts) || ts < nowTs) continue;
      const dayStr = new Date(ts).toLocaleDateString('en-CA');
      const battKw  = mapGet(battMap, ts);
      const gridKw  = mapGet(gridMap, ts);
      const loadKw  = mapGet(loadMap, ts);
      const solarKw = mapGet(solarMap, ts);
      const stepH   = stepHFor(ts);
      
      // Retrieve values for dynamic deferrable loads (use nearestGet for timestamp matching)
      const deferLoadValues = [];
      deferLoadMaps.forEach((map, idx) => {
        deferLoadValues[idx] = nearestGet(map, ts) || 0;
      });
      
      // Retrieve values for optional loads
      const optionalLoadsKwValues = [];
      optionalLoadMaps.forEach((item, idx) => {
        optionalLoadsKwValues[idx] = mapGet(item.map, ts);
      });

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
        dailyKwh[dayStr] = { load: 0, deferLoad: 0, pv: 0, gridImp: 0, gridExp: 0, battChg: 0, battDis: 0, ev: 0, ev2: 0 };
        // Initialize keys for dynamic deferrable loads
        this._deferableLoadsConfig.forEach((config, idx) => {
          dailyKwh[dayStr][`deferLoad${idx}`] = 0;
        });
        // Initialize keys for optional loads
        optionalLoadMaps.forEach((config, idx) => {
          dailyKwh[dayStr][`optload${idx}`] = 0;
        });
      }

      dailyCosts[dayStr] += cost;
      const dk = dailyKwh[dayStr];
      dk.load += loadKw  * stepH;
      dk.deferLoad += (mapGet(deferLoadMap, ts)) * stepH;
      
      // Accumulate optional loads kWh
      optionalLoadMaps.forEach((config, idx) => {
        dk[`optload${idx}`] += (optionalLoadsKwValues[idx] || 0) * stepH;
      });
      
      dk.pv   += solarKw * stepH;
      
      // Separate grid into import (positive) and export (negative)
      if (gridKw > 0.05) {
        dk.gridImp += gridKw * stepH;
      } else if (gridKw < -0.05) {
        dk.gridExp += Math.abs(gridKw) * stepH;
      }
      
      // Separate battery into charge (positive) and discharge (negative)
      if (battKw > 0.05) {
        dk.battChg += battKw * stepH;
      } else if (battKw < -0.05) {
        dk.battDis += Math.abs(battKw) * stepH;
      }
      dk.ev   += (mapGet(evPowerMap, ts)) * stepH;
      dk.ev2  += (mapGet(ev2PowerMap, ts)) * stepH;
      
      // Accumulate dynamic deferrable loads
      deferLoadValues.forEach((val, idx) => {
        dk[`deferLoad${idx}`] += val * stepH;
      });
    }

    // Update finances bar with today's data and actual sensors
    const todayDailyCost = dailyCosts[todayStr] || null;
    const todayKwh = dailyKwh[todayStr] || { gridImp: 0, gridExp: 0, battChg: 0, battDis: 0 };
    
    // Read actual energy sensors for imported/exported (with user-configured defaults)
    const dailyImportSensor = loadEntityConfig.grid?.dailyImport || 'sensor.sigen_plant_daily_grid_import_energy';
    const dailyExportSensor = loadEntityConfig.grid?.dailyExport || 'sensor.sigen_plant_daily_grid_export_energy';
    
    const dailyImportedEnergySensor = this._hass?.states[dailyImportSensor]?.state || null;
    const dailyExportedEnergySensor = this._hass?.states[dailyExportSensor]?.state || null;
    const dailyImportedFmt = dailyImportedEnergySensor ? parseFloat(dailyImportedEnergySensor).toFixed(3) + ' kWh' : todayKwh.gridImp.toFixed(3) + ' kWh';
    const dailyExportedFmt = dailyExportedEnergySensor ? parseFloat(dailyExportedEnergySensor).toFixed(3) + ' kWh' : todayKwh.gridExp.toFixed(3) + ' kWh';
    
    const financesBar = this.shadowRoot.getElementById('finances-bar-future');
    if (financesBar) {
      financesBar.innerHTML = _haeo_buildFinancesBar(nowBuy, nowSell, todayDailyCost, todayKwh.gridImp, todayKwh.gridExp, dailyImportedFmt, dailyExportedFmt, this._displaySettings?.priceDecimals || 4);
    }

    // ── Build day header row ──
    const _buildDayHeaderRow = (day) => {
      const dayTotal = dailyCosts[day] || 0;
      let defaultDk = { load:0, deferLoad:0, pv:0, gridImp:0, gridExp:0, battChg:0, battDis:0, ev:0, ev2:0 };
      // Add optional load fields to default
      optionalLoadMaps.forEach((config, idx) => {
        defaultDk[`optload${idx}`] = 0;
      });
      const dk       = dailyKwh[day]  || defaultDk;
      const dayColor = dayTotal <= 0 ? '#4caf50' : '#f44336';
      const dayLabel = day === todayStr ? '📅 Today' : '📅 ' + new Date(day + 'T00:00:00').toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' });
      const dayCostLabel = dayTotal <= 0 ? _HAEO_CUR + Math.abs(dayTotal).toFixed(2) : '-' + _HAEO_CUR + dayTotal.toFixed(2);
      const _kwDp2 = this._displaySettings?.kwDecimals || 3;
      const _kwhDp2 = this._displaySettings?.kwhDecimals || 3;
      const fmtKd = (v) => Math.abs(v) > 0.001 ? (v < 0 ? '-' : '') + Math.abs(v).toFixed(_kwhDp2) : '—';
      const fmtImp = (v) => Math.abs(v) > 0.001 ? '<span style="color:#f44336;">' + v.toFixed(_kwhDp2) + '</span>' : '—';
      const fmtExp = (v) => Math.abs(v) > 0.001 ? '<span style="color:#4caf50;">' + v.toFixed(_kwhDp2) + '</span>' : '—';
      const fmtBattChg = (v) => Math.abs(v) > 0.001 ? '<span style="color:#4caf50;">' + v.toFixed(_kwhDp2) + '</span>' : '—';
      const fmtBattDis = (v) => Math.abs(v) > 0.001 ? '<span style="color:#f44336;">' + v.toFixed(_kwhDp2) + '</span>' : '—';
      
      // Row 1: Load, PV, Grid Import, Battery Charge
      let html = '<tr class="dr" style="border-bottom:1px solid var(--divider-color,#444);">' +
        '<td colspan="2">' + dayLabel + '</td>' +
        '<td class="bgl" colspan="2"></td>' +
        (_showTotalLoad ? '<td class="bgl"></td><td class="bgi" style="text-align:right;font-weight:bold;">' + fmtKd(dk.load + (columnSettings.deferLoad !== false ? dk.deferLoad : 0) + (columnSettings.ev !== false ? (dk.evChg || 0) : 0) + (columnSettings.ev2 !== false ? (dk.ev2Chg || 0) : 0) + Object.keys(dk).filter(k => k.startsWith('optload')).reduce((s,k) => s + dk[k], 0)) + '</td>' : '') +
        '<td class="bgl"></td>' +
        '<td class="bgi" style="text-align:right;">' + fmtKd(dk.load) + '</td>';
      
      // Add Def. Loads toggle column (single entity, not multiple presets)
      if (columnSettings.deferLoad !== false) {
        html += '<td class="bgl"></td>';
        if (loadEntityConfig.deferLoad?.showKwh !== false) html += '<td class="bgi" style="text-align:right;">—</td>';
      }
      
      // Add optional loads columns
      optionalLoadMaps.forEach((config, idx) => {
        html += '<td class="bgl"></td>';
        const optLoad = enabledOptionalLoads[idx];
        if (optLoad?.showKwh !== false) html += '<td class="bgi" style="text-align:right;">' + (dk[`optload${idx}`] > 0 ? fmtKd(dk[`optload${idx}`]) : '—') + '</td>';
      });
      
      html += '<td class="bgl"></td>' +
        '<td class="bgi" style="text-align:right;">' + fmtKd(dk.pv) + '</td>' +
        '<td class="bgl" style="font-weight:bold;font-size:9px;color:#666;">Import:</td>' +
        '<td class="bgi" style="text-align:right;">' + fmtImp(dk.gridImp) + '</td>' +
        '<td class="bgl" style="font-weight:bold;font-size:9px;color:#666;">Charge:</td>' +
        '<td class="bgi" style="text-align:right;">' + fmtBattChg(dk.battChg) + '</td>' +
        '<td class="bgi"></td>';
      if (columnSettings.ev !== false) {
        html += '<td class="bgl"></td><td class="bgi" style="text-align:right;">—</td><td class="bgi"></td>';
      }
      if (columnSettings.ev2 !== false) {
        html += '<td class="bgl"></td><td class="bgi" style="text-align:right;">—</td><td class="bgi"></td>';
      }
      html += '<td class="bgl" style="text-align:right;color:' + dayColor + ';">' + dayCostLabel + '</td></tr>';
      
      // Row 2: Export and Discharge totals
      let row2 = '<tr class="dr" style="border-top:1px solid var(--divider-color,#444);">' +
        '<td colspan="2"></td>' +
        '<td class="bgl" colspan="2"></td>' +
        (_showTotalLoad ? '<td class="bgl"></td><td></td>' : '') +
        '<td class="bgl"></td>' +
        '<td></td>';
      
      if (columnSettings.deferLoad !== false) {
        row2 += '<td></td><td></td>';
      }
      
      optionalLoadMaps.forEach((config, idx) => {
        row2 += '<td></td><td></td>';
      });
      
      row2 += '<td class="bgl"></td>' +
        '<td class="bgi"></td>' +
        '<td class="bgl" style="font-weight:bold;font-size:9px;color:#666;">Export:</td>' +
        '<td class="bgi" style="text-align:right;">' + fmtExp(dk.gridExp) + '</td>' +
        '<td class="bgl" style="font-weight:bold;font-size:9px;color:#666;">Disch.:</td>' +
        '<td class="bgi" style="text-align:right;">' + fmtBattDis(dk.battDis) + '</td>' +
        '<td class="bgi"></td>';
      if (columnSettings.ev !== false) {
        row2 += '<td class="bgl"></td><td class="bgi"></td><td class="bgi"></td>';
      }
      if (columnSettings.ev2 !== false) {
        row2 += '<td class="bgl"></td><td class="bgi"></td><td class="bgi"></td>';
      }
      row2 += '<td class="bgl"></td></tr>';
      
      return html + row2;
    };

    // ── Table rows: single pass with day header injection ──
    const rows = [];
    let lastDay = '';
    
    // Capture this context for use in row building
    const columnSettings = this._columnSettings;
    const _showTotalLoad = columnSettings.deferLoad !== false || columnSettings.ev !== false || columnSettings.ev2 !== false || enabledOptionalLoads.length > 0;

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
      const battKw  = mapGet(battMap, ts);
      const gridKw  = mapGet(gridMap, ts);
      const loadKw  = mapGet(loadMap, ts);
      const solarKw = mapGet(solarMap, ts);
      const soc     = socMap.get(ts)        || 0;
      const deferLoadKw = mapGet(deferLoadMap, ts);
      
      // Retrieve values for dynamic deferrable loads (use nearestGet for timestamp matching)
      const deferLoadValues = [];
      deferLoadMaps.forEach((map, idx) => {
        const val = nearestGet(map, ts) || 0;
        deferLoadValues[idx] = val;
      });
      
      const evKw    = mapGet(evPowerMap, ts);
      const evSoc   = evSocMap.get(ts)      || 0;
      const ev2Kw   = mapGet(ev2PowerMap, ts);
      const ev2Soc  = ev2SocMap.get(ts)     || 0;
      
      // Build optional loads values for this timestamp
      const optionalLoadsKwValues = [];
      optionalLoadMaps.forEach((item, idx) => {
        const val = item.map.get(ts) || 0;
        optionalLoadsKwValues[idx] = val;
        if (idx === 0) {
        }
      });
      if (optionalLoadsKwValues.length > 0 && optionalLoadsKwValues[0] > 0) {
      }
      
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

      const cls = _haeo_classifyFuture(solarKw, loadKw, battKw, gridKw, evKw, deferLoadKw, ev2Kw, optionalLoadsKwValues, enabledOptionalLoads);
      const c   = this._colorSettings[cls.color] || _HAEO_COLOURS[cls.color] || { bg: 'transparent', txt: 'var(--primary-text-color)', cost: 'var(--primary-text-color)' };

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
      const _kwDp = this._displaySettings?.kwDecimals || 3;
      const _kwhDp = this._displaySettings?.kwhDecimals || 3;
      const fmtKwh   = (v) => Math.abs(v * stepH) > 0.0001 ? (v * stepH).toFixed(_kwhDp) : '—';
      const fmtKwhC  = (v, col) => {
        const kwh = v * stepH;
        if (Math.abs(kwh) <= 0.0001) return '—';
        return '<span style="color:' + col + ';">' + kwh.toFixed(_kwhDp) + '</span>';
      };
      
      // Build deferrable load label (single entity now, not multiple presets)
      let deferLoadLabel = '';
      const totalDeferLoad = deferLoadValues.reduce((sum, val) => sum + val, 0);
      if (totalDeferLoad >= 0.05) {
        deferLoadLabel = ' ⏰';
      }
      
      const eventLabel = cls.label + deferLoadLabel;
      
      // Get detailed description from _HAEO_DESCRIPTIONS
      const detailedDesc = _HAEO_DESCRIPTIONS[eventLabel] || _HAEO_DESCRIPTIONS[cls.label] || cls.note || 'Energy flow event';
      
      // Collect event labels for dynamic legend (FUTURE tab)
      if (!this._futureEvents) this._futureEvents = {};
      if (!this._futureEvents[eventLabel]) {
        this._futureEvents[eventLabel] = true;
      }

      rows.push('<tr style="background-color:' + c.bg + ';color:' + textColor + ';">' +
        '<td>' + timeStr + '</td>' +
        '<td><span title="' + detailedDesc.replace(/"/g, '&quot;') + '">' + eventLabel + '</span></td>' +
        '<td class="bgl">' + _haeo_fmtP(buyP, this._displaySettings?.priceDecimals || 4)   + '</td>' +
        '<td class="bgi">' + _haeo_fmtP(sellP, this._displaySettings?.priceDecimals || 4)  + '</td>' +
        // Total Load = base + deferLoad + all enabled optional loads
        (() => {
          if (!_showTotalLoad) return '';
          const totalLoadKw = loadKw
            + (columnSettings.deferLoad !== false ? deferLoadKw : 0)
            + (columnSettings.ev !== false ? mapGet(evPowerMap, ts) : 0)
            + (columnSettings.ev2 !== false ? mapGet(ev2PowerMap, ts) : 0)
            + optionalLoadsKwValues.reduce((s, v) => s + v, 0);
          return '<td class="bgl" style="font-weight:bold;">' + totalLoadKw.toFixed(_kwDp) + '</td>' +
                 '<td class="bgi" style="font-weight:bold;">' + fmtKwh(totalLoadKw) + '</td>';
        })() +
        '<td class="bgl">' + loadKw.toFixed(_kwDp)  + '</td>' +
        '<td class="bgi">' + fmtKwh(loadKw)     + '</td>' +
        // Def. Loads toggle column (single entity, not multiple presets)
        (columnSettings.deferLoad !== false ? (
          '<td class="bgl">' + (deferLoadKw >= 0.05 ? deferLoadKw.toFixed(_kwDp) : '—') + '</td>' +
          (loadEntityConfig.deferLoad?.showKwh !== false ? '<td class="bgi">' + (deferLoadKw >= 0.05 ? fmtKwh(deferLoadKw) : '—') + '</td>' : '')
        ) : '') +
        // Optional loads columns
        optionalLoadMaps.map((item, idx) => {
          const optKw = optionalLoadsKwValues[idx] || 0;
          const optThreshold = (this._thresholdSettings['optload'] || 10) / 1000;
          const optLoad = enabledOptionalLoads[idx];
          return '<td class="bgl">' + (optKw > optThreshold ? optKw.toFixed(_kwDp) : '—') + '</td>' +
                 (optLoad?.showKwh !== false ? '<td class="bgi">' + (optKw > optThreshold ? fmtKwh(optKw) : '—') + '</td>' : '');
        }).join('') +
        '<td class="bgl">' + (solarKw >= 0.05 ? solarKw.toFixed(_kwDp) : '—') + '</td>' +
        '<td class="bgi">' + (solarKw >= 0.05 ? fmtKwh(solarKw) : '—') + '</td>' +
        '<td class="bgl">' + (Math.abs(gridKw) >= 0.1 ? '<span style="color:' + gridCol + ';">' + gridKw.toFixed(_kwDp) + '</span>' : '—') + '</td>' +
        '<td class="bgi">' + (Math.abs(gridKw) >= 0.1 ? fmtKwhC(gridKw, gridCol) : '—') + '</td>' +
        '<td class="bgl">' + (Math.abs(battDisplay) >= 0.1 ? '<span style="color:' + battCol + ';">' + battDisplay.toFixed(_kwDp) + '</span>' : '—') + '</td>' +
        '<td class="bgi">' + (Math.abs(battDisplay) >= 0.1 ? '<span style="color:' + battCol + ';">' + fmtKwh(battDisplay) + '</span>' : '—') + '</td>' +
        '<td class="bgi"><span style="color:' + socCol + ';">' + soc.toFixed(1) + '</span></td>' +
        (columnSettings.ev !== false ? 
          '<td class="bgl">' + (evSensorsExist ? (Math.abs(evDisplay) >= 0.1 ? '<span style="color:' + evCol + ';">' + evDisplay.toFixed(_kwDp) + '</span>' : '—') : 'x') + '</td>' +
          (loadEntityConfig.ev?.showKwh !== false ? '<td class="bgi">' + (evSensorsExist ? (Math.abs(evDisplay) >= 0.1 ? '<span style="color:' + evCol + ';">' + fmtKwh(evDisplay) + '</span>' : '—') : 'x') + '</td>' : '') +
          '<td class="bgi"><span style="color:' + (evSoc <= 20 ? '#f44336' : evSoc >= 80 ? '#4caf50' : textColor) + ';">' + (evSensorsExist ? (evSoc > 0 ? evSoc.toFixed(1) : '—') : 'x') + '</span></td>'
          : '') +
        (columnSettings.ev2 !== false ?
          '<td class="bgl">' + (ev2SensorsExist ? (Math.abs(ev2Display) >= 0.1 ? '<span style="color:' + ev2Col + ';">' + ev2Display.toFixed(_kwDp) + '</span>' : '—') : 'x') + '</td>' +
          (loadEntityConfig.ev2?.showKwh !== false ? '<td class="bgi">' + (ev2SensorsExist ? (Math.abs(ev2Display) >= 0.1 ? '<span style="color:' + ev2Col + ';">' + fmtKwh(ev2Display) + '</span>' : '—') : 'x') + '</td>' : '') +
          '<td class="bgi"><span style="color:' + (ev2Soc <= 20 ? '#f44336' : ev2Soc >= 80 ? '#4caf50' : textColor) + ';">' + (ev2SensorsExist ? (ev2Soc > 0 ? ev2Soc.toFixed(1) : '—') : 'x') + '</span></td>'
          : '') +
        '<td class="bgl"><span style="color:' + costColor + ';font-weight:bold;">' + costFmt.disp + '</span></td>' +
        '</tr>');
    }

    tbody.innerHTML = rows.length ? rows.join('') : '<tr><td colspan="' + (16 + (this._deferableLoadsConfig.length * 2) + (columnSettings.ev !== false ? 3 : 0) + (columnSettings.ev2 !== false ? 3 : 0)) + '" class="msg">No future forecast rows available.</td></tr>';
    
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

      // Decimal place settings for Past render
      const _kwDp  = this._displaySettings?.kwDecimals  || 3;
      const _kwhDp = this._displaySettings?.kwhDecimals || 3;

      // Load saved entity configuration (with defaults as fallback)
      const loadEntityConfig = this._loadLoadEntitiesConfig();
      const enabledOptionalLoads = this._getEnabledOptionalLoads();

      // Past power sensors — actual inverter measurements (with saved entity overrides)
      const powerSensors = [
        this._eid('past_battery_power'),
        this._eid('past_load_power'),
        this._eid('past_solar_power'),
        this._eid('past_grid_power'),
        this._eid('haeo_soc'),
        this._eid('haeo_buy_price'),
        this._eid('haeo_sell_price'),
        loadEntityConfig.deferrable?.historical || this._eid('past_deferrable_load'),
        loadEntityConfig.ev.historical || this._eid('haeo_ev_power'),
        this._eid('haeo_ev_soc'),
        loadEntityConfig.ev2.historical || this._eid('haeo_ev2_power'),
        this._eid('haeo_ev2_soc'),
        // Add EV1 fallback sensors to lookup (in case primary doesn't exist)
        this._config['entity_haeo_ev1_power'] || _HAEO_DEFAULTS['haeo_ev1_power'],
        this._config['entity_haeo_ev1_soc'] || _HAEO_DEFAULTS['haeo_ev1_soc'],
        // Add optional load historical entities
        ...enabledOptionalLoads.map(load => load.historicalEntity).filter(e => e)
      ];
      
      // Deferrable load historical entity is already included above from loadEntityConfig
      
      // Energy sensors for kWh delta columns
      const energySensors = [
        this._eid('past_load_energy'),
        this._eid('past_solar_energy'),
        this._eid('past_grid_import_energy'),
        this._eid('past_grid_export_energy'),
        this._eid('past_battery_charge_energy'),
        this._eid('past_battery_discharge_energy'),
      ];
      
      // Add configured deferrable load historical entities (for energy totals if available)
      this._deferableLoadsConfig.forEach((config) => {
        if (config.historicalEntityId) {
          energySensors.push(config.historicalEntityId);
        }
      });
      
      // Add configured optional load energy entities
      enabledOptionalLoads.forEach((config) => {
        if (config.energyEntity) {
          energySensors.push(config.energyEntity);
        }
      });

      // Check if EV sensors exist
      const evSensorsExist = this._evSensorExists('haeo_ev_power') && this._evSensorExists('haeo_ev_soc');
      const ev2SensorsExist = this._evSensorExists('haeo_ev2_power') && this._evSensorExists('haeo_ev2_soc');
      const deferLoadSensorExists = this._evSensorExists('past_deferrable_load');

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
        deferLoad: _haeo_powerMult(this._hass, this._eid('past_deferrable_load')),
        ev:      _haeo_powerMult(this._hass, this._eid('haeo_ev_power')),
        ev2:     _haeo_powerMult(this._hass, this._eid('haeo_ev2_power')),
      };

      // Apply invert flow flags — negate the multiplier for any load with invert=true
      const _invertConfig = this._loadLoadEntitiesConfig();
      if (_invertConfig.base?.invert)     this._pwrMult.load     *= -1;
      if (_invertConfig.pv?.invert)       this._pwrMult.solar    *= -1;
      if (_invertConfig.grid?.invert)     this._pwrMult.grid     *= -1;
      if (_invertConfig.battery?.invert)  this._pwrMult.battery  *= -1;
      if (_invertConfig.ev?.invert)       this._pwrMult.ev       *= -1;
      if (_invertConfig.ev2?.invert)      this._pwrMult.ev2      *= -1;
      if (_invertConfig.deferLoad?.invert) this._pwrMult.deferLoad *= -1;
      
      // Add multipliers for each configured deferrable load
      this._deferableLoadsConfig.forEach((config, idx) => {
        if (config.historicalEntityId) {
          this._pwrMult[`deferLoad${idx}`] = _haeo_powerMult(this._hass, config.historicalEntityId);
        }
      });
      
      this._engMult = {
        past_load_energy:              _haeo_energyMult(this._hass, this._eid('past_load_energy')),
        past_solar_energy:             _haeo_energyMult(this._hass, this._eid('past_solar_energy')),
        past_grid_import_energy:       _haeo_energyMult(this._hass, this._eid('past_grid_import_energy')),
        past_grid_export_energy:       _haeo_energyMult(this._hass, this._eid('past_grid_export_energy')),
        past_battery_charge_energy:    _haeo_energyMult(this._hass, this._eid('past_battery_charge_energy')),
        past_battery_discharge_energy: _haeo_energyMult(this._hass, this._eid('past_battery_discharge_energy')),
        past_deferrable_load:          _haeo_energyMult(this._hass, this._eid('past_deferrable_load')),
        haeo_ev_energy:                _haeo_energyMult(this._hass, this._eid('haeo_ev_energy')),
        haeo_ev2_energy:               _haeo_energyMult(this._hass, this._eid('haeo_ev2_energy')),
      };
      
      // Add multipliers for each configured deferrable load energy
      this._deferableLoadsConfig.forEach((config, idx) => {
        if (config.historicalEntityId) {
          this._engMult[`deferLoad${idx}_energy`] = _haeo_energyMult(this._hass, config.historicalEntityId);
        }
      });

      // Convert threshold from watts to kW for comparisons
      const _thresholdKw = (colName) => {
        const threshW = this._thresholdSettings[colName] || 0;
        return threshW / 1000;  // Convert watts to kW
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
        const deferLoadKw = (parseFloat(_haeo_getAt(lookup[this._eid('past_deferrable_load')], ts)) || 0) * this._pwrMult.deferLoad;
        const evKw   = (parseFloat(_haeo_getAt(lookup[this._eid('haeo_ev_power')],      ts)) || 0) * this._pwrMult.ev;
        const ev2Kw  = (parseFloat(_haeo_getAt(lookup[this._eid('haeo_ev2_power')],     ts)) || 0) * this._pwrMult.ev2;
        
        // Retrieve values for dynamic deferrable loads
        const deferLoadValues = [];
        this._deferableLoadsConfig.forEach((config, idx) => {
          if (config.historicalEntityId && lookup[config.historicalEntityId]) {
            deferLoadValues[idx] = (parseFloat(_haeo_getAt(lookup[config.historicalEntityId], ts)) || 0) * this._pwrMult[`deferLoad${idx}`];
          } else {
            deferLoadValues[idx] = 0;
          }
        });
        
        const buyP   = parseFloat(_haeo_getAt(lookup[this._eid('haeo_buy_price')],     ts)) || 0;
        const sellP  = parseFloat(_haeo_getAt(lookup[this._eid('haeo_sell_price')],    ts)) || 0;
        const stepH  = 5 / 60;

        const importing = gridKw > 0.1;
        const exporting = gridKw < -0.1;
        const cost = importing ? Math.abs(gridKw) * buyP * stepH : exporting ? gridKw * sellP * stepH : 0;

        if (!pastDailyCosts.hasOwnProperty(dayStr)) {
          pastDailyOrder.push(dayStr);
          pastDailyCosts[dayStr] = 0;
          const dailyKwhObj = { 
            load: 0, deferLoad: 0, pv: 0, 
            gridImp: 0, gridExp: 0, 
            battChg: 0, battDis: 0, 
            evChg: 0, evDis: 0, 
            ev2Chg: 0, ev2Dis: 0
          };
          // Add dynamic deferrable load tracking
          this._deferableLoadsConfig.forEach((config, idx) => {
            dailyKwhObj[`deferLoad${idx}`] = 0;
          });
          // Add optional loads tracking
          enabledOptionalLoads.forEach((config, idx) => {
            dailyKwhObj[`optload${idx}`] = 0;
          });
          pastDailyKwh[dayStr] = dailyKwhObj;
        }

        pastDailyCosts[dayStr] += cost;
        const dk = pastDailyKwh[dayStr];
        dk.load += loadKw  * stepH;
        dk.deferLoad += deferLoadKw * stepH;
        
        // Accumulate dynamic deferrable loads
        deferLoadValues.forEach((val, idx) => {
          dk[`deferLoad${idx}`] += val * stepH;
        });
        
        // Accumulate optional loads energy deltas
        const prevTs = ts - (5 * 60 * 1000);  // 5-minute interval in milliseconds
        enabledOptionalLoads.forEach((config, idx) => {
          if (config.energyEntity && lookup[config.energyEntity]) {
            const energyMult = _haeo_energyMult(this._hass, config.energyEntity);
            const energyDelta = _haeo_getDelta(lookup[config.energyEntity], ts, prevTs, energyMult);
            dk[`optload${idx}`] += energyDelta;
          }
        });
        
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

      // ── Build 2-row day header (Row 1: Import/Charge totals; Row 2: Export/Discharge totals) ──
      const _buildDayHeaderRowPast = (day) => {
        const dayTotal = pastDailyCosts[day] || 0;
        let defaultDk = { load:0, deferLoad:0, pv:0, gridImp:0, gridExp:0, battChg:0, battDis:0, evChg:0, evDis:0, ev2Chg:0, ev2Dis:0 };
        // Add optional load fields to default
        enabledOptionalLoads.forEach((config, idx) => {
          defaultDk[`optload${idx}`] = 0;
        });
        const dk = pastDailyKwh[day] || defaultDk;
        const dayColor = dayTotal <= 0 ? '#4caf50' : '#f44336';
        const dayCostLbl = dayTotal <= 0 ? _HAEO_CUR + Math.abs(dayTotal).toFixed(2) : '-' + _HAEO_CUR + dayTotal.toFixed(2);
        const _kwDp3 = this._displaySettings?.kwDecimals || 3;
        const _kwhDp3 = this._displaySettings?.kwhDecimals || 3;
        const fmtKd = (v) => Math.abs(v) > 0.001 ? v.toFixed(_kwhDp3) : '—';
        const fmtImp = (v) => Math.abs(v) > 0.001 ? '<span style="color:#f44336;">' + v.toFixed(_kwhDp3) + '</span>' : '—';
        const fmtExp = (v) => Math.abs(v) > 0.001 ? '<span style="color:#4caf50;">' + v.toFixed(_kwhDp3) + '</span>' : '—';
        const fmtBattChg = (v) => Math.abs(v) > 0.001 ? '<span style="color:#4caf50;">' + v.toFixed(_kwhDp3) + '</span>' : '—';
        const fmtBattDis = (v) => Math.abs(v) > 0.001 ? '<span style="color:#f44336;">' + v.toFixed(_kwhDp3) + '</span>' : '—';
        const fmtEV = (v) => Math.abs(v) > 0.001 ? '<span style="color:#4caf50;">' + v.toFixed(_kwhDp3) + '</span>' : '—';
        
        let row1 = '<tr class="dr" style="border-bottom:1px solid var(--divider-color,#444);">' +
          '<td colspan="2">📅 ' + day + '</td>' +
          '<td class="bgl" colspan="2"></td>' +
          (_showTotalLoad ? '<td class="bgl"></td><td class="bgi" style="text-align:right;font-weight:bold;">' + fmtKd(dk.load + (columnSettings.deferLoad !== false ? dk.deferLoad : 0) + (columnSettings.ev !== false ? (dk.evChg || 0) : 0) + (columnSettings.ev2 !== false ? (dk.ev2Chg || 0) : 0) + Object.keys(dk).filter(k => k.startsWith('optload')).reduce((s,k) => s + dk[k], 0)) + '</td>' : '') +
          '<td class="bgl"></td>' +
          '<td class="bgi" style="text-align:right;">' + fmtKd(dk.load) + '</td>';
        
        // Def. Loads toggle column and optional load cells - Row 1 (only if enabled)
        if (columnSettings.deferLoad !== false) {
          row1 += '<td class="bgl"></td>';
          if (loadEntityConfig.deferLoad?.showKwh !== false) row1 += '<td class="bgi" style="text-align:right;">—</td>';
          this._deferableLoadsConfig.forEach((config, idx) => {
            row1 += '<td class="bgl"></td><td class="bgi" style="text-align:right;">' + fmtKd(dk[`deferLoad${idx}`]) + '</td>';
          });
        }
        
        // Optional loads columns - display accumulated daily energy
        enabledOptionalLoads.forEach((config, idx) => {
          const optEnergy = dk[`optload${idx}`] || 0;
          row1 += '<td class="bgl"></td>';
          if (config.showKwh !== false) row1 += '<td class="bgi" style="text-align:right;">' + fmtKd(optEnergy) + '</td>';
        });
        
        row1 += '<td class="bgl"></td>' +
          '<td class="bgi" style="text-align:right;">' + fmtKd(dk.pv) + '</td>' +
          '<td class="bgl" style="font-weight:bold;font-size:9px;color:#666;">Import:</td>' +
          '<td class="bgi" style="text-align:right;">' + fmtImp(dk.gridImp) + '</td>' +
          '<td class="bgl" style="font-weight:bold;font-size:9px;color:#666;">Charge:</td>' +
          '<td class="bgi" style="text-align:right;">' + fmtBattChg(dk.battChg) + '</td>' +
          '<td class="bgi"></td>';
        if (columnSettings.ev !== false) {
          row1 += '<td class="bgl" style="font-weight:bold;font-size:9px;color:#666;">Charge:</td>';
          if (loadEntityConfig.ev?.showKwh !== false) row1 += '<td class="bgi" style="text-align:right;">' + fmtEV(dk.evChg) + '</td>';
          row1 += '<td class="bgi"></td>';
        }
        if (columnSettings.ev2 !== false) {
          row1 += '<td class="bgl" style="font-weight:bold;font-size:9px;color:#666;">Charge:</td>';
          if (loadEntityConfig.ev2?.showKwh !== false) row1 += '<td class="bgi" style="text-align:right;">' + fmtEV(dk.ev2Chg) + '</td>';
          row1 += '<td class="bgi"></td>';
        }
        row1 += '<td class="bgl" style="text-align:right;color:' + dayColor + ';">' + dayCostLbl + '</td></tr>';
        
        // Row 2 - Export / Discharge totals
        let row2 = '<tr class="dr" style="border-top:1px solid var(--divider-color,#444);">' +
          '<td colspan="2"></td>' +
          '<td class="bgl" colspan="2"></td>' +
          (_showTotalLoad ? '<td class="bgl"></td><td></td>' : '') +
          '<td class="bgl"></td>' +
          '<td></td>';
        
        // Def. Loads toggle column - Row 2 (empty cells to maintain alignment, only if enabled)
        if (columnSettings.deferLoad !== false) {
          row2 += '<td></td><td></td>';
        }
        
        // Optional loads columns - Row 2 (empty cells to maintain alignment)
        enabledOptionalLoads.forEach((config, idx) => {
          row2 += '<td></td><td></td>';
        });
        
        row2 += '<td></td>' +
          '<td></td>' +
          '<td class="bgl" style="font-weight:bold;font-size:9px;color:#666;">Export:</td>' +
          '<td class="bgi" style="text-align:right;">' + fmtExp(dk.gridExp) + '</td>' +
          '<td class="bgl" style="font-weight:bold;font-size:9px;color:#666;">Disch:</td>' +
          '<td class="bgi" style="text-align:right;">' + fmtBattDis(dk.battDis) + '</td>' +
          '<td class="bgi"></td>';
        if (columnSettings.ev !== false) {
          row2 += '<td class="bgl" style="font-weight:bold;font-size:9px;color:#666;">Disch:</td>';
          if (loadEntityConfig.ev?.showKwh !== false) row2 += '<td class="bgi" style="text-align:right;">' + fmtEV(dk.evDis) + '</td>';
          row2 += '<td></td>';
        }
        if (columnSettings.ev2 !== false) {
          row2 += '<td class="bgl" style="font-weight:bold;font-size:9px;color:#666;">Disch:</td>';
          if (loadEntityConfig.ev2?.showKwh !== false) row2 += '<td class="bgi" style="text-align:right;">' + fmtEV(dk.ev2Dis) + '</td>';
          row2 += '<td></td>';
        }
        row2 += '<td></td></tr>';
        return row1 + row2;
      };

      // ── Pass 2: render rows with day header injection ──
      const rows = [];
      let lastDay = '';
      
      // Capture this context for use in row building
      const columnSettings = this._columnSettings;
      const _showTotalLoad = columnSettings.deferLoad !== false || columnSettings.ev !== false || columnSettings.ev2 !== false || enabledOptionalLoads.length > 0;

      for (const ts of entries) {
        const dt      = new Date(ts);
        const dayStr  = dt.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
        const timeStr = dt.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', hour12: false });
        
        // Calculate prevTs early so we can compute energy deltas before day header
        const prevTs  = ts - step;

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
        const deferLoadKw = (parseFloat(_haeo_getAt(lookup[this._eid('past_deferrable_load')], ts)) || 0) * this._pwrMult.deferLoad;
        const soc     = parseFloat(_haeo_getAt(lookup[this._eid('haeo_soc')],           ts)) || 0;
        const buyP    = parseFloat(_haeo_getAt(lookup[this._eid('haeo_buy_price')],     ts)) || 0;
        const sellP   = parseFloat(_haeo_getAt(lookup[this._eid('haeo_sell_price')],    ts)) || 0;
        const evKw    = parseFloat(_haeo_getAt(lookup[this._eid('haeo_ev_power')],      ts)) || 0;
        const evSoc   = parseFloat(_haeo_getAt(lookup[this._eid('haeo_ev_soc')],        ts)) || 0;
        const ev2Kw   = parseFloat(_haeo_getAt(lookup[this._eid('haeo_ev2_power')],     ts)) || 0;
        const ev2Soc  = parseFloat(_haeo_getAt(lookup[this._eid('haeo_ev2_soc')],       ts)) || 0;
        
        // Retrieve values for dynamic deferrable loads
        const deferLoadValues = [];
        this._deferableLoadsConfig.forEach((config, idx) => {
          if (config.historicalEntityId && lookup[config.historicalEntityId]) {
            deferLoadValues[idx] = (parseFloat(_haeo_getAt(lookup[config.historicalEntityId], ts)) || 0) * this._pwrMult[`deferLoad${idx}`];
          } else {
            deferLoadValues[idx] = 0;
          }
        });
        
        // Power values already calculated in pre-pass loop (if pre-pass ran)
        
        // Build optional loads kW values for this timestamp (needed for classification & display)
        const optionalLoadsKwValues = [];
        const optionalLoadsEnergyValues = [];
        enabledOptionalLoads.forEach((config, idx) => {
          // Get power value with unit conversion
          if (config.historicalEntity && lookup[config.historicalEntity]) {
            const rawVal = (parseFloat(_haeo_getAt(lookup[config.historicalEntity], ts)) || 0);
            // Apply power multiplier to convert to kW
            const pwrMult = this._pwrMult[`optload${idx}`] || _haeo_powerMult(this._hass, config.historicalEntity);
            optionalLoadsKwValues[idx] = rawVal * pwrMult;
          } else {
            optionalLoadsKwValues[idx] = 0;
          }
          // Energy will be calculated later after prevTs is defined
          optionalLoadsEnergyValues[idx] = 0;
        });

        // Accumulate optional loads energy for daily totals (done in pre-pass above)
        if (!pastDailyKwh[dayStr]) {
          pastDailyKwh[dayStr] = { load:0, deferLoad:0, pv:0, gridImp:0, gridExp:0, battChg:0, battDis:0, evChg:0, evDis:0, ev2Chg:0, ev2Dis:0 };
          enabledOptionalLoads.forEach((config, idx) => {
            pastDailyKwh[dayStr][`optload${idx}`] = 0;
          });
        }
        // Note: optional loads accumulation now happens in pre-pass, so no need to accumulate here

        if (soc === 0 && Math.abs(battKw) < 0.01 && Math.abs(gridKw) < 0.01 && loadKw < 0.01 && solarKw < 0.01) continue;

        const cls = _haeo_classifyPast(solarKw, loadKw, battKw, gridKw, evKw, deferLoadKw, ev2Kw, optionalLoadsKwValues, enabledOptionalLoads);
        const c   = this._colorSettings[cls.color] || _HAEO_COLOURS[cls.color] || { bg: '#ffffcc', txt: '#888888', cost: '#888888' };

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

        // Energy kWh deltas from total_increasing sensors (prevTs already defined above)
        const eLoad   = _haeo_getDelta(lookup[this._eid('past_load_energy')],              ts, prevTs, this._engMult.past_load_energy);
        const eSolar  = _haeo_getDelta(lookup[this._eid('past_solar_energy')],             ts, prevTs, this._engMult.past_solar_energy);
        const eDeferLoad = deferLoadKw * (5 / 60);  // Assume 5-minute intervals for Past Events
        
        // Energy deltas for dynamic deferrable loads
        const eDeferLoadValues = [];
        deferLoadValues.forEach((val, idx) => {
          if (this._engMult[`deferLoad${idx}_energy`]) {
            eDeferLoadValues[idx] = _haeo_getDelta(lookup[this._deferableLoadsConfig[idx].historicalEntityId], ts, prevTs, this._engMult[`deferLoad${idx}_energy`]);
          } else {
            eDeferLoadValues[idx] = val * (5 / 60);  // Fallback: assume 5-minute intervals
          }
        });
        
        // Energy deltas for optional loads
        enabledOptionalLoads.forEach((config, idx) => {
          if (config.energyEntity && lookup[config.energyEntity]) {
            const energyMult = _haeo_energyMult(this._hass, config.energyEntity);
            optionalLoadsEnergyValues[idx] = _haeo_getDelta(lookup[config.energyEntity], ts, prevTs, energyMult);
          } else {
            optionalLoadsEnergyValues[idx] = 0;
          }
        });
        
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

        const fmtE = (v) => v !== null && Math.abs(v) > 0.005 ? v.toFixed(_kwhDp) : '—';
        
        // Build deferrable load emoji label (top 2 or generic if 3+)
        let deferLoadLabel = '';
        const totalDeferLoad = deferLoadValues.reduce((sum, val) => sum + val, 0);
        if (totalDeferLoad >= 0.1) {
          deferLoadLabel = ' ⏰';
        }
        
        const eventLabel = cls.label + deferLoadLabel;
        
        // Collect event labels for dynamic legend (PAST tab)
        if (!this._pastEvents) this._pastEvents = {};
        if (!this._pastEvents[eventLabel]) {
          this._pastEvents[eventLabel] = true;
        }
        
        // Get detailed description from _HAEO_DESCRIPTIONS
        const pastDetailedDesc = _HAEO_DESCRIPTIONS[eventLabel] || _HAEO_DESCRIPTIONS[cls.label] || cls.note || 'Recorded sensor values';

        rows.push('<tr style="background-color:' + c.bg + ';color:' + textColor + ';">' +
          '<td>' + timeStr + '</td>' +
          '<td><span title="' + pastDetailedDesc.replace(/"/g, '&quot;') + '">' + eventLabel + '</span></td>' +
          '<td class="bgl">' + _haeo_fmtP(buyP, this._displaySettings?.priceDecimals || 4)   + '</td>' +
          '<td class="bgi">' + _haeo_fmtP(sellP, this._displaySettings?.priceDecimals || 4)  + '</td>' +
          // Total Load = base + deferLoad + all enabled optional loads
          (() => {
            if (!_showTotalLoad) return '';
            const totalLoadKw = loadKw
              + (columnSettings.deferLoad !== false ? deferLoadKw : 0)
              + (columnSettings.ev !== false ? Math.abs(evDisplay) : 0)
              + (columnSettings.ev2 !== false ? Math.abs(ev2Display) : 0)
              + optionalLoadsKwValues.reduce((s, v) => s + v, 0);
            return '<td class="bgl" style="font-weight:bold;">' + (totalLoadKw >= 0.001 ? totalLoadKw.toFixed(_kwDp) : '—') + '</td>' +
                   '<td class="bgi" style="font-weight:bold;">' + (totalLoadKw >= 0.001 ? fmtE(totalLoadKw * stepHB) : '—') + '</td>';
          })() +
          '<td class="bgl">' + (loadKw >= _thresholdKw('load') ? loadKw.toFixed(_kwDp) : '—')  + '</td>' +
          '<td class="bgi">' + (loadKw >= _thresholdKw('load') ? fmtE(eLoad) : '—')  + '</td>' +
          // Def. Loads toggle column (single entity, not multiple presets)
          (columnSettings.deferLoad !== false ? (
            '<td class="bgl">' + (deferLoadKw >= _thresholdKw('deferLoad') ? deferLoadKw.toFixed(_kwDp) : '—') + '</td>' +
            (loadEntityConfig.deferLoad?.showKwh !== false ? '<td class="bgi">' + (deferLoadKw >= _thresholdKw('deferLoad') ? fmtE(eDeferLoad) : '—') + '</td>' : '')
          ) : '') +
          // Optional loads columns
          enabledOptionalLoads.map((config, idx) => {
            const optKw = optionalLoadsKwValues[idx] || 0;
            const optEnergy = optionalLoadsEnergyValues[idx] || 0;
            const optThreshold = (this._thresholdSettings['optload'] || 10) / 1000;
            return '<td class="bgl">' + (optKw > optThreshold ? optKw.toFixed(_kwDp) : '—') + '</td>' +
                   (config.showKwh !== false ? '<td class="bgi">' + (optEnergy > 0.001 ? optEnergy.toFixed(_kwhDp) : '—') + '</td>' : '');
          }).join('') +
          '<td class="bgl">' + (solarKw >= _thresholdKw('pv') ? solarKw.toFixed(_kwDp) : '—') + '</td>' +
          '<td class="bgi">' + (solarKw >= _thresholdKw('pv') ? fmtE(eSolar) : '—') + '</td>' +
          '<td class="bgl">' + (Math.abs(gridKw) >= _thresholdKw('grid') ? '<span style="color:' + gridCol + ';">' + gridKw.toFixed(_kwDp) + '</span>' : '—') + '</td>' +
          '<td class="bgi">' + (Math.abs(gridKw) >= _thresholdKw('grid') && eGrid !== null && Math.abs(eGrid) > 0.005 ? '<span style="color:' + gridCol + ';">' + eGrid.toFixed(3) + '</span>' : '—') + '</td>' +
          '<td class="bgl">' + (Math.abs(battDisplay) >= _thresholdKw('battery') ? '<span style="color:' + battCol + ';">' + battDisplay.toFixed(_kwDp) + '</span>' : '—') + '</td>' +
          '<td class="bgi">' + (Math.abs(battDisplay) >= _thresholdKw('battery') && eBatt !== null && Math.abs(eBatt) > 0.005 ? '<span style="color:' + battCol + ';">' + eBatt.toFixed(3) + '</span>' : '—') + '</td>' +
          '<td class="bgi"><span style="color:' + socCol + ';">' + soc.toFixed(1) + '</span></td>' +
          (columnSettings.ev !== false ?
            '<td class="bgl">' + (evSensorsExist ? (Math.abs(evDisplay) >= _thresholdKw('ev') ? '<span style="color:' + evCol + ';">' + evDisplay.toFixed(_kwDp) + '</span>' : '—') : 'x') + '</td>' +
            (loadEntityConfig.ev?.showKwh !== false ? '<td class="bgi">' + (evSensorsExist ? (Math.abs(evDisplay) >= _thresholdKw('ev') ? '<span style="color:' + evCol + ';">' + fmtE(evDisplay * stepH) + '</span>' : '—') : 'x') + '</td>' : '') +
            '<td class="bgi"><span style="color:' + (evSoc <= 20 ? '#f44336' : evSoc >= 80 ? '#4caf50' : textColor) + ';">' + (evSensorsExist ? (evSoc > 0 ? evSoc.toFixed(1) : '—') : 'x') + '</span></td>'
            : '') +
          (columnSettings.ev2 !== false ?
            '<td class="bgl">' + (ev2SensorsExist ? (Math.abs(ev2Display) >= _thresholdKw('ev2') ? '<span style="color:' + ev2Col + ';">' + ev2Display.toFixed(_kwDp) + '</span>' : '—') : 'x') + '</td>' +
            (loadEntityConfig.ev2?.showKwh !== false ? '<td class="bgi">' + (ev2SensorsExist ? (Math.abs(ev2Display) >= _thresholdKw('ev2') ? '<span style="color:' + ev2Col + ';">' + fmtE(ev2Display * stepH) + '</span>' : '—') : 'x') + '</td>' : '') +
            '<td class="bgi"><span style="color:' + (ev2Soc <= 20 ? '#f44336' : ev2Soc >= 80 ? '#4caf50' : textColor) + ';">' + (ev2SensorsExist ? (ev2Soc > 0 ? ev2Soc.toFixed(1) : '—') : 'x') + '</span></td>'
            : '') +
          '<td class="bgl"><span style="color:' + costColorAdapt + ';font-weight:bold;">' + costFmt.disp + '</span></td>' +
          '</tr>');
      }

      tb.innerHTML = rows.length ? rows.join('') : '<tr><td colspan="' + (16 + (columnSettings.deferLoad !== false ? 2 : 0) + (enabledOptionalLoads.length * 2) + (columnSettings.ev !== false ? 3 : 0) + (columnSettings.ev2 !== false ? 3 : 0)) + '" class="msg">⚠️ No readings for this period.</td></tr>';
      
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

  _openSettingsModal() {
    const modal = this.shadowRoot.getElementById('settings-modal');
    if (!modal) return;
    
    // Populate forms from saved config
    this._populateLoadEntitiesForm();
    this._populateOptionalLoadsForm();
    this._populateEntitiesForm();
    
    // CRITICAL FIX: Delay color picker setup to ensure DOM elements exist
    requestAnimationFrame(() => {
      this._populateColorPickers();
    });
    
    modal.style.display = 'flex';
  }

  _closeSettingsModal() {
    const modal = this.shadowRoot.getElementById('settings-modal');
    if (modal) modal.style.display = 'none';
    
    // After closing modal, refresh the visible table with updated colors
    requestAnimationFrame(() => {
      if (this._activeTab === 'future') {
        this._renderFuture();
      } else {
        this._loadPast();
      }
    });
  }

  _updateTableLayout() {
    // Close settings modal
    const modal = this.shadowRoot.getElementById('settings-modal');
    if (modal) modal.style.display = 'none';
    
    const enabledOptionalLoads = this._getEnabledOptionalLoads();
    // Rebuild colgroup and theads for both tabs
    const _loadCfg = this._loadLoadEntitiesConfig();
    const showKwhConfig = { deferLoad: _loadCfg.deferLoad?.showKwh ?? true, ev: _loadCfg.ev?.showKwh ?? true, ev2: _loadCfg.ev2?.showKwh ?? true };
    const colgroup = _haeo_buildColgroup(this._columnSettings, this._deferableLoadsConfig, enabledOptionalLoads, showKwhConfig);
    const thead_future = _haeo_buildThead(this._columnSettings, this._deferableLoadsConfig, enabledOptionalLoads, 'future', showKwhConfig);
    const thead_past = _haeo_buildThead(this._columnSettings, this._deferableLoadsConfig, enabledOptionalLoads, 'past', showKwhConfig);

    // Update single future table — replace colgroup and thead, preserve tbody
    const futureTable = this.shadowRoot.getElementById('table-future');
    if (futureTable) {
      const oldCg = futureTable.querySelector('colgroup');
      const oldTh = futureTable.querySelector('thead');
      const tmpFuture = document.createElement('table');
      tmpFuture.innerHTML = colgroup + thead_future;
      if (oldCg) oldCg.replaceWith(tmpFuture.querySelector('colgroup'));
      else futureTable.insertBefore(tmpFuture.querySelector('colgroup'), futureTable.firstChild);
      if (oldTh) oldTh.replaceWith(tmpFuture.querySelector('thead'));
      else futureTable.insertBefore(tmpFuture.querySelector('thead'), futureTable.querySelector('tbody'));
    }

    // Update single past table — replace colgroup and thead, preserve tbody
    const pastTable = this.shadowRoot.getElementById('table-past');
    if (pastTable) {
      const oldCg = pastTable.querySelector('colgroup');
      const oldTh = pastTable.querySelector('thead');
      const tmpPast = document.createElement('table');
      tmpPast.innerHTML = colgroup + thead_past;
      if (oldCg) oldCg.replaceWith(tmpPast.querySelector('colgroup'));
      else pastTable.insertBefore(tmpPast.querySelector('colgroup'), pastTable.firstChild);
      if (oldTh) oldTh.replaceWith(tmpPast.querySelector('thead'));
      else pastTable.insertBefore(tmpPast.querySelector('thead'), pastTable.querySelector('tbody'));
    }
    
    // Clear _wired flags on old elements so _wireEvents re-attaches
    const allElements = this.shadowRoot.querySelectorAll('[id]');
    allElements.forEach(el => {
      delete el._wired;
    });
    
    // Rebuild data tables with same new column settings
    if (this._activeTab === 'future') {
      this._renderFuture();
    } else {
      this._loadPast();
    }
    
    // Re-wire event handlers for new DOM elements
    requestAnimationFrame(() => {
      this._wireEvents();
      this._setWrapHeight();
    });
  }

  _openLegendModal() {
    const modal = this.shadowRoot.getElementById('legend-modal');
    if (!modal) return;
    
    // Populate dynamic EV/EV2, optional load, and deferrable load filters
    this._populateEVFilters();
    this._populateOptionalLoadFilters();
    this._populateDeferLoadFilters();
    
    this._populateLegendModal();
    modal.style.display = 'flex';
  }
  
  _populateEVFilters() {
    const filterContainer = this.shadowRoot.getElementById('legend-ev-filters');
    if (!filterContainer) return;
    
    filterContainer.innerHTML = '';
    
    const colSettings = this._columnSettings;
    
    // Only add EV filter if enabled
    if (colSettings.ev !== false) {
      const label = document.createElement('label');
      label.style.display = 'flex';
      label.style.alignItems = 'center';
      label.style.gap = '6px';
      label.style.cursor = 'pointer';
      label.style.fontSize = '12px';
      
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.id = 'filter-ev';
      checkbox.className = 'legend-filter';
      checkbox.checked = true;
      checkbox.style.cursor = 'pointer';
      checkbox.addEventListener('change', () => this._applyLegendFilters());
      
      const text = document.createElement('span');
      text.textContent = '🚗 EV';
      
      label.appendChild(checkbox);
      label.appendChild(text);
      filterContainer.appendChild(label);
    }
    
    // Only add EV2 filter if enabled
    if (colSettings.ev2 !== false) {
      const label = document.createElement('label');
      label.style.display = 'flex';
      label.style.alignItems = 'center';
      label.style.gap = '6px';
      label.style.cursor = 'pointer';
      label.style.fontSize = '12px';
      
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.id = 'filter-ev2';
      checkbox.className = 'legend-filter';
      checkbox.checked = true;
      checkbox.style.cursor = 'pointer';
      checkbox.addEventListener('change', () => this._applyLegendFilters());
      
      const text = document.createElement('span');
      text.textContent = '🚙 EV2';
      
      label.appendChild(checkbox);
      label.appendChild(text);
      filterContainer.appendChild(label);
    }
  }

  _populateOptionalLoadFilters() {
    const filterContainer = this.shadowRoot.getElementById('legend-optload-filters');
    if (!filterContainer) return;
    
    filterContainer.innerHTML = '';
    
    // Only show filters for enabled optional loads
    const enabledOptionalLoads = this._getEnabledOptionalLoads();
    
    enabledOptionalLoads.forEach((config, idx) => {
      const label = document.createElement('label');
      label.style.display = 'flex';
      label.style.alignItems = 'center';
      label.style.gap = '6px';
      label.style.cursor = 'pointer';
      label.style.fontSize = '12px';
      
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.id = `filter-optload${idx}`;
      checkbox.className = 'legend-filter';
      checkbox.checked = true;
      checkbox.style.cursor = 'pointer';
      checkbox.addEventListener('change', () => this._applyLegendFilters());
      
      const displayInfo = _haeo_getOptionalLoadDisplay(config);
      const text = document.createElement('span');
      text.textContent = displayInfo.emoji + ' ' + displayInfo.abbr;
      
      label.appendChild(checkbox);
      label.appendChild(text);
      filterContainer.appendChild(label);
    });
  }

  _populateDeferLoadFilters() {
    const filterContainer = this.shadowRoot.getElementById('legend-defer-filters');
    if (!filterContainer) return;
    
    filterContainer.innerHTML = '';
    
    this._deferableLoadsConfig.forEach((config, idx) => {
      const label = document.createElement('label');
      label.style.display = 'flex';
      label.style.alignItems = 'center';
      label.style.gap = '6px';
      label.style.cursor = 'pointer';
      label.style.fontSize = '12px';
      
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.id = `filter-deferLoad${idx}`;
      checkbox.className = 'legend-filter';
      checkbox.checked = true;
      checkbox.style.cursor = 'pointer';
      checkbox.addEventListener('change', () => this._applyLegendFilters());
      
      const text = document.createElement('span');
      text.textContent = config.emoji + ' ' + config.name;
      
      label.appendChild(checkbox);
      label.appendChild(text);
      filterContainer.appendChild(label);
    });
  }

  _populateLegendModal() {
    const wrap = this.shadowRoot.getElementById('legend-categories-wrap');
    if (!wrap) return;
    
    const categories = {
      'Self Consumption': [],
      'Cost': [],
      'Profit': [],
      'Optional Loads': [],
      'Deferrable Loads': []
    };
    
    // Get enabled column and load settings
    const colSettings = this._columnSettings;
    const evEnabled = colSettings.ev !== false;
    const ev2Enabled = colSettings.ev2 !== false;
    const deferLoadEnabled = colSettings.deferLoad !== false;
    const enabledOptionalLoads = this._getEnabledOptionalLoads();
    
    // Merge FUTURE and PAST events for complete legend
    // Build a map with both event labels and their descriptions
    const eventsMap = {};
    const descMap = {};
    
    if (this._futureEvents) {
      for (const label of Object.keys(this._futureEvents)) {
        eventsMap[label] = true;
        if (this._futureEventDescs && this._futureEventDescs[label]) {
          descMap[label] = this._futureEventDescs[label];
        }
      }
    }
    if (this._pastEvents) {
      for (const label of Object.keys(this._pastEvents)) {
        eventsMap[label] = true;
        if (this._pastEventDescs && this._pastEventDescs[label]) {
          descMap[label] = this._pastEventDescs[label];
        }
      }
    }
    
    // Use merged events if available, otherwise use static descriptions
    const allEventsMap = Object.keys(eventsMap).length > 0 ? 
      eventsMap : 
      _HAEO_DESCRIPTIONS;
    
    // Categorize events
    for (const [label, val] of Object.entries(allEventsMap)) {
      // Get description from collected descriptions or static definitions
      const desc = descMap[label] || _HAEO_DESCRIPTIONS[label] || 'Energy flow event';
      
      // Filter out disabled optional columns from legend
      if (!evEnabled && label.includes('🚗 ')) continue;
      if (!ev2Enabled && label.includes('🚙')) continue;
      if (!deferLoadEnabled && label.includes('⏰')) continue;
      
      // Generate dynamic description if needed
      let finalDesc = desc;
      
      // Check if this is a deferrable load event (contains ⏰)
      if (label.includes('⏰')) {
        finalDesc = 'Deferrable load is active and consuming power';
        // If it's in static descriptions, use that instead
        if (_HAEO_DESCRIPTIONS[label]) {
          finalDesc = _HAEO_DESCRIPTIONS[label];
        }
      }
      
      // Check if this is an optional load event
      for (const config of enabledOptionalLoads) {
        if (label.includes(config.emoji)) {
          const displayInfo = _haeo_getOptionalLoadDisplay(config);
          finalDesc = `${displayInfo.name} is active and consuming power`;
          break;
        }
      }
      
      // Ensure finalDesc is a string
      if (typeof finalDesc !== 'string') {
        finalDesc = 'Energy flow event';
      }
      
      let cat = 'Self Consumption';
      if (finalDesc.includes('low tariff') || finalDesc.includes('cheap') || finalDesc.includes('Cost') || label.includes('Grid Import') || label.includes('Grid →')) {
        cat = 'Cost';
      } else if (finalDesc.includes('peak') || finalDesc.includes('export') || finalDesc.includes('Profit') || label.includes('Grid Export') || label.includes('→ Grid')) {
        cat = 'Profit';
      } else if (label.includes('⏰')) {
        cat = 'Deferrable Loads';
      }
      
      // Detect optional loads in the event label (not EV/EV2/Battery/Solar/Grid/Base Load)
      let isOptionalLoadEvent = false;
      for (const config of enabledOptionalLoads) {
        if (label.includes(config.emoji) && !label.includes('🌞') && !label.includes('🔋') && !label.includes('⚡') && !label.includes('🏠') && !label.includes('🚗') && !label.includes('🚙')) {
          isOptionalLoadEvent = true;
          cat = 'Optional Loads';
          break;
        }
      }
      
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push({ label, desc: finalDesc });
    }
    
    // Add deferrable load standalone entries (only if enabled and not already in collected events)
    if (deferLoadEnabled && this._deferableLoadsConfig && this._deferableLoadsConfig.length > 0) {
      this._deferableLoadsConfig.forEach((config, idx) => {
        const labelKey = config.emoji + ' ' + config.name;
        // Only add if not already added from collected events
        if (!eventsMap || !eventsMap[labelKey]) {
          categories['Deferrable Loads'].push({
            label: labelKey,
            desc: 'Deferrable load power usage'
          });
        }
      });
    }
    
    // Add optional load standalone entries (only if any are enabled)
    if (enabledOptionalLoads.length > 0) {
      enabledOptionalLoads.forEach((config, idx) => {
        const displayInfo = _haeo_getOptionalLoadDisplay(config);
        const labelKey = displayInfo.emoji + ' ' + displayInfo.name;
        // Only add if not already added from collected events
        if (!eventsMap || !eventsMap[labelKey]) {
          categories['Optional Loads'].push({
            label: labelKey,
            desc: 'Optional load power usage'
          });
        }
      });
    }
    
    // Sort items alphabetically within each category
    for (const cat in categories) {
      if (categories[cat].length > 0) {
        categories[cat].sort((a, b) => a.label.localeCompare(b.label));
      }
    }
    
    let html = '';
    for (const [cat, events] of Object.entries(categories)) {
      if (events.length === 0) continue;
      html += '<div class="legend-category">' +
        '<div class="legend-category-title">' + cat + ' (' + events.length + ')</div>';
      
      for (const { label, desc } of events) {
        const color = this._getColorForLabel(label);
        // Generate detailed tooltip from label
        const tooltip = this._generateDescriptionFromLabel(label) || desc;
        html += '<div class="legend-item" title="' + tooltip.replace(/"/g, '&quot;') + '">' +
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
  }

  _applyLegendFilters() {
    const colSettings = this._columnSettings;
    const evEnabled = colSettings.ev !== false;
    const ev2Enabled = colSettings.ev2 !== false;
    const deferLoadEnabled = colSettings.deferLoad !== false;
    
    const solarChecked = this.shadowRoot.getElementById('filter-solar')?.checked ?? true;
    const batteryChecked = this.shadowRoot.getElementById('filter-battery')?.checked ?? true;
    const gridChecked = this.shadowRoot.getElementById('filter-grid')?.checked ?? true;
    const evChecked = evEnabled && (this.shadowRoot.getElementById('filter-ev')?.checked ?? true);
    const ev2Checked = ev2Enabled && (this.shadowRoot.getElementById('filter-ev2')?.checked ?? true);

    // Get optional load filter states (only for enabled loads)
    const optionalLoadChecked = {};
    const enabledOptionalLoads = this._getEnabledOptionalLoads();
    enabledOptionalLoads.forEach((config, idx) => {
      optionalLoadChecked[idx] = this.shadowRoot.getElementById(`filter-optload${idx}`)?.checked ?? true;
    });

    // Get deferrable load filter states (only if enabled)
    const deferLoadChecked = {};
    if (deferLoadEnabled) {
      this._deferableLoadsConfig.forEach((config, idx) => {
        deferLoadChecked[idx] = this.shadowRoot.getElementById(`filter-deferLoad${idx}`)?.checked ?? true;
      });
    }

    const items = this.shadowRoot.querySelectorAll('.legend-item');
    items.forEach(item => {
      const label = item.querySelector('.legend-item-label')?.textContent || '';
      
      // Check which power sources are in this label
      const hasSolar = label.includes('🌞');
      const hasBattery = label.includes('🔋');
      const hasGrid = label.includes('⚡');
      const hasEV = label.includes('🚗');
      const hasEV2 = label.includes('🚙');
      
      // Check for optional load emojis
      let hasOptionalLoad = false;
      let optionalLoadIdx = -1;
      enabledOptionalLoads.forEach((config, idx) => {
        if (label.includes(config.emoji)) {
          hasOptionalLoad = true;
          optionalLoadIdx = idx;
        }
      });
      
      // Check for deferrable load emojis
      let hasDeferLoad = false;
      let deferLoadIdx = -1;
      if (deferLoadEnabled) {
        this._deferableLoadsConfig.forEach((config, idx) => {
          if (label.includes(config.emoji)) {
            hasDeferLoad = true;
            deferLoadIdx = idx;
          }
        });
      }

      // Auto-hide if column is not enabled
      if (hasEV && !evEnabled) {
        item.style.display = 'none';
        return;
      }
      if (hasEV2 && !ev2Enabled) {
        item.style.display = 'none';
        return;
      }
      if (hasDeferLoad && !deferLoadEnabled) {
        item.style.display = 'none';
        return;
      }

      // Show if ANY selected source is in this label
      let shouldShow = (hasSolar && solarChecked) || 
                       (hasBattery && batteryChecked) || 
                       (hasGrid && gridChecked) || 
                       (hasEV && evChecked) ||
                       (hasEV2 && ev2Checked);
      
      // Also check optional loads
      if (hasOptionalLoad && optionalLoadIdx >= 0) {
        shouldShow = shouldShow || optionalLoadChecked[optionalLoadIdx];
      }
      
      // Also check deferrable loads
      if (hasDeferLoad && deferLoadIdx >= 0) {
        shouldShow = shouldShow || deferLoadChecked[deferLoadIdx];
      }
      
      item.style.display = shouldShow ? 'flex' : 'none';
    });
  }

  _getColorForLabel(label) {
    // Map event labels to their display colors based on event type
    // Prioritize user customizations (_colorSettings) over defaults (_HAEO_COLOURS)
    
    if (label.includes('⏰')) return '#e1bee7'; // purple for generic deferrable loads
    
    // Check if it's an optional load emoji
    const enabledOptionalLoads = this._getEnabledOptionalLoads();
    for (const config of enabledOptionalLoads) {
      if (label.includes(config.emoji)) {
        return '#fff9c4'; // light yellow for optional loads
      }
    }
    
    // Check if it's a deferrable load emoji
    for (const config of this._deferableLoadsConfig) {
      if (label.includes(config.emoji)) {
        return config.color?.bg || '#e1bee7'; // Use configured color or purple default
      }
    }
    
    // Helper to get color from _colorSettings first, then fall back to _HAEO_COLOURS
    const getEventColor = (colorKey) => {
      return this._colorSettings?.[colorKey]?.bg || _HAEO_COLOURS[colorKey]?.bg || '#ffffff';
    };
    
    if (label.includes('🌞') && !label.includes('Grid') && !label.includes('⚡')) return getEventColor('self_consumption');
    if (label.includes('→ ⚡ Grid') && label.includes('🌞')) return getEventColor('forced_export');
    if (label.includes('→ ⚡ Grid')) return getEventColor('cost');
    if (label.includes('⚡ Grid →') && label.includes('Force')) return getEventColor('loss');
    if (label.includes('⚡ Grid →')) return getEventColor('loss');
    if (label.includes('🔋')) return getEventColor('battery');
    return getEventColor('profit');
  }

  _addTooltipHandler(eventCell, label) {
    // Always generate description from the label itself, which includes all components
    // (Solar, Battery, Grid, loads, optional loads, deferrable loads, etc.)
    let desc = this._generateDescriptionFromLabel(label);
    
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

  _generateDescriptionFromLabel(label) {
    // Build a detailed description from the event label, properly parsing sources vs loads
    let desc = '';
    const enabledOptionalLoads = this._getEnabledOptionalLoads();
    
    // Split by arrow to get sources and loads/destinations
    const arrowIndex = label.indexOf('→');
    if (arrowIndex === -1) {
      return 'Energy flow event'; // No arrow, can't parse
    }
    
    const sourcePart = label.substring(0, arrowIndex).trim();
    const loadPart = label.substring(arrowIndex + 1).trim();
    
    // Extract sources (before arrow)
    const sources = [];
    if (sourcePart.includes('🌞')) sources.push('Solar');
    if (sourcePart.includes('⚡')) sources.push('Grid (import)');
    if (sourcePart.includes('🔋')) sources.push('Battery');
    
    // Extract loads/destinations (after arrow)
    const loads = [];
    if (loadPart.includes('🏠')) loads.push('Base Load');
    if (loadPart.includes('🚗')) loads.push('EV');
    if (loadPart.includes('🚙')) loads.push('EV2');
    if (loadPart.includes('⏰')) loads.push('Deferrable Loads');
    if (loadPart.includes('🔋')) loads.push('Battery');
    if (loadPart.includes('⚡')) loads.push('Grid (export)');
    
    // Check for optional loads in load part only
    for (const config of enabledOptionalLoads) {
      if (loadPart.includes(config.emoji)) {
        const displayInfo = _haeo_getOptionalLoadDisplay(config);
        loads.push(displayInfo.name);
      }
    }
    
    // Build description
    if (sources.length > 0 && loads.length > 0) {
      desc = sources.join(' + ') + ' → ' + loads.join(' + ');
    } else if (sources.length > 0) {
      desc = sources.join(' + ') + ' (no destination)';
    } else if (loads.length > 0) {
      desc = 'Unknown source → ' + loads.join(' + ');
    }
    
    return desc || 'Energy flow event';
  }

  // Generate forecast entity ID from name
  _generateForecastEntityId(name) {
    if (!name) return '';
    // Convert to lowercase, replace spaces and special chars with underscores
    return 'number.' + name.toLowerCase().replace(/[^a-z0-9]+/g, '_') + '_load_forecast';
  }

  // Get available forecast load entities from HA
  _getAvailableForecastEntities() {
    if (!this._hass || !this._hass.states) return [];
    
    const entities = [];
    for (const entityId of Object.keys(this._hass.states)) {
      if (entityId.startsWith('number.') && entityId.includes('_load_forecast')) {
        entities.push(entityId);
      }
    }
    
    return entities.sort();
  }

  // Get available power sensors from HA
  _getAvailablePowerSensors() {
    if (!this._hass || !this._hass.states) return [];
    
    const sensors = [];
    const powerUnits = ['W', 'kW', 'MW'];
    
    for (const [entityId, state] of Object.entries(this._hass.states)) {
      // Check for sensor.*_power, sensor.*_apparent_power, sensor.*_active_power
      if (!entityId.startsWith('sensor.')) continue;
      if (state.attributes && powerUnits.includes(state.attributes.unit_of_measurement)) {
        sensors.push(entityId);
      }
    }
    
    return sensors.sort();
  }

  // Open emoji picker for deferrable load

  // Save optional loads configuration from form inputs
  _saveOptionalLoadsConfig() {
    const config = [];
    for (let i = 0; i < 10; i++) {
      const enableCheckbox = this.shadowRoot.getElementById(`optload-enable-${i}`);
      const emojiSelect = this.shadowRoot.getElementById(`optload-emoji-${i}`);
      const loadNameSelect = this.shadowRoot.getElementById(`optload-preset-${i}`);
      const customNameInput = this.shadowRoot.getElementById(`optload-customname-${i}`);
      const forecastInput = this.shadowRoot.getElementById(`optload-forecast-${i}`);
      const historicalInput = this.shadowRoot.getElementById(`optload-historical-${i}`);
      const energyInput = this.shadowRoot.getElementById(`optload-energy-${i}`);
      const thresholdInput = this.shadowRoot.getElementById(`optload-threshold-${i}`);
      
      if (enableCheckbox && emojiSelect && loadNameSelect && forecastInput && historicalInput) {
        const showKwhInput = this.shadowRoot.getElementById(`optload-show-kwh-${i}`);
        const entry = {
          enabled: enableCheckbox.checked,
          emoji: emojiSelect.value || '🔌',
          loadName: loadNameSelect.value || '',
          customName: customNameInput ? customNameInput.value || '' : '',
          forecastEntity: forecastInput.value || '',
          historicalEntity: historicalInput.value || '',
          energyEntity: energyInput ? energyInput.value || '' : '',
          threshold: thresholdInput ? parseInt(thresholdInput.value) || 10 : 10,
          showKwh: showKwhInput ? showKwhInput.checked : true
        };
        config.push(entry);
      }
    }
    
    try {
      localStorage.setItem('haeo-events-card-optional-loads', JSON.stringify(config));
    } catch (e) {
    }
    return config;
  }

  // Load optional loads configuration from localStorage
  _loadOptionalLoadsConfig() {
    try {
      const saved = localStorage.getItem('haeo-events-card-optional-loads');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  }

  // Save all load entity configurations
  _saveLoadEntitiesConfig() {
    const loads = {
      base: { forecast: this.shadowRoot.getElementById('load-forecast')?.value || '', historical: this.shadowRoot.getElementById('load-historical')?.value || '', energy: this.shadowRoot.getElementById('load-energy')?.value || '', invert: this.shadowRoot.getElementById('invert-load')?.checked || false },
      pv: { forecast: this.shadowRoot.getElementById('pv-forecast')?.value || '', historical: this.shadowRoot.getElementById('pv-historical')?.value || '', energy: this.shadowRoot.getElementById('pv-energy')?.value || '', invert: this.shadowRoot.getElementById('invert-pv')?.checked || false },
      grid: { forecast: this.shadowRoot.getElementById('grid-forecast')?.value || '', historical: this.shadowRoot.getElementById('grid-historical')?.value || '', energy: this.shadowRoot.getElementById('grid-energy')?.value || '', energyExport: this.shadowRoot.getElementById('grid-energy-export')?.value || '', dailyImport: this.shadowRoot.getElementById('grid-daily-import')?.value || '', dailyExport: this.shadowRoot.getElementById('grid-daily-export')?.value || '', invert: this.shadowRoot.getElementById('invert-grid')?.checked || false },
      battery: { forecast: this.shadowRoot.getElementById('battery-forecast')?.value || '', historical: this.shadowRoot.getElementById('battery-historical')?.value || '', energy: this.shadowRoot.getElementById('battery-energy')?.value || '', energyDischarge: this.shadowRoot.getElementById('battery-energy-discharge')?.value || '', invert: this.shadowRoot.getElementById('invert-battery')?.checked || false },
      ev: { forecast: this.shadowRoot.getElementById('ev-forecast')?.value || '', historical: this.shadowRoot.getElementById('ev-historical')?.value || '', energy: this.shadowRoot.getElementById('ev-energy')?.value || '', energyDischarge: this.shadowRoot.getElementById('ev-energy-discharge')?.value || '', invert: this.shadowRoot.getElementById('invert-ev')?.checked || false, showKwh: this.shadowRoot.getElementById('show-kwh-ev')?.checked ?? true },
      ev2: { forecast: this.shadowRoot.getElementById('ev2-forecast')?.value || '', historical: this.shadowRoot.getElementById('ev2-historical')?.value || '', energy: this.shadowRoot.getElementById('ev2-energy')?.value || '', energyDischarge: this.shadowRoot.getElementById('ev2-energy-discharge')?.value || '', invert: this.shadowRoot.getElementById('invert-ev2')?.checked || false, showKwh: this.shadowRoot.getElementById('show-kwh-ev2')?.checked ?? true },
      deferLoad: { forecast: this.shadowRoot.getElementById('deferLoad-forecast')?.value || '', historical: this.shadowRoot.getElementById('deferLoad-historical')?.value || '', energy: this.shadowRoot.getElementById('deferLoad-energy')?.value || '', invert: this.shadowRoot.getElementById('invert-deferLoad')?.checked || false, showKwh: this.shadowRoot.getElementById('show-kwh-deferLoad')?.checked ?? true }
    };
    try {
      localStorage.setItem('haeo-events-card-load-entities', JSON.stringify(loads));
    } catch (e) {
    }
    return loads;
  }

  // Load all load entity configurations
  _loadLoadEntitiesConfig() {
    try {
      const saved = localStorage.getItem('haeo-events-card-load-entities');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
    }
    // No saved config — build defaults and persist them immediately so
    // _saveLoadEntitiesConfig() always reads real values (not empty placeholders)
    const defaults = {
      base: { forecast: 'sensor.base_load_power', historical: 'sensor.sigen_plant_total_load_power', energy: 'sensor.sigen_plant_total_load_consumption' },
      pv: { forecast: 'sensor.solar_power', historical: 'sensor.sigen_plant_pv_power', energy: 'sensor.sigen_plant_total_pv_generation' },
      grid: { forecast: 'sensor.grid_active_power', historical: 'sensor.sigen_plant_grid_active_power', energy: 'sensor.sigen_plant_total_imported_energy', energyExport: 'sensor.sigen_plant_total_exported_energy', dailyImport: 'sensor.sigen_plant_daily_grid_import_energy', dailyExport: 'sensor.sigen_plant_daily_grid_export_energy' },
      battery: { forecast: 'sensor.battery_active_power', historical: 'sensor.sigen_plant_battery_power', energy: 'sensor.sigen_plant_daily_battery_charge_energy', energyDischarge: 'sensor.sigen_plant_daily_battery_discharge_energy' },
      ev: { forecast: 'sensor.ev_active_power', historical: 'sensor.sigen_ac_charger_charging_power', energy: 'sensor.sigen_plant_total_charged_energy_of_the_evac', energyDischarge: '' },
      ev2: { forecast: 'sensor.ev2_active_power', historical: 'sensor.sigen_dc_charger_output_power', energy: 'sensor.sigen_plant_total_charged_energy_of_the_evdc', energyDischarge: 'sensor.sigen_plant_total_discharged_energy_of_the_evdc' }
    };
    try { localStorage.setItem('haeo-events-card-load-entities', JSON.stringify(defaults)); } catch (e) {}
    return defaults;
  }

  // ── Daily meter helper ───────────────────────────────────────────────────────
  // Checks whether an energy entity is a lifetime cumulative counter (total_increasing,
  // value > 50 kWh). If so, looks for an existing daily-reset utility_meter wrapping
  // it (from any source — Genergy, a previous HAEO run, or user-created). If none
  // exists, creates one via the HA config entries API.
  //
  // Naming convention for new meters: sensor.ems_card_<slug>_daily
  //
  // Returns: { isCumulative: bool, dailyEntity: string }
  async _ensureDailyMeter(sourceEntityId, meterLabel) {
    if (!this._hass || !sourceEntityId) return { isCumulative: false, dailyEntity: sourceEntityId };

    const stateObj = this._hass.states[sourceEntityId];
    if (!stateObj) return { isCumulative: false, dailyEntity: sourceEntityId };

    // Skip entities whose name already implies a daily reset
    const lower = sourceEntityId.toLowerCase();
    if (/daily|_today|summary_day/.test(lower)) return { isCumulative: false, dailyEntity: sourceEntityId };

    // Only act on cumulative energy sensors with a large accumulated value
    const stateClass = stateObj.attributes?.state_class;
    const unit = stateObj.attributes?.unit_of_measurement || '';
    const rawVal = parseFloat(stateObj.state);
    const isEnergyUnit = ['kWh', 'MWh', 'Wh'].includes(unit);
    const valKwh = unit === 'MWh' ? rawVal * 1000 : unit === 'Wh' ? rawVal / 1000 : rawVal;
    const isCumulative = (stateClass === 'total_increasing' || stateClass === 'total') && isEnergyUnit && valKwh > 50;
    if (!isCumulative) return { isCumulative: false, dailyEntity: sourceEntityId };

    // ── Step 1: Look for a native daily-reset sibling in HA states ───────────
    // Many inverter integrations (Sigenergy, Fronius, Deye, FoxESS, Goodwe) provide
    // both a lifetime total AND a daily-reset sensor for the same measurement.
    // Prefer the native daily sensor over creating a utility_meter helper.
    const allKeys = Object.keys(this._hass.states);
    const sourceLower = sourceEntityId.toLowerCase();
    const devicePrefix = sourceLower
      .replace(/^sensor\./, '')
      .replace(/(total_|lifetime_|cumulative_|all_time_)/gi, '')
      .replace(/_of_the_ev\w*/gi, '')                            // strip _of_the_evac / _of_the_evdc etc.
      .replace(/_(imported|exported|generation|consumption|produced|consumed|energy|charged|discharged|charge_total|discharge_total|feed_in_energy|yield).*$/i, '');

    // Extract measurement type keywords from the source entity so the candidate
    // must match the same measurement (import ≠ export ≠ generation ≠ self-consumption)
    const importKeywords  = ['import', 'imported', 'grid_buy', 'grid_in', 'consumed_from_grid', 'grid_consumption', 'consumption_energy'];
    const exportKeywords  = ['export', 'exported', 'grid_sell', 'grid_out', 'fed_into_grid', 'feed_in'];
    const pvKeywords      = ['pv', 'solar', 'generation', 'produced', 'yield', 'power_yield'];
    const battChgKeywords = ['battery_charge', 'batt_charge', 'charge_energy', 'charging', 'battery_charge_total', '_charge_total'];
    const battDisKeywords = ['battery_discharge', 'batt_discharge', 'discharge_energy', 'discharging', 'battery_discharge_total', '_discharge_total'];
    const evChgKeywords   = ['evac', 'evdc', 'ev_charge', 'ev_charged', 'charged_energy_of_the_ev', 'ev_energy', 'ev_ac', 'ev_dc'];
    const evDisKeywords   = ['ev_discharge', 'ev_discharged', 'discharged_energy_of_the_ev', 'v2g', 'ev_to_grid'];

    const sourceIsImport  = importKeywords.some(k => sourceLower.includes(k));
    const sourceIsExport  = exportKeywords.some(k => sourceLower.includes(k));
    const sourceIsPV      = pvKeywords.some(k => sourceLower.includes(k));
    const sourceIsBattChg = battChgKeywords.some(k => sourceLower.includes(k));
    const sourceIsBattDis = battDisKeywords.some(k => sourceLower.includes(k));
    const sourceIsEvChg   = evChgKeywords.some(k => sourceLower.includes(k));
    const sourceIsEvDis   = evDisKeywords.some(k => sourceLower.includes(k));

    // Only attempt sibling lookup if the prefix is meaningful (≥ 8 chars)
    if (devicePrefix.length >= 8) {
      const nativeDailySibling = allKeys.find(eid => {
        if (eid === sourceEntityId) return false;
        const eidLower = eid.toLowerCase();
        // Must contain a daily-reset indicator
        if (!/daily|_today|summary_day/.test(eidLower)) return false;
        // Must be an energy sensor
        const s = this._hass.states[eid];
        if (!s) return false;
        const sUnit = s.attributes?.unit_of_measurement || '';
        if (!['kWh', 'MWh', 'Wh'].includes(sUnit)) return false;
        // Must share device prefix
        const eidPrefix = eid.replace(/^sensor\./, '').slice(0, Math.max(12, devicePrefix.length));
        if (!eidPrefix.toLowerCase().startsWith(devicePrefix.slice(0, 10))) return false;
        // Must match the same measurement type as the source entity
        if (sourceIsImport  && !importKeywords.some(k => eidLower.includes(k)))  return false;
        if (sourceIsExport  && !exportKeywords.some(k => eidLower.includes(k)))  return false;
        if (sourceIsPV      && !pvKeywords.some(k => eidLower.includes(k)))      return false;
        if (sourceIsBattChg && !battChgKeywords.some(k => eidLower.includes(k))) return false;
        if (sourceIsBattDis && !battDisKeywords.some(k => eidLower.includes(k))) return false;
        if (sourceIsEvChg   && !evChgKeywords.some(k => eidLower.includes(k)))   return false;
        if (sourceIsEvDis   && !evDisKeywords.some(k => eidLower.includes(k)))   return false;
        return true;
      });
      if (nativeDailySibling) return { isCumulative: true, dailyEntity: nativeDailySibling };
    }

    // ── Step 2: Look for an existing ems_card_ or genergy_ daily meter ───────
    const slug = sourceEntityId.replace(/^sensor\./, '').replace(/[^a-z0-9]+/gi, '_').toLowerCase();
    const expectedId = `sensor.ems_card_${slug}_daily`;
    const existingMeter = allKeys.find(eid => {
      if (eid === expectedId) return true;
      if ((eid.startsWith('sensor.ems_card_') || eid.startsWith('sensor.genergy_')) && eid.includes(slug.slice(0, 12))) return true;
      return false;
    });
    if (existingMeter) return { isCumulative: true, dailyEntity: existingMeter };

    // Create a new utility_meter via HA config entries flow
    const friendlyName = `EMS Card ${meterLabel} Daily`;
    try {
      const flowResult = await this._hass.callApi('POST', 'config/config_entries/flow', {
        handler: 'utility_meter',
        show_advanced_options: false
      });
      if (!flowResult?.flow_id) throw new Error('No flow_id returned');

      const createResult = await this._hass.callApi('POST', `config/config_entries/flow/${flowResult.flow_id}`, {
        name: friendlyName,
        source: sourceEntityId,
        cycle: 'daily',
        offset: 0,
        net_consumption: false,
        tariffs: [],
        always_available: true,
        periodically_resetting: false,
      });

      if (createResult?.type === 'create_entry') {
        await new Promise(r => setTimeout(r, 3000));
        try { await this._hass.callService('homeassistant', 'update_entity', { entity_id: sourceEntityId }); } catch (e) {}
        await new Promise(r => setTimeout(r, 1000));
        const newMeter = Object.keys(this._hass.states).find(k => k.includes('ems_card_') && k.includes(slug.slice(0, 10)));
        return { isCumulative: true, dailyEntity: newMeter || expectedId };
      }
    } catch (err) {
      console.warn('[HAEO] Failed to create utility meter for', sourceEntityId, err);
    }

    // Fallback: return the source entity with the cumulative flag
    return { isCumulative: true, dailyEntity: sourceEntityId };
  }

  // Auto-detect energy entities from HA Energy Dashboard config
  async _autoDetectEnergyEntities() {
    if (!this._hass) {
      alert("HA connection not ready");
      return;
    }
    
    const btn = this.shadowRoot?.getElementById('auto-detect-energy-btn');
    if (btn) btn.textContent = '⏳ Detecting...';
    
    try {
      const prefs = await this._hass.callWS({ type: 'energy/get_prefs' });
      if (!prefs?.energy_sources) {
        alert("No Energy Dashboard configuration found.");
        if (btn) btn.textContent = '🔍 Auto-Detect';
        return;
      }
      
      const loadConfig = this._loadLoadEntitiesConfig() || {};
      const found = [];
      const allStates = this._hass.states;
      const allStateKeys = Object.keys(allStates);
      
      // Iterate through energy_sources
      prefs.energy_sources.forEach(source => {
        if (source.type === 'solar') {
          if (source.stat_energy_from) {
            loadConfig.pv = loadConfig.pv || {};
            loadConfig.pv.energy = source.stat_energy_from;
            found.push(`🌞 ${source.stat_energy_from}`);
          }
        }
        else if (source.type === 'battery') {
          if (source.stat_energy_to) {   // Battery charge
            loadConfig.battery = loadConfig.battery || {};
            loadConfig.battery.energy = source.stat_energy_to;
            found.push(`🔋 charge: ${source.stat_energy_to}`);
          }
          if (source.stat_energy_from) { // Battery discharge
            loadConfig.battery = loadConfig.battery || {};
            loadConfig.battery.energyDischarge = source.stat_energy_from;
            found.push(`🔋 discharge: ${source.stat_energy_from}`);
          }
        }
        else if (source.type === 'grid') {
          // Grid import (flow_from array or direct stat_energy_from)
          const flowFrom = source.flow_from || [];
          if (flowFrom.length > 0) {
            flowFrom.forEach(flow => {
              if (flow.stat_energy_from) {
                loadConfig.grid = loadConfig.grid || {};
                loadConfig.grid.energy = flow.stat_energy_from;
                found.push(`⚡ import: ${flow.stat_energy_from}`);
              }
            });
          } else if (source.stat_energy_from) {
            loadConfig.grid = loadConfig.grid || {};
            loadConfig.grid.energy = source.stat_energy_from;
            found.push(`⚡ import: ${source.stat_energy_from}`);
          }
          // Grid export (flow_to array or direct stat_energy_to)
          const flowTo = source.flow_to || [];
          if (flowTo.length > 0) {
            flowTo.forEach(flow => {
              if (flow.stat_energy_to) {
                loadConfig.grid = loadConfig.grid || {};
                loadConfig.grid.energyExport = flow.stat_energy_to;
                found.push(`⚡ export: ${flow.stat_energy_to}`);
              }
            });
          } else if (source.stat_energy_to) {
            loadConfig.grid = loadConfig.grid || {};
            loadConfig.grid.energyExport = source.stat_energy_to;
            found.push(`⚡ export: ${source.stat_energy_to}`);
          }
        }
      });

      // ── PAST power sensor auto-detection ─────────────────────────────────────
      // Helper: only skip if entity is already set AND exists in HA states
      const alreadySet = (val) => val && allStates[val];

      // Helper: find a sensor.* entity by unit and keywords
      const findSensor = (units, keywords, excludes = []) => allStateKeys.find(eid => {
        if (!eid.startsWith('sensor.')) return false;
        const l = eid.toLowerCase();
        const unit = allStates[eid]?.attributes?.unit_of_measurement || '';
        if (!units.includes(unit)) return false;
        if (excludes.some(x => l.includes(x))) return false;
        return keywords.some(k => l.includes(k));
      });
      // Scan HA states for live power sensors (W/kW) for each load type
      if (btn) btn.textContent = '⏳ Detecting PAST power sensors...';
      const pwrUnits = ['W', 'kW'];

      // Base load power
      if (!alreadySet(loadConfig.base?.historical)) {
        const e = findSensor(pwrUnits, ['total_load_power', 'load_power', 'consumed_power', 'home_load'], ['forecast', 'daily', 'energy']);
        if (e) { loadConfig.base = loadConfig.base || {}; loadConfig.base.historical = e; found.push(`🏠 Base load power: ${e}`); }
      }
      // Solar power
      if (!alreadySet(loadConfig.pv?.historical)) {
        const e = findSensor(pwrUnits, ['pv_power', 'solar_power', 'pv_active_power'], ['forecast', 'daily', 'energy', 'string', 'pv1', 'pv2', 'pv3']);
        if (e) { loadConfig.pv = loadConfig.pv || {}; loadConfig.pv.historical = e; found.push(`🌞 Solar power: ${e}`); }
      }
      // Grid power
      if (!alreadySet(loadConfig.grid?.historical)) {
        const e = findSensor(pwrUnits, ['grid_active_power', 'grid_power', 'grid_ct', 'meter_power'], ['forecast', 'daily', 'energy', 'import', 'export']);
        if (e) { loadConfig.grid = loadConfig.grid || {}; loadConfig.grid.historical = e; found.push(`⚡ Grid power: ${e}`); }
      }
      // Battery power
      if (!alreadySet(loadConfig.battery?.historical)) {
        const e = findSensor(pwrUnits, ['battery_power', 'batt_power', 'ess_power', 'battery_active_power'], ['forecast', 'daily', 'energy', 'charge_power', 'discharge_power']);
        if (e) { loadConfig.battery = loadConfig.battery || {}; loadConfig.battery.historical = e; found.push(`🔋 Battery power: ${e}`); }
      }

      // ── PAST energy fallback: scan HA states for any still-missing energy fields ──
      const kwhUnits = ['kWh', 'MWh', 'Wh'];
      if (!alreadySet(loadConfig.grid?.energy)) {
        const e = findSensor(kwhUnits, ['total_imported_energy', 'grid_import_energy', 'grid_consumption_energy', 'grid_buy_energy', 'grid_import_total'], ['export', 'export_energy', 'daily', 'self_consumption']);
        if (e) { loadConfig.grid = loadConfig.grid || {}; loadConfig.grid.energy = e; found.push(`⚡ Grid import energy: ${e}`); }
      }
      if (!alreadySet(loadConfig.grid?.energyExport)) {
        const e = findSensor(kwhUnits, ['total_exported_energy', 'grid_export_energy', 'feed_in_energy', 'grid_sell_energy', 'grid_export_total'], ['import', 'import_energy', 'daily', 'self_consumption']);
        if (e) { loadConfig.grid = loadConfig.grid || {}; loadConfig.grid.energyExport = e; found.push(`⚡ Grid export energy: ${e}`); }
      }
      if (!alreadySet(loadConfig.pv?.energy)) {
        const e = findSensor(kwhUnits, ['total_pv_generation', 'pv_energy', 'solar_energy', 'pv_yield_total', 'total_generation'], ['daily', 'forecast', 'self_consumption']);
        if (e) { loadConfig.pv = loadConfig.pv || {}; loadConfig.pv.energy = e; found.push(`🌞 Solar energy: ${e}`); }
      }
      if (!alreadySet(loadConfig.base?.energy)) {
        const e = findSensor(kwhUnits, ['total_load_consumption', 'load_energy', 'load_consumption_total', 'total_consumed'], ['daily', 'forecast', 'self_consumption']);
        if (e) { loadConfig.base = loadConfig.base || {}; loadConfig.base.energy = e; found.push(`🏠 Load energy: ${e}`); }
      }

      // ── EV PAST entity auto-detection ────────────────────────────────────────
      // Scan HA states for Sigenergy v2.9 EV AC/DC power and energy sensors.
      // Also handles other brands via generic EV power/energy keyword matching.
      if (btn) btn.textContent = '⏳ Detecting EV sensors...';

      // EV1 (AC charger) — power
      if (!loadConfig.ev?.historical) {
        const ev1Power = allStateKeys.find(eid => {
          const l = eid.toLowerCase();
          const unit = allStates[eid]?.attributes?.unit_of_measurement || '';
          if (!['W', 'kW'].includes(unit)) return false;
          return l.includes('sigen_ac_charger') && l.includes('power') ||
                 (l.includes('ev') && l.includes('ac') && l.includes('power') && !l.includes('energy'));
        });
        if (ev1Power) {
          loadConfig.ev = loadConfig.ev || {};
          loadConfig.ev.historical = ev1Power;
          found.push(`🔌 EV1 power: ${ev1Power}`);
        }
      }

      // EV1 (AC charger) — charge energy (lifetime total)
      if (!loadConfig.ev?.energy) {
        const ev1Energy = allStateKeys.find(eid => {
          const l = eid.toLowerCase();
          const unit = allStates[eid]?.attributes?.unit_of_measurement || '';
          if (!['kWh', 'MWh', 'Wh'].includes(unit)) return false;
          return l.includes('charged_energy_of_the_evac') ||
                 l.includes('evac') && l.includes('charge') ||
                 (l.includes('ev') && l.includes('ac') && l.includes('energy') && !l.includes('discharge'));
        });
        if (ev1Energy) {
          loadConfig.ev = loadConfig.ev || {};
          loadConfig.ev.energy = ev1Energy;
          found.push(`🔌 EV1 charge energy: ${ev1Energy}`);
        }
      }

      // EV2 (DC bidirectional charger) — power
      if (!loadConfig.ev2?.historical) {
        const ev2Power = allStateKeys.find(eid => {
          const l = eid.toLowerCase();
          const unit = allStates[eid]?.attributes?.unit_of_measurement || '';
          if (!['W', 'kW'].includes(unit)) return false;
          return l.includes('sigen_dc_charger') && l.includes('power') ||
                 (l.includes('ev') && l.includes('dc') && l.includes('power') && !l.includes('energy'));
        });
        if (ev2Power) {
          loadConfig.ev2 = loadConfig.ev2 || {};
          loadConfig.ev2.historical = ev2Power;
          found.push(`🔋 EV2 power: ${ev2Power}`);
        }
      }

      // EV2 (DC) — charge energy (lifetime total)
      if (!loadConfig.ev2?.energy) {
        const ev2ChargeEnergy = allStateKeys.find(eid => {
          const l = eid.toLowerCase();
          const unit = allStates[eid]?.attributes?.unit_of_measurement || '';
          if (!['kWh', 'MWh', 'Wh'].includes(unit)) return false;
          return l.includes('charged_energy_of_the_evdc') && !l.includes('discharged') ||
                 (l.includes('evdc') && l.includes('charge') && !l.includes('discharge'));
        });
        if (ev2ChargeEnergy) {
          loadConfig.ev2 = loadConfig.ev2 || {};
          loadConfig.ev2.energy = ev2ChargeEnergy;
          found.push(`🔋 EV2 charge energy: ${ev2ChargeEnergy}`);
        }
      }

      // EV2 (DC) — discharge energy (V2G, lifetime total)
      if (!loadConfig.ev2?.energyDischarge) {
        const ev2DischargeEnergy = allStateKeys.find(eid => {
          const l = eid.toLowerCase();
          const unit = allStates[eid]?.attributes?.unit_of_measurement || '';
          if (!['kWh', 'MWh', 'Wh'].includes(unit)) return false;
          return l.includes('discharged_energy_of_the_evdc') ||
                 (l.includes('evdc') && l.includes('discharge'));
        });
        if (ev2DischargeEnergy) {
          loadConfig.ev2 = loadConfig.ev2 || {};
          loadConfig.ev2.energyDischarge = ev2DischargeEnergy;
          found.push(`🔋 EV2 discharge energy (V2G): ${ev2DischargeEnergy}`);
        }
      }

      // ── Daily meter check ─────────────────────────────────────────────────
      // For each detected energy entity, check if it's a lifetime cumulative
      // counter (e.g. Fronius, Deye, FoxESS). If so, find or create a
      // daily-reset utility_meter and use that instead.
      if (btn) btn.textContent = '⏳ Checking energy sensors...';

      const energyFields = [
        { obj: loadConfig.pv,      key: 'energy',          label: 'PV Energy' },
        { obj: loadConfig.battery, key: 'energy',          label: 'Battery Charge' },
        { obj: loadConfig.battery, key: 'energyDischarge', label: 'Battery Discharge' },
        { obj: loadConfig.grid,    key: 'energy',          label: 'Grid Import' },
        { obj: loadConfig.grid,    key: 'energyExport',    label: 'Grid Export' },
        { obj: loadConfig.ev,      key: 'energy',          label: 'EV1 Charge Energy' },
        { obj: loadConfig.ev2,     key: 'energy',          label: 'EV2 Charge Energy' },
        { obj: loadConfig.ev2,     key: 'energyDischarge', label: 'EV2 Discharge Energy' },
      ];

      for (const field of energyFields) {
        if (!field.obj || !field.obj[field.key]) continue;
        const sourceEid = field.obj[field.key];
        const result = await this._ensureDailyMeter(sourceEid, field.label);
        if (result.isCumulative && result.dailyEntity !== sourceEid) {
          found.push(`📊 ${field.label}: cumulative sensor → daily meter (${result.dailyEntity})`);
          field.obj[field.key] = result.dailyEntity;
        } else if (result.isCumulative && result.dailyEntity === sourceEid) {
          found.push(`⚠️ ${field.label}: cumulative sensor detected but meter creation failed — using source directly`);
        }
      }


      this._saveLoadEntitiesConfigFromObject(loadConfig);
      this._populateLoadEntitiesForm();
      
      if (btn) btn.textContent = '🔍 Auto-Detect';
      if (found.length > 0) {
        alert("✅ Detected:\n" + found.join('\n'));
      } else {
        alert("⚠️ No energy entities found in HA Energy Dashboard.");
      }
      
    } catch (err) {
      console.error(err);
      if (btn) btn.textContent = '🔍 Auto-Detect';
      alert("Auto-detect failed: " + err.message);
    }
  }

  // Helper to save load entity config from object
  _saveLoadEntitiesConfigFromObject(config) {
    try {
      localStorage.setItem('haeo-events-card-load-entities', JSON.stringify(config));
    } catch (e) {
      console.error('Failed to save config:', e);
    }
  }

  // Populate load entity form from saved config
  _populateLoadEntitiesForm() {
    const config = this._loadLoadEntitiesConfig();
    
    // Map config keys to their input IDs (base -> load, others direct)
    const loadMap = { base: 'load', pv: 'pv', grid: 'grid', battery: 'battery', ev: 'ev', ev2: 'ev2', deferLoad: 'deferLoad' };
    
    Object.keys(loadMap).forEach(loadName => {
      const inputId = loadMap[loadName];
      const forecastInput = this.shadowRoot.getElementById(`${inputId}-forecast`);
      const historicalInput = this.shadowRoot.getElementById(`${inputId}-historical`);
      const energyInput = this.shadowRoot.getElementById(`${inputId}-energy`);
      if (forecastInput && config[loadName]) {
        forecastInput.value = config[loadName].forecast || '';
      }
      if (historicalInput && config[loadName]) {
        historicalInput.value = config[loadName].historical || '';
      }
      if (energyInput && config[loadName]) {
        energyInput.value = config[loadName].energy || '';
      }
    });
    
    // Handle special export/discharge energy fields
    const gridExportInput = this.shadowRoot.getElementById('grid-energy-export');
    if (gridExportInput && config.grid) {
      gridExportInput.value = config.grid.energyExport || '';
    }
    
    // Handle daily grid import/export sensors
    const gridDailyImportInput = this.shadowRoot.getElementById('grid-daily-import');
    const gridDailyExportInput = this.shadowRoot.getElementById('grid-daily-export');
    if (gridDailyImportInput) {
      gridDailyImportInput.value = config.grid?.dailyImport || '';
    }
    if (gridDailyExportInput) {
      gridDailyExportInput.value = config.grid?.dailyExport || '';
    }
    
    const batteryDischargeInput = this.shadowRoot.getElementById('battery-energy-discharge');
    if (batteryDischargeInput && config.battery) {
      batteryDischargeInput.value = config.battery.energyDischarge || '';
    }
    
    const evDischargeInput = this.shadowRoot.getElementById('ev-energy-discharge');
    if (evDischargeInput && config.ev) {
      evDischargeInput.value = config.ev.energyDischarge || '';
    }
    
    const ev2DischargeInput = this.shadowRoot.getElementById('ev2-energy-discharge');
    if (ev2DischargeInput && config.ev2) {
      ev2DischargeInput.value = config.ev2.energyDischarge || '';
    }

    // Restore invert flow checkboxes
    const invertIds = ['load', 'pv', 'grid', 'battery', 'ev', 'ev2', 'deferLoad'];
    const invertKeys = { load: 'base', pv: 'pv', grid: 'grid', battery: 'battery', ev: 'ev', ev2: 'ev2', deferLoad: 'deferLoad' };
    invertIds.forEach(id => {
      const cb = this.shadowRoot.getElementById(`invert-${id}`);
      const key = invertKeys[id];
      if (cb && config[key]) cb.checked = config[key].invert || false;
    });

    // Restore show kWh checkboxes for deferLoad, ev, ev2
    const showKwhDeferLoad = this.shadowRoot.getElementById('show-kwh-deferLoad');
    if (showKwhDeferLoad && config.deferLoad) showKwhDeferLoad.checked = config.deferLoad.showKwh ?? true;
    const showKwhEv = this.shadowRoot.getElementById('show-kwh-ev');
    if (showKwhEv && config.ev) showKwhEv.checked = config.ev.showKwh ?? true;
    const showKwhEv2 = this.shadowRoot.getElementById('show-kwh-ev2');
    if (showKwhEv2 && config.ev2) showKwhEv2.checked = config.ev2.showKwh ?? true;
  }

  _populateEntitiesForm() {
    const savedEntities = localStorage.getItem('haeo-events-card-entities');
    let weatherEntity = 'weather.forecast_home';
    let curtailmentEntity = 'switch.solar_curtailment';
    
    if (savedEntities) {
      try {
        const ents = JSON.parse(savedEntities);
        if (ents.weatherEntity) weatherEntity = ents.weatherEntity;
        if (ents.curtailmentEntity) curtailmentEntity = ents.curtailmentEntity;
      } catch(e) {}
    }
    
    const weatherInput = this.shadowRoot.getElementById('weather-entity-input');
    const curtailmentInput = this.shadowRoot.getElementById('curtailment-entity-input');
    
    if (weatherInput) {
      weatherInput.value = weatherEntity;
    }
    if (curtailmentInput) {
      curtailmentInput.value = curtailmentEntity;
    }
  }

  // Get only enabled optional loads
  _getEnabledOptionalLoads() {
    const config = this._loadOptionalLoadsConfig();
    const enabled = config.filter(load => load.enabled && load.forecastEntity && load.historicalEntity);
    return enabled;
  }

  // Build maps for optional loads forecast data (for FUTURE tab)
  _buildOptionalLoadsForecastMaps() {
    const enabledLoads = this._getEnabledOptionalLoads();
    const maps = [];
    
    enabledLoads.forEach(load => {
      const entity = this._hass.states[load.forecastEntity];
      if (entity && entity.attributes && entity.attributes.forecast) {
        const map = new Map();
        (entity.attributes.forecast || []).forEach(item => {
          if (item.time && item.value !== undefined) {
            const ts = new Date(item.time).getTime();
            const kw = (parseFloat(item.value) || 0) / 1000;
            map.set(ts, kw);
          }
        });
        maps.push({ load, map });
      } else {
        maps.push({ load, map: new Map() });
      }
    });
    
    return maps;
  }

  // Build maps for optional loads historical data (for PAST tab)
  _buildOptionalLoadsHistoricalMaps() {
    const enabledLoads = this._getEnabledOptionalLoads();
    const maps = [];
    
    enabledLoads.forEach(load => {
      const entity = this._hass.states[load.historicalEntity];
      if (entity) {
        const unit = entity.attributes?.unit_of_measurement || 'W';
        const mult = unit === 'kW' ? 1 : unit === 'MW' ? 1000 : 0.001;
        maps.push({ load, entity, mult });
      } else {
        maps.push({ load, entity: null, mult: 0.001 });
      }
    });
    
    return maps;
  }

  // Populate optional loads form from saved config
  _populateOptionalLoadsForm() {
    const config = this._loadOptionalLoadsConfig();
    for (let i = 0; i < 10; i++) {
      const enableCheckbox = this.shadowRoot.getElementById(`optload-enable-${i}`);
      const emojiSelect = this.shadowRoot.getElementById(`optload-emoji-${i}`);
      const loadNameSelect = this.shadowRoot.getElementById(`optload-preset-${i}`);
      const customNameInput = this.shadowRoot.getElementById(`optload-customname-${i}`);
      const forecastInput = this.shadowRoot.getElementById(`optload-forecast-${i}`);
      const historicalInput = this.shadowRoot.getElementById(`optload-historical-${i}`);
      const energyInput = this.shadowRoot.getElementById(`optload-energy-${i}`);
      const thresholdInput = this.shadowRoot.getElementById(`optload-threshold-${i}`);
      
      if (config[i] && enableCheckbox && emojiSelect && loadNameSelect && forecastInput && historicalInput) {
        enableCheckbox.checked = config[i].enabled || false;
        emojiSelect.value = config[i].emoji || '🔌';
        loadNameSelect.value = config[i].loadName || '';
        forecastInput.value = config[i].forecastEntity || '';
        historicalInput.value = config[i].historicalEntity || '';
        if (energyInput) energyInput.value = config[i].energyEntity || '';
        if (thresholdInput) thresholdInput.value = config[i].threshold || 10;

        const showKwhInput = this.shadowRoot.getElementById(`optload-show-kwh-${i}`);
        if (showKwhInput) showKwhInput.checked = config[i].showKwh ?? true;

        // Populate custom name if it was saved
        if (customNameInput) {
          customNameInput.value = config[i].customName || '';
          if (config[i].loadName === 'custom' && config[i].customName) {
            customNameInput.style.display = 'block';
          } else {
            customNameInput.style.display = 'none';
          }
        }
      }
    }
  }

  _populateColorPickers() {
    
    // Populate color picker VALUES first
    const colorPickers = this.shadowRoot.querySelectorAll('.color-picker');
    
    colorPickers.forEach(picker => {
      // Extract category and color type from id (e.g., "color-self_consumption-bg")
      const parts = picker.id.match(/color-(.+?)-(bg|txt|cost)$/);
      if (!parts) {
        return;
      }
      
      const category = parts[1];
      const colorType = parts[2];
      const colorKey = { bg: 'bg', txt: 'txt', cost: 'cost' }[colorType];
      
      // Get the color value from _colorSettings
      const colorValue = this._colorSettings[category]?.[colorKey];
      
      if (colorValue) {
        picker.value = colorValue;
      }
    });
    
    // NOW wire event handlers (only once per picker)
    colorPickers.forEach(picker => {
      // Skip if already wired
      if (picker._wired) return;
      picker._wired = true;
      
      const parts = picker.id.match(/color-(.+?)-(bg|txt|cost)$/);
      if (!parts) return;
      
      const category = parts[1];
      const colorType = parts[2];
      const colorKey = { bg: 'bg', txt: 'txt', cost: 'cost' }[colorType];
      
      picker.addEventListener('change', (e) => {
        const newValue = e.target.value;
        
        // Update _colorSettings in memory
        if (!this._colorSettings[category]) {
          this._colorSettings[category] = { bg: '#fff', txt: '#000', cost: '#000' };
        }
        this._colorSettings[category][colorKey] = newValue;
        
        // Save to localStorage immediately
        try {
          localStorage.setItem('haeo-events-card-colors', JSON.stringify(this._colorSettings));
        } catch (err) {
        }
        
        // Force immediate rebuild with proper event trigger
        this._lastCostTs = null;  // Reset cost timestamp to force update
        
        // Rebuild table with new colors
        if (this._activeTab === 'future') {
          this._renderFuture();
        } else {
          this._loadPast();
        }
      });
    });
    
    // Reset to defaults button - MOVED AND FIXED HERE
    const resetBtn = this.shadowRoot.getElementById('reset-colors-btn');
    if (resetBtn && !resetBtn._wired) {
      resetBtn._wired = true;
      resetBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        
        // Find which tab is active
        const activeTab = this.shadowRoot.querySelector('.settings-tab.active');
        const activeTabName = activeTab?.dataset?.tab;
        
        if (activeTabName === 'colours-self' || activeTabName === 'colours-profit' || activeTabName === 'colours-cost') {
          // Reset colors to defaults
          this._colorSettings = JSON.parse(JSON.stringify(_HAEO_COLOURS));
          
          // Update color picker VALUES
          const colorPickers = this.shadowRoot.querySelectorAll('.color-picker');
          colorPickers.forEach(picker => {
            const parts = picker.id.match(/color-(.+?)-(bg|txt|cost)$/);
            if (!parts) return;
            
            const category = parts[1];
            const colorType = parts[2];
            const colorKey = { bg: 'bg', txt: 'txt', cost: 'cost' }[colorType];
            
            if (this._colorSettings[category]) {
              const newValue = this._colorSettings[category][colorKey];
              picker.value = newValue;
            }
          });
          
        } else if (activeTabName === 'base-sensors') {
          
          // Write defaults back to localStorage — Base Sensors only (base/pv/grid/battery)
          // EV, EV2, deferLoad are reset via the Optional Loads tab
          const loadCfg = this._loadLoadEntitiesConfig();
          const resetDefaults = {
            base: { forecast: 'sensor.base_load_power', historical: 'sensor.sigen_plant_total_load_power', energy: 'sensor.sigen_plant_total_load_consumption' },
            pv: { forecast: 'sensor.solar_power', historical: 'sensor.sigen_plant_pv_power', energy: 'sensor.sigen_plant_total_pv_generation' },
            grid: { forecast: 'sensor.grid_active_power', historical: 'sensor.sigen_plant_grid_active_power', energy: 'sensor.sigen_plant_total_imported_energy', energyExport: 'sensor.sigen_plant_total_exported_energy', dailyImport: 'sensor.sigen_plant_daily_grid_import_energy', dailyExport: 'sensor.sigen_plant_daily_grid_export_energy' },
            battery: { forecast: 'sensor.battery_active_power', historical: 'sensor.sigen_plant_battery_power', energy: 'sensor.sigen_plant_daily_battery_charge_energy', energyDischarge: 'sensor.sigen_plant_daily_battery_discharge_energy' },
            // Preserve existing EV/EV2/deferLoad values
            ev: loadCfg.ev,
            ev2: loadCfg.ev2,
            deferLoad: loadCfg.deferLoad,
          };
          try { localStorage.setItem('haeo-events-card-load-entities', JSON.stringify(resetDefaults)); } catch (e) {}

          // Reset threshold inputs for base sensors only
          const thresholdDefaults = {
            'threshold-load': 0,
            'threshold-pv': 50,
            'threshold-grid': 100,
            'threshold-battery': 100,
          };
          Object.entries(thresholdDefaults).forEach(([id, defaultValue]) => {
            const input = this.shadowRoot.getElementById(id);
            if (input) input.value = defaultValue;
          });

          // Populate all entity inputs from the defaults we just saved
          this._populateLoadEntitiesForm();

          // Reset invert toggles for base sensors only
          ['load', 'pv', 'grid', 'battery'].forEach(id => {
            const cb = this.shadowRoot.getElementById(`invert-${id}`);
            if (cb) cb.checked = false;
          });
          
        } else if (activeTabName === 'optional-loads') {

          // Reset fixed rows: Deferrable Loads, EV, EV2
          const fixedDefaults = {
            deferLoad: { forecast: 'sensor.deferrable_loads_power_forecast', historical: 'sensor.deferrable_loads_power', energy: 'sensor.deferrable_loads_energy', threshold: 5 },
            ev:        { forecast: 'sensor.ev_active_power', historical: 'sensor.sigen_ac_charger_charging_power', energy: 'sensor.sigen_plant_total_charged_energy_of_the_evac', energyDischarge: '', threshold: 100 },
            ev2:       { forecast: 'sensor.ev2_active_power', historical: 'sensor.sigen_dc_charger_output_power', energy: 'sensor.sigen_plant_total_charged_energy_of_the_evdc', energyDischarge: 'sensor.sigen_plant_total_discharged_energy_of_the_evdc', threshold: 100 },
          };
          ['deferLoad', 'ev', 'ev2'].forEach(key => {
            const d = fixedDefaults[key];
            const enable   = this.shadowRoot.getElementById(`col-${key}`);
            const thresh   = this.shadowRoot.getElementById(`threshold-${key}`);
            const showKwh  = this.shadowRoot.getElementById(`show-kwh-${key}`);
            const forecast = this.shadowRoot.getElementById(`${key}-forecast`);
            const hist     = this.shadowRoot.getElementById(`${key}-historical`);
            const energy   = this.shadowRoot.getElementById(`${key}-energy`);
            const energyDis= this.shadowRoot.getElementById(`${key}-energy-discharge`);
            const invert   = this.shadowRoot.getElementById(`invert-${key}`);
            if (enable)    enable.checked = false;
            if (thresh)    thresh.value = d.threshold;
            if (showKwh)   showKwh.checked = true;
            if (forecast)  forecast.value = d.forecast;
            if (hist)      hist.value = d.historical;
            if (energy)    energy.value = d.energy;
            if (energyDis) energyDis.value = d.energyDischarge || '';
            if (invert)    invert.checked = false;
          });

          // Also write defaults back to localStorage for these fixed rows
          try {
            const loadCfg = this._loadLoadEntitiesConfig();
            loadCfg.deferLoad = { ...fixedDefaults.deferLoad, invert: false, showKwh: true };
            loadCfg.ev        = { ...fixedDefaults.ev,        invert: false, showKwh: true };
            loadCfg.ev2       = { ...fixedDefaults.ev2,       invert: false, showKwh: true };
            localStorage.setItem('haeo-events-card-load-entities', JSON.stringify(loadCfg));
          } catch (e) {}

          // Reset optional loads config object (10 pull-down rows)
          if (this._optionalLoadsConfig) {
            this._optionalLoadsConfig.forEach(config => {
              config.enabled = false;
              config.threshold = 10;
              config.emoji = '🔌';
              config.loadName = '';
              config.customName = '';
              config.forecastEntity = '';
              config.historicalEntity = '';
              config.energyEntity = '';
              config.showKwh = true;
            });
          }
          // Update all UI inputs for optional loads
          for (let i = 0; i < 10; i++) {
            const enableCheckbox  = this.shadowRoot.getElementById(`optload-enable-${i}`);
            const emojiSelect     = this.shadowRoot.getElementById(`optload-emoji-${i}`);
            const presetSelect    = this.shadowRoot.getElementById(`optload-preset-${i}`);
            const thresholdInput  = this.shadowRoot.getElementById(`optload-threshold-${i}`);
            const forecastInput   = this.shadowRoot.getElementById(`optload-forecast-${i}`);
            const historicalInput = this.shadowRoot.getElementById(`optload-historical-${i}`);
            const energyInput     = this.shadowRoot.getElementById(`optload-energy-${i}`);

            if (enableCheckbox)  enableCheckbox.checked = false;
            if (emojiSelect)     emojiSelect.value = '🔌';
            if (presetSelect)    presetSelect.value = '';
            if (thresholdInput)  thresholdInput.value = 10;
            if (forecastInput)   forecastInput.value = '';
            if (historicalInput) historicalInput.value = '';
            if (energyInput)     energyInput.value = '';
            const showKwhInput = this.shadowRoot.getElementById(`optload-show-kwh-${i}`);
            if (showKwhInput)    showKwhInput.checked = true;
          }
        }
      });
    }
  }

  // Export settings to JSON file
  _exportSettings() {
    const allSettings = {
      version: _HAEO_VERSION,
      exportDate: new Date().toISOString(),
      columns: this._columnSettings,
      colors: this._colorSettings,
      thresholds: this._thresholdSettings,
      deferableLoads: this._deferableLoadsConfig,
      optionalLoads: this._loadOptionalLoadsConfig()
    };
    
    const json = JSON.stringify(allSettings, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `haeo-events-card-backup-${new Date().toISOString().replace(/[:.]/g, '').slice(0,15)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Import settings from JSON file
  _importSettings(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        
        // Validate backup format
        if (!data.columns || !data.colors || !data.thresholds) {
          alert('Invalid backup file format');
          return;
        }
        
        // Apply settings
        this._columnSettings = data.columns || this._columnSettings;
        this._colorSettings = data.colors || this._colorSettings;
        this._thresholdSettings = data.thresholds || this._thresholdSettings;
        this._deferableLoadsConfig = data.deferableLoads || this._deferableLoadsConfig;
        
        // Save to localStorage and reload
        try {
          localStorage.setItem('haeo-events-card-columns', JSON.stringify(this._columnSettings));
          localStorage.setItem('haeo-events-card-colors', JSON.stringify(this._colorSettings));
          localStorage.setItem('haeo-events-card-thresholds', JSON.stringify(this._thresholdSettings));
          localStorage.setItem('haeo-events-card-deferrable-loads', JSON.stringify(this._deferableLoadsConfig));
          if (data.optionalLoads) {
            localStorage.setItem('haeo-events-card-optional-loads', JSON.stringify(data.optionalLoads));
          }
          if (data.deferrableLoadsEntities) {
            localStorage.setItem('haeo-events-card-deferrable-loads-entities', JSON.stringify(data.deferrableLoadsEntities));
          }
        } catch (e) {
        }
        
        alert('Settings imported successfully!');
        window.location.reload();
      } catch (error) {
        alert('Error reading backup file: ' + error.message);
      }
    };
    reader.readAsText(file);
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
