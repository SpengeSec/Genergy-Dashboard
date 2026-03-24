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


def generate_dashboard(config: dict[str, Any]) -> dict:
    """Generate a complete Lovelace dashboard config from entity configuration.

    Returns a dict suitable for storing via LovelaceStorage.async_save().
    """
    template = _load_template()
    dashboard = copy.deepcopy(template)

    # Step 1: substitute placeholders with real entity IDs
    subs = _build_substitution_map(config)
    dashboard = _substitute(dashboard, subs)

    # Step 2: strip cards that reference unconfigured entities
    dashboard = _strip_unconfigured(dashboard)

    # Step 3: remove empty containers
    dashboard = _remove_empty_containers(dashboard)

    return dashboard
