from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0004_bus_ligne_m2m'),
    ]

    operations = [
        # Add lu and reponse_admin to Report
        migrations.AddField(
            model_name='report',
            name='lu',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='report',
            name='reponse_admin',
            field=models.TextField(blank=True),
        ),
        # Create Notification model
        migrations.CreateModel(
            name='Notification',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('titre', models.CharField(max_length=200)),
                ('message', models.TextField()),
                ('type_notification', models.CharField(
                    choices=[('BROADCAST', 'Tous les chauffeurs'), ('INDIVIDUEL', 'Chauffeur spécifique')],
                    default='BROADCAST',
                    max_length=20,
                )),
                ('envoye_par', models.CharField(blank=True, max_length=100)),
                ('date_creation', models.DateTimeField(auto_now_add=True)),
                ('destinataire', models.ForeignKey(
                    blank=True,
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='notifications',
                    to='core.driver',
                )),
            ],
            options={
                'verbose_name': 'Notification',
                'verbose_name_plural': 'Notifications',
                'ordering': ['-date_creation'],
            },
        ),
    ]
