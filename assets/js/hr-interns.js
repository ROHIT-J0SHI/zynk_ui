// HR Interns page logic: list interns and show details for selection

document.addEventListener("DOMContentLoaded", function () {
  var topbarCountEl = document.getElementById("hr-interns-count");
  var searchInput = document.getElementById("hr-interns-search");
  var listEl = document.getElementById("hr-interns-list");

  var toggleCreateBtn = document.getElementById("hr-interns-toggle-create");
  var createFormEl = document.getElementById("hr-interns-create-form");
  var createNameEl = document.getElementById("hr-create-name");
  var createEmailEl = document.getElementById("hr-create-email");
  var createRoleEl = document.getElementById("hr-create-role");
  var createManagerEl = document.getElementById("hr-create-manager");
  var createStartEl = document.getElementById("hr-create-start");
  var createEndEl = document.getElementById("hr-create-end");
  var createStipendEl = document.getElementById("hr-create-stipend");
  var createStatusEl = document.getElementById("hr-interns-create-status");

  var detailNameEl = document.getElementById("hr-intern-detail-name");
  var detailRoleEl = document.getElementById("hr-intern-detail-role");
  var detailPeriodEl = document.getElementById("hr-intern-detail-period");
  var detailManagerEl = document.getElementById("hr-intern-detail-manager");
  var detailLeavesEl = document.getElementById("hr-intern-detail-leaves");
  var detailLastInvoiceEl = document.getElementById(
    "hr-intern-detail-last-invoice"
  );
  var detailEmailEl = document.getElementById("hr-intern-detail-email");

  var openProfileBtn = document.getElementById("hr-open-profile-btn");
  var openLeavesBtn = document.getElementById("hr-open-leaves-btn");
  var openInvoicesBtn = document.getElementById("hr-open-invoices-btn");

  var internsCache = [];
  var selectedInternId = null;

  apiGet("/hr/interns")
    .then(function (interns) {
      internsCache = interns || [];
      renderList();
    })
    .catch(function (err) {
      console.error("Failed to load HR interns", err);
      if (listEl) {
        listEl.innerHTML =
          '<p class="text-[11px] text-red-500">Could not load interns.</p>';
      }
    });

  function renderList() {
    if (!listEl) return;
    var q = (searchInput && searchInput.value.toLowerCase()) || "";
    var filtered = internsCache.filter(function (i) {
      if (!q) return true;
      var blob = (i.name + " " + i.email).toLowerCase();
      return blob.includes(q);
    });

    if (topbarCountEl) {
      topbarCountEl.textContent = String(filtered.length || 0);
    }

    if (!filtered.length) {
      listEl.innerHTML =
        '<p class="text-[11px] text-slate-400">No interns found for that search.</p>';
      return;
    }

    listEl.innerHTML = "";
    filtered.forEach(function (intern) {
      var item = document.createElement("button");
      item.type = "button";
      item.className =
        "w-full text-left px-3 py-2 rounded-xl border border-transparent hover:border-brand-200 hover:bg-white/90 flex flex-col gap-0.5";
      if (intern.id === selectedInternId) {
        item.className += " bg-white/90 border-brand-200";
      }
      item.innerHTML =
        '<p class="text-xs font-semibold text-slate-900">' +
        (intern.name || "") +
        "</p>" +
        '<p class="text-[11px] text-slate-500">' +
        (intern.role || "Intern") +
        " · " +
        (intern.manager || "Manager") +
        "</p>" +
        '<p class="text-[10px] text-slate-400">' +
        (intern.email || "") +
        "</p>";

      item.addEventListener("click", function () {
        selectIntern(intern.id);
      });
      listEl.appendChild(item);
    });
  }

  function selectIntern(id) {
    selectedInternId = id;
    renderList();

    apiGet("/hr/interns/" + id)
      .then(function (data) {
        if (!data || !data.intern) return;
        var intern = data.intern;
        var profile = data.profile || {};
        var leaves = data.leaves || [];
        var invoices = data.invoices || [];

        if (detailNameEl) detailNameEl.textContent = intern.name || "Intern";
        if (detailRoleEl) {
          var roleText = (intern.role || "Intern") + " · " + (intern.status || "Active");
          detailRoleEl.textContent = roleText;
        }
        if (detailPeriodEl) {
          detailPeriodEl.textContent =
            formatDateHuman(intern.internshipStart) +
            " – " +
            formatDateHuman(intern.internshipEnd);
        }
        if (detailManagerEl) {
          detailManagerEl.textContent =
            "Manager: " + (intern.manager || profile.manager || "—");
        }

        var paidUsed = leaves.filter(function (l) {
          return l.type === "PAID";
        }).length;
        var unpaid = leaves.filter(function (l) {
          return l.type === "UNPAID";
        }).length;
        if (detailLeavesEl) {
          detailLeavesEl.textContent =
            paidUsed + " paid used · " + unpaid + " unpaid total";
        }

        var lastInvoice = invoices[0] || null;
        if (detailLastInvoiceEl) {
          detailLastInvoiceEl.textContent = lastInvoice
            ? formatMonthYear(lastInvoice.month, lastInvoice.year) +
              " · ₹" +
              (lastInvoice.finalStipend || 0).toLocaleString("en-IN", {
                maximumFractionDigits: 0,
              })
            : "None yet";
        }

        if (detailEmailEl) {
          detailEmailEl.textContent = intern.email || profile.email || "—";
        }

        [openProfileBtn, openLeavesBtn, openInvoicesBtn].forEach(function (
          btn
        ) {
          if (btn) btn.disabled = false;
        });
      })
      .catch(function (err) {
        console.error("Failed to load HR intern detail", err);
      });
  }

  if (searchInput) {
    searchInput.addEventListener("input", function () {
      renderList();
    });
  }

  if (toggleCreateBtn && createFormEl) {
    toggleCreateBtn.addEventListener("click", function () {
      var isHidden = createFormEl.classList.contains("hidden");
      if (isHidden) {
        createFormEl.classList.remove("hidden");
      } else {
        createFormEl.classList.add("hidden");
      }
    });
  }

  if (createFormEl) {
    createFormEl.addEventListener("submit", function (e) {
      e.preventDefault();
      var payload = {
        name: createNameEl ? createNameEl.value.trim() : "",
        email: createEmailEl ? createEmailEl.value.trim() : "",
        role: createRoleEl ? createRoleEl.value.trim() : "",
        manager: createManagerEl ? createManagerEl.value.trim() : "",
        internshipStart: createStartEl ? createStartEl.value : "",
        internshipEnd: createEndEl ? createEndEl.value : "",
        stipendPerMonth: createStipendEl
          ? Number(createStipendEl.value) || 0
          : 0,
      };
      if (!payload.name || !payload.email || !payload.internshipStart) {
        if (createStatusEl) {
          createStatusEl.textContent =
            "Name, email, and start date are required.";
          createStatusEl.className =
            "text-[11px] text-red-500 mt-1";
        }
        return;
      }
      apiPost("/hr/interns", payload)
        .then(function () {
          return apiGet("/hr/interns");
        })
        .then(function (interns) {
          internsCache = interns || [];
          renderList();
          if (createFormEl) createFormEl.reset();
          if (createStatusEl) {
            createStatusEl.textContent =
              "Intern saved locally. They can now log in with this email.";
            createStatusEl.className =
              "text-[11px] text-emerald-600 mt-1";
            setTimeout(function () {
              createStatusEl.textContent =
                "New interns will be stored locally and can log in with the email above.";
              createStatusEl.className =
                "text-[11px] text-slate-400 mt-1";
            }, 2500);
          }
        })
        .catch(function () {
          if (createStatusEl) {
            createStatusEl.textContent =
              "Could not create intern. Please try again.";
            createStatusEl.className =
              "text-[11px] text-red-500 mt-1";
          }
        });
    });
  }

  if (openProfileBtn) {
    openProfileBtn.addEventListener("click", function () {
      if (!selectedInternId) return;
      // For now, just hint that this would deep-link to intern profile
      alert(
        "In a real app, this would open this intern's profile in a separate view."
      );
    });
  }
  if (openLeavesBtn) {
    openLeavesBtn.addEventListener("click", function () {
      window.location.href = "hr-leaves.html";
    });
  }
  if (openInvoicesBtn) {
    openInvoicesBtn.addEventListener("click", function () {
      window.location.href = "hr-invoices.html";
    });
  }
});


