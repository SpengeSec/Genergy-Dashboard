"""Sensor platform for Genergy Dashboard — computed energy sensors.

When dual-tariff mode is enabled, this platform creates template sensors
that sum the high + low tariff entities for grid import and export.
These sensors provide the daily totals the dashboard needs.
"""
from __future__ import annotations

import logging
from typing import Any

from homeassistant.components.sensor import (
    SensorDeviceClass,
    SensorEntity,
    SensorStateClass,
)
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import UnitOfEnergy
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.entity_platform import AddEntitiesCallback
from homeassistant.helpers.event import async_track_state_change_event

from .const import (
    DOMAIN,
    CONF_FEATURE_DUAL_TARIFF,
    CONF_GRID_IMPORT_HIGH_TARIFF,
    CONF_GRID_IMPORT_LOW_TARIFF,
    CONF_GRID_EXPORT_HIGH_TARIFF,
    CONF_GRID_EXPORT_LOW_TARIFF,
)

_LOGGER = logging.getLogger(__name__)


async def async_setup_entry(
    hass: HomeAssistant,
    entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    """Set up Genergy Dashboard sensors from a config entry."""
    config = {**entry.data, **entry.options}

    if not config.get(CONF_FEATURE_DUAL_TARIFF):
        return

    entities: list[SensorEntity] = []

    import_high = config.get(CONF_GRID_IMPORT_HIGH_TARIFF, "")
    import_low = config.get(CONF_GRID_IMPORT_LOW_TARIFF, "")
    export_high = config.get(CONF_GRID_EXPORT_HIGH_TARIFF, "")
    export_low = config.get(CONF_GRID_EXPORT_LOW_TARIFF, "")

    if import_high and import_low:
        entities.append(
            DualTariffSumSensor(
                entry_id=entry.entry_id,
                name="Genergy Grid Import Total",
                unique_id=f"{entry.entry_id}_grid_import_total",
                entity_high=import_high,
                entity_low=import_low,
            )
        )

    if export_high and export_low:
        entities.append(
            DualTariffSumSensor(
                entry_id=entry.entry_id,
                name="Genergy Grid Export Total",
                unique_id=f"{entry.entry_id}_grid_export_total",
                entity_high=export_high,
                entity_low=export_low,
            )
        )

    if entities:
        async_add_entities(entities, update_before_add=True)
        _LOGGER.info(
            "Genergy Dashboard: Created %d dual-tariff sensor(s)", len(entities)
        )


class DualTariffSumSensor(SensorEntity):
    """Sensor that sums two tariff entities (high + low)."""

    _attr_device_class = SensorDeviceClass.ENERGY
    _attr_state_class = SensorStateClass.TOTAL_INCREASING
    _attr_native_unit_of_measurement = UnitOfEnergy.KILO_WATT_HOUR
    _attr_should_poll = False
    _attr_has_entity_name = True

    def __init__(
        self,
        entry_id: str,
        name: str,
        unique_id: str,
        entity_high: str,
        entity_low: str,
    ) -> None:
        self._attr_name = name
        self._attr_unique_id = unique_id
        self._entity_high = entity_high
        self._entity_low = entity_low
        self._entry_id = entry_id

    async def async_added_to_hass(self) -> None:
        """Register state listeners when added to HA."""
        self._update_state()

        self.async_on_remove(
            async_track_state_change_event(
                self.hass,
                [self._entity_high, self._entity_low],
                self._async_state_changed,
            )
        )

    @callback
    def _async_state_changed(self, event) -> None:
        """Handle state change of source entities."""
        self._update_state()
        self.async_write_ha_state()

    @callback
    def _update_state(self) -> None:
        """Compute the sum of high + low tariff values."""
        val_high = self._get_float(self._entity_high)
        val_low = self._get_float(self._entity_low)

        if val_high is None and val_low is None:
            self._attr_native_value = None
            self._attr_available = False
            return

        self._attr_native_value = round(
            (val_high or 0.0) + (val_low or 0.0), 3
        )
        self._attr_available = True

    def _get_float(self, entity_id: str) -> float | None:
        """Get a float value from an entity state."""
        state = self.hass.states.get(entity_id)
        if state is None or state.state in ("unknown", "unavailable"):
            return None
        try:
            return float(state.state)
        except (ValueError, TypeError):
            return None
