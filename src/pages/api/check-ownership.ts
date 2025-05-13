// pages/api/check-ownership.ts

import type { NextApiRequest, NextApiResponse } from "next";
import { verifyDomainOwnership } from "../../../utils/domainUtils";

type ErrorResponse = {
  error: string;
};

type SuccessResponse = {
  isOwner: boolean;
  domainName: string;
  ownerAddress?: string;
  message: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SuccessResponse | ErrorResponse>
) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { domainName, stacksAddress } = req.body;

    // Validate input
    if (!domainName || !stacksAddress) {
      return res.status(400).json({
        error: "Both domainName and stacksAddress are required",
      });
    }

    // Format the domain name
    const formattedDomainName = domainName.toLowerCase();

    // Verify domain ownership
    const ownershipInfo = await verifyDomainOwnership(
      formattedDomainName,
      stacksAddress
    );

    if (ownershipInfo.isOwner) {
      return res.status(200).json({
        isOwner: true,
        domainName: formattedDomainName,
        ownerAddress: ownershipInfo.ownerAddress,
        message: `Verified: You are the owner of ${formattedDomainName}`,
      });
    } else {
      return res.status(200).json({
        isOwner: false,
        domainName: formattedDomainName,
        ownerAddress: ownershipInfo.ownerAddress,
        message: ownershipInfo.error || "You are not the owner of this domain",
      });
    }
  } catch (error) {
    console.error("Error in check-ownership API:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
}
