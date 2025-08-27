import { Link } from "react-router-dom";

const Sidebar = () => {
  return (
    <div className="layout-content-container flex w-80 flex-col">
      <div className="flex h-full min-h-[700px] flex-col justify-between bg-[#111418] p-4">
        <div className="flex flex-col gap-4">
          <div className="flex gap-3">
            <div
              className="aspect-square size-10 rounded-full bg-cover bg-center bg-no-repeat"
              style={{
                backgroundImage:
                  'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBahl_v8V_k4KiWAYshr-59laCm59Ogk2-a8Y0F3aTTdbLILXds9gZhdXmpoF3UKNrL9QsS6IHKU1Bh6aHO2xBkswPo12R3Jecisa6m657SJfNgiNVYLuBaXf8s1omKGjSNf4hT-xkDclq3Zhc8UtzBhm_aTv6sqelMUG-1Yxk8dJnq9nSxchREIrLuvz1jIp4SUlUXUDBHo-8kpMBONjqf1PMqX3e2_mEZL8DtGtYwHrDm9Xycbew5GPtG5fn08pDLTF6OMqlsw-Y")',
              }}
            ></div>
            <h1 className="text-base leading-normal font-medium text-white">
              GlobalTrust
            </h1>
          </div>
          <div className="flex flex-col gap-2">
            <Link to="/dashboard" className="flex items-center gap-3 px-3 py-2">
              <div
                className="text-white"
                data-icon="House"
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
                  <path d="M218.83,103.77l-80-75.48a1.14,1.14,0,0,1-.11-.11,16,16,0,0,0-21.53,0l-.11.11L37.17,103.77A16,16,0,0,0,32,115.55V208a16,16,0,0,0,16,16H96a16,16,0,0,0,16-16V160h32v48a16,16,0,0,0,16,16h48a16,16,0,0,0,16-16V115.55A16,16,0,0,0,218.83,103.77ZM208,208H160V160a16,16,0,0,0-16-16H112a16,16,0,0,0-16,16v48H48V115.55l.11-.1L128,40l79.9,75.43.11.1Z"></path>
                </svg>
              </div>
              <p className="text-sm leading-normal font-medium text-white">
                Dashboard
              </p>
            </Link>
            <Link
              to="/lending"
              className="flex items-center gap-3 rounded-lg bg-[#283039] px-3 py-2"
            >
              <div
                className="text-white"
                data-icon="ArrowUpRight"
                data-size="24px"
                data-weight="fill"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24px"
                  height="24px"
                  fill="currentColor"
                  viewBox="0 0 256 256"
                >
                  <path d="M200,64V168a8,8,0,0,1-13.66,5.66L140,127.31,69.66,197.66a8,8,0,0,1-11.32-11.32L128.69,116,82.34,69.66A8,8,0,0,1,88,56H192A8,8,0,0,1,200,64Z"></path>
                </svg>
              </div>
              <p className="text-sm leading-normal font-medium text-white">
                Lend
              </p>
            </Link>
            <Link to="#" className="flex items-center gap-3 px-3 py-2">
              <div
                className="text-white"
                data-icon="ArrowDownLeft"
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
                  <path d="M197.66,69.66,83.31,184H168a8,8,0,0,1,0,16H64a8,8,0,0,1-8-8V88a8,8,0,0,1,16,0v84.69L186.34,58.34a8,8,0,0,1,11.32,11.32Z"></path>
                </svg>
              </div>
              <p className="text-sm leading-normal font-medium text-white">
                Borrow
              </p>
            </Link>
            <Link
              to="/marketplace"
              className="flex items-center gap-3 px-3 py-2"
            >
              <div
                className="text-white"
                data-icon="Storefront"
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
                  <path d="M240,216H224V115.55a16,16,0,0,0-8.89-14.67l-80-40a16,16,0,0,0-14.22,0l-80,40A16,16,0,0,0,32,115.55V216H16a8,8,0,0,0,0,16H240a8,8,0,0,0,0-16ZM48,115.55l72-36v36.8l-48,24v-24.8Zm80,104.45V128h48v48H160v32H144V176H112v44H96V128h16v92.45l-56-28V128l64-32,64,32v68.45Z"></path>
                </svg>
              </div>
              <p className="text-sm leading-normal font-medium text-white">
                Marketplace
              </p>
            </Link>
            <Link to="#" className="flex items-center gap-3 px-3 py-2">
              <div
                className="text-white"
                data-icon="Briefcase"
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
                  <path d="M216,56H176V48a24,24,0,0,0-24-24H104A24,24,0,0,0,80,48v8H40A16,16,0,0,0,24,72V200a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V72A16,16,0,0,0,216,56ZM96,48a8,8,0,0,1,8-8h48a8,8,0,0,1,8,8v8H96ZM216,72v41.61A184,184,0,0,1,128,136a184.07,184.07,0,0,1-88-22.38V72Zm0,128H40V131.64A200.19,200.19,0,0,0,128,152a200.25,200.25,0,0,0,88-20.37V200ZM104,112a8,8,0,0,1,8-8h32a8,8,0,0,1,0,16H112A8,8,0,0,1,104,112Z"></path>
                </svg>
              </div>
              <p className="text-sm leading-normal font-medium text-white">
                Portfolio
              </p>
            </Link>
            <Link to="#" className="flex items-center gap-3 px-3 py-2">
              <div
                className="text-white"
                data-icon="Clock"
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
                  <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm64-88a8,8,0,0,1-8,8H128a8,8,0,0,1-8-8V72a8,8,0,0,1,16,0v48h48A8,8,0,0,1,192,128Z"></path>
                </svg>
              </div>
              <p className="text-sm leading-normal font-medium text-white">
                Activity
              </p>
            </Link>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3 px-3 py-2">
            <div
              className="text-white"
              data-icon="Question"
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
                <path d="M140,180a12,12,0,1,1-12-12A12,12,0,0,1,140,180ZM128,72c-22.06,0-40,16.15-40,36v4a8,8,0,0,0,16,0v-4c0-11,10.77-20,24-20s24,9,24,20-10.77,20-24,20a8,8,0,0,0-8,8v8a8,8,0,0,0,16,0v-.72c18.24-3.35,32-17.9,32-35.28C168,88.15,150.06,72,128,72Zm104,56A104,104,0,1,1,128,24,104.11,104.11,0,0,1,232,128Zm-16,0a88,88,0,1,0-88,88A88.1,88.1,0,0,0,216,128Z"></path>
              </svg>
            </div>
            <p className="text-sm leading-normal font-medium text-white">
              Help and Feedback
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
