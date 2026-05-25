# Nkap API Backend - Module Authentification

## 🚀 Vue d'ensemble

Backend Laravel pour l'application mobile Nkap - une plateforme de tontines digitales au Cameroun. Ce module gère l'authentification par numéro de téléphone et code PIN avec JWT.

## 📋 Prérequis

- PHP >= 7.4
- Composer
- PostgreSQL (via Neon)
- Extension PHP pgsql

## 🛠️ Installation

### 1. Cloner et installer les dépendances
```bash
cd backend
composer install
```

### 2. Configuration de l'environnement
```bash
cp .env.example .env
php artisan key:generate
```

### 3. Configurer Neon Database
Voir le fichier `NEON_SETUP.md` pour les détails complets.

Mettre à jour le `.env` avec vos informations Neon :
```env
DB_CONNECTION=pgsql
DB_HOST=ep-your-project-123456.us-east-1.aws.neon.tech
DB_PORT=5432
DB_DATABASE=nkap_db
DB_USERNAME=your-neon-username
DB_PASSWORD=your-neon-password
DB_SSLMODE=require
```

### 4. Exécuter les migrations
```bash
php artisan migrate
```

### 5. (Optionnel) Ajouter des données de test
```bash
php artisan db:seed
```

### 6. Démarrer le serveur
```bash
php artisan serve
```

L'API sera disponible sur `http://localhost:8000`

## 🔐 Fonctionnalités d'authentification

### ✅ Implémenté
- ✅ Inscription avec numéro de téléphone + PIN
- ✅ Connexion avec numéro de téléphone + PIN
- ✅ Authentification JWT
- ✅ Validation des numéros camerounais (6XXXXXXXX)
- ✅ Hashage sécurisé des PINs
- ✅ Gestion des statuts KYC
- ✅ Middleware JWT avec gestion d'erreurs
- ✅ Endpoints protégés (profil, statut, déconnexion)
- ✅ Refresh token

### 🔄 Statuts KYC supportés
- `PENDING` - En attente de soumission
- `UNDER_REVIEW` - En cours de révision
- `VERIFIED` - Vérifié et approuvé
- `REJECTED` - Rejeté
- `SUBMITTED` - Soumis pour révision

## 📡 Endpoints API

### Authentification publique
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion

### Endpoints protégés (JWT requis)
- `GET /api/auth/me` - Profil utilisateur
- `GET /api/auth/status` - Statut KYC
- `POST /api/auth/refresh` - Rafraîchir le token
- `POST /api/auth/logout` - Déconnexion

### Utilitaires
- `GET /api/test` - Test de l'API

Voir `API_TEST.md` pour les détails complets et exemples.

## 🗄️ Structure de la base de données

### Table `users`
```sql
- id (bigint, primary key)
- phone_number (varchar, unique) - Format: 6XXXXXXXX
- pin (varchar, hashed)
- full_name (varchar, nullable)
- kyc_status (enum) - PENDING|UNDER_REVIEW|VERIFIED|REJECTED|SUBMITTED
- is_phone_verified (boolean, default: false)
- phone_verified_at (timestamp, nullable)
- remember_token (varchar, nullable)
- created_at (timestamp)
- updated_at (timestamp)
```

## 🔧 Configuration JWT

Le JWT est configuré avec :
- **TTL** : 1440 minutes (24 heures)
- **Refresh TTL** : 20160 minutes (14 jours)
- **Algorithme** : HS256
- **Claims personnalisés** : phone_number, kyc_status

## 🧪 Tests

### Utilisateurs de test (après `php artisan db:seed`)
1. **Jean Dupont** - `677123456` / PIN: `1234` (KYC: PENDING)
2. **Marie Kamga** - `699876543` / PIN: `5678` (KYC: VERIFIED)
3. **Paul Mbarga** - `655111222` / PIN: `9999` (KYC: UNDER_REVIEW)

### Tests manuels
```bash
# Test de l'API
curl http://localhost:8000/api/test

# Inscription
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"phone_number":"677123456","pin":"1234"}'

# Connexion
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone_number":"677123456","pin":"1234"}'
```

## 🔒 Sécurité

### Mesures implémentées
- ✅ Hashage des PINs avec bcrypt
- ✅ Validation stricte des entrées
- ✅ JWT avec expiration
- ✅ Connexion SSL obligatoire (Neon)
- ✅ Validation des numéros camerounais
- ✅ Gestion d'erreurs sécurisée

### À implémenter (prochaines étapes)
- 🔄 Rate limiting
- 🔄 Vérification OTP par SMS
- 🔄 Blocage après tentatives échouées
- 🔄 Audit trail des connexions
- 🔄 Chiffrement des données sensibles

## 📁 Structure du code

```
app/
├── Http/
│   ├── Controllers/
│   │   └── Api/
│   │       └── AuthController.php
│   └── Middleware/
│       └── JwtMiddleware.php
├── Models/
│   └── User.php
database/
├── migrations/
│   └── 2026_05_25_103650_modify_users_table_for_phone_auth.php
└── seeders/
    ├── DatabaseSeeder.php
    └── UserSeeder.php
routes/
└── api.php
config/
├── auth.php (modifié pour JWT)
└── jwt.php (généré)
```

## 🚀 Prochaines étapes

### Module KYC (à implémenter)
- Upload de documents d'identité
- Validation des informations personnelles
- Workflow d'approbation
- Stockage sécurisé des documents

### Module Paiements (à implémenter)
- Liaison Mobile Money (MTN, Orange)
- Liaison comptes bancaires
- Validation des informations de paiement

### Module Tontines (à implémenter)
- Création et gestion des tontines
- Système de contributions
- Calcul automatique des tours
- Notifications

## 🐛 Dépannage

### Erreur de connexion à la base de données
1. Vérifiez vos informations Neon dans `.env`
2. Testez la connexion : `php artisan tinker` puis `DB::connection()->getPdo();`

### Erreur JWT
1. Vérifiez que `JWT_SECRET` est défini dans `.env`
2. Régénérez la clé : `php artisan jwt:secret`

### Erreur de migration
1. Vérifiez que PostgreSQL est accessible
2. Exécutez : `php artisan migrate:status`

## 📞 Support

Pour toute question technique, consultez :
- `API_TEST.md` - Tests et exemples
- `NEON_SETUP.md` - Configuration base de données
- Logs Laravel : `storage/logs/laravel.log`

## 📄 Licence

Propriétaire - Nkap Team