"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  label: string;
  href: string;
  children?: NavItem[];
};

function isActivePath(pathname: string, href: string) {
  if (isDocumentLink(href)) return false;
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function isDocumentLink(href: string) {
  return href.endsWith(".html") || href.startsWith("http") || href.startsWith("/tfse/") || href.startsWith("/admin/");
}

export function PublicNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname() || "/";

  return (
    <nav className="main-nav" aria-label="主選單">
      {items.map((item) => {
        const childActive = item.children?.some((child) => isActivePath(pathname, child.href)) ?? false;
        const active = isActivePath(pathname, item.href) || childActive;
        if (item.children?.length) {
          return (
            <details key={item.label} className="nav-group">
              <summary className={active ? "active" : undefined}>
                <span>{item.label}</span>
                <span className="nav-caret" aria-hidden="true" />
              </summary>
              <div className="nav-menu">
                {item.children.map((child) => {
                  const childCurrent = isActivePath(pathname, child.href);
                  if (isDocumentLink(child.href)) {
                    return (
                      <a key={child.href} href={child.href}>
                        {child.label}
                      </a>
                    );
                  }
                  return (
                    <Link
                      key={child.href}
                      href={child.href}
                      className={childCurrent ? "active" : undefined}
                      aria-current={childCurrent ? "page" : undefined}
                    >
                      {child.label}
                    </Link>
                  );
                })}
              </div>
            </details>
          );
        }

        return (
          isDocumentLink(item.href) ? (
            <a key={item.href} href={item.href}>
              {item.label}
            </a>
          ) : (
          <Link
            key={item.href}
            href={item.href}
            className={active ? "active" : undefined}
            aria-current={active ? "page" : undefined}
          >
            {item.label}
          </Link>
          )
        );
      })}
    </nav>
  );
}
