import { Redirect, useLocalSearchParams } from 'expo-router';

/** Deep link : /join/voyage-2024?token=NKAP-V2024 */
export default function JoinDeepLinkScreen() {
  const { id, token, invite } = useLocalSearchParams<{
    id: string;
    token?: string;
    invite?: string;
  }>();

  return (
    <Redirect
      href={{
        pathname: '/join-tontine',
        params: {
          id: id ?? '',
          token: (token ?? invite ?? '') as string,
        },
      }}
    />
  );
}
