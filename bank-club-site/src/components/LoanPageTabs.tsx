"use client";

import { type MouseEvent, type ReactNode, useCallback, useEffect, useRef, useState } from "react";

export type LoanPageTab = {
  id: string;
  label: string;
  title: string;
  description?: string;
  content: ReactNode;
};

type Props = {
  tabs: LoanPageTab[];
  defaultTabId?: string;
};

export function LoanPageTabs({ tabs, defaultTabId }: Props) {
  const tabsRef = useRef<HTMLElement>(null);
  const [activeTabId, setActiveTabId] = useState(defaultTabId || tabs[0]?.id || "");
  const activeTab = tabs.find((tab) => tab.id === activeTabId) || tabs[0];

  const scrollTabsIntoView = useCallback(() => {
    window.requestAnimationFrame(() => {
      tabsRef.current?.scrollIntoView({ block: "start" });
    });
  }, []);

  const findTabFromHash = useCallback(
    (hash: string) => {
      const normalizedHash = hash.replace("#", "");
      return tabs.find((tab) => tab.id === normalizedHash || `${tab.id}-panel` === normalizedHash);
    },
    [tabs],
  );

  const selectTab = useCallback(
    (tabId: string, updateHash = true) => {
      setActiveTabId(tabId);
      if (updateHash) window.history.replaceState(null, "", `#${tabId}`);
      scrollTabsIntoView();
    },
    [scrollTabsIntoView],
  );

  useEffect(() => {
    function syncHashToTab() {
      const matchingTab = findTabFromHash(window.location.hash);
      if (matchingTab) {
        selectTab(matchingTab.id, false);
      }
    }

    function handleDocumentClick(event: globalThis.MouseEvent) {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      const link = target.closest("a[href^='#']");
      const href = link?.getAttribute("href") || "";
      const matchingTab = findTabFromHash(href);
      if (!matchingTab) return;
      event.preventDefault();
      selectTab(matchingTab.id);
    }

    syncHashToTab();
    document.addEventListener("click", handleDocumentClick);
    window.addEventListener("hashchange", syncHashToTab);
    return () => {
      document.removeEventListener("click", handleDocumentClick);
      window.removeEventListener("hashchange", syncHashToTab);
    };
  }, [findTabFromHash, selectTab]);

  if (!activeTab) return null;

  function handleLinkClickCapture(event: MouseEvent<HTMLElement>) {
    const link = (event.target as HTMLElement).closest("a[href^='#']");
    if (!link) return;
    const href = link.getAttribute("href") || "";
    const targetTab = findTabFromHash(href);
    if (!targetTab) return;
    event.preventDefault();
    selectTab(targetTab.id);
  }

  return (
    <section
      ref={tabsRef}
      className="loan-tabs"
      id="loan-tabs"
      aria-label="貸款頁內導覽"
      data-active-tab={activeTab.id}
      data-default-tab={defaultTabId || tabs[0]?.id || ""}
      onClickCapture={handleLinkClickCapture}
    >
      <div className="loan-tab-list" role="tablist" aria-label="貸款資訊分類">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            id={`${tab.id}-tab`}
            type="button"
            role="tab"
            aria-controls={`${tab.id}-panel`}
            aria-selected={tab.id === activeTab.id}
            className={tab.id === activeTab.id ? "active" : ""}
            onClick={() => selectTab(tab.id, false)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div key={activeTab.id} id={`${activeTab.id}-panel`} className="loan-tab-panel" role="tabpanel" aria-labelledby={`${activeTab.id}-tab`}>
        <div className="section-heading">
          <h2>{activeTab.title}</h2>
          {activeTab.description ? <p>{activeTab.description}</p> : null}
        </div>
        {activeTab.content}
      </div>
    </section>
  );
}
