"""Constants for the Genergy Dashboard integration."""

DOMAIN = "genergy_dashboard"
VERSION = "1.0.0"
DASHBOARD_URL_PATH = "dashboard-sigenergy"
DASHBOARD_TITLE = "Sigenergy"

# ---------------------------------------------------------------------------
# Entity configuration keys — maps to dashboard template placeholders
# ---------------------------------------------------------------------------

# Core power sensors
CONF_SOLAR_POWER = "solar_power"
CONF_LOAD_POWER = "load_power"
CONF_BATTERY_POWER = "battery_power"
CONF_BATTERY_SOC = "battery_soc"
CONF_GRID_POWER = "grid_power"

# Daily energy totals
CONF_SOLAR_ENERGY_TODAY = "solar_energy_today"
CONF_LOAD_ENERGY_TODAY = "load_energy_today"
CONF_BATTERY_CHARGE_TODAY = "battery_charge_today"
CONF_BATTERY_DISCHARGE_TODAY = "battery_discharge_today"
CONF_GRID_IMPORT_TODAY = "grid_import_today"
CONF_GRID_EXPORT_TODAY = "grid_export_today"

# Environment
CONF_WEATHER = "weather"

# EMHASS core
CONF_EMHASS_MODE = "emhass_mode"
CONF_EMHASS_REASON = "emhass_reason"

# EMHASS financials
CONF_EMHASS_SAVINGS_TODAY = "emhass_savings_today"
CONF_EMHASS_SAVINGS_MONTHLY = "emhass_savings_monthly"
CONF_EMHASS_NET_COST_TODAY = "emhass_net_cost_today"
CONF_EMHASS_NET_COST_MONTH = "emhass_net_cost_month"
CONF_EMHASS_PROJECTED_BILL = "emhass_projected_bill"
CONF_EMHASS_PROJECTED_SAVINGS = "emhass_projected_savings"
CONF_EMHASS_BATTERY_SUMMARY = "emhass_battery_summary"
CONF_EMHASS_LAST_DECISION = "emhass_last_decision"
CONF_EMHASS_IMPORT_COST_DAILY = "emhass_import_cost_daily"
CONF_EMHASS_EXPORT_EARNINGS_DAILY = "emhass_export_earnings_daily"

# EMHASS automations
CONF_EMHASS_MPC_AUTOMATION = "emhass_mpc_automation"
CONF_EMHASS_BATTERY_AUTOMATION = "emhass_battery_automation"

# MPC sensors
CONF_MPC_BATTERY = "mpc_battery"
CONF_MPC_GRID = "mpc_grid"
CONF_MPC_PV = "mpc_pv"
CONF_MPC_BATTERY_SOC = "mpc_battery_soc"
CONF_MPC_LOAD = "mpc_load_power"
CONF_MPC_DEFERRABLE0 = "mpc_deferrable0"
CONF_MPC_DEFERRABLE1 = "mpc_deferrable1"
CONF_MPC_OPTIM_STATUS = "mpc_optim_status"
CONF_MPC_COST_FUN = "mpc_cost_fun"

# Pricing
CONF_BUY_PRICE = "buy_price"
CONF_SELL_PRICE = "sell_price"
CONF_NORDPOOL = "nordpool"
CONF_CURRENT_IMPORT_COST = "current_import_cost"
CONF_CURRENT_EXPORT_RATE = "current_export_rate"

# Solcast
CONF_SOLCAST_TODAY = "solcast_today"
CONF_SOLCAST_TOMORROW = "solcast_tomorrow"
CONF_SOLCAST_REMAINING = "solcast_remaining"

# Battery details
CONF_BATTERY_PACK1_SOC = "battery_pack1_soc"
CONF_BATTERY_PACK2_SOC = "battery_pack2_soc"
CONF_BATTERY_PACK3_SOC = "battery_pack3_soc"
CONF_BATTERY_TEMP = "battery_temp"
CONF_BATTERY_VOLTAGE = "battery_voltage"
CONF_BATTERY_CURRENT = "battery_current"

