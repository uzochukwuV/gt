const Footer = () => {
  return (
    <footer className="flex justify-center">
      <div className="flex max-w-[960px] flex-1 flex-col">
        <footer className="@container flex flex-col gap-6 px-5 py-10 text-center">
          <div className="flex flex-wrap items-center justify-center gap-6 @[480px]:flex-row @[480px]:justify-around">
            <a
              className="min-w-40 text-base leading-normal font-normal text-[#9cabba]"
              href="#"
            >
              About
            </a>
            <a
              className="min-w-40 text-base leading-normal font-normal text-[#9cabba]"
              href="#"
            >
              Contact
            </a>
            <a
              className="min-w-40 text-base leading-normal font-normal text-[#9cabba]"
              href="#"
            >
              Help
            </a>
            <a
              className="min-w-40 text-base leading-normal font-normal text-[#9cabba]"
              href="#"
            >
              Terms of Service
            </a>
            <a
              className="min-w-40 text-base leading-normal font-normal text-[#9cabba]"
              href="#"
            >
              Privacy Policy
            </a>
          </div>
          <p className="text-base leading-normal font-normal text-[#9cabba]">
            © 2024 GlobalTrust. All rights reserved.
          </p>
        </footer>
      </div>
    </footer>
  );
};

export default Footer;
