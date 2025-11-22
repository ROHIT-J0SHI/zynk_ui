// Leaves page logic: load balances, render history, handle new requests

document.addEventListener("DOMContentLoaded", function () {
  var topbarNameEl = document.getElementById("leaves-topbar-name");
  var topbarAvatarEl = document.getElementById("leaves-topbar-avatar");
  var topbarSummaryEl = document.getElementById("leaves-topbar-summary");

  var paidBalanceEl = document.getElementById("leaves-paid-balance");
  var paidUsedEl = document.getElementById("leaves-paid-used");
  var unpaidTotalEl = document.getElementById("leaves-unpaid-total");

  var rowsTbodyEl = document.getElementById("leave-rows");

  var formEl = document.getElementById("leave-request-form");
  var statusEl = document.getElementById("leave-request-status");
  var dateInput = document.getElementById("leave-date");
  var typeInput = document.getElementById("leave-type");
  var reasonInput = document.getElementById("leave-reason");

  var leavesCache = [];
  var profileCache = null;

  Promise.all([apiGet("/intern/profile"), apiGet("/intern/leaves")])
    .then(function ([profile, leaves]) {
      profileCache = profile;
      leavesCache = leaves || [];
      renderHeader(profile, leavesCache);
      renderSummary(profile, leavesCache);
      renderTable(leavesCache);
    })
    .catch(function (err) {
      console.error("Failed to load leaves", err);
    });

  function renderHeader(profile, leaves) {
    var name = (profile && profile.name) || "Intern";
    if (topbarNameEl) topbarNameEl.textContent = name;
    if (topbarAvatarEl) {
      var initials = name
        .split(" ")
        .map(function (n) {
          return n[0];
        })
        .join("")
        .slice(0, 2)
        .toUpperCase();
      topbarAvatarEl.textContent = initials || "IN";
    }
    if (topbarSummaryEl) {
      var paidUsed = leaves.filter(function (l) {
        return l.type === "PAID";
      }).length;
      var unpaid = leaves.filter(function (l) {
        return l.type === "UNPAID";
      }).length;
      topbarSummaryEl.textContent =
        paidUsed + " paid · " + unpaid + " unpaid so far";
    }
  }

  function renderSummary(profile, leaves) {
    leaves = leaves || [];
    var now = new Date();
    var start = profile && profile.internshipStart
      ? new Date(profile.internshipStart)
      : null;
    var monthsEarned = 0;
    if (start && !Number.isNaN(start.getTime())) {
      monthsEarned =
        (now.getFullYear() - start.getFullYear()) * 12 +
        (now.getMonth() - start.getMonth()) +
        1;
    }
    var totalEntitled = Math.max(0, monthsEarned);
    var paidUsedCount = leaves.filter(function (l) {
      return l.type === "PAID";
    }).length;
    var unpaidCount = leaves.filter(function (l) {
      return l.type === "UNPAID";
    }).length;
    var balance = Math.max(0, totalEntitled - paidUsedCount);

    if (paidBalanceEl) paidBalanceEl.textContent = String(balance);
    if (paidUsedEl) paidUsedEl.textContent = String(paidUsedCount);
    if (unpaidTotalEl) unpaidTotalEl.textContent = String(unpaidCount);
  }

  function renderTable(leaves) {
    if (!rowsTbodyEl) return;
    if (!leaves || !leaves.length) {
      rowsTbodyEl.innerHTML =
        '<tr><td colspan="4" class="px-2 py-3 text-center text-xs text-slate-400">No leaves yet. Request your first one on the left.</td></tr>';
      return;
    }
    rowsTbodyEl.innerHTML = "";
    leaves.forEach(function (l) {
      var tr = document.createElement("tr");
      tr.className =
        "bg-white/80 border border-white/80 rounded-xl shadow-sm overflow-hidden";

      var statusChipColor =
        l.status === "Approved"
          ? "bg-emerald-50 text-emerald-700"
          : l.status === "Rejected"
          ? "bg-red-50 text-red-600"
          : "bg-slate-50 text-slate-600";

      tr.innerHTML =
        '<td class="px-2 py-2 align-top text-xs text-slate-700">' +
        formatDateHuman(l.date) +
        "</td>" +
        '<td class="px-2 py-2 align-top text-xs">' +
        (l.type === "PAID"
          ? '<span class="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px]">Paid</span>'
          : '<span class="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[11px]">Unpaid</span>') +
        "</td>" +
        '<td class="px-2 py-2 align-top text-xs">' +
        '<span class="inline-flex items-center px-2 py-0.5 rounded-full ' +
        statusChipColor +
        ' text-[11px]">' +
        (l.status || "Pending") +
        "</span>" +
        "</td>" +
        '<td class="px-2 py-2 align-top text-xs text-slate-600 max-w-xs">' +
        (l.reason || "–") +
        "</td>";

      rowsTbodyEl.appendChild(tr);
    });
  }

  if (formEl && dateInput && typeInput && reasonInput) {
    formEl.addEventListener("submit", function (e) {
      e.preventDefault();
      var date = dateInput.value;
      var type = typeInput.value || "PAID";
      var reason = reasonInput.value.trim();
      if (!date || !reason) return;

      apiPost("/intern/leaves", {
        date: date,
        type: type,
        reason: reason,
      })
        .then(function () {
          return apiGet("/intern/leaves");
        })
        .then(function (allLeaves) {
          leavesCache = allLeaves || [];
          renderHeader(profileCache || {}, leavesCache);
          renderSummary(profileCache || {}, leavesCache);
          renderTable(leavesCache);

          if (statusEl) {
            statusEl.textContent =
              "Leave request submitted locally as Pending.";
            statusEl.className =
              "mt-1 text-[11px] text-emerald-600 transition-colors";
            setTimeout(function () {
              statusEl.textContent =
                "For now this stays in your browser. Later it will notify HR.";
              statusEl.className = "mt-1 text-[11px] text-slate-500";
            }, 2500);
          }
          formEl.reset();
        })
        .catch(function () {
          if (statusEl) {
            statusEl.textContent =
              "Could not submit leave right now. Please try again.";
            statusEl.className = "mt-1 text-[11px] text-red-500";
          }
        });
    });
  }
});


