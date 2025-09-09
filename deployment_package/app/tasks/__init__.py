# Import all task modules to make them available to Celery
from . import scraper
from . import jobs
from . import email
from app.autoscraper import tasks as autoscraper

# Make tasks discoverable
__all__ = ['scraper', 'jobs', 'email', 'autoscraper']