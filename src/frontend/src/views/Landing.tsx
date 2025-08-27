import { Link } from "react-router-dom";

const Landing = () => {
  return (
    <div
      className="dark group/design-root relative flex size-full min-h-screen flex-col overflow-x-hidden bg-[#111618]"
      style={{ fontFamily: 'Manrope, "Noto Sans", sans-serif' }}
    >
      <div className="layout-container flex h-full grow flex-col">
        <header className="flex items-center justify-between border-b border-solid border-b-[#293438] px-10 py-3 whitespace-nowrap">
          <div className="flex items-center gap-4 text-white">
            <div className="size-4">
              <svg
                viewBox="0 0 48 48"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M24 18.4228L42 11.475V34.3663C42 34.7796 41.7457 35.1504 41.3601 35.2992L24 42V18.4228Z"
                  fill="currentColor"
                ></path>
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M24 8.18819L33.4123 11.574L24 15.2071L14.5877 11.574L24 8.18819ZM9 15.8487L21 20.4805V37.6263L9 32.9945V15.8487ZM27 37.6263V20.4805L39 15.8487V32.9945L27 37.6263ZM25.354 2.29885C24.4788 1.98402 23.5212 1.98402 22.646 2.29885L4.98454 8.65208C3.7939 9.08038 3 10.2097 3 11.475V34.3663C3 36.0196 4.01719 37.5026 5.55962 38.098L22.9197 44.7987C23.6149 45.0671 24.3851 45.0671 25.0803 44.7987L42.4404 38.098C43.9828 37.5026 45 36.0196 45 34.3663V11.475C45 10.2097 44.2061 9.08038 43.0155 8.65208L25.354 2.29885Z"
                  fill="currentColor"
                ></path>
              </svg>
            </div>
            <h2 className="text-lg leading-tight font-bold tracking-[-0.015em] text-white">
              GlobalTrust
            </h2>
          </div>
          <div className="flex flex-1 justify-end gap-8">
            <div className="flex items-center gap-9">
              <a
                className="text-sm leading-normal font-medium text-white"
                href="#"
              >
                Features
              </a>
              <a
                className="text-sm leading-normal font-medium text-white"
                href="#"
              >
                How it Works
              </a>
              <a
                className="text-sm leading-normal font-medium text-white"
                href="#"
              >
                Resources
              </a>
              <a
                className="text-sm leading-normal font-medium text-white"
                href="#"
              >
                Contact
              </a>
            </div>
            <Link
              to="/identity"
              className="flex h-10 max-w-[480px] min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-xl bg-[#19b3e6] px-4 text-sm leading-normal font-bold tracking-[0.015em] text-[#111618]"
            >
              <span className="truncate">Get Started</span>
            </Link>
          </div>
        </header>
        <div className="flex flex-1 justify-center px-40 py-5">
          <div className="layout-content-container flex max-w-[960px] flex-1 flex-col">
            <div className="@container">
              <div className="@[480px]:p-4">
                <div
                  className="flex min-h-[480px] flex-col items-center justify-center gap-6 bg-cover bg-center bg-no-repeat p-4 @[480px]:gap-8 @[480px]:rounded-xl"
                  style={{
                    backgroundImage:
                      'linear-gradient(rgba(0, 0, 0, 0.1) 0%, rgba(0, 0, 0, 0.4) 100%), url("https://lh3.googleusercontent.com/aida-public/AB6AXuCfwJewlHqKKr9rv5ybvcER5lM4T46LuLduPN58Zq0xqqMV1ybmcgy9uKKL17wR8esVY8Yp2vd4TxfHD3_DjE58ujQXdeAMf57mVNbrtH6EleJPy2tOWP4XH-zfLWo6eb1tFMIXVVDGpB7g8s-3Y2JugOJyEg9lG84SPQUu7CcC6AO0iZ4jj64-65Vr63Cm03vgRxUQSHScsGkD-TtFAEWxc1bzGYgTMR9TBIJ451NuVZ9ZY2l-vMpg25OCInoQtUYt-2xSFuAQ57Q");',
                  }}
                >
                  <div className="flex flex-col gap-2 text-center">
                    <h1 className="text-4xl leading-tight font-black tracking-[-0.033em] text-white @[480px]:text-5xl @[480px]:leading-tight @[480px]:font-black @[480px]:tracking-[-0.033em]">
                      GlobalTrust: Secure Your Digital Identity and Assets
                      Across Chains
                    </h1>
                    <h2 className="text-sm leading-normal font-normal text-white @[480px]:text-base @[480px]:leading-normal @[480px]:font-normal">
                      A decentralized, AI-powered platform on ICP for
                      cross-chain identity and asset verification, featuring a
                      Lending protocol and Marketplace for RWAs.
                    </h2>
                  </div>
                  <Link
                    to="/identity"
                    className="flex h-10 max-w-[480px] min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-xl bg-[#19b3e6] px-4 text-sm leading-normal font-bold tracking-[0.015em] text-[#111618] @[480px]:h-12 @[480px]:px-5 @[480px]:text-base @[480px]:leading-normal @[480px]:font-bold @[480px]:tracking-[0.015em]"
                  >
                    <span className="truncate">Get Started</span>
                  </Link>
                </div>
              </div>
            </div>
            <h2 className="px-4 pt-5 pb-3 text-[22px] leading-tight font-bold tracking-[-0.015em] text-white">
              Key Features and Benefits
            </h2>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(158px,1fr))] gap-3 p-4">
              <div className="flex flex-1 flex-col gap-3 rounded-lg border border-[#3c4d53] bg-[#1c2426] p-4">
                <div
                  className="text-white"
                  data-icon="IdentificationCard"
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
                    <path d="M200,112a8,8,0,0,1-8,8H152a8,8,0,0,1,0-16h40A8,8,0,0,1,200,112Zm-8,24H152a8,8,0,0,0,0,16h40a8,8,0,0,0,0-16Zm40-80V200a16,16,0,0,1-16,16H40a16,16,0,0,1-16-16V56A16,16,0,0,1,40,40H216A16,16,0,0,1,232,56ZM216,200V56H40V200H216Zm-80.26-34a8,8,0,1,1-15.5,4c-2.63-10.26-13.06-18-24.25-18s-21.61,7.74-24.25,18a8,8,0,1,1-15.5-4,39.84,39.84,0,0,1,17.19-23.34,32,32,0,1,1,45.12,0A39.76,39.76,0,0,1,135.75,166ZM96,136a16,16,0,1,0-16-16A16,16,0,0,0,96,136Z"></path>
                  </svg>
                </div>
                <div className="flex flex-col gap-1">
                  <h2 className="text-base leading-tight font-bold text-white">
                    Unified On-Chain Identity
                  </h2>
                  <p className="text-sm leading-normal font-normal text-[#9db2b8]">
                    Create and manage a single, self-sovereign digital identity
                    that puts you in control of your data.
                  </p>
                </div>
              </div>
              <div className="flex flex-1 flex-col gap-3 rounded-lg border border-[#3c4d53] bg-[#1c2426] p-4">
                <div
                  className="text-white"
                  data-icon="Link"
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
                    <path d="M137.54,186.36a8,8,0,0,1,0,11.31l-9.94,10A56,56,0,0,1,48.38,128.4L72.5,104.28A56,56,0,0,1,149.31,102a8,8,0,1,1-10.64,12,40,40,0,0,0-54.85,1.63L59.7,139.72a40,40,0,0,0,56.58,56.58l9.94-9.94A8,8,0,0,1,137.54,186.36Zm70.08-138a56.08,56.08,0,0,0-79.22,0l-9.94,9.95a8,8,0,0,0,11.32,11.31l9.94-9.94a40,40,0,0,1,56.58,56.58L172.18,140.4A40,40,0,0,1,117.33,142,8,8,0,1,0,106.69,154a56,56,0,0,0,76.81-2.26l24.12-24.12A56.08,56.08,0,0,0,207.62,48.38Z"></path>
                  </svg>
                </div>
                <div className="flex flex-col gap-1">
                  <h2 className="text-base leading-tight font-bold text-white">
                    Cross-Chain Verification
                  </h2>
                  <p className="text-sm leading-normal font-normal text-[#9db2b8]">
                    Verify identities and assets across multiple blockchains
                    (Bitcoin, Ethereum, Solana) without intermediaries.
                  </p>
                </div>
              </div>
              <div className="flex flex-1 flex-col gap-3 rounded-lg border border-[#3c4d53] bg-[#1c2426] p-4">
                <div
                  className="text-white"
                  data-icon="Brain"
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
                    <path d="M248,124a56.11,56.11,0,0,0-32-50.61V72a48,48,0,0,0-88-26.49A48,48,0,0,0,40,72v1.39a56,56,0,0,0,0,101.2V176a48,48,0,0,0,88,26.49A48,48,0,0,0,216,176v-1.41A56.09,56.09,0,0,0,248,124ZM88,208a32,32,0,0,1-31.81-28.56A55.87,55.87,0,0,0,64,180h8a8,8,0,0,0,0-16H64A40,40,0,0,1,50.67,86.27,8,8,0,0,0,56,78.73V72a32,32,0,0,1,64,0v68.26A47.8,47.8,0,0,0,88,128a8,8,0,0,0,0,16,32,32,0,0,1,0,64Zm104-44h-8a8,8,0,0,0,0,16h8a55.87,55.87,0,0,0,7.81-.56A32,32,0,1,1,168,144a8,8,0,0,0,0-16,47.8,47.8,0,0,0-32,12.26V72a32,32,0,0,1,64,0v6.73a8,8,0,0,0,5.33,7.54A40,40,0,0,1,192,164Zm16-52a8,8,0,0,1-8,8h-4a36,36,0,0,1-36-36V80a8,8,0,0,1,16,0v4a20,20,0,0,0,20,20h4A8,8,0,0,1,208,112ZM60,120H56a8,8,0,0,1,0-16h4A20,20,0,0,0,80,84V80a8,8,0,0,1,16,0v4A36,36,0,0,1,60,120Z"></path>
                  </svg>
                </div>
                <div className="flex flex-col gap-1">
                  <h2 className="text-base leading-tight font-bold text-white">
                    AI-Powered Validation
                  </h2>
                  <p className="text-sm leading-normal font-normal text-[#9db2b8]">
                    Our advanced AI model validates credentials and assets,
                    ensuring trust and detecting fraud.
                  </p>
                </div>
              </div>
              <div className="flex flex-1 flex-col gap-3 rounded-lg border border-[#3c4d53] bg-[#1c2426] p-4">
                <div
                  className="text-white"
                  data-icon="CurrencyCircleDollar"
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
                    <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm40-68a28,28,0,0,1-28,28h-4v8a8,8,0,0,1-16,0v-8H104a8,8,0,0,1,0-16h36a12,12,0,0,0,0-24H116a28,28,0,0,1,0-56h4V72a8,8,0,0,1,16,0v8h16a8,8,0,0,1,0,16H116a12,12,0,0,0,0,24h24A28,28,0,0,1,168,148Z"></path>
                  </svg>
                </div>
                <div className="flex flex-col gap-1">
                  <h2 className="text-base leading-tight font-bold text-white">
                    RWA Tokenization &amp; DeFi
                  </h2>
                  <p className="text-sm leading-normal font-normal text-[#9db2b8]">
                    Tokenize real-world assets (RWAs) as NFTs and leverage them
                    in lending and trading within our DeFi ecosystem.
                  </p>
                </div>
              </div>
              <div className="flex flex-1 flex-col gap-3 rounded-lg border border-[#3c4d53] bg-[#1c2426] p-4">
                <div
                  className="text-white"
                  data-icon="Globe"
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
                    <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24ZM101.63,168h52.74C149,186.34,140,202.87,128,215.89,116,202.87,107,186.34,101.63,168ZM98,152a145.72,145.72,0,0,1,0-48h60a145.72,145.72,0,0,1,0,48ZM40,128a87.61,87.61,0,0,1,3.33-24H81.79a161.79,161.79,0,0,0,0,48H43.33A87.61,87.61,0,0,1,40,128ZM154.37,88H101.63C107,69.66,116,53.13,128,40.11,140,53.13,149,69.66,154.37,88Zm19.84,16h38.46a88.15,88.15,0,0,1,0,48H174.21a161.79,161.79,0,0,0,0-48Zm32.16-16H170.94a142.39,142.39,0,0,0-20.26-45A88.37,88.37,0,0,1,206.37,88ZM105.32,43A142.39,142.39,0,0,0,85.06,88H49.63A88.37,88.37,0,0,1,105.32,43ZM49.63,168H85.06a142.39,142.39,0,0,0,20.26,45A88.37,88.37,0,0,1,49.63,168Zm101.05,45a142.39,142.39,0,0,0,20.26-45h35.43A88.37,88.37,0,0,1,150.68,213Z"></path>
                  </svg>
                </div>
                <div className="flex flex-col gap-1">
                  <h2 className="text-base leading-tight font-bold text-white">
                    Global Accessibility &amp; Impact
                  </h2>
                  <p className="text-sm leading-normal font-normal text-[#9db2b8]">
                    Empowering individuals and businesses globally, including
                    underserved populations, with secure and accessible
                    financial tools.
                  </p>
                </div>
              </div>
            </div>
            <h2 className="px-4 pt-5 pb-3 text-[22px] leading-tight font-bold tracking-[-0.015em] text-white">
              How GlobalTrust Works
            </h2>
            <div className="grid grid-cols-[40px_1fr] gap-x-2 px-4">
              <div className="flex flex-col items-center gap-1 pt-3">
                <div
                  className="text-white"
                  data-icon="IdentificationCard"
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
                    <path d="M200,112a8,8,0,0,1-8,8H152a8,8,0,0,1,0-16h40A8,8,0,0,1,200,112Zm-8,24H152a8,8,0,0,0,0,16h40a8,8,0,0,0,0-16Zm40-80V200a16,16,0,0,1-16,16H40a16,16,0,0,1-16-16V56A16,16,0,0,1,40,40H216A16,16,0,0,1,232,56ZM216,200V56H40V200H216Zm-80.26-34a8,8,0,1,1-15.5,4c-2.63-10.26-13.06-18-24.25-18s-21.61,7.74-24.25,18a8,8,0,1,1-15.5-4,39.84,39.84,0,0,1,17.19-23.34,32,32,0,1,1,45.12,0A39.76,39.76,0,0,1,135.75,166ZM96,136a16,16,0,1,0-16-16A16,16,0,0,0,96,136Z"></path>
                  </svg>
                </div>
                <div className="h-2 w-[1.5px] grow bg-[#3c4d53]"></div>
              </div>
              <div className="flex flex-1 flex-col py-3">
                <p className="text-base leading-normal font-medium text-white">
                  Create Your GlobalTrust Identity
                </p>
                <p className="text-base leading-normal font-normal text-[#9db2b8]">
                  Set up your decentralized identity on the GlobalTrust
                  platform.
                </p>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="h-2 w-[1.5px] bg-[#3c4d53]"></div>
                <div
                  className="text-white"
                  data-icon="CheckCircle"
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
                    <path d="M173.66,98.34a8,8,0,0,1,0,11.32l-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35A8,8,0,0,1,173.66,98.34ZM232,128A104,104,0,1,1,128,24,104.11,104.11,0,0,1,232,128Zm-16,0a88,88,0,1,0-88,88A88.1,88.1,0,0,0,216,128Z"></path>
                  </svg>
                </div>
                <div className="h-2 w-[1.5px] grow bg-[#3c4d53]"></div>
              </div>
              <div className="flex flex-1 flex-col py-3">
                <p className="text-base leading-normal font-medium text-white">
                  Verify Your Identity and Assets
                </p>
                <p className="text-base leading-normal font-normal text-[#9db2b8]">
                  Use our AI-powered verification tools to validate your
                  credentials and assets across different blockchains.
                </p>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="h-2 w-[1.5px] bg-[#3c4d53]"></div>
                <div
                  className="text-white"
                  data-icon="CurrencyDollar"
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
                    <path d="M152,120H136V56h8a32,32,0,0,1,32,32,8,8,0,0,0,16,0,48.05,48.05,0,0,0-48-48h-8V24a8,8,0,0,0-16,0V40h-8a48,48,0,0,0,0,96h8v64H104a32,32,0,0,1-32-32,8,8,0,0,0-16,0,48.05,48.05,0,0,0,48,48h16v16a8,8,0,0,0,16,0V216h16a48,48,0,0,0,0-96Zm-40,0a32,32,0,0,1,0-64h8v64Zm40,80H136V136h16a32,32,0,0,1,0,64Z"></path>
                  </svg>
                </div>
                <div className="h-2 w-[1.5px] grow bg-[#3c4d53]"></div>
              </div>
              <div className="flex flex-1 flex-col py-3">
                <p className="text-base leading-normal font-medium text-white">
                  Tokenize RWAs
                </p>
                <p className="text-base leading-normal font-normal text-[#9db2b8]">
                  Convert your real-world assets into NFTs, making them tradable
                  and usable in DeFi.
                </p>
              </div>
              <div className="flex flex-col items-center gap-1 pb-3">
                <div className="h-2 w-[1.5px] bg-[#3c4d53]"></div>
                <div
                  className="text-white"
                  data-icon="ChartLine"
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
                    <path d="M232,208a8,8,0,0,1-8,8H32a8,8,0,0,1-8-8V48a8,8,0,0,1,16,0v94.37L90.73,98a8,8,0,0,1,10.07-.38l58.81,44.11L218.73,90a8,8,0,1,1,10.54,12l-64,56a8,8,0,0,1-10.07.38L96.39,114.29,40,163.63V200H224A8,8,0,0,1,232,208Z"></path>
                  </svg>
                </div>
              </div>
              <div className="flex flex-1 flex-col py-3">
                <p className="text-base leading-normal font-medium text-white">
                  Engage in DeFi Activities
                </p>
                <p className="text-base leading-normal font-normal text-[#9db2b8]">
                  Participate in lending, borrowing, and trading activities
                  within our integrated DeFi marketplace.
                </p>
              </div>
            </div>
            <h2 className="px-4 pt-5 pb-3 text-[22px] leading-tight font-bold tracking-[-0.015em] text-white">
              Trusted by Users and Partners
            </h2>
            <div className="[&amp;::-webkit-scrollbar]:hidden flex overflow-y-auto [-ms-scrollbar-style:none] [scrollbar-width:none]">
              <div className="flex items-stretch gap-3 p-4">
                <div className="flex h-full min-w-40 flex-1 flex-col gap-4 rounded-lg">
                  <div className="flex aspect-square w-full flex-col rounded-xl bg-cover bg-center bg-no-repeat"></div>
                  <div>
                    <p className="text-base leading-normal font-medium text-white">
                      Partner Company A
                    </p>
                    <p className="text-sm leading-normal font-normal text-[#9db2b8]">
                      We are proud to partner with leading companies in the
                      blockchain and finance industries.
                    </p>
                  </div>
                </div>
                <div className="flex h-full min-w-40 flex-1 flex-col gap-4 rounded-lg">
                  <div className="flex aspect-square w-full flex-col rounded-xl bg-cover bg-center bg-no-repeat"></div>
                  <div>
                    <p className="text-base leading-normal font-medium text-white">
                      Partner Company B
                    </p>
                    <p className="text-sm leading-normal font-normal text-[#9db2b8]">
                      We are proud to partner with leading companies in the
                      blockchain and finance industries.
                    </p>
                  </div>
                </div>
                <div className="flex h-full min-w-40 flex-1 flex-col gap-4 rounded-lg">
                  <div className="flex aspect-square w-full flex-col rounded-xl bg-cover bg-center bg-no-repeat"></div>
                  <div>
                    <p className="text-base leading-normal font-medium text-white">
                      Partner Company C
                    </p>
                    <p className="text-sm leading-normal font-normal text-[#9db2b8]">
                      We are proud to partner with leading companies in the
                      blockchain and finance industries.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <h2 className="px-4 pt-5 pb-3 text-[22px] leading-tight font-bold tracking-[-0.015em] text-white">
              Security and Compliance
            </h2>
            <p className="px-4 pt-1 pb-3 text-base leading-normal font-normal text-white">
              GlobalTrust prioritizes the security and compliance of our
              platform. We employ industry-leading security measures and adhere
              to relevant regulations to ensure the safety of your data and
              assets.
            </p>
          </div>
        </div>
        <footer className="flex justify-center">
          <div className="flex max-w-[960px] flex-1 flex-col">
            <footer className="@container flex flex-col gap-6 px-5 py-10 text-center">
              <div className="flex flex-wrap items-center justify-center gap-6 @[480px]:flex-row @[480px]:justify-around">
                <a
                  className="min-w-40 text-base leading-normal font-normal text-[#9db2b8]"
                  href="#"
                >
                  Privacy Policy
                </a>
                <a
                  className="min-w-40 text-base leading-normal font-normal text-[#9db2b8]"
                  href="#"
                >
                  Terms of Service
                </a>
                <a
                  className="min-w-40 text-base leading-normal font-normal text-[#9db2b8]"
                  href="#"
                >
                  Contact Us
                </a>
              </div>
              <div className="flex flex-wrap justify-center gap-4">
                <a href="#">
                  <div
                    className="text-[#9db2b8]"
                    data-icon="TwitterLogo"
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
                      <path d="M247.39,68.94A8,8,0,0,0,240,64H209.57A48.66,48.66,0,0,0,168.1,40a46.91,46.91,0,0,0-33.75,13.7A47.9,47.9,0,0,0,120,88v6.09C79.74,83.47,46.81,50.72,46.46,50.37a8,8,0,0,0-13.65,4.92c-4.31,47.79,9.57,79.77,22,98.18a110.93,110.93,0,0,0,21.88,24.2c-15.23,17.53-39.21,26.74-39.47,26.84a8,8,0,0,0-3.85,11.93c.75,1.12,3.75,5.05,11.08,8.72C53.51,229.7,65.48,232,80,232c70.67,0,129.72-54.42,135.75-124.44l29.91-29.9A8,8,0,0,0,247.39,68.94Zm-45,29.41a8,8,0,0,0-2.32,5.14C196,166.58,143.28,216,80,216c-10.56,0-18-1.4-23.22-3.08,11.51-6.25,27.56-17,37.88-32.48A8,8,0,0,0,92,169.08c-.47-.27-43.91-26.34-44-96,16,13,45.25,33.17,78.67,38.79A8,8,0,0,0,136,104V88a32,32,0,0,1,9.6-22.92A30.94,30.94,0,0,1,167.9,56c12.66.16,24.49,7.88,29.44,19.21A8,8,0,0,0,204.67,80h16Z"></path>
                    </svg>
                  </div>
                </a>
                <a href="#">
                  <div
                    className="text-[#9db2b8]"
                    data-icon="LinkedinLogo"
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
                      <path d="M216,24H40A16,16,0,0,0,24,40V216a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V40A16,16,0,0,0,216,24Zm0,192H40V40H216V216ZM96,112v64a8,8,0,0,1-16,0V112a8,8,0,0,1,16,0Zm88,28v36a8,8,0,0,1-16,0V140a20,20,0,0,0-40,0v36a8,8,0,0,1-16,0V112a8,8,0,0,1,15.79-1.78A36,36,0,0,1,184,140ZM100,84A12,12,0,1,1,88,72,12,12,0,0,1,100,84Z"></path>
                    </svg>
                  </div>
                </a>
              </div>
              <p className="text-base leading-normal font-normal text-[#9db2b8]">
                © 2024 GlobalTrust. All rights reserved.
              </p>
            </footer>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Landing;
