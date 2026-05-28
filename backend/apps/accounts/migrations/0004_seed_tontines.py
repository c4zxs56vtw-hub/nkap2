from django.db import migrations

def seed_tontines(apps, schema_editor):
    Tontine = apps.get_model('accounts', 'Tontine')
    User = apps.get_model('accounts', 'User')

    # Create the default active tontines
    t1, _ = Tontine.objects.get_or_create(
        id=101,
        defaults={
            'title': 'Voyage 2024',
            'subtitle': 'Collectif Famille',
            'pool_amount': 1250000.00,
            'active_members': 8,
            'progress': 45,
            'icon': 'airplane',
            'icon_bg': '#06b6d41a',
            'icon_color': '#00687a',
            'treasurer_name': 'Sarah Douala',
            'member_name': "Marc N'diaye",
        }
    )

    t2, _ = Tontine.objects.get_or_create(
        id=102,
        defaults={
            'title': 'Épargne Famille',
            'subtitle': 'Mensuel',
            'pool_amount': 2000000.00,
            'active_members': 6,
            'progress': 40,
            'icon': 'home',
            'icon_bg': '#6cf8bb33',
            'icon_color': '#006c49',
            'treasurer_name': 'Aminata Keita',
            'member_name': 'Jean-Paul Fotsing',
        }
    )

    t3, _ = Tontine.objects.get_or_create(
        id=103,
        defaults={
            'title': 'Scolarité Septembre',
            'subtitle': 'Privé',
            'pool_amount': 300000.00,
            'active_members': 5,
            'progress': 50,
            'icon': 'school',
            'icon_bg': '#ffd9e41f',
            'icon_color': '#b4136d',
            'treasurer_name': 'Marie Ngo',
            'member_name': 'David Tchamba',
        }
    )

    # Automatically add all existing users as members to these tontines
    for user in User.objects.all():
        t1.members.add(user)
        t2.members.add(user)
        t3.members.add(user)

def remove_tontines(apps, schema_editor):
    Tontine = apps.get_model('accounts', 'Tontine')
    Tontine.objects.filter(id__in=[101, 102, 103]).delete()

class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0003_tontine'),
    ]

    operations = [
        migrations.RunPython(seed_tontines, reverse_code=remove_tontines),
    ]
