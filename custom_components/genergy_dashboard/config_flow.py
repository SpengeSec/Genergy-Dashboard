"""Config flow for Genergy Dashboard integration."""
from __future__ import annotations

import logging
from typing import Any

import voluptuous as vol

from homeassistant import config_entries
from homeassistant.core import callback
from homeassistant.helpers.selector import (
    EntitySelector,
    EntitySelectorConfig,
    BooleanSelector,
    NumberSelector,
    NumberSelectorConfig,
    NumberSelectorMode,
)

from .const import (
    DOMAIN,
    SIGENERGY_DEFAULTS,
    EMHASS_DEFAULTS,
    SOLCAST_DEFAULTS,
    CONF_USE_SIGENERGY_DEFAULTS,
    CONF_SOLAR_POWER,
    CONF_LOAD_POWER,
    CONF_BATTERY_POWER,
    CONF_BATTERY_SOC,
    CONF_GRID_POWER,
    CONF_SOLAR_ENERGY_TODAY,
    CONF_LOAD_ENERGY_TODAY,
    CONF_BATTERY_CHARGE_TODAY,
    CONF_BATTERY_DISCHARGE_TODAY,
    CONF_GRID_IMPORT_TODAY,
    CONF_GRID_EXPORT_TODAY,
    CONF_WEATHER,
    CONF_EMHASS_MODE,
    CONF_EMHASS_REASON,
    CONF_BUY_PRICE,
    CONF_SELL_PRICE,
    CONF_NORDPOOL,
    CONF_BATTERY_PACK1_SOC,
    CONF_BATTERY_PACK2_SOC,
    CONF_BATTERY_PACK3_SOC,
    CONF_INVERTER_TEMP,
    CONF_BATTERY_TEMP,
    CONF_GRID_VOLTAGE,
    CONF_GRID_FREQUENCY,
    CONF_EV_CHARGER_POWER,
    CONF_EV_CHARGER_STATE,
    CONF_HEAT_PUMP_POWER,
    CONF_FEATURE_EV,
    CONF_FEATURE_HEAT_PUMP,
    CONF_FEATURE_EMHASS,
    CONF_FEATURE_SOLCAST,
    CONF_BATTERY_PACKS,
    CONF_INVERTER_RATED_POWER,
    CONF_PV1_POWER,
    CONF_PV2_POWER,
    CONF_GRID_CT_CLAMP,
    CONF_BATTERY_VOLTAGE,
    CONF_BATTERY_CURRENT,
    CONF_INVERTER_OUTPUT_POWER,
    CONF_DC_TRANSFORMER_TEMP,
)

_LOGGER = logging.getLogger(__name__)

_SENSOR_SELECTOR = EntitySelector(EntitySelectorConfig(domain="sensor"))
_WEATHER_SELECTOR = EntitySelector(EntitySelectorConfig(domain="weather"))
_AUTOMATION_SELECTOR = EntitySelector(EntitySelectorConfig(domain="automation"))


def _optional_entity(key: str, defaults: dict | None = None) -> vol.Optional:
    """Create an Optional key with suggested_value if a default exists."""
    d = defaults or {}
    val = d.get(key)
    if val:
        return vol.Optional(key, description={"suggested_value": val})
    return vol.Optional(key)


def _core_schema(defaults: dict[str, Any] | None = None) -> vol.Schema:
    return vol.Schema(
        {
            _optional_entity(CONF_SOLAR_POWER, defaults): _SENSOR_SELECTOR,
            _optional_entity(CONF_LOAD_POWER, defaults): _SENSOR_SELECTOR,
            _optional_entity(CONF_BATTERY_POWER, defaults): _SENSOR_SELECTOR,
            _optional_entity(CONF_BATTERY_SOC, defaults): _SENSOR_SELECTOR,
            _optional_entity(CONF_GRID_POWER, defaults): _SENSOR_SELECTOR,
        }
    )


