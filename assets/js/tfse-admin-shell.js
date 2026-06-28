(function () {
    "use strict";

    var body = document.body;
    var searchLayer = document.querySelector(".main-search-active");
    var searchToggle = document.querySelector(".header-search-toggle");
    var searchClose = document.querySelector("button.search-close");
    var searchInput = searchLayer ? searchLayer.querySelector("input[type='search'], input[type='text']") : null;
    var mobileMenu = document.querySelector(".site-mobile-menu");
    var mobileMenuInner = document.querySelector(".site-main-mobile-menu-inner");
    var mobileMenuToggles = document.querySelectorAll(".header-mobile-menu-toggle .toggle, .mobile-menu-close .toggle");

    function directSubmenu(item) {
        return item ? item.querySelector(":scope > .sub-menu, :scope > .mega-menu") : null;
    }

    function setSearchOpen(open) {
        if (!searchLayer) return;
        searchLayer.classList.toggle("inside", open);
        if (open && searchInput) {
            window.setTimeout(function () {
                searchInput.focus();
            }, 0);
        }
    }

    function setMobileMenuOpen(open) {
        if (!body) return;
        body.classList.toggle("mobile-menu-open", open);
    }

    function closeSiblingSubmenus(item) {
        if (!item || !item.parentElement) return;
        Array.prototype.forEach.call(item.parentElement.children, function (sibling) {
            if (sibling === item) return;
            sibling.classList.remove("open");
            var submenu = directSubmenu(sibling);
            if (submenu) submenu.style.display = "none";
        });
    }

    if (searchToggle) {
        searchToggle.addEventListener("click", function (event) {
            event.preventDefault();
            setSearchOpen(true);
        });
    }

    if (searchClose) {
        searchClose.addEventListener("click", function (event) {
            event.preventDefault();
            setSearchOpen(false);
        });
    }

    if (searchLayer) {
        searchLayer.addEventListener("click", function (event) {
            if (!event.target.closest(".sidebar-search-input")) {
                setSearchOpen(false);
            }
        });
    }

    Array.prototype.forEach.call(mobileMenuToggles, function (button) {
        button.addEventListener("click", function (event) {
            event.preventDefault();
            setMobileMenuOpen(!body.classList.contains("mobile-menu-open"));
        });
    });

    if (mobileMenu) {
        Array.prototype.forEach.call(mobileMenu.querySelectorAll(".menu-toggle"), function (toggle) {
            toggle.addEventListener("click", function (event) {
                event.preventDefault();
                var item = toggle.parentElement;
                var submenu = directSubmenu(item);
                if (!item || !submenu) return;
                var willOpen = !item.classList.contains("open");
                closeSiblingSubmenus(item);
                item.classList.toggle("open", willOpen);
                submenu.style.display = willOpen ? "block" : "none";
            });
        });
    }

    document.addEventListener("click", function (event) {
        if (body.classList.contains("mobile-menu-open")
            && mobileMenuInner
            && !event.target.closest(".site-main-mobile-menu-inner")
            && !event.target.closest(".header-mobile-menu-toggle")) {
            setMobileMenuOpen(false);
        }
    });

    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape") {
            setSearchOpen(false);
            setMobileMenuOpen(false);
        }
    });
})();
