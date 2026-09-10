"""Application logging configuration."""

import logging


def configure_logging() -> logging.Logger:
    """Configure and return the application's logger."""
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    )
    return logging.getLogger("landslide_monitor")
