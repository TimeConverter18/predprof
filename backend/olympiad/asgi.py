import os

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'olympiad.settings')

from django.core.asgi import get_asgi_application

django_asgi_app = get_asgi_application()

from channels.routing import ProtocolTypeRouter, URLRouter
from authentication.middleware import JWTAuthMiddleware, AllowAllOriginsMiddleware

from pvp.routing import websocket_urlpatterns as pvp
from search_enemy.routing import websocket_urlpatterns as enemy
from trainings.routing import websocket_urlpatterns as trainings


application = ProtocolTypeRouter(
    {
        "http": django_asgi_app,
        "websocket": AllowAllOriginsMiddleware(
            JWTAuthMiddleware(
                URLRouter(pvp + enemy + trainings)
            )
        ),
    }
)