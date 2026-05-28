from django.db import migrations
from django.utils import timezone
import datetime

def seed_transactions(apps, schema_editor):
    User = apps.get_model('accounts', 'User')
    Transaction = apps.get_model('accounts', 'Transaction')

    now = timezone.now()

    def create_user_transactions(user):
        Transaction.objects.create(
            user=user,
            label='Cotisation — Voyage 2024',
            subtitle='Tontine · Collectif Famille',
            amount=-150000.00,
            status='completed',
            method='Portefeuille Nkap',
            icon='airplane',
            icon_bg='#06b6d41a',
            icon_color='#00687a',
            created_at=now - datetime.timedelta(hours=2)
        )
        Transaction.objects.create(
            user=user,
            label='Versement reçu',
            subtitle='Tontine · Épargne Famille',
            amount=80000.00,
            status='completed',
            method='Mobile Money',
            icon='home',
            icon_bg='#6cf8bb33',
            icon_color='#006c49',
            created_at=now - datetime.timedelta(hours=4)
        )
        Transaction.objects.create(
            user=user,
            label='Envoi à Sarah Douala',
            subtitle='+237 677 554 433',
            amount=-25000.00,
            status='completed',
            method='Orange Money',
            icon='send',
            icon_bg='#0284c71a',
            icon_color='#0284c7',
            created_at=now - datetime.timedelta(days=1, hours=2)
        )
        Transaction.objects.create(
            user=user,
            label='Cotisation — Scolarité Septembre',
            subtitle='Tontine · Privé',
            amount=-150000.00,
            status='pending',
            method='MTN MoMo',
            icon='school',
            icon_bg='#ffd9e41f',
            icon_color='#b4136d',
            created_at=now - datetime.timedelta(days=1, hours=8)
        )
        Transaction.objects.create(
            user=user,
            label='Remboursement Nkap',
            subtitle='Excédent tour précédent',
            amount=45000.00,
            status='completed',
            method='Compte lié',
            icon='cash-refund',
            icon_bg='#10b9811a',
            icon_color='#10B981',
            created_at=now - datetime.timedelta(days=3)
        )
        Transaction.objects.create(
            user=user,
            label='Retrait vers banque',
            subtitle='Afriland First Bank',
            amount=-500000.00,
            status='failed',
            method='Virement bancaire',
            icon='bank-transfer-out',
            icon_bg='#fef2f2',
            icon_color='#b4136d',
            created_at=now - datetime.timedelta(days=4)
        )
        Transaction.objects.create(
            user=user,
            label='Cotisation — Voyage 2024',
            subtitle='Tontine · Tour #4',
            amount=-150000.00,
            status='completed',
            method='Portefeuille Nkap',
            icon='airplane',
            icon_bg='#06b6d41a',
            icon_color='#00687a',
            created_at=now - datetime.timedelta(days=5)
        )

    normal_users = User.objects.exclude(phone_number__in=[
        '237690000001', '237690000002', '237690000003',
        '237690000004', '237690000005', '237690000006'
    ])
    for user in normal_users:
        if user.transactions.count() == 0:
            create_user_transactions(user)

def remove_transactions(apps, schema_editor):
    Transaction = apps.get_model('accounts', 'Transaction')
    Transaction.objects.all().delete()

class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0007_transaction'),
    ]

    operations = [
        migrations.RunPython(seed_transactions, reverse_code=remove_transactions),
    ]
