from django.contrib import admin

# Register your models here.
from .models import Casilla, Municipio, Partido, ResultadoCasilla, Seccion


@admin.register(Municipio)
class MunicipioAdmin(admin.ModelAdmin):
    list_display = ["nombre"]
    search_fields = ["nombre"]


@admin.register(Seccion)
class SeccionAdmin(admin.ModelAdmin):
    list_display = ["numero", "municipio"]
    list_filter = ["municipio"]
    search_fields = ["numero", "municipio__nombre"]


@admin.register(Casilla)
class CasillaAdmin(admin.ModelAdmin):
    list_display = ["seccion", "tipo", "numero"]
    list_filter = ["tipo", "seccion__municipio"]
    search_fields = ["seccion__numero", "seccion__municipio__nombre"]


@admin.register(Partido)
class PartidoAdmin(admin.ModelAdmin):
    list_display = ["siglas", "nombre", "color"]
    search_fields = ["siglas", "nombre"]


@admin.register(ResultadoCasilla)
class ResultadoCasillaAdmin(admin.ModelAdmin):
    list_display = ["casilla", "partido", "votos"]
    list_filter = ["partido", "casilla__seccion__municipio"]
    search_fields = [
        "partido__siglas",
        "partido__nombre",
        "casilla__seccion__numero",
        "casilla__seccion__municipio__nombre",
    ]