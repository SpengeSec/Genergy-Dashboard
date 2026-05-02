"""Genergy Dashboard integration for Home Assistant."""
from __future__ import annotations

import hashlib
import logging
import shutil
import time
from pathlib import Path

from aiohttp import web

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.components.frontend import add_extra_js_url
from homeassistant.components.http import HomeAssistantView

from .const import DOMAIN, DASHBOARD_URL_PATH, DASHBOARD_TITLE
from .dashboard_generator import generate_dashboard

_LOGGER = logging.getLogger(__name__)

# Required HACS frontend cards: (keyword to match in Lovelace resource URL, display name, HACS search term)
REQUIRED_HACS_CARDS: list[tuple[str, str, str, str, str]] = [
    ("layout-card", "Layout Card", "layout-card", "thomasloven", "lovelace-layout-card"),
    ("apexcharts-card", "ApexCharts Card", "apexcharts-card", "RomRider", "apexcharts-card"),
    ("sankey-chart", "Sankey Chart Card", "sankey-chart", "MindFreeze", "ha-sankey-chart"),
    ("mushroom", "Mushroom Cards", "mushroom", "piitaya", "lovelace-mushroom"),
    ("card-mod", "Card Mod", "card-mod", "thomasloven", "lovelace-card-mod"),
    ("html-template-card", "HTML Template Card", "html-template-card", "PiotrMachowski", "Home-Assistant-Lovelace-HTML-Jinja2-Template-card"),
]


class _NoCacheJSView(HomeAssistantView):
    """Serve JS files with Cache-Control: no-store to prevent stale module caching."""

    requires_auth = False
    url = f"/{DOMAIN}/js/{{filename}}"
    name = f"{DOMAIN}:js"

    def __init__(self, frontend_dir: Path, hass: HomeAssistant) -> None:
        self._dir = frontend_dir
        self._hass = hass

    async def get(self, request: web.Request, filename: str) -> web.Response:
        # Prevent path traversal
        safe = Path(filename).name
        filepath = self._dir / safe
        if not safe.endswith(".js"):
            return web.Response(status=404)
        is_file = await self._hass.async_add_executor_job(filepath.is_file)
        if not is_file:
            return web.Response(status=404)
        body = await self._hass.async_add_executor_job(filepath.read_bytes)
        return web.Response(
            body=body,
            content_type="application/javascript",
            headers={
                "Cache-Control": "no-store, no-cache, must-revalidate",
                "Pragma": "no-cache",
            },
        )


