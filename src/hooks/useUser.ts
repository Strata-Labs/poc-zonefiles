// hooks/useUser.ts

import { useEffect } from "react";
import { useStacksAuthContext } from "../contexts/StacksAuthContext";
import { trpc } from "../../utils/trpc";

export function useUser() {
  const { authenticated, senderAddresses } = useStacksAuthContext();
  const utils = trpc.useContext();

  const { data: user, isLoading } = trpc.user.getByStacksAddress.useQuery(
    { stacksAddress: senderAddresses.mainnet },
    { enabled: authenticated && !!senderAddresses.mainnet }
  );

  const createUserMutation = trpc.user.create.useMutation({
    onSuccess: () => {
      utils.user.getByStacksAddress.invalidate({
        stacksAddress: senderAddresses.mainnet,
      });
    },
  });

  // When a user authenticates, ensure they exist in our database
  useEffect(() => {
    if (authenticated && senderAddresses.mainnet && !user && !isLoading) {
      createUserMutation.mutate({ stacksAddress: senderAddresses.mainnet });
    }
  }, [authenticated, senderAddresses.mainnet, user, isLoading]);

  return {
    user,
    isLoading,
    isCreating: createUserMutation.isLoading,
  };
}
