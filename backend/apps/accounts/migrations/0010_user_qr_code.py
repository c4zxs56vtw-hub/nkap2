import uuid
from django.db import migrations, models


def assign_unique_qr_codes(apps, schema_editor):
    """Assigne un UUID unique à chaque utilisateur."""
    User = apps.get_model('accounts', 'User')
    for user in User.objects.all():
        user.qr_code = uuid.uuid4()
        user.save(update_fields=['qr_code'])


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0009_delete_seed_transactions'),
    ]

    operations = [
        # Étape 1 : ajouter le champ sans contrainte UNIQUE (null autorisé)
        migrations.AddField(
            model_name='user',
            name='qr_code',
            field=models.UUIDField(null=True, blank=True),
        ),
        # Étape 2 : remplir chaque ligne avec un UUID distinct
        migrations.RunPython(assign_unique_qr_codes, reverse_code=migrations.RunPython.noop),
        # Étape 3 : rendre le champ unique et non-nullable
        migrations.AlterField(
            model_name='user',
            name='qr_code',
            field=models.UUIDField(default=uuid.uuid4, unique=True, editable=False),
        ),
    ]
