(function () {
  "use strict";

  var menuBtn = document.getElementById("menuBtn");
  var menuPanel = document.getElementById("menuPanel");
  var menuSessionsBtn = document.getElementById("menuSessionsBtn");
  var menuSessionsFlyout = document.getElementById("menuSessionsFlyout");
  var menuSignOutLink = document.getElementById("menuSignOutLink");

  if (!menuBtn || !menuPanel) {
    return;
  }

  function closeMenu() {
    menuPanel.classList.add("is-hidden");
    menuBtn.setAttribute("aria-expanded", "false");
    if (menuSessionsFlyout) {
      menuSessionsFlyout.classList.add("is-hidden");
    }
  }

  menuBtn.addEventListener("click", function (event) {
    event.stopPropagation();
    var isOpen = !menuPanel.classList.contains("is-hidden");
    menuPanel.classList.toggle("is-hidden", isOpen);
    menuBtn.setAttribute("aria-expanded", String(!isOpen));
  });

  menuPanel.addEventListener("click", function (event) {
    event.stopPropagation();
  });

  document.addEventListener("click", closeMenu);

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      closeMenu();
    }
  });

  if (menuSessionsBtn && menuSessionsFlyout) {
    menuSessionsBtn.addEventListener("click", function (event) {
      event.stopPropagation();
      menuSessionsFlyout.classList.toggle("is-hidden");
    });
  }

  if (menuSignOutLink) {
    menuSignOutLink.addEventListener("click", function (event) {
      if (!window.__authSync || typeof window.__authSync.signOut !== "function") {
        return;
      }
      event.preventDefault();
      window.__authSync.signOut({ redirectTo: window.location.pathname || "/" });
    });
  }
})();
