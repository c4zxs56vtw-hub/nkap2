export interface UserDetail {
  id: string;
  name: string;
  phone: string;
  kycStatus: string;
  rawKycStatus: string;
  mobileMoneyNumber: string;
  balance: string;
  isBlacklisted: boolean;
  blacklistedReason: string;
  isActive: boolean;
  role: string;
  tontinesCount: number;
}

export interface Transaction360 {
  id: number;
  label: string;
  subtitle: string;
  amount: number;
  direction: string;
  status: string;
  method: string;
  created_at: string;
}

export interface Tontine360 {
  id: number;
  title: string;
  subtitle: string;
  pool_amount: number;
  progress: number;
  icon: string;
  icon_bg: string;
  icon_color: string;
  treasurer_name: string;
}

export interface SupportMessage360 {
  id: number;
  content: string;
  sender_name: string;
  sender_role: string;
  message_type: string;
  created_at: string;
  is_from_user: boolean;
}

export interface User360Data {
  personal_info: {
    id: string;
    name: string;
    phone: string;
    email: string;
    country: string;
    role: string;
    date_joined: string;
    trust_score: number;
    balance: number;
    kyc_status: string;
    kyc_rejection_reason: string;
    identity_document: string;
    mobile_money_number: string;
    is_blacklisted: boolean;
    blacklisted_reason: string;
    is_active: boolean;
  };
  transactions: Transaction360[];
  tontines: Tontine360[];
  support_messages: SupportMessage360[];
}
