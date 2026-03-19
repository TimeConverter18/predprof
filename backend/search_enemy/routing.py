from django.urls import path

from .consumers import SearchEnemyConsumer

websocket_urlpatterns = [
    path('ws/search_enemy/', SearchEnemyConsumer.as_asgi()),
]
