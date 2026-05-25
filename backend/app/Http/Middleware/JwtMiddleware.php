<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Tymon\JWTAuth\Facades\JWTAuth;
use Tymon\JWTAuth\Exceptions\JWTException;
use Tymon\JWTAuth\Exceptions\TokenExpiredException;
use Tymon\JWTAuth\Exceptions\TokenInvalidException;

class JwtMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure(\Illuminate\Http\Request): (\Illuminate\Http\Response|\Illuminate\Http\RedirectResponse)  $next
     * @return \Illuminate\Http\Response|\Illuminate\Http\RedirectResponse
     */
    public function handle(Request $request, Closure $next)
    {
        try {
            $user = JWTAuth::parseToken()->authenticate();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Utilisateur non trouvé'
                ], 404);
            }
            
        } catch (TokenExpiredException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Token expiré',
                'error_code' => 'TOKEN_EXPIRED'
            ], 401);
            
        } catch (TokenInvalidException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Token invalide',
                'error_code' => 'TOKEN_INVALID'
            ], 401);
            
        } catch (JWTException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Token manquant',
                'error_code' => 'TOKEN_ABSENT'
            ], 401);
        }

        return $next($request);
    }
}
