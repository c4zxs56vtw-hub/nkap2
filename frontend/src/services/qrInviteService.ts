import { secureStore as SecureStore } from '../utils/secureStore';
import { getTontineById, MY_TONTINES, type MyTontine } from './tontineChatService';

const DYNAMIC_INVITES_KEY = 'nkap_dynamic_invites';

export interface TontineInviteInfo {
  tontineId: string;
  token: string;
  title: string;
  subtitle: string;
  poolAmount: string;
  memberCount: number;
  maxMembers: number;
  spotsLeft: number;
  isPrivate: boolean;
  treasurerName: string;
  icon: MyTontine['icon'];
  iconBg: string;
  iconColor: string;
}

/** Tokens d'invitation mock (à remplacer par l'API). */
const INVITE_TOKENS: Record<string, string> = {
  'voyage-2024': 'NKAP-V2024',
  'epargne-famille': 'NKAP-EF2024',
  'scolarite-septembre': 'NKAP-SC2024',
};

const INVITE_META: Record<string, Omit<TontineInviteInfo, 'tontineId' | 'token'>> = {
  'voyage-2024': {
    title: 'Voyage 2024',
    subtitle: 'Collectif Famille',
    poolAmount: '1 250 000 FCFA',
    memberCount: 8,
    maxMembers: 12,
    spotsLeft: 4,
    isPrivate: true,
    treasurerName: 'Sarah Douala',
    icon: 'airplane',
    iconBg: '#06b6d41a',
    iconColor: '#00687a',
  },
  'epargne-famille': {
    title: 'Épargne Famille',
    subtitle: 'Mensuel',
    poolAmount: '2 000 000 FCFA',
    memberCount: 6,
    maxMembers: 10,
    spotsLeft: 4,
    isPrivate: false,
    treasurerName: 'Aminata Keita',
    icon: 'home',
    iconBg: '#6cf8bb33',
    iconColor: '#006c49',
  },
  'scolarite-septembre': {
    title: 'Scolarité Septembre',
    subtitle: 'Privé',
    poolAmount: '300 000 FCFA',
    memberCount: 5,
    maxMembers: 8,
    spotsLeft: 3,
    isPrivate: true,
    treasurerName: 'Marie Ngo',
    icon: 'school',
    iconBg: '#ffd9e41f',
    iconColor: '#b4136d',
  },
};

export function getInviteToken(tontineId: string): string {
  return INVITE_TOKENS[tontineId] ?? `NKAP-${tontineId.slice(0, 6).toUpperCase()}`;
}

export function buildInviteUrl(tontineId: string, token?: string): string {
  const t = token ?? getInviteToken(tontineId);
  return `https://nkap.app/join/${tontineId}?token=${encodeURIComponent(t)}`;
}

export function buildQrImageUrl(inviteUrl: string, size = 280): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(inviteUrl)}`;
}

export type ParsedInvite = { tontineId: string; token: string };

/** Décode un QR ou un lien collé. */
export function parseInvitePayload(raw: string): ParsedInvite | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  try {
    if (trimmed.startsWith('{')) {
      const json = JSON.parse(trimmed) as { tontineId?: string; inviteToken?: string; token?: string };
      const tontineId = json.tontineId;
      const token = json.inviteToken ?? json.token;
      if (tontineId && token) return { tontineId, token };
    }

    const withProtocol = trimmed.includes('://') ? trimmed : `https://nkap.app/${trimmed}`;
    const url = new URL(withProtocol);

    const joinMatch = url.pathname.match(/\/join\/([^/]+)/i);
    const tontineId =
      joinMatch?.[1] ??
      url.searchParams.get('tontineId') ??
      url.searchParams.get('id') ??
      undefined;
    const token =
      url.searchParams.get('token') ??
      url.searchParams.get('invite') ??
      url.searchParams.get('inviteToken') ??
      undefined;

    if (tontineId && token) return { tontineId: decodeURIComponent(tontineId), token };
  } catch {
    // fall through
  }

  const legacy = trimmed.match(/join[/:]([a-zA-Z0-9-]+).*token[=:]([A-Za-z0-9-]+)/i);
  if (legacy) return { tontineId: legacy[1], token: legacy[2] };

  return null;
}

