// HR Policies page logic: edit policy text and manage FAQ list

document.addEventListener("DOMContentLoaded", function () {
  var leavesEl = document.getElementById("policy-leaves");
  var stipendEl = document.getElementById("policy-stipend");
  var generalEl = document.getElementById("policy-general");

  var faqListEl = document.getElementById("hr-faq-list");
  var faqAddBtn = document.getElementById("hr-faq-add-btn");

  var saveBtn = document.getElementById("hr-policies-save-btn");
  var saveStatusEl = document.getElementById("hr-policies-save-status");

  var policiesCache = null;

  apiGet("/hr/policies")
    .then(function (policies) {
      policiesCache = policies || {};
      hydrateForm();
    })
    .catch(function (err) {
      console.error("Failed to load HR policies", err);
    });

  function hydrateForm() {
    if (!policiesCache) return;
    if (leavesEl) leavesEl.value = policiesCache.leaves || "";
    if (stipendEl) stipendEl.value = policiesCache.stipend || "";
    if (generalEl) generalEl.value = policiesCache.general || "";
    renderFaq();
  }

  function renderFaq() {
    if (!faqListEl) return;
    var faqs = (policiesCache && policiesCache.faqs) || [];
    if (!faqs.length) {
      faqListEl.innerHTML =
        '<p class="text-[11px] text-slate-400">No FAQs yet. Add one using the button above.</p>';
      return;
    }
    faqListEl.innerHTML = "";
    faqs.forEach(function (f, index) {
      var wrapper = document.createElement("div");
      wrapper.className =
        "rounded-2xl bg-white/80 border border-slate-100 px-3 py-2 space-y-1";
      wrapper.innerHTML =
        '<input type="text" class="w-full rounded-lg border border-slate-200 bg-white/80 px-2 py-1 text-[11px] outline-none focus:ring-1 focus:ring-brand-500 hr-faq-question" data-index="' +
        index +
        '" value="' +
        (f.question || "") +
        '" placeholder="Question" />' +
        '<textarea rows="3" class="w-full rounded-lg border border-slate-200 bg-white/80 px-2 py-1 text-[11px] outline-none focus:ring-1 focus:ring-brand-500 resize-none hr-faq-answer" data-index="' +
        index +
        '" placeholder="Answer">' +
        (f.answer || "") +
        "</textarea>" +
        '<button type="button" class="hr-faq-delete inline-flex items-center px-2 py-1 rounded-lg bg-slate-100 text-[11px] text-slate-600 hover:bg-slate-200" data-index="' +
        index +
        '">Remove</button>';
      faqListEl.appendChild(wrapper);
    });

    Array.prototype.slice
      .call(document.querySelectorAll(".hr-faq-delete"))
      .forEach(function (btn) {
        btn.addEventListener("click", function () {
          var idx = Number(btn.getAttribute("data-index"));
          removeFaq(idx);
        });
      });

    Array.prototype.slice
      .call(document.querySelectorAll(".hr-faq-question"))
      .forEach(function (input) {
        input.addEventListener("input", function () {
          var idx = Number(input.getAttribute("data-index"));
          updateFaq(idx, "question", input.value);
        });
      });

    Array.prototype.slice
      .call(document.querySelectorAll(".hr-faq-answer"))
      .forEach(function (textarea) {
        textarea.addEventListener("input", function () {
          var idx = Number(textarea.getAttribute("data-index"));
          updateFaq(idx, "answer", textarea.value);
        });
      });
  }

  function addFaq() {
    if (!policiesCache) policiesCache = {};
    if (!Array.isArray(policiesCache.faqs)) policiesCache.faqs = [];
    policiesCache.faqs.push({
      id: "FAQ-" + (policiesCache.faqs.length + 1).toString().padStart(3, "0"),
      question: "",
      answer: "",
    });
    renderFaq();
  }

  function removeFaq(index) {
    if (!policiesCache || !Array.isArray(policiesCache.faqs)) return;
    policiesCache.faqs.splice(index, 1);
    renderFaq();
  }

  function updateFaq(index, field, value) {
    if (!policiesCache || !Array.isArray(policiesCache.faqs)) return;
    if (!policiesCache.faqs[index]) return;
    policiesCache.faqs[index][field] = value;
  }

  if (faqAddBtn) {
    faqAddBtn.addEventListener("click", function () {
      addFaq();
    });
  }

  if (saveBtn) {
    saveBtn.addEventListener("click", function () {
      if (!policiesCache) policiesCache = {};
      policiesCache.leaves = leavesEl ? leavesEl.value : "";
      policiesCache.stipend = stipendEl ? stipendEl.value : "";
      policiesCache.general = generalEl ? generalEl.value : "";

      apiPost("/hr/policies", policiesCache)
        .then(function (saved) {
          policiesCache = saved || policiesCache;
          if (saveStatusEl) {
            saveStatusEl.textContent = "Saved locally.";
            saveStatusEl.className =
              "text-[11px] text-emerald-600 transition-colors";
            setTimeout(function () {
              saveStatusEl.textContent =
                "Changes are stored locally for now.";
              saveStatusEl.className = "text-[11px] text-slate-400";
            }, 2500);
          }
        })
        .catch(function () {
          if (saveStatusEl) {
            saveStatusEl.textContent =
              "Could not save policies. Please try again.";
            saveStatusEl.className = "text-[11px] text-red-500";
          }
        });
    });
  }
});


