import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { bridgeService, CrossChainTransfer, SupportedChain, BridgeFeeEstimate } from "../services/bridgeService";

const CrossChainBridge = () => {
  const [fromChain, setFromChain] = useState('');
  const [toChain, setToChain] = useState('');
  const [assetType, setAssetType] = useState('');
  const [amount, setAmount] = useState('');
  const [fromAddress, setFromAddress] = useState('');
  const [toAddress, setToAddress] = useState('');
  const [supportedChains, setSupportedChains] = useState<SupportedChain[]>([]);
  const [bridgeHistory, setBridgeHistory] = useState<CrossChainTransfer[]>([]);
  const [feeEstimate, setFeeEstimate] = useState<BridgeFeeEstimate | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load supported chains and history on component mount
  useEffect(() => {
    loadSupportedChains();
    loadBridgeHistory();
  }, []);

  // Calculate fee when amount and fromChain change
  useEffect(() => {
    if (fromChain && amount && parseFloat(amount) > 0) {
      calculateFee();
    } else {
      setFeeEstimate(null);
    }
  }, [fromChain, amount]);

  const loadSupportedChains = async () => {
    try {
      const chains = await bridgeService.getSupportedChains();
      setSupportedChains(chains);
    } catch (err) {
      console.error('Failed to load supported chains:', err);
    }
  };

  const loadBridgeHistory = async () => {
    setIsLoading(true);
    try {
      const history = await bridgeService.getUserBridgeHistory();
      setBridgeHistory(history);
    } catch (err) {
      console.error('Failed to load bridge history:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateFee = async () => {
    try {
      const amountBigInt = bridgeService.parseAmount(amount, 8);
      const fee = await bridgeService.calculateBridgeFee(fromChain, amountBigInt);
      setFeeEstimate(fee);
    } catch (err) {
      console.error('Failed to calculate fee:', err);
      setFeeEstimate(null);
    }
  };

  const handleSubmitBridge = async () => {
    setError(null);
    setSuccess(null);

    // Validate inputs
    const validation = bridgeService.validateTransfer(
      fromChain, toChain, assetType, amount, fromAddress, toAddress
    );

    if (!validation.valid) {
      setError(validation.errors.join(', '));
      return;
    }

    setIsSubmitting(true);
    try {
      const amountBigInt = bridgeService.parseAmount(amount, 8);
      const requestId = await bridgeService.initiateBridge(
        fromChain,
        toChain,
        assetType,
        amountBigInt,
        fromAddress,
        toAddress
      );

      setSuccess(`Bridge request initiated successfully! Request ID: ${requestId.substring(0, 12)}...`);
      
      // Reset form
      setFromChain('');
      setToChain('');
      setAssetType('');
      setAmount('');
      setFromAddress('');
      setToAddress('');
      setFeeEstimate(null);

      // Reload history
      loadBridgeHistory();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initiate bridge transfer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getAvailableAssets = (chain: string): string[] => {
    const chainConfig = supportedChains.find(c => c.type === chain);
    return chainConfig?.supportedAssets || [];
  };
  return (
    <Layout>
      <div
        style={{
          // @ts-ignore
          "--select-button-svg":
            "url('data:image/svg+xml,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2724px%27 height=%2724px%27 fill=%27rgb(156,171,186)%27 viewBox=%270 0 256 256%27%3e%3cpath d=%27M181.66,170.34a8,8,0,0,1,0,11.32l-48,48a8,8,0,0,1-11.32,0l-48-48a8,8,0,0,1,11.32-11.32L128,212.69l42.34-42.35A8,8,0,0,1,181.66,170.34Zm-96-84.68L128,43.31l42.34,42.35a8,8,0,0,0,11.32-11.32l-48-48a8,8,0,0,0-11.32,0l-48,48A8,8,0,0,0,85.66,85.66Z%27%3e%3c/path%3e%3c/svg%3e')",
          fontFamily: 'Inter, "Noto Sans", sans-serif',
        }}
      >
        <>
          <div className="flex flex-wrap justify-between gap-3 p-4">
            <div className="flex min-w-72 flex-col gap-3">
              <p className="tracking-light text-[32px] leading-tight font-bold text-white">
                Cross-Chain Bridge
              </p>
              <p className="text-sm leading-normal font-normal text-[#9cabba]">
                Bridge assets seamlessly across different blockchains with our secure protocol.
              </p>
            </div>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="mx-4 rounded-lg border border-red-600 bg-red-900/50 p-4">
              <p className="text-red-400">{error}</p>
            </div>
          )}
          
          {success && (
            <div className="mx-4 rounded-lg border border-green-600 bg-green-900/50 p-4">
              <p className="text-green-400">{success}</p>
            </div>
          )}
          <h3 className="px-4 pt-4 pb-2 text-lg leading-tight font-bold tracking-[-0.015em] text-white">
            Supported Chains
          </h3>
          {supportedChains.map((chain, index) => (
            <div key={index} className="flex min-h-[72px] items-center justify-between gap-4 bg-[#111418] px-4 py-2">
              <div className="flex items-center gap-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-[#283039] text-white text-xl">
                  {bridgeService.getChainIcon(chain.type)}
                </div>
                <div className="flex flex-col justify-center">
                  <p className="line-clamp-1 text-base leading-normal font-medium text-white">
                    {chain.name}
                  </p>
                  <p className="line-clamp-2 text-sm leading-normal font-normal text-[#9cabba]">
                    Assets: {chain.supportedAssets.join(', ') || 'None'} • Fee: {chain.feePercentage}%
                  </p>
                </div>
              </div>
              <div className="shrink-0">
                <span className="text-sm text-green-400">✓ Supported</span>
              </div>
            </div>
          ))}

          {supportedChains.length === 0 && (
            <div className="px-4 py-8 text-center">
              <p className="text-[#9cabba]">Loading supported chains...</p>
            </div>
          )}
          <h3 className="px-4 pt-4 pb-2 text-lg leading-tight font-bold tracking-[-0.015em] text-white">
            Bridge Assets
          </h3>
          <div className="flex max-w-[480px] flex-wrap items-end gap-4 px-4 py-3">
            <label className="flex min-w-40 flex-1 flex-col">
              <p className="pb-2 text-base leading-normal font-medium text-white">
                From Chain
              </p>
              <select 
                className="form-input flex h-14 w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg border border-[#3b4754] bg-[#1b2127] bg-[image:--select-button-svg] p-[15px] text-base leading-normal font-normal text-white placeholder:text-[#9cabba] focus:border-[#3b4754] focus:ring-0 focus:outline-0"
                value={fromChain}
                onChange={(e) => {
                  setFromChain(e.target.value);
                  setAssetType(''); // Reset asset when chain changes
                }}
              >
                <option value="">Select Source Chain</option>
                {supportedChains.map((chain) => (
                  <option key={chain.type} value={chain.type}>
                    {bridgeService.getChainIcon(chain.type)} {chain.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="flex max-w-[480px] flex-wrap items-end gap-4 px-4 py-3">
            <label className="flex min-w-40 flex-1 flex-col">
              <p className="pb-2 text-base leading-normal font-medium text-white">
                To Chain
              </p>
              <select 
                className="form-input flex h-14 w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg border border-[#3b4754] bg-[#1b2127] bg-[image:--select-button-svg] p-[15px] text-base leading-normal font-normal text-white placeholder:text-[#9cabba] focus:border-[#3b4754] focus:ring-0 focus:outline-0"
                value={toChain}
                onChange={(e) => setToChain(e.target.value)}
              >
                <option value="">Select Destination Chain</option>
                {supportedChains
                  .filter(chain => chain.type !== fromChain)
                  .map((chain) => (
                    <option key={chain.type} value={chain.type}>
                      {bridgeService.getChainIcon(chain.type)} {chain.name}
                    </option>
                  ))}
              </select>
            </label>
          </div>
          <div className="flex max-w-[480px] flex-wrap items-end gap-4 px-4 py-3">
            <label className="flex min-w-40 flex-1 flex-col">
              <p className="pb-2 text-base leading-normal font-medium text-white">
                Asset
              </p>
              <select 
                className="form-input flex h-14 w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg border border-[#3b4754] bg-[#1b2127] bg-[image:--select-button-svg] p-[15px] text-base leading-normal font-normal text-white placeholder:text-[#9cabba] focus:border-[#3b4754] focus:ring-0 focus:outline-0"
                value={assetType}
                onChange={(e) => setAssetType(e.target.value)}
                disabled={!fromChain}
              >
                <option value="">Select Asset</option>
                {getAvailableAssets(fromChain).map((asset) => (
                  <option key={asset} value={asset}>
                    {asset}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="flex max-w-[480px] flex-wrap items-end gap-4 px-4 py-3">
            <label className="flex min-w-40 flex-1 flex-col">
              <p className="pb-2 text-base leading-normal font-medium text-white">
                Amount {assetType && `(${assetType})`}
              </p>
              <input
                type="number"
                step="0.00000001"
                placeholder="0.00000000"
                className="form-input flex h-14 w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg border border-[#3b4754] bg-[#1b2127] p-[15px] text-base leading-normal font-normal text-white placeholder:text-[#9cabba] focus:border-[#3b4754] focus:ring-0 focus:outline-0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              {feeEstimate && (
                <p className="mt-1 text-xs text-[#9cabba]">
                  Fee: ~{bridgeService.formatAmount(feeEstimate.amount, 8)} {assetType} ({feeEstimate.percentage}%)
                </p>
              )}
            </label>
          </div>

          {/* From/To Address Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-4 py-3 max-w-[960px]">
            <label className="flex flex-col">
              <p className="pb-2 text-base leading-normal font-medium text-white">
                From Address
              </p>
              <input
                type="text"
                placeholder="Your wallet address on source chain"
                className="form-input flex h-14 w-full resize-none overflow-hidden rounded-lg border border-[#3b4754] bg-[#1b2127] p-[15px] text-base leading-normal font-normal text-white placeholder:text-[#9cabba] focus:border-[#3b4754] focus:ring-0 focus:outline-0"
                value={fromAddress}
                onChange={(e) => setFromAddress(e.target.value)}
              />
            </label>
            
            <label className="flex flex-col">
              <p className="pb-2 text-base leading-normal font-medium text-white">
                To Address
              </p>
              <input
                type="text"
                placeholder="Recipient address on destination chain"
                className="form-input flex h-14 w-full resize-none overflow-hidden rounded-lg border border-[#3b4754] bg-[#1b2127] p-[15px] text-base leading-normal font-normal text-white placeholder:text-[#9cabba] focus:border-[#3b4754] focus:ring-0 focus:outline-0"
                value={toAddress}
                onChange={(e) => setToAddress(e.target.value)}
              />
            </label>
          </div>
          <div className="flex justify-end px-4 py-3">
            <button 
              onClick={handleSubmitBridge}
              disabled={isSubmitting || !fromChain || !toChain || !assetType || !amount || !fromAddress || !toAddress}
              className="flex h-10 max-w-[480px] min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg bg-[#0d80f2] px-4 text-sm leading-normal font-bold tracking-[0.015em] text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                  Processing...
                </>
              ) : (
                <span className="truncate">Initiate Bridge</span>
              )}
            </button>
          </div>
          <h3 className="px-4 pt-4 pb-2 text-lg leading-tight font-bold tracking-[-0.015em] text-white">
            Transaction History
            {isLoading && (
              <span className="ml-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
            )}
          </h3>
          
          <div className="@container px-4 py-3">
            {bridgeHistory.length > 0 ? (
              <div className="flex overflow-hidden rounded-lg border border-[#3b4754] bg-[#111418]">
                <table className="flex-1">
                  <thead>
                    <tr className="bg-[#1b2127]">
                      <th className="px-4 py-3 text-left text-sm leading-normal font-medium text-white">
                        Date
                      </th>
                      <th className="px-4 py-3 text-left text-sm leading-normal font-medium text-white">
                        Asset
                      </th>
                      <th className="px-4 py-3 text-left text-sm leading-normal font-medium text-white">
                        From
                      </th>
                      <th className="px-4 py-3 text-left text-sm leading-normal font-medium text-white">
                        To
                      </th>
                      <th className="px-4 py-3 text-left text-sm leading-normal font-medium text-white">
                        Amount
                      </th>
                      <th className="px-4 py-3 text-left text-sm leading-normal font-medium text-white">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {bridgeHistory.slice(0, 10).map((transfer) => (
                      <tr key={transfer.id} className="border-t border-t-[#3b4754]">
                        <td className="h-[72px] px-4 py-2 text-sm leading-normal font-normal text-[#9cabba]">
                          {transfer.createdAt.toLocaleDateString()}
                        </td>
                        <td className="h-[72px] px-4 py-2 text-sm leading-normal font-normal text-white">
                          {transfer.asset}
                        </td>
                        <td className="h-[72px] px-4 py-2 text-sm leading-normal font-normal text-[#9cabba]">
                          {bridgeService.getChainIcon(transfer.fromChain)} {transfer.fromChain}
                        </td>
                        <td className="h-[72px] px-4 py-2 text-sm leading-normal font-normal text-[#9cabba]">
                          {bridgeService.getChainIcon(transfer.toChain)} {transfer.toChain}
                        </td>
                        <td className="h-[72px] px-4 py-2 text-sm leading-normal font-normal text-[#9cabba]">
                          {bridgeService.formatAmount(transfer.amount, 8)} {transfer.asset}
                        </td>
                        <td className="h-[72px] px-4 py-2 text-sm leading-normal font-normal">
                          <span className={`text-sm ${bridgeService.getStatusColor(transfer.status)}`}>
                            {transfer.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="rounded-lg border border-[#3b4754] bg-[#111418] p-8 text-center">
                <p className="text-[#9cabba]">
                  {isLoading ? 'Loading transaction history...' : 'No bridge transactions found'}
                </p>
              </div>
            )}
          </div>
          <style>
            {`
                          @container(max-width:120px){.table-60c7d060-1f55-48af-93a6-54aba3961657-column-120{display: none;}}
                @container(max-width:240px){.table-60c7d060-1f55-48af-93a6-54aba3961657-column-240{display: none;}}
                @container(max-width:360px){.table-60c7d060-1f55-48af-93a6-54aba3961657-column-360{display: none;}}
                @container(max-width:480px){.table-60c7d060-1f55-48af-93a6-54aba3961657-column-480{display: none;}}
                @container(max-width:600px){.table-60c7d060-1f55-48af-93a6-54aba3961657-column-600{display: none;}}
                @container(max-width:720px){.table-60c7d060-1f55-48af-93a6-54aba3961657-column-720{display: none;}}
              `}
          </style>
        </>
      </div>
    </Layout>
  );
};

export default CrossChainBridge;
