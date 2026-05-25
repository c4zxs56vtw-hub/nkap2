<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('tontines', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->decimal('target_amount', 12, 2);
            $table->date('start_date');
            $table->date('end_date')->nullable();
            $table->integer('members_limit')->nullable();
            $table->timestamps();
        });
    }
    public function down(): void {
        Schema::dropIfExists('tontines');
    }
};
