import Layout from "../components/Layout";

const Governance = () => {
  return (
    <Layout>
      <>
        <div className="flex flex-wrap justify-between gap-3 p-4">
          <div className="flex min-w-72 flex-col gap-3">
            <p className="tracking-light text-[32px] leading-tight font-bold text-white">
              Governance
            </p>
            <p className="text-sm leading-normal font-normal text-[#9cabba]">
              Participate in the GlobalTrust DAO and shape the future of
              decentralized identity and asset verification.
            </p>
          </div>
        </div>
        <h2 className="px-4 pt-5 pb-3 text-[22px] leading-tight font-bold tracking-[-0.015em] text-white">
          Active Proposals
        </h2>
        <div className="p-4">
          <div className="flex items-stretch justify-between gap-4 rounded-lg">
            <div className="flex flex-[2_2_0px] flex-col gap-1">
              <p className="text-sm leading-normal font-normal text-[#9cabba]">
                Proposal #123
              </p>
              <p className="text-base leading-tight font-bold text-white">
                Enhance Cross-Chain Verification Protocol
              </p>
              <p className="text-sm leading-normal font-normal text-[#9cabba]">
                This proposal aims to improve the efficiency and security of our
                cross-chain verification protocol by integrating advanced AI
                algorithms. Deadline: July 15, 2024
              </p>
            </div>
            <div
              className="aspect-video w-full flex-1 rounded-lg bg-cover bg-center bg-no-repeat"
              style={{
                backgroundImage:
                  'url("https://lh3.googleusercontent.com/aida-public/AB6AXuAVV4Jj0Fgl0bUx0jmtfvWKjtBDZZ7S3weTL6yTM7a_bUqIcyIuws6qoxr982yf1SH68XASrlbCmmGsq6uRETsML9V2o5HJKikULtM5LgswTAImttPuWGJzdOk8xwrcy_DWnjvXEBZjvUSMJQiqi9_3Bvqh5EkaLA76_AI8BiG6x9I5-g_DxMMpdFA1mXyI2pXRi4Rn7TZAFm-6QrsfbzHG-rPuwdb6pUGjge0O4OLHITFqg1sKlXN9ZW1odc-UQGpYrLOlbaM2J3ao")',
              }}
            ></div>
          </div>
        </div>
        <div className="p-4">
          <div className="flex items-stretch justify-between gap-4 rounded-lg">
            <div className="flex flex-[2_2_0px] flex-col gap-1">
              <p className="text-sm leading-normal font-normal text-[#9cabba]">
                Proposal #124
              </p>
              <p className="text-base leading-tight font-bold text-white">
                Expand DAO Membership Criteria
              </p>
              <p className="text-sm leading-normal font-normal text-[#9cabba]">
                This proposal suggests broadening the criteria for DAO
                membership to encourage greater community participation and
                diversity. Deadline: July 22, 2024
              </p>
            </div>
            <div
              className="aspect-video w-full flex-1 rounded-lg bg-cover bg-center bg-no-repeat"
              style={{
                backgroundImage:
                  'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDv2d2ASig4P2SpmBCxKe3Ey1H_fU-lYgaQgKTufUq_Py0XMp-8s2lxvQ68XgXUDNH0sNpt4bZv-onIa_7b-55MSYuCcD-fqwjjqj7TrRSTeMl6vSnwx8KN7QVJaxuZCqIvGpUbcXmMBCqudVGX7fEzpAIPgA-CA98JlzelY8TaO8WXszK_EUVvhnSoc97LC9rEWfFSUXClCfti7Xak1AZanSG9vvGW56YfYEcDSXVXs2DrnAB9GgcN5ubtpGoY_jn5jtfsoqS7QpNA")',
              }}
            ></div>
          </div>
        </div>
        <h2 className="px-4 pt-5 pb-3 text-[22px] leading-tight font-bold tracking-[-0.015em] text-white">
          DAO Structure
        </h2>
        <p className="px-4 pt-1 pb-3 text-base leading-normal font-normal text-white">
          The GlobalTrust DAO is composed of community members, developers, and
          experts in the fields of blockchain, AI, and identity verification.
          Members contribute to decision-making through proposals and voting,
          ensuring a decentralized and community-driven approach to governance.
        </p>
        <h2 className="px-4 pt-5 pb-3 text-[22px] leading-tight font-bold tracking-[-0.015em] text-white">
          Community Forum
        </h2>
        <p className="px-4 pt-1 pb-3 text-base leading-normal font-normal text-white">
          Join the GlobalTrust community forum to discuss proposals, share
          ideas, and engage with other members. Your input is valuable in
          shaping the future of GlobalTrust.
        </p>
        <div className="flex justify-start px-4 py-3">
          <button className="flex h-10 max-w-[480px] min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg bg-[#0d80f2] px-4 text-sm leading-normal font-bold tracking-[0.015em] text-white">
            <span className="truncate">Go to Forum</span>
          </button>
        </div>
      </>
    </Layout>
  );
};

export default Governance;
