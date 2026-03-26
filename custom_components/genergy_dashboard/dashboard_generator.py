"""Generate Lovelace dashboard configuration for Genergy Dashboard.

The dashboard layout is stored as a JSON template (default_dashboard.json)
with __placeholder__ strings instead of real entity IDs.  At runtime the
generator loads the template, substitutes placeholders with the entity IDs
from the user's config entry, and strips cards that reference unconfigured
entities.
"""
from __future__ import annotations

import copy
import json
import re
from pathlib import Path
from typing import Any

from .const import PLACEHOLDER_MAP

_TEMPLATE: dict | None = None
_PLACEHOLDER_RE = re.compile(r"__[a-z0-9_]+__")


def _load_template() -> dict:
    """Load and cache the dashboard template JSON."""
    global _TEMPLATE
    if _TEMPLATE is None:
        tpl_path = Path(__file__).parent / "default_dashboard.json"
        with open(tpl_path, encoding="utf-8") as fh:
            _TEMPLATE = json.load(fh)
    return _TEMPLATE


def _build_substitution_map(config: dict[str, Any]) -> dict[str, str]:
    """Build a mapping from placeholder strings to configured entity IDs."""
    subs: dict[str, str] = {}
    for conf_key, placeholder in PLACEHOLDER_MAP.items():
        entity_id = config.get(conf_key) or ""
        subs[placeholder] = entity_id
    return subs


def _substitute(obj: Any, subs: dict[str, str]) -> Any:
    """Recursively replace placeholder strings in the template."""
    if isinstance(obj, str):
        result = obj
        for placeholder, entity_id in subs.items():
            result = result.replace(placeholder, entity_id)
        return result
    if isinstance(obj, dict):
        return {k: _substitute(v, subs) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_substitute(v, subs) for v in obj]
    return obj


def _has_unresolved(obj: Any) -> bool:
    """Check if any __placeholder__ strings remain (entity not configured)."""
    if isinstance(obj, str):
        return bool(_PLACEHOLDER_RE.search(obj))
    if isinstance(obj, dict):
        return any(_has_unresolved(v) for v in obj.values())
    if isinstance(obj, list):
        return any(_has_unresolved(v) for v in obj)
    return False


def _strip_unconfigured(obj: Any) -> Any:
    """Remove cards/entities that still contain unresolved placeholders.

    - In lists: drop items that have unresolved placeholders
    - In dicts with a ``cards`` key: filter out unconfigured cards
    - ``conditional`` cards: drop if the condition entity is unresolved
    - ``entity`` / ``entity_id`` values: drop the containing dict if empty
    - Cards without ``entity`` key but with unresolved placeholders in
      template fields (primary, secondary, icon, icon_color) are also dropped.
      This prevents mushroom-template-card "Configuration error" when Jinja
      templates reference unconfigured entities like ``states('__emhass_mode__')``.
    """
    if isinstance(obj, dict):
        # Conditional card: check if condition entity is configured
        if obj.get("type") == "conditional":
            conditions = obj.get("conditions", [])
            if any(_has_unresolved(c.get("entity", "")) for c in conditions):
                return None

        # Entity/entity_id that resolved to empty string → skip
        for key in ("entity", "entity_id"):
            val = obj.get(key)
            if isinstance(val, str) and (not val or _PLACEHOLDER_RE.search(val)):
                return None

        # FIX(bug1-2): Cards without entity key but with unresolved placeholders
        # in Jinja template fields — these cause "Configuration error" in HA.
        _TEMPLATE_FIELDS = ("primary", "secondary", "icon", "icon_color",
                            "badge_icon", "badge_color", "content", "name")
        if obj.get("type"):
            for field in _TEMPLATE_FIELDS:
                val = obj.get(field)
                if isinstance(val, str) and _PLACEHOLDER_RE.search(val):
                    return None

        result = {}
        for k, v in obj.items():
            if k == "cards" and isinstance(v, list):
                cleaned = [_strip_unconfigured(item) for item in v]
                cleaned = [c for c in cleaned if c is not None]
                result[k] = cleaned
            elif k == "entities" and isinstance(v, list):
                cleaned = [_strip_unconfigured(item) for item in v]
                cleaned = [c for c in cleaned if c is not None]
                result[k] = cleaned
            elif k == "chips" and isinstance(v, list):
                cleaned = [_strip_unconfigured(item) for item in v]
                cleaned = [c for c in cleaned if c is not None]
                result[k] = cleaned
            elif k == "sections" and isinstance(v, list):
                # Sankey chart sections
                cleaned_sections = []
                for section in v:
                    if isinstance(section, dict) and "entities" in section:
                        ents = [_strip_unconfigured(e) for e in section["entities"]]
                        ents = [e for e in ents if e is not None]
                        if ents:
                            sec_copy = dict(section)
                            sec_copy["entities"] = ents
                            # Also clean children references
                            for ent in sec_copy["entities"]:
                                if isinstance(ent, dict) and "children" in ent:
                                    ent["children"] = [
                                        c for c in ent["children"]
                                        if c and not _PLACEHOLDER_RE.search(c)
                                    ]
                            cleaned_sections.append(sec_copy)
                    else:
                        cleaned_sections.append(_strip_unconfigured(section))
                result[k] = cleaned_sections
            elif k == "series" and isinstance(v, list):
                # ApexCharts series
                cleaned = [_strip_unconfigured(item) for item in v]
                cleaned = [c for c in cleaned if c is not None]
                result[k] = cleaned
            else:
                result[k] = _strip_unconfigured(v)
        return result

    if isinstance(obj, list):
        cleaned = [_strip_unconfigured(item) for item in obj]
        return [c for c in cleaned if c is not None]

    return obj


