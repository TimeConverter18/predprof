from channels.routing import URLRouter

def get_applications():
    from pvp.routing import websocket_urlpatterns as pvp
    from search_enemy.routing import websocket_urlpatterns as enemy
    from trainings.routing import websocket_urlpatterns as trainings
    return URLRouter(pvp + enemy + trainings)

applications = get_applications()
