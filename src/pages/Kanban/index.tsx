import { useMemo, useState } from "react";
import { useDataContext } from "../../context/DataContext";
import Header from "../../components/Header";
import { SidebarDesktop } from "../../components/Sidebar";
import Content, { NoContent } from "../../components/Content";
import useMatchMedia from "../../hooks/useMatchMedia";
import "../../components/App/App.css";

export default function KanbanPage() {
  const [isSidebarHidden, setIsSidebarHidden] = useState(false);
  const dataContext = useDataContext();
  const selectedBoard = useMemo(
    () => dataContext.datas.find((b) => b.id === dataContext.selectedIdBoard),
    [dataContext]
  );

  return (
    <>
      <Header
        isSidebarHidden={isSidebarHidden}
        onSidebar={(h) => setIsSidebarHidden(h)}
        selectedBoard={selectedBoard}
      />
      {useMatchMedia({
        mobileContent: null,
        desktopContent: (
          <SidebarDesktop
            isSidebarHidden={isSidebarHidden}
            onSidebar={(h) => setIsSidebarHidden(h)}
          />
        ),
        mediaQuery: "(min-width: 690px)",
      })}
      {selectedBoard ? (
        <Content selectedBoard={selectedBoard} />
      ) : (
        <NoContent />
      )}
    </>
  );
}
