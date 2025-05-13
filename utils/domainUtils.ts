// utils/domainUtils.ts

export async function verifyDomainOwnership(
  domainName: string,
  stacksAddress: string
): Promise<{
  isOwner: boolean;
  error?: string;
  ownerAddress?: string;
}> {
  try {
    // Make sure the domain name is properly formatted
    const formattedDomainName = domainName.toLowerCase();

    // Call the BNSv2 API to check ownership
    const response = await fetch(
      `https://api.bnsv2.com/names/${formattedDomainName}/owner`
    );

    if (!response.ok) {
      const errorData = await response.json();

      if (
        response.status === 404 ||
        (errorData && errorData.error === "Name not found")
      ) {
        return {
          isOwner: false,
          error: `Domain ${formattedDomainName} not found. Make sure it exists in the BNS system.`,
        };
      }

      return {
        isOwner: false,
        error: `Failed to verify domain ownership: ${
          errorData.error || response.statusText
        }`,
      };
    }

    const data = await response.json();

    if (data.status !== "active") {
      return {
        isOwner: false,
        error: `Domain ${formattedDomainName} is not active`,
      };
    }

    const isOwner = data.owner === stacksAddress;

    return {
      isOwner,
      ownerAddress: data.owner,
      error: isOwner
        ? undefined
        : `You are not the owner of ${formattedDomainName}`,
    };
  } catch (error) {
    console.error("Error verifying domain ownership:", error);
    return {
      isOwner: false,
      error: `Failed to verify domain ownership: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    };
  }
}
