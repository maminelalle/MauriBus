"""
Migration 0002 - Ajout des relations ForeignKey entre les modèles
"""
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0001_initial'),
    ]

    operations = [
        # Bus: ajouter chauffeur et ligne
        migrations.AddField(
            model_name='bus',
            name='chauffeur',
            field=models.OneToOneField(
                blank=True, null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='bus_assigne',
                to='core.driver'
            ),
        ),
        migrations.AddField(
            model_name='bus',
            name='ligne',
            field=models.ForeignKey(
                blank=True, null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='buses',
                to='core.line'
            ),
        ),

        # Trip: ajouter bus, driver, ligne
        migrations.AddField(
            model_name='trip',
            name='bus',
            field=models.ForeignKey(
                blank=True, null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='trips',
                to='core.bus'
            ),
        ),
        migrations.AddField(
            model_name='trip',
            name='driver',
            field=models.ForeignKey(
                blank=True, null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='trips',
                to='core.driver'
            ),
        ),
        migrations.AddField(
            model_name='trip',
            name='ligne',
            field=models.ForeignKey(
                blank=True, null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='trips',
                to='core.line'
            ),
        ),

        # GPSPosition: ajouter bus et trajet
        migrations.AddField(
            model_name='gpsposition',
            name='bus',
            field=models.ForeignKey(
                blank=True, null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name='positions',
                to='core.bus'
            ),
        ),
        migrations.AddField(
            model_name='gpsposition',
            name='trajet',
            field=models.ForeignKey(
                blank=True, null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='positions',
                to='core.trip'
            ),
        ),
        migrations.AddIndex(
            model_name='gpsposition',
            index=models.Index(fields=['bus', 'timestamp'], name='core_gpspos_bus_id_timestamp_idx'),
        ),

        # Payment: ajouter chauffeur et trajet
        migrations.AddField(
            model_name='payment',
            name='chauffeur',
            field=models.ForeignKey(
                blank=True, null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='paiements',
                to='core.driver'
            ),
        ),
        migrations.AddField(
            model_name='payment',
            name='trajet',
            field=models.ForeignKey(
                blank=True, null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='paiements',
                to='core.trip'
            ),
        ),

        # PaymentAlert: ajouter paiement
        migrations.AddField(
            model_name='paymentalert',
            name='paiement',
            field=models.ForeignKey(
                blank=True, null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name='alertes',
                to='core.payment'
            ),
        ),

        # Report: ajouter chauffeur et bus
        migrations.AddField(
            model_name='report',
            name='chauffeur',
            field=models.ForeignKey(
                blank=True, null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='signalements',
                to='core.driver'
            ),
        ),
        migrations.AddField(
            model_name='report',
            name='bus',
            field=models.ForeignKey(
                blank=True, null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='signalements',
                to='core.bus'
            ),
        ),

        # SystemAlert: ajouter bus et chauffeur
        migrations.AddField(
            model_name='systemalert',
            name='bus',
            field=models.ForeignKey(
                blank=True, null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='system_alerts',
                to='core.bus'
            ),
        ),
        migrations.AddField(
            model_name='systemalert',
            name='chauffeur',
            field=models.ForeignKey(
                blank=True, null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='system_alerts',
                to='core.driver'
            ),
        ),
    ]
