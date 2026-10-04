// ── GENERGY LOCAL PATCHES (re-apply after syncing from Roving-Ronin/EMS-Events-Card) ──
//   #41 `bess_batt_invert: true` config flag negates Past (BESS) battery power (+ve=discharge inverters).
//   #42 _showResolvedSensors(): empty override fields show the resolved entity + source; brand
//       auto-fill (_applyInverterPreset) only fills empty fields with entities that exist.
// ─────────────────────────────────────────────────────────────────────────────────────────
// EMHASS Events Card v2.6.7
// Combines Future Decisions (forecast) and Past Events (history) in one card
// MODIFICATIONS: 
//   - SoC % moved under Battery column (3 sub-cols: kW/kWh/SoC%)
//   - EV column added (3 sub-cols: kW/kWh/SoC%)
//   - Defer. Loads column added (3 sub-cols: kW/kWh/SoC%)
//
// Modelled on haeo-events-card structure and style
// Copy to /config/www/emhass-events-card.js
// Add resource: /local/emhass-events-card.js (type: JavaScript module)
//
// Sensor resolution uses a three-tier fallback per sensor:
//   1. Explicit card YAML config (highest priority)
//   2. Sigenergy/annable.me MPC sensor names
//   3. Standard EMHASS sensor names (lowest priority / generic fallback)
//
// Card YAML example with all overrides:
//   type: custom:emhass-events-card
//   grid_options:
//     columns: full
//     rows: auto
//   p_batt_forecast:      sensor.mpc_batt_power
//   p_grid_forecast:      sensor.mpc_grid_power
//   p_pv_forecast:        sensor.mpc_pv_power
//   p_load_forecast:      sensor.mpc_load_power
//   p_inverter:           sensor.mpc_inverter_power
//   soc_forecast:         sensor.mpc_batt_soc
//   buy_price:            sensor.mpc_general_price
//   sell_price:           sensor.mpc_feed_in_price
//   net_cost:             sensor.mpc_cost_fun
//   past_buy_price:       sensor.amber_general_price        # Actual buy price for Past Events tab
//   past_sell_price:      sensor.amber_feed_in_price        # Actual sell price for Past Events tab
//
// BESS actual inverter sensors (Past tab — 🕐 BESS Data mode):
// Sign convention: battery +ve=charging, -ve=discharging (opposite to MPC sensors)
//   bess_batt_power:      sensor.sigen_plant_battery_power
//   bess_grid_power:      sensor.sigen_plant_grid_active_power
//   bess_pv_power:        sensor.sigen_plant_pv_power
//   bess_load_power:      sensor.sigen_plant_consumed_power
//   bess_soc:             sensor.sigen_plant_battery_state_of_charge
//   energy_load:           sensor.sigen_plant_total_load_consumption         # MUST be lifetime/total — daily sensors reset at midnight causing gaps
//   energy_solar:          sensor.sigen_plant_total_pv_generation              # MUST be lifetime/total
//   energy_grid_import:    sensor.sigen_plant_total_imported_energy            # MUST be lifetime/total
//   energy_grid_export:    sensor.sigen_plant_total_exported_energy            # MUST be lifetime/total
//   energy_batt_charge:    sensor.sigen_plant_total_charged_energy_of_the_ess  # MUST be lifetime/total
//   energy_batt_discharge: sensor.sigen_plant_total_discharged_energy_of_the_ess # MUST be lifetime/total

const _EMHASS_VERSION = 'v2.6.7';
let _EMHASS_CUR = '$'; // Currency symbol — set from config.currency_symbol or HA config

// Map ISO 4217 currency codes to symbols
const _EMHASS_CUR_MAP = {
  AUD:'$', USD:'$', CAD:'$', NZD:'$', SGD:'$', HKD:'$',
  GBP:'£', EUR:'€', JPY:'¥', CNY:'¥', CHF:'Fr', SEK:'kr',
  NOK:'kr', DKK:'kr', INR:'₹', KRW:'₩', BRL:'R$', MXN:'$',
  ZAR:'R', THB:'฿', TWD:'NT$', IDR:'Rp', MYR:'RM', PHP:'₱',
};
function _emhass_curSymbol(code) {
  if (!code) return '$';
  return _EMHASS_CUR_MAP[code.toUpperCase()] || code;
}

// ── Tier 2: Sigenergy / annable.me MPC sensor names ─────────────────────────
const _EMHASS_MPC = {
  p_batt_forecast:       'sensor.mpc_batt_power',
  p_grid_forecast:       'sensor.mpc_grid_power',
  p_pv_forecast:         'sensor.mpc_pv_power',
  p_load_forecast:       'sensor.mpc_load_power',
  p_inverter:            'sensor.mpc_inverter_power',
  soc_forecast:          'sensor.mpc_batt_soc',
  p_ev_forecast:         'sensor.mpc_ev_power',
  soc_ev_forecast:       'sensor.mpc_ev_soc',
  p_defer_forecast:      'sensor.mpc_defer_power',
  soc_defer_forecast:    'sensor.mpc_defer_soc',
  buy_price:             'sensor.mpc_general_price',
  sell_price:            'sensor.mpc_feed_in_price',
  net_cost:              'sensor.mpc_cost_fun',
  optim_status:          'sensor.mpc_optim_status',
  emhass_automation:     'automation.emhass_generate_energy_plan',
  energy_capacity:       'sensor.sigen_plant_rated_energy_capacity', // kWh — for SoC pill kWh display
  past_buy_price:        'sensor.amber_express_home_general_price',
  past_sell_price:       'sensor.amber_express_home_feed_in_price',
  energy_load:           'sensor.sigen_plant_total_load_consumption',
  energy_solar:          'sensor.sigen_plant_total_pv_generation',
  energy_grid_import:    'sensor.sigen_plant_total_imported_energy',
  energy_grid_export:    'sensor.sigen_plant_total_exported_energy',
  energy_batt_charge:    'sensor.sigen_plant_total_charged_energy_of_the_ess',
  energy_batt_discharge: 'sensor.sigen_plant_total_discharged_energy_of_the_ess',
  energy_ev:             'sensor.sigen_plant_total_ev_energy',
  energy_defer:          'sensor.sigen_plant_total_defer_energy',
  bess_batt_power:       'sensor.sigen_plant_battery_power',
  bess_grid_power:       'sensor.sigen_plant_grid_active_power',
  bess_pv_power:         'sensor.sigen_plant_pv_power',
  bess_load_power:       'sensor.sigen_plant_consumed_power',
  bess_soc:              'sensor.sigen_plant_battery_state_of_charge',
};

// ── Tier 3: Standard EMHASS sensor names ────────────────────────────────────
const _EMHASS_STD = {
  p_batt_forecast:       'sensor.p_batt_forecast',
  p_grid_forecast:       'sensor.p_grid_forecast',
  p_pv_forecast:         'sensor.p_pv_forecast',
  p_load_forecast:       'sensor.p_load_forecast',
  p_inverter:            null,
  soc_forecast:          'sensor.soc_batt_forecast',
  p_ev_forecast:         null,
  soc_ev_forecast:       null,
  p_defer_forecast:      null,
  soc_defer_forecast:    null,
  buy_price:             'sensor.unit_load_cost',
  sell_price:            'sensor.unit_prod_price',
  net_cost:              'sensor.total_cost_fun_value',
  optim_status:          'sensor.mpc_optim_status',
  emhass_automation:     'automation.emhass_run_mpc_optimizer',
  energy_capacity:       null, // Not available in standard EMHASS — configure via card YAML
  past_buy_price:        'sensor.unit_load_cost',
  past_sell_price:       'sensor.unit_prod_price',
  energy_load:           null,
  energy_solar:          null,
  energy_grid_import:    null,
  energy_grid_export:    null,
  energy_batt_charge:    null,
  energy_batt_discharge: null,
  energy_ev:             null,
  energy_defer:          null,
  bess_batt_power:       null,
  bess_grid_power:       null,
  bess_pv_power:         null,
  bess_load_power:       null,
  bess_soc:              null,
};

// ── Forecast attribute + value key candidates per sensor role ────────────────
const _EMHASS_FC_KEYS = {
  p_batt_forecast: [
    { attr: 'battery_scheduled_power', key: 'mpc_batt_power'   },
    { attr: 'battery_scheduled_power', key: 'p_batt_forecast'  },
  ],
  p_grid_forecast: [
    { attr: 'forecasts',               key: 'mpc_grid_power'   },
    { attr: 'forecasts',               key: 'p_grid_forecast'  },
    { attr: 'p_grid_forecast',         key: 'p_grid_forecast'  },
  ],
  p_pv_forecast: [
    { attr: 'forecasts',               key: 'mpc_pv_power'     },
    { attr: 'forecasts',               key: 'p_pv_forecast'    },
  ],
  p_load_forecast: [
    { attr: 'forecasts',               key: 'mpc_load_power'   },
    { attr: 'forecasts',               key: 'p_load_forecast'  },
  ],
  p_inverter: [
    { attr: 'forecasts',               key: 'mpc_inverter_power' },
  ],
  p_ev_forecast: [
    { attr: 'forecasts',               key: 'mpc_ev_power'     },
    { attr: 'forecasts',               key: 'p_ev_forecast'    },
  ],
  p_defer_forecast: [
    { attr: 'forecasts',               key: 'mpc_defer_power'  },
    { attr: 'forecasts',               key: 'p_defer_forecast' },
  ],
  soc_forecast: [
    { attr: 'battery_scheduled_soc',   key: 'mpc_batt_soc'     },
    { attr: 'battery_scheduled_soc',   key: 'soc_batt_forecast'},
  ],
  soc_ev_forecast: [
    { attr: 'battery_scheduled_soc',   key: 'mpc_ev_soc'       },
    { attr: 'battery_scheduled_soc',   key: 'soc_ev_forecast'  },
  ],
  soc_defer_forecast: [
    { attr: 'battery_scheduled_soc',   key: 'mpc_defer_soc'    },
    { attr: 'battery_scheduled_soc',   key: 'soc_defer_forecast'},
  ],
  buy_price: [
    { attr: 'unit_load_cost_forecasts', key: 'mpc_general_price'  },
    { attr: 'unit_load_cost_forecasts', key: 'unit_load_cost'     },
  ],
  sell_price: [
    { attr: 'unit_prod_price_forecasts', key: 'mpc_feed_in_price' },
    { attr: 'unit_prod_price_forecasts', key: 'mpc_prod_price'    },
    { attr: 'unit_prod_price_forecasts', key: 'unit_prod_price'   },
  ],
};

// ── Colour scheme ─────────────────────────────────────────────────────────────
// Detect HA light/dark mode — returns '#000' for light bg, primary-text-color for dark
function _emhass_textForBg(bgHex) {
  // For rgba backgrounds (dark-mode overlays) always use white
  if (bgHex.startsWith('rgba')) return '#ffffff';
  const r = parseInt(bgHex.slice(1,3),16), g = parseInt(bgHex.slice(3,5),16), b = parseInt(bgHex.slice(5,7),16);
  return (r*299 + g*587 + b*114) / 1000 > 160 ? '#000000' : 'var(--primary-text-color)';
}

const _EMHASS_COLOURS = {
  solar_green: { bg: '#ccffcc', txt: _emhass_textForBg('#ccffcc'), cost: _emhass_textForBg('#ccffcc') },
  solar:       { bg: '#ffffcc', txt: _emhass_textForBg('#ffffcc'), cost: _emhass_textForBg('#ffffcc') },
  teal:        { bg: '#ccfff5', txt: _emhass_textForBg('#ccfff5'), cost: _emhass_textForBg('#ccfff5') },
  pink:        { bg: '#ffe0e0', txt: _emhass_textForBg('#ffe0e0'), cost: '#cc3333' },
  red:         { bg: 'rgba(180,50,50,0.35)',  txt: '#ffffff',   cost: '#ffaaaa' },
  green:       { bg: 'rgba(30,150,80,0.55)',  txt: '#ffffff',   cost: '#90ffb0' },
  orange:      { bg: 'rgba(255,165,0,0.35)',  txt: '#ffffff',   cost: '#ffcc66' },
};

// ── Legend ────────────────────────────────────────────────────────────────────
const _EMHASS_LEG_L = [
  ['#ccffcc','#333','🌞 Solar → 🏠 Home',                               'Self Consumption — Solar only'],
  ['#ccffcc','#333','🌞 Solar → 🏠 Home + 🔋 Battery',                 'Self Consumption — Charge Battery (Solar)'],
  ['#ccffcc','#333','🌞 Solar → 🏠 Home + ⚡ Grid',                    'Profit — Grid Export (Solar)'],
  ['#ccffcc','#333','🌞 Solar → 🏠 Home + 🔋 Battery + ⚡ Grid',       'Profit — Grid Export + Charge Battery'],
  ['#ccfff5','#333','🌞 Solar + 🔋 Battery → 🏠 Home',                 'Self Consumption — Solar + Battery, No Grid'],
  ['#ffe0e0','#333','🌞 Solar + ⚡ Grid → 🏠 Home',                    'Cost — Solar + Grid Import'],
  ['#ffe0e0','#333','🌞 Solar + ⚡ Grid → 🏠 Home + 🔋 Battery (Force)','Cost — Solar + Grid Import + Charge Battery'],
  ['rgba(30,150,80,0.55)','#fff','🌞 Solar + 🔋 Battery → 🏠 Home + ⚡ Grid (Force)','Profit — Forced Export (Solar + Battery)'],
];

const _EMHASS_LEG_R = [
  ['#ccfff5','#333','🔋 Battery → 🏠 Home',                            'Self Consumption — Battery only'],
  ['#ffffcc','#333','🔋 Battery → 🏠 Home + ⚡ Grid (Force)',          'Profit — Forced Export (Battery)'],
  ['#ffe0e0','#333','🔋 Battery + ⚡ Grid → 🏠 Home',                  'Cost — Battery + Grid Import'],
  ['rgba(180,50,50,0.35)','#fff','⚡ Grid → 🏠 Home',                  'Cost — Grid Import (Battery Idle, No Solar)'],
  ['rgba(180,50,50,0.35)','#fff','⚡ Grid → 🏠 Home + 🔋 Battery (Force)','Cost — Grid Import (Forced Battery Charge)'],
  ['#ffe0e0','#333','🌞 Solar + 🔋 Battery + ⚡ Grid → 🏠 Home',      'Cost — Solar + Battery + Grid Import'],
  ['rgba(255,165,0,0.35)','#333','🚿 HWS / 🚗 EV / ❄️ HVAC',          'Deferrable load scheduled'],
  ['','','',''],
];

// ── Classify future ───────────────────────────────────────────────────────────
function _emhass_classifyFuture(pvW, loadW, battW, gridW) {
  const T = 50;
  const charging    = battW < -T;
  const discharging = battW >  T;
  const importing   = gridW >  T;
  const exporting   = gridW < -T;
  const hasPV       = pvW   >  T;

  if (exporting && discharging && hasPV)
    return { label: '🌞 Solar + 🔋 Battery → 🏠 Home + ⚡ Grid (Force)', note: 'Forced export: solar and battery exporting to grid', color: 'green',      mode: 'Command Discharging (PV First)' };
  if (exporting && discharging)
    return { label: '🔋 Battery → 🏠 Home + ⚡ Grid (Force)',             note: 'Forced discharge: battery exporting to grid',        color: 'solar',      mode: 'Command Discharging' };

  if (charging && importing && hasPV)
    return { label: '🌞 Solar + ⚡ Grid → 🏠 Home + 🔋 Battery (Force)', note: 'Solar + forced grid charging battery',               color: 'pink',       mode: 'Command Charging (PV First)' };
  if (charging && importing)
    return { label: '⚡ Grid → 🏠 Home + 🔋 Battery (Force)',             note: 'Forced grid charging — cheap rate window',           color: 'red',        mode: 'Command Charging' };
  if (charging && hasPV)
    return { label: '🌞 Solar → 🏠 Home + 🔋 Battery',                   note: 'Solar covering home and charging battery — no grid', color: 'solar_green', mode: 'Maximum Self Consumption' };

  if (hasPV && exporting && discharging)
    return { label: '🌞 Solar + 🔋 Battery → 🏠 Home + ⚡ Grid (Force)', note: 'Solar and battery covering home and exporting',      color: 'green',      mode: 'Command Discharging (PV First)' };
  if (hasPV && exporting && charging)
    return { label: '🌞 Solar → 🏠 Home + 🔋 Battery + ⚡ Grid',         note: 'Solar covering home, charging battery and exporting', color: 'solar_green', mode: 'Maximum Self Consumption' };
  if (hasPV && exporting)
    return { label: '🌞 Solar → 🏠 Home + ⚡ Grid',                      note: 'Solar covering home and exporting surplus',          color: 'solar_green', mode: 'Maximum Self Consumption' };
  if (hasPV && discharging && importing)
    return { label: '🌞 Solar + 🔋 Battery + ⚡ Grid → 🏠 Home',         note: 'Solar and battery discharging but grid also needed', color: 'pink',       mode: 'Maximum Self Consumption' };
  if (hasPV && discharging)
    return { label: '🌞 Solar + 🔋 Battery → 🏠 Home',                   note: 'Solar and battery together covering home — no grid', color: 'teal',       mode: 'Maximum Self Consumption' };
  if (hasPV && importing)
    return { label: '🌞 Solar + ⚡ Grid → 🏠 Home',                      note: 'Solar and grid together covering home',              color: 'pink',       mode: 'Maximum Self Consumption' };
  if (hasPV && charging)
    return { label: '🌞 Solar → 🏠 Home + 🔋 Battery',                   note: 'Solar covering home and charging battery — no grid', color: 'solar_green', mode: 'Maximum Self Consumption' };
  if (hasPV)
    return { label: '🌞 Solar → 🏠 Home',                                 note: 'Solar covering home — no battery, no grid',          color: 'solar_green', mode: 'Maximum Self Consumption' };

  if (discharging && exporting)
    return { label: '🔋 Battery → 🏠 Home + ⚡ Grid (Force)',             note: 'Forced discharge: battery exporting to grid',        color: 'solar',      mode: 'Command Discharging' };
  if (discharging && importing)
    return { label: '🔋 Battery + ⚡ Grid → 🏠 Home',                     note: 'Battery discharging but grid supplement needed',     color: 'pink',       mode: 'Maximum Self Consumption' };
  if (discharging)
    return { label: '🔋 Battery → 🏠 Home',                               note: 'Battery powering home — no solar, no grid',          color: 'teal',       mode: 'Maximum Self Consumption' };
  if (importing && charging)
    return { label: '⚡ Grid → 🏠 Home + 🔋 Battery (Force)',             note: 'Forced grid charging — cheap rate window',           color: 'red',        mode: 'Command Charging' };
  if (importing)
    return { label: '⚡ Grid → 🏠 Home',                                   note: 'Grid covering home — battery idle',                  color: 'red',        mode: 'Standby' };
  if (loadW > T)
    return { label: '🔋 Battery → 🏠 Home',                               note: 'Inferred: battery powering home — no explicit source in forecast', color: 'teal', mode: 'Maximum Self Consumption' };
  return { label: '—', note: '', color: '', mode: '' };
}

