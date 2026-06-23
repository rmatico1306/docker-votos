from django.urls import path

from .consumers import ResultadosConsumer

websocket_urlpatterns = [
    path("ws/resultados/", ResultadosConsumer.as_asgi()),
]
