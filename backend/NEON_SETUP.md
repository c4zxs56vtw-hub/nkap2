# Configuration Neon Database pour Nkap API

## 🚀 Étapes détaillées pour configurer Neon

### 1. Créer un compte Neon
1. Allez sur [neon.tech](https://neon.tech)
2. Cliquez sur **"Sign up"**
3. Créez un compte gratuit (GitHub, Google, ou email)

### 2. Créer un nouveau projet
1. Une fois connecté, cliquez sur **"Create Project"**
2. Donnez un nom à votre projet : `nkap-backend`
3. Sélectionnez une région proche de vous :
   - **US East (N. Virginia)** - Recommandé pour l'Afrique
   - **Europe (Frankfurt)** - Alternative européenne
4. Cliquez sur **"Create Project"**

### 3. Récupérer les informations de connexion

#### 3.1 Dans le Dashboard Neon
1. Cliquez sur votre projet `nkap-backend`
2. Dans la section **"Connection Details"**, vous verrez :

```
Connection string:
postgresql://username:password@ep-example-123456.us-east-1.aws.neon.tech/neondb?sslmode=require

Host: ep-example-123456.us-east-1.aws.neon.tech
Database: neondb
Username: username
Password: [cliquez pour révéler]
Port: 5432
```

#### 3.2 Copier les informations
- **Host** : `ep-example-123456.us-east-1.aws.neon.tech`
- **Database** : `neondb` (nom par défaut)
- **Username** : votre nom d'utilisateur généré
- **Password** : cliquez sur "Show password" pour le révéler
- **Port** : `5432` (standard PostgreSQL)

### 4. Configurer Laravel

#### 4.1 Mettre à jour le fichier .env
Remplacez les valeurs dans votre fichier `.env` :

```env
# Neon Database Configuration
DB_CONNECTION=pgsql
DB_HOST=ep-example-123456.us-east-1.aws.neon.tech
DB_PORT=5432
DB_DATABASE=neondb
DB_USERNAME=votre-username-neon
DB_PASSWORD=votre-password-neon
DB_SSLMODE=require
```

**⚠️ IMPORTANT :** Remplacez `ep-example-123456.us-east-1.aws.neon.tech` par votre vraie URL Neon !

#### 4.2 Tester la connexion
```bash
# Dans le dossier backend
php test_db_connection.php
```

Si tout fonctionne, vous devriez voir :
```
✅ Connexion réussie !
Driver: pgsql
Version serveur: 15.x
🎉 La connexion à Neon fonctionne parfaitement !
```

### 5. Exécuter les migrations Laravel

#### 5.1 Vérifier le statut
```bash
php artisan migrate:status
```

#### 5.2 Exécuter les migrations
```bash
php artisan migrate
```

Vous devriez voir :
```
Migration table created successfully.
Migrating: 2014_10_12_000000_create_users_table
Migrated:  2014_10_12_000000_create_users_table (XX.XXms)
Migrating: 2026_05_25_103650_modify_users_table_for_phone_auth
Migrated:  2026_05_25_103650_modify_users_table_for_phone_auth (XX.XXms)
...
```

#### 5.3 (Optionnel) Ajouter des données de test
```bash
php artisan db:seed
```

### 6. Vérifier dans Neon Dashboard

1. Retournez sur votre dashboard Neon
2. Cliquez sur **"Tables"** dans le menu latéral
3. Vous devriez voir vos tables Laravel :
   - `users`
   - `migrations`
   - `failed_jobs`
   - `password_resets`

## 🔧 Dépannage

### Erreur : "could not connect to server"
- ✅ Vérifiez que votre Host est correct
- ✅ Vérifiez votre connexion internet
- ✅ Vérifiez que votre projet Neon est actif

### Erreur : "FATAL: password authentication failed"
- ✅ Vérifiez votre username et password
- ✅ Copiez-collez directement depuis Neon (attention aux espaces)

### Erreur : "SSL connection required"
- ✅ Vérifiez que `DB_SSLMODE=require` est dans votre .env

### Erreur : "database does not exist"
- ✅ Vérifiez le nom de la base de données (généralement `neondb`)

## 🎯 Configuration finale recommandée

Votre `.env` final devrait ressembler à :

```env
APP_NAME="Nkap API"
APP_ENV=local
APP_KEY=base64:VotreClé...
APP_DEBUG=true
APP_URL=http://localhost:8000

# Neon Database Configuration
DB_CONNECTION=pgsql
DB_HOST=ep-votre-projet-123456.us-east-1.aws.neon.tech
DB_PORT=5432
DB_DATABASE=neondb
DB_USERNAME=votre-username
DB_PASSWORD=votre-password
DB_SSLMODE=require

# JWT Configuration
JWT_SECRET=votre-jwt-secret
JWT_TTL=1440
```

## 🚀 Avantages de Neon pour Nkap

- **✅ Gratuit** : Plan gratuit généreux
- **✅ Serverless** : Pas de gestion de serveur
- **✅ Auto-scaling** : S'adapte à la charge
- **✅ Branching** : Créez des environnements de test
- **✅ Backup automatique** : Vos données sont protégées
- **✅ SSL par défaut** : Sécurité maximale
- **✅ Compatible PostgreSQL** : Toutes les fonctionnalités

## 📞 Support

Si vous rencontrez des problèmes :
1. Exécutez `php test_db_connection.php` pour diagnostiquer
2. Vérifiez les logs Laravel : `storage/logs/laravel.log`
3. Consultez la documentation Neon : [docs.neon.tech](https://docs.neon.tech)