// pages/register.tsx

import RegisterDomain from "@/components/Register/Register";
import Head from "next/head";

export default function Register() {
  return (
    <>
      <Head>
        <title>Register Domain | Domain Hub</title>
        <meta
          name="description"
          content="Register your domain in the cross-chain registry to link addresses from multiple blockchains."
        />
      </Head>
      <RegisterDomain />
    </>
  );
}
