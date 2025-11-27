// HR Announcements page logic: manage list and sync to intern dashboard

document.addEventListener("DOMContentLoaded", function () {
  var listEl = document.getElementById("hr-ann-list");
  var addBtn = document.getElementById("hr-ann-add-btn");
  var saveBtn = document.getElementById("hr-ann-save-btn");
  var saveStatusEl = document.getElementById("hr-ann-save-status");

  var announcements = [];

  function renderList() {
    if (!listEl) return;
    if (!announcements.length) {
      listEl.innerHTML =
        '<p class="text-[11px] text-slate-400">No announcements yet. Add one using the button above.</p>';
      return;
    }
    listEl.innerHTML = "";
    announcements.forEach(function (a, index) {
      var wrapper = document.createElement("div");
      wrapper.className =
        "rounded-2xl bg-white/80 border border-slate-100 px-3 py-2 space-y-1";
      wrapper.innerHTML =
        '<input type="text" class="w-full rounded-lg border border-slate-200 bg-white/80 px-2 py-1 text-[11px] outline-none focus:ring-1 focus:ring-brand-500 hr-ann-title" data-index="' +
        index +
        '" value="' +
        (a.title || "") +
        '" placeholder="Title (e.g. Townhall on Friday)" />' +
        '<textarea rows="2" class="w-full rounded-lg border border-slate-200 bg-white/80 px-2 py-1 text-[11px] outline-none focus:ring-1 focus:ring-brand-500 resize-none hr-ann-body" data-index="' +
        index +
        '" placeholder="Body">' +
        (a.body || "") +
        "</textarea>" +
        '<input type="text" class="w-full rounded-lg border border-slate-200 bg-white/80 px-2 py-1 text-[11px] outline-none focus:ring-1 focus:ring-brand-500 hr-ann-tag" data-index="' +
        index +
        '" value="' +
        (a.tag || "") +
        '" placeholder="Tag (e.g. Event, Reminder)" />' +
        '<button type="button" class="hr-ann-delete inline-flex items-center px-2 py-1 rounded-lg bg-slate-100 text-[11px] text-slate-600 hover:bg-slate-200" data-index="' +
        index +
        '">Remove</button>';
      listEl.appendChild(wrapper);
    });

    Array.prototype.slice
      .call(document.querySelectorAll(".hr-ann-delete"))
      .forEach(function (btn) {
        btn.addEventListener("click", function () {
          var idx = Number(btn.getAttribute("data-index"));
          announcements.splice(idx, 1);
          renderList();
        });
      });

    Array.prototype.slice
      .call(document.querySelectorAll(".hr-ann-title"))
      .forEach(function (input) {
        input.addEventListener("input", function () {
          var idx = Number(input.getAttribute("data-index"));
          if (!announcements[idx]) return;
          announcements[idx].title = input.value;
        });
      });

    Array.prototype.slice
      .call(document.querySelectorAll(".hr-ann-body"))
      .forEach(function (textarea) {
        textarea.addEventListener("input", function () {
          var idx = Number(textarea.getAttribute("data-index"));
          if (!announcements[idx]) return;
          announcements[idx].body = textarea.value;
        });
      });

    Array.prototype.slice
      .call(document.querySelectorAll(".hr-ann-tag"))
      .forEach(function (input) {
        input.addEventListener("input", function () {
          var idx = Number(input.getAttribute("data-index"));
          if (!announcements[idx]) return;
          announcements[idx].tag = input.value;
        });
      });
  }

  var hasToken = typeof getAuthToken === "function" && !!getAuthToken();

  function loadAnnouncementsFromBackend() {
    if (!hasToken || typeof backendGet !== "function") {
      loadAnnouncementsFromMock();
      return;
    }
    backendGet("/announcements/all")
      .then(function (list) {
        list = list || [];
        announcements = list.map(function (a) {
          return {
            id: a.id,
            title: a.title,
            body: a.body,
            tag: "", // backend does not track tag; keep UI field optional
          };
        });
        renderList();
      })
      .catch(function (err) {
        console.error("Failed to load HR announcements from backend", err);
        loadAnnouncementsFromMock();
      });
  }

  function loadAnnouncementsFromMock() {
    apiGet("/hr/announcements")
      .then(function (anns) {
        announcements = anns || [];
        renderList();
      })
      .catch(function (err) {
        console.error("Failed to load HR announcements (mock)", err);
      });
  }

  loadAnnouncementsFromBackend();

  if (addBtn) {
    addBtn.addEventListener("click", function () {
      announcements.push({
        title: "",
        body: "",
        tag: "",
      });
      renderList();
    });
  }

  if (saveBtn) {
    saveBtn.addEventListener("click", function () {
      if (hasToken && typeof backendPost === "function" && typeof backendGet === "function") {
        // Only create new announcements (without id) on backend
        var newOnes = announcements.filter(function (a) {
          return !a.id && a.title && a.body;
        });
        if (!newOnes.length) {
          if (saveStatusEl) {
            saveStatusEl.textContent =
              "No new announcements to publish.";
            saveStatusEl.className =
              "text-[11px] text-slate-500";
          }
          return;
        }
        var now = new Date();
        var expiry = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() + 30
        )
          .toISOString()
          .slice(0, 10); // yyyy-MM-dd

        Promise.all(
          newOnes.map(function (a) {
            return backendPost("/announcements", {
              title: a.title,
              body: a.body,
              expiryDate: expiry,
            });
          })
        )
          .then(function () {
            return backendGet("/announcements/all");
          })
          .then(function (list) {
            announcements = (list || []).map(function (a) {
              return {
                id: a.id,
                title: a.title,
                body: a.body,
                tag: "",
              };
            });
            renderList();
            if (saveStatusEl) {
              saveStatusEl.textContent = "New announcements published to backend.";
              saveStatusEl.className =
                "text-[11px] text-emerald-600 transition-colors";
              setTimeout(function () {
                saveStatusEl.textContent =
                  "Editing existing announcements is not yet synced back.";
                saveStatusEl.className = "text-[11px] text-slate-400";
              }, 3000);
            }
          })
          .catch(function () {
            if (saveStatusEl) {
              saveStatusEl.textContent =
                "Could not publish announcements to backend. Please try again.";
              saveStatusEl.className = "text-[11px] text-red-500";
            }
          });
      } else {
        // Fallback to local mock persistence
        apiPost("/hr/announcements", { announcements: announcements })
          .then(function (list) {
            announcements = list || [];
            renderList();
            if (saveStatusEl) {
              saveStatusEl.textContent = "Announcements saved locally.";
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
                "Could not save announcements. Please try again.";
              saveStatusEl.className = "text-[11px] text-red-500";
            }
          });
      }
    });
  }
});