def _energy_schema(defaults: dict[str, Any] | None = None) -> vol.Schema:
    return vol.Schema(
        {
            _optional_entity(CONF_SOLAR_ENERGY_TODAY, defaults): _SENSOR_SELECTOR,
            _optional_entity(CONF_LOAD_ENERGY_TODAY, defaults): _SENSOR_SELECTOR,
            _optional_entity(CONF_BATTERY_CHARGE_TODAY, defaults): _SENSOR_SELECTOR,
            _optional_entity(CONF_BATTERY_DISCHARGE_TODAY, defaults): _SENSOR_SELECTOR,
            _optional_entity(CONF_GRID_IMPORT_TODAY, defaults): _SENSOR_SELECTOR,
            _optional_entity(CONF_GRID_EXPORT_TODAY, defaults): _SENSOR_SELECTOR,
        }
    )


def _extras_schema(defaults: dict[str, Any] | None = None) -> vol.Schema:
    d = defaults or {}
    return vol.Schema(
        {
            _optional_entity(CONF_WEATHER, defaults): _WEATHER_SELECTOR,
            _optional_entity(CONF_INVERTER_TEMP, defaults): _SENSOR_SELECTOR,
            _optional_entity(CONF_BATTERY_TEMP, defaults): _SENSOR_SELECTOR,
            _optional_entity(CONF_BATTERY_PACK1_SOC, defaults): _SENSOR_SELECTOR,
            _optional_entity(CONF_BATTERY_PACK2_SOC, defaults): _SENSOR_SELECTOR,
            _optional_entity(CONF_BATTERY_PACK3_SOC, defaults): _SENSOR_SELECTOR,
            _optional_entity(CONF_INVERTER_RATED_POWER, defaults): _SENSOR_SELECTOR,
            _optional_entity(CONF_PV1_POWER, defaults): _SENSOR_SELECTOR,
            _optional_entity(CONF_PV2_POWER, defaults): _SENSOR_SELECTOR,
            _optional_entity(CONF_GRID_VOLTAGE, defaults): _SENSOR_SELECTOR,
            _optional_entity(CONF_GRID_FREQUENCY, defaults): _SENSOR_SELECTOR,
            _optional_entity(CONF_GRID_CT_CLAMP, defaults): _SENSOR_SELECTOR,
            _optional_entity(CONF_BATTERY_VOLTAGE, defaults): _SENSOR_SELECTOR,
            _optional_entity(CONF_BATTERY_CURRENT, defaults): _SENSOR_SELECTOR,
            _optional_entity(CONF_INVERTER_OUTPUT_POWER, defaults): _SENSOR_SELECTOR,
            _optional_entity(CONF_DC_TRANSFORMER_TEMP, defaults): _SENSOR_SELECTOR,
            _optional_entity(CONF_EV_CHARGER_POWER, defaults): _SENSOR_SELECTOR,
            _optional_entity(CONF_EV_CHARGER_STATE, defaults): _SENSOR_SELECTOR,
            _optional_entity(CONF_HEAT_PUMP_POWER, defaults): _SENSOR_SELECTOR,
            vol.Optional(
                CONF_FEATURE_EV,
                default=d.get(CONF_FEATURE_EV, False),
            ): BooleanSelector(),
            vol.Optional(
                CONF_FEATURE_HEAT_PUMP,
                default=d.get(CONF_FEATURE_HEAT_PUMP, False),
            ): BooleanSelector(),
            vol.Optional(
                CONF_FEATURE_EMHASS,
                default=d.get(CONF_FEATURE_EMHASS, False),
            ): BooleanSelector(),
            vol.Optional(
                CONF_FEATURE_SOLCAST,
                default=d.get(CONF_FEATURE_SOLCAST, False),
            ): BooleanSelector(),
            vol.Optional(
                CONF_BATTERY_PACKS,
                default=d.get(CONF_BATTERY_PACKS, 1),
            ): NumberSelector(
                NumberSelectorConfig(min=0, max=6, step=1, mode=NumberSelectorMode.BOX)
            ),
        }
    )


def _merge_feature_defaults(data: dict[str, Any]) -> dict[str, Any]:
    """Merge EMHASS/Solcast default entity names when features are enabled.

    Only sets keys that are not already configured by the user.
    """
    if data.get(CONF_FEATURE_EMHASS):
        for key, val in EMHASS_DEFAULTS.items():
            data.setdefault(key, val)
    if data.get(CONF_FEATURE_SOLCAST):
        for key, val in SOLCAST_DEFAULTS.items():
            data.setdefault(key, val)
    return data


