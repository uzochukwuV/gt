import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { backendService } from "../services/backendService";
import { lendingService } from "../services/lendingService";
import { marketplaceService } from "../services/marketplaceService";
import { fileService, type FileMetadata } from "../services/fileService";
import {
  bridgeService,
  type CrossChainTransfer,
} from "../services/bridgeService";
import Layout from "../components/Layout";
import {
  Identity,
  AuditEntry,
} from "../../../declarations/backend/backend.did";

const Dashboard = () => {
  const {
    isAuthenticated,
    principal,
    backendActor,
    lendingActor,
    marketplaceActor,
  } = useAuth();
  const [userIdentities, setUserIdentities] = useState<Identity[]>([]);
  const [auditTrail] = useState<AuditEntry[]>([]);
  const [lendingStats, setLendingStats] = useState<any>(null);
  const [marketplaceStats, setMarketplaceStats] = useState<any>(null);
  const [userFiles, setUserFiles] = useState<FileMetadata[]>([]);
  const [bridgeHistory, setBridgeHistory] = useState<CrossChainTransfer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      if (isAuthenticated && backendActor) {
        try {
          setLoading(true);
          const [identities, files, bridgeTransfers] = await Promise.all([
            backendService.getMyIdentities(),
            fileService.getUserFiles(),
            bridgeService.getUserBridgeHistory(),
          ]);

          setUserIdentities(identities);
          setUserFiles(files);
          setBridgeHistory(bridgeTransfers);

          // backendService.getAuditTrail(principal.toText()).then(setAuditTrail);
        } catch (error) {
          console.error("Failed to load dashboard data:", error);
        } finally {
          setLoading(false);
        }
      }

      if (lendingActor) {
        lendingService(lendingActor).getLendingStats().then(setLendingStats);
      }
      if (marketplaceActor) {
        marketplaceService(marketplaceActor)
          .getMarketplaceStats()
          .then(setMarketplaceStats);
      }
    };

    loadDashboardData();
  }, [isAuthenticated, backendActor, lendingActor, marketplaceActor]);

  return (
    <Layout>
      <>
        <div className="flex flex-wrap justify-between gap-3 p-4">
          <div className="flex min-w-72 flex-col gap-3">
            <p className="tracking-light text-[32px] leading-tight font-bold text-white">
              Dashboard
            </p>
            {isAuthenticated ? (
              <p className="text-sm leading-normal font-normal text-[#9cabba]">
                Welcome back, {principal?.toText()}
              </p>
            ) : (
              <p className="text-sm leading-normal font-normal text-[#9cabba]">
                Please log in to continue
              </p>
            )}
          </div>
        </div>
        {isAuthenticated && (
          <>
            <div className="@container flex p-4">
              <div className="flex w-full flex-col gap-4 @[520px]:flex-row @[520px]:items-center @[520px]:justify-between">
                <div className="flex gap-4">
                  <div
                    className="aspect-square min-h-32 w-32 rounded-full bg-cover bg-center bg-no-repeat"
                    style={{
                      backgroundImage:
                        'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDpUEAsKp38h69A6MPP7d7OHvElJJHDd7lXJzxX1RCZQ5C4qxpFbsxMRic1HfxSiYouXC51lHNi5Al0TPptgOFRhJXrDHUb0ihnaqLXHbfV2x963fG9wc75EFYW7spEn0dBNGkLanp_NGbhGsZObqtEmuu0rSl-r0KWcmiPvKWnNHvR5nYAkEFsmL3tOBL0o9KRgLnAWm7M9Y0zN84sR8Qf9jyfD30KtqMoux7-UlFbwNHr-u6Ar_Y3xblzQ1fVhc56Y8ETQgivl98")',
                    }}
                  ></div>
                  <div className="flex flex-col justify-center">
                    <p className="text-[22px] leading-tight font-bold tracking-[-0.015em] text-white">
                      {principal?.toText()}
                    </p>
                    <p className="text-base leading-normal font-normal text-[#9cabba]">
                      Verified Identity
                    </p>
                    <p className="text-base leading-normal font-normal text-[#9cabba]">
                      Joined 2022
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <h2 className="px-4 pt-5 pb-3 text-[22px] leading-tight font-bold tracking-[-0.015em] text-white">
              My Identities
            </h2>
            <div className="@container px-4 py-3">
              <div className="flex overflow-hidden rounded-lg border border-[#3b4754] bg-[#111418]">
                <table className="flex-1">
                  <thead>
                    <tr className="bg-[#1b2127]">
                      <th className="w-[400px] px-4 py-3 text-left text-sm leading-normal font-medium text-white">
                        Identity ID
                      </th>
                      <th className="w-[400px] px-4 py-3 text-left text-sm leading-normal font-medium text-white">
                        Reputation
                      </th>
                      <th className="w-60 px-4 py-3 text-left text-sm leading-normal font-medium text-white">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {userIdentities.map((userInentity) => (
                      <tr
                        className="border-t border-t-[#3b4754]"
                        key={userInentity.id}
                      >
                        <td className="h-[72px] w-[400px] px-4 py-2 text-sm leading-normal font-normal text-white">
                          {userInentity.id}
                        </td>
                        <td className="h-[72px] w-[400px] px-4 py-2 text-sm leading-normal font-normal text-[#9cabba]">
                          {userInentity.reputation_score.toString()}
                        </td>
                        <td className="h-[72px] w-60 px-4 py-2 text-sm leading-normal font-normal">
                          <button className="flex h-8 w-full max-w-[480px] min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg bg-[#283039] px-4 text-sm leading-normal font-medium text-white">
                            <span className="truncate">Verified</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <h2 className="px-4 pt-5 pb-3 text-[22px] leading-tight font-bold tracking-[-0.015em] text-white">
              Recent Activity
            </h2>
            <div className="grid grid-cols-[40px_1fr] gap-x-2 px-4">
              {auditTrail.map((entry, index) => (
                <>
                  <div className="flex flex-col items-center gap-1 pt-3">
                    <div
                      className="text-white"
                      data-icon="Wallet"
                      data-size="24px"
                      data-weight="regular"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24px"
                        height="24px"
                        fill="currentColor"
                        viewBox="0 0 256 256"
                      >
                        <path d="M216,72H56a8,8,0,0,1,0-16H192a8,8,0,0,0,0-16H56A24,24,0,0,0,32,64V192a24,24,0,0,0,24,24H216a16,16,0,0,0,16-16V88A16,16,0,0,0,216,72Zm0,128H56a8,8,0,0,1-8-8V86.63A23.84,23.84,0,0,0,56,88H216Zm-48-60a12,12,0,1,1,12,12A12,12,0,0,1,168,140Z"></path>
                      </svg>
                    </div>
                    {index < auditTrail.length - 1 && (
                      <div className="h-2 w-[1.5px] grow bg-[#3b4754]"></div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col py-3">
                    <p className="text-base leading-normal font-medium text-white">
                      {Object.keys(entry.operation)[0]}
                    </p>
                    <p className="text-base leading-normal font-normal text-[#9cabba]">
                      {new Date(
                        Number(entry.timestamp / 1000000n),
                      ).toLocaleString()}
                    </p>
                  </div>
                </>
              ))}
            </div>

            <h2 className="px-4 pt-5 pb-3 text-[22px] leading-tight font-bold tracking-[-0.015em] text-white">
              File Storage
            </h2>
            <div className="@container px-4 py-3">
              <div className="flex overflow-hidden rounded-lg border border-[#3b4754] bg-[#111418]">
                {loading ? (
                  <div className="flex-1 p-6 text-center text-[#9cabba]">
                    Loading files...
                  </div>
                ) : userFiles.length === 0 ? (
                  <div className="flex-1 p-6 text-center text-[#9cabba]">
                    No files uploaded yet. Visit Asset Verification to upload
                    documents.
                  </div>
                ) : (
                  <table className="flex-1">
                    <thead>
                      <tr className="bg-[#1b2127]">
                        <th className="w-[300px] px-4 py-3 text-left text-sm leading-normal font-medium text-white">
                          File Name
                        </th>
                        <th className="w-[150px] px-4 py-3 text-left text-sm leading-normal font-medium text-white">
                          Size
                        </th>
                        <th className="w-[200px] px-4 py-3 text-left text-sm leading-normal font-medium text-white">
                          Uploaded
                        </th>
                        <th className="w-[100px] px-4 py-3 text-left text-sm leading-normal font-medium text-white">
                          Type
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {userFiles.slice(0, 5).map((file) => (
                        <tr
                          className="border-t border-t-[#3b4754]"
                          key={file.file_id}
                        >
                          <td className="h-[60px] px-4 py-2 text-sm leading-normal font-normal text-white">
                            {fileService.getFileTypeIcon(file.mime_type)}{" "}
                            {file.original_name}
                          </td>
                          <td className="h-[60px] px-4 py-2 text-sm leading-normal font-normal text-[#9cabba]">
                            {fileService.formatFileSize(Number(file.size))}
                          </td>
                          <td className="h-[60px] px-4 py-2 text-sm leading-normal font-normal text-[#9cabba]">
                            {new Date(
                              Number(file.uploaded_at) / 1000000,
                            ).toLocaleDateString()}
                          </td>
                          <td className="h-[60px] px-4 py-2 text-sm leading-normal font-normal text-[#9cabba]">
                            {file.is_public ? "🔓 Public" : "🔒 Private"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
              {userFiles.length > 5 && (
                <div className="mt-3 text-center">
                  <p className="text-sm text-[#9cabba]">
                    Showing 5 of {userFiles.length} files
                  </p>
                </div>
              )}
            </div>

            <h2 className="px-4 pt-5 pb-3 text-[22px] leading-tight font-bold tracking-[-0.015em] text-white">
              Cross-Chain Transfers
            </h2>
            <div className="@container px-4 py-3">
              <div className="flex overflow-hidden rounded-lg border border-[#3b4754] bg-[#111418]">
                {loading ? (
                  <div className="flex-1 p-6 text-center text-[#9cabba]">
                    Loading bridge history...
                  </div>
                ) : bridgeHistory.length === 0 ? (
                  <div className="flex-1 p-6 text-center text-[#9cabba]">
                    No bridge transfers yet. Visit Cross-Chain Bridge to start
                    transferring assets.
                  </div>
                ) : (
                  <table className="flex-1">
                    <thead>
                      <tr className="bg-[#1b2127]">
                        <th className="w-[100px] px-4 py-3 text-left text-sm leading-normal font-medium text-white">
                          From
                        </th>
                        <th className="w-[100px] px-4 py-3 text-left text-sm leading-normal font-medium text-white">
                          To
                        </th>
                        <th className="w-[150px] px-4 py-3 text-left text-sm leading-normal font-medium text-white">
                          Amount
                        </th>
                        <th className="w-[150px] px-4 py-3 text-left text-sm leading-normal font-medium text-white">
                          Status
                        </th>
                        <th className="w-[180px] px-4 py-3 text-left text-sm leading-normal font-medium text-white">
                          Created
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {bridgeHistory.slice(0, 5).map((transfer) => (
                        <tr
                          className="border-t border-t-[#3b4754]"
                          key={transfer.id}
                        >
                          <td className="h-[60px] px-4 py-2 text-sm leading-normal font-normal text-white">
                            {bridgeService.getChainIcon(transfer.fromChain)}{" "}
                            {transfer.fromChain}
                          </td>
                          <td className="h-[60px] px-4 py-2 text-sm leading-normal font-normal text-white">
                            {bridgeService.getChainIcon(transfer.toChain)}{" "}
                            {transfer.toChain}
                          </td>
                          <td className="h-[60px] px-4 py-2 text-sm leading-normal font-normal text-[#9cabba]">
                            {bridgeService.formatAmount(transfer.amount)}{" "}
                            {transfer.asset}
                          </td>
                          <td className="h-[60px] px-4 py-2 text-sm leading-normal font-normal">
                            <span
                              className={bridgeService.getStatusColor(
                                transfer.status,
                              )}
                            >
                              {transfer.status}
                            </span>
                          </td>
                          <td className="h-[60px] px-4 py-2 text-sm leading-normal font-normal text-[#9cabba]">
                            {transfer.createdAt.toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
              {bridgeHistory.length > 5 && (
                <div className="mt-3 text-center">
                  <p className="text-sm text-[#9cabba]">
                    Showing 5 of {bridgeHistory.length} transfers
                  </p>
                </div>
              )}
            </div>

            <h2 className="px-4 pt-5 pb-3 text-[22px] leading-tight font-bold tracking-[-0.015em] text-white">
              Analytics
            </h2>
            <div className="flex flex-wrap gap-4 px-4 py-6">
              <div className="flex min-w-72 flex-1 flex-col gap-2 rounded-lg border border-[#3b4754] p-6">
                <p className="text-base leading-normal font-medium text-white">
                  Storage Overview
                </p>
                <div className="grid min-h-[180px] grid-flow-col grid-rows-[1fr_auto] items-end justify-items-center gap-6 px-3">
                  <div
                    className="w-full border-t-2 border-[#9cabba] bg-[#283039]"
                    style={{
                      height: `${Math.min((userFiles.length / 10) * 100, 100)}px`,
                    }}
                  ></div>
                  <p className="text-[13px] leading-normal font-bold tracking-[0.015em] text-[#9cabba]">
                    Files ({userFiles.length})
                  </p>
                  <div
                    className="w-full border-t-2 border-[#9cabba] bg-[#283039]"
                    style={{
                      height: `${Math.min((bridgeHistory.length / 5) * 100, 100)}px`,
                    }}
                  ></div>
                  <p className="text-[13px] leading-normal font-bold tracking-[0.015em] text-[#9cabba]">
                    Transfers ({bridgeHistory.length})
                  </p>
                </div>
              </div>
              <div className="flex min-w-72 flex-1 flex-col gap-2 rounded-lg border border-[#3b4754] p-6">
                <p className="text-base leading-normal font-medium text-white">
                  Lending Stats
                </p>
                {lendingStats ? (
                  <div className="grid min-h-[180px] grid-flow-col grid-rows-[1fr_auto] items-end justify-items-center gap-6 px-3">
                    <div
                      className="w-full border-t-2 border-[#9cabba] bg-[#283039]"
                      style={{
                        height: `${lendingStats.total_volume / 100000n}%`,
                      }}
                    ></div>
                    <p className="text-[13px] leading-normal font-bold tracking-[0.015em] text-[#9cabba]">
                      Total Volume
                    </p>
                    <div
                      className="w-full border-t-2 border-[#9cabba] bg-[#283039]"
                      style={{ height: `${lendingStats.active_loans}%` }}
                    ></div>
                    <p className="text-[13px] leading-normal font-bold tracking-[0.015em] text-[#9cabba]">
                      Active Loans
                    </p>
                  </div>
                ) : (
                  <div className="flex min-h-[180px] items-center justify-center text-[#9cabba]">
                    No lending data available
                  </div>
                )}
              </div>
              <div className="flex min-w-72 flex-1 flex-col gap-2 rounded-lg border border-[#3b4754] p-6">
                <p className="text-base leading-normal font-medium text-white">
                  Marketplace Stats
                </p>
                {marketplaceStats ? (
                  <div className="grid min-h-[180px] grid-flow-col grid-rows-[1fr_auto] items-end justify-items-center gap-6 px-3">
                    <div
                      className="w-full border-t-2 border-[#9cabba] bg-[#283039]"
                      style={{
                        height: `${marketplaceStats.total_volume / 100000n}%`,
                      }}
                    ></div>
                    <p className="text-[13px] leading-normal font-bold tracking-[0.015em] text-[#9cabba]">
                      Total Volume
                    </p>
                    <div
                      className="w-full border-t-2 border-[#9cabba] bg-[#283039]"
                      style={{ height: `${marketplaceStats.active_listings}%` }}
                    ></div>
                    <p className="text-[13px] leading-normal font-bold tracking-[0.015em] text-[#9cabba]">
                      Active Listings
                    </p>
                  </div>
                ) : (
                  <div className="flex min-h-[180px] items-center justify-center text-[#9cabba]">
                    No marketplace data available
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </>
    </Layout>
  );
};

export default Dashboard;