# Inverter details
CONF_INVERTER_TEMP = "inverter_temp"
CONF_INVERTER_RATED_POWER = "inverter_rated_power"
CONF_INVERTER_OUTPUT_POWER = "inverter_output_power"
CONF_DC_TRANSFORMER_TEMP = "dc_transformer_temp"
CONF_PV1_POWER = "pv1_power"
CONF_PV2_POWER = "pv2_power"

# Grid details
CONF_GRID_VOLTAGE = "grid_voltage"
CONF_GRID_FREQUENCY = "grid_frequency"
CONF_GRID_CT_CLAMP = "grid_ct_clamp"

# Peripheral devices
CONF_EV_CHARGER_POWER = "ev_charger_power"
CONF_EV_CHARGER_STATE = "ev_charger_state"
CONF_HEAT_PUMP_POWER = "heat_pump_power"

# Feature toggles
CONF_USE_SIGENERGY_DEFAULTS = "use_sigenergy_defaults"
CONF_FEATURE_EV = "feature_ev"
CONF_FEATURE_HEAT_PUMP = "feature_heat_pump"
CONF_FEATURE_EMHASS = "feature_emhass"
CONF_FEATURE_SOLCAST = "feature_solcast"
CONF_BATTERY_PACKS = "battery_packs"

# ---------------------------------------------------------------------------
# Placeholder mapping: config key -> template placeholder string
# ---------------------------------------------------------------------------
PLACEHOLDER_MAP = {
    CONF_SOLAR_POWER: "__solar_power__",
    CONF_LOAD_POWER: "__load_power__",
    CONF_BATTERY_POWER: "__battery_power__",
    CONF_BATTERY_SOC: "__battery_soc__",
    CONF_GRID_POWER: "__grid_power__",
    CONF_SOLAR_ENERGY_TODAY: "__solar_energy_today__",
    CONF_LOAD_ENERGY_TODAY: "__load_energy_today__",
    CONF_BATTERY_CHARGE_TODAY: "__battery_charge_today__",
    CONF_BATTERY_DISCHARGE_TODAY: "__battery_discharge_today__",
    CONF_GRID_IMPORT_TODAY: "__grid_import_today__",
    CONF_GRID_EXPORT_TODAY: "__grid_export_today__",
    CONF_WEATHER: "__weather__",
    CONF_EMHASS_MODE: "__emhass_mode__",
    CONF_EMHASS_REASON: "__emhass_reason__",
    CONF_EMHASS_SAVINGS_TODAY: "__emhass_savings_today__",
    CONF_EMHASS_SAVINGS_MONTHLY: "__emhass_savings_monthly__",
    CONF_EMHASS_NET_COST_TODAY: "__emhass_net_cost_today__",
    CONF_EMHASS_NET_COST_MONTH: "__emhass_net_cost_month__",
    CONF_EMHASS_PROJECTED_BILL: "__emhass_projected_bill__",
    CONF_EMHASS_PROJECTED_SAVINGS: "__emhass_projected_savings__",
    CONF_EMHASS_BATTERY_SUMMARY: "__emhass_battery_summary__",
    CONF_EMHASS_LAST_DECISION: "__emhass_last_decision__",
    CONF_EMHASS_IMPORT_COST_DAILY: "__emhass_import_cost_daily__",
    CONF_EMHASS_EXPORT_EARNINGS_DAILY: "__emhass_export_earnings_daily__",
    CONF_EMHASS_MPC_AUTOMATION: "__emhass_mpc_automation__",
    CONF_EMHASS_BATTERY_AUTOMATION: "__emhass_battery_automation__",
    CONF_MPC_BATTERY: "__mpc_battery__",
    CONF_MPC_GRID: "__mpc_grid__",
    CONF_MPC_PV: "__mpc_pv__",
    CONF_MPC_BATTERY_SOC: "__mpc_battery_soc__",
    CONF_MPC_LOAD: "__mpc_load_power__",
    CONF_MPC_DEFERRABLE0: "__mpc_deferrable0__",
    CONF_MPC_DEFERRABLE1: "__mpc_deferrable1__",
    CONF_MPC_OPTIM_STATUS: "__mpc_optim_status__",
    CONF_MPC_COST_FUN: "__mpc_cost_fun__",
    CONF_BUY_PRICE: "__buy_price__",
    CONF_SELL_PRICE: "__sell_price__",
    CONF_NORDPOOL: "__nordpool__",
    CONF_CURRENT_IMPORT_COST: "__current_import_cost__",
    CONF_CURRENT_EXPORT_RATE: "__current_export_rate__",
    CONF_SOLCAST_TODAY: "__solcast_today__",
    CONF_SOLCAST_TOMORROW: "__solcast_tomorrow__",
    CONF_SOLCAST_REMAINING: "__solcast_remaining__",
    CONF_BATTERY_PACK1_SOC: "__battery_pack1_soc__",
    CONF_BATTERY_PACK2_SOC: "__battery_pack2_soc__",
    CONF_BATTERY_PACK3_SOC: "__battery_pack3_soc__",
    CONF_BATTERY_TEMP: "__battery_temp__",
    CONF_BATTERY_VOLTAGE: "__battery_voltage__",
    CONF_BATTERY_CURRENT: "__battery_current__",
    CONF_INVERTER_TEMP: "__inverter_temp__",
    CONF_INVERTER_RATED_POWER: "__inverter_rated_power__",
    CONF_INVERTER_OUTPUT_POWER: "__inverter_output_power__",
    CONF_DC_TRANSFORMER_TEMP: "__dc_transformer_temp__",
    CONF_PV1_POWER: "__pv1_power__",
    CONF_PV2_POWER: "__pv2_power__",
    CONF_GRID_VOLTAGE: "__grid_voltage__",
    CONF_GRID_FREQUENCY: "__grid_frequency__",
    CONF_GRID_CT_CLAMP: "__grid_ct_clamp__",
    CONF_EV_CHARGER_POWER: "__ev_charger_power__",
    CONF_EV_CHARGER_STATE: "__ev_charger_state__",
    CONF_HEAT_PUMP_POWER: "__heat_pump_power__",
}

