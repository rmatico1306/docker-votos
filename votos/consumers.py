from urllib.parse import parse_qs

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from rest_framework.authtoken.models import Token

from .views import PERMISO_VER_RESULTADOS


class ResultadosConsumer(AsyncJsonWebsocketConsumer):
    group_name = "resultados"

    async def connect(self):
        token_key = self._get_token_key()
        user = await self._get_user(token_key)

        if not user or not await self._puede_ver_resultados(user):
            await self.close(code=4403)
            return

        self.scope["user"] = user
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()
        await self.send_json({"type": "conexion_establecida"})

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def resultados_actualizados(self, event):
        await self.send_json(
            {
                "type": "resultados_actualizados",
                "casilla_id": event.get("casilla_id"),
            }
        )

    def _get_token_key(self):
        query_string = self.scope.get("query_string", b"").decode()
        return parse_qs(query_string).get("token", [None])[0]

    @database_sync_to_async
    def _get_user(self, token_key):
        if not token_key:
            return None

        try:
            return Token.objects.select_related("user").get(key=token_key).user
        except Token.DoesNotExist:
            return None

    @database_sync_to_async
    def _puede_ver_resultados(self, user):
        return user.has_perm(PERMISO_VER_RESULTADOS)
