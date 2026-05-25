<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Tontine;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class TontineController extends Controller
{
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name'          => 'required|string|max:255',
            'target_amount' => 'required|numeric|min:0',
            'start_date'    => 'required|date',
            'description'   => 'nullable|string',
            'end_date'      => 'nullable|date|after_or_equal:start_date',
            'members_limit' => 'nullable|integer|min:1',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors'  => $validator->errors(),
            ], 422);
        }

        $tontine = Tontine::create($validator->validated());

        return response()->json([
            'success' => true,
            'message' => 'Tontine created',
            'data'    => $tontine,
        ], 201);
    }
}
