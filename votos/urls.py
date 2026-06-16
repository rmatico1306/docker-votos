from django.urls import path

from . import views

urlpatterns = [
    path("casillas/", views.api_casillas, name="api_casillas"),
    path("partidos/", views.api_partidos, name="api_partidos"),
    path("resumen/", views.api_resumen, name="api_resumen"),
    path("casillas/<int:casilla_id>/resultados/", views.api_resultados_casilla, name="api_resultados_casilla"),
]
