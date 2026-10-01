/* ═══ toast ═══ */
const Toast = (() => {
  let wrap = null;

  function init() {
    if (wrap) return;
    wrap = document.createElement("div");
    wrap.className = "toast-wrap";
    document.body.appendChild(wrap);
  }

  function show(msg, type = "info", ms = 2600) {
    init();
    const icon = type === "success" ? "check-circle" : type === "error" ? "alert" : "bell";
    const t = document.createElement("div");
    t.className = "toast " + type;
    t.innerHTML = Icons.get(icon, 17) + "<span>" + msg + "</span>";
    wrap.appendChild(t);
    setTimeout(() => {
      t.classList.add("out");
      setTimeout(() => t.remove(), 260);
    }, ms);
  }
  return { init, show };
})();
window.Toast = Toast;