// ── Classify past ─────────────────────────────────────────────────────────────
function _emhass_classifyPast(pvW, loadW, battW, gridW) {
  const T = 50;
  const charging    = battW < -T;
  const discharging = battW >  T;
  const importing   = gridW >  T;
  const exporting   = gridW < -T;
  const hasPV       = pvW   >  T;

  if (exporting && discharging && hasPV)
    return { label: '🌞 Solar + 🔋 Battery → 🏠 Home + ⚡ Grid (Force)', note: 'Solar and battery both exporting surplus to grid — forced discharge active',                color: 'green',       mode: 'Command Discharging (PV First)' };
  if (exporting && discharging)
    return { label: '🔋 Battery → 🏠 Home + ⚡ Grid (Force)',             note: 'Battery discharging to cover home load and export to grid — forced discharge active',      color: 'solar',       mode: 'Command Discharging' };
  if (hasPV && exporting && charging)
    return { label: '🌞 Solar → 🏠 Home + 🔋 Battery + ⚡ Grid',         note: 'Solar covering home, charging battery and exporting surplus to grid',                       color: 'solar_green', mode: 'Maximum Self Consumption' };
  if (hasPV && exporting)
    return { label: '🌞 Solar → 🏠 Home + ⚡ Grid',                      note: 'Solar covering home with surplus exported to grid — battery idle',                          color: 'solar_green', mode: 'Maximum Self Consumption' };
  if (charging && importing && hasPV)
    return { label: '🌞 Solar + ⚡ Grid → 🏠 Home + 🔋 Battery (Force)', note: 'Solar and grid both charging battery — forced charge command active',                       color: 'pink',        mode: 'Command Charging (PV First)' };
  if (charging && importing)
    return { label: '⚡ Grid → 🏠 Home + 🔋 Battery (Force)',             note: 'Grid charging battery — forced charge command, typically during cheap rate window',         color: 'red',         mode: 'Command Charging' };
  if (charging && hasPV)
    return { label: '🌞 Solar → 🏠 Home + 🔋 Battery',                   note: 'Solar covering home and charging battery — no grid needed',                                 color: 'solar_green', mode: 'Maximum Self Consumption' };
  if (hasPV && discharging && importing)
    return { label: '🌞 Solar + 🔋 Battery + ⚡ Grid → 🏠 Home',         note: 'Solar and battery both discharging but grid still needed to cover load',                    color: 'pink',        mode: 'Maximum Self Consumption' };
  if (hasPV && discharging)
    return { label: '🌞 Solar + 🔋 Battery → 🏠 Home',                   note: 'Solar and battery covering home load together — no grid needed',                            color: 'teal',        mode: 'Maximum Self Consumption' };
  if (hasPV && importing)
    return { label: '🌞 Solar + ⚡ Grid → 🏠 Home',                      note: 'Solar insufficient — grid topping up to cover home load',                                   color: 'pink',        mode: 'Maximum Self Consumption' };
  if (hasPV && charging)
    return { label: '🌞 Solar → 🏠 Home + 🔋 Battery',                   note: 'Solar covering home and charging battery — no grid needed',                                 color: 'solar_green', mode: 'Maximum Self Consumption' };
  if (hasPV)
    return { label: '🌞 Solar → 🏠 Home',                                 note: 'Solar covering home load — battery idle, no grid',                                          color: 'solar_green', mode: 'Maximum Self Consumption' };
  if (discharging && exporting)
    return { label: '🔋 Battery → 🏠 Home + ⚡ Grid (Force)',             note: 'Battery discharging to cover home and export to grid',                                      color: 'solar',       mode: 'Command Discharging' };
  if (discharging && importing)
    return { label: '🔋 Battery + ⚡ Grid → 🏠 Home',                     note: 'Battery discharging but grid still needed to supplement load',                              color: 'pink',        mode: 'Maximum Self Consumption' };
  if (discharging)
    return { label: '🔋 Battery → 🏠 Home',                               note: 'Battery covering home load — no solar, no grid needed',                                     color: 'teal',        mode: 'Maximum Self Consumption' };
  if (importing && charging)
    return { label: '⚡ Grid → 🏠 Home + 🔋 Battery (Force)',             note: 'Grid charging battery — forced charge during cheap rate window',                            color: 'red',         mode: 'Command Charging' };
  if (importing)
    return { label: '⚡ Grid → 🏠 Home',                                   note: 'Grid covering home load — battery idle, no solar',                                          color: 'red',         mode: 'Standby' };
  if (loadW > T)
    return { label: '⚡ Grid → 🏠 Home',                                   note: 'Grid covering home load — battery idle, no solar',                                          color: 'red',         mode: 'Standby' };
  return { label: '—', note: '', color: '', mode: '' };
}

// ── Formatters ────────────────────────────────────────────────────────────────
let _emhass_priceDecimals = 4; // Configurable — set from settings modal
function _emhass_fmtP(v) {
  return _EMHASS_CUR + Math.abs(v).toFixed(_emhass_priceDecimals);
}

const _EMHASS_NOISE_W      = 10;
const _EMHASS_NOISE_BESS_PG = 50;
function _emhass_clamp(w) { return Math.abs(w) < _EMHASS_NOISE_W ? 0 : w; }
function _emhass_clampBessPG(w) { return Math.abs(w) < _EMHASS_NOISE_BESS_PG ? 0 : w; }

function _emhass_fmtCost(cost) {
  if (cost > 0.0001)  return { disp: '-' + _EMHASS_CUR + cost.toFixed(3),           col: null };
  if (cost < -0.0001) return { disp: _EMHASS_CUR + Math.abs(cost).toFixed(3), col: '#4caf50' };
  return { disp: '—', col: null };
}

function _emhass_getAt(arr, ts) {
  if (!arr || !arr.length) return null;
  let lo = 0, hi = arr.length - 1, best = null;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (arr[mid].t <= ts) { best = arr[mid].s; lo = mid + 1; }
    else hi = mid - 1;
  }
  return best;
}

function _emhass_getDelta(arr, ts, prevTs, mult) {
  if (!arr || !arr.length) return null;
  const curr = parseFloat(_emhass_getAt(arr, ts));
  const prev = parseFloat(_emhass_getAt(arr, prevTs));
  if (isNaN(curr) || isNaN(prev)) return null;
  const delta = curr - prev;
  return delta < 0 ? 0 : delta * (mult || 1);
}

function _emhass_bucket5min(lookup, eids, avgEids, lastEids) {
  const step = 5 * 60 * 1000;
  const buckets = {};
  for (const eid of eids) {
    if (!lookup[eid]) continue;
    buckets[eid] = {};
    for (const s of lookup[eid]) {
      const bk = Math.floor(s.t / step) * step;
      if (!buckets[eid][bk]) buckets[eid][bk] = { sum: 0, count: 0, last: null };
      const v = parseFloat(s.s);
      if (!isNaN(v)) { buckets[eid][bk].sum += v; buckets[eid][bk].count++; }
      buckets[eid][bk].last = s.s;
    }
  }
  const agg = {};
  for (const eid of eids) {
    if (!buckets[eid]) continue;
    const useAvg = avgEids.includes(eid);
    agg[eid] = Object.entries(buckets[eid])
      .map(([bk, b]) => ({
        t: parseInt(bk),
        s: useAvg && b.count > 0 ? String((b.sum / b.count).toFixed(2)) : b.last,
      }))
      .sort((a, b) => a.t - b.t);
  }
  return agg;
}

function _emhass_powerMult(hass, entityId) {
  if (!entityId) return 0.001;
  const u = (hass?.states[entityId]?.attributes?.unit_of_measurement || 'W').trim().toUpperCase();
  if (u === 'W')  return 0.001;
  if (u === 'KW') return 1;
  if (u === 'MW') return 1000;
  return 0.001;
}

function _emhass_energyMult(hass, entityId) {
  if (!entityId) return 1;
  const u = (hass?.states[entityId]?.attributes?.unit_of_measurement || 'kWh').trim().toUpperCase();
  if (u === 'WH')  return 0.001;
  if (u === 'KWH') return 1;
  if (u === 'MWH') return 1000;
  return 1;
}


// ── Settings modal HTML ───────────────────────────────────────────────────────
function _emhass_buildSettingsModal() {
  const inp = (id, ph, val='') => '<input type="text" id="' + id + '" placeholder="' + ph + '" value="' + val + '" style="padding:6px;font-size:11px;width:100%;box-sizing:border-box;background:var(--card-background-color);color:var(--primary-text-color);border:1px solid var(--divider-color);border-radius:4px;">';
  const num = (id, val, min, step, def) => '<div style="display:flex;flex-direction:column;gap:2px;align-items:center;">' +
    '<input type="number" id="' + id + '" min="' + min + '" step="' + step + '" value="' + val + '" style="padding:4px;font-size:11px;width:60px;text-align:center;background:var(--card-background-color);color:var(--primary-text-color);border:1px solid var(--divider-color);border-radius:4px;">' +
    '<div style="font-size:8px;color:var(--secondary-text-color);">Default: ' + def + '</div></div>';
  const row = (cols) => '<div style="display:grid;grid-template-columns:' + cols + ';gap:8px;align-items:start;padding:8px 0;border-bottom:1px solid var(--divider-color,#444);">';
  const hdr = (cols, labels) => '<div style="display:grid;grid-template-columns:' + cols + ';gap:8px;font-weight:bold;font-size:11px;padding-bottom:8px;border-bottom:2px solid var(--divider-color);margin-bottom:4px;">' + labels.map(l => '<div>' + l + '</div>').join('') + '</div>';
  const sec = (t) => '<div style="font-size:13px;font-weight:bold;color:#2196f3;margin:16px 0 8px 0;border-bottom:1px solid var(--divider-color);padding-bottom:4px;">' + t + '</div>';

  return '<div id="settings-modal" class="settings-modal" style="display:none;">' +
    '<div class="settings-modal-content" style="max-width:900px;width:92vw;max-height:88vh;display:flex;flex-direction:column;">' +
    '<div class="settings-modal-header"><h2 style="margin:0;font-size:16px;">⚙️ EMHASS Events Card Settings</h2>' +
    '<button id="settings-modal-close" class="settings-modal-close">&times;</button></div>' +
    // Tab bar
    '<div style="display:flex;border-bottom:2px solid var(--divider-color);background:var(--card-background-color);">' +
    '<button class="settings-tab active" data-tab="sensors"  style="flex:1;padding:12px 8px;border:none;background:transparent;color:var(--primary-text-color);cursor:pointer;font-weight:600;font-size:12px;border-bottom:3px solid transparent;">🔌 Sensors</button>' +
    '<button class="settings-tab"        data-tab="thresholds" style="flex:1;padding:12px 8px;border:none;background:transparent;color:var(--secondary-text-color);cursor:pointer;font-weight:600;font-size:12px;border-bottom:3px solid transparent;">⚡ Thresholds</button>' +
    '<button class="settings-tab"        data-tab="backup"   style="flex:1;padding:12px 8px;border:none;background:transparent;color:var(--secondary-text-color);cursor:pointer;font-weight:600;font-size:12px;border-bottom:3px solid transparent;">💾 Backup</button>' +
    '</div>' +
    '<div class="settings-modal-body">' +

    // ── SENSORS TAB ────────────────────────────────────────────────────────────
    '<div class="settings-tab-content active" data-content="sensors">' +
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">' +
    '<div style="font-size:12px;color:var(--secondary-text-color);">Override default sensor entity IDs. Leave blank to use defaults.</div>' +
    '<div style="display:flex;align-items:center;gap:8px;">' +
    '<label style="font-size:12px;font-weight:bold;">🔌 Inverter Brand:</label>' +
    '<select id="inverter-brand" style="padding:6px;font-size:12px;background:var(--card-background-color);color:var(--primary-text-color);border:1px solid var(--divider-color);border-radius:4px;">' +
    '<option value="">— select to auto-fill BESS sensors —</option>' +
    '<option value="sigenergy">Sigenergy (Local Modbus)</option>' +
    '<option value="sigenergy_mqtt">Sigenergy (MQTT)</option>' +
    '<option value="deye">Deye</option>' +
    '<option value="fronius">Fronius</option>' +
    '<option value="goodwe">GoodWe</option>' +
    '<option value="huawei">Huawei</option>' +
    '<option value="sungrow">Sungrow</option>' +
    '<option value="generic">Generic / Other</option>' +
    '</select></div></div>' +

    hdr('140px 1fr 1fr', ['Sensor', 'EMHASS / Future Decisions', 'BESS / Past Events']) +

    row('140px 1fr 1fr') + '<div>🏠 Load Power</div>'  + inp('s-p-load', 'sensor.mpc_load_power')  + inp('s-b-load', 'sensor.sigen_plant_consumed_power')   + '</div>' +
    row('140px 1fr 1fr') + '<div>🌞 PV Power</div>'    + inp('s-p-pv',   'sensor.mpc_pv_power')    + inp('s-b-pv',   'sensor.sigen_plant_pv_power')           + '</div>' +
    row('140px 1fr 1fr') + '<div>⚡ Grid Power</div>'  + inp('s-p-grid', 'sensor.mpc_grid_power')  + inp('s-b-grid', 'sensor.sigen_plant_grid_active_power')  + '</div>' +
    row('140px 1fr 1fr') + '<div>🔋 Battery Power</div>'  + inp('s-p-batt', 'sensor.mpc_batt_power')  + inp('s-b-batt', 'sensor.sigen_plant_battery_power')     + '</div>' +
    row('140px 1fr 1fr') + '<div>🔋 Battery SoC</div>'    + inp('s-p-soc',  'sensor.mpc_batt_soc')    + inp('s-b-soc',  'sensor.sigen_plant_battery_state_of_charge') + '</div>' +

    sec('💲 Price Sensors') +
    row('140px 1fr 1fr') + '<div>💲 Buy Price</div>'  + inp('s-buy',      'sensor.mpc_general_price')              + inp('s-past-buy',  'sensor.amber_express_home_general_price') + '</div>' +
    row('140px 1fr 1fr') + '<div>💲 Sell Price</div>' + inp('s-sell',     'sensor.mpc_feed_in_price')              + inp('s-past-sell', 'sensor.amber_express_home_feed_in_price') + '</div>' +
    row('140px 1fr 1fr') + '<div>📊 Net Cost</div>'   + inp('s-net-cost', 'sensor.mpc_cost_fun') + '<div style="font-size:11px;color:var(--secondary-text-color);padding-top:4px;">EMHASS optimizer net cost sensor</div>' + '</div>' +

    sec('⚡ Energy Sensors (kWh — must be lifetime totals)') +
    row('140px 1fr 1fr') + '<div>🏠 Load Energy</div>'       + inp('s-e-load',   'sensor.sigen_plant_total_load_consumption')        + '<div></div>' + '</div>' +
    row('140px 1fr 1fr') + '<div>🌞 Solar Energy</div>'      + inp('s-e-solar',  'sensor.sigen_plant_total_pv_generation')           + '<div></div>' + '</div>' +
    row('140px 1fr 1fr') + '<div>⚡ Grid Import</div>'       + inp('s-e-gimp',   'sensor.sigen_plant_total_imported_energy')         + '<div></div>' + '</div>' +
    row('140px 1fr 1fr') + '<div>⚡ Grid Export</div>'       + inp('s-e-gexp',   'sensor.sigen_plant_total_exported_energy')         + '<div></div>' + '</div>' +
    row('140px 1fr 1fr') + '<div>🔋 Battery Charge</div>'       + inp('s-e-bc',     'sensor.sigen_plant_total_charged_energy_of_the_ess') + '<div></div>' + '</div>' +
    row('140px 1fr 1fr') + '<div>🔋 Battery Discharge</div>'    + inp('s-e-bd',     'sensor.sigen_plant_total_discharged_energy_of_the_ess') + '<div></div>' + '</div>' +
    row('140px 1fr 1fr') + '<div>🔋 Battery Capacity</div>'     + inp('s-e-cap',    'sensor.sigen_plant_rated_energy_capacity') + '<div style="font-size:11px;color:var(--secondary-text-color);padding-top:4px;">Used for kWh in SoC pills</div>' + '</div>' +
    '</div>' +

    // ── THRESHOLDS TAB ─────────────────────────────────────────────────────────
    '<div class="settings-tab-content" data-content="thresholds">' +
    sec('⚡ Noise Filters') +
    '<div style="display:grid;grid-template-columns:200px 100px 1fr;gap:12px;align-items:center;padding:8px 0;">' +
    '<label>🌞 PV (MPC)</label>' + num('t-noise-pv-mpc', 10, 0, 5, '10W') +
    '<div style="font-size:11px;color:var(--secondary-text-color);">PV readings below this wattage treated as zero (EMHASS MPC mode)</div></div>' +
    '<div style="display:grid;grid-template-columns:200px 100px 1fr;gap:12px;align-items:center;padding:8px 0;">' +
    '<label>⚡ Grid (MPC)</label>' + num('t-noise-grid-mpc', 10, 0, 5, '10W') +
    '<div style="font-size:11px;color:var(--secondary-text-color);">Grid readings below this wattage treated as zero (EMHASS MPC mode)</div></div>' +
    '<div style="display:grid;grid-template-columns:200px 100px 1fr;gap:12px;align-items:center;padding:8px 0;">' +
    '<label>🔋 Battery (MPC)</label>' + num('t-noise-batt-mpc', 10, 0, 5, '10W') +
    '<div style="font-size:11px;color:var(--secondary-text-color);">Battery readings below this wattage treated as zero (EMHASS MPC mode)</div></div>' +
    '<div style="display:grid;grid-template-columns:200px 100px 1fr;gap:12px;align-items:center;padding:8px 0;">' +
    '<label>🌞 PV (BESS)</label>' + num('t-noise-pv-bess', 50, 0, 10, '50W') +
    '<div style="font-size:11px;color:var(--secondary-text-color);">PV readings below this wattage treated as zero (BESS mode)</div></div>' +
    '<div style="display:grid;grid-template-columns:200px 100px 1fr;gap:12px;align-items:center;padding:8px 0;">' +
    '<label>⚡ Grid (BESS)</label>' + num('t-noise-grid-bess', 50, 0, 10, '50W') +
    '<div style="font-size:11px;color:var(--secondary-text-color);">Grid readings below this wattage treated as zero (BESS mode)</div></div>' +
    '<div style="display:grid;grid-template-columns:200px 100px 1fr;gap:12px;align-items:center;padding:8px 0;border-bottom:1px solid var(--divider-color,#444);">' +
    '<label>🔋 Battery (BESS)</label>' + num('t-noise-batt-bess', 50, 0, 10, '50W') +
    '<div style="font-size:11px;color:var(--secondary-text-color);">Battery readings below this wattage treated as zero (BESS mode)</div></div>' +

    sec('🔋 Battery') +
    '<div style="display:grid;grid-template-columns:200px 100px 1fr;gap:12px;align-items:center;padding:8px 0;border-bottom:1px solid var(--divider-color,#444);">' +
    '<label>🔋 SoC% Minimum</label>' + num('t-batt-min', 15, 0, 5, '15%') +
    '<div style="font-size:11px;color:var(--secondary-text-color);">Used for battery low alert threshold (+5% buffer added automatically)</div></div>' +

    sec('⚠️ Price Alerts') +
    '<div style="display:grid;grid-template-columns:200px 100px 1fr;gap:12px;align-items:center;padding:8px 0;">' +
    '<label>💸 High Buy / Import Level</label>' + num('t-alert-buy', 0.50, 0, 0.01, '$0.50') +
    '<div style="font-size:11px;color:var(--secondary-text-color);">Alert when forecast buy/import price exceeds this value per kWh</div></div>' +
    '<div style="display:grid;grid-template-columns:200px 100px 1fr;gap:12px;align-items:center;padding:8px 0;border-bottom:1px solid var(--divider-color,#444);">' +
    '<label>💰 High Sell / Export Level</label>' + num('t-alert-sell', 0.15, 0, 0.01, '$0.15') +
    '<div style="font-size:11px;color:var(--secondary-text-color);">Alert when forecast sell/export price exceeds this value per kWh</div></div>' +

    sec('💲 Price Display') +
    '<div style="display:grid;grid-template-columns:200px 160px 1fr;gap:12px;align-items:center;padding:8px 0;border-bottom:1px solid var(--divider-color,#444);">' +
    '<label>💲 Decimal Places</label>' +
    '<select id="t-price-decimals" style="padding:6px;font-size:12px;width:100%;background:var(--card-background-color);color:var(--primary-text-color);border:1px solid var(--divider-color);border-radius:4px;">' +
    '<option value="2">2 — e.g. $0.35</option>' +
    '<option value="3">3 — e.g. $0.352</option>' +
    '<option value="4" selected>4 — e.g. $0.3521</option>' +
    '<option value="5">5 — e.g. $0.35210</option>' +
    '</select>' +
    '<div style="font-size:11px;color:var(--secondary-text-color);">Decimal places for Buy/Sell prices throughout the card. Default: 4</div></div>' +
    '</div>' +

    // ── BACKUP TAB ────────────────────────────────────────────────────────────
    '<div class="settings-tab-content" data-content="backup">' +
    '<div style="display:flex;flex-direction:column;gap:16px;padding:8px 0;">' +
    '<div style="padding:12px;background:rgba(0,0,0,0.1);border-radius:6px;">' +
    '<div style="font-size:12px;font-weight:bold;margin-bottom:6px;">📥 Export Settings</div>' +
    '<div style="font-size:11px;margin-bottom:10px;color:var(--secondary-text-color);">Download all card settings to a JSON backup file.</div>' +
    '<button id="export-settings-btn" style="padding:8px 16px;background:var(--primary-color,#2196F3);color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:12px;font-weight:bold;width:100%;">⬇️ Download Backup</button>' +
    '</div>' +
    '<div style="padding:12px;background:rgba(0,0,0,0.1);border-radius:6px;">' +
    '<div style="font-size:12px;font-weight:bold;margin-bottom:6px;">📤 Import Settings</div>' +
    '<div style="font-size:11px;margin-bottom:10px;color:var(--secondary-text-color);">Restore settings from a previously exported JSON file.</div>' +
    '<input type="file" id="import-settings-file" accept=".json" style="display:none;">' +
    '<button id="import-settings-btn" style="padding:8px 16px;background:var(--primary-color,#2196F3);color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:12px;font-weight:bold;width:100%;">⬆️ Select Backup File</button>' +
    '</div>' +
    '</div>' +
    '</div>' +

    '</div>' + // end settings-modal-body
    '<div style="border-top:1px solid var(--divider-color);padding:12px 16px;display:flex;justify-content:space-between;align-items:center;background:var(--card-background-color);border-radius:0 0 8px 8px;">' +
    '<button id="reset-settings-btn" style="padding:8px 14px;background:#555;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:12px;font-weight:bold;">↻ Reset to Defaults</button>' +
    '<button id="apply-settings-btn" style="padding:8px 20px;background:var(--primary-color,#2196F3);color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:12px;font-weight:bold;">✓ Apply &amp; Close</button>' +
    '</div>' +
    '</div></div>';
}

