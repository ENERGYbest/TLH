/* ═══ Project Board — ลากการ์ดเปลี่ยนสถานะ ═══ */
(async function () {
  if (document.body.dataset.page !== "board")
    throw new Error("[TLH] board.js ถูกโหลดผิดหน้า");

  if (!Auth.require(["admin", "tlh"])) return;
  API.boot();
  Sidebar.render(); Topbar.render(); Toast.init(); Modal.init();

  const root = U.$("#page-root");
  const COLS = [
    { key: "active", label: "งาน Active",         color: "var(--red-600)" },
    { key: "defect", label: "เก็บ 1 Year Defect",  color: "var(--warning)" },
    { key: "closed", label: "ปิด Job",             color: "var(--gray-400)" },
    { key: "cancel", label: "ยกเลิก",              color: "var(--gray-500)" }
  ];
  const nameOf = id => (DATA.members.find(m => m.id === id) || {}).name || "—";
  const labelOf = k => (COLS.find(c => c.key === k) || {}).label || k;

  function cardHTML(p) {
    return `
    <article class="k-card" draggable="true" data-id="${p.id}">
      <div class="flex justify-between items-center">
        <span class="badge b-gray">${p.id}</span>
        <button class="btn-icon" data-menu="${p.id}" title="ตัวเลือก">${Icons.get("more", 15)}</button>
      </div>
      <h3 class="title">${U.esc(p.name)}</h3>
      <div class="dates">${Icons.get("briefcase", 13)} ${U.esc(p.client)}</div>
      <div class="foot">
        <span class="flex items-center gap-2">
          ${p.owner ? U.avatar(p.owner, "avatar-sm") : ""}
          <span class="small muted">${p.owner ? nameOf(p.owner) : "ไม่มี PM"}</span>
          ${p.coordinator ? U.avatar(p.coordinator, "avatar-sm") : ""}
        </span>
      </div>
    </article>`;
  }

  function render() {
    root.innerHTML = `
    <div class="page-head">
      <div>
        <h1>Project Board</h1>
        <p class="sub">ลากการ์ดเพื่อเปลี่ยนสถานะงาน (Active → เก็บ Defect → ปิด Job)</p>
      </div>
      <div class="head-actions">
        <button class="btn btn-primary" id="b-add">${Icons.get("plus", 16)} เพิ่มงานใหม่</button>
      </div>
    </div>

    <div class="board">
      ${COLS.map(c => {
        const cards = DATA.projects.filter(p => p.stage === c.key);
        return `
        <div class="col" data-col="${c.key}">
          <div class="col-head">
            <span class="dot" style="background:${c.color}"></span>
            <span class="name">${c.label}</span>
            <span class="count">${cards.length}</span>
          </div>
          <div class="col-body">
            ${cards.map(cardHTML).join("")}
            <button class="add-card" data-add="${c.key}">${Icons.get("plus", 14)} เพิ่มการ์ด</button>
          </div>
        </div>`;
      }).join("")}
    </div>`;

    bindDnD();
    bindActions();
  }

  let dragId = null;
  function bindDnD() {
    U.$$(".k-card").forEach(card => {
      card.addEventListener("dragstart", e => {
        dragId = card.dataset.id;
        card.classList.add("dragging");
        e.dataTransfer.effectAllowed = "move";
        try { e.dataTransfer.setData("text/plain", dragId); } catch (_) {}
      });
      card.addEventListener("dragend", () => {
        card.classList.remove("dragging");
        dragId = null;
        U.$$(".col").forEach(c => c.classList.remove("drag-over"));
      });
    });
    U.$$(".col").forEach(col => {
      col.addEventListener("dragover", e => { e.preventDefault(); col.classList.add("drag-over"); });
      col.addEventListener("dragleave", e => {
        if (!col.contains(e.relatedTarget)) col.classList.remove("drag-over");
      });
      col.addEventListener("drop", e => {
        e.preventDefault();
        col.classList.remove("drag-over");
        const p = DATA.projects.find(x => x.id === dragId);
        if (!p || p.stage === col.dataset.col) return;
        p.stage = col.dataset.col;
        U.store("tlh_projects", DATA.projects);
        render();
        Toast.show(`ย้าย ${p.id} → ${labelOf(p.stage)}`, "success");
      });
    });
  }

  function bindActions() {
    U.$("#b-add").onclick = () => ProjectForm.open(() => {
      render(); Toast.show("เพิ่มงานใหม่แล้ว", "success");
    });
    U.$$("[data-add]").forEach(b => b.onclick = () =>
      ProjectForm.open(() => { render(); Toast.show("เพิ่มการ์ดใหม่แล้ว", "success"); },
        { stage: b.dataset.add, title: "เพิ่มการ์ด" }));
    U.$$("[data-menu]").forEach(b => b.onclick = e => {
      e.stopPropagation();
      openCardMenu(DATA.projects.find(x => x.id === b.dataset.menu));
    });
  }

  function openCardMenu(p) {
    if (!p) return;
    const st = DATA.stageMap[p.stage];
    Modal.open({
      title: U.esc(p.name),
      body: `
        <p class="small muted">${p.id} · ลูกค้า: ${U.esc(p.client)}</p>
        <div class="mt-2"><span class="badge ${st.cls}">${st.label}</span></div>
        ${p.owner ? `
        <div class="mt-3 flex items-center gap-2">
          ${U.avatar(p.owner)}<b>${nameOf(p.owner)}</b>
          <span class="small muted">· เจ้าของงาน</span>
        </div>` : ""}
        ${p.coordinator ? `
        <div class="mt-2 flex items-center gap-2">
          ${U.avatar(p.coordinator)}<b>${nameOf(p.coordinator)}</b>
          <span class="small muted">· ประสานงาน</span>
        </div>` : ""}`,
      foot: `
        <button class="btn btn-outline" data-close>ปิด</button>
        <button class="btn btn-danger" id="m-del">${Icons.get("trash", 15)} ลบงาน</button>`
    });
    U.$("#m-del").onclick = () => {
      DATA.projects = DATA.projects.filter(x => x.id !== p.id);
      U.store("tlh_projects", DATA.projects);
      Modal.close(); render();
      Toast.show(`ลบ ${p.id} แล้ว`, "success");
    };
  }

  render();
  API.onCloud(render);
})();