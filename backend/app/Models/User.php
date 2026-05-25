<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Tymon\JWTAuth\Contracts\JWTSubject;
use Illuminate\Support\Facades\Hash;

class User extends Authenticatable implements JWTSubject
{
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'phone_number',
        'pin',
        'full_name',
        'kyc_status',
        'is_phone_verified',
        'phone_verified_at',
        'linked_account_method',
        'linked_momo_phone',
        'linked_bank_name',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'pin',
        'remember_token',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'phone_verified_at' => 'datetime',
        'is_phone_verified' => 'boolean',
    ];

    /**
     * KYC Status constants
     */
    const KYC_STATUS_PENDING = 'PENDING';
    const KYC_STATUS_UNDER_REVIEW = 'UNDER_REVIEW';
    const KYC_STATUS_VERIFIED = 'VERIFIED';
    const KYC_STATUS_REJECTED = 'REJECTED';
    const KYC_STATUS_SUBMITTED = 'SUBMITTED';

    /**
     * Get the identifier that will be stored in the subject claim of the JWT.
     *
     * @return mixed
     */
    public function getJWTIdentifier()
    {
        return $this->getKey();
    }

    /**
     * Return a key value array, containing any custom claims to be added to the JWT.
     *
     * @return array
     */
    public function getJWTCustomClaims()
    {
        return [
            'phone_number' => $this->phone_number,
            'kyc_status' => $this->kyc_status,
        ];
    }

    /**
     * Hash the PIN before saving
     */
    public function setPinAttribute($value)
    {
        $this->attributes['pin'] = Hash::make($value);
    }

    /**
     * Check if PIN matches
     */
    public function checkPin($pin)
    {
        return Hash::check($pin, $this->pin);
    }

    /**
     * Get KYC status options
     */
    public static function getKycStatusOptions()
    {
        return [
            self::KYC_STATUS_PENDING,
            self::KYC_STATUS_UNDER_REVIEW,
            self::KYC_STATUS_VERIFIED,
            self::KYC_STATUS_REJECTED,
            self::KYC_STATUS_SUBMITTED,
        ];
    }

    /**
     * Check if user is KYC verified
     */
    public function isKycVerified()
    {
        return $this->kyc_status === self::KYC_STATUS_VERIFIED;
    }

    /**
     * Format phone number for display
     */
    public function getFormattedPhoneAttribute()
    {
        // Format: +237 6XX XX XX XX
        if (strlen($this->phone_number) === 9) {
            return '+237 ' . substr($this->phone_number, 0, 1) . 'XX XX XX XX';
        }
        return $this->phone_number;
    }
}
