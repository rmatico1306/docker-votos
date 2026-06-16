
# Create your models here.
from django.db import models


class Municipio(models.Model):
    nombre = models.CharField(max_length=120, unique=True)

    class Meta:
        ordering = ["nombre"]
        verbose_name = "Municipio"
        verbose_name_plural = "Municipios"

    def __str__(self):
        return self.nombre


class Seccion(models.Model):
    municipio = models.ForeignKey(
        Municipio,
        on_delete=models.CASCADE,
        related_name="secciones",
    )
    numero = models.PositiveIntegerField()

    class Meta:
        ordering = ["municipio__nombre", "numero"]
        unique_together = ["municipio", "numero"]
        verbose_name = "Sección"
        verbose_name_plural = "Secciones"

    def __str__(self):
        return f"{self.municipio} - Sección {self.numero}"


class Casilla(models.Model):
    TIPO_BASICA = "B"
    TIPO_CONTIGUA = "C"
    TIPO_EXTRAORDINARIA = "E"
    TIPO_ESPECIAL = "S"

    TIPOS_CASILLA = [
        (TIPO_BASICA, "Básica"),
        (TIPO_CONTIGUA, "Contigua"),
        (TIPO_EXTRAORDINARIA, "Extraordinaria"),
        (TIPO_ESPECIAL, "Especial"),
    ]

    seccion = models.ForeignKey(
        Seccion,
        on_delete=models.CASCADE,
        related_name="casillas",
    )
    tipo = models.CharField(max_length=1, choices=TIPOS_CASILLA)
    numero = models.PositiveIntegerField(default=1)

    class Meta:
        ordering = ["seccion__numero", "tipo", "numero"]
        unique_together = ["seccion", "tipo", "numero"]
        verbose_name = "Casilla"
        verbose_name_plural = "Casillas"

    def __str__(self):
        return f"Sección {self.seccion.numero} - {self.get_tipo_display()} {self.numero}"


class Partido(models.Model):
    nombre = models.CharField(max_length=120, unique=True)
    siglas = models.CharField(max_length=20, unique=True)
    color = models.CharField(max_length=20, default="#6c757d")

    class Meta:
        ordering = ["siglas"]
        verbose_name = "Partido"
        verbose_name_plural = "Partidos"

    def __str__(self):
        return self.siglas


class ResultadoCasilla(models.Model):
    casilla = models.ForeignKey(
        Casilla,
        on_delete=models.CASCADE,
        related_name="resultados",
    )
    partido = models.ForeignKey(
        Partido,
        on_delete=models.CASCADE,
        related_name="resultados",
    )
    votos = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["casilla", "partido__siglas"]
        unique_together = ["casilla", "partido"]
        verbose_name = "Resultado de casilla"
        verbose_name_plural = "Resultados de casilla"

    def __str__(self):
        return f"{self.casilla} - {self.partido}: {self.votos}"