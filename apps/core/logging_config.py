import logging
import logging.config
import os
from logging.handlers import RotatingFileHandler


# Define where logs will be stored — one folder above "apps"
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
LOG_DIR = os.path.join(BASE_DIR, "logs")
LOG_FILE = os.path.join(LOG_DIR, "app.log")
ERR_FILE = os.path.join(LOG_DIR, "error.log")


def _ensure_log_dir():
    """Ensure that the logs directory exists."""
    os.makedirs(LOG_DIR, exist_ok=True)


def init_logging():
    """
    Configure logging for the FastAPI + Uvicorn application.
    Includes:
      - Console output
      - Rotating file handler for all logs (INFO+)
      - Rotating file handler for errors (ERROR+)
    """
    _ensure_log_dir()

    log_format = {
        "format": "%(asctime)s | %(levelname)s | %(name)s | %(process)d | %(threadName)s | %(message)s",
        "datefmt": "%Y-%m-%d %H:%M:%S",
    }

    dict_config = {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "standard": log_format,
        },
        "handlers": {
            "console": {
                "class": "logging.StreamHandler",
                "level": "INFO",
                "formatter": "standard",
                "stream": "ext://sys.stdout",
            },
            "file_info": {
                "class": "logging.handlers.RotatingFileHandler",
                "level": "INFO",
                "formatter": "standard",
                "filename": LOG_FILE,
                "maxBytes": 5 * 1024 * 1024,  # 5MB
                "backupCount": 5,
                "encoding": "utf-8",
            },
            "file_error": {
                "class": "logging.handlers.RotatingFileHandler",
                "level": "ERROR",
                "formatter": "standard",
                "filename": ERR_FILE,
                "maxBytes": 5 * 1024 * 1024,
                "backupCount": 5,
                "encoding": "utf-8",
            },
        },
        "loggers": {
            "": {
                "level": "INFO",
                "handlers": ["console", "file_info", "file_error"],
            },
            "uvicorn.error": {
                "level": "INFO",
                "handlers": ["console", "file_info", "file_error"],
                "propagate": False,
            },
            "uvicorn.access": {
                "level": "INFO",
                "handlers": ["console", "file_info"],
                "propagate": False,
            },
        },
    }

    logging.config.dictConfig(dict_config)

    logging.getLogger("app").info(f"✅ Logging configured. Logs will be written to {LOG_DIR}")
