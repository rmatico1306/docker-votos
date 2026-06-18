from django.urls import path
from rest_framework.authtoken.views import obtain_auth_token

from . import views

urlpatterns = [
    path("auth/login/", obtain_auth_token, name="api_login"),
    path("auth/me/", views.api_usuario_actual, name="api_usuario_actual"),
    path("casillas/", views.api_casillas, name="api_casillas"),
    path("captura/secciones/", views.api_captura_secciones, name="api_captura_secciones"),
    path("partidos/", views.api_partidos, name="api_partidos"),
    path("resumen/", views.api_resumen, name="api_resumen"),
    path("casillas/<int:casilla_id>/resultados/", views.api_resultados_casilla, name="api_resultados_casilla"),
]
