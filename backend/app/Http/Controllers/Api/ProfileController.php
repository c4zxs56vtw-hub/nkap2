<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class ProfileController extends Controller
{
    /**
     * Get the authenticated user's profile.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function show(Request $request)
    {
        $user = $request->user();

        return response()->json([
            'status' => 'success',
            'data' => [
                'full_name' => $user->full_name,
                'phone_number' => $user->phone_number,
                'kyc_status' => $user->kyc_status,
                'linked_account_method' => $user->linked_account_method,
                'linked_momo_phone' => $user->linked_momo_phone,
                'linked_bank_name' => $user->linked_bank_name,
            ]
        ]);
    }

    /**
     * Update the authenticated user's profile.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function update(Request $request)
    {
        $user = $request->user();

        $validatedData = $request->validate([
            'linked_account_method' => 'nullable|string|in:bank,momo',
            'linked_momo_phone' => 'nullable|string|max:15',
            'linked_bank_name' => 'nullable|string|max:100',
        ]);

        $user->update($validatedData);

        return response()->json([
            'status' => 'success',
            'message' => 'Profile updated successfully',
            'data' => [
                'full_name' => $user->full_name,
                'phone_number' => $user->phone_number,
                'kyc_status' => $user->kyc_status,
                'linked_account_method' => $user->linked_account_method,
                'linked_momo_phone' => $user->linked_momo_phone,
                'linked_bank_name' => $user->linked_bank_name,
            ]
        ]);
    }
}
