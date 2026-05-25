<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Tymon\JWTAuth\Facades\JWTAuth;
use Tymon\JWTAuth\Exceptions\JWTException;

class AuthController extends Controller
{
    /**
     * Create a new AuthController instance.
     *
     * @return void
     */
    public function __construct()
    {
        $this->middleware('auth:api', ['except' => ['login', 'register']]);
    }

    /**
     * Register a new user
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'phone_number' => 'required|string|min:9|max:15|unique:users',
            'pin' => 'required|string|min:4|max:4|regex:/^[0-9]{4}$/',
        ], [
            'phone_number.required' => 'Le numéro de téléphone est requis.',
            'phone_number.unique' => 'Ce numéro de téléphone est déjà utilisé.',
            'phone_number.min' => 'Le numéro de téléphone doit contenir au moins 9 chiffres.',
            'pin.required' => 'Le code PIN est requis.',
            'pin.min' => 'Le code PIN doit contenir exactement 4 chiffres.',
            'pin.max' => 'Le code PIN doit contenir exactement 4 chiffres.',
            'pin.regex' => 'Le code PIN doit contenir uniquement des chiffres.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur de validation',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Nettoyer le numéro de téléphone (supprimer espaces, tirets, etc.)
            $phoneNumber = preg_replace('/[^0-9]/', '', $request->phone_number);
            
            // Vérifier le format camerounais (6XXXXXXXX)
            if (!preg_match('/^6[0-9]{8}$/', $phoneNumber)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Format de numéro invalide. Utilisez le format: 6XXXXXXXX'
                ], 422);
            }

            $user = User::create([
                'phone_number' => $phoneNumber,
                'pin' => $request->pin, // Sera hashé automatiquement par le mutateur
                'kyc_status' => User::KYC_STATUS_PENDING,
                'is_phone_verified' => false,
            ]);

            // Générer le token JWT
            $token = JWTAuth::fromUser($user);

            return response()->json([
                'success' => true,
                'message' => 'Compte créé avec succès',
                'data' => [
                    'user' => [
                        'id' => $user->id,
                        'phone_number' => $user->phone_number,
                        'kyc_status' => $user->kyc_status,
                        'is_phone_verified' => $user->is_phone_verified,
                    ],
                    'token' => $token,
                    'status' => $user->kyc_status,
                ]
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la création du compte',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Login user
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'phone_number' => 'required|string',
            'pin' => 'required|string|min:4|max:4',
        ], [
            'phone_number.required' => 'Le numéro de téléphone est requis.',
            'pin.required' => 'Le code PIN est requis.',
            'pin.min' => 'Le code PIN doit contenir 4 chiffres.',
            'pin.max' => 'Le code PIN doit contenir 4 chiffres.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur de validation',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Nettoyer le numéro de téléphone
            $phoneNumber = preg_replace('/[^0-9]/', '', $request->phone_number);

            // Trouver l'utilisateur
            $user = User::where('phone_number', $phoneNumber)->first();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Numéro de téléphone non trouvé'
                ], 404);
            }

            // Vérifier le PIN
            if (!$user->checkPin($request->pin)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Code PIN incorrect'
                ], 401);
            }

            // Générer le token JWT
            $token = JWTAuth::fromUser($user);

            return response()->json([
                'success' => true,
                'message' => 'Connexion réussie',
                'data' => [
                    'user' => [
                        'id' => $user->id,
                        'phone_number' => $user->phone_number,
                        'full_name' => $user->full_name,
                        'kyc_status' => $user->kyc_status,
                        'is_phone_verified' => $user->is_phone_verified,
                    ],
                    'token' => $token,
                    'status' => $user->kyc_status,
                ]
            ], 200);

        } catch (JWTException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Impossible de créer le token'
            ], 500);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la connexion',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get the authenticated User
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function me()
    {
        try {
            $user = auth()->user();
            
            return response()->json([
                'success' => true,
                'data' => [
                    'user' => [
                        'id' => $user->id,
                        'phone_number' => $user->phone_number,
                        'full_name' => $user->full_name,
                        'kyc_status' => $user->kyc_status,
                        'is_phone_verified' => $user->is_phone_verified,
                        'phone_verified_at' => $user->phone_verified_at,
                        'created_at' => $user->created_at,
                    ]
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Utilisateur non trouvé'
            ], 404);
        }
    }

    /**
     * Log the user out (Invalidate the token)
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function logout()
    {
        try {
            auth()->logout();

            return response()->json([
                'success' => true,
                'message' => 'Déconnexion réussie'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la déconnexion'
            ], 500);
        }
    }

    /**
     * Refresh a token
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function refresh()
    {
        try {
            $token = auth()->refresh();
            $user = auth()->user();

            return response()->json([
                'success' => true,
                'message' => 'Token rafraîchi avec succès',
                'data' => [
                    'user' => [
                        'id' => $user->id,
                        'phone_number' => $user->phone_number,
                        'full_name' => $user->full_name,
                        'kyc_status' => $user->kyc_status,
                        'is_phone_verified' => $user->is_phone_verified,
                    ],
                    'token' => $token,
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Impossible de rafraîchir le token'
            ], 500);
        }
    }

    /**
     * Get user status for routing decisions
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function status()
    {
        try {
            $user = auth()->user();
            
            return response()->json([
                'success' => true,
                'data' => [
                    'kyc_status' => $user->kyc_status,
                    'is_phone_verified' => $user->is_phone_verified,
                    'needs_kyc' => !$user->isKycVerified(),
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Impossible de récupérer le statut'
            ], 500);
        }
    }
}
