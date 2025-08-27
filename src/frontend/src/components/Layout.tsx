import Header from "./Header";

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div
      className="dark group/design-root relative flex size-full min-h-screen flex-col overflow-x-hidden bg-[#111418]"
      style={{ fontFamily: 'Inter, "Noto Sans", sans-serif' }}
    >
      <div className="layout-container flex h-full grow flex-col">
        <Header />
        <main className="flex flex-1 justify-center px-40 py-5">
          <div className="layout-content-container flex max-w-[960px] flex-1 flex-col">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
