from django.db import migrations


def delete_all_transactions(apps, schema_editor):
    Transaction = apps.get_model('accounts', 'Transaction')
    Transaction.objects.all().delete()


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0008_seed_transactions'),
    ]

    operations = [
        migrations.RunPython(delete_all_transactions, reverse_code=noop),
    ]
