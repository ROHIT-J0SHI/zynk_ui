// Invoices page logic: compute invoice for selected month and render preview

document.addEventListener("DOMContentLoaded", function () {
  var monthSelect = document.getElementById("inv-month");
  var yearSelect = document.getElementById("inv-year");
  var generateBtn = document.getElementById("inv-generate-btn");
  var downloadBtn = document.getElementById("inv-download-btn");

  var topbarNameEl = document.getElementById("inv-topbar-name");
  var topbarAvatarEl = document.getElementById("inv-topbar-avatar");
  var topbarPeriodEl = document.getElementById("inv-topbar-period");

  var workingDaysEl = document.getElementById("inv-working-days");
  var paidLeavesEl = document.getElementById("inv-paid-leaves");
  var unpaidLeavesEl = document.getElementById("inv-unpaid-leaves");
  var baseStipendEl = document.getElementById("inv-base-stipend");
  var unpaidDeductionEl = document.getElementById("inv-unpaid-deduction");
  var finalStipendEl = document.getElementById("inv-final-stipend");
  var helperTextEl = document.getElementById("inv-helper-text");

  var invNumberEl = document.getElementById("inv-number");
  var invMonthLabelEl = document.getElementById("inv-month-label");
  var invInternNameEl = document.getElementById("inv-intern-name");
  var invInternRoleEl = document.getElementById("inv-intern-role");
  var invInternAddressEl = document.getElementById("inv-intern-address");
  var invInternPeriodEl = document.getElementById("inv-intern-period");
  var invLineDaysEl = document.getElementById("inv-line-days");
  var invLineAmountEl = document.getElementById("inv-line-amount");
  var invLineUnpaidDaysEl = document.getElementById("inv-line-unpaid-days");
  var invLineUnpaidAmountEl = document.getElementById("inv-line-unpaid-amount");
  var invTotalPayableEl = document.getElementById("inv-total-payable");

  var profileCache = null;
  var leavesCache = [];
  var lastInvoice = null;
  var invoiceCardEl = document.getElementById("invoice-card");

  // Load profile + leaves first
  Promise.all([apiGet("/intern/profile"), apiGet("/intern/leaves")])
    .then(function ([profile, leaves]) {
      profileCache = profile;
      leavesCache = leaves || [];
      hydrateHeader(profile);
      populateMonthYear(profile);
    })
    .catch(function (err) {
      console.error("Failed to load invoice prerequisites", err);
    });

  function hydrateHeader(profile) {
    if (!profile) return;
    var name = profile.name || "Intern";
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
    if (topbarPeriodEl) {
      topbarPeriodEl.textContent =
        formatDateHuman(profile.internshipStart) +
        " – " +
        formatDateHuman(profile.internshipEnd);
    }
  }

  function populateMonthYear(profile) {
    if (!monthSelect || !yearSelect) return;

    var start = profile && profile.internshipStart
      ? new Date(profile.internshipStart)
      : null;
    var end = profile && profile.internshipEnd
      ? new Date(profile.internshipEnd)
      : null;

    var now = new Date();
    var startYear = start && !Number.isNaN(start.getTime())
      ? start.getFullYear()
      : now.getFullYear();
    var endYear = end && !Number.isNaN(end.getTime())
      ? end.getFullYear()
      : now.getFullYear();

    yearSelect.innerHTML = "";
    for (var y = startYear; y <= endYear; y++) {
      var opt = document.createElement("option");
      opt.value = String(y);
      opt.textContent = String(y);
      yearSelect.appendChild(opt);
    }
    yearSelect.value = String(now.getFullYear());

    monthSelect.innerHTML = "";
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
    monthNames.forEach(function (name, index) {
      var optM = document.createElement("option");
      optM.value = String(index + 1);
      optM.textContent = name;
      monthSelect.appendChild(optM);
    });
    monthSelect.value = String(now.getMonth() + 1);
  }

  function generateInvoice() {
    if (!profileCache || !monthSelect || !yearSelect) return;
    var month = Number(monthSelect.value);
    var year = Number(yearSelect.value);
    if (!month || !year) return;

    apiPost("/intern/invoices", { month: month, year: year })
      .then(function (invoice) {
        lastInvoice = invoice;
        renderInvoice(profileCache, leavesCache, invoice);
      })
      .catch(function (err) {
        console.error("Failed to generate invoice", err);
        if (helperTextEl) {
          helperTextEl.textContent =
            "Could not generate invoice for that month. Please try again.";
          helperTextEl.className = "text-[11px] text-red-500";
        }
      });
  }

  function renderInvoice(profile, leaves, invoice) {
    if (!invoice) return;

    var label = formatMonthYear(invoice.month, invoice.year);
    if (invMonthLabelEl) invMonthLabelEl.textContent = label;
    if (invNumberEl) invNumberEl.textContent = invoice.invoiceNumber || "–";

    if (invInternNameEl) {
      invInternNameEl.textContent = profile.name || "Intern";
    }
    if (invInternRoleEl) {
      var bits = [profile.role || "Intern"];
      if (profile.manager) bits.push("Manager: " + profile.manager);
      invInternRoleEl.textContent = bits.join(" · ");
    }
    if (invInternAddressEl) {
      invInternAddressEl.textContent =
        profile.address || "Update your address in the Profile tab.";
    }
    if (invInternPeriodEl) {
      invInternPeriodEl.textContent =
        formatDateHuman(profile.internshipStart) +
        " – " +
        formatDateHuman(profile.internshipEnd);
    }

    if (workingDaysEl)
      workingDaysEl.textContent = String(invoice.workingDays || 0);
    if (paidLeavesEl)
      paidLeavesEl.textContent = String(invoice.paidLeaves || 0);
    if (unpaidLeavesEl)
      unpaidLeavesEl.textContent = String(invoice.unpaidLeaves || 0);

    var base = invoice.baseStipend || 0;
    var deduction = invoice.unpaidDeduction || 0;
    var finalAmt = invoice.finalStipend || 0;

    if (baseStipendEl)
      baseStipendEl.textContent =
        "₹" + base.toLocaleString("en-IN", { maximumFractionDigits: 0 });
    if (unpaidDeductionEl)
      unpaidDeductionEl.textContent =
        "−₹" +
        deduction.toLocaleString("en-IN", { maximumFractionDigits: 0 });
    if (finalStipendEl)
      finalStipendEl.textContent =
        "₹" + finalAmt.toLocaleString("en-IN", { maximumFractionDigits: 0 });

    if (invLineDaysEl)
      invLineDaysEl.textContent = String(invoice.workingDays || 0);
    if (invLineAmountEl)
      invLineAmountEl.textContent =
        "₹" + base.toLocaleString("en-IN", { maximumFractionDigits: 0 });
    if (invLineUnpaidDaysEl)
      invLineUnpaidDaysEl.textContent = String(invoice.unpaidLeaves || 0);
    if (invLineUnpaidAmountEl)
      invLineUnpaidAmountEl.textContent =
        "−₹" +
        deduction.toLocaleString("en-IN", { maximumFractionDigits: 0 });
    if (invTotalPayableEl)
      invTotalPayableEl.textContent =
        "₹" + finalAmt.toLocaleString("en-IN", { maximumFractionDigits: 0 });

    if (helperTextEl) {
      helperTextEl.textContent =
        "This is a mock invoice based on your current profile and leave data.";
      helperTextEl.className = "text-[11px] text-slate-500";
    }
  }

  if (generateBtn) {
    generateBtn.addEventListener("click", function () {
      generateInvoice();
    });
  }

  if (downloadBtn) {
    downloadBtn.addEventListener("click", function () {
      if (!lastInvoice) {
        alert("Generate an invoice first, then download it as PDF.");
        return;
      }
      if (!invoiceCardEl || !window.html2canvas || !(window.jspdf || window.jsPDF)) {
        alert("PDF libraries not loaded yet. Please try again in a moment.");
        return;
      }

      var jsPDF =
        (window.jspdf && window.jspdf.jsPDF) || window.jsPDF || null;
      if (!jsPDF) {
        alert("jsPDF is unavailable. Check your network and try again.");
        return;
      }

      html2canvas(invoiceCardEl, { scale: 2 })
        .then(function (canvas) {
          var imgData = canvas.toDataURL("image/png");
          var pdf = new jsPDF("p", "mm", "a4");
          var pageWidth = pdf.internal.pageSize.getWidth();
          var pageHeight = pdf.internal.pageSize.getHeight();

          var margin = 10;
          var imgWidth = pageWidth - margin * 2;
          var imgHeight = (canvas.height * imgWidth) / canvas.width;
          var imgY = margin;

          if (imgHeight > pageHeight - margin * 2) {
            imgHeight = pageHeight - margin * 2;
          }

          pdf.addImage(imgData, "PNG", margin, imgY, imgWidth, imgHeight);
          var fileName = "intern-invoice-" + lastInvoice.month + "-" + lastInvoice.year + ".pdf";
          pdf.save(fileName);
        })
        .catch(function () {
          alert("Could not generate PDF. Try again or use the browser's Print to PDF.");
        });
    });
  }
});


