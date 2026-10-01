/* ═══ projectForm — เพิ่มงานใหม่ (PM เฉพาะ role PM) ═══ */
const ProjectForm = (() => {
  function open(onSave, opts = {}) {
    const stageOptions = Object.entries(DATA.stageMap).map(([k, v]) =>
      `<option value="${k}" ${opts.stage === k ? "selected" : ""}>${v.label}</option>`).join("");
    const healthOptions = Object.entries(DATA.healthMap).map(([k, v]) =>
      `<option value="${k}" ${k === "on-track" ? "selected" : ""}>${v.label}</option>`).join("");
    const pmOptions = sel => DATA.members
      .filter(m => String(m.role).includes("PM"))
      .map(m => `<option value="${m.id}" ${sel === m.id ? "selected" : ""}>${U.esc(m.name)}</option>`).join("");
    const coordOptions = () => DATA.members
      .filter(m => !String(m.role).includes("PM"))
      .map(m => `<option value="${m.id}">${U.esc(m.name)}</option>`).join("");

    Modal.open({
      title: opts.title || "เพิ่มงานใหม่ (New Job)",
      body: `
        <datalist id="pf-clients">${DATA.clients.map(c => `<option value="${U.esc(c)}">`).join("")}</datalist>
        <div class="field"><label>เลขที่ JOB *</label>
          <input class="input" id="pf-id" placeholder="เช่น J693170"></div>
        <div class="field"><label>ชื่องาน *</label>
          <input class="input" id="pf-name" placeholder="ชื่องาน / สาขา"></div>
        <div class="field"><label>ลูกค้า (พิมพ์เอง หรือเลือกจากรายการ)</label>
          <input class="input" id="pf-client" list="pf-clients" placeholder="เช่น Makro, ปตท."></div>
        <div class="form-2col">
          <div class="field"><label>สถานะ</label>
            <select class="select" id="pf-stage">${stageOptions}</select></div>
          <div class="field"><label>สถานะงาน</label>
            <select class="select" id="pf-health">${healthOptions}</select></div>
        </div>
        <div class="form-2col">
          <div class="field"><label>เจ้าของงาน (PM) *</label>
            <select class="select" id="pf-owner">${pmOptions("m1")}</select></div>
          <div class="field"><label>ประสานงาน</label>
            <select class="select" id="pf-coord"><option value="">— ไม่มี —</option>${coordOptions()}</select></div>
        </div>`,
      foot: `
        <button class="btn btn-outline" data-close>ยกเลิก</button>
        <button class="btn btn-primary" id="pf-save">${Icons.get("check-circle", 16)} บันทึก</button>`
    });

    U.$("#pf-save").onclick = () => {
      const id = U.$("#pf-id").value.trim(), name = U.$("#pf-name").value.trim();
      if (!id || !name) { Toast.show("กรุณากรอกเลขที่ JOB และชื่องาน", "error"); return; }
      if (DATA.projects.some(p => p.id === id)) { Toast.show("เลขที่ JOB นี้มีอยู่แล้ว", "error"); return; }
      DATA.projects.push({
        id, name,
        client: U.$("#pf-client").value.trim() || "ไม่ระบุ",
        stage: U.$("#pf-stage").value,
        health: U.$("#pf-health").value,
        owner: U.$("#pf-owner").value,
        coordinator: U.$("#pf-coord").value || null
      });
      U.store("tlh_projects", DATA.projects);
      Modal.close();
      if (onSave) onSave();
    };
  }
  return { open };
})();
window.ProjectForm = ProjectForm;