async def async_setup(hass: HomeAssistant, config: dict) -> bool:
    """Set up the Genergy Dashboard component."""
    hass.data.setdefault(DOMAIN, {})

    frontend_dir = Path(__file__).parent / "frontend"
    if frontend_dir.exists():
        # Register custom no-cache JS view (replaces StaticPathConfig for JS)
        hass.http.register_view(_NoCacheJSView(frontend_dir, hass))

        # Still register static path for non-JS assets (images, etc.)
        from homeassistant.components.http import StaticPathConfig
        await hass.http.async_register_static_paths(
            [
                StaticPathConfig(
                    f"/{DOMAIN}/frontend",
                    str(frontend_dir),
                    cache_headers=False,
                )
            ]
        )

        # Register JS resources via the no-cache endpoint.
        # Use boot timestamp as cache buster so the URL changes each HA restart,
        # forcing fresh ES module evaluation.
        boot_ts = str(int(time.time()))[-6:]
        js_path = frontend_dir / "sigenergy-dashboard.js"
        cache_buster = f"?v={boot_ts}"
        if await hass.async_add_executor_job(js_path.exists):
            js_bytes = await hass.async_add_executor_job(js_path.read_bytes)
            digest = hashlib.md5(js_bytes).hexdigest()[:8]  # noqa: S324
            cache_buster = f"?v={digest}.{boot_ts}"
        add_extra_js_url(hass, f"/{DOMAIN}/js/sigenergy-dashboard.js{cache_buster}")

        # Register HAEO Events Card if present
        haeo_path = frontend_dir / "haeo-events-card.js"
        if await hass.async_add_executor_job(haeo_path.exists):
            haeo_bytes = await hass.async_add_executor_job(haeo_path.read_bytes)
            haeo_digest = hashlib.md5(haeo_bytes).hexdigest()[:8]  # noqa: S324
            add_extra_js_url(hass, f"/{DOMAIN}/js/haeo-events-card.js?v={haeo_digest}.{boot_ts}")

        # Register EMHASS Events Card if present
        emhass_ec_path = frontend_dir / "emhass-events-card.js"
        if await hass.async_add_executor_job(emhass_ec_path.exists):
            emhass_ec_bytes = await hass.async_add_executor_job(emhass_ec_path.read_bytes)
            emhass_ec_digest = hashlib.md5(emhass_ec_bytes).hexdigest()[:8]  # noqa: S324
            add_extra_js_url(hass, f"/{DOMAIN}/js/emhass-events-card.js?v={emhass_ec_digest}.{boot_ts}")

        # Register Energy Manager Events Card if present
        em_ec_path = frontend_dir / "em-events-card.js"
        if await hass.async_add_executor_job(em_ec_path.exists):
            em_ec_bytes = await hass.async_add_executor_job(em_ec_path.read_bytes)
            em_ec_digest = hashlib.md5(em_ec_bytes).hexdigest()[:8]  # noqa: S324
            add_extra_js_url(hass, f"/{DOMAIN}/js/em-events-card.js?v={em_ec_digest}.{boot_ts}")

        _LOGGER.info("Genergy Dashboard: JS resources registered")

    return True


PLATFORMS: list[str] = ["sensor"]


async def _check_prerequisites(hass: HomeAssistant) -> None:
    """Check if required HACS frontend cards are installed and notify user if not."""
    from homeassistant.components.persistent_notification import async_create as pn_create

    missing: list = []

    try:
        # Try to read Lovelace resource list to check for installed cards
        from homeassistant.components.lovelace import LOVELACE_DATA

        lovelace_data = hass.data.get(LOVELACE_DATA)
        if lovelace_data is None:
            _LOGGER.debug("Genergy Dashboard: Lovelace not loaded yet, skipping prereq check")
            return

        # Get the default dashboard's resources (stored in lovelace_resources)
        resources = lovelace_data.resources
        if resources is None:
            _LOGGER.debug("Genergy Dashboard: No Lovelace resources found")
            missing = [(name, owner, repo) for _, name, _, owner, repo in REQUIRED_HACS_CARDS]
        else:
            # Ensure resources are loaded from storage
            if hasattr(resources, "async_load") and not getattr(resources, "loaded", True):
                await resources.async_load()

            items = resources.async_items() if hasattr(resources, "async_items") else []
            loaded_urls = [
                (item.get("url") or "").lower() for item in items
            ]

            if not loaded_urls:
                _LOGGER.debug(
                    "Genergy Dashboard: Lovelace resources empty (may not be loaded yet), "
                    "skipping prereq check"
                )
                return

            for keyword, display_name, _, owner, repository in REQUIRED_HACS_CARDS:
                if not any(keyword in url for url in loaded_urls):
                    missing.append((display_name, owner, repository))

    except Exception as err:
        _LOGGER.debug("Genergy Dashboard: Could not check Lovelace resources: %s", err)
        return

    if not missing:
        _LOGGER.info("Genergy Dashboard: All required HACS cards are installed")
        # Clean up any previous notification
        from homeassistant.components.persistent_notification import async_dismiss
        async_dismiss(hass, "genergy_missing_cards")
        return

    _LOGGER.warning(
        "Genergy Dashboard: Missing HACS frontend cards: %s. "
        "Dashboard may not render correctly.",
        ", ".join(name for name, _, _ in missing),
    )

    # Create a persistent notification with direct my.home-assistant.io links
    card_list = "\n".join(
        f"  • **{name}** — [Install via HACS](https://my.home-assistant.io/redirect/hacs_repository/?owner={owner}&repository={repo})"
        for name, owner, repo in missing
    )
    pn_create(
        hass,
        title="🎨 Genergy Dashboard: Missing HACS Cards",
        message=(
            f"The following HACS frontend cards are required but not installed:\n\n"
            f"{card_list}\n\n"
            f"After installing, restart Home Assistant and hard-refresh your browser.\n\n"
            f"If HACS is not installed, visit https://hacs.xyz/docs/use/"
        ),
        notification_id="genergy_missing_cards",
    )

    # Also create a Repair issue if available (HA 2022.9+)
    try:
        from homeassistant.helpers.issue_registry import (
            async_create_issue,
            IssueSeverity,
        )

        async_create_issue(
            hass,
            domain=DOMAIN,
            issue_id="missing_hacs_frontend_cards",
            is_fixable=False,
            severity=IssueSeverity.WARNING,
            translation_key="missing_cards",
            translation_placeholders={
                "cards": ", ".join(name for name, _, _ in missing),
            },
        )
    except ImportError:
        pass  # Older HA version without issue registry


