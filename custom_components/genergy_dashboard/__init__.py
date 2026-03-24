"""Genergy Dashboard integration for Home Assistant."""
from __future__ import annotations

import logging
import shutil
from pathlib import Path

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.components.frontend import add_extra_js_url
from homeassistant.components.http import StaticPathConfig

from .const import DOMAIN, DASHBOARD_URL_PATH, DASHBOARD_TITLE
from .dashboard_generator import generate_dashboard

_LOGGER = logging.getLogger(__name__)


async def async_setup(hass: HomeAssistant, config: dict) -> bool:
    """Set up the Genergy Dashboard component."""
    hass.data.setdefault(DOMAIN, {})
    return True


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up Genergy Dashboard from a config entry."""
    hass.data.setdefault(DOMAIN, {})
    hass.data[DOMAIN][entry.entry_id] = entry.data

    # Register static paths for bundled JS cards
    frontend_dir = Path(__file__).parent / "frontend"
    if frontend_dir.exists():
        await hass.http.async_register_static_paths(
            [
                StaticPathConfig(
                    f"/{DOMAIN}/frontend",
                    str(frontend_dir),
                    cache_headers=True,
                )
            ]
        )
        # Register JS resources so custom cards load in the browser
        add_extra_js_url(hass, f"/{DOMAIN}/frontend/genergy-dashboard.js")
        add_extra_js_url(hass, f"/{DOMAIN}/frontend/sigenergy-dashboard.js")
        add_extra_js_url(hass, f"/{DOMAIN}/frontend/sigenergy-house-card.js")
        _LOGGER.info("Genergy Dashboard: JS resources registered")

    # Install bundled theme
    await hass.async_add_executor_job(_install_theme, hass)

    # Create or update the Lovelace dashboard
    # Run dashboard generation (contains file I/O) off the event loop
    await _create_or_update_dashboard(hass, entry)

    # Listen for options updates
    entry.async_on_unload(entry.add_update_listener(_async_update_listener))

    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload a config entry."""
    hass.data[DOMAIN].pop(entry.entry_id, None)
    return True


async def _async_update_listener(
    hass: HomeAssistant, entry: ConfigEntry
) -> None:
    """Handle options update — regenerate dashboard."""
    await _create_or_update_dashboard(hass, entry)


def _install_theme(hass: HomeAssistant) -> None:
    """Copy bundled sigenergy_dark theme to HA themes directory."""
    theme_src = Path(__file__).parent / "themes" / "sigenergy_dark.yaml"
    if not theme_src.exists():
        return
    themes_dir = Path(hass.config.config_dir) / "themes"
    themes_dir.mkdir(exist_ok=True)
    dest = themes_dir / "sigenergy_dark.yaml"
    if not dest.exists() or dest.stat().st_size != theme_src.stat().st_size:
        shutil.copy2(theme_src, dest)
        _LOGGER.info("Genergy Dashboard: Installed sigenergy_dark theme")


