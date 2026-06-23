from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer


def notificar_resultados_actualizados(casilla_id):
    channel_layer = get_channel_layer()

    if not channel_layer:
        return

    async_to_sync(channel_layer.group_send)(
        "resultados",
        {
            "type": "resultados_actualizados",
            "casilla_id": casilla_id,
        },
    )
