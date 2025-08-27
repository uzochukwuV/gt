import { Link } from "react-router-dom";
import IdentityManager from "./IdentityManager";

const Header = () => {
  return (
    <header className="flex items-center justify-between border-b border-solid border-b-[#283039] px-10 py-3 whitespace-nowrap">
      <div className="flex items-center gap-8">
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
        <nav className="flex items-center gap-9">
          <Link
            className="text-sm leading-normal font-medium text-white"
            to="/dashboard"
          >
            Dashboard
          </Link>
          <Link
            className="text-sm leading-normal font-medium text-white"
            to="/verify-assets"
          >
            Verify Assets
          </Link>
          <Link
            className="text-sm leading-normal font-medium text-white"
            to="/cross-chain-bridge"
          >
            Bridge
          </Link>
          <Link
            className="text-sm leading-normal font-medium text-white"
            to="/lending"
          >
            Lend
          </Link>
          <Link
            className="text-sm leading-normal font-medium text-white"
            to="/marketplace"
          >
            Marketplace
          </Link>
          <Link
            className="text-sm leading-normal font-medium text-white"
            to="/governance"
          >
            Governance
          </Link>
        </nav>
      </div>
      <div className="flex flex-1 justify-end gap-8">
        <label className="flex !h-10 max-w-64 min-w-40 flex-col">
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
              placeholder="Search"
              className="form-input flex h-full w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg rounded-l-none border-l-0 border-none bg-[#283039] px-4 pl-2 text-base leading-normal font-normal text-white placeholder:text-[#9cabba] focus:border-none focus:ring-0 focus:outline-0"
              defaultValue=""
            />
          </div>
        </label>
        <IdentityManager />
      </div>
    </header>
  );
};

export default Header;
