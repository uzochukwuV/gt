import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import Footer from "../components/Footer";
import { marketplaceService } from "../services/marketplaceService";
import { handleApiError, withLoading } from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { MarketplaceListing } from "../../../declarations/marketplace/marketplace.did";

const Marketplace = () => {
  const { marketplaceActor } = useAuth();
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory] = useState("");

  useEffect(() => {
    if (marketplaceActor) {
      loadData();
    }
  }, [marketplaceActor]);

  const loadData = async () => {
    if (!marketplaceActor) return;
    await withLoading(async () => {
      try {
        const [listingsData, statsData] = await Promise.all([
          marketplaceService(marketplaceActor).getListings({ limit: 20 }),
          marketplaceService(marketplaceActor).getMarketplaceStats(),
        ]);
        setListings(listingsData.map((item: any) => item[0]));
        setStats(statsData);
      } catch (error) {
        console.error(
          "Error loading marketplace data:",
          handleApiError(error, "loadData"),
        );
        // Show user-friendly error message
        alert(handleApiError(error, "loading marketplace data"));
      }
    }, setLoading);
  };

  const filteredListings = listings.filter((listing) => {
    const matchesSearch =
      !searchTerm || listing.id.toString().includes(searchTerm.toLowerCase());

    const matchesCategory = !selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const handleBuyAsset = async (listingId: number, price: number) => {
    if (!marketplaceActor) return;
    try {
      await marketplaceService(marketplaceActor).createOrder(listingId, price);
      alert("Purchase order created successfully!");
      loadData(); // Refresh data
    } catch (error) {
      const errorMessage = handleApiError(error, "creating purchase order");
      alert(errorMessage);
    }
  };

  return (
    <Layout>
      <>
        <div className="flex flex-wrap justify-between gap-3 p-4">
          <div className="flex min-w-72 flex-col gap-3">
            <p className="tracking-light text-[32px] leading-tight font-bold text-white">
              Marketplace
            </p>
            <p className="text-sm leading-normal font-normal text-[#9cabba]">
              Explore and trade tokenized real-world assets (RWAs) securely on
              GlobalTrust.
              {!loading && ` ${stats.active_listings || 0} active listings`}
            </p>
          </div>
        </div>
        <div className="px-4 py-3">
          <label className="flex h-12 w-full min-w-40 flex-col">
            <div className="flex h-full w-full flex-1 items-stretch rounded-lg">
              <div
                className="flex items-center justify-center rounded-l-lg border-r-0 border-none bg-[#283039] pl-4 text-[#9cabba]"
                data-icon="MagnifyingGlass"
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
                  <path d="M229.66,218.34l-50.07-50.06a88.11,88.11,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z"></path>
                </svg>
              </div>
              <input
                placeholder="Search for assets"
                className="form-input flex h-full w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg rounded-l-none border-l-0 border-none bg-[#283039] px-4 pl-2 text-base leading-normal font-normal text-white placeholder:text-[#9cabba] focus:border-none focus:ring-0 focus:outline-0"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </label>
        </div>
        <div className="flex flex-wrap gap-3 p-3 pr-4">
          <button className="flex h-8 shrink-0 items-center justify-center gap-x-2 rounded-lg bg-[#283039] pr-2 pl-4">
            <p className="text-sm leading-normal font-medium text-white">
              Category
            </p>
            <div
              className="text-white"
              data-icon="CaretDown"
              data-size="20px"
              data-weight="regular"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20px"
                height="20px"
                fill="currentColor"
                viewBox="0 0 256 256"
              >
                <path d="M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z"></path>
              </svg>
            </div>
          </button>
          <button className="flex h-8 shrink-0 items-center justify-center gap-x-2 rounded-lg bg-[#283039] pr-2 pl-4">
            <p className="text-sm leading-normal font-medium text-white">
              Price Range
            </p>
            <div
              className="text-white"
              data-icon="CaretDown"
              data-size="20px"
              data-weight="regular"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20px"
                height="20px"
                fill="currentColor"
                viewBox="0 0 256 256"
              >
                <path d="M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z"></path>
              </svg>
            </div>
          </button>
          <button className="flex h-8 shrink-0 items-center justify-center gap-x-2 rounded-lg bg-[#283039] pr-2 pl-4">
            <p className="text-sm leading-normal font-medium text-white">
              Reputation Score
            </p>
            <div
              className="text-white"
              data-icon="CaretDown"
              data-size="20px"
              data-weight="regular"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20px"
                height="20px"
                fill="currentColor"
                viewBox="0 0 256 256"
              >
                <path d="M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z"></path>
              </svg>
            </div>
          </button>
          <button className="flex h-8 shrink-0 items-center justify-center gap-x-2 rounded-lg bg-[#283039] pr-2 pl-4">
            <p className="text-sm leading-normal font-medium text-white">
              Location
            </p>
            <div
              className="text-white"
              data-icon="CaretDown"
              data-size="20px"
              data-weight="regular"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20px"
                height="20px"
                fill="currentColor"
                viewBox="0 0 256 256"
              >
                <path d="M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z"></path>
              </svg>
            </div>
          </button>
        </div>
        <h3 className="px-4 pt-4 pb-2 text-lg leading-tight font-bold tracking-[-0.015em] text-white">
          Featured Assets
        </h3>
        <div className="[&amp;::-webkit-scrollbar]:hidden flex overflow-y-auto [-ms-scrollbar-style:none] [scrollbar-width:none]">
          <div className="flex items-stretch gap-3 p-4">
            <div className="flex h-full min-w-60 flex-1 flex-col gap-4 rounded-lg">
              <div
                className="flex aspect-video w-full flex-col rounded-lg bg-cover bg-center bg-no-repeat"
                style={{
                  backgroundImage:
                    'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDatgY9tv18RPBlIeS00K5zE6CTlsp6Q-n5GgFjsxLKJgBkCqcGFAtexalk6GOOBTbES1tycREgwshl5ZKUrDZRLeFrlmMqKtcWPPXgCoUXZGXg_sQrGliLgxGfqBjgMHbsrXLBYdjVFa_CJLKrpn1eX2s35rzogr1h8WkhClsp64qL1rhjRZQJl1OWXweGmMgNnat2mG1y3ohyof_qiCIjMAvzsCoQguxjydikLnppjGmvT__BvN92LKljOrLBSmiZirGLtrAau3o")',
                }}
              ></div>
              <div>
                <p className="text-base leading-normal font-medium text-white">
                  Luxury Villa in Tuscany
                </p>
                <p className="text-sm leading-normal font-normal text-[#9cabba]">
                  AI Verified, High Reputation
                </p>
              </div>
            </div>
            <div className="flex h-full min-w-60 flex-1 flex-col gap-4 rounded-lg">
              <div
                className="flex aspect-video w-full flex-col rounded-lg bg-cover bg-center bg-no-repeat"
                style={{
                  backgroundImage:
                    'url("https://lh3.googleusercontent.com/aida-public/AB6AXuA3iRF0lgiWFkMABbFSduaaZAJxTpnIgRYCrgxk8NmrLpHZ2SsDHdJ1QG1PM4FzsGW8VVnPPNDUIe2PH3tsjXYsxtcbf9qxAXo8_E1181F7qT2c4-11Bk09QKOuDJro5oXqzPRkIBduLIx5KUsxQ9EFo6r22fDt6p9QZmNW54IJ5TYz6-6OB1lZ9vXsKkpuuoFdGETU3pU23wETOrgWXr5JFcTfl0bnI5mbXsOv8BxJG2Mwe6tXjQDOGjcktnlMqkEPygOxDxFc4JQ")',
                }}
              ></div>
              <div>
                <p className="text-base leading-normal font-medium text-white">
                  Modern Apartment in Berlin
                </p>
                <p className="text-sm leading-normal font-normal text-[#9cabba]">
                  AI Verified, Central Location
                </p>
              </div>
            </div>
            <div className="flex h-full min-w-60 flex-1 flex-col gap-4 rounded-lg">
              <div
                className="flex aspect-video w-full flex-col rounded-lg bg-cover bg-center bg-no-repeat"
                style={{
                  backgroundImage:
                    'url("https://lh3.googleusercontent.com/aida-public/AB6AXuC36h1zQp-kHFO0HwK3YbmxNmQndhdD0g8mjIpruSdlslApGvgIs3RiPpBN1VflYnCQiX1NLlyE_ysGjym3VunHVhY5azJBVYUAAqYPMo0lhbP6rkswpDR3acYWJ9bQ94ksO283viWCueHm-ymot9GLYOxnuCzvWvQ8fMfWBKT2w0oToxKTzkQefobmdpQ_GifdDK-lWsC67Y5jaqXUUpYXea2I8rky1mqPERhW6RlDuvp5ZXj2doAQ6ZX5jOIYXZfx1Z-tK7OMSvU")',
                }}
              ></div>
              <div>
                <p className="text-base leading-normal font-medium text-white">
                  Sports Car
                </p>
                <p className="text-sm leading-normal font-normal text-[#9cabba]">
                  AI Verified, Limited Edition
                </p>
              </div>
            </div>
            <div className="flex h-full min-w-60 flex-1 flex-col gap-4 rounded-lg">
              <div
                className="flex aspect-video w-full flex-col rounded-lg bg-cover bg-center bg-no-repeat"
                style={{
                  backgroundImage:
                    'url("https://lh3.googleusercontent.com/aida-public/AB6AXuA3TrBGKzXwXTCQHzpgy9PPHAlJGZe1K8cu6WyaQngqUXsB7SqzTmLfl1soBVxSA7cDcNecMrrfb0QF607xkx-KKjEu-dfPiOk1mNBMSlq4uowwANl5ylsWI2Prqss4pXeSoNnv7ni9XZG6gZxlDmcdVJ2Y12VO-9jIEQ-4jEHmw5rLbGGKZxztSGOzx3JLm3AQyevXVXHpKFfV6qS4WU_ZbH3C2PoISH-_DSxKQK-oxp5e1mD82ZJenDtXuBO_I3py21NEAwPqHqY")',
                }}
              ></div>
              <div>
                <p className="text-base leading-normal font-medium text-white">
                  Collectible Watch
                </p>
                <p className="text-sm leading-normal font-normal text-[#9cabba]">
                  AI Verified, Excellent Condition
                </p>
              </div>
            </div>
          </div>
        </div>
        <h3 className="px-4 pt-4 pb-2 text-lg leading-tight font-bold tracking-[-0.015em] text-white">
          All Assets {!loading && `(${filteredListings.length})`}
        </h3>
        {loading ? (
          <div className="flex h-32 items-center justify-center">
            <div className="text-white">Loading assets...</div>
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4 p-4">
            {filteredListings.map((listing) => (
              <div
                key={listing.id}
                className="flex flex-col gap-3 rounded-lg bg-[#283039] p-4 pb-3"
              >
                <div
                  className="aspect-video w-full rounded-lg bg-cover bg-center bg-no-repeat"
                  style={{
                    backgroundImage: `url("https://via.placeholder.com/300x200")`,
                  }}
                ></div>
                <div className="flex-1">
                  <p className="text-base leading-normal font-medium text-white">
                    Asset #{listing.asset_id}
                  </p>
                  <p className="text-sm leading-normal font-normal text-[#9cabba]">
                    Listed asset for sale
                  </p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="font-bold text-green-400">
                      ${listing.price.toLocaleString()}
                    </span>
                    <span className="text-xs text-gray-400">
                      {Object.keys(listing.payment_method)[0]}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-xs text-blue-400">
                      Score:{" "}
                      {(listing.minimum_verification_score * 100).toFixed(0)}%
                    </span>
                    <span className="text-xs text-gray-400">
                      {Object.keys(listing.listing_type)[0]}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() =>
                    handleBuyAsset(Number(listing.id), listing.price)
                  }
                  className="w-full rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
                >
                  Buy Now
                </button>
              </div>
            ))}
          </div>
        )}
        <Footer />
      </>
    </Layout>
  );
};

export default Marketplace;
