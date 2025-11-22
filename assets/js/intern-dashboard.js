// Dashboard page logic: load profile, leaves, announcements and wire Policy Buddy

document.addEventListener("DOMContentLoaded", function () {
  const greetingEl = document.getElementById("topbar-greeting");
  const monthEl = document.getElementById("topbar-month");
  const avatarEl = document.getElementById("topbar-avatar");

  const welcomeTitleEl = document.getElementById("welcome-title");
  const welcomeSubtitleEl = document.getElementById("welcome-subtitle");
  const welcomePeriodEl = document.getElementById("welcome-period");
  const welcomeStipendEl = document.getElementById("welcome-stipend");

  const statPaidLeftEl = document.getElementById("stat-paid-left");
  const statUnpaidEl = document.getElementById("stat-unpaid");
  const statNextInvoiceEl = document.getElementById("stat-next-invoice");

  const announcementsListEl = document.getElementById("announcements-list");

  const chatMessagesEl = document.getElementById("policy-chat-messages");
  const chatFormEl = document.getElementById("policy-chat-form");
  const chatInputEl = document.getElementById("policy-input");

  // Set month label
  if (monthEl) {
    monthEl.textContent = getCurrentMonthLabel();
  }

  // Load profile + leaves + announcements
  Promise.all([
    apiGet("/intern/profile"),
    apiGet("/intern/leaves"),
    apiGet("/intern/announcements"),
  ])
    .then(function ([profile, leaves, announcements]) {
      renderProfile(profile);
      renderStats(profile, leaves);
      renderAnnouncements(announcements);
    })
    .catch(function (err) {
      console.error("Failed to load dashboard data", err);
      if (announcementsListEl) {
        announcementsListEl.innerHTML =
          '<p class="text-xs text-red-500">Could not load dashboard data.</p>';
      }
    });

  function renderProfile(profile) {
    if (!profile) return;
    const name = profile.name || "Intern";
    if (greetingEl) {
      greetingEl.textContent = "Hi, " + name.split(" ")[0];
    }
    if (avatarEl) {
      const initials = name
        .split(" ")
        .map(function (n) {
          return n[0];
        })
        .join("")
        .slice(0, 2)
        .toUpperCase();
      avatarEl.textContent = initials || "IN";
    }
    if (welcomeTitleEl) {
      welcomeTitleEl.textContent = "Hey " + name + " 👋";
    }
    if (welcomeSubtitleEl) {
      var role = profile.role || "Intern";
      var manager = profile.manager ? " · " + profile.manager : "";
      welcomeSubtitleEl.textContent =
        "You are logged in as a " + role + manager + ".";
    }
    if (welcomePeriodEl) {
      welcomePeriodEl.textContent =
        "Internship: " +
        formatDateHuman(profile.internshipStart) +
        " – " +
        formatDateHuman(profile.internshipEnd);
    }
    if (welcomeStipendEl) {
      var stipend = profile.stipendPerMonth || 0;
      welcomeStipendEl.textContent =
        "Stipend: ₹" + stipend.toLocaleString("en-IN") + " / month";
    }
  }

  function renderStats(profile, leaves) {
    leaves = leaves || [];
    var paidUsed = leaves.filter(function (l) {
      return l.type === "PAID";
    }).length;
    var unpaidCount = leaves.filter(function (l) {
      return l.type === "UNPAID";
    }).length;

    // Simple policy: 1 paid leave per month since start
    var start = profile && profile.internshipStart
      ? new Date(profile.internshipStart)
      : null;
    var now = new Date();
    var monthsEarned = 0;
    if (start && !Number.isNaN(start.getTime())) {
      monthsEarned =
        (now.getFullYear() - start.getFullYear()) * 12 +
        (now.getMonth() - start.getMonth()) +
        1;
    }
    var totalPaidEntitled = Math.max(0, monthsEarned);
    var paidLeft = Math.max(0, totalPaidEntitled - paidUsed);

    if (statPaidLeftEl) {
      statPaidLeftEl.textContent = String(paidLeft);
    }
    if (statUnpaidEl) {
      statUnpaidEl.textContent = String(unpaidCount);
    }

    if (statNextInvoiceEl) {
      var nextMonth = now.getMonth() + 1;
      var nextYear = now.getFullYear();
      var invoiceNumber = calculateInvoiceNumber(
        profile ? profile.internshipStart : now.toISOString(),
        nextMonth,
        nextYear
      );
      statNextInvoiceEl.textContent =
        formatMonthYear(nextMonth, nextYear) + " · " + invoiceNumber;
    }
  }

  function renderAnnouncements(items) {
    if (!announcementsListEl) return;
    if (!items || !items.length) {
      announcementsListEl.innerHTML =
        '<p class="text-xs text-slate-400">No announcements right now.</p>';
      return;
    }
    announcementsListEl.innerHTML = "";
    items.forEach(function (a) {
      var row = document.createElement("div");
      row.className = "flex items-start gap-2";
      row.innerHTML =
        '<span class="mt-1 h-1.5 w-1.5 rounded-full bg-brand-500"></span>' +
        '<div class="flex-1">' +
        '<p class="text-xs font-medium text-slate-800">' +
        (a.title || "") +
        "</p>" +
        '<p class="text-[11px] text-slate-500">' +
        (a.body || "") +
        "</p>" +
        "</div>";
      announcementsListEl.appendChild(row);
    });
  }

  // Policy Buddy chat behavior
  function appendMessage(role, text) {
    if (!chatMessagesEl || !text) return;
    var container = document.createElement("div");
    container.className =
      "flex " + (role === "user" ? "justify-end" : "justify-start");

    var bubble = document.createElement("div");
    bubble.className =
      "max-w-[80%] rounded-2xl px-3 py-2 text-[11px] " +
      (role === "user"
        ? "rounded-br-sm bg-brand-600 text-white"
        : "rounded-bl-sm bg-slate-900 text-slate-50");
    bubble.textContent = text;
    container.appendChild(bubble);
    chatMessagesEl.appendChild(container);
    chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
  }

  if (chatFormEl && chatInputEl) {
    chatFormEl.addEventListener("submit", function (e) {
      e.preventDefault();
      var question = chatInputEl.value.trim();
      if (!question) return;
      appendMessage("user", question);
      chatInputEl.value = "";

      apiPost("/api/ai/policy-buddy", { question: question })
        .then(function (res) {
          appendMessage("bot", res.answer || "I am not sure, try rephrasing.");
        })
        .catch(function () {
          appendMessage(
            "bot",
            "Hmm, something went wrong. Please try asking again in a bit."
          );
        });
    });
  }
});


