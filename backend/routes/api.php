<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\TontineController;

use App\Http\Controllers\Api\ProfileController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group. Enjoy building your API!
|
*/

// Routes d'authentification
Route::group(['prefix' => 'auth'], function () {
    Route::post('register', [AuthController::class, 'register']);
    Route::post('login', [AuthController::class, 'login']);
    
    // Routes protégées par JWT
    Route::middleware('auth:api')->group(function () {
        Route::get('me', [AuthController::class, 'me']);
        Route::post('logout', [AuthController::class, 'logout']);
        Route::post('refresh', [AuthController::class, 'refresh']);
        Route::post('tontine', [TontineController::class, 'store']);
        Route::get('status', [AuthController::class, 'status']);

        // Routes de profil
        Route::get('profile', [ProfileController::class, 'show']);
        Route::put('profile', [ProfileController::class, 'update']);
    });
});

// Route de test
Route::get('/test', function () {
    return response()->json([
        'message' => 'Nkap API is running!',
        'version' => '1.0.0',
        'timestamp' => now()->toISOString()
    ]);
});

// Route protégée pour tester l'authentification
Route::middleware('auth:api')->get('/user', function (Request $request) {
    return $request->user();
});