def _remove_empty_containers(obj: Any) -> Any:
    """Remove vertical-stack / layout-card containers with 0 cards."""
    if isinstance(obj, dict):
        # Recursively clean first
        result = {k: _remove_empty_containers(v) for k, v in obj.items()}
        # Remove containers with no cards
        if result.get("type") in (
            "vertical-stack", "horizontal-stack",
            "custom:layout-card", "grid",
            "custom:mushroom-chips-card",
        ):
            cards = result.get("cards", result.get("chips", []))
            if isinstance(cards, list) and len(cards) == 0:
                return None
        return result
    if isinstance(obj, list):
        cleaned = [_remove_empty_containers(item) for item in obj]
        return [c for c in cleaned if c is not None]
    return obj


def _apply_feature_toggles(dashboard: dict, config: dict[str, Any]) -> dict:
    """Apply feature toggle overrides to the house card and clean up
    unresolved entity placeholders in nested config dicts.

    The template has features hardcoded to True. This function overrides
    them with the user's actual selections (e.g. feature_ev: False).
    It also replaces any remaining __placeholder__ strings in entity
    value positions with empty strings so custom cards don't try to
    look up literal placeholder text as HA entity IDs.
    """
    from .const import (
        CONF_FEATURE_EV, CONF_FEATURE_HEAT_PUMP, CONF_BATTERY_PACKS,
        CONF_FEATURE_THREE_PHASE, CONF_GRID_VOLTAGE_L2, CONF_GRID_VOLTAGE_L3,
        CONF_FEATURE_DUAL_TARIFF,
        CONF_GRID_IMPORT_HIGH_TARIFF, CONF_GRID_IMPORT_LOW_TARIFF,
        CONF_GRID_EXPORT_HIGH_TARIFF, CONF_GRID_EXPORT_LOW_TARIFF,
    )

    ev_enabled = config.get(CONF_FEATURE_EV, False)
    hp_enabled = config.get(CONF_FEATURE_HEAT_PUMP, False)
    battery_packs = config.get(CONF_BATTERY_PACKS, 1)
    three_phase = config.get(CONF_FEATURE_THREE_PHASE, False)
    dual_tariff = config.get(CONF_FEATURE_DUAL_TARIFF, False)

    def _patch(obj: Any) -> Any:
        if isinstance(obj, dict):
            # Patch house card features
            if obj.get("type") == "custom:sigenergy-house-card":
                features = obj.get("features", {})
                features["ev_charger"] = ev_enabled
                features["ev_vehicle"] = ev_enabled
                features["heat_pump"] = hp_enabled
                obj["features"] = features

            # Patch device card battery packs
            if obj.get("type") == "custom:sigenergy-device-card":
                obj["battery_packs"] = battery_packs

            # Inject 3-phase and dual-tariff config into _sigenergy_config
            if "_sigenergy_config" in obj:
                sc = obj["_sigenergy_config"]
                entities = sc.get("entities", {})

                # 3-phase voltage: add L2/L3 entity references
                if three_phase:
                    entities["grid_voltage_l2"] = config.get(CONF_GRID_VOLTAGE_L2, "")
                    entities["grid_voltage_l3"] = config.get(CONF_GRID_VOLTAGE_L3, "")
                    sc.setdefault("features", {})["three_phase"] = True
                else:
                    sc.setdefault("features", {})["three_phase"] = False

                # Dual tariff: add individual tariff entity references
                if dual_tariff:
                    entities["grid_import_high_tariff"] = config.get(
                        CONF_GRID_IMPORT_HIGH_TARIFF, ""
                    )
                    entities["grid_import_low_tariff"] = config.get(
                        CONF_GRID_IMPORT_LOW_TARIFF, ""
                    )
                    entities["grid_export_high_tariff"] = config.get(
                        CONF_GRID_EXPORT_HIGH_TARIFF, ""
                    )
                    entities["grid_export_low_tariff"] = config.get(
                        CONF_GRID_EXPORT_LOW_TARIFF, ""
                    )
                    sc.setdefault("features", {})["dual_tariff"] = True
                else:
                    sc.setdefault("features", {})["dual_tariff"] = False

                sc["entities"] = entities

            # Clean unresolved placeholders in entity value dicts
            if "entities" in obj and isinstance(obj["entities"], dict):
                for k, v in obj["entities"].items():
                    if isinstance(v, str) and _PLACEHOLDER_RE.search(v):
                        obj["entities"][k] = ""

            for k, v in obj.items():
                obj[k] = _patch(v)
            return obj
        if isinstance(obj, list):
            return [_patch(item) for item in obj]
        return obj

    return _patch(dashboard)


