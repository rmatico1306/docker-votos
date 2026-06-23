from rest_framework import serializers

from .models import Casilla, Municipio, Partido, ResultadoCasilla, Seccion


class MunicipioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Municipio
        fields = ["id", "nombre"]


class SeccionSerializer(serializers.ModelSerializer):
    municipio = MunicipioSerializer(read_only=True)

    class Meta:
        model = Seccion
        fields = ["id", "numero", "municipio"]


class CasillaSerializer(serializers.ModelSerializer):
    seccion = SeccionSerializer(read_only=True)
    tipo_nombre = serializers.CharField(source="get_tipo_display", read_only=True)
    usuario_captura_username = serializers.CharField(
        source="usuario_captura.username",
        read_only=True,
    )

    class Meta:
        model = Casilla
        fields = [
            "id",
            "seccion",
            "tipo",
            "tipo_nombre",
            "numero",
            "total_acta",
            "total_calculado",
            "diferencia",
            "tiene_diferencia",
            "usuario_captura",
            "usuario_captura_username",
            "fecha_captura",
        ]


class PartidoSerializer(serializers.ModelSerializer):
    tipo_nombre = serializers.CharField(source="get_tipo_display", read_only=True)

    class Meta:
        model = Partido
        fields = [
            "id",
            "nombre",
            "siglas",
            "tipo",
            "tipo_nombre",
            "orden_captura",
            "color",
            "imagen_url",
        ]


class ResultadoCasillaSerializer(serializers.ModelSerializer):
    partido = PartidoSerializer(read_only=True)

    class Meta:
        model = ResultadoCasilla
        fields = ["id", "partido", "votos"]
