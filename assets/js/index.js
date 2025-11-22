// Simple mock login: load mock profile, stash in localStorage, go to dashboard

document.addEventListener("DOMContentLoaded", function () {
  var btn = document.getElementById("enter-portal-btn");
  if (!btn) return;

  btn.addEventListener("click", function () {
    mockFetchProfile()
      .then(function (profile) {
        setCurrentIntern(profile);
        window.location.href = "intern-dashboard.html";
      })
      .catch(function () {
        // fallback: still redirect, using whatever getCurrentIntern returns
        if (!getCurrentIntern()) {
          setCurrentIntern({
            id: "intern-fallback",
            name: "Intern",
          });
        }
        window.location.href = "intern-dashboard.html";
      });
  });
});


