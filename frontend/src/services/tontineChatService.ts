import { secureStore as SecureStore } from '../utils/secureStore';

export type TontineRole = 'TRÉSORIER' | 'MEMBRE' | 'ADMIN';

export interface TontineChatMessage {
  id: string;
  senderName?: string;
  senderRole?: TontineRole;
  content?: string;
  timestamp: string;
  isMe: boolean;
  type: 'text' | 'system' | 'image';
  imageUrl?: string;
  status?: 'sent' | 'delivered' | 'read';
}

export interface MyTontine {
  id: string;
  title: string;
  subtitle: string;
  poolAmount: string;
  activeMembers: number;
  progress: number;
  icon: 'airplane' | 'home' | 'school';
  iconBg: string;
  iconColor: string;
  treasurerName: string;
  memberName: string;
}

export const MY_TONTINES: MyTontine[] = [
  {
    id: '101',
    title: 'Voyage 2024',
    subtitle: 'Collectif Famille',
    poolAmount: '1 250 000 FCFA',
    activeMembers: 8,
    progress: 45,
    icon: 'airplane',
    iconBg: '#06b6d41a',
    iconColor: '#00687a',
    treasurerName: 'Sarah Douala',
    memberName: "Marc N'diaye",
  },
  {
    id: '102',
    title: 'Épargne Famille',
    subtitle: 'Mensuel',
    poolAmount: '2 000 000 FCFA',
    activeMembers: 6,
    progress: 40,
    icon: 'home',
    iconBg: '#6cf8bb33',
    iconColor: '#006c49',
    treasurerName: 'Aminata Keita',
    memberName: 'Jean-Paul Fotsing',
  },
  {
    id: '103',
    title: 'Scolarité Septembre',
    subtitle: 'Privé',
    poolAmount: '300 000 FCFA',
    activeMembers: 5,
    progress: 50,
    icon: 'school',
    iconBg: '#ffd9e41f',
    iconColor: '#b4136d',
    treasurerName: 'Marie Ngo',
    memberName: 'David Tchamba',
  },
];

const STORAGE_PREFIX = 'tontine_chat_';

function storageKey(tontineId: string | number) {
  return `${STORAGE_PREFIX}${tontineId}`;
}

export function getTontineById(id: string | number): MyTontine | undefined {
  return MY_TONTINES.find((t) => String(t.id) === String(id));
}

export function getInitialMessages(tontineId: string | number): TontineChatMessage[] {
  const t = getTontineById(tontineId);
  const idStr = String(tontineId);
  if (!t) return getInitialMessages('101');

  if (idStr === '101' || idStr === 'voyage-2024') {
    return [
      {
        id: '1',
        senderName: t.treasurerName,
        senderRole: 'TRÉSORIER',
        content:
          'Bonjour l’équipe ! J’ai bien reçu les cotisations de 5 membres pour ce tour. Plus que 3 ! 🌴',
        timestamp: '09:15',
        isMe: false,
        type: 'text',
      },
      {
        id: '2',
        content:
          'Super Sarah ! Je viens d’envoyer la mienne via le portefeuille mobile. Tu devrais la voir d’ici peu. 💸',
        timestamp: '09:18',
        isMe: true,
        type: 'text',
        status: 'read',
      },
      {
        id: '3',
        content: 'Versement de 150 000 FCFA validé par le système.',
        timestamp: '09:20',
        isMe: false,
        type: 'system',
      },
      {
        id: '4',
        senderName: t.memberName,
        senderRole: 'MEMBRE',
        content:
          'Confirmé pour moi aussi. On se rapproche de l’objectif pour le voyage ! On regarde les billets ce week-end ?',
        timestamp: '09:42',
        isMe: false,
        type: 'text',
      },
      {
        id: '5',
        senderName: t.treasurerName,
        senderRole: 'TRÉSORIER',
        timestamp: '09:45',
        isMe: false,
        type: 'image',
        imageUrl:
          'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
      },
    ];
  }

  if (idStr === '102' || idStr === 'epargne-famille') {
    return [
      {
        id: '1',
        senderName: t.treasurerName,
        senderRole: 'TRÉSORIER',
        content:
          'Bonjour à tous ! Le tour de février est ouvert. Merci de cotiser avant vendredi. 🏠',
        timestamp: '08:30',
        isMe: false,
        type: 'text',
      },
      {
        id: '2',
        senderName: t.memberName,
        senderRole: 'MEMBRE',
        content: 'C’est fait de mon côté, versement Mobile Money envoyé.',
        timestamp: '08:45',
        isMe: false,
        type: 'text',
      },
      {
        id: '3',
        content: 'Parfait, je viens de valider ma part aussi !',
        timestamp: '09:02',
        isMe: true,
        type: 'text',
        status: 'read',
      },
    ];
  }

  return [
    {
      id: '1',
      senderName: t.treasurerName,
      senderRole: 'TRÉSORIER',
      content:
        'Rappel : les frais de scolarité du prochain tour doivent être réunis avant le 15. 📚',
      timestamp: '14:10',
      isMe: false,
      type: 'text',
    },
    {
      id: '2',
      content: 'J’ai une question sur le montant de ma cotisation ce mois-ci.',
      timestamp: '14:22',
      isMe: true,
      type: 'text',
      status: 'read',
    },
    {
      id: '3',
      senderName: t.memberName,
      senderRole: 'MEMBRE',
      content: 'Moi aussi, on peut en parler ici pour que tout le monde soit aligné.',
      timestamp: '14:25',
      isMe: false,
      type: 'text',
    },
  ];
}

export async function loadTontineMessages(tontineId: string): Promise<TontineChatMessage[]> {
  try {
    const raw = await SecureStore.getItemAsync(storageKey(tontineId));
    if (raw) {
      const parsed = JSON.parse(raw) as TontineChatMessage[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // fallback to defaults
  }
  return getInitialMessages(tontineId);
}

export async function saveTontineMessages(
  tontineId: string,
  messages: TontineChatMessage[]
): Promise<void> {
  try {
    await SecureStore.setItemAsync(storageKey(tontineId), JSON.stringify(messages));
  } catch {
    // ignore persistence errors in demo
  }
}

export function getMessagePreview(msg: TontineChatMessage): string {
  if (msg.type === 'system') return msg.content ?? 'Notification système';
  if (msg.type === 'image') return '📷 Photo';
  if (msg.isMe) return `Vous : ${msg.content ?? ''}`;
  return `${msg.senderName ?? 'Membre'} : ${msg.content ?? ''}`;
}

export async function getTontineChatSummary(tontineId: string): Promise<{
  preview: string;
  time: string;
}> {
  const messages = await loadTontineMessages(tontineId);
  const last = messages[messages.length - 1];
  if (!last) {
    return { preview: 'Aucun message — commencez la discussion', time: '' };
  }
  return {
    preview: getMessagePreview(last),
    time: last.timestamp,
  };
}
