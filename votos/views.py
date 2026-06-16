from rest_framework import status
from django.db.models import Sum
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import Casilla, Partido, ResultadoCasilla
from .serializers import CasillaSerializer, PartidoSerializer, ResultadoCasillaSerializer


@api_view(["GET"])
def api_casillas(request):
    casillas = Casilla.objects.select_related("seccion", "seccion__municipio").all()
    serializer = CasillaSerializer(casillas, many=True)
    return Response(serializer.data)


@api_view(["GET"])
def api_partidos(request):
    partidos = Partido.objects.all()
    serializer = PartidoSerializer(partidos, many=True)
    return Response(serializer.data)


@api_view(["GET"])
def api_resumen(request):
    totales = Partido.objects.annotate(total_votos=Sum("resultados__votos")).order_by(
        "-total_votos",
        "siglas",
    )

    partidos = [
        {
            "partido_id": partido.id,
            "nombre": partido.nombre,
            "siglas": partido.siglas,
            "color": partido.color,
            "total_votos": partido.total_votos or 0,
        }
        for partido in totales
    ]

    total_votos = sum(item["total_votos"] for item in partidos)
    casillas_capturadas = (
        ResultadoCasilla.objects.values("casilla_id").distinct().count()
    )

    return Response(
        {
            "total_votos": total_votos,
            "casillas_capturadas": casillas_capturadas,
            "partidos": partidos,
        }
    )


@api_view(["GET", "POST"])
def api_resultados_casilla(request, casilla_id):
    try:
        casilla = Casilla.objects.get(id=casilla_id)
    except Casilla.DoesNotExist:
        return Response(
            {"detail": "Casilla no encontrada."},
            status=status.HTTP_404_NOT_FOUND,
        )

    if request.method == "GET":
        resultados = ResultadoCasilla.objects.filter(casilla=casilla).select_related("partido")
        serializer = ResultadoCasillaSerializer(resultados, many=True)
        return Response(serializer.data)

    resultados = request.data.get("resultados", [])

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
