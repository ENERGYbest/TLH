/* ═══ modal + onClose hook ═══ */
const Modal = (() => {
  let onClose = null;

  function init() {
    if (document.getElementById("modal-overlay")) return;
    const ov = document.createElement("div");
    ov.className = "modal-overlay";
    ov.id = "modal-overlay";
    ov.innerHTML = `
      <div class="modal" role="dialog" aria-modal="true">
        <div class="modal-head">
          <h3 id="modal-title"></h3>
          <button class="btn-icon" data-close aria-label="ปิด">${Icons.get("x", 18)}</button>
        </div>
        <div class="modal-body" id="modal-body"></div>
        <div class="modal-foot" id="modal-foot"></div>
      </div>`;
    document.body.appendChild(ov);
    ov.addEventListener("click", e => {
      if (e.target === ov || e.target.closest("[data-close]")) close();
    });
    document.addEventListener("keydown", e => { if (e.key === "Escape") close(); });
  }

  function open({ title = "", body = "", foot = "" }) {
    init();
    U.$("#modal-title").innerHTML = title;
    U.$("#modal-body").innerHTML = body;
    U.$("#modal-foot").innerHTML = foot || '<button class="btn btn-outline" data-close>ปิด</button>';
    U.$("#modal-overlay").classList.add("open");
  }

  function close() {
    const ov = document.getElementById("modal-overlay");
    if (ov) ov.classList.remove("open");
    if (onClose) { try { onClose(); } catch (_) {} onClose = null; }
  }

  function setOnClose(fn) { onClose = fn; };

  return { init, open, close, setOnClose };
})();
window.Modal = Modal;