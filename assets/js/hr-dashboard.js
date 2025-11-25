// HR dashboard logic: load summary metrics and recent activity

document.addEventListener("DOMContentLoaded", function () {
  var nameEl = document.getElementById("hr-topbar-name");
  var avatarEl = document.getElementById("hr-topbar-avatar");
  var dateEl = document.getElementById("hr-topbar-date");

  var welcomeTitleEl = document.getElementById("hr-welcome-title");
  var welcomeSubtitleEl = document.getElementById("hr-welcome-subtitle");

  var summaryInternsEl = document.getElementById("hr-summary-interns");
  var summaryPendingEl = document.getElementById("hr-summary-pending");
  var summaryInvoicesEl = document.getElementById("hr-summary-invoices");

  var metricActiveEl = document.getElementById("hr-metric-active-interns");
  var metricPendingEl = document.getElementById("hr-metric-pending-leaves");
  var metricInvoicesMonthEl = document.getElementById(
    "hr-metric-invoices-month"
  );

  var activityListEl = document.getElementById("hr-activity-list");

  // Set today label
  if (dateEl) {
    var now = new Date();
    dateEl.textContent = now.toLocaleDateString(undefined, {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  apiGet("/hr/summary")
    .then(function (summary) {
      renderHeader(summary.hr || {});
      renderMetrics(summary.counts || {});
      renderActivity(summary.activity || []);
    })
    .catch(function (err) {
      console.error("Failed to load HR summary", err);
      if (activityListEl) {
        activityListEl.innerHTML =
          '<p class="text-xs text-red-500">Could not load HR activity.</p>';
      }
    });

  function renderHeader(hr) {
    var name = hr.name || "HR Admin";
    if (nameEl) nameEl.textContent = name;
    if (avatarEl) {
      var initials = name
        .split(" ")
        .map(function (n) {
          return n[0];
        })
        .join("")
        .slice(0, 2)
        .toUpperCase();
      avatarEl.textContent = initials || "HR";
    }
    if (welcomeTitleEl) {
      welcomeTitleEl.textContent = "Welcome, " + name + " 👋";
    }
    if (welcomeSubtitleEl) {
      welcomeSubtitleEl.textContent =
        "You can see all interns, pending leaves, and invoices in one place.";
    }
  }

  function renderMetrics(counts) {
    var active = counts.activeInterns || 0;
    var pending = counts.pendingLeaves || 0;
    var invoices = counts.invoicesThisMonth || 0;

    if (summaryInternsEl) {
      summaryInternsEl.textContent = "Active interns: " + active;
    }
    if (summaryPendingEl) {
      summaryPendingEl.textContent = "Pending leaves: " + pending;
    }
    if (summaryInvoicesEl) {
      summaryInvoicesEl.textContent =
        "Invoices this month: " + invoices;
    }

    if (metricActiveEl) metricActiveEl.textContent = String(active);
    if (metricPendingEl) metricPendingEl.textContent = String(pending);
    if (metricInvoicesMonthEl)
      metricInvoicesMonthEl.textContent = String(invoices);
  }

  function renderActivity(items) {
    if (!activityListEl) return;
    if (!items || !items.length) {
      activityListEl.innerHTML =
        '<p class="text-[11px] text-slate-400">No recent activity in mock data.</p>';
      return;
    }
    activityListEl.innerHTML = "";
    items.forEach(function (it) {
      var row = document.createElement("div");
      row.className = "flex items-start gap-2";
      row.innerHTML =
        '<span class="mt-1 h-1.5 w-1.5 rounded-full bg-brand-500"></span>' +
        '<p class="flex-1 text-xs text-slate-700">' +
        (it.message || "") +
        "</p>";
      activityListEl.appendChild(row);
    });
  }
});


