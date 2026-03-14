/**
 * Sigenergy Dashboard — Entity Helpers
 * 
 * Utility functions for reading HA entity states,
 * formatting values, and computing derived metrics.
 */

/**
 * Get entity state value as a number, or fallback.
 */
export function getStateNumber(hass, entityId, fallback = 0) {
  if (!hass || !entityId) return fallback;
  const state = hass.states[entityId];
  if (!state) return fallback;
  const val = parseFloat(state.state);
  return isNaN(val) ? fallback : val;
}

/**
 * Get entity state as string.
 */
export function getStateString(hass, entityId, fallback = 'N/A') {
  if (!hass || !entityId) return fallback;
  const state = hass.states[entityId];
  return state ? state.state : fallback;
}

/**
 * Get entity unit of measurement.
 */
export function getUnit(hass, entityId) {
  if (!hass || !entityId) return '';
  const state = hass.states[entityId];
  return state?.attributes?.unit_of_measurement || '';
}

/**
 * Format power value with auto-scaling.
 * Below threshold: "1234 W", above: "1.23 kW"
 */
export function formatPower(watts, decimals = 1, threshold = 1000) {
  if (watts === null || watts === undefined || isNaN(watts)) return '— W';
  const abs = Math.abs(watts);
  if (abs >= threshold) {
    return `${(watts / 1000).toFixed(decimals)} kW`;
  }
  return `${Math.round(watts)} W`;
}

/**
 * Format energy value (always kWh).
 */
export function formatEnergy(kwh, decimals = 1) {
  if (kwh === null || kwh === undefined || isNaN(kwh)) return '— kWh';
  return `${Number(kwh).toFixed(decimals)} kWh`;
}

/**
 * Format price value.
 */
export function formatPrice(value, currency = '€', decimals = 4) {
  if (value === null || value === undefined || isNaN(value)) return `— ${currency}/kWh`;
  return `${currency}${Number(value).toFixed(decimals)}/kWh`;
}

/**
 * Compute self-sufficiency percentage.
 * Formula: 1 - (gridImport / totalLoad) * 100
 */
export function selfSufficiency(gridImport, totalLoad) {
  if (!totalLoad || totalLoad <= 0) return 0;
  const ss = Math.max(0, Math.min(100, (1 - gridImport / totalLoad) * 100));
  return Math.round(ss);
}

/**
 * Format percentage.
 */
export function formatPercent(value, decimals = 0) {
  if (value === null || value === undefined || isNaN(value)) return '—%';
  return `${Number(value).toFixed(decimals)}%`;
}

/**
 * Get friendly name of an entity.
 */
export function getFriendlyName(hass, entityId) {
  if (!hass || !entityId) return entityId;
  const state = hass.states[entityId];
  return state?.attributes?.friendly_name || entityId;
}

/**
 * Check if entity exists and is available.
 */
export function isEntityAvailable(hass, entityId) {
  if (!hass || !entityId) return false;
  const state = hass.states[entityId];
  return state && state.state !== 'unavailable' && state.state !== 'unknown';
}
