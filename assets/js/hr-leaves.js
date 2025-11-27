// HR Leaves page logic: view, filter, and approve/reject leaves

document.addEventListener("DOMContentLoaded", function () {
  var topbarSummaryEl = document.getElementById("hr-leaves-topbar-summary");
  var rowsTbodyEl = document.getElementById("hr-leaves-rows");

  var statusChips = Array.prototype.slice.call(
    document.querySelectorAll(".hr-leaves-status-chip")
  );
  var typeFilterEl = document.getElementById("hr-leaves-type-filter");

  var detailNameEl = document.getElementById("hr-leaves-detail-name");
  var detailRoleEl = document.getElementById("hr-leaves-detail-role");
  var detailBalanceEl = document.getElementById("hr-leaves-detail-balance");
  var detailInvoiceEl = document.getElementById("hr-leaves-detail-invoice");

  var leavesCache = [];
  var selectedStatus = "ALL";
  var selectedType = "ALL";
  var selectedRowInternId = null;

  // Prefer real backend pending leaves when HR is logged in
  var hasToken = typeof getAuthToken === "function" && !!getAuthToken();

  function loadLeavesFromBackend() {
    if (!hasToken || typeof backendGet !== "function") {
      loadLeavesFromMock();
      return;
    }
    backendGet("/leaves/pending")
      .then(function (list) {
        list = list || [];
        // Map backend LeaveResponse -> UI shape
        leavesCache = list.map(function (l) {
          return {
            id: l.id,
            // Backend does not expose intern details here; show generic label
            internId: "",
            internName: "Intern",
            date: l.leaveDate,
            type: l.leaveType, // PAID / UNPAID
            reason: l.reason,
            status:
              l.status === "APPROVED"
                ? "Approved"
                : l.status === "REJECTED"
                ? "Rejected"
                : "Pending",
          };
        });
        updateSummary();
        renderTable();
      })
      .catch(function (err) {
        console.error("Failed to load HR leaves from backend", err);
        loadLeavesFromMock();
      });
  }

  function loadLeavesFromMock() {
    apiGet("/hr/leaves")
      .then(function (leaves) {
        leavesCache = leaves || [];
        updateSummary();
        renderTable();
      })
      .catch(function (err) {
        console.error("Failed to load HR leaves (mock)", err);
      });
  }

  loadLeavesFromBackend();

  function updateSummary() {
    var pending = leavesCache.filter(function (l) {
      return l.status === "Pending";
    }).length;
    var total = leavesCache.length;
    if (topbarSummaryEl) {
      topbarSummaryEl.textContent = pending + " pending · " + total + " total";
    }
  }

  function getFilteredLeaves() {
    return leavesCache.filter(function (l) {
      var statusOk =
        selectedStatus === "ALL" ? true : l.status === selectedStatus;
      var typeOk = selectedType === "ALL" ? true : l.type === selectedType;
      return statusOk && typeOk;
    });
  }

  function renderTable() {
    if (!rowsTbodyEl) return;
    var list = getFilteredLeaves();
    if (!list.length) {
      rowsTbodyEl.innerHTML =
        '<tr><td colspan="6" class="px-2 py-3 text-center text-xs text-slate-400">No leave requests for this filter.</td></tr>';
      return;
    }
    rowsTbodyEl.innerHTML = "";
    list.forEach(function (l) {
      var tr = document.createElement("tr");
      tr.className =
        "bg-white/80 border border-white/80 rounded-xl shadow-sm overflow-hidden";
      var statusChipColor =
        l.status === "Approved"
          ? "bg-emerald-50 text-emerald-700"
          : l.status === "Rejected"
          ? "bg-red-50 text-red-600"
          : "bg-amber-50 text-amber-700";

      var typeChip =
        l.type === "PAID"
          ? '<span class="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px]">Paid</span>'
          : '<span class="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[11px]">Unpaid</span>';

      var actionButtons =
        l.status === "Pending"
          ? '<button data-id="' +
            l.id +
            '" data-decision="Approved" class="hr-leaves-action inline-flex items-center px-2 py-1 rounded-lg bg-emerald-600 text-white text-[11px] mr-1">Approve</button>' +
            '<button data-id="' +
            l.id +
            '" data-decision="Rejected" class="hr-leaves-action inline-flex items-center px-2 py-1 rounded-lg bg-red-600 text-white text-[11px]">Reject</button>'
          : '<span class="text-[11px] text-slate-400">—</span>';

      tr.innerHTML =
        '<td class="px-2 py-2 align-top text-xs text-slate-700 cursor-pointer hr-leaves-row-intern" data-intern-id="' +
        (l.internId || "") +
        '">' +
        (l.internName || "Intern") +
        "</td>" +
        '<td class="px-2 py-2 align-top text-xs text-slate-700">' +
        formatDateHuman(l.date) +
        "</td>" +
        '<td class="px-2 py-2 align-top text-xs">' +
        typeChip +
        "</td>" +
        '<td class="px-2 py-2 align-top text-xs text-slate-600 max-w-xs">' +
        (l.reason || "–") +
        "</td>" +
        '<td class="px-2 py-2 align-top text-xs">' +
        '<span class="inline-flex items-center px-2 py-0.5 rounded-full ' +
        statusChipColor +
        ' text-[11px]">' +
        (l.status || "Pending") +
        "</span>" +
        "</td>" +
        '<td class="px-2 py-2 align-top text-right text-xs">' +
        actionButtons +
        "</td>";

      rowsTbodyEl.appendChild(tr);
    });

    // Wire up actions and row selection
    Array.prototype.slice
      .call(document.querySelectorAll(".hr-leaves-action"))
      .forEach(function (btn) {
        btn.addEventListener("click", function () {
          var id = btn.getAttribute("data-id");
          var decision = btn.getAttribute("data-decision");
          if (!id || !decision) return;
          // Use real backend endpoints when possible
          if (hasToken && typeof backendFetch === "function") {
            var path =
              decision === "Approved"
                ? "/leaves/" + id + "/approve?approvedBy=HR%20Manager"
                : "/leaves/" + id + "/reject";
            backendFetch(path, { method: "PUT" })
              .then(function () {
                loadLeavesFromBackend();
              })
              .catch(function () {
                alert("Could not update leave decision on backend.");
              });
          } else {
            // Fallback to mock update
            apiPost("/hr/leaves/decision", { id: id, decision: decision })
              .then(function () {
                return apiGet("/hr/leaves");
              })
              .then(function (leaves) {
                leavesCache = leaves || [];
                updateSummary();
                renderTable();
              })
              .catch(function () {
                alert("Could not update leave decision in mock data.");
              });
          }
        });
      });

    Array.prototype.slice
      .call(document.querySelectorAll(".hr-leaves-row-intern"))
      .forEach(function (cell) {
        cell.addEventListener("click", function () {
          var internId = cell.getAttribute("data-intern-id");
          if (!internId) return;
          selectedRowInternId = internId;
          showInternDetail(internId);
        });
      });
  }

  function showInternDetail(internId) {
    // Backend pending leaves endpoint does not currently expose intern details.
    // For now, show a generic message instead of per-intern breakdown.
    if (detailNameEl) {
      detailNameEl.textContent = "Intern";
    }
    if (detailRoleEl) {
      detailRoleEl.textContent = "Intern · Active";
    }
    if (detailBalanceEl) {
      detailBalanceEl.textContent =
        "Open a specific intern profile to see detailed balances.";
    }
    if (detailInvoiceEl) {
      detailInvoiceEl.textContent = "Invoice summary not available here.";
    }
  }

  statusChips.forEach(function (chip) {
    chip.addEventListener("click", function () {
      statusChips.forEach(function (c) {
        c.classList.remove("bg-slate-900", "text-white");
        c.classList.add("bg-white/80", "border", "border-slate-200", "text-slate-700");
      });
      chip.classList.remove("bg-white/80", "border", "border-slate-200", "text-slate-700");
      chip.classList.add("bg-slate-900", "text-white");
      selectedStatus = chip.getAttribute("data-value") || "ALL";
      renderTable();
    });
  });

  if (typeFilterEl) {
    typeFilterEl.addEventListener("change", function () {
      selectedType = typeFilterEl.value || "ALL";
      renderTable();
    });
  }
});


