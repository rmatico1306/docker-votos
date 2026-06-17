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

    class Meta:
        model = Casilla
        fields = ["id", "seccion", "tipo", "tipo_nombre", "numero"]


class PartidoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Partido
        fields = ["id", "nombre", "siglas", "color", "imagen_url"]


class ResultadoCasillaSerializer(serializers.ModelSerializer):
    partido = PartidoSerializer(read_only=True)

    class Meta:
        model = ResultadoCasilla
        fields = ["id", "partido", "votos"]
