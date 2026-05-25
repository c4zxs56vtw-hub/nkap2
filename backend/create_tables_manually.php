<?php

require_once 'vendor/autoload.php';

// Charger les variables d'environnement
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

echo "🚀 Création manuelle des tables Nkap\n";
echo "====================================\n\n";

try {
    // Connexion avec endpoint
    $dsn = sprintf(
        "pgsql:host=%s;port=%s;dbname=%s;sslmode=%s;options=endpoint=%s",
        $_ENV['DB_HOST'],
        $_ENV['DB_PORT'],
        $_ENV['DB_DATABASE'],
        $_ENV['DB_SSLMODE'] ?? 'require',
        'ep-misty-bonus-aqjebnep'
    );
    
    $pdo = new PDO($dsn, $_ENV['DB_USERNAME'], $_ENV['DB_PASSWORD'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_TIMEOUT => 30,
    ]);
    
    echo "✅ Connexion établie\n\n";
    
    // Créer la table migrations
    echo "📋 Création de la table migrations...\n";
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS migrations (
            id SERIAL PRIMARY KEY,
            migration VARCHAR(255) NOT NULL,
            batch INTEGER NOT NULL
        )
    ");
    
    // Créer la table users
    echo "👤 Création de la table users...\n";
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS users (
            id BIGSERIAL PRIMARY KEY,
            phone_number VARCHAR(15) UNIQUE NOT NULL,
            pin VARCHAR(255) NOT NULL,
            full_name VARCHAR(255),
            kyc_status VARCHAR(20) DEFAULT 'PENDING' CHECK (kyc_status IN ('PENDING', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED', 'SUBMITTED')),
            is_phone_verified BOOLEAN DEFAULT FALSE,
            phone_verified_at TIMESTAMP,
            remember_token VARCHAR(100),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ");
    
    // Créer la table password_resets
    echo "🔑 Création de la table password_resets...\n";
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS password_resets (
            email VARCHAR(255) NOT NULL,
            token VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ");
    
    // Créer la table failed_jobs
    echo "❌ Création de la table failed_jobs...\n";
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS failed_jobs (
            id BIGSERIAL PRIMARY KEY,
            uuid VARCHAR(255) UNIQUE NOT NULL,
            connection TEXT NOT NULL,
            queue TEXT NOT NULL,
            payload TEXT NOT NULL,
            exception TEXT NOT NULL,
            failed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ");
    
    // Insérer les enregistrements de migration
    echo "📝 Enregistrement des migrations...\n";
    $migrations = [
        '2014_10_12_000000_create_users_table',
        '2014_10_12_100000_create_password_resets_table',
        '2019_08_19_000000_create_failed_jobs_table',
        '2026_05_25_103650_modify_users_table_for_phone_auth'
    ];
    
    foreach ($migrations as $index => $migration) {
        $pdo->exec("
            INSERT INTO migrations (migration, batch) 
            VALUES ('$migration', 1) 
            ON CONFLICT DO NOTHING
        ");
    }
    
    // Créer un utilisateur de test
    echo "🧪 Création d'un utilisateur de test...\n";
    $hashedPin = password_hash('1234', PASSWORD_DEFAULT);
    $pdo->exec("
        INSERT INTO users (phone_number, pin, full_name, kyc_status, is_phone_verified, phone_verified_at) 
        VALUES ('677123456', '$hashedPin', 'Jean Dupont Test', 'PENDING', true, CURRENT_TIMESTAMP)
        ON CONFLICT (phone_number) DO NOTHING
    ");
    
    echo "\n🎉 Toutes les tables ont été créées avec succès !\n";
    echo "✅ Base de données Nkap prête à l'emploi\n\n";
    
    // Vérifier les tables créées
    echo "📊 Tables créées :\n";
    $stmt = $pdo->query("
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name
    ");
    
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        echo "  - " . $row['table_name'] . "\n";
    }
    
    echo "\n🧪 Utilisateur de test créé :\n";
    echo "  📱 Téléphone: 677123456\n";
    echo "  🔐 PIN: 1234\n";
    echo "  👤 Nom: Jean Dupont Test\n";
    echo "  📋 Statut KYC: PENDING\n\n";
    
    echo "🚀 Vous pouvez maintenant tester l'API !\n";
    echo "   php artisan serve\n";
    echo "   curl -X POST http://localhost:8000/api/auth/login \\\n";
    echo "     -H \"Content-Type: application/json\" \\\n";
    echo "     -d '{\"phone_number\":\"677123456\",\"pin\":\"1234\"}'\n";
    
} catch (PDOException $e) {
    echo "❌ Erreur : " . $e->getMessage() . "\n";
    exit(1);
}