# ---------------------------------------------------------------------------
# Sigenergy defaults (inverter-specific entities)
# ---------------------------------------------------------------------------
SIGENERGY_DEFAULTS = {
    CONF_SOLAR_POWER: "sensor.sigen_plant_pv_power",
    CONF_LOAD_POWER: "sensor.sigen_plant_total_load_power",
    CONF_BATTERY_POWER: "sensor.sigen_plant_battery_power",
    CONF_BATTERY_SOC: "sensor.sigen_plant_battery_state_of_charge",
    CONF_GRID_POWER: "sensor.sigen_plant_grid_active_power",
    CONF_SOLAR_ENERGY_TODAY: "sensor.sigen_plant_daily_pv_energy",
    CONF_LOAD_ENERGY_TODAY: "sensor.sigen_plant_daily_load_consumption",
    CONF_BATTERY_CHARGE_TODAY: "sensor.sigen_plant_daily_battery_charge_energy",
    CONF_BATTERY_DISCHARGE_TODAY: "sensor.sigen_plant_daily_battery_discharge_energy",
    CONF_GRID_IMPORT_TODAY: "sensor.sigen_plant_daily_grid_import_energy",
    CONF_GRID_EXPORT_TODAY: "sensor.sigen_plant_daily_grid_export_energy",
    CONF_WEATHER: "weather.forecast_home",
    CONF_BATTERY_PACK1_SOC: "sensor.sigen_inverter_battery_state_of_charge",
    CONF_INVERTER_TEMP: "sensor.sigen_inverter_pcs_internal_temperature",
    CONF_BATTERY_TEMP: "sensor.sigen_inverter_battery_average_cell_temperature",
    # Inverter details
    CONF_INVERTER_OUTPUT_POWER: "sensor.sigen_active_power",
    CONF_INVERTER_RATED_POWER: "sensor.sigen_rated_active_power",
    CONF_DC_TRANSFORMER_TEMP: "sensor.sigen_inverter_temperature",
    # PV string power (template sensors from modbus yaml)
    CONF_PV1_POWER: "sensor.sigen_pv1_power",
    CONF_PV2_POWER: "sensor.sigen_pv2_power",
    # Grid details
    CONF_GRID_VOLTAGE: "sensor.sigen_phase_a_voltage",
    CONF_GRID_FREQUENCY: "sensor.sigen_grid_frequency",
    # Battery details
    CONF_BATTERY_VOLTAGE: "sensor.sigen_ess_average_cell_voltage",
    CONF_BATTERY_CURRENT: "",
}

