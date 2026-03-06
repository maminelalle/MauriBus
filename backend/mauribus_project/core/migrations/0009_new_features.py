"""
Migration 0009 — ticket QR, ratings, stop progression, push tokens
"""
import uuid
import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0008_trip_date_planifiee'),
    ]

    operations = [
        # ── CitizenUser: push_token ─────────────────────────────────────────────
        migrations.AddField(
            model_name='citizenuser',
            name='push_token',
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
        # ── Driver: push_token ─────────────────────────────────────────────────
        migrations.AddField(
            model_name='driver',
            name='push_token',
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
        # ── CitizenTrip: ticket_code (step 1 — not unique yet) ─────────────────
        migrations.AddField(
            model_name='citizentrip',
            name='ticket_code',
            field=models.UUIDField(default=uuid.uuid4, null=True),
        ),
        # ── CitizenTrip: date_utilisation ──────────────────────────────────────
        migrations.AddField(
            model_name='citizentrip',
            name='date_utilisation',
            field=models.DateTimeField(blank=True, null=True),
        ),
        # ── CitizenTrip: UTILISE status ────────────────────────────────────────
        migrations.AlterField(
            model_name='citizentrip',
            name='statut',
            field=models.CharField(
                choices=[('PAYE', 'Payé'), ('UTILISE', 'Utilisé'), ('ANNULE', 'Annulé')],
                default='PAYE',
                max_length=20,
            ),
        ),
        # ── Backfill ticket_code with unique UUIDs ─────────────────────────────
        migrations.RunPython(
            code=lambda apps, schema_editor: [
                apps.get_model('core', 'CitizenTrip').objects
                    .filter(ticket_code__isnull=True)
                    .update(ticket_code=uuid.uuid4())
            ] or
            # Per-row unique values
            [setattr(obj, 'ticket_code', uuid.uuid4()) or obj.save(update_fields=['ticket_code'])
             for obj in apps.get_model('core', 'CitizenTrip').objects.filter(ticket_code__isnull=True)],
            reverse_code=migrations.RunPython.noop,
        ),
        # ── CitizenTrip: make ticket_code unique + not-null ────────────────────
        migrations.AlterField(
            model_name='citizentrip',
            name='ticket_code',
            field=models.UUIDField(default=uuid.uuid4, unique=True),
        ),
        # ── DriverRating ────────────────────────────────────────────────────────
        migrations.CreateModel(
            name='DriverRating',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('note', models.IntegerField(default=5)),
                ('commentaire', models.TextField(blank=True)),
                ('date_creation', models.DateTimeField(auto_now_add=True)),
                ('citoyen', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='ratings_donnees',
                    to='core.citizenuser',
                )),
                ('chauffeur', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='ratings',
                    to='core.driver',
                )),
                ('citizen_trip', models.OneToOneField(
                    blank=True,
                    null=True,
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='rating',
                    to='core.citizentrip',
                )),
            ],
            options={
                'verbose_name': 'Avis Chauffeur',
                'ordering': ['-date_creation'],
            },
        ),
        # ── TripCurrentStop ────────────────────────────────────────────────────
        migrations.CreateModel(
            name='TripCurrentStop',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('stop_index', models.IntegerField(default=0)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('stop', models.ForeignKey(
                    blank=True,
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='current_trips',
                    to='core.stop',
                )),
                ('trajet', models.OneToOneField(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='current_stop',
                    to='core.trip',
                )),
            ],
            options={'verbose_name': 'Arrêt actuel'},
        ),
    ]
