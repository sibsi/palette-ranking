import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { useFolder } from "../../context/FolderContext";
import { isDemo } from "../../lib/platform";
import { useLayout } from "./MainLayout";
import ThemeToggle from "../ui/ThemeToggle";
import GridControls from "../ui/GridControls";
import Logo from "../ui/Logo";
import FolderTabs from "../ui/FolderTabs";
import TopbarButton from "../ui/TopbarButton";

interface TopbarProps {
  showLogo?: boolean; // logo is not displayed on welcome screen
}

export default function Topbar({ showLogo = true }: TopbarProps) {
  const {
    tabs,
    activeFolderPath,
    openFolder,
    setActiveFolder,
    closeFolder,
    rescanActiveFolder,
    status,
  } = useFolder();
  const { isWelcomeOpen, openWelcome, dismissWelcome } = useLayout();
  const [isAddingFolder, setIsAddingFolder] = useState(false);

  const visibleFolderPath = isWelcomeOpen ? null : activeFolderPath;
  const isRescanning = visibleFolderPath !== null && status === "loading";

  // in case scan gets cancelled
  const handleAddFolder = async () => {
    setIsAddingFolder(true);
    try {
      const opened = await openFolder();
      if (opened) dismissWelcome();
    } finally {
      setIsAddingFolder(false);
    }
  };

  const handleSelectFolder = (path: string) => {
    dismissWelcome();
    setActiveFolder(path);
  };

  return (
    <header className="z-50 flex w-full items-center justify-between gap-4 px-5 py-3">
      <div className="flex min-w-0 items-center gap-3">
        {showLogo && (
          <div className="h-9 shrink-0">
            <Logo onClick={openWelcome} isTopbar />
          </div>
        )}

        {tabs.length > 0 && (
          <TopbarSection>
            <FolderTabs
              tabs={tabs}
              activeFolderPath={visibleFolderPath}
              onSelect={handleSelectFolder}
              onClose={closeFolder}
              onOpenFolder={handleAddFolder}
              isAddingFolder={isAddingFolder}
              disableOpenFolder={isDemo}
              canCloseTabs={!isDemo}
            />

            {visibleFolderPath && (
              <>
                <TopbarDivider />
                <TopbarButton
                  onClick={() => void rescanActiveFolder()}
                  disabled={isRescanning || isDemo}
                  title="Rescan active folder"
                >
                  <RefreshCw
                    className={`h-3.5 w-3.5 ${isRescanning ? "animate-spin" : ""}`}
                  />
                </TopbarButton>
              </>
            )}
          </TopbarSection>
        )}
      </div>
      <TopbarSection>
        <ThemeToggle />
        <TopbarDivider />
        <GridControls />
      </TopbarSection>
    </header>
  );
}

function TopbarSection({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-chrome flex min-w-0 items-center gap-1 rounded-full border px-2 py-1.5 backdrop-blur-xl transition-all">
      {children}
    </div>
  );
}

function TopbarDivider() {
  return <div className="app-divider mx-0.5 h-4 w-px shrink-0" />;
}