async function loadDynamicInvites(): Promise<Record<string, TontineInviteInfo>> {
  try {
    const raw = await SecureStore.getItemAsync(DYNAMIC_INVITES_KEY);
    if (raw) return JSON.parse(raw) as Record<string, TontineInviteInfo>;
  } catch {
    // ignore
  }
  return {};
}

async function saveDynamicInvites(map: Record<string, TontineInviteInfo>) {
  await SecureStore.setItemAsync(DYNAMIC_INVITES_KEY, JSON.stringify(map));
}

export async function registerDynamicInvite(info: TontineInviteInfo) {
  const map = await loadDynamicInvites();
  map[info.tontineId] = info;
  await saveDynamicInvites(map);
}

export async function getInviteInfo(tontineId: string): Promise<TontineInviteInfo | null> {
  const dynamic = await loadDynamicInvites();
  if (dynamic[tontineId]) return dynamic[tontineId];

  const meta = INVITE_META[tontineId];
  const tontine = getTontineById(tontineId);
  if (!meta && !tontine) return null;

  if (meta) {
    return {
      tontineId,
      token: getInviteToken(tontineId),
      ...meta,
    };
  }

  if (tontine) {
    return {
      tontineId,
      token: getInviteToken(tontineId),
      title: tontine.title,
      subtitle: tontine.subtitle,
      poolAmount: tontine.poolAmount,
      memberCount: tontine.activeMembers,
      maxMembers: tontine.activeMembers + 4,
      spotsLeft: 4,
      isPrivate: false,
      treasurerName: tontine.treasurerName,
      icon: tontine.icon,
      iconBg: tontine.iconBg,
      iconColor: tontine.iconColor,
    };
  }

  return null;
}

export type InviteValidation =
  | { ok: true; invite: TontineInviteInfo }
  | { ok: false; error: string };

export async function validateInvite(tontineId: string, token: string): Promise<InviteValidation> {
  const invite = await getInviteInfo(tontineId);
  if (!invite) {
    return { ok: false, error: 'Cette tontine est introuvable ou l’invitation a expiré.' };
  }

  const expected = invite.token.toUpperCase();
  if (token.toUpperCase() !== expected) {
    return { ok: false, error: 'Code d’invitation invalide. Demandez un nouveau QR au trésorier.' };
  }

  if (invite.spotsLeft <= 0) {
    return { ok: false, error: 'Cette tontine est complète. Plus aucune place disponible.' };
  }

  return { ok: true, invite };
}

export function slugifyTontineName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
}

export function generateInviteToken(): string {
  return `NKAP-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

export async function createInviteFromTontineName(
  tontineName: string,
  isPrivate: boolean
): Promise<TontineInviteInfo> {
  const tontineId = `tontine-${slugifyTontineName(tontineName)}-${Date.now().toString(36).slice(-4)}`;
  const token = generateInviteToken();
  const info: TontineInviteInfo = {
    tontineId,
    token,
    title: tontineName,
    subtitle: isPrivate ? 'Privée · Sur invitation' : 'Publique',
    poolAmount: '—',
    memberCount: 1,
    maxMembers: 10,
    spotsLeft: 9,
    isPrivate,
    treasurerName: 'Vous (créateur)',
    icon: 'home',
    iconBg: '#6cf8bb33',
    iconColor: '#006c49',
  };
  await registerDynamicInvite(info);
  return info;
}

export const DEMO_SCAN_LINKS = MY_TONTINES.map((t) => ({
  label: t.title,
  url: buildInviteUrl(t.id),
}));
