<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        // Utilisateur de test 1 - KYC en attente
        User::create([
            'phone_number' => '677123456',
            'pin' => Hash::make('1234'),
            'full_name' => 'Jean Dupont',
            'kyc_status' => User::KYC_STATUS_PENDING,
            'is_phone_verified' => true,
            'phone_verified_at' => now(),
        ]);

        // Utilisateur de test 2 - KYC vérifié
        User::create([
            'phone_number' => '699876543',
            'pin' => Hash::make('5678'),
            'full_name' => 'Marie Kamga',
            'kyc_status' => User::KYC_STATUS_VERIFIED,
            'is_phone_verified' => true,
            'phone_verified_at' => now(),
        ]);

        // Utilisateur de test 3 - KYC en cours de révision
        User::create([
            'phone_number' => '655111222',
            'pin' => Hash::make('9999'),
            'full_name' => 'Paul Mbarga',
            'kyc_status' => User::KYC_STATUS_UNDER_REVIEW,
            'is_phone_verified' => true,
            'phone_verified_at' => now(),
        ]);

        $this->command->info('3 utilisateurs de test créés avec succès !');
        $this->command->info('Utilisateur 1: 677123456 / PIN: 1234 (KYC: PENDING)');
        $this->command->info('Utilisateur 2: 699876543 / PIN: 5678 (KYC: VERIFIED)');
        $this->command->info('Utilisateur 3: 655111222 / PIN: 9999 (KYC: UNDER_REVIEW)');
    }
}
