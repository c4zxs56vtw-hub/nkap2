# NKAP Backend

Backend Django + DRF pour la plateforme NKAP.

## Stack

- Django 4.2+
- Django REST Framework
- Simple JWT
- SQLite en developpement
- PostgreSQL en production

## Demarrage local

1. Creer un virtualenv et installer les dependances.
2. Copier `.env.example` vers `.env` et ajuster les variables.
3. Lancer les migrations:

```bash
python manage.py makemigrations
python manage.py migrate
```

4. Demarrer le serveur:

```bash
python manage.py runserver
```

## Modules metiers

- `accounts`: utilisateurs, roles, blacklist
- `kyc`: validation d'identite
- `tontines`: tontines, adhesions, invitations, tours
- `payments`: initiation et webhook Mobile Money

## Notes produit

- Le pays d'une tontine est herite du createur.
- Les fonctions financieres restent bloquees tant que le KYC n'est pas `VERIFIED`.
- La comparaison MoMo utilise une normalisation des noms avant validation.
- La configuration permet de basculer vers PostgreSQL sans changer le code applicatif.
