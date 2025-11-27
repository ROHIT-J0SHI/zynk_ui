// HR Interns page logic: list interns and show details for selection

document.addEventListener("DOMContentLoaded", function () {
  var topbarCountEl = document.getElementById("hr-interns-count");
  var searchInput = document.getElementById("hr-interns-search");
  var listEl = document.getElementById("hr-interns-list");

  var toggleCreateBtn = document.getElementById("hr-interns-toggle-create");
  var createFormEl = document.getElementById("hr-interns-create-form");
  var createNameEl = document.getElementById("hr-create-name");
  var createEmailEl = document.getElementById("hr-create-email");
  var createPasswordEl = document.getElementById("hr-create-password");
  var createStartEl = document.getElementById("hr-create-start");
  var createDurationEl = document.getElementById("hr-create-duration");
  var createStipendTypeEl = document.getElementById("hr-create-stipend-type");
  var createStipendEl = document.getElementById("hr-create-stipend");
  var createPanEl = document.getElementById("hr-create-pan");
  var createAadhaarEl = document.getElementById("hr-create-aadhaar");
  var createBankAccountEl = document.getElementById("hr-create-bank-account");
  var createBankIfscEl = document.getElementById("hr-create-bank-ifsc");
  var createBankNameEl = document.getElementById("hr-create-bank-name");
  var createBankBranchEl = document.getElementById("hr-create-bank-branch");
  var createAddressEl = document.getElementById("hr-create-address");
  var createCityEl = document.getElementById("hr-create-city");
  var createStateEl = document.getElementById("hr-create-state");
  var createPincodeEl = document.getElementById("hr-create-pincode");
  var createPhoneEl = document.getElementById("hr-create-phone");
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
  var allInvoices = [];

  // Prefer real backend data when HR is logged in, otherwise fall back to mock API
  var hasToken = typeof getAuthToken === "function" && !!getAuthToken();

  if (hasToken && typeof backendGet === "function") {
    Promise.all([
      backendGet("/interns/all"),
      backendGet("/invoices/all").catch(function () {
        return [];
      }),
    ])
      .then(function ([interns, invoices]) {
        interns = interns || [];
        invoices = invoices || [];

        // Map backend InternDetails -> UI intern shape
        internsCache = interns.map(function (it) {
          var user = it.user || {};
          return {
            id: String(it.id),
            name: user.name || "Intern",
            email: user.email || "",
            role: "Intern",
            manager: "", // Not tracked in backend yet
            internshipStart: it.joiningDate,
            internshipEnd:
              it.internshipEndDate || it.joiningDate || null, // helper getter on entity
            stipendPerMonth: it.stipendAmount,
            status: "Active",
          };
        });

        allInvoices = invoices || [];
        renderList();
      })
      .catch(function (err) {
        console.error("Failed to load HR interns from backend", err);
        loadInternsFromMock();
      });
  } else {
    loadInternsFromMock();
  }

  function loadInternsFromMock() {
    apiGet("/hr/interns")
      .then(function (interns) {
        internsCache = interns || [];
        renderList();
      })
      .catch(function (err) {
        console.error("Failed to load HR interns (mock)", err);
        if (listEl) {
          listEl.innerHTML =
            '<p class="text-[11px] text-red-500">Could not load interns.</p>';
        }
      });
  }

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
    var intern = internsCache.find(function (i) {
      return String(i.id) === String(id);
    });
    if (!intern) return;

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
        "Manager: " + (intern.manager || "—");
    }

    // Derive last invoice from backend invoices if available
    var lastInvoice = null;
    if (allInvoices && allInvoices.length && intern.email) {
      var emailLower = intern.email.toLowerCase();
      var invs = allInvoices.filter(function (inv) {
        return (inv.internEmail || "").toLowerCase() === emailLower;
      });
      invs.sort(function (a, b) {
        var da = new Date(a.billingPeriodFrom || a.invoiceDate || 0).getTime();
        var db = new Date(b.billingPeriodFrom || b.invoiceDate || 0).getTime();
        return db - da;
      });
      lastInvoice = invs[0] || null;
    }

    if (detailLeavesEl) {
      detailLeavesEl.textContent =
        "Detailed leave usage is available in the Leaves page.";
    }

    if (detailLastInvoiceEl) {
      if (lastInvoice) {
        var bpFrom = lastInvoice.billingPeriodFrom || lastInvoice.invoiceDate;
        var d = bpFrom ? new Date(bpFrom) : null;
        var label = d && !Number.isNaN(d.getTime())
          ? d.toLocaleDateString(undefined, { month: "short", year: "numeric" })
          : "";
        detailLastInvoiceEl.textContent =
          (label ? label + " · " : "") +
          "₹" +
          (lastInvoice.stipendAmount || 0).toLocaleString("en-IN", {
            maximumFractionDigits: 0,
          });
      } else {
        detailLastInvoiceEl.textContent = "None yet";
      }
    }

    if (detailEmailEl) {
      detailEmailEl.textContent = intern.email || "—";
    }

    [openProfileBtn, openLeavesBtn, openInvoicesBtn].forEach(function (btn) {
      if (btn) btn.disabled = false;
    });
  }

  if (searchInput) {
    searchInput.addEventListener("input", function () {
      renderList();
    });
  }

  if (toggleCreateBtn && createFormEl) {
    // Scroll to the separate create section when button is clicked
    toggleCreateBtn.addEventListener("click", function () {
      var section = document.getElementById("hr-interns-create-section");
      if (section && typeof section.scrollIntoView === "function") {
        section.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  }

  if (createFormEl) {
    createFormEl.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = createNameEl ? createNameEl.value.trim() : "";
      var email = createEmailEl ? createEmailEl.value.trim() : "";
      var password = createPasswordEl ? createPasswordEl.value.trim() : "";
      var joiningDate = createStartEl ? createStartEl.value : "";
      if (!name || !email || !password || !joiningDate) {
        if (createStatusEl) {
          createStatusEl.textContent =
            "Name, email, password, and joining date are required.";
          createStatusEl.className =
            "text-[11px] text-red-500 mt-1";
        }
        return;
      }
      var duration =
        createDurationEl && createDurationEl.value
          ? Number(createDurationEl.value)
          : 6;
      var stipendAmount =
        createStipendEl && createStipendEl.value
          ? Number(createStipendEl.value)
          : 0;
      var stipendType =
        createStipendTypeEl && createStipendTypeEl.value
          ? createStipendTypeEl.value
          : "MONTHLY";

      var payload = {
        email: email,
        password: password,
        name: name,
        joiningDate: joiningDate,
        internshipDurationMonths: duration,
        stipendType: stipendType,
        stipendAmount: stipendAmount,
        panNumber: createPanEl ? createPanEl.value.trim() : "",
        aadhaarNumber: createAadhaarEl ? createAadhaarEl.value.trim() : "",
        bankAccountNumber: createBankAccountEl
          ? createBankAccountEl.value.trim()
          : "",
        bankIfscCode: createBankIfscEl ? createBankIfscEl.value.trim() : "",
        bankName: createBankNameEl ? createBankNameEl.value.trim() : "",
        bankBranch: createBankBranchEl ? createBankBranchEl.value.trim() : "",
        address: createAddressEl ? createAddressEl.value.trim() : "",
        city: createCityEl ? createCityEl.value.trim() : "",
        state: createStateEl ? createStateEl.value.trim() : "",
        pincode: createPincodeEl ? createPincodeEl.value.trim() : "",
        phoneNumber: createPhoneEl ? createPhoneEl.value.trim() : "",
      };

      if (hasToken && typeof backendPost === "function" && typeof backendGet === "function") {
        backendPost("/interns/onboard", payload)
          .then(function () {
            return backendGet("/interns/all");
          })
          .then(function (interns) {
            internsCache = (interns || []).map(function (it) {
              var user = it.user || {};
              return {
                id: String(it.id),
                name: user.name || "Intern",
                email: user.email || "",
                role: "Intern",
                manager: "",
                internshipStart: it.joiningDate,
                internshipEnd:
                  it.internshipEndDate || it.joiningDate || null,
                stipendPerMonth: it.stipendAmount,
                status: "Active",
              };
            });
            renderList();
            if (createFormEl) createFormEl.reset();
            if (createStatusEl) {
              createStatusEl.textContent =
                "Intern created in backend. Share the email and password with them.";
              createStatusEl.className =
                "text-[11px] text-emerald-600 mt-1";
            }
          })
          .catch(function (err) {
            console.error("Failed to onboard intern via backend", err);
            if (createStatusEl) {
              createStatusEl.textContent =
                (err && err.message) ||
                "Could not onboard intern. Please check email/duration/stipend and try again.";
              createStatusEl.className =
                "text-[11px] text-red-500 mt-1";
            }
          });
      } else {
        // Fallback: local mock creation
        apiPost("/hr/interns", {
          name: name,
          email: email,
          role: "Intern",
          manager: "",
          internshipStart: joiningDate,
          internshipEnd: "",
          stipendPerMonth: stipendAmount,
        })
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
      }
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