// ── Legend HTML (modal) ───────────────────────────────────────────────────────
function _emhass_buildLegendModal() {
  return '<div id="legend-modal" style="display:none;position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);z-index:9999;align-items:center;justify-content:center;">' +
    '<div style="background:var(--card-background-color);color:var(--primary-text-color);border-radius:8px;padding:20px;max-width:700px;max-height:80vh;overflow-y:auto;box-shadow:0 4px 20px rgba(0,0,0,0.5);">' +
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">' +
    '<h2 style="margin:0;font-size:18px;">Event Legend</h2>' +
    '<span id="legend-close" style="font-size:24px;cursor:pointer;color:var(--secondary-text-color);">✕</span>' +
    '</div>' +
    '<div style="margin-bottom:16px;">' +
    '<div style="font-weight:bold;margin-bottom:8px;">Filter by:</div>' +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:12px;background:rgba(33,150,243,0.1);border:1px solid rgba(33,150,243,0.3);border-radius:6px;margin-bottom:12px;">' +
    '<div>' +
    '<div style="font-size:11px;font-weight:bold;color:var(--secondary-text-color);margin-bottom:6px;">Power Source</div>' +
    '<div style="display:flex;flex-direction:column;gap:6px;">' +
    '<label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:12px;"><input type="checkbox" class="leg-filter" data-type="solar" checked> 🌞 Solar</label>' +
    '<label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:12px;"><input type="checkbox" class="leg-filter" data-type="battery" checked> 🔋 Battery</label>' +
    '<label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:12px;"><input type="checkbox" class="leg-filter" data-type="grid" checked> ⚡ Grid</label>' +
    '</div></div>' +
    '<div>' +
    '<div style="font-size:11px;font-weight:bold;color:var(--secondary-text-color);margin-bottom:6px;">Category</div>' +
    '<div style="display:flex;flex-direction:column;gap:6px;">' +
    '<label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:12px;"><input type="checkbox" class="leg-filter" data-cat="selfconsume" checked> ✅ Self Consumption</label>' +
    '<label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:12px;"><input type="checkbox" class="leg-filter" data-cat="profit" checked> 💰 Profit</label>' +
    '<label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:12px;"><input type="checkbox" class="leg-filter" data-cat="cost" checked> 💸 Cost</label>' +
    '</div></div>' +
    '</div>' +
    '</div>' +
    '<div id="legend-items" style="font-size:12px;max-height:60vh;overflow-y:auto;"></div>' +
    '</div></div>';
}

// ── Column definitions — built dynamically based on configured sensors ───────
// showEv / showDefer are booleans — columns hidden when sensors not configured
function _emhass_buildColgroup(showEv, showDefer) {
  let c = '<colgroup>' +
    '<col style="width:52px;">' +                  // Time
    '<col style="width:250px;">' +                 // Event
    '<col style="width:200px;">' +                 // Mode
    '<col style="width:68px;">' +                  // Buy $
    '<col style="width:68px;">' +                  // Sell $
    '<col style="width:44px;">' +                  // Load kW
    '<col style="width:46px;">' +                  // Load kWh
    '<col style="width:44px;">' +                  // PV kW
    '<col style="width:46px;">' +                  // PV kWh
    '<col style="width:44px;">' +                  // Grid kW
    '<col style="width:46px;">' +                  // Grid kWh
    '<col style="width:44px;">' +                  // Batt kW
    '<col style="width:46px;">' +                  // Batt kWh
    '<col style="width:46px;">';                   // Batt SoC
  if (showEv) c +=
    '<col style="width:44px;">' +                  // EV kW
    '<col style="width:46px;">' +                  // EV kWh
    '<col style="width:46px;">';                   // EV SoC
  if (showDefer) c +=
    '<col style="width:44px;">' +                  // Defer kW
    '<col style="width:46px;">' +                  // Defer kWh
    '<col style="width:46px;">';                   // Defer SoC
  c += '<col style="width:72px;"></colgroup>';     // Cost/Profit
  return c;
}

function _emhass_buildThead(showEv, showDefer, pastMode) {
  // pastMode: 'bess' = BESS Data headers, 'emhass' or undefined = EMHASS headers
  const isBess = pastMode === 'bess';
  const C = 'text-align:center;';
  const B = 'box-shadow:inset 2px 0 0 #666;';
  const BB = B + 'border-bottom:1px solid #666;';
  let top = '<thead><tr>' +
    '<th rowspan="2" style="' + C + 'vertical-align:bottom;">🕐 Time</th>' +
    '<th rowspan="2" style="' + C + 'vertical-align:bottom;">' + (isBess ? '🕐 BESS Data' : '📅 EMHASS Plan') + '</th>' +
    '<th rowspan="2" style="' + C + 'vertical-align:bottom;' + B + '">' + (isBess ? '📊 Mode' : '📊 EMHASS Mode') + '</th>' +
    '<th rowspan="2" style="' + C + 'vertical-align:bottom;' + B + '">Buy<br>💲/kWh</th>' +
    '<th rowspan="2" style="' + C + 'vertical-align:bottom;box-shadow:inset 1px 0 0 #555;">Sell<br>💲/kWh</th>' +
    '<th colspan="2" style="' + C + BB + '">🏠 Load</th>' +
    '<th colspan="2" style="' + C + BB + '">🌞 PV</th>' +
    '<th colspan="2" style="' + C + BB + '">⚡ Grid</th>' +
    '<th colspan="3" style="' + C + BB + '">🔋 Battery</th>';
  if (showEv)    top += '<th colspan="3" style="' + C + BB + '">🚗 EV</th>';
  if (showDefer) top += '<th colspan="3" style="' + C + BB + '">⏰ Defer.</th>';
  top += '<th rowspan="2" style="' + C + 'vertical-align:bottom;' + B + '">💰<br>Cost/<br>Profit</th></tr><tr>';
  top +=
    '<th style="' + C + B + '">kW</th><th class="bgi" style="' + C + '">kWh</th>' +
    '<th style="' + C + B + '">kW</th><th class="bgi" style="' + C + '">kWh</th>' +
    '<th style="' + C + B + '">kW</th><th class="bgi" style="' + C + '">kWh</th>' +
    '<th style="' + C + B + '">kW</th><th style="' + C + '">kWh</th><th class="bgi" style="' + C + '">SoC%</th>';
  if (showEv)
    top += '<th style="' + C + B + '">kW</th><th style="' + C + '">kWh</th><th class="bgi" style="' + C + '">SoC%</th>';
  if (showDefer)
    top += '<th style="' + C + B + '">kW</th><th style="' + C + '">kWh</th><th class="bgi" style="' + C + '">SoC%</th>';
  top += '</tr></thead>';
  return top;
}

// ── CSS ───────────────────────────────────────────────────────────────────────
const _EMHASS_STYLE = [
  ':host { display: block; width: 100%; }',
  'ha-card { width: 100%; box-sizing: border-box; }',
  '.card { padding: 8px 12px; font-family: var(--primary-font-family, sans-serif); font-size: 12px; width: 100%; box-sizing: border-box; }',
  '.tabs { display: flex; gap: 0; border-bottom: 2px solid var(--divider-color,#444); margin-bottom: 10px; align-items: stretch; }',
  '.tab { padding: 6px 18px; font-size: 13px; font-weight: 500; cursor: pointer; color: var(--secondary-text-color); border-bottom: 3px solid transparent; margin-bottom: -2px; }',
  '.tab.active { color: #2196F3; border-bottom-color: #2196F3; background: rgba(33,150,243,0.07); }',
  '.sbar { display: flex; gap: 8px; align-items: center; padding: 3px 0 6px 0; font-size: 12px; flex-wrap: nowrap; width: 100%; border-bottom: 2px solid #888; margin-bottom: 0; background: var(--card-background-color); }',
  '.alert-bar   { display: flex; gap: 8px; align-items: center; padding: 3px 0; min-height: 26px; flex-wrap: wrap; border-bottom: 1px solid var(--divider-color,#444); }',
  '.status-bar  { display: flex; gap: 14px; align-items: center; padding: 3px 0; min-height: 26px; flex-wrap: wrap; border-bottom: 1px solid var(--divider-color,#444); }',
  '.finance-bar { display: flex; gap: 14px; align-items: center; padding: 3px 0; min-height: 26px; flex-wrap: wrap; border-bottom: 2px solid #888; margin-bottom: 0; background: var(--card-background-color); position: relative; }',
  '.alert-bar:empty, .status-bar:empty, .finance-bar:empty { display: none; }',
  '.bar-label { font-weight: bold; margin-right: 4px; font-size: 11px; white-space: nowrap; }',
  '.alert-bar:empty { display: none; }',
  '.emhass-tooltip { position: fixed; background: var(--card-background-color,#1e1e1e); color: var(--primary-text-color); border: 1px solid var(--divider-color,#555); padding: 8px 12px; border-radius: 6px; font-size: 12px; max-width: 360px; white-space: normal; z-index: 9999; box-shadow: 0 4px 12px rgba(0,0,0,0.4); line-height: 1.5; pointer-events: none; }',
  '.alert-bar:empty { display: none; }',
  '.upd-badge { font-size: 11px; color: var(--primary-text-color); margin-right: 4px; white-space: nowrap; display: flex; align-items: center; gap: 4px; }',
  '.pill { padding: 2px 8px; border-radius: 10px; font-weight: bold; font-size: 11px; color: #fff; }',
  '.stxt { color: var(--secondary-text-color); font-size: 11px; }',
  '.wrap { overflow-y: auto; width: 100%; }',
  '.pane { display: none; }',
  '.pane.active { display: block; }',
  '.dt { border-collapse: collapse; width: 100%; table-layout: fixed; }',
  '.dt.dt-head { position: relative; z-index: 2; }',
  '.dt thead, .dt tbody { width: 100%; }',
  '.dt th, .dt td { padding: 4px 6px; border-bottom: 1px solid var(--divider-color,#444); font-size: 12px; line-height: 1.3; white-space: nowrap; text-align: right; overflow: hidden; }',
  '.dt th:nth-child(1) { text-align: left; box-shadow: inset -1px 0 0 #555; }',
  '.dt td:nth-child(1) { text-align: left !important; box-shadow: inset -1px 0 0 #555; }',
  '.dt td:nth-child(2) { text-align: left; white-space: normal; box-shadow: inset -1px 0 0 #555; }',
  '.dt th:nth-child(2) { white-space: normal; box-shadow: inset -1px 0 0 #555; }',
  '.dt td:nth-child(3) { text-align: left; white-space: normal; box-shadow: inset -1px 0 0 #555; font-size:11px; color: var(--secondary-text-color); }',
  '.dt th:nth-child(3) { text-align: left; white-space: normal; box-shadow: inset -1px 0 0 #555; }',
  '.dt thead { background-color: var(--card-background-color,#1c1c1c); }',
  '.dt thead th { background-color: var(--card-background-color,#1c1c1c); font-weight: bold; color: var(--primary-text-color); border-bottom: 1px solid #666; }',
  '.dt thead tr:last-child th { border-bottom: 2px solid #888; }',
  '.bgl { box-shadow: inset 2px 0 0 #666; }',
  '.bgi { box-shadow: inset 1px 0 0 #555; }',
  '.dr td { background: var(--secondary-background-color); font-weight: bold; border-top: 2px solid var(--divider-color); text-align: left !important; padding: 5px 6px; }',
  '.dr td.bgi, .dr td.bgl { text-align: right !important; }',
  '.msg { padding: 20px; text-align: center; color: var(--secondary-text-color); }',
  '.err { padding: 10px; color: #f44336; }',
  '.bess-toggle-wrap { display:flex; align-items:center; gap:6px; font-size:11px; color:var(--primary-text-color); }',
  '.bess-toggle-wrap .tl { font-size:11px; white-space:nowrap; }',
  '.bess-toggle-wrap .tl.inactive { color:var(--secondary-text-color); }',
  '.toggle-sw { position:relative; display:inline-block; width:36px; height:20px; flex-shrink:0; }',
  '.toggle-sw input { opacity:0; width:0; height:0; }',
  '.toggle-slider { position:absolute; cursor:pointer; top:0; left:0; right:0; bottom:0; background:#4caf50; border-radius:20px; transition:.3s; }',
  '.toggle-slider.disabled { background:#555; cursor:default; }',
  '.toggle-slider:before { position:absolute; content:""; height:14px; width:14px; left:3px; bottom:3px; background:white; border-radius:50%; transition:.3s; }',
  'input:checked + .toggle-slider { background:#2196F3; }',
  'input:checked + .toggle-slider:before { transform:translateX(16px); }',
  '.settings-modal { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 9998; }',
  '.settings-modal-content { background: var(--card-background-color); color: var(--primary-text-color); border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.5); max-height: calc(100vh - 80px); display: flex; flex-direction: column; }',
  '.settings-tab { transition: all 0.2s; border-bottom: 3px solid transparent !important; }',
  '.settings-tab.active { color: #2196F3 !important; border-bottom-color: #2196F3 !important; }',
  '.settings-tab-content { display: none !important; }',
  '.settings-tab-content.active { display: block !important; }',
  '.settings-modal-header { display: flex; justify-content: space-between; align-items: center; padding: 14px 16px; border-bottom: 1px solid var(--divider-color); }',
  '.settings-modal-close { background: none; border: none; font-size: 20px; cursor: pointer; color: var(--primary-text-color); }',
  '.settings-modal-body { padding: 16px; overflow-y: auto; flex: 1; }',
].join('\n');

