<?php

require_once 'vendor/autoload.php';

// Charger les variables d'environnement
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

echo "🔍 Test de connexion à Neon Database\n";
echo "=====================================\n\n";

// Afficher la configuration
echo "Configuration actuelle :\n";
echo "Host: " . $_ENV['DB_HOST'] . "\n";
echo "Port: " . $_ENV['DB_PORT'] . "\n";
echo "Database: " . $_ENV['DB_DATABASE'] . "\n";
echo "Username: " . $_ENV['DB_USERNAME'] . "\n";
echo "SSL Mode: " . ($_ENV['DB_SSLMODE'] ?? 'non défini') . "\n";
echo "Options: " . ($_ENV['DB_OPTIONS'] ?? 'non défini') . "\n\n";

// Extraire l'endpoint ID du host
$host = $_ENV['DB_HOST'];
$endpointId = explode('-', explode('.', $host)[0])[1] . '-' . explode('-', explode('.', $host)[0])[2] . '-' . explode('-', explode('.', $host)[0])[3];

// Test de connexion PDO direct avec endpoint
try {
    $dsn = sprintf(
        "pgsql:host=%s;port=%s;dbname=%s;sslmode=%s;options=endpoint=%s",
        $_ENV['DB_HOST'],
        $_ENV['DB_PORT'],
        $_ENV['DB_DATABASE'],
        $_ENV['DB_SSLMODE'] ?? 'require',
        'ep-misty-bonus-aqjebnep'
    );
    
    echo "🔗 Tentative de connexion avec endpoint...\n";
    echo "DSN: " . str_replace($_ENV['DB_PASSWORD'], '***', $dsn) . "\n\n";
    
    $pdo = new PDO($dsn, $_ENV['DB_USERNAME'], $_ENV['DB_PASSWORD'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_TIMEOUT => 30,
    ]);
    
    echo "✅ Connexion réussie !\n";
    echo "Driver: " . $pdo->getAttribute(PDO::ATTR_DRIVER_NAME) . "\n";
    echo "Version serveur: " . $pdo->getAttribute(PDO::ATTR_SERVER_VERSION) . "\n";
    
    // Test d'une requête simple
    $stmt = $pdo->query("SELECT version()");
    $version = $stmt->fetchColumn();
    echo "Version PostgreSQL: " . substr($version, 0, 50) . "...\n\n";
    
    // Test de création d'une table simple
    echo "🧪 Test de création d'une table...\n";
    $pdo->exec("CREATE TABLE IF NOT EXISTS test_connection (id SERIAL PRIMARY KEY, created_at TIMESTAMP DEFAULT NOW())");
    $pdo->exec("INSERT INTO test_connection DEFAULT VALUES");
    $stmt = $pdo->query("SELECT COUNT(*) FROM test_connection");
    $count = $stmt->fetchColumn();
    echo "Nombre d'enregistrements de test: " . $count . "\n";
    $pdo->exec("DROP TABLE test_connection");
    
    echo "\n🎉 La connexion à Neon fonctionne parfaitement !\n";
    echo "✅ Vous pouvez maintenant exécuter: php artisan migrate\n";
    
} catch (PDOException $e) {
    echo "❌ Erreur de connexion :\n";
    echo $e->getMessage() . "\n\n";
    
    echo "🔧 Solutions possibles :\n";
    echo "1. Vérifiez que l'endpoint ID est correct dans la configuration\n";
    echo "2. Essayez d'utiliser la chaîne de connexion complète dans DATABASE_URL\n";
    echo "3. Vérifiez que votre projet Neon est actif\n";
    echo "4. Contactez le support Neon si le problème persiste\n\n";
    
    echo "💡 Essayez d'ajouter ceci dans votre .env :\n";
    echo "DATABASE_URL=\"postgresql://neondb_owner:npg_NX9c1GVWQzhA@ep-misty-bonus-aqjebnep-pooler.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require&options=endpoint%3Dep-misty-bonus-aqjebnep\"\n";
}