async def _create_or_update_dashboard(
    hass: HomeAssistant, entry: ConfigEntry
) -> None:
    """Create the Sigenergy Lovelace dashboard if it doesn't exist yet.

    Existing dashboards are never overwritten — users may have manually
    customised their cards, layout, and styles.
    """
    try:
        from homeassistant.components.lovelace import (
            LOVELACE_DATA,
            MODE_STORAGE,
        )
        from homeassistant.components.lovelace.dashboard import (
            DashboardsCollection,
            LovelaceStorage,
        )
        from homeassistant.components import frontend

        lovelace_data = hass.data.get(LOVELACE_DATA)
        if lovelace_data is None:
            _LOGGER.warning("Lovelace not loaded yet, cannot create dashboard")
            return

        dashboards = lovelace_data.dashboards

        # If the dashboard already exists, leave it alone — never overwrite
        # user-customised configs.
        if dashboards.get(DASHBOARD_URL_PATH) is not None:
            _LOGGER.debug(
                "Genergy Dashboard: dashboard '%s' already exists, skipping",
                DASHBOARD_URL_PATH,
            )
            return

        # Dashboard doesn't exist — create it via DashboardsCollection
        # (writes to lovelace_dashboards storage for persistence across
        # restarts)
        dashboards_col = DashboardsCollection(hass)
        await dashboards_col.async_load()

        dashboard_item = {
            "allow_single_word": True,
            "icon": "mdi:solar-power-variant",
            "title": DASHBOARD_TITLE,
            "url_path": DASHBOARD_URL_PATH,
            "require_admin": False,
            "show_in_sidebar": True,
        }

        exists_in_col = any(
            item.get("url_path") == DASHBOARD_URL_PATH
            for item in dashboards_col.data.values()
        )
        if not exists_in_col:
            await dashboards_col.async_create_item(dashboard_item)
            _LOGGER.info(
                "Genergy Dashboard: Created dashboard '%s'",
                DASHBOARD_URL_PATH,
            )

        # Find the created item (DashboardsCollection assigns an 'id')
        created_item = None
        for item in dashboards_col.data.values():
            if item.get("url_path") == DASHBOARD_URL_PATH:
                created_item = dict(item)
                break

        if created_item is None:
            _LOGGER.error("Genergy Dashboard: Created item not found in collection")
            return

        # Register the dashboard as a LovelaceStorage object and panel
        # in HA's runtime so it's immediately accessible without a restart.
        # The lovelace component's own DashboardsCollection listener only
        # fires for the instance it created during async_setup.
        if dashboards.get(DASHBOARD_URL_PATH) is None:
            dashboard_obj = LovelaceStorage(hass, created_item)
            dashboard_obj.config = created_item
            dashboards[DASHBOARD_URL_PATH] = dashboard_obj

            frontend.async_register_built_in_panel(
                hass,
                "lovelace",
                frontend_url_path=DASHBOARD_URL_PATH,
                require_admin=False,
                config={"mode": MODE_STORAGE},
                update=False,
                sidebar_title=DASHBOARD_TITLE,
                sidebar_icon="mdi:solar-power-variant",
            )
            _LOGGER.info(
                "Genergy Dashboard: Registered panel '%s'",
                DASHBOARD_URL_PATH,
            )

        # Generate default config for the brand-new dashboard
        # Run generate_dashboard off the event loop (contains file I/O)
        entity_config = dict(entry.data)
        entity_config.update(dict(entry.options))
        dashboard_config = await hass.async_add_executor_job(
            generate_dashboard, entity_config
        )

        # Save using the LovelaceStorage object (uses the correct storage key
        # based on the collection item 'id', not the url_path)
        dashboard_obj = dashboards.get(DASHBOARD_URL_PATH)
        if dashboard_obj is not None and hasattr(dashboard_obj, "async_save"):
            await dashboard_obj.async_save(dashboard_config)
            _LOGGER.info("Genergy Dashboard: Default dashboard config saved")
        else:
            _LOGGER.warning("Genergy Dashboard: Could not save dashboard config")

    except Exception:
        _LOGGER.exception("Genergy Dashboard: Failed to create dashboard")
        try:
            entity_config = dict(entry.data)
            entity_config.update(dict(entry.options))
            dashboard_config = generate_dashboard(entity_config)
            await _send_yaml_notification(hass, dashboard_config)
        except Exception:
            _LOGGER.exception("Genergy Dashboard: Fallback also failed")


async def _send_yaml_notification(
    hass: HomeAssistant, dashboard_config: dict
) -> None:
    """Send a persistent notification with dashboard YAML as fallback."""
    import json

    yaml_content = json.dumps(dashboard_config, indent=2)
    message = (
        "## Genergy Dashboard — Manual Setup Required\n\n"
        "The dashboard could not be created automatically. "
        "Please create a dashboard manually:\n\n"
        "1. Go to **Settings → Dashboards → Add Dashboard**\n"
        "2. Title: `Sigenergy` | URL path: `dashboard-sigenergy`\n"
        "3. Open the dashboard → ⋮ → Edit → Raw Configuration Editor\n"
        "4. Paste the config from the HA log (search for 'genergy_dashboard')\n\n"
        "The dashboard configuration has been logged for reference."
    )
    await hass.services.async_call(
        "persistent_notification",
        "create",
        {
            "notification_id": "genergy_dashboard_setup",
            "title": "Genergy Dashboard Setup",
            "message": message,
        },
    )
    _LOGGER.info(
        "Genergy Dashboard config (for manual setup): %s", yaml_content
    )