function _emhass_buildHTML() {
  return '<style>' + _EMHASS_STYLE + '</style>' +
    _emhass_buildSettingsModal() +
    _emhass_buildLegendModal() +
    '<ha-card><div class="card">' +
    '<div class="tabs">' +
    '<div class="tab active" id="tab-future">📅 Future Decisions</div>' +
    '<div class="tab" id="tab-past">📋 Past Events</div>' +
    '<span class="upd-badge" id="upd-badge" style="display:none;margin-left:auto;"></span>' +
    '<span id="range-past-wrap" style="display:none;align-self:center;padding-right:4px;gap:8px;align-items:center;">' +
    '<select id="range-past" style="font-size:11px;background:var(--card-background-color);color:var(--primary-text-color);border:1px solid var(--divider-color);border-radius:4px;padding:2px 6px;cursor:pointer;">' +
    '<option value="today">Today</option><option value="yesterday">Yesterday</option>' +
    '<option value="24">Last 24h</option><option value="48">Last 48h</option>' +
    '<option value="72">Last 72h</option><option value="96">Last 96h</option>' +
    '<option value="168">Last 7 days</option>' +
    '</select></span>' +
    '</div>' +
    '<div id="pane-future" class="pane active">' +
    '<div id="alert-bar"   class="alert-bar">⏳ Loading...</div>' +
    '<div id="status-bar"  class="status-bar"></div>' +
    '<div id="finance-bar" class="finance-bar"></div>' +
    '<table class="dt dt-head" id="thead-future" style="margin-bottom:0;"></table>' +
    '<div class="wrap"><table class="dt" id="tbl-future">' +
    '<tbody id="tb-future"><tr><td colspan="21" class="msg">⏳ Loading...</td></tr></tbody>' +
    '</table></div></div>' +
    '<div class="pane" id="pane-past">' +
    '<div class="sbar">' +
    '<strong style="color:var(--primary-text-color);white-space:nowrap;">Past Events</strong>' +
    ' <span class="stxt" id="st-past" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0;">Select a range to load</span>' +
    '<span class="bess-toggle-wrap" id="bess-toggle-wrap" style="margin-left:auto;flex-shrink:0;">' +
    '<span class="tl" id="bess-lbl-bess">🕐 BESS Data</span>' +
    '<label class="toggle-sw"><input type="checkbox" id="bess-toggle"><span class="toggle-slider" id="bess-slider"></span></label>' +
    '<span class="tl inactive" id="bess-lbl-emhass">📊 EMHASS Data</span>' +
    '</span>' +
    '</div>' +
    '<table class="dt dt-head" id="thead-past" style="margin-bottom:0;"></table>' +
    '<div class="wrap"><table class="dt" id="tbl-past">' +
    '<tbody id="tb-past"><tr><td colspan="21" class="msg">⏳ Select range to load...</td></tr></tbody>' +
    '</table></div></div>' +
    '<div style="display:flex;justify-content:space-between;align-items:center;padding-top:12px;margin-top:12px;border-top:1px solid var(--divider-color);font-size:11px;">' +
    '<span id="view-legend-btn" class="pill" style="background:#2196F3;cursor:pointer;">📘 View Legend</span>' +
    '<span style="flex:1;"></span>' +
    '<span id="settings-btn" style="cursor:pointer;color:var(--secondary-text-color);font-size:12px;padding:2px 6px;border-radius:4px;" onmouseover="this.style.color=\'var(--primary-text-color)\'" onmouseout="this.style.color=\'var(--secondary-text-color)\'">⚙️ Settings</span>' +
    '<span style="color:var(--secondary-text-color);margin-left:10px;">EMHASS Events Card ' + _EMHASS_VERSION + '</span>' +
    '</div>' +
    '</div></ha-card>';
}