class GenergyDashboardConfigFlow(
    config_entries.ConfigFlow, domain=DOMAIN
):
    """Handle a config flow for Genergy Dashboard."""

    VERSION = 1

    def __init__(self) -> None:
        self._data: dict[str, Any] = {}

    async def async_step_user(
        self, user_input: dict[str, Any] | None = None
    ) -> config_entries.ConfigFlowResult:
        """Handle the initial step — preset toggle."""
        if user_input is not None:
            if user_input.get(CONF_USE_SIGENERGY_DEFAULTS):
                self._data = dict(SIGENERGY_DEFAULTS)
                self._data[CONF_USE_SIGENERGY_DEFAULTS] = True
                self._data[CONF_FEATURE_EV] = False
                self._data[CONF_FEATURE_HEAT_PUMP] = False
                self._data[CONF_FEATURE_EMHASS] = False
                self._data[CONF_FEATURE_SOLCAST] = False
                self._data[CONF_BATTERY_PACKS] = 1
                return self.async_create_entry(
                    title="Sigenergy Dashboard",
                    data=self._data,
                )
            return await self.async_step_core()

        return self.async_show_form(
            step_id="user",
            data_schema=vol.Schema(
                {
                    vol.Optional(
                        CONF_USE_SIGENERGY_DEFAULTS, default=False
                    ): BooleanSelector(),
                }
            ),
        )

    async def async_step_core(
        self, user_input: dict[str, Any] | None = None
    ) -> config_entries.ConfigFlowResult:
        if user_input is not None:
            self._data.update(user_input)
            return await self.async_step_energy()
        return self.async_show_form(
            step_id="core",
            data_schema=_core_schema(),
        )

    async def async_step_energy(
        self, user_input: dict[str, Any] | None = None
    ) -> config_entries.ConfigFlowResult:
        if user_input is not None:
            self._data.update(user_input)
            return await self.async_step_extras()
        return self.async_show_form(
            step_id="energy",
            data_schema=_energy_schema(),
        )

    async def async_step_extras(
        self, user_input: dict[str, Any] | None = None
    ) -> config_entries.ConfigFlowResult:
        if user_input is not None:
            self._data.update(user_input)
            # Merge EMHASS/Solcast defaults based on feature toggles
            _merge_feature_defaults(self._data)
            return self.async_create_entry(
                title="Sigenergy Dashboard",
                data=self._data,
            )
        return self.async_show_form(
            step_id="extras",
            data_schema=_extras_schema(),
        )

    @staticmethod
    @callback
    def async_get_options_flow(
        config_entry: config_entries.ConfigEntry,
    ) -> GenergyDashboardOptionsFlow:
        return GenergyDashboardOptionsFlow(config_entry)


class GenergyDashboardOptionsFlow(config_entries.OptionsFlow):
    """Handle options flow for Genergy Dashboard."""

    def __init__(self, config_entry: config_entries.ConfigEntry) -> None:
        self._config_entry = config_entry
        self._data: dict[str, Any] = {}

    async def async_step_init(
        self, user_input: dict[str, Any] | None = None
    ) -> config_entries.ConfigFlowResult:
        current = {**self._config_entry.data, **self._config_entry.options}
        if user_input is not None:
            self._data.update(user_input)
            return await self.async_step_energy()
        return self.async_show_form(
            step_id="init",
            data_schema=_core_schema(current),
        )

    async def async_step_energy(
        self, user_input: dict[str, Any] | None = None
    ) -> config_entries.ConfigFlowResult:
        current = {**self._config_entry.data, **self._config_entry.options}
        if user_input is not None:
            self._data.update(user_input)
            return await self.async_step_extras()
        return self.async_show_form(
            step_id="energy",
            data_schema=_energy_schema(current),
        )

    async def async_step_extras(
        self, user_input: dict[str, Any] | None = None
    ) -> config_entries.ConfigFlowResult:
        if user_input is not None:
            self._data.update(user_input)
            _merge_feature_defaults(self._data)
            return self.async_create_entry(
                title="Sigenergy Dashboard",
                data=self._data,
            )
        current = {**self._config_entry.data, **self._config_entry.options}
        return self.async_show_form(
            step_id="extras",
            data_schema=_extras_schema(current),
        )
