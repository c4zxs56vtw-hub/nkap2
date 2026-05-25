# Tests API Nkap - Module Authentification

## Base URL
```
http://localhost:8000/api
```

## Endpoints disponibles

### 1. Test de l'API
```http
GET /api/test
```

**Réponse attendue :**
```json
{
    "message": "Nkap API is running!",
    "version": "1.0.0",
    "timestamp": "2026-05-25T10:36:50.000000Z"
}
```

### 2. Inscription
```http
POST /api/auth/register
Content-Type: application/json

{
    "phone_number": "677123456",
    "pin": "1234"
}
```

**Réponse succès (201) :**
```json
{
    "success": true,
    "message": "Compte créé avec succès",
    "data": {
        "user": {
            "id": 1,
            "phone_number": "677123456",
            "kyc_status": "PENDING",
            "is_phone_verified": false
        },
        "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
        "status": "PENDING"
    }
}
```

### 3. Connexion
```http
POST /api/auth/login
Content-Type: application/json

{
    "phone_number": "677123456",
    "pin": "1234"
}
```

**Réponse succès (200) :**
```json
{
    "success": true,
    "message": "Connexion réussie",
    "data": {
        "user": {
            "id": 1,
            "phone_number": "677123456",
            "full_name": null,
            "kyc_status": "PENDING",
            "is_phone_verified": false
        },
        "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
        "status": "PENDING"
    }
}
```

### 4. Profil utilisateur (protégé)
```http
GET /api/auth/me
Authorization: Bearer {token}
```

**Réponse succès (200) :**
```json
{
    "success": true,
    "data": {
        "user": {
            "id": 1,
            "phone_number": "677123456",
            "full_name": null,
            "kyc_status": "PENDING",
            "is_phone_verified": false,
            "phone_verified_at": null,
            "created_at": "2026-05-25T10:36:50.000000Z"
        }
    }
}
```

### 5. Statut utilisateur (protégé)
```http
GET /api/auth/status
Authorization: Bearer {token}
```

**Réponse succès (200) :**
```json
{
    "success": true,
    "data": {
        "kyc_status": "PENDING",
        "is_phone_verified": false,
        "needs_kyc": true
    }
}
```

### 6. Rafraîchir le token (protégé)
```http
POST /api/auth/refresh
Authorization: Bearer {token}
```

### 7. Déconnexion (protégé)
```http
POST /api/auth/logout
Authorization: Bearer {token}
```

## Codes d'erreur

### Erreurs de validation (422)
```json
{
    "success": false,
    "message": "Erreur de validation",
    "errors": {
        "phone_number": ["Le numéro de téléphone est requis."],
        "pin": ["Le code PIN doit contenir exactement 4 chiffres."]
    }
}
```

### Erreurs d'authentification (401)
```json
{
    "success": false,
    "message": "Code PIN incorrect"
}
```

### Token expiré (401)
```json
{
    "success": false,
    "message": "Token expiré",
    "error_code": "TOKEN_EXPIRED"
}
```

### Token invalide (401)
```json
{
    "success": false,
    "message": "Token invalide",
    "error_code": "TOKEN_INVALID"
}
```

### Token manquant (401)
```json
{
    "success": false,
    "message": "Token manquant",
    "error_code": "TOKEN_ABSENT"
}
```

## Tests avec cURL

### Inscription
```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"phone_number":"677123456","pin":"1234"}'
```

### Connexion
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone_number":"677123456","pin":"1234"}'
```

### Profil (remplacez {token} par le vrai token)
```bash
curl -X GET http://localhost:8000/api/auth/me \
  -H "Authorization: Bearer {token}"
```

## Tests avec Postman

1. Importez cette collection dans Postman
2. Créez une variable d'environnement `base_url` = `http://localhost:8000/api`
3. Créez une variable `token` pour stocker le JWT
4. Testez les endpoints dans l'ordre : register → login → me

## Validation des numéros camerounais

L'API accepte les formats suivants pour les numéros camerounais :
- `677123456` (format préféré)
- `6 77 12 34 56`
- `677-12-34-56`

Tous sont convertis en format `677123456` (9 chiffres commençant par 6).