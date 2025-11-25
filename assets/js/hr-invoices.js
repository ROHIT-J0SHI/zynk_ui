// HR Invoices page logic: filter, list, and generate invoices for interns

document.addEventListener("DOMContentLoaded", function () {
  var monthSelect = document.getElementById("hr-invoices-month");
  var yearSelect = document.getElementById("hr-invoices-year");
  var internSelect = document.getElementById("hr-invoices-intern");
  var statusSelect = document.getElementById("hr-invoices-status");
  var generateBtn = document.getElementById("hr-invoices-generate-btn");

  var topbarCountEl = document.getElementById("hr-invoices-topbar-count");
  var rowsTbodyEl = document.getElementById("hr-invoices-rows");

  var previewEmptyEl = document.getElementById("hr-invoices-preview-empty");
  var previewFrameEl = document.getElementById("hr-invoices-preview-frame");

  var allInvoices = [];
  var allInterns = [];

  Promise.all([apiGet("/hr/interns"), apiGet("/hr/invoices")])
    .then(function ([interns, invoices]) {
      allInterns = interns || [];
      allInvoices = invoices || [];
      populateFilters();
      renderTable();
    })
    .catch(function (err) {
      console.error("Failed to load HR invoices prerequisites", err);
    });

  function populateFilters() {
    if (monthSelect) {
      var now = new Date();
      var monthNames = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];
      monthSelect.innerHTML = "";
      monthNames.forEach(function (name, index) {
        var opt = document.createElement("option");
        opt.value = String(index + 1);
        opt.textContent = name;
        monthSelect.appendChild(opt);
      });
      monthSelect.value = String(now.getMonth() + 1);
    }

    if (yearSelect) {
      var nowY = new Date().getFullYear();
      yearSelect.innerHTML = "";
      [nowY - 1, nowY, nowY + 1].forEach(function (y) {
        var optY = document.createElement("option");
        optY.value = String(y);
        optY.textContent = String(y);
        yearSelect.appendChild(optY);
      });
      yearSelect.value = String(nowY);
    }

    if (internSelect) {
      internSelect.innerHTML = "";
      var allOpt = document.createElement("option");
      allOpt.value = "ALL";
      allOpt.textContent = "All interns";
      internSelect.appendChild(allOpt);
      allInterns.forEach(function (i) {
        var optI = document.createElement("option");
        optI.value = i.id;
        optI.textContent = i.name || i.email || i.id;
        internSelect.appendChild(optI);
      });
      internSelect.value = "ALL";
    }
  }

  function getFilteredInvoices() {
    var monthVal = monthSelect ? Number(monthSelect.value) : null;
    var yearVal = yearSelect ? Number(yearSelect.value) : null;
    var internVal = internSelect ? internSelect.value : "ALL";
    var statusVal = statusSelect ? statusSelect.value : "ALL";

    return allInvoices.filter(function (inv) {
      var okMonth = monthVal ? inv.month === monthVal : true;
      var okYear = yearVal ? inv.year === yearVal : true;
      var okIntern =
        internVal === "ALL" ? true : inv.internId === internVal;
      var okStatus =
        statusVal === "ALL" ? true : (inv.status || "Generated") === statusVal;
      return okMonth && okYear && okIntern && okStatus;
    });
  }

  function renderTable() {
    if (!rowsTbodyEl) return;
    var list = getFilteredInvoices();

    if (topbarCountEl) {
      topbarCountEl.textContent = String(list.length || 0);
    }

    if (!list.length) {
      rowsTbodyEl.innerHTML =
        '<tr><td colspan="5" class="px-2 py-3 text-center text-xs text-slate-400">No invoices for this filter.</td></tr>';
      return;
    }

    rowsTbodyEl.innerHTML = "";
    list.forEach(function (inv, idx) {
      var tr = document.createElement("tr");
      tr.className =
        "bg-white/80 border border-white/80 rounded-xl shadow-sm overflow-hidden cursor-pointer";

      var statusChip =
        (inv.status || "Generated") === "Paid"
          ? '<span class="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px]">Paid</span>'
          : '<span class="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-50 text-slate-700 text-[11px]">Generated</span>';

      tr.innerHTML =
        '<td class="px-2 py-2 align-top text-xs text-slate-700">' +
        (inv.internName || "Intern") +
        "</td>" +
        '<td class="px-2 py-2 align-top text-xs text-slate-700">' +
        formatMonthYear(inv.month, inv.year) +
        "</td>" +
        '<td class="px-2 py-2 align-top text-xs text-slate-700">' +
        (inv.invoiceNumber || "—") +
        "</td>" +
        '<td class="px-2 py-2 align-top text-xs text-right text-slate-700">₹' +
        (inv.finalStipend || 0).toLocaleString("en-IN", {
          maximumFractionDigits: 0,
        }) +
        "</td>" +
        '<td class="px-2 py-2 align-top text-xs">' +
        statusChip +
        "</td>";

      tr.addEventListener("click", function () {
        showPreview(inv);
      });

      rowsTbodyEl.appendChild(tr);

      // Auto-select first invoice for preview
      if (idx === 0) {
        showPreview(inv);
      }
    });
  }

  function showPreview(inv) {
    if (!previewFrameEl || !previewEmptyEl) return;
    previewEmptyEl.classList.add("hidden");

    // For now, just show the intern-side invoice page in the frame
    previewFrameEl.classList.remove("hidden");
    previewFrameEl.src = "intern-invoices.html";
  }

  if (monthSelect) monthSelect.addEventListener("change", renderTable);
  if (yearSelect) yearSelect.addEventListener("change", renderTable);
  if (internSelect) internSelect.addEventListener("change", renderTable);
  if (statusSelect) statusSelect.addEventListener("change", renderTable);

  if (generateBtn) {
    generateBtn.addEventListener("click", function () {
      var internId =
        internSelect && internSelect.value !== "ALL"
          ? internSelect.value
          : allInterns[0] && allInterns[0].id;
      var month =
        monthSelect && monthSelect.value
          ? Number(monthSelect.value)
          : new Date().getMonth() + 1;
      var year =
        yearSelect && yearSelect.value
          ? Number(yearSelect.value)
          : new Date().getFullYear();

      apiPost("/hr/invoices", { internId: internId, month: month, year: year })
        .then(function (inv) {
          // Refresh invoice list
          return apiGet("/hr/invoices").then(function (invoices) {
            allInvoices = invoices || [];
            renderTable();
          });
        })
        .catch(function (err) {
          console.error("Failed to generate HR invoice", err);
          alert("Could not generate invoice in mock data.");
        });
    });
  }
});


