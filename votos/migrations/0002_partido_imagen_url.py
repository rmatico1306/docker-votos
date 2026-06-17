from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("votos", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="partido",
            name="imagen_url",
            field=models.URLField(
                blank=True,
                help_text="Logo o imagen del partido para mostrar en el frontend.",
                verbose_name="URL de imagen",
            ),
        ),
    ]