async def _ensure_forecast_table_toggle(hass: HomeAssistant) -> None:
    """Create input_boolean.genergy_forecast_table if it doesn't exist."""
    entity_id = "input_boolean.genergy_forecast_table"
    if hass.states.get(entity_id) is not None:
        return  # Already exists (YAML-defined or storage-based)

    try:
        from homeassistant.helpers import entity_registry as er

        # Also check entity registry (may exist but be disabled)
        registry = er.async_get(hass)
        if registry.async_get(entity_id) is not None:
            return

        # Create via input_boolean storage collection
        ib_component = hass.data.get("input_boolean")
        if ib_component is None:
            _LOGGER.debug("Genergy Dashboard: input_boolean component not loaded yet")
            return

        # HA stores the collection in hass.data["input_boolean"]
        # The collection object has async_create_item
        collection = None
        if hasattr(ib_component, "async_create_item"):
            collection = ib_component
        elif isinstance(ib_component, dict):
            collection = ib_component.get("collection")

        if collection is None:
            _LOGGER.debug("Genergy Dashboard: Cannot access input_boolean collection")
            return

        await collection.async_create_item({
            "name": "Genergy Forecast Table",
            "initial": False,
            "icon": "mdi:table-clock",
        })
        _LOGGER.info("Genergy Dashboard: Created %s", entity_id)
    except Exception as err:
        _LOGGER.warning(
            "Genergy Dashboard: Could not auto-create %s: %s. "
            "Create it manually via Settings > Devices & Services > Helpers.",
            entity_id, err,
        )


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up Genergy Dashboard from a config entry."""
    hass.data.setdefault(DOMAIN, {})
    hass.data[DOMAIN][entry.entry_id] = entry.data

    # Check for missing HACS frontend prerequisites after HA is fully started
    # (Lovelace resources aren't loaded yet during async_setup_entry)
    async def _delayed_prereq_check(_event=None) -> None:
        await _check_prerequisites(hass)

    if hass.is_running:
        # HA already started (e.g. config entry reloaded) — check after short delay
        from homeassistant.helpers.event import async_call_later
        async_call_later(hass, 5, lambda _now: hass.async_create_task(_delayed_prereq_check()))
    else:
        from homeassistant.const import EVENT_HOMEASSISTANT_STARTED
        hass.bus.async_listen_once(EVENT_HOMEASSISTANT_STARTED, _delayed_prereq_check)

    # Install bundled theme
    theme_updated = await hass.async_add_executor_job(_install_theme, hass)

    # Reload themes so HA picks up new/updated theme without manual restart
    if theme_updated:
        try:
            await hass.services.async_call("frontend", "reload_themes")
            _LOGGER.info("Genergy Dashboard: Reloaded themes after theme install/update")
        except Exception:
            _LOGGER.debug("Genergy Dashboard: frontend.reload_themes not available yet")

    # Ensure input_boolean.genergy_forecast_table exists
    await _ensure_forecast_table_toggle(hass)

    # Create or update the Lovelace dashboard
    # Run dashboard generation (contains file I/O) off the event loop
    await _create_or_update_dashboard(hass, entry)

    # Set up sensor platform (e.g. dual-tariff computed sensors)
    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)

    # Listen for options updates
    entry.async_on_unload(entry.add_update_listener(_async_update_listener))

    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload a config entry."""
    await hass.config_entries.async_unload_platforms(entry, PLATFORMS)
    hass.data[DOMAIN].pop(entry.entry_id, None)
    return True


