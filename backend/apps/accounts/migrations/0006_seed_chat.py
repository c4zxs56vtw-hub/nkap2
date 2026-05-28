from django.db import migrations

def seed_chat(apps, schema_editor):
    User = apps.get_model('accounts', 'User')
    Tontine = apps.get_model('accounts', 'Tontine')
    Message = apps.get_model('accounts', 'Message')

    # 1. Create mock users
    def get_or_create_user(phone, first, last):
        username = phone.replace('+', '').strip()
        user, created = User.objects.get_or_create(
            phone_number=phone,
            defaults={
                'username': username,
                'first_name': first,
                'last_name': last,
                'kyc_status': 'VERIFIED',
                'is_active': True,
                'password': '!',
            }
        )
        return user

    sarah = get_or_create_user('237690000001', 'Sarah', 'Douala')
    marc = get_or_create_user('237690000002', 'Marc', "N'diaye")
    aminata = get_or_create_user('237690000003', 'Aminata', 'Keita')
    jeanpaul = get_or_create_user('237690000004', 'Jean-Paul', 'Fotsing')
    marie = get_or_create_user('237690000005', 'Marie', 'Ngo')
    david = get_or_create_user('237690000006', 'David', 'Tchamba')

    # 2. Get tontines
    try:
        t1 = Tontine.objects.get(id=101)  # Voyage 2024
        t1.members.add(sarah, marc)
    except Tontine.DoesNotExist:
        t1 = None

    try:
        t2 = Tontine.objects.get(id=102)  # Épargne Famille
        t2.members.add(aminata, jeanpaul)
    except Tontine.DoesNotExist:
        t2 = None

    try:
        t3 = Tontine.objects.get(id=103)  # Scolarité Septembre
        t3.members.add(marie, david)
    except Tontine.DoesNotExist:
        t3 = None

    # Get a default user to represent "Me" in demo chats
    me_user = User.objects.exclude(phone_number__in=[
        '237690000001', '237690000002', '237690000003',
        '237690000004', '237690000005', '237690000006'
    ]).first()

    # 3. Seed messages
    if t1:
        # Message 1
        Message.objects.create(
            tontine=t1,
            sender=sarah,
            content="Bonjour l’équipe ! J’ai bien reçu les cotisations de 5 membres pour ce tour. Plus que 3 ! 🌴",
            message_type="text"
        )
        # Message 2 (Me)
        Message.objects.create(
            tontine=t1,
            sender=me_user,
            content="Super Sarah ! Je viens d’envoyer la mienne via le portefeuille mobile. Tu devrais la voir d’ici peu. 💸",
            message_type="text"
        )
        # Message 3 (System)
        Message.objects.create(
            tontine=t1,
            sender=None,
            content="Versement de 150 000 FCFA validé par le système.",
            message_type="system"
        )
        # Message 4
        Message.objects.create(
            tontine=t1,
            sender=marc,
            content="Confirmé pour moi aussi. On se rapproche de l’objectif pour le voyage ! On regarde les billets ce week-end ?",
            message_type="text"
        )
        # Message 5 (Image)
        Message.objects.create(
            tontine=t1,
            sender=sarah,
            content="",
            message_type="image",
            external_image_url="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"
        )

    if t2:
        # Message 1
        Message.objects.create(
            tontine=t2,
            sender=aminata,
            content="Bonjour à tous ! Le tour de février est ouvert. Merci de cotiser avant vendredi. 🏠",
            message_type="text"
        )
        # Message 2
        Message.objects.create(
            tontine=t2,
            sender=jeanpaul,
            content="C’est fait de mon côté, versement Mobile Money envoyé.",
            message_type="text"
        )
        # Message 3 (Me)
        Message.objects.create(
            tontine=t2,
            sender=me_user,
            content="Parfait, je viens de valider ma part aussi !",
            message_type="text"
        )

    if t3:
        # Message 1
        Message.objects.create(
            tontine=t3,
            sender=marie,
            content="Rappel : les frais de scolarité du prochain tour doivent être réunis avant le 15. 📚",
            message_type="text"
        )
        # Message 2 (Me)
        Message.objects.create(
            tontine=t3,
            sender=me_user,
            content="J’ai une question sur le montant de ma cotisation ce mois-ci.",
            message_type="text"
        )
        # Message 3
        Message.objects.create(
            tontine=t3,
            sender=david,
            content="Moi aussi, on peut en parler ici pour que tout le monde soit aligné.",
            message_type="text"
        )

def remove_chat(apps, schema_editor):
    Message = apps.get_model('accounts', 'Message')
    User = apps.get_model('accounts', 'User')
    
    # Delete all chat messages
    Message.objects.all().delete()
    
    # Delete seeded users
    User.objects.filter(phone_number__in=[
        '237690000001', '237690000002', '237690000003',
        '237690000004', '237690000005', '237690000006'
    ]).delete()

class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0005_message'),
    ]

    operations = [
        migrations.RunPython(seed_chat, reverse_code=remove_chat),
    ]
