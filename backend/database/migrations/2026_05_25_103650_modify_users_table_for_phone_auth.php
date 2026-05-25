<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class ModifyUsersTableForPhoneAuth extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('users', function (Blueprint $table) {
            // Supprimer les colonnes par défaut de Laravel
            $table->dropColumn(['name', 'email', 'email_verified_at', 'password']);
            
            // Ajouter les nouvelles colonnes pour l'authentification par téléphone
            $table->string('phone_number', 15)->unique()->after('id');
            $table->string('pin')->after('phone_number');
            $table->string('full_name')->nullable()->after('pin');
            $table->enum('kyc_status', ['PENDING', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED', 'SUBMITTED'])
                  ->default('PENDING')->after('full_name');
            $table->boolean('is_phone_verified')->default(false)->after('kyc_status');
            $table->timestamp('phone_verified_at')->nullable()->after('is_phone_verified');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('users', function (Blueprint $table) {
            // Restaurer les colonnes originales
            $table->dropColumn([
                'phone_number', 
                'pin', 
                'full_name', 
                'kyc_status', 
                'is_phone_verified', 
                'phone_verified_at'
            ]);
            
            $table->string('name')->after('id');
            $table->string('email')->unique()->after('name');
            $table->timestamp('email_verified_at')->nullable()->after('email');
            $table->string('password')->after('email_verified_at');
        });
    }
}