// ── Custom Element ────────────────────────────────────────────────────────────
class EmhassEventsCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._hass         = null;
    this._config       = {};
    this._activeTab    = 'future';
    this._lastFcTs     = null;
    this._lastRenderTs = 0;
    this._pastState    = 'idle';
    this._pastLoadTs   = 0;       // When _pastState entered 'loading' — for timeout guard
    // Configurable thresholds — set via settings modal (future Stage 4)
    this._noiseFloor          = _EMHASS_NOISE_W;       // MPC sensor noise floor (W)
    this._noiseFloorBess      = _EMHASS_NOISE_BESS_PG; // BESS PV/Grid noise floor (W)
    this._alertHighBuyPrice   = 0.50;  // $/kWh — trigger high buy price alert
    this._alertHighSellPrice  = 0.15;  // $/kWh — trigger high sell price alert
    this._batteryMinPercent   = 15;    // % — battery minimum SoC for low alert
  }

  _eid(key) {
    return this._config[key] || _EMHASS_MPC[key] || _EMHASS_STD[key] || null;
  }

  _buildFcMap(entityId, candidates, mult) {
    if (!entityId || !this._hass) return new Map();
    const state = this._hass.states[entityId];
    if (!state) return new Map();

    for (const { attr, key } of (candidates || [])) {
      const fc = state.attributes?.[attr];
      if (!Array.isArray(fc) || !fc.length) continue;

      const m = new Map();
      for (const row of fc) {
        if (!row || row.date == null) continue;
        const rawVal = row[key];
        if (rawVal === undefined) continue;
        const ts = new Date(row.date).getTime();
        if (!isNaN(ts)) {
          const val = parseFloat(rawVal);
          m.set(ts, (isNaN(val) ? 0 : val) * (mult || 1));
        }
      }
      if (m.size > 0) return m;

      if (fc.length > 0) {
        const firstRow = fc[0];
        const autoKey = Object.keys(firstRow).find(k => k !== 'date' && k !== 'datetime');
        if (autoKey) {
          const m2 = new Map();
          for (const row of fc) {
            if (!row || row.date == null) continue;
            const ts = new Date(row.date).getTime();
            if (!isNaN(ts)) {
              const val = parseFloat(row[autoKey]);
              m2.set(ts, (isNaN(val) ? 0 : val) * (mult || 1));
            }
          }
          if (m2.size > 0) return m2;
        }
      }
    }
    return new Map();
  }

  _getPrimaryFc() {
    const eid = this._eid('p_batt_forecast');
    if (!eid) return null;
    const state = this._hass?.states[eid];
    if (!state) return null;
    for (const { attr } of _EMHASS_FC_KEYS.p_batt_forecast) {
      const fc = state.attributes?.[attr];
      if (Array.isArray(fc) && fc.length && fc[0].date) return fc;
    }
    for (const [, val] of Object.entries(state.attributes || {})) {
      if (Array.isArray(val) && val.length > 0 && val[0] && val[0].date) return val;
    }
    return null;
  }

  _attachTooltip(cell, text) {
    if (!text) return;
    cell.style.cursor = 'help';
    cell.addEventListener('mouseenter', (e) => {
      const existing = this.shadowRoot.querySelector('.emhass-tooltip');
      if (existing) existing.remove();
      const tip = document.createElement('div');
      tip.className = 'emhass-tooltip';
      tip.textContent = text;
      // Position below cell, left-aligned
      const rect = cell.getBoundingClientRect();
      tip.style.left = rect.left + 'px';
      tip.style.top  = (rect.bottom + 6) + 'px';
      this.shadowRoot.appendChild(tip);
      // Prevent going off right edge
      requestAnimationFrame(() => {
        const tw = tip.offsetWidth;
        const vw = window.innerWidth;
        if (rect.left + tw > vw - 8) {
          tip.style.left = Math.max(8, vw - tw - 8) + 'px';
        }
      });
      // Auto-remove after 5s
      setTimeout(() => { if (this.shadowRoot.contains(tip)) tip.remove(); }, 5000);
    });
    cell.addEventListener('mouseleave', () => {
      const tip = this.shadowRoot.querySelector('.emhass-tooltip');
      if (tip) tip.remove();
    });
  }

  _rebuildTables() {
    // Determine which optional columns to show.
    // Check hass.states to confirm the sensor actually exists in HA —
    // entity ID may resolve via Tier 2 defaults even if sensor isn't present.
    const _exists = (key) => {
      const eid = this._eid(key);
      if (!eid) return false;
      // If explicitly set in card YAML config, trust it
      if (this._config[key]) return true;
      // Otherwise confirm it exists in hass states
      return !!(this._hass?.states[eid]);
    };
    const showEv    = _exists('p_ev_forecast');
    const showDefer = _exists('p_defer_forecast');
    const colgroup     = _emhass_buildColgroup(showEv, showDefer);
    const theadFuture  = _emhass_buildThead(showEv, showDefer);
    const colCount     = 14 + (showEv ? 3 : 0) + (showDefer ? 3 : 0) + 1;

    // Determine past thead mode from toggle state
    const togEl  = this.shadowRoot.getElementById('bess-toggle');
    const isBess = togEl ? !togEl.checked : false;
    const hasBess = !!(this._eid('bess_batt_power'));
    const pastMode = (isBess && hasBess) ? 'bess' : 'emhass';
    const theadPast = _emhass_buildThead(showEv, showDefer, pastMode);

    // Inject colgroup + thead into header tables and colgroup into body tables
    ['future','past'].forEach(tab => {
      const th = this.shadowRoot.getElementById('thead-' + tab);
      const tb = this.shadowRoot.getElementById('tbl-'   + tab);
      if (th) th.innerHTML = colgroup + (tab === 'past' ? theadPast : theadFuture);
      if (tb) {
        const existing = tb.querySelector('colgroup');
        if (existing) existing.outerHTML = colgroup;
        else tb.insertAdjacentHTML('afterbegin', colgroup);
      }
    });

    this._showEv    = showEv;
    this._showDefer = showDefer;
    this._colCount  = colCount;
  }

  setConfig(config) {
    this._config = config || {};
    this._baseConfig = { ...(config || {}) };  // config as supplied (before settings overrides)
    // Set currency symbol from card YAML or HA config
    _EMHASS_CUR = config?.currency_symbol
      || _emhass_curSymbol(this._hass?.config?.currency)
      || '$';
    // Load and apply persisted settings from localStorage
    this._applySettingsToCard(this._loadSettings());
    if (!this.shadowRoot.getElementById('tb-future')) {
      this.shadowRoot.innerHTML = _emhass_buildHTML();
      this._wireEvents();
      this._rebuildTables();
      requestAnimationFrame(() => this._setWrapHeight());
      if (!this._ro) {
        this._ro = new ResizeObserver(() => this._setWrapHeight());
        this._ro.observe(document.documentElement);
      }
      this._scheduleRefresh();
      if (!this._visHandler) {
        this._visHandler = () => {
          if (document.visibilityState === 'visible' && this._hass) {
            if ((Date.now() - this._lastRenderTs) / 60000 > 1) this._doRefresh();
          }
        };
        document.addEventListener('visibilitychange', this._visHandler);
      }
    }
  }

  _msUntilNextBoundary() {
    const now     = new Date();
    const secInHr = now.getMinutes() * 60 + now.getSeconds();
    const targets = [1,6,11,16,21,26,31,36,41,46,51,56];
    const minNow  = now.getMinutes() + now.getSeconds() / 60;
    let nextMin   = targets.find(t => t > minNow);
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
    this._lastFcTs = null;
    this._renderFuture();
    if (this._activeTab === 'past' && this._pastState === 'ready') {
      this._pastState = 'idle';
      this._loadPast();
    }
    this._lastRenderTs = Date.now();
  }

  _setWrapHeight() {
    const wraps = this.shadowRoot.querySelectorAll('.wrap');
    wraps.forEach(w => {
      const top = w.getBoundingClientRect().top;
      if (top < 10) return;
      // Legend is now modal, no height to subtract
      w.style.height = Math.max(120, window.innerHeight - top - 12) + 'px';
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
    // Update currency if HA config available and no override in card YAML
    if (!this._config?.currency_symbol) {
      _EMHASS_CUR = _emhass_curSymbol(hass?.config?.currency) || _EMHASS_CUR;
    }
    if (!this.shadowRoot.getElementById('tb-future')) {
      this.shadowRoot.innerHTML = _emhass_buildHTML();
      this._wireEvents();
      this._rebuildTables();
    } else if (this._showEv === undefined) {
      this._rebuildTables();
    }
    const battState = hass.states[this._eid('p_batt_forecast')];
    const fcTs = battState?.last_changed;
    if (fcTs !== this._lastFcTs) {
      this._lastFcTs = fcTs;
      this._renderFuture();
    }
    if (this._pastState === 'idle') {
      this._loadPast();
    }
  }

  _switchTab(tab) {
    this._activeTab = tab;
    const sr = this.shadowRoot;
    ['future','past'].forEach(t => {
      sr.getElementById('tab-'  + t).classList.toggle('active', t === tab);
      sr.getElementById('pane-' + t).classList.toggle('active', t === tab);
    });
    const wrap = sr.getElementById('range-past-wrap');
    if (wrap) wrap.style.display = tab === 'past' ? 'flex' : 'none';
    // Always reload when switching to Past tab — reset to idle first
    if (tab === 'past') {
      this._pastState = 'idle';
      this._loadPast();
    }
    requestAnimationFrame(() => this._setWrapHeight());
  }

  _wireEvents() {
    const tf = this.shadowRoot.getElementById('tab-future');
    const tp = this.shadowRoot.getElementById('tab-past');
    if (tf && !tf._wired) { tf._wired = true; tf.addEventListener('click', () => this._switchTab('future')); }
    if (tp && !tp._wired) { tp._wired = true; tp.addEventListener('click', () => this._switchTab('past')); }
    const sel = this.shadowRoot.getElementById('range-past');
    if (sel && !sel._wired) {
      sel._wired = true;
      sel.addEventListener('change', () => {
        this._pastState = 'idle';  // Must be idle so guard allows new load
        const tb = this.shadowRoot.getElementById('tb-past');
        if (tb) tb.innerHTML = '<tr><td colspan="21" class="msg">⏳ Fetching history...</td></tr>';
        this._loadPast();
      });
    }
    const tog = this.shadowRoot.getElementById('bess-toggle');
    if (tog && !tog._wired) {
      tog._wired = true;
      const hasBess = !!(this._eid('bess_batt_power'));
      const slider  = this.shadowRoot.getElementById('bess-slider');
      const lblBess = this.shadowRoot.getElementById('bess-lbl-bess');
      const lblEmhass = this.shadowRoot.getElementById('bess-lbl-emhass');
      if (!hasBess) {
        tog.checked = true;
        tog.disabled = true;
        if (slider) slider.classList.add('disabled');
        if (lblBess) lblBess.classList.add('inactive');
        if (lblEmhass) lblEmhass.classList.remove('inactive');
      }
      tog.addEventListener('change', () => {
        const isEmhass = tog.checked;
        if (lblBess)   lblBess.classList.toggle('inactive', isEmhass);
        if (lblEmhass) lblEmhass.classList.toggle('inactive', !isEmhass);
        // Rebuild thead to update BESS/EMHASS column headers
        this._rebuildTables();
        // Reset to idle so _loadPast timeout guard allows the new load
        this._pastState = 'idle';
        const tb = this.shadowRoot.getElementById('tb-past');
        if (tb) tb.innerHTML = '<tr><td colspan="21" class="msg">⏳ Loading...</td></tr>';
        this._loadPast();
      });
    }
    // Legend modal
    const legBtn = this.shadowRoot.getElementById('view-legend-btn');
    const legModal = this.shadowRoot.getElementById('legend-modal');
    const legClose = this.shadowRoot.getElementById('legend-close');
    if (legBtn && !legBtn._wired) {
      legBtn._wired = true;
      legBtn.addEventListener('click', () => {
        if (legModal) legModal.style.display = 'flex';
        this._renderLegend();
      });
    }
    if (legClose && !legClose._wired) {
      legClose._wired = true;
      legClose.addEventListener('click', () => {
        if (legModal) legModal.style.display = 'none';
      });
    }
    if (legModal && !legModal._wired) {
      legModal._wired = true;
      legModal.addEventListener('click', (e) => {
        if (e.target === legModal) legModal.style.display = 'none';
      });
    }
    const filterCheckboxes = this.shadowRoot.querySelectorAll('.leg-filter');
    filterCheckboxes.forEach(cb => {
      if (!cb._wired) {
        cb._wired = true;
        cb.addEventListener('change', () => this._renderLegend());
      }
    });
    // Settings modal
    const settingsBtn   = this.shadowRoot.getElementById('settings-btn');
    const settingsModal = this.shadowRoot.getElementById('settings-modal');
    const settingsClose = this.shadowRoot.getElementById('settings-modal-close');
    if (settingsBtn && !settingsBtn._wired) {
      settingsBtn._wired = true;
      settingsBtn.addEventListener('click', () => this._openSettingsModal());
    }
    if (settingsClose && !settingsClose._wired) {
      settingsClose._wired = true;
      settingsClose.addEventListener('click', () => this._closeSettingsModal(false));
    }
    if (settingsModal && !settingsModal._wired) {
      settingsModal._wired = true;
      settingsModal.addEventListener('click', (e) => { if (e.target === settingsModal) this._closeSettingsModal(false); });
    }
    // Settings tab switching
    const settingsTabs = this.shadowRoot.querySelectorAll('.settings-tab');
    settingsTabs.forEach(tab => {
      if (!tab._wired) {
        tab._wired = true;
        tab.addEventListener('click', () => {
          settingsTabs.forEach(t => t.classList.remove('active'));
          tab.classList.add('active');
          this.shadowRoot.querySelectorAll('.settings-tab-content').forEach(c => c.classList.remove('active'));
          const content = this.shadowRoot.querySelector('.settings-tab-content[data-content="' + tab.dataset.tab + '"]');
          if (content) content.classList.add('active');
        });
      }
    });
    // Apply and Reset buttons
    const applyBtn = this.shadowRoot.getElementById('apply-settings-btn');
    if (applyBtn && !applyBtn._wired) {
      applyBtn._wired = true;
      applyBtn.addEventListener('click', () => this._closeSettingsModal(true));
    }
    const resetBtn = this.shadowRoot.getElementById('reset-settings-btn');
    if (resetBtn && !resetBtn._wired) {
      resetBtn._wired = true;
      resetBtn.addEventListener('click', () => this._resetSettings());
    }
    // Export/Import backup
    const exportBtn = this.shadowRoot.getElementById('export-settings-btn');
    if (exportBtn && !exportBtn._wired) {
      exportBtn._wired = true;
      exportBtn.addEventListener('click', () => this._exportSettings());
    }
    const importBtn  = this.shadowRoot.getElementById('import-settings-btn');
    const importFile = this.shadowRoot.getElementById('import-settings-file');
    if (importBtn && !importBtn._wired) {
      importBtn._wired = true;
      importBtn.addEventListener('click', () => importFile?.click());
    }
    if (importFile && !importFile._wired) {
      importFile._wired = true;
      importFile.addEventListener('change', (e) => this._importSettings(e));
    }
    // Inverter brand preset
    const brandSel = this.shadowRoot.getElementById('inverter-brand');
    if (brandSel && !brandSel._wired) {
      brandSel._wired = true;
      brandSel.addEventListener('change', () => this._applyInverterPreset(brandSel.value));
    }
  }

  // ── Settings modal methods ─────────────────────────────────────────────────
  _SETTINGS_KEY = 'emhass-events-card-settings';
  _SETTINGS_DEFAULTS = {
    // Sensors
    s_p_load: '', s_p_pv: '', s_p_grid: '', s_p_batt: '', s_p_soc: '',
    s_b_load: '', s_b_pv: '',  s_b_grid: '', s_b_batt: '', s_b_soc: '',
    s_buy: '', s_sell: '', s_net_cost: '', s_past_buy: '', s_past_sell: '',
    s_e_load: '', s_e_solar: '', s_e_gimp: '', s_e_gexp: '', s_e_bc: '', s_e_bd: '', s_e_cap: '',
    // Thresholds
    t_noise_pv_mpc: 10, t_noise_grid_mpc: 10, t_noise_batt_mpc: 10,
    t_noise_pv_bess: 50, t_noise_grid_bess: 50, t_noise_batt_bess: 50,
    t_batt_min: 15, t_alert_buy: 0.50, t_alert_sell: 0.15, t_price_decimals: 4,
  };

  _loadSettings() {
    try {
      const saved = localStorage.getItem(this._SETTINGS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...this._SETTINGS_DEFAULTS, ...parsed };
      }
    } catch(e) {}
    return { ...this._SETTINGS_DEFAULTS };
  }

  _saveSettings(s) {
    try { localStorage.setItem(this._SETTINGS_KEY, JSON.stringify(s)); } catch(e) {}
  }

  _applySettingsToCard(s) {
    // Apply thresholds to instance vars
    this._noiseFloor         = parseFloat(s.t_noise_pv_mpc)   || parseFloat(s.t_noise_mpc) || 10;
    this._noiseFloorBess     = parseFloat(s.t_noise_pv_bess)  || parseFloat(s.t_noise_bess) || 50;
    this._noisePvMpc         = parseFloat(s.t_noise_pv_mpc)   || 10;
    this._noiseGridMpc       = parseFloat(s.t_noise_grid_mpc)  || 10;
    this._noiseBattMpc       = parseFloat(s.t_noise_batt_mpc)  || 10;
    this._noisePvBess        = parseFloat(s.t_noise_pv_bess)   || 50;
    this._noiseGridBess      = parseFloat(s.t_noise_grid_bess) || 50;
    this._noiseBattBess      = parseFloat(s.t_noise_batt_bess) || 50;
    this._batteryMinPercent  = parseFloat(s.t_batt_min)    || 15;
    this._alertHighBuyPrice  = parseFloat(s.t_alert_buy)   || 0.50;
    this._alertHighSellPrice = parseFloat(s.t_alert_sell)  || 0.15;
    _emhass_priceDecimals    = parseInt(s.t_price_decimals) || 4;
    // Apply sensor overrides to config
    const sensorMap = {
      p_load_forecast: s.s_p_load, p_pv_forecast: s.s_p_pv,
      p_grid_forecast: s.s_p_grid, p_batt_forecast: s.s_p_batt,
      soc_forecast: s.s_p_soc,    bess_load_power: s.s_b_load,
      bess_pv_power: s.s_b_pv,    bess_grid_power: s.s_b_grid,
      bess_batt_power: s.s_b_batt, bess_soc: s.s_b_soc,
      buy_price: s.s_buy, sell_price: s.s_sell, net_cost: s.s_net_cost,
      past_buy_price: s.s_past_buy, past_sell_price: s.s_past_sell,
      energy_load: s.s_e_load, energy_solar: s.s_e_solar,
      energy_grid_import: s.s_e_gimp, energy_grid_export: s.s_e_gexp,
      energy_batt_charge: s.s_e_bc, energy_batt_discharge: s.s_e_bd,
      energy_capacity: s.s_e_cap,
    };
    for (const [key, val] of Object.entries(sensorMap)) {
      if (val && val.trim()) this._config[key] = val.trim();
    }
  }

  _openSettingsModal() {
    const s = this._loadSettings();
    const sr = this.shadowRoot;
    // Populate sensor fields
    const fields = {
      's-p-load': s.s_p_load, 's-p-pv': s.s_p_pv, 's-p-grid': s.s_p_grid,
      's-p-batt': s.s_p_batt, 's-p-soc': s.s_p_soc,
      's-b-load': s.s_b_load, 's-b-pv': s.s_b_pv, 's-b-grid': s.s_b_grid,
      's-b-batt': s.s_b_batt, 's-b-soc': s.s_b_soc,
      's-buy': s.s_buy, 's-sell': s.s_sell, 's-net-cost': s.s_net_cost,
      's-past-buy': s.s_past_buy, 's-past-sell': s.s_past_sell,
      's-e-load': s.s_e_load, 's-e-solar': s.s_e_solar,
      's-e-gimp': s.s_e_gimp, 's-e-gexp': s.s_e_gexp,
      's-e-bc': s.s_e_bc, 's-e-bd': s.s_e_bd, 's-e-cap': s.s_e_cap,
      't-noise-pv-mpc': s.t_noise_pv_mpc, 't-noise-grid-mpc': s.t_noise_grid_mpc,
      't-noise-batt-mpc': s.t_noise_batt_mpc, 't-noise-pv-bess': s.t_noise_pv_bess,
      't-noise-grid-bess': s.t_noise_grid_bess, 't-noise-batt-bess': s.t_noise_batt_bess,
      't-batt-min': s.t_batt_min, 't-alert-buy': s.t_alert_buy,
      't-alert-sell': s.t_alert_sell,
    };
    for (const [id, val] of Object.entries(fields)) {
      const el = sr.getElementById(id);
      if (el) el.value = val ?? '';
    }
    this._showResolvedSensors();
    const decimals = sr.getElementById('t-price-decimals');
    if (decimals) decimals.value = s.t_price_decimals || 4;
    const modal = sr.getElementById('settings-modal');
    if (modal) modal.style.display = 'flex';
  }

  _closeSettingsModal(apply) {
    const modal = this.shadowRoot.getElementById('settings-modal');
    if (modal) modal.style.display = 'none';
    if (!apply) return;
    const sr = this.shadowRoot;
    const g = (id) => (sr.getElementById(id)?.value || '').trim();
    const s = {
      s_p_load: g('s-p-load'), s_p_pv: g('s-p-pv'), s_p_grid: g('s-p-grid'),
      s_p_batt: g('s-p-batt'), s_p_soc: g('s-p-soc'),
      s_b_load: g('s-b-load'), s_b_pv: g('s-b-pv'), s_b_grid: g('s-b-grid'),
      s_b_batt: g('s-b-batt'), s_b_soc: g('s-b-soc'),
      s_buy: g('s-buy'), s_sell: g('s-sell'), s_net_cost: g('s-net-cost'),
      s_past_buy: g('s-past-buy'), s_past_sell: g('s-past-sell'),
      s_e_load: g('s-e-load'), s_e_solar: g('s-e-solar'),
      s_e_gimp: g('s-e-gimp'), s_e_gexp: g('s-e-gexp'),
      s_e_bc: g('s-e-bc'), s_e_bd: g('s-e-bd'), s_e_cap: g('s-e-cap'),
      t_noise_pv_mpc:   parseFloat(g('t-noise-pv-mpc'))   || 10,
      t_noise_grid_mpc:  parseFloat(g('t-noise-grid-mpc'))  || 10,
      t_noise_batt_mpc:  parseFloat(g('t-noise-batt-mpc'))  || 10,
      t_noise_pv_bess:   parseFloat(g('t-noise-pv-bess'))   || 99,
      t_noise_grid_bess: parseFloat(g('t-noise-grid-bess')) || 99,
      t_noise_batt_bess: parseFloat(g('t-noise-batt-bess')) || 99,
      t_batt_min:   parseFloat(g('t-batt-min'))    || 15,
      t_alert_buy:  parseFloat(g('t-alert-buy'))   || 0.50,
      t_alert_sell: parseFloat(g('t-alert-sell'))  || 0.15,
      t_price_decimals: parseInt(sr.getElementById('t-price-decimals')?.value) || 4,
    };
    this._saveSettings(s);
    this._applySettingsToCard(s);
    this._rebuildTables();
    this._doRefresh();
  }

  _resetSettings() {
    if (!confirm('Reset all settings to defaults?')) return;
    this._saveSettings({ ...this._SETTINGS_DEFAULTS });
    this._applySettingsToCard({ ...this._SETTINGS_DEFAULTS });
    this._openSettingsModal(); // Repopulate form with defaults
  }

  _exportSettings() {
    const s = this._loadSettings();
    const blob = new Blob([JSON.stringify(s, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'emhass-events-card-settings-' + new Date().toISOString().slice(0,10) + '.json';
    a.click();
  }

  _importSettings(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result);
        this._saveSettings({ ...this._SETTINGS_DEFAULTS, ...parsed });
        alert('Settings imported successfully!');
        this._openSettingsModal();
      } catch(err) { alert('Error reading file: ' + err.message); }
    };
    reader.readAsText(file);
  }

  // Settings field id → config key (sensor overrides)
  static get _SENSOR_FIELDS() {
    return {
      's-p-load': 'p_load_forecast', 's-p-pv': 'p_pv_forecast', 's-p-grid': 'p_grid_forecast',
      's-p-batt': 'p_batt_forecast', 's-p-soc': 'soc_forecast',
      's-b-load': 'bess_load_power', 's-b-pv': 'bess_pv_power', 's-b-grid': 'bess_grid_power',
      's-b-batt': 'bess_batt_power', 's-b-soc': 'bess_soc',
      's-buy': 'buy_price', 's-sell': 'sell_price', 's-net-cost': 'net_cost',
      's-past-buy': 'past_buy_price', 's-past-sell': 'past_sell_price',
      's-e-load': 'energy_load', 's-e-solar': 'energy_solar',
      's-e-gimp': 'energy_grid_import', 's-e-gexp': 'energy_grid_export',
      's-e-bc': 'energy_batt_charge', 's-e-bd': 'energy_batt_discharge', 's-e-cap': 'energy_capacity',
    };
  }

  // Where a sensor key resolves from when no override is saved: card config or built-in default
  _sensorSource(key) {
    const fromConfig = this._baseConfig?.[key];
    if (fromConfig) return { eid: fromConfig, src: 'card config' };
    const def = _EMHASS_MPC[key] || _EMHASS_STD[key] || null;
    return { eid: def, src: 'default' };
  }

  // Show the entity actually in use for every empty override field (placeholder + tooltip),
  // flagging ones that don't exist in HA, so users can verify what the card reads.
  _showResolvedSensors() {
    const sr = this.shadowRoot;
    for (const [id, key] of Object.entries(this.constructor._SENSOR_FIELDS)) {
      const el = sr.getElementById(id);
      if (!el) continue;
      if (el.dataset.origPh === undefined) el.dataset.origPh = el.placeholder || '';
      const { eid, src } = this._sensorSource(key);
      if (!eid) { el.placeholder = el.dataset.origPh; el.title = ''; continue; }
      const missing = this._hass && !this._hass.states[eid];
      el.placeholder = 'Using ' + eid + ' (' + src + (missing ? ', not found' : '') + ')';
      el.title = el.value ? 'Override: ' + el.value + ' (blank = ' + eid + ' from ' + src + ')'
                          : 'Using ' + eid + ' from ' + src + (missing ? ' (entity not found in HA)' : '');
    }
  }

  _applyInverterPreset(brand) {
    const presets = {
      sigenergy: { load: 'sensor.sigen_plant_consumed_power', pv: 'sensor.sigen_plant_pv_power', grid: 'sensor.sigen_plant_grid_active_power', batt: 'sensor.sigen_plant_battery_power', soc: 'sensor.sigen_plant_battery_state_of_charge' },
      sigenergy_mqtt: { load: 'sensor.sigenergy_load_power', pv: 'sensor.sigenergy_pv_power', grid: 'sensor.sigenergy_grid_power', batt: 'sensor.sigenergy_battery_power', soc: 'sensor.sigenergy_battery_soc' },
      deye: { load: 'sensor.deye_load_power', pv: 'sensor.deye_pv_power', grid: 'sensor.deye_grid_power', batt: 'sensor.deye_battery_power', soc: 'sensor.deye_battery_soc' },
      fronius: { load: 'sensor.fronius_load_power', pv: 'sensor.fronius_pv_power', grid: 'sensor.fronius_grid_power', batt: 'sensor.fronius_battery_power', soc: 'sensor.fronius_battery_soc' },
      goodwe: { load: 'sensor.goodwe_load_power', pv: 'sensor.goodwe_pv_power', grid: 'sensor.goodwe_grid_power', batt: 'sensor.goodwe_battery_power', soc: 'sensor.goodwe_battery_soc' },
      huawei: { load: 'sensor.huawei_load_power', pv: 'sensor.huawei_pv_power', grid: 'sensor.huawei_grid_power', batt: 'sensor.huawei_battery_power', soc: 'sensor.huawei_battery_soc' },
      sungrow: { load: 'sensor.sungrow_load_power', pv: 'sensor.sungrow_pv_power', grid: 'sensor.sungrow_grid_power', batt: 'sensor.sungrow_battery_power', soc: 'sensor.sungrow_battery_soc' },
    };
    const p = presets[brand];
    if (!p) return;
    const sr = this.shadowRoot;
    // Only fill EMPTY fields, and only with entities that exist — never replace a working
    // config-supplied sensor with a brand guess. Report what changed.
    const filled = [], skipped = [];
    for (const [id, k] of [['s-b-load', 'load'], ['s-b-pv', 'pv'], ['s-b-grid', 'grid'], ['s-b-batt', 'batt'], ['s-b-soc', 'soc']]) {
      const el = sr.getElementById(id);
      if (!el) continue;
      const fieldKey = this.constructor._SENSOR_FIELDS[id];
      const { eid: current } = this._sensorSource(fieldKey);
      if (el.value) { skipped.push(k + ' (override set)'); continue; }
      if (current && this._hass?.states[current]) { skipped.push(k + ' (using ' + current + ')'); continue; }
      if (!this._hass?.states[p[k]]) { skipped.push(k + ' (' + p[k] + ' not found)'); continue; }
      el.value = p[k]; filled.push(p[k]);
    }
    this._showResolvedSensors();
    let note = sr.getElementById('inverter-brand-note');
    const sel = sr.getElementById('inverter-brand');
    if (!note && sel?.parentElement) {
      note = document.createElement('div'); note.id = 'inverter-brand-note';
      note.style.cssText = 'font-size:11px;color:var(--secondary-text-color);margin:-6px 0 10px 0;text-align:right;';
      sel.parentElement.parentElement.insertAdjacentElement('afterend', note);
    }
    if (note) note.textContent = (filled.length ? 'Filled: ' + filled.join(', ') : 'Nothing filled') +
      (skipped.length ? ' · Kept: ' + skipped.join(', ') : '');
  }

  _renderLegend() {
    const legItems = this.shadowRoot.getElementById('legend-items');
    if (!legItems) return;
    const filterCheckboxes = this.shadowRoot.querySelectorAll('.leg-filter');
    const activePowerSources = Array.from(filterCheckboxes)
      .filter(cb => cb.getAttribute('data-type') && cb.checked)
      .map(cb => cb.getAttribute('data-type'));
    const activeCategories = Array.from(filterCheckboxes)
      .filter(cb => cb.getAttribute('data-cat') && cb.checked)
      .map(cb => cb.getAttribute('data-cat'));

    const allItems = [
      { sources: ['solar'], cat: 'selfconsume', label: '🌞 Solar → 🏠 Home', desc: 'Solar covering home — no battery, no grid' },
      { sources: ['solar'], cat: 'selfconsume', label: '🌞 Solar → 🏠 Home + 🔋 Battery', desc: 'Solar covering home and charging battery — no grid' },
      { sources: ['solar'], cat: 'profit', label: '🌞 Solar → 🏠 Home + ⚡ Grid', desc: 'Solar covering home and exporting surplus' },
      { sources: ['solar'], cat: 'profit', label: '🌞 Solar → 🏠 Home + 🔋 Battery + ⚡ Grid', desc: 'Solar covering home, charging battery and exporting' },
      { sources: ['solar','battery'], cat: 'selfconsume', label: '🌞 Solar + 🔋 Battery → 🏠 Home', desc: 'Solar and battery covering home — no grid' },
      { sources: ['solar','grid'], cat: 'cost', label: '🌞 Solar + ⚡ Grid → 🏠 Home', desc: 'Solar and grid covering home' },
      { sources: ['solar','battery','grid'], cat: 'cost', label: '🌞 Solar + ⚡ Grid → 🏠 Home + 🔋 Battery (Force)', desc: 'Solar + grid import + forced battery charge' },
      { sources: ['solar','battery','grid'], cat: 'profit', label: '🌞 Solar + 🔋 Battery → 🏠 Home + ⚡ Grid (Force)', desc: 'Solar and battery covering home and exporting' },
      { sources: ['battery'], cat: 'selfconsume', label: '🔋 Battery → 🏠 Home', desc: 'Battery powering home — no solar, no grid' },
      { sources: ['battery','grid'], cat: 'profit', label: '🔋 Battery → 🏠 Home + ⚡ Grid (Force)', desc: 'Forced discharge: battery exporting to grid' },
      { sources: ['battery','grid'], cat: 'cost', label: '🔋 Battery + ⚡ Grid → 🏠 Home', desc: 'Battery discharging but grid supplement needed' },
      { sources: ['grid'], cat: 'cost', label: '⚡ Grid → 🏠 Home', desc: 'Grid covering home — battery idle' },
      { sources: ['grid','battery'], cat: 'cost', label: '⚡ Grid → 🏠 Home + 🔋 Battery (Force)', desc: 'Forced grid charging — cheap rate window' },
    ];

    const filtered = allItems.filter(item =>
      item.sources.some(s => activePowerSources.includes(s)) &&
      activeCategories.includes(item.cat)
    );

    legItems.innerHTML = filtered.map(item =>
      '<div style="padding:8px;margin-bottom:8px;background:var(--secondary-background-color);border-radius:4px;">' +
      '<div style="font-weight:bold;margin-bottom:4px;">' + item.label + '</div>' +
      '<div style="font-size:11px;color:var(--secondary-text-color);">' + item.desc + '</div>' +
      '</div>'
    ).join('');
  }

  // ── Future tab ───────────────────────────────────────────────────────────────
  _renderFuture() {
    this._lastRenderTs = Date.now();
    const alertBar   = this.shadowRoot.getElementById('alert-bar');
    const statusBar  = this.shadowRoot.getElementById('status-bar');
    const financeBar = this.shadowRoot.getElementById('finance-bar');
    const tbody = this.shadowRoot.getElementById('tb-future');
    if (!alertBar || !tbody) return;

    const primaryFc = this._getPrimaryFc();
    if (!primaryFc || !primaryFc.length) {
      tbody.innerHTML = '<tr><td colspan="21" class="err">⚠️ No forecast data found on ' +
        (this._eid('p_batt_forecast') || 'sensor.mpc_batt_power') + '</td></tr>';
      return;
    }

    const battMap  = this._buildFcMap(this._eid('p_batt_forecast'), _EMHASS_FC_KEYS.p_batt_forecast, 1);
    const gridMap  = this._buildFcMap(this._eid('p_grid_forecast'), _EMHASS_FC_KEYS.p_grid_forecast, 1);
    const pvMap    = this._buildFcMap(this._eid('p_pv_forecast'),   _EMHASS_FC_KEYS.p_pv_forecast,   1);
    const loadMap  = this._buildFcMap(this._eid('p_load_forecast'), _EMHASS_FC_KEYS.p_load_forecast, 1);
    const evMap    = this._buildFcMap(this._eid('p_ev_forecast'),   _EMHASS_FC_KEYS.p_ev_forecast || [], 1);
    const deferMap = this._buildFcMap(this._eid('p_defer_forecast'), _EMHASS_FC_KEYS.p_defer_forecast || [], 1);
    const socMap   = this._buildFcMap(this._eid('soc_forecast'),    _EMHASS_FC_KEYS.soc_forecast,    1);
    const socEvMap = this._buildFcMap(this._eid('soc_ev_forecast'), _EMHASS_FC_KEYS.soc_ev_forecast || [], 1);
    const socDeferMap = this._buildFcMap(this._eid('soc_defer_forecast'), _EMHASS_FC_KEYS.soc_defer_forecast || [], 1);
    const buyMap   = this._buildFcMap(this._eid('buy_price'),       _EMHASS_FC_KEYS.buy_price,       1);
    const sellMap  = this._buildFcMap(this._eid('sell_price'),      _EMHASS_FC_KEYS.sell_price,      1);

    const nearestGet = (map, ts) => {
      if (map.has(ts)) return map.get(ts);
      let best = null, bestDiff = Infinity;
      for (const [k, v] of map) { const d = Math.abs(k - ts); if (d < bestDiff) { bestDiff = d; best = v; } }
      return best ?? 0;
    };

    const fcTimestamps = primaryFc.map(r => new Date(r.date).getTime()).filter(t => !isNaN(t)).sort((a,b) => a-b);
    const stepHFor = (ts) => {
      const idx = fcTimestamps.indexOf(ts);
      return (idx >= 0 && idx < fcTimestamps.length - 1) ? (fcTimestamps[idx+1] - ts) / 3600000 : 5/60;
    };

    const nowTs    = Date.now();
    const todayStr = new Date().toLocaleDateString('en-CA');
    const fmtTime  = (ts) => new Date(ts)
      .toLocaleTimeString('en-AU', {hour:'numeric', minute:'2-digit', hour12:true})
      .toLowerCase().replace(/^0/, '');

    // ── Status bar: SoC, Morning/Peak SoC ────────────────────────────────────
    const nowSoc     = parseFloat(this._hass?.states[this._eid('soc_forecast')]?.state)    || null;
    const nowBuy     = parseFloat(this._hass?.states[this._eid('buy_price')]?.state)        || null;
    const nowSell    = parseFloat(this._hass?.states[this._eid('sell_price')]?.state)       || null;
    const netCostRaw = parseFloat(this._hass?.states[this._eid('net_cost')]?.state)         || null;

    let dawnSoc = null, dawnTime = '', dawnLabel = '';
    const chargingNow = primaryFc.some(r => {
      const ts = new Date(r.date).getTime();
      return Math.abs(ts - nowTs) < 900000 && (pvMap.get(ts)||0) > 150 && (battMap.get(ts)||0) < -150;
    });
    if (chargingNow) {
      let pkSoc = 0, pkTime = '';
      for (const row of primaryFc) {
        const ts = new Date(row.date).getTime();
        if (isNaN(ts) || ts < nowTs) continue;
        const soc = socMap.get(ts) || 0;
        if ((pvMap.get(ts)||0) > 150 && (battMap.get(ts)||0) < -150 && soc > pkSoc) {
          pkSoc = soc; pkTime = fmtTime(ts);
        }
      }
      if (pkSoc > 0) { dawnSoc = pkSoc; dawnTime = pkTime; dawnLabel = '🔋 Peak SoC'; }
    } else {
      let minSoc = Infinity, minTime = '';
      for (const row of primaryFc) {
        const ts = new Date(row.date).getTime();
        if (isNaN(ts) || ts <= nowTs) continue;
        if ((pvMap.get(ts)||0) > 150 && (battMap.get(ts)||0) < -150) break;
        const soc = socMap.get(ts);
        if (soc != null && soc > 0 && soc < minSoc) { minSoc = soc; minTime = fmtTime(ts); }
      }
      if (minSoc < Infinity) { dawnSoc = minSoc; dawnTime = minTime; dawnLabel = '🌅 Morning SoC'; }
    }

    // ── fmtAlertTime: adds day prefix for tomorrow+ events ───────────────────
    const fmtAlertTime = (ts) => {
      const d = new Date(ts);
      const timeStr = d.toLocaleTimeString('en-AU', {hour:'numeric', minute:'2-digit', hour12:true}).toLowerCase().replace(/^0/,'');
      return d.toLocaleDateString('en-CA') !== todayStr
        ? d.toLocaleDateString('en-AU', {weekday:'short'}) + ' ' + timeStr
        : timeStr;
    };

    // ── Alert detection: single pass through forecast ─────────────────────────
    let gridImportTime = '', gridExportTime = '';
    let forceChargeTime = '', forceDischargeTime = '';
    let battLowTime = '', battLowSoc = 0;
    let highBuyTime = '', highBuyPrice = 0;
    let highSellTime = '', highSellPrice = 0;
    const battMinPct = this._batteryMinPercent + 5; // +5% buffer above configured minimum

    for (const row of primaryFc) {
      const ts = new Date(row.date).getTime();
      if (isNaN(ts) || ts < nowTs) continue;
      const gW    = gridMap.get(ts)  || 0;
      const bW    = battMap.get(ts)  || 0;
      const pW    = pvMap.get(ts)    || 0;
      const soc   = socMap.get(ts)   || 0;
      const buyP  = nearestGet(buyMap,  ts);
      const sellP = nearestGet(sellMap, ts);

      // Force charge: battery charging from grid (no solar)
      if (!forceChargeTime && bW < -150 && gW > 150 && pW < 150)
        forceChargeTime = fmtAlertTime(ts);
      // Force discharge: battery discharging to grid
      if (!forceDischargeTime && bW > 150 && gW < -150)
        forceDischargeTime = fmtAlertTime(ts);
      // Grid import — only if no force charge detected
      if (!gridImportTime && !forceChargeTime && gW > 150)
        gridImportTime = fmtAlertTime(ts);
      // Grid export — only if no force discharge detected
      if (!gridExportTime && !forceDischargeTime && gW < -150)
        gridExportTime = fmtAlertTime(ts);
      // Battery low
      if (!battLowTime && soc > 0 && soc <= battMinPct) {
        battLowTime = fmtAlertTime(ts); battLowSoc = soc;
      }
      // High buy price
      if (!highBuyTime && buyP >= this._alertHighBuyPrice) {
        highBuyTime = fmtAlertTime(ts); highBuyPrice = buyP;
      }
      // High sell price
      if (!highSellTime && sellP >= this._alertHighSellPrice) {
        highSellTime = fmtAlertTime(ts); highSellPrice = sellP;
      }
    }

    // ── ALERTS bar ────────────────────────────────────────────────────────────
    if (alertBar) {
      const p = (txt, bg) => '<span class="pill" style="background:' + bg + ';color:#fff;margin-right:4px;">' + txt + '</span>';
      let alertHtml = '';
      // Force charge/discharge take priority over generic grid import/export
      if (forceChargeTime)    alertHtml += p('🔋 Force charge from '    + forceChargeTime,    '#f44336');
      if (forceDischargeTime) alertHtml += p('🔋 Force discharge from ' + forceDischargeTime, '#ff9800');
      if (!forceChargeTime    && gridImportTime) alertHtml += p('⚡ Grid import from '  + gridImportTime,  '#e65100');
      if (!forceDischargeTime && gridExportTime) alertHtml += p('📤 Grid export from '  + gridExportTime,  '#2e7d32');
      if (battLowTime)        alertHtml += p('🪫 Battery low ' + battLowSoc.toFixed(0) + '% at ' + battLowTime, '#c62828');
      if (highBuyTime)        alertHtml += p('💸 Peak price $' + highBuyPrice.toFixed(3) + '/kWh from ' + highBuyTime, '#6a1a6a');
      if (highSellTime)       alertHtml += p('💰 High export $' + highSellPrice.toFixed(3) + '/kWh from ' + highSellTime, '#1b5e20');
      alertBar.innerHTML = alertHtml
        ? '<span class="bar-label" style="color:#ff5722;">ALERTS:</span>' + alertHtml
        : '';
    }

    // ── STATUS bar ────────────────────────────────────────────────────────────
    if (statusBar) {
      const battCapKwh = parseFloat(this._hass?.states[this._eid('energy_capacity')]?.state) || null;
      const socKwhStr  = (nowSoc != null && battCapKwh) ? ' | ' + (nowSoc / 100 * battCapKwh).toFixed(1) + ' kWh' : '';
      const socTxtCol  = nowSoc  != null ? (nowSoc  <= 20 ? '#ff5252' : nowSoc  >= 75 ? '#69f0ae' : '#fff') : '#fff';
      const dawnTxtCol = dawnSoc != null ? (dawnSoc <= 20 ? '#ff5252' : dawnSoc <= 35 ? '#ffb74d' : '#69f0ae') : '#fff';

      // Mode — from sensor.mpc_optim_status (proper key resolution)
      const optimEid    = this._eid('optim_status');
      const optimStatus = optimEid ? (this._hass?.states[optimEid]?.state || null) : null;

      // Focus — from classifier on current forecast row
      let modeLabel = optimStatus || '', modeCol = '#555';
      let focusLabel = '', focusCol = '#555';
      if (modeLabel) {
        modeCol = modeLabel === 'Optimal'     ? '#2e7d32'
                : modeLabel === 'Infeasible'  ? '#c62828'
                : '#555';
      }
      for (const row of primaryFc) {
        const ts = new Date(row.date).getTime();
        if (isNaN(ts) || ts < nowTs) continue;
        const bW  = _emhass_clamp(battMap.get(ts) || 0);
        const gW  = _emhass_clamp(gridMap.get(ts) || 0);
        const pW  = _emhass_clamp(pvMap.get(ts)   || 0);
        const lW  = _emhass_clamp(loadMap.get(ts) || 0);
        // If no optim_status sensor, fall back to classifier mode
        if (!modeLabel) {
          const cls = _emhass_classifyFuture(pW, lW, bW, gW);
          modeLabel = cls.mode || '';
          modeCol   = modeLabel.includes('Charging')   ? '#1565c0'
                    : modeLabel.includes('Discharging') ? '#e65100'
                    : modeLabel.includes('Self')        ? '#558b2f'
                    : modeLabel.includes('Standby')     ? '#555'
                    : '#2e7d32';
        }
        // Focus always derived from current power values
        if      (bW < -150 && gW > 150 && pW < 150) { focusLabel = 'Charging Battery 🔋';    focusCol = '#1565c0'; }
        else if (bW > 150  && gW < -150)             { focusLabel = 'Discharging to Grid ⚡'; focusCol = '#e65100'; }
        else if (pW > 150  && gW < -150)             { focusLabel = 'Solar Export ☀️';        focusCol = '#2e7d32'; }
        else if (pW > 150  && bW < -150)             { focusLabel = 'Solar Self-Use 🌞';      focusCol = '#558b2f'; }
        else if (pW > 150)                           { focusLabel = 'Solar Self-Use 🌞';      focusCol = '#558b2f'; }
        else if (bW > 150)                           { focusLabel = 'Battery Discharge 🔋';   focusCol = '#00695c'; }
        else if (gW > 150)                           { focusLabel = 'Grid Import ⚡';         focusCol = '#c62828'; }
        else                                         { focusLabel = 'Standby 💤';            focusCol = '#555'; }
        break;
      }

      const pill = (val, bg, txt) => '<span class="pill" style="background:' + (bg||'#555') + ';color:' + (txt||'#fff') + ';">' + val + '</span>';

      // Forecast horizon — from primaryFc length × 5 min
      const horizonH = primaryFc.length > 0 ? Math.round(primaryFc.length * 5 / 60) : null;

      statusBar.innerHTML =
        '<span class="bar-label" style="color:#2196f3;">STATUS:</span>' +
        (modeLabel   ? '<span>📊 Mode: '    + pill(modeLabel,  modeCol)  + '</span>' : '') +
        (focusLabel  ? '<span>🎯 Focus: '   + pill(focusLabel, focusCol) + '</span>' : '') +
        (nowSoc != null
          ? '<span>🔋 SoC now: ' + pill(nowSoc.toFixed(1) + '%' + socKwhStr, '#555', socTxtCol) + '</span>'
          : '') +
        (dawnSoc != null
          ? '<span>' + dawnLabel + ': ' + pill(dawnSoc.toFixed(1) + '%' + (battCapKwh ? ' | ' + (dawnSoc / 100 * battCapKwh).toFixed(1) + ' kWh' : '') + ' (' + dawnTime + ')', '#555', dawnTxtCol) + '</span>'
          : '') +
        (horizonH ? '<span>📅 Plan Horizon: ' + pill(horizonH + 'h', '#555') + '</span>' : '');
    }

    // ── FINANCES bar ──────────────────────────────────────────────────────────
    if (financeBar) {
      // EM card badge format: bg colour changes, always black text on coloured badge
      // Buy:  #00c853 bg + #000 text when free/negative; #555 bg + #fff otherwise
      // Sell: #ff5252 bg + #000 text when zero/negative; #555 bg + #fff otherwise
      // Net:  #00FF00 + #000 profit | #ff5252 + #000 cost | #FFEB3B + #000 zero
      const buyBg   = (nowBuy  != null && nowBuy  <= 0) ? '#00c853' : '#555';
      const buyTxt  = (nowBuy  != null && nowBuy  <= 0) ? '#000'    : '#fff';
      const sellBg  = (nowSell != null && nowSell <= 0) ? '#ff5252' : '#555';
      const sellTxt = (nowSell != null && nowSell <= 0) ? '#000'    : '#fff';
      const netBg   = netCostRaw == null ? '#555'
                    : netCostRaw >  0    ? '#00FF00'
                    : netCostRaw <  0    ? '#ff5252'
                    : '#FFEB3B';
      const netTxt  = netCostRaw == null ? '#fff' : '#000';

      const fp = (label, val, bg, txt, title) =>
        '<span>' + label + '<span class="pill" style="background:' + bg + ';color:' + txt + ';"' +
        (title ? ' title="' + title + '"' : '') + '>' + val + '</span></span>';

      financeBar.innerHTML =
        '<span class="bar-label" style="color:#ff9800;">FINANCES:</span>' +
        (nowBuy     != null ? fp('💲 Buy: ',  _EMHASS_CUR + nowBuy.toFixed(4)  + '/kWh', buyBg,  buyTxt,  'Current buy/import price') : '') +
        (nowSell    != null ? fp('💲 Sell: ', _EMHASS_CUR + nowSell.toFixed(4) + '/kWh', sellBg, sellTxt, 'Current sell/feed-in price') : '') +
        (netCostRaw != null ? fp('📊 Net: ',  (netCostRaw > 0 ? '+' : '') + _EMHASS_CUR + netCostRaw.toFixed(2), netBg, netTxt, 'Net cost from optimizer. Positive = credit, Negative = cost') : '');
    }

    // ── Updated badge in tab bar — HAEO-style elapsed + time ───────────────────
    // Use automation.last_triggered if available, else fall back to p_load_forecast.last_changed
    const updBadge = this.shadowRoot.getElementById('upd-badge');
    if (updBadge) {
      const autoEid     = this._eid('emhass_automation');
      const autoState   = autoEid ? this._hass?.states[autoEid] : null;
      const lastChanged = autoState?.attributes?.last_triggered
        || this._hass?.states[this._eid('p_load_forecast')]?.last_changed;
      if (lastChanged) {
        const lastRun = new Date(lastChanged);
        const now     = new Date();
        const diffMs  = now - lastRun;
        const diffSecs = Math.floor(Math.abs(diffMs) / 1000);
        const diffMins = Math.floor(diffSecs / 60);
        const diffHours = Math.floor(diffMins / 60);
        const localTime = lastRun.toLocaleTimeString('en-AU', {hour:'numeric', minute:'2-digit', hour12:true})
          .toLowerCase().replace(/^0/,'');

        let elapsed = '';
        if (diffMs < 0 || diffSecs < 10) {
          elapsed = 'just now';
        } else if (diffSecs < 60) {
          elapsed = diffSecs + 's ago';
        } else if (diffMins < 60) {
          const remSecs = diffSecs % 60;
          elapsed = diffMins + 'm ' + (remSecs > 0 ? remSecs + 's ' : '') + 'ago';
        } else {
          const remMins = diffMins % 60;
          elapsed = diffHours + 'h ' + (remMins > 0 ? remMins + 'm ' : '') + 'ago';
        }

        updBadge.innerHTML = '🔄 EMHASS Updated: <span class="pill" style="background:#555;color:#fff;padding:2px 10px;border-radius:12px;font-weight:600;display:inline-block;">' +
          elapsed + ' (' + localTime + ')' + '</span>';
        updBadge.style.display = 'flex';
      }
    }

    // ── Pre-pass: daily cost + kWh totals ────────────────────────────────────
    const dailyCosts = {}, dailyKwh = {};
    for (const row of primaryFc) {
      const ts = new Date(row.date).getTime();
      if (isNaN(ts) || ts < nowTs) continue;
      const day   = new Date(ts).toLocaleDateString('en-CA');
      const battW = _emhass_clamp(battMap.get(ts) || 0);
      const gridW = _emhass_clamp(gridMap.get(ts) || 0);
      const loadW = _emhass_clamp(loadMap.get(ts) || 0);
      const pvW   = _emhass_clamp(pvMap.get(ts)   || 0);
      const evW   = _emhass_clamp(evMap.get(ts)   || 0);
      const deferW = _emhass_clamp(deferMap.get(ts) || 0);
      const buyP  = nearestGet(buyMap, ts);
      const sellP = nearestGet(sellMap, ts);
      const stepH = stepHFor(ts);
      const gridKw = gridW / 1000;
      const cost = gridW > 50 ? gridKw * buyP * stepH : gridW < -50 ? -(Math.abs(gridKw) * sellP * stepH) : 0;
      dailyCosts[day] = (dailyCosts[day] || 0) + cost;
      const dk = dailyKwh[day] || { load:0, pv:0, gridImp:0, gridExp:0, battChg:0, battDis:0, ev:0, defer:0 };
      dk.load  += (loadW/1000)  * stepH;
      dk.pv    += (pvW/1000)    * stepH;
      if (gridW > 50)  dk.gridImp += (gridW/1000)           * stepH; // import
      if (gridW < -50) dk.gridExp += (Math.abs(gridW)/1000) * stepH; // export (positive)
      // MPC: +ve=discharging, -ve=charging
      if (battW > 50)  dk.battDis += (battW/1000)           * stepH;
      if (battW < -50) dk.battChg += (Math.abs(battW)/1000) * stepH;
      dk.ev    += (evW/1000)    * stepH;
      dk.defer += (deferW/1000) * stepH;
      dailyKwh[day] = dk;
    }

    // ── Render rows ───────────────────────────────────────────────────────────
    const rows = [];
    let lastDay = '';

    for (const row of primaryFc) {
      const ts = new Date(row.date).getTime();
      if (isNaN(ts) || ts < nowTs) continue;

      const day     = new Date(ts).toLocaleDateString('en-CA');
      const timeStr = new Date(ts).toLocaleTimeString('en-AU',{hour:'2-digit',minute:'2-digit',hour12:false});

      if (day !== lastDay) {
        lastDay = day;
        const dayTotal   = dailyCosts[day] || 0;
        const dk         = dailyKwh[day]   || { load:0, pv:0, gridImp:0, gridExp:0, battChg:0, battDis:0, ev:0, defer:0 };
        const dayColor   = dayTotal <= 0 ? '#4caf50' : '#f44336';
        const dayLabel   = day === todayStr ? '📅 Today' : '📅 ' + new Date(ts).toLocaleDateString('en-AU',{weekday:'short',day:'numeric',month:'short'});
        const dayCostLbl = dayTotal <= 0 ? _EMHASS_CUR + Math.abs(dayTotal).toFixed(2) : '-' + _EMHASS_CUR + dayTotal.toFixed(2);
        const fmtKd  = (v) => Math.abs(v) > 0.001 ? v.toFixed(3) : '—';
        const fmtImp = (v) => Math.abs(v) > 0.001 ? '<span style="color:#f44336;">' + v.toFixed(3) + '</span>' : '—';
        const fmtExp = (v) => Math.abs(v) > 0.001 ? '<span style="color:#4caf50;">' + v.toFixed(3) + '</span>' : '—';
        const fmtChg = (v) => Math.abs(v) > 0.001 ? '<span style="color:#4caf50;">' + v.toFixed(3) + '</span>' : '—';
        const fmtDis = (v) => Math.abs(v) > 0.001 ? '<span style="color:#f44336;">' + v.toFixed(3) + '</span>' : '—';
        const lbl    = (t) => '<span style="font-weight:bold;font-size:9px;color:#888;">' + t + '</span>';
        const evCols1    = this._showEv    ? '<td class="bgl"></td><td class="bgi" style="text-align:right;">' + fmtKd(dk.ev)    + '</td><td class="bgl"></td>' : '';
        const deferCols1 = this._showDefer ? '<td class="bgl"></td><td class="bgi" style="text-align:right;">' + fmtKd(dk.defer) + '</td><td class="bgl"></td>' : '';
        const evCols2    = this._showEv    ? '<td></td><td></td><td></td>' : '';
        const deferCols2 = this._showDefer ? '<td></td><td></td><td></td>' : '';
        // Row 1: label, load, pv, import, charge, cost
        rows.push('<tr class="dr" style="border-bottom:1px solid var(--divider-color,#444);">' +
          '<td colspan="2">' + dayLabel + '</td>' +
          '<td class="bgl" colspan="3"></td>' +
          '<td class="bgl"></td><td class="bgi" style="text-align:right;">' + fmtKd(dk.load) + '</td>' +
          '<td class="bgl"></td><td class="bgi" style="text-align:right;">' + fmtKd(dk.pv) + '</td>' +
          '<td class="bgl" style="text-align:center;">' + lbl('Import:') + '</td>' +
          '<td class="bgi" style="text-align:right;">' + fmtImp(dk.gridImp) + '</td>' +
          '<td class="bgl" style="text-align:center;">' + lbl('Charge:') + '</td>' +
          '<td class="bgi" style="text-align:right;">' + fmtChg(dk.battChg) + '</td>' +
          '<td class="bgl"></td>' +
          evCols1 + deferCols1 +
          '<td class="bgl" style="text-align:right;color:' + dayColor + ';">' + dayCostLbl + '</td>' +
          '</tr>');
        // Row 2: export, discharge
        rows.push('<tr class="dr" style="border-top:1px solid var(--divider-color,#444);">' +
          '<td colspan="2"></td>' +
          '<td class="bgl" colspan="3"></td>' +
          '<td class="bgl"></td><td></td>' +
          '<td class="bgl"></td><td></td>' +
          '<td class="bgl" style="text-align:center;">' + lbl('Export:') + '</td>' +
          '<td class="bgi" style="text-align:right;">' + fmtExp(dk.gridExp) + '</td>' +
          '<td class="bgl" style="text-align:center;">' + lbl('Disch:') + '</td>' +
          '<td class="bgi" style="text-align:right;">' + fmtDis(dk.battDis) + '</td>' +
          '<td class="bgl"></td>' +
          evCols2 + deferCols2 +
          '<td></td>' +
          '</tr>');
      }

      const battW  = _emhass_clamp(battMap.get(ts) || 0);
      const gridW  = _emhass_clamp(gridMap.get(ts) || 0);
      const loadW  = _emhass_clamp(loadMap.get(ts) || 0);
      const pvW    = _emhass_clamp(pvMap.get(ts)   || 0);
      const evW    = _emhass_clamp(evMap.get(ts)   || 0);
      const deferW = _emhass_clamp(deferMap.get(ts) || 0);
      const soc    = socMap.get(ts)      || 0;
      const socEv  = socEvMap.get(ts)    || 0;
      const socDefer = socDeferMap.get(ts) || 0;
      const buyP   = nearestGet(buyMap,  ts);
      const sellP  = nearestGet(sellMap, ts);

      const cls  = _emhass_classifyFuture(pvW, loadW, battW, gridW);
      const c    = _EMHASS_COLOURS[cls.color] || { bg:'transparent', txt:'var(--primary-text-color)', cost:'var(--primary-text-color)' };

      const gridCol = gridW > 50 ? '#f44336' : gridW < -50 ? '#4caf50' : c.txt;
      const battDisp = -battW;
      const battCol  = battW > 50 ? '#f44336' : battW < -50 ? '#4caf50' : c.txt;
      const socCol   = soc <= 20 ? '#f44336' : soc >= 75 ? '#4caf50' : c.txt;
      const socEvCol = socEv <= 20 ? '#f44336' : socEv >= 75 ? '#4caf50' : (socEv > 0 ? c.txt : 'var(--secondary-text-color)');
      const socDeferCol = socDefer <= 20 ? '#f44336' : socDefer >= 75 ? '#4caf50' : (socDefer > 0 ? c.txt : 'var(--secondary-text-color)');

      const stepH  = stepHFor(ts);
      const gridKw = gridW / 1000;
      const cost   = gridW > 50 ? gridKw * buyP * stepH : gridW < -50 ? -(Math.abs(gridKw) * sellP * stepH) : 0;
      const costFmt = _emhass_fmtCost(cost);
      const costCol = costFmt.col || (cost > 0.0001 ? c.cost : c.txt);

      const fmtKw   = (w) => Math.abs(w) >= 10 ? (w/1000).toFixed(3) : '—';
      const fmtKwC  = (w, col) => Math.abs(w) >= 10 ? '<span style="color:' + col + ';">' + (w/1000).toFixed(3) + '</span>' : '—';
      const fmtKwh  = (w) => Math.abs(w/1000*stepH) > 0.001 ? (w/1000*stepH).toFixed(3) : '—';
      const fmtKwhC = (w, col) => { const k = w/1000*stepH; return Math.abs(k) > 0.001 ? '<span style="color:' + col + ';">' + k.toFixed(3) + '</span>' : '—'; };
      const fmtSoc  = (s) => s > 0 ? s.toFixed(1) : '—';

      rows.push('<tr style="background-color:' + c.bg + ';color:' + c.txt + ';">' +
        '<td>' + timeStr + '</td>' +
        '<td class="evt-cell" data-note="' + (cls.note||'').replace(/"/g,'&quot;') + '">' + cls.label + '</td>' +
        '<td class="bgl">' + (cls.mode || '') + '</td>' +
        '<td class="bgl">' + _emhass_fmtP(buyP)  + '</td>' +
        '<td class="bgi">' + _emhass_fmtP(sellP) + '</td>' +
        '<td class="bgl">' + fmtKw(loadW)  + '</td>' +
        '<td class="bgi">' + fmtKwh(loadW) + '</td>' +
        '<td class="bgl">' + fmtKw(pvW)    + '</td>' +
        '<td class="bgi">' + fmtKwh(pvW)   + '</td>' +
        '<td class="bgl">' + fmtKwC(gridW, gridCol)    + '</td>' +
        '<td class="bgi">' + fmtKwhC(gridW, gridCol)   + '</td>' +
        '<td class="bgl">' + fmtKwC(battDisp, battCol) + '</td>' +
        '<td class="bgi">' + fmtKwh(battDisp)          + '</td>' +
        '<td class="bgi"><span style="color:' + socCol + ';">' + fmtSoc(soc) + '</span></td>' +
        (this._showEv ?
          '<td class="bgl">' + fmtKwC(evW, (evW>50?'#ff9800':c.txt))    + '</td>' +
          '<td class="bgi">' + fmtKwh(evW)                               + '</td>' +
          '<td class="bgi"><span style="color:' + socEvCol + ';">' + fmtSoc(socEv) + '</span></td>'
          : '') +
        (this._showDefer ?
          '<td class="bgl">' + fmtKwC(deferW, (deferW>50?'#ff6f00':c.txt)) + '</td>' +
          '<td class="bgi">' + fmtKwh(deferW)                               + '</td>' +
          '<td class="bgi"><span style="color:' + socDeferCol + ';">' + fmtSoc(socDefer) + '</span></td>'
          : '') +
        '<td class="bgl"><span style="color:' + costCol + ';font-weight:bold;">' + costFmt.disp + '</span></td>' +
        '</tr>');
    }

    tbody.innerHTML = rows.length ? rows.join('') : '<tr><td colspan="21" class="msg">No future forecast rows available.</td></tr>';
    // Attach tooltips to event cells
    tbody.querySelectorAll('.evt-cell').forEach(cell => {
      const note = cell.getAttribute('data-note');
      if (note) this._attachTooltip(cell, note);
    });
    requestAnimationFrame(() => this._setWrapHeight());
  }

  // ── Past tab ──────────────────────────────────────────────────────────
  async _loadPast() {
    const st = this.shadowRoot.getElementById('st-past');
    const tb = this.shadowRoot.getElementById('tb-past');
    if (!st || !tb) return;

    // Timeout guard — if stuck in 'loading' for >90s reset and allow retry
    // BESS data over 7 days can be very large — needs longer timeout
    if (this._pastState === 'loading' && Date.now() - this._pastLoadTs > 90000) {
      this._pastState = 'idle';
    }
    if (this._pastState === 'loading') return;
    this._pastState  = 'loading';
    this._pastLoadTs = Date.now();

    try {
      const { start, end } = this._getRangeP();
      const sel3 = this.shadowRoot.getElementById('range-past');
      const rangeLabel = sel3 ? sel3.options[sel3.selectedIndex]?.text : '';
      st.textContent = 'Fetching ' + rangeLabel + '...';

      const togEl   = this.shadowRoot.getElementById('bess-toggle');
      const isBess  = togEl ? !togEl.checked : false;
      const hasBess = !!(this._eid('bess_batt_power'));
      const useBess = isBess && hasBess;

      // Warn for large BESS queries — Sigenergy sensors update every few seconds
      // so 7 days of BESS data = ~100k state changes per sensor
      const rangeHours = (end - start) / 3600000;
      if (useBess && rangeHours > 48) {
        st.textContent = 'Fetching ' + rangeLabel + ' (large BESS query — may take a moment)...';
      }

      const battEid = useBess ? this._eid('bess_batt_power')   : this._eid('p_batt_forecast');
      const gridEid = useBess ? this._eid('bess_grid_power')   : this._eid('p_grid_forecast');
      const pvEid   = useBess ? this._eid('bess_pv_power')     : this._eid('p_pv_forecast');
      const loadEid = useBess ? this._eid('bess_load_power')   : this._eid('p_load_forecast');
      const socEid  = useBess ? this._eid('bess_soc')          : this._eid('soc_forecast');
      const evEid   = this._eid('p_ev_forecast');
      const socEvEid = this._eid('soc_ev_forecast');
      const deferEid = this._eid('p_defer_forecast');
      const socDeferEid = this._eid('soc_defer_forecast');
      const buyEid  = this._eid('past_buy_price');
      const sellEid = this._eid('past_sell_price');

      const powerIds = [
        battEid, gridEid, pvEid, loadEid, socEid, evEid, socEvEid, deferEid, socDeferEid, buyEid, sellEid,
      ].filter(Boolean);

      const energyIds = [
        this._eid('energy_load'),   this._eid('energy_solar'),
        this._eid('energy_grid_import'), this._eid('energy_grid_export'),
        this._eid('energy_batt_charge'), this._eid('energy_batt_discharge'),
        this._eid('energy_ev'), this._eid('energy_defer'),
      ].filter(Boolean);

      const result = await this._hass.callWS({
        type: 'history/history_during_period',
        start_time: start.toISOString(), end_time: end.toISOString(),
        entity_ids: [...new Set([...powerIds, ...energyIds])],
        minimal_response: true, no_attributes: true,
      });

      const lookup = {};
      for (const [eid, states] of Object.entries(result)) {
        lookup[eid] = states.map(s => ({ t: (s.lu !== undefined ? s.lu : s.lc) * 1000, s: s.s })).sort((a,b) => a.t - b.t);
      }

      // Instance-aware clamp functions using configurable noise thresholds
      const clamp     = (w) => Math.abs(w) < this._noiseFloor     ? 0 : w;
      const clampBess = (w) => Math.abs(w) < this._noiseFloorBess ? 0 : w;

      if (useBess) {
        const avgEids  = [battEid, gridEid, pvEid, loadEid, evEid, deferEid];
        const lastEids = [socEid, socEvEid, socDeferEid, buyEid, sellEid];
        const allEids  = [...avgEids, ...lastEids];
        const agg = _emhass_bucket5min(lookup, allEids, avgEids, lastEids);
        const bessPwrScale = {
          [battEid]: _emhass_powerMult(this._hass, battEid),
          [gridEid]: _emhass_powerMult(this._hass, gridEid),
          [pvEid]:   _emhass_powerMult(this._hass, pvEid),
          [loadEid]: _emhass_powerMult(this._hass, loadEid),
          [evEid]:   _emhass_powerMult(this._hass, evEid),
          [deferEid]: _emhass_powerMult(this._hass, deferEid),
        };
        for (const eid of avgEids) {
          if (!agg[eid]) continue;
          const unit = (this._hass?.states[eid]?.attributes?.unit_of_measurement || 'W').trim().toUpperCase();
          const toW = unit === 'KW' ? 1000 : unit === 'MW' ? 1000000 : 1;
          if (toW !== 1) {
            agg[eid] = agg[eid].map(s => ({ t: s.t, s: String((parseFloat(s.s) * toW).toFixed(2)) }));
          }
          lookup[eid] = agg[eid];
        }
        for (const eid of lastEids) {
          if (agg[eid]) lookup[eid] = agg[eid];
        }
      }

      this._engMult = {
        energy_load:           _emhass_energyMult(this._hass, this._eid('energy_load')),
        energy_solar:          _emhass_energyMult(this._hass, this._eid('energy_solar')),
        energy_grid_import:    _emhass_energyMult(this._hass, this._eid('energy_grid_import')),
        energy_grid_export:    _emhass_energyMult(this._hass, this._eid('energy_grid_export')),
        energy_batt_charge:    _emhass_energyMult(this._hass, this._eid('energy_batt_charge')),
        energy_batt_discharge: _emhass_energyMult(this._hass, this._eid('energy_batt_discharge')),
        energy_ev:             _emhass_energyMult(this._hass, this._eid('energy_ev')),
        energy_defer:          _emhass_energyMult(this._hass, this._eid('energy_defer')),
      };

      // bess_batt_invert (config): for inverters reporting battery +ve=discharge (Deye, Goodwe),
      // negate the recorded battery power so the Past tab uses the card's +ve=charge convention.
      if (useBess && this._config.bess_batt_invert === true && lookup[battEid]) {
        lookup[battEid] = lookup[battEid].map(x => {
          const v = parseFloat(x.s);
          return isNaN(v) ? x : { t: x.t, s: String(-v) };
        });
      }

      if (!lookup[loadEid]?.length && !lookup[pvEid]?.length) {
        const sel = this.shadowRoot.getElementById('range-past');
        const modeStr = useBess ? 'BESS' : 'EMHASS';
        const primaryEid = loadEid || pvEid || battEid || gridEid || '(no sensor resolved)';
        if (sel && sel.value === 'today') {
          st.textContent = 'No data yet — switching to Last 24h...';
          sel.value = '24'; this._pastState = 'idle';
          setTimeout(() => this._loadPast(), 500); return;
        }
        tb.innerHTML = '<tr><td colspan="21" class="msg">⚠️ No ' + modeStr + ' sensor data for this period.<br>' +
          '<small style="color:var(--secondary-text-color);">Checked: ' + primaryEid + ' — confirm sensor is recorded in HA recorder.</small></td></tr>';
        st.textContent = 'No data (' + modeStr + ')'; this._pastState = 'ready'; return;
      }

      const step = 5 * 60 * 1000;
      const recordedTs = new Set();
      for (const eid of [battEid, gridEid, pvEid, loadEid]) {
        if (!lookup[eid]) continue;
        for (const s of lookup[eid]) {
          if (s.t >= start.getTime() && s.t <= end.getTime()) {
            recordedTs.add(s.t);
          }
        }
      }
      let entries;
      if (recordedTs.size > 0) {
        entries = Array.from(recordedTs).sort((a, b) => b - a);
      } else {
        const startMs = Math.ceil(start.getTime() / step) * step;
        entries = [];
        for (let t = startMs; t <= end.getTime(); t += step) entries.push(t);
        entries.reverse();
      }

      // ── Pre-pass: accumulate daily kWh and cost totals ────────────────────
      const dailyCosts = {}, dailyKwh = {};
      const stepH5 = 5 / 60;
      for (const ts of Array.from(recordedTs).sort((a,b) => a-b)) {
        const dayKey = new Date(ts).toLocaleDateString('en-AU', {weekday:'short',day:'numeric',month:'short',year:'numeric'});
        const bW = clamp(parseFloat(_emhass_getAt(lookup[battEid], ts)) || 0);
        const gW = useBess ? clampBess(parseFloat(_emhass_getAt(lookup[gridEid], ts)) || 0)
                           : clamp(parseFloat(_emhass_getAt(lookup[gridEid], ts)) || 0);
        const lW = clamp(parseFloat(_emhass_getAt(lookup[loadEid], ts)) || 0);
        const pW = useBess ? clampBess(parseFloat(_emhass_getAt(lookup[pvEid], ts)) || 0)
                           : clamp(parseFloat(_emhass_getAt(lookup[pvEid], ts)) || 0);
        const buyP  = parseFloat(_emhass_getAt(lookup[buyEid],  ts)) || 0;
        const sellP = parseFloat(_emhass_getAt(lookup[sellEid], ts)) || 0;
        const gKw = gW / 1000;
        const cost = gW > 50 ? gKw*buyP*stepH5 : gW < -50 ? -(Math.abs(gKw)*sellP*stepH5) : 0;
        dailyCosts[dayKey] = (dailyCosts[dayKey] || 0) + cost;
        const dk = dailyKwh[dayKey] || { load:0, pv:0, gridImp:0, gridExp:0, battChg:0, battDis:0 };
        dk.load += (lW/1000) * stepH5;
        dk.pv   += (pW/1000) * stepH5;
        if (gW > 50)  dk.gridImp += (gW/1000)  * stepH5;  // import
        if (gW < -50) dk.gridExp += (-gW/1000)  * stepH5; // export (stored positive)
        // BESS: +ve=charging, -ve=discharging; MPC: +ve=discharging, -ve=charging
        const battChging = useBess ? bW > 50 : bW < -50;
        const battDiscing = useBess ? bW < -50 : bW > 50;
        if (battChging)  dk.battChg += (Math.abs(bW)/1000) * stepH5;
        if (battDiscing) dk.battDis += (Math.abs(bW)/1000) * stepH5;
        dailyKwh[dayKey] = dk;
      }

      const rows = [];
      let lastDay = '';
      const todayStr = new Date().toLocaleDateString('en-CA');

      for (const ts of entries) {
        const dt     = new Date(ts);
        const dayStr = dt.toLocaleDateString('en-AU',{weekday:'short',day:'numeric',month:'short',year:'numeric'});
        const dayCa  = dt.toLocaleDateString('en-CA');
        const timeStr= dt.toLocaleTimeString('en-AU',{hour:'2-digit',minute:'2-digit',hour12:false});

        // ── Day header/summary rows (2 rows: import/charge + export/discharge) ──
        if (dayStr !== lastDay) {
          lastDay = dayStr;
          const dayTotal   = dailyCosts[dayStr] || 0;
          const dk         = dailyKwh[dayStr]   || { load:0, pv:0, gridImp:0, gridExp:0, battChg:0, battDis:0 };
          const dayColor   = dayTotal <= 0 ? '#4caf50' : '#f44336';
          const dayLabel   = dayCa === todayStr ? '📅 Today' : '📅 ' + dayStr;
          const dayCostLbl = dayTotal <= 0 ? _EMHASS_CUR + Math.abs(dayTotal).toFixed(2) : '-' + _EMHASS_CUR + dayTotal.toFixed(2);
          const fmtKd  = (v) => Math.abs(v) > 0.001 ? v.toFixed(3) : '—';
          const fmtImp = (v) => Math.abs(v) > 0.001 ? '<span style="color:#f44336;">' + v.toFixed(3) + '</span>' : '—';
          const fmtExp = (v) => Math.abs(v) > 0.001 ? '<span style="color:#4caf50;">' + v.toFixed(3) + '</span>' : '—';
          const fmtChg = (v) => Math.abs(v) > 0.001 ? '<span style="color:#4caf50;">' + v.toFixed(3) + '</span>' : '—';
          const fmtDis = (v) => Math.abs(v) > 0.001 ? '<span style="color:#f44336;">' + v.toFixed(3) + '</span>' : '—';
          const lbl    = (t) => '<span style="font-weight:bold;font-size:9px;color:#888;">' + t + '</span>';
          const evCols1    = this._showEv    ? '<td class="bgl"></td><td class="bgi">—</td><td class="bgi"></td>' : '';
          const deferCols1 = this._showDefer ? '<td class="bgl"></td><td class="bgi">—</td><td class="bgi"></td>' : '';
          const evCols2    = this._showEv    ? '<td></td><td></td><td></td>' : '';
          const deferCols2 = this._showDefer ? '<td></td><td></td><td></td>' : '';
          // Row 1: label, load, pv, import, charge, cost
          rows.push('<tr class="dr" style="border-bottom:1px solid var(--divider-color,#444);">' +
            '<td colspan="2">' + dayLabel + '</td>' +
            '<td class="bgl" colspan="3"></td>' +
            '<td class="bgl"></td><td class="bgi" style="text-align:right;">' + fmtKd(dk.load) + '</td>' +
            '<td class="bgl"></td><td class="bgi" style="text-align:right;">' + fmtKd(dk.pv) + '</td>' +
            '<td class="bgl" style="text-align:center;">' + lbl('Import:') + '</td>' +
            '<td class="bgi" style="text-align:right;">' + fmtImp(dk.gridImp) + '</td>' +
            '<td class="bgl" style="text-align:center;">' + lbl('Charge:') + '</td>' +
            '<td class="bgi" style="text-align:right;">' + fmtChg(dk.battChg) + '</td>' +
            '<td class="bgl"></td>' +
            evCols1 + deferCols1 +
            '<td class="bgl" style="text-align:right;color:' + dayColor + ';">' + dayCostLbl + '</td>' +
            '</tr>');
          // Row 2: export, discharge
          rows.push('<tr class="dr" style="border-top:1px solid var(--divider-color,#444);">' +
            '<td colspan="2"></td>' +
            '<td class="bgl" colspan="3"></td>' +
            '<td class="bgl"></td><td></td>' +
            '<td class="bgl"></td><td></td>' +
            '<td class="bgl" style="text-align:center;">' + lbl('Export:') + '</td>' +
            '<td class="bgi" style="text-align:right;">' + fmtExp(dk.gridExp) + '</td>' +
            '<td class="bgl" style="text-align:center;">' + lbl('Disch:') + '</td>' +
            '<td class="bgi" style="text-align:right;">' + fmtDis(dk.battDis) + '</td>' +
            '<td class="bgl"></td>' +
            evCols2 + deferCols2 +
            '<td></td>' +
            '</tr>');
        }

        const battW = clamp(parseFloat(_emhass_getAt(lookup[battEid], ts)) || 0);
        const gridW = useBess ? clampBess(parseFloat(_emhass_getAt(lookup[gridEid], ts)) || 0)
                              : clamp(parseFloat(_emhass_getAt(lookup[gridEid], ts)) || 0);
        const loadW = clamp(parseFloat(_emhass_getAt(lookup[loadEid], ts)) || 0);
        const pvW   = useBess ? clampBess(parseFloat(_emhass_getAt(lookup[pvEid], ts)) || 0)
                              : clamp(parseFloat(_emhass_getAt(lookup[pvEid],   ts)) || 0);
        const evW   = evEid ? _emhass_clamp(parseFloat(_emhass_getAt(lookup[evEid], ts)) || 0) : 0;
        const deferW = deferEid ? _emhass_clamp(parseFloat(_emhass_getAt(lookup[deferEid], ts)) || 0) : 0;
        const soc   = parseFloat(_emhass_getAt(lookup[socEid],  ts)) || 0;
        const socEv = socEvEid ? (parseFloat(_emhass_getAt(lookup[socEvEid], ts)) || 0) : 0;
        const socDefer = socDeferEid ? (parseFloat(_emhass_getAt(lookup[socDeferEid], ts)) || 0) : 0;
        const buyP  = parseFloat(_emhass_getAt(lookup[buyEid],  ts)) || 0;
        const sellP = parseFloat(_emhass_getAt(lookup[sellEid], ts)) || 0;

        // Skip only if ALL power values are zero
        if (Math.abs(battW)<10 && Math.abs(gridW)<10 && loadW<10 && pvW<10 && evW<10 && deferW<10) continue;

        const battWc = useBess ? -battW : battW;
        const cls = _emhass_classifyPast(pvW, loadW, battWc, gridW);
        const c   = _EMHASS_COLOURS[cls.color] || { bg:'transparent', txt:'var(--primary-text-color)', cost:'var(--primary-text-color)' };

        const gridCol = gridW > 50 ? '#f44336' : gridW < -50 ? '#4caf50' : c.txt;
        const battDisp = useBess ? battW : -battW;
        const battCol  = useBess
          ? (battW > 50 ? '#4caf50' : battW < -50 ? '#f44336' : c.txt)
          : (battW > 50 ? '#f44336' : battW < -50 ? '#4caf50' : c.txt);
        const socCol  = soc <= 20 ? '#f44336' : soc >= 75 ? '#4caf50' : c.txt;
        const evCol = evW > 50 ? '#ff9800' : c.txt;
        const socEvCol = socEv <= 20 ? '#f44336' : socEv >= 75 ? '#4caf50' : (socEv > 0 ? c.txt : 'var(--secondary-text-color)');
        const deferCol = deferW > 50 ? '#ff6f00' : c.txt;
        const socDeferCol = socDefer <= 20 ? '#f44336' : socDefer >= 75 ? '#4caf50' : (socDefer > 0 ? c.txt : 'var(--secondary-text-color)');

        const stepH = 5/60, gridKw = gridW/1000;
        const cost  = gridW > 50 ? gridKw*buyP*stepH : gridW < -50 ? -(Math.abs(gridKw)*sellP*stepH) : 0;
        const costFmt = _emhass_fmtCost(cost);
        const costCol = costFmt.col || (cost > 0.0001 ? c.cost : c.txt);

        const prevTs = ts - step;
        const eLoad  = _emhass_getDelta(lookup[this._eid('energy_load')],           ts, prevTs, this._engMult.energy_load);
        const eSolar = _emhass_getDelta(lookup[this._eid('energy_solar')],          ts, prevTs, this._engMult.energy_solar);
        const eGImp  = _emhass_getDelta(lookup[this._eid('energy_grid_import')],    ts, prevTs, this._engMult.energy_grid_import);
        const eGExp  = _emhass_getDelta(lookup[this._eid('energy_grid_export')],    ts, prevTs, this._engMult.energy_grid_export);
        const eBattC = _emhass_getDelta(lookup[this._eid('energy_batt_charge')],    ts, prevTs, this._engMult.energy_batt_charge);
        const eBattD = _emhass_getDelta(lookup[this._eid('energy_batt_discharge')], ts, prevTs, this._engMult.energy_batt_discharge);
        const eEv    = _emhass_getDelta(lookup[this._eid('energy_ev')],             ts, prevTs, this._engMult.energy_ev);
        const eDefer = _emhass_getDelta(lookup[this._eid('energy_defer')],          ts, prevTs, this._engMult.energy_defer);
        const eGrid  = gridW < -50 ? (eGExp !== null ? -eGExp : null) : gridW > 50 ? eGImp : null;
        const eBatt = useBess
          ? (battW > 50 ? eBattC : battW < -50 ? (eBattD !== null ? -eBattD : null) : null)
          : (battW < -50 ? eBattC : battW > 50 ? (eBattD !== null ? -eBattD : null) : null);

        const fmtE   = (v) => v !== null && Math.abs(v) > 0.005 ? v.toFixed(3) : '—';
        const fmtKwP  = (w) => Math.abs(w) >= 10 ? (w/1000).toFixed(3) : '—';
        const fmtKwPC = (w, col) => Math.abs(w) >= 10 ? '<span style="color:' + col + ';">' + (w/1000).toFixed(3) + '</span>' : '—';
        const fmtSoc  = (s) => s > 0 ? s.toFixed(1) : '—';

        rows.push('<tr style="background-color:' + c.bg + ';color:' + c.txt + ';">' +
          '<td>' + timeStr + '</td><td class="evt-cell" data-note="' + (cls.note||'').replace(/"/g,'&quot;') + '">' + cls.label + '</td>' +
          '<td class="bgl" style="font-size:11px;color:var(--secondary-text-color);">' + (cls.mode || '') + '</td>' +
          '<td class="bgl">' + _emhass_fmtP(buyP)  + '</td>' +
          '<td class="bgi">' + _emhass_fmtP(sellP) + '</td>' +
          '<td class="bgl">' + fmtKwP(loadW) + '</td><td class="bgi">' + fmtE(eLoad)  + '</td>' +
          '<td class="bgl">' + fmtKwP(pvW)   + '</td><td class="bgi">' + fmtE(eSolar) + '</td>' +
          '<td class="bgl">' + fmtKwPC(gridW, gridCol) + '</td>' +
          '<td class="bgi"><span style="color:' + gridCol + ';">' + fmtE(eGrid)  + '</span></td>' +
          '<td class="bgl">' + fmtKwPC(battDisp, battCol) + '</td>' +
          '<td class="bgi"><span style="color:' + battCol + ';">' + fmtE(eBatt !== null ? -eBatt : null) + '</span></td>' +
          '<td class="bgi"><span style="color:' + socCol  + ';">' + (soc > 0 ? soc.toFixed(1) : '—') + '</span></td>' +
          (this._showEv ?
            '<td class="bgl">' + fmtKwPC(evW, evCol) + '</td>' +
            '<td class="bgi"><span style="color:' + evCol + ';">' + fmtE(eEv) + '</span></td>' +
            '<td class="bgi"><span style="color:' + socEvCol + ';">' + fmtSoc(socEv) + '</span></td>'
            : '') +
          (this._showDefer ?
            '<td class="bgl">' + fmtKwPC(deferW, deferCol) + '</td>' +
            '<td class="bgi"><span style="color:' + deferCol + ';">' + fmtE(eDefer) + '</span></td>' +
            '<td class="bgi"><span style="color:' + socDeferCol + ';">' + fmtSoc(socDefer) + '</span></td>'
            : '') +
          '<td class="bgl"><span style="color:' + costCol + ';font-weight:bold;">' + costFmt.disp + '</span></td>' +
          '</tr>');
      }

      tb.innerHTML = rows.length ? rows.join('') : '<tr><td colspan="21" class="msg">⚠️ No readings for this period.</td></tr>';
      requestAnimationFrame(() => this._setWrapHeight());
      const sel2 = this.shadowRoot.getElementById('range-past');
      const modeLabel = useBess ? '🕐 BESS' : '📊 EMHASS';
      const bessNote  = useBess
        ? '<span style="position:absolute;left:50%;transform:translateX(-50%);color:#f44336;font-weight:600;white-space:nowrap;">📝 Note: Shows recorded inverter/battery sensor values, not EMHASS decisions</span>'
        : '';
      const sbar = this.shadowRoot.querySelector('#pane-past .sbar');
      if (sbar) sbar.style.position = 'relative';
      const stEl = this.shadowRoot.getElementById('st-past');
      if (stEl) {
        stEl.innerHTML = rows.length + ' events from ' + entries.length + ' readings — ' +
          (sel2 ? sel2.options[sel2.selectedIndex].text : '') + ' · ' + modeLabel +
          (bessNote ? bessNote : '');
      }
      // Attach tooltips to past event cells
      const tbPast = this.shadowRoot.getElementById('tb-past');
      if (tbPast) tbPast.querySelectorAll('.evt-cell').forEach(cell => {
        const note = cell.getAttribute('data-note');
        if (note) this._attachTooltip(cell, note);
      });
      this._pastState = 'ready';

    } catch (e) {
      const tb2 = this.shadowRoot.getElementById('tb-past');
      const st2 = this.shadowRoot.getElementById('st-past');
      const errMsg = e?.message || String(e);
      if (tb2) tb2.innerHTML = '<tr><td colspan="21" class="err">⚠️ Error loading past data: ' + errMsg +
        '<br><small style="color:var(--secondary-text-color);">Check browser console (F12) for details. ' +
        'Common causes: sensor not recorded, HA recorder not running, WebSocket timeout.</small></td></tr>';
      if (st2) st2.textContent = 'Error — ' + errMsg.slice(0, 80);
      this._pastState = 'ready';
    }
  }

  _getRangeP() {
    const sel = this.shadowRoot.getElementById('range-past');
    const val = sel ? sel.value : 'today';
    const now = new Date();
    let start, end;
    if (val === 'today') {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0); end = now;
    } else if (val === 'yesterday') {
      end   = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      start = new Date(end - 86400000);
    } else {
      end = now; start = new Date(end - parseInt(val) * 3600000);
    }
    return { start, end };
  }

  getCardSize() { return 12; }
}

if (!customElements.get('emhass-events-card')) {
  customElements.define('emhass-events-card', EmhassEventsCard);
}

window.customCards = window.customCards || [];
if (!window.customCards.find(c => c.type === 'emhass-events-card')) {
  window.customCards.push({
    type:        'emhass-events-card',
    name:        'EMHASS Events Card',
    description: 'EMHASS optimizer future forecast and past events — v2.1.8-mod with EV & Defer. Loads columns',
  });
}
