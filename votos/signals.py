from django.db import transaction
from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from .models import ResultadoCasilla
from .realtime import notificar_resultados_actualizados


@receiver(post_save, sender=ResultadoCasilla)
@receiver(post_delete, sender=ResultadoCasilla)
def resultado_casilla_cambio(sender, instance, **kwargs):
    transaction.on_commit(
        lambda: notificar_resultados_actualizados(instance.casilla_id)
    )