async def _async_update_listener(
    hass: HomeAssistant, entry: ConfigEntry
) -> None:
    """Handle options update — regenerate the dashboard config."""
    await _regenerate_dashboard(hass, entry)


def _install_theme(hass: HomeAssistant) -> bool:
    """Copy bundled sigenergy_dark and sigenergy_light themes to HA themes directory.

    Returns True if any theme was installed or updated.
    """
    themes_dir = Path(hass.config.config_dir) / "themes"
    themes_dir.mkdir(exist_ok=True)
    changed = False
    for name in ("sigenergy_dark", "sigenergy_light"):
        theme_src = Path(__file__).parent / "themes" / f"{name}.yaml"
        if not theme_src.exists():
            continue
        dest = themes_dir / f"{name}.yaml"
        if not dest.exists() or dest.stat().st_size != theme_src.stat().st_size:
            shutil.copy2(theme_src, dest)
            _LOGGER.info("Genergy Dashboard: Installed %s theme", name)
            changed = True
    return changed


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
            "icon": "mdi:home-lightning-bolt",
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
                sidebar_icon="mdi:home-lightning-bolt",
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


async def _regenerate_dashboard(
    hass: HomeAssistant, entry: ConfigEntry
) -> None:
    """Regenerate the dashboard config when options change.

    Unlike _create_or_update_dashboard, this always regenerates — even if
    the dashboard already exists.  It preserves user-made JS settings by
    reading the existing _sigenergy_config and merging it back.
    """
    try:
        from homeassistant.components.lovelace import LOVELACE_DATA

        lovelace_data = hass.data.get(LOVELACE_DATA)
        if lovelace_data is None:
            return

        dashboard_obj = lovelace_data.dashboards.get(DASHBOARD_URL_PATH)
        if dashboard_obj is None:
            # Dashboard doesn't exist at all — fall back to creating it
            await _create_or_update_dashboard(hass, entry)
            return

        # Read existing config, preserve _sigenergy_config if present
        existing = None
        try:
            existing = await dashboard_obj.async_load(False)
        except Exception:
            pass

        existing_js_config = None
        if existing and isinstance(existing, dict):
            views = existing.get("views", [])
            for view in views:
                cards = view.get("cards", [])
                if cards and isinstance(cards[0], dict):
                    existing_js_config = cards[0].get("_sigenergy_config")
                    if existing_js_config:
                        break

        # Generate fresh dashboard from the updated config entry
        entity_config = dict(entry.data)
        entity_config.update(dict(entry.options))
        dashboard_config = await hass.async_add_executor_job(
            generate_dashboard, entity_config
        )

        # Merge the preserved JS config back in
        if existing_js_config and isinstance(dashboard_config, dict):
            views = dashboard_config.get("views", [])
            for view in views:
                cards = view.get("cards", [])
                if cards and isinstance(cards[0], dict):
                    cards[0]["_sigenergy_config"] = existing_js_config
                    break

        if hasattr(dashboard_obj, "async_save"):
            await dashboard_obj.async_save(dashboard_config)
            _LOGGER.info("Genergy Dashboard: Dashboard regenerated after options update")

    except Exception:
        _LOGGER.exception("Genergy Dashboard: Failed to regenerate dashboard")


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
