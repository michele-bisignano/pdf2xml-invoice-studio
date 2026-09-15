import React from "react";
import { Moon, Sun, Globe, Building2 } from "lucide-react";
import { Language, Theme } from "../types";
import { translations } from "../utils/i18n";

interface HeaderProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  theme: Theme;
  onThemeToggle: () => void;
  onOpenBuyerSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  language,
  onLanguageChange,
  theme,
  onThemeToggle,
  onOpenBuyerSettings,
}) => {
  const t = translations[language];

  return (
    <header className="w-full border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors">
      <div className="max-w-4xl mx-auto px-4 py-3 sm:py-4 flex flex-wrap items-center justify-between gap-3">
        {/* Logo and App Title */}
        <div className="flex items-center space-x-3">
          <img
            src="/icon.png"
            alt="App Icon"
            className="w-10 h-10 object-contain rounded-lg border border-slate-200 dark:border-slate-700 p-0.5 bg-white shadow-xs"
          />
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                {t.appTitle}
              </h1>
              <span className="hidden sm:inline-flex text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                {t.headerBadge}
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
              {t.appSubtitle}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2">
          {/* Buyer Settings Button */}
          <button
            type="button"
            onClick={onOpenBuyerSettings}
            className="inline-flex items-center space-x-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-md border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 hover:border-slate-400 transition-colors shadow-2xs"
            title={t.buyerSettingsTitle}
          >
            <Building2 className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
            <span className="hidden md:inline">{t.buyerSettingsBtn}</span>
          </button>

          {/* Language Switcher */}
          <button
            type="button"
            onClick={() => onLanguageChange(language === "IT" ? "EN" : "IT")}
            className="inline-flex items-center space-x-1 px-2.5 py-1.5 text-xs font-semibold rounded-md border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-2xs"
            title={language === "IT" ? "Switch to English" : "Passa a Italiano"}
          >
            <Globe className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
            <span>{language}</span>
          </button>

          {/* Theme Switcher */}
          <button
            type="button"
            onClick={onThemeToggle}
            className="p-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-2xs"
            title={theme === "light" ? t.themeDark : t.themeLight}
            aria-label="Toggle theme"
          >
            {theme === "light" ? (
              <Moon className="w-4 h-4 text-slate-700" />
            ) : (
              <Sun className="w-4 h-4 text-amber-400" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
