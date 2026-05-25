<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddProfileFieldsToUsersTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('linked_account_method')->nullable()->after('phone_verified_at');
            $table->string('linked_momo_phone')->nullable()->after('linked_account_method');
            $table->string('linked_bank_name')->nullable()->after('linked_momo_phone');
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
            $table->dropColumn(['linked_account_method', 'linked_momo_phone', 'linked_bank_name']);
        });
    }
}