def generate_dashboard(config: dict[str, Any]) -> dict:
    """Generate a complete Lovelace dashboard config from entity configuration.

    Returns a dict suitable for storing via LovelaceStorage.async_save().
    """
    from .const import (
        CONF_FEATURE_DUAL_TARIFF,
        CONF_GRID_IMPORT_HIGH_TARIFF,
        CONF_GRID_IMPORT_LOW_TARIFF,
        CONF_GRID_EXPORT_HIGH_TARIFF,
        CONF_GRID_EXPORT_LOW_TARIFF,
        CONF_GRID_IMPORT_TODAY,
        CONF_GRID_EXPORT_TODAY,
        CONF_FEATURE_THREE_PHASE,
        CONF_GRID_VOLTAGE_L2,
        CONF_GRID_VOLTAGE_L3,
    )

    # Pre-process: auto-wire dual-tariff computed sensors
    config = dict(config)  # don't mutate the original
    if config.get(CONF_FEATURE_DUAL_TARIFF):
        import_high = config.get(CONF_GRID_IMPORT_HIGH_TARIFF, "")
        import_low = config.get(CONF_GRID_IMPORT_LOW_TARIFF, "")
        export_high = config.get(CONF_GRID_EXPORT_HIGH_TARIFF, "")
        export_low = config.get(CONF_GRID_EXPORT_LOW_TARIFF, "")

        # If user hasn't set a single grid_import_today entity but has tariff
        # entities, point to the computed sensor
        if not config.get(CONF_GRID_IMPORT_TODAY) and import_high and import_low:
            config[CONF_GRID_IMPORT_TODAY] = "sensor.genergy_grid_import_total"
        if not config.get(CONF_GRID_EXPORT_TODAY) and export_high and export_low:
            config[CONF_GRID_EXPORT_TODAY] = "sensor.genergy_grid_export_total"

    template = _load_template()
    dashboard = copy.deepcopy(template)

    # Step 1: substitute placeholders with real entity IDs
    subs = _build_substitution_map(config)
    dashboard = _substitute(dashboard, subs)

    # Step 2: apply feature toggles and clean nested entity placeholders
    dashboard = _apply_feature_toggles(dashboard, config)

    # Step 3: strip cards that reference unconfigured entities
    dashboard = _strip_unconfigured(dashboard)

    # Step 4: remove empty containers
    dashboard = _remove_empty_containers(dashboard)

    return dashboard
