from rest_framework import status
from django.db import transaction
from django.db.models import Sum
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import Casilla, Partido, ResultadoCasilla, Seccion
from .serializers import CasillaSerializer, PartidoSerializer, ResultadoCasillaSerializer


PERMISO_CAPTURA_RESULTADOS = "votos.add_resultadocasilla"
PERMISO_VER_RESULTADOS = "votos.view_resultadocasilla"


@api_view(["GET"])
def api_usuario_actual(request):
    user = request.user

    return Response(
        {
            "id": user.id,
            "username": user.username,
            "permisos": {
                "puede_capturar_resultados": user.has_perm(PERMISO_CAPTURA_RESULTADOS),
                "puede_ver_resultados": user.has_perm(PERMISO_VER_RESULTADOS),
            },
        }
    )


@api_view(["GET"])
def api_casillas(request):
    casillas = Casilla.objects.select_related("seccion", "seccion__municipio").all()
    serializer = CasillaSerializer(casillas, many=True)
    return Response(serializer.data)


@api_view(["GET"])
def api_partidos(request):
    partidos = Partido.objects.order_by("orden_captura", "siglas")
    serializer = PartidoSerializer(partidos, many=True)
    return Response(serializer.data)


@api_view(["GET"])
def api_resumen(request):
    if not request.user.has_perm(PERMISO_VER_RESULTADOS):
        return Response(
            {"detail": "No tienes permiso para ver resultados."},
            status=status.HTTP_403_FORBIDDEN,
        )

    totales = Partido.objects.annotate(total_votos=Sum("resultados__votos")).order_by(
        "-total_votos",
        "siglas",
    )

    partidos = [
        {
            "partido_id": partido.id,
            "nombre": partido.nombre,
            "siglas": partido.siglas,
            "tipo": partido.tipo,
            "tipo_nombre": partido.get_tipo_display(),
            "orden_captura": partido.orden_captura,
            "color": partido.color,
            "imagen_url": partido.imagen_url,
            "total_votos": partido.total_votos or 0,
        }
        for partido in totales
    ]

    total_votos = sum(item["total_votos"] for item in partidos)
    casillas_capturadas = (
        ResultadoCasilla.objects.values("casilla_id").distinct().count()
    )
    casillas_registradas = Casilla.objects.count()
    avance_captura = (
        0
        if casillas_registradas == 0
        else min(
            100,
            round((casillas_capturadas / casillas_registradas) * 100),
        )
    )

    return Response(
        {
            "total_votos": total_votos,
            "casillas_capturadas": casillas_capturadas,
            "casillas_registradas": casillas_registradas,
            "avance_captura": avance_captura,
            "partidos": partidos,
        }
    )


@api_view(["GET"])
def api_captura_secciones(request):
    if not request.user.has_perm(PERMISO_CAPTURA_RESULTADOS):
        return Response(
            {"detail": "No tienes permiso para capturar resultados."},
            status=status.HTTP_403_FORBIDDEN,
        )

    secciones = Seccion.objects.select_related("municipio").prefetch_related(
        "casillas",
        "casillas__resultados",
    )

    data = []

    for seccion in secciones:
        casillas = []

        for casilla in seccion.casillas.all():
            capturada = casilla.resultados.exists()
            casillas.append(
                {
                    "id": casilla.id,
                    "tipo": casilla.tipo,
                    "tipo_nombre": casilla.get_tipo_display(),
                    "numero": casilla.numero,
                    "capturada": capturada,
                }
            )

        capturadas = sum(1 for casilla in casillas if casilla["capturada"])
        total = len(casillas)

        data.append(
            {
                "id": seccion.id,
                "numero": seccion.numero,
                "municipio": {
                    "id": seccion.municipio.id,
                    "nombre": seccion.municipio.nombre,
                },
                "total_casillas": total,
                "casillas_capturadas": capturadas,
                "casillas_pendientes": total - capturadas,
                "casillas": casillas,
            }
        )

    return Response(data)


@api_view(["GET", "POST"])
def api_resultados_casilla(request, casilla_id):
    if request.method == "POST" and not request.user.has_perm(PERMISO_CAPTURA_RESULTADOS):
        return Response(
            {"detail": "No tienes permiso para capturar resultados."},
            status=status.HTTP_403_FORBIDDEN,
        )

    try:
        casilla = Casilla.objects.get(id=casilla_id)
    except Casilla.DoesNotExist:
        return Response(
            {"detail": "Casilla no encontrada."},
            status=status.HTTP_404_NOT_FOUND,
        )

    if request.method == "GET":
        resultados = ResultadoCasilla.objects.filter(casilla=casilla).select_related("partido").order_by(
            "partido__orden_captura",
            "partido__siglas",
        )
        serializer = ResultadoCasillaSerializer(resultados, many=True)
        return Response(serializer.data)

    resultados = request.data.get("resultados", [])

    with transaction.atomic():
        for item in resultados:
            partido_id = item.get("partido_id")
            votos = item.get("votos", 0)

            partido = Partido.objects.get(id=partido_id)

            ResultadoCasilla.objects.update_or_create(
                casilla=casilla,
                partido=partido,
                defaults={"votos": votos},
            )

    return Response({"detail": "Resultados guardados correctamente."})