# ---------------------------------------------------------------------------
# EMHASS defaults (standard entity names from EMHASS add-on)
# ---------------------------------------------------------------------------
EMHASS_DEFAULTS = {
    CONF_EMHASS_MODE: "sensor.emhass_current_mode",
    CONF_EMHASS_REASON: "sensor.emhass_decision_reason",
    CONF_EMHASS_SAVINGS_TODAY: "sensor.emhass_savings_today",
    CONF_EMHASS_SAVINGS_MONTHLY: "sensor.emhass_savings_monthly",
    CONF_EMHASS_NET_COST_TODAY: "sensor.emhass_net_cost_today",
    CONF_EMHASS_NET_COST_MONTH: "sensor.emhass_net_cost_this_month",
    CONF_EMHASS_PROJECTED_BILL: "sensor.emhass_projected_monthly_bill",
    CONF_EMHASS_PROJECTED_SAVINGS: "sensor.emhass_projected_monthly_savings",
    CONF_EMHASS_BATTERY_SUMMARY: "sensor.emhass_battery_action_summary",
    CONF_EMHASS_LAST_DECISION: "sensor.emhass_last_decision",
    CONF_EMHASS_IMPORT_COST_DAILY: "sensor.emhass_import_cost_daily",
    CONF_EMHASS_EXPORT_EARNINGS_DAILY: "sensor.emhass_export_earnings_daily",
    CONF_EMHASS_MPC_AUTOMATION: "automation.emhass_run_mpc_optimizer",
    CONF_EMHASS_BATTERY_AUTOMATION: "automation.emhass_battery_control",
    CONF_MPC_BATTERY: "sensor.mpc_batt_power",
    CONF_MPC_GRID: "sensor.mpc_grid_power",
    CONF_MPC_PV: "sensor.mpc_pv_power",
    CONF_MPC_BATTERY_SOC: "sensor.mpc_batt_soc",
    CONF_MPC_LOAD: "sensor.mpc_load_power",
    CONF_MPC_DEFERRABLE0: "sensor.mpc_deferrable0",
    CONF_MPC_DEFERRABLE1: "sensor.mpc_deferrable1",
    CONF_MPC_OPTIM_STATUS: "sensor.mpc_optim_status",
    CONF_MPC_COST_FUN: "sensor.mpc_cost_fun",
    CONF_BUY_PRICE: "sensor.mpc_general_price",
    CONF_SELL_PRICE: "sensor.mpc_feed_in_price",
    CONF_CURRENT_IMPORT_COST: "sensor.current_import_cost",
    CONF_CURRENT_EXPORT_RATE: "sensor.current_export_earnings_rate",
}

# ---------------------------------------------------------------------------
# Solcast defaults (standard entity names from Solcast integration)
# ---------------------------------------------------------------------------
SOLCAST_DEFAULTS = {
    CONF_SOLCAST_TODAY: "sensor.solcast_pv_forecast_forecast_today",
    CONF_SOLCAST_TOMORROW: "sensor.solcast_pv_forecast_forecast_tomorrow",
    CONF_SOLCAST_REMAINING: "sensor.solcast_pv_forecast_forecast_remaining_today",
}
