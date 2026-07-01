"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "./Icons";

type Language = "zh-TW" | "zh-CN";

const originalText = new WeakMap<Text, string>();

const traditionalToSimplified: Record<string, string> = {
  銀: "银",
  俠: "侠",
  樂: "乐",
  專: "专",
  貸: "贷",
  學: "学",
  費: "费",
  評: "评",
  機: "机",
  為: "为",
  會: "会",
  構: "构",
  這: "这",
  協: "协",
  資: "资",
  與: "与",
  辦: "办",
  諮: "咨",
  詢: "询",
  頁: "页",
  業: "业",
  見: "见",
  尋: "寻",
  轉: "转",
  讓: "让",
  對: "对",
  應: "应",
  務: "务",
  內: "内",
  聯: "联",
  繫: "系",
  總: "总",
  線: "线",
  單: "单",
  寫: "写",
  預: "预",
  約: "约",
  審: "审",
  準: "准",
  備: "备",
  結: "结",
  進: "进",
  個: "个",
  證: "证",
  財: "财",
  說: "说",
  風: "风",
  險: "险",
  調: "调",
  彈: "弹",
  運: "运",
  滿: "满",
  產: "产",
  買: "买",
  規: "规",
  劃: "划",
  營: "营",
  報: "报",
  稅: "税",
  長: "长",
  電: "电",
  話: "话",
  國: "国",
  處: "处",
  條: "条",
  發: "发",
  佈: "布",
  問: "问",
  題: "题",
  詳: "详",
  驟: "骤",
  點: "点",
  擊: "击",
  請: "请",
  選: "选",
  擇: "择",
  開: "开",
  啟: "启",
  關: "关",
  閉: "闭",
  後: "后",
  護: "护",
  隱: "隐",
  讀: "读",
  體: "体",
  實: "实",
  階: "阶",
  段: "段",
  類: "类",
  數: "数",
  據: "据",
  變: "变",
  輸: "输",
  載: "载",
  檢: "检",
  覽: "览",
  圖: "图",
  書: "书",
  標: "标",
  錯: "错",
  認: "认",
  錄: "录",
  還: "还",
  償: "偿",
  餘: "余",
  額: "额",
  確: "确",
  獲: "获",
  續: "续",
  們: "们",
};

function toSimplified(value: string) {
  return value.replace(/[\u4e00-\u9fff]/g, (char) => traditionalToSimplified[char] || char);
}

function shouldSkipTextNode(node: Text) {
  const parent = node.parentElement;
  return !parent || Boolean(parent.closest("script, style, noscript, textarea, input, select, option, [data-no-translate], [data-language-toggle]"));
}

function applyLanguage(language: Language, root: ParentNode = document.body) {
  if (!root) return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode() as Text | null;
  while (node) {
    if (!shouldSkipTextNode(node)) {
      if (!originalText.has(node)) originalText.set(node, node.nodeValue || "");
      const source = originalText.get(node) || "";
      node.nodeValue = language === "zh-CN" ? toSimplified(source) : source;
    }
    node = walker.nextNode() as Text | null;
  }
  document.documentElement.lang = language === "zh-CN" ? "zh-Hans" : "zh-Hant";
}

function getInitialLanguage(): Language {
  if (typeof window === "undefined") return "zh-TW";
  const urlLanguage = new URL(window.location.href).searchParams.get("lang");
  if (urlLanguage === "zh-CN" || urlLanguage === "zh-TW") return urlLanguage;
  return window.localStorage.getItem("bank_club_language") === "zh-CN" ? "zh-CN" : "zh-TW";
}

export function LanguageToggle() {
  const [language, setLanguage] = useState<Language>(getInitialLanguage);
  const languageRef = useRef<Language>(language);

  useEffect(() => {
    applyLanguage(languageRef.current);
    const observer = new MutationObserver(() => applyLanguage(languageRef.current));
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    languageRef.current = language;
    applyLanguage(language);
  }, [language]);

  function updateLanguage() {
    const nextLanguage: Language = language === "zh-TW" ? "zh-CN" : "zh-TW";
    setLanguage(nextLanguage);
    window.localStorage.setItem("bank_club_language", nextLanguage);
    const url = new URL(window.location.href);
    url.searchParams.set("lang", nextLanguage);
    window.history.replaceState({}, "", url);
  }

  return (
    <button
      type="button"
      className="language-toggle"
      data-language-toggle
      aria-label={language === "zh-TW" ? "切換簡體中文" : "切換繁體中文"}
      title={language === "zh-TW" ? "切換簡體中文" : "切換繁體中文"}
      onClick={updateLanguage}
    >
      <Icon name="globe" />
      <span>{language === "zh-TW" ? "繁" : "简"}</span>
    </button>
  );
}
