"""
WSGI config for NKAP project.
"""

import os

from django.core.wsgi import get_wsgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "nkap.settings")

application = get_wsgi_application()
