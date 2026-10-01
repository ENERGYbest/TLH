/* ═══ api.js v7 — Supabase แยกตาราง · seed ครั้งเดียว · ลบเช็คอินรายการ/ทั้งหมด ═══ */
const API = (() => {
  const SB_URL = "https://vuhrepvhzacfkmcsiydm.supabase.co";
  const SB_KEY = "sb_publishable_p6cArsT_iGnIcbpZdVSNcQ_SEca1TP0";
  const TIMEOUT = 8000;
  const CLEANUP_KEY = "tlh_attendance_cleanup_90d";

  let sb = null;
   let checkoutTableAvailable = false;
  function client() {
    if (typeof window.supabase === "undefined") return null;
    if (!sb) sb = window.supabase.createClient(SB_URL, SB_KEY);
    return sb;
  }
  const enabled = () => !!client();

  const FIELD = {
    tlh_staff: "staff", tlh_members: "members", tlh_clients: "clients",
    tlh_projects: "projects", tlh_settings: "settings", tlh_company: "company"
  };
  const VALID = {
    tlh_staff:      v => Array.isArray(v) && v.length > 0,
    tlh_members:    v => Array.isArray(v) && v.length > 0,
    tlh_clients:    v => Array.isArray(v),
    tlh_projects:   v => Array.isArray(v),
    tlh_settings:   v => v && typeof v === "object" && !Array.isArray(v),
    tlh_company:    v => v && typeof v === "object" && !Array.isArray(v),
    tlh_attendance: v => Array.isArray(v)
  };

  let badge = null;
  function sync(on) {
    if (!on) { if (badge) { badge.remove(); badge = null; } return; }
    if (!badge && document.body) {
      badge = document.createElement("div");
      badge.textContent = "☁️ กำลังซิงก์ข้อมูล…";
      badge.style.cssText =
        "position:fixed;right:12px;bottom:12px;z-index:99998;" +
        "background:rgba(20,23,28,.82);color:#fff;padding:8px 14px;border-radius:99px;" +
        "font-size:12px;font-family:Kanit,sans-serif;box-shadow:0 4px 14px rgba(0,0,0,.25)";
      document.body.appendChild(badge);
    }
  }

  function applyTheme() {
    if (typeof THEMES === "undefined" || !DATA.settings) return;
    const th = THEMES[DATA.settings.theme] || THEMES.red;
    Object.entries(th).forEach(([k, v]) =>
      document.documentElement.style.setProperty("--red-" + k, v));
  }

  function loadLocal() {
    Object.keys(FIELD).forEach(k => {
      try {
        const v = JSON.parse(localStorage.getItem(k));
        if (VALID[k](v)) DATA[FIELD[k]] = v;
      } catch (_) {}
    });
    applyTheme();
  }

  function applyCloud(d) {
    if (!d || typeof d !== "object") return;
    Object.entries(FIELD).forEach(([k, field]) => {
      if (VALID[k](d[k])) {
        localStorage.setItem(k, JSON.stringify(d[k]));
        DATA[field] = d[k];
      }
    });
    if (VALID.tlh_attendance(d.tlh_attendance))
      localStorage.setItem("tlh_attendance", JSON.stringify(d.tlh_attendance));
    applyTheme();
  }

  function withTimeout(p) {
    return Promise.race([
      p,
      new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), TIMEOUT))
    ]);
  }

  const now = () => new Date().toISOString();
  const rowToProject = r => ({ id: r.id, name: r.name, client: r.client, stage: r.stage || "active",
    health: r.health || "on-track", owner: r.owner || null, coordinator: r.coordinator || null });
  const projectToRow = p => ({ id: String(p.id), name: p.name, client: p.client || "",
    stage: p.stage || "active", health: p.health || "on-track",
    owner: p.owner || null, coordinator: p.coordinator || null, updated_at: now() });
  const rowToStaff = r => ({ empId: String(r.emp_id), no: r.no, name: r.name,
    position: r.position, pin: r.pin, role: r.role, active: r.active !== false,
    photo: r.photo || null });
  const staffToRow = s => ({ emp_id: String(s.empId), no: (s.no ?? null), name: s.name,
    position: s.position || "", pin: String(s.pin || "1234"), role: s.role || "user",
    active: s.active !== false, photo: s.photo || null, updated_at: now() });
  const rowToMember = r => ({ id: r.id, name: r.name, role: r.role, color: r.color });
  const memberToRow = m => ({ id: m.id, name: m.name, role: m.role, color: m.color || "#D01B22", updated_at: now() });
  const rowToCompany = r => ({ name: r.name, nameEn: r.name_en, sub: r.sub, address: r.address,
    tel: r.tel, fax: r.fax, updated: r.updated, logo: r.logo });
  const companyToRow = c => ({ id: 1, name: c.name, name_en: c.nameEn, sub: c.sub || "",
    address: c.address || "", tel: c.tel || "", fax: c.fax || "", updated: c.updated || "",
    logo: c.logo || "", updated_at: now() });

  async function upsertSync(table, pk, rows) {
    const keep = rows.map(r => String(r[pk]));
    const ex = await sb.from(table).select(pk);
    if (ex.error) throw new Error(ex.error.message);
    const existing = (ex.data || []).map(r => String(r[pk]));
    const toDelete = existing.filter(x => !keep.includes(x));
    if (toDelete.length) {
      const del = await sb.from(table).delete().in(pk, toDelete);
      if (del.error) throw new Error(del.error.message);
    }
    if (!rows.length) return;
    const up = await sb.from(table).upsert(rows, { onConflict: pk });
    if (up.error) throw new Error(up.error.message);
  }

  async function writeKey(key, value) {
    if (key === "tlh_attendance") {
      if (!Array.isArray(value) || value.length === 0) return clearAttendance();
      const rows = value.map(x => ({
        rid: x.rid, date: x.date, timeIn: x.timeIn,
        empId: String(x.empId), name: x.name, location: x.location,
         photo: (x.photo && String(x.photo).startsWith("data:")) ? null : x.photo
      }));
      const r = await sb.from("attendance").upsert(rows, { onConflict: "rid" });
      if (r.error) throw new Error(r.error.message);
        const checkouts = value.filter(x => x.dateOut && x.timeOut).map(x => ({
          rid: x.rid, dateOut: x.dateOut, timeOut: x.timeOut,
          photoOut: (x.photoOut && String(x.photoOut).startsWith("data:")) ? null : x.photoOut
        }));
        if (checkouts.length || checkoutTableAvailable) {
          const existing = await sb.from("attendance_checkout").select("rid");
          if (existing.error) throw new Error(existing.error.message);
          const keep = checkouts.map(x => String(x.rid));
          const stale = (existing.data || []).map(x => String(x.rid)).filter(rid => !keep.includes(rid));
          if (stale.length) {
            const removed = await sb.from("attendance_checkout").delete().in("rid", stale);
            if (removed.error) throw new Error(removed.error.message);
          }
          if (checkouts.length) {
            const saved = await sb.from("attendance_checkout").upsert(checkouts, { onConflict: "rid" });
            if (saved.error) throw new Error(saved.error.message);
          }
        }
      return;
    }
    if (key === "tlh_projects") return upsertSync("projects", "id", (value || []).map(projectToRow));
    if (key === "tlh_staff")    return upsertSync("staff", "emp_id", (value || []).map(staffToRow));
    if (key === "tlh_members")  return upsertSync("members", "id", (value || []).map(memberToRow));
    if (key === "tlh_clients")  return upsertSync("clients", "name", (value || []).map(n => ({ name: n, updated_at: now() })));
    if (key === "tlh_settings") {
      const rows = Object.entries(value || {}).map(([k, v]) => ({ key: k, value: v }));
      if (rows.length) {
        const up = await sb.from("settings").upsert(rows, { onConflict: "key" });
        if (up.error) throw new Error(up.error.message);
      }
      const ex = await sb.from("settings").select("key");
      if (ex.error) throw new Error(ex.error.message);
      const keep = rows.map(r => r.key);
      const gone = (ex.data || []).map(r => r.key)
        .filter(k => !keep.includes(k) && k !== "seeded");
      if (gone.length) {
        const del = await sb.from("settings").delete().in("key", gone);
        if (del.error) throw new Error(del.error.message);
      }
      return;
    }
    if (key === "tlh_company") {
      const src = (value && value.name) ? value : DATA.company;
      const r = await sb.from("company").upsert(companyToRow(src), { onConflict: "id" });
      if (r.error) throw new Error(r.error.message);
      return;
    }
  }

  /* ล้างทั้งหมด */
  async function clearAttendance() {
    delete pending["tlh_attendance"];
    const checkins = await sb.from("attendance").select("photo");
    if (checkins.error) throw new Error(checkins.error.message);
    let checkouts = { data: [], error: null };
    if (checkoutTableAvailable) {
      checkouts = await sb.from("attendance_checkout").select("photoOut");
      if (checkouts.error) throw new Error(checkouts.error.message);
    }
    const paths = [...new Set([
      ...(checkins.data || []).map(record => photoObjectPath(record.photo)),
      ...(checkouts.data || []).map(record => photoObjectPath(record.photoOut))
    ].filter(Boolean))];
    for (let i = 0; i < paths.length; i += 100) {
      const { error } = await sb.storage.from("photos").remove(paths.slice(i, i + 100));
      if (error) throw new Error(error.message);
    }
    const r = await sb.from("attendance").delete().neq("rid", -1);
    if (r.error) throw new Error(r.error.message);
    try { localStorage.setItem("tlh_attendance", "[]"); } catch (_) {}
    return true;
  }

  /* ลบ 1 รายการ (พนักงานลบเช็คอินตัวเอง) — ลบแถว + ลบรูปใน Storage */
  async function deleteAttendance(rid, photoUrl, photoOutUrl) {
    delete pending["tlh_attendance"];
    if (checkoutTableAvailable) {
      const checkout = await sb.from("attendance_checkout").delete().eq("rid", rid);
      if (checkout.error) throw new Error(checkout.error.message);
    }
    const r = await sb.from("attendance").delete().eq("rid", rid);
    if (r.error) throw new Error(r.error.message);
    for (const photo of [photoUrl, photoOutUrl])
      if (photo) { try { await deleteUploadedPhoto(photo); } catch (_) {} }
    return true;
  }

  function seedValue(k) {
    try {
      const v = JSON.parse(localStorage.getItem(k));
      if (v !== null && v !== undefined) return v;
    } catch (_) {}
    if (k === "tlh_attendance") return [];
    return undefined;
  }

  let cloudDone = false, bootPromise = null;

  function boot() {
    if (!enabled()) return Promise.resolve(false);
    loadLocal();
    if (bootPromise) return bootPromise;

    sync(true);
    bootPromise = (async () => {
      try {
        const [pr, st, me, cl, se, co, at] = await Promise.all([
          withTimeout(sb.from("projects").select("*")),
          withTimeout(sb.from("staff").select("*")),
          withTimeout(sb.from("members").select("*")),
          withTimeout(sb.from("clients").select("*")),
          withTimeout(sb.from("settings").select("*")),
          withTimeout(sb.from("company").select("*")),
          withTimeout(sb.from("attendance").select("*").order("rid"))
        ]);
        [pr, st, me, cl, se, co, at].forEach(r => { if (r.error) throw new Error(r.error.message); });

        let checkoutRows = [];
        try {
          const checkoutResult = await withTimeout(sb.from("attendance_checkout")
            .select("rid, dateOut, timeOut, photoOut"));
          if (checkoutResult.error) throw new Error(checkoutResult.error.message);
          checkoutRows = checkoutResult.data || [];
          checkoutTableAvailable = true;
        } catch (error) {
          checkoutTableAvailable = false;
          console.warn("[TLH API] ยังโหลดข้อมูลเช็คเอาท์ไม่ได้ กรุณาตรวจ SQL ตาราง attendance_checkout:", error.message);
        }
        const checkoutByRid = new Map(checkoutRows.map(row => [String(row.rid), row]));

        const d = {
          tlh_projects:   (pr.data || []).map(rowToProject),
          tlh_staff:      (st.data || []).map(rowToStaff),
          tlh_members:    (me.data || []).map(rowToMember),
          tlh_clients:    (cl.data || []).map(r => r.name),
          tlh_settings:   (se.data || []).filter(r => r.key !== "seeded").length
                            ? Object.fromEntries((se.data || []).filter(r => r.key !== "seeded")
                                .map(r => [r.key, r.value]))
                            : undefined,
          tlh_company:    (co.data || [])[0] && (co.data[0].name || co.data[0].logo)
                            ? rowToCompany(co.data[0]) : undefined,
          tlh_attendance:   (at.data || []).map(r => {
            const checkout = checkoutByRid.get(String(r.rid));
            return {
              rid: r.rid, date: r.date, timeIn: r.timeIn,
              dateOut: checkout && checkout.dateOut || null,
              timeOut: checkout && checkout.timeOut || null,
              empId: r.empId, name: r.name, location: r.location,
              photo: r.photo, photoOut: checkout && checkout.photoOut || null
            };
          })
        };

        /* seed ครั้งเดียวจริง ๆ (marker "seeded") — หลังล้างข้อมูลไม่โผลกลับมา */
        const alreadySeeded = (se.data || []).some(r => r.key === "seeded");
        if (!alreadySeeded) {
          const seededKeys = [], jobs = [];
          Object.keys(VALID).forEach(k => {
            const empty = d[k] === undefined ||
              (Array.isArray(d[k]) && d[k].length === 0);
            if (empty) {
              const sv = seedValue(k);
              if (sv !== null && sv !== undefined && !(Array.isArray(sv) && sv.length === 0)) {
                seededKeys.push(k);
                jobs.push(writeKey(k, sv));
              }
            }
          });
          if (jobs.length) {
            try { await Promise.all(jobs); } catch (e) { console.warn("[TLH API] seed ไม่สำเร็จ:", e.message); }
            seededKeys.forEach(k => { d[k] = seedValue(k); });
          }
          try { await sb.from("settings").upsert({ key: "seeded", value: true }); } catch (_) {}
        }

        applyCloud(d);
        let cleanupDone = false;
        try { cleanupDone = sessionStorage.getItem(CLEANUP_KEY) === "1"; } catch (_) {}
        if (!cleanupDone) {
          try {
            await cleanOldAttendance(90);
            try { sessionStorage.setItem(CLEANUP_KEY, "1"); } catch (_) {}
          } catch (e) {
            console.warn("[TLH API] ลบเช็คอินเก่าไม่สำเร็จ:", e.message);
          }
        }
        cloudDone = true;
        document.dispatchEvent(new CustomEvent("tlh:cloud"));
        return true;
      } catch (err) {
        console.warn("[TLH API] ใช้ข้อมูลในเครื่องแทน:", err.message);
        return false;
      } finally { sync(false); }
    })();
    return bootPromise;
  }

  function onCloud(fn) {
    document.addEventListener("tlh:cloud", () => {
      const a = document.activeElement;
      const busy = document.querySelector(".modal-overlay.open") ||
        (a && /INPUT|TEXTAREA|SELECT/.test(a.tagName));
      if (!busy) fn();
    });
    if (cloudDone) fn();
  }

  const pending = {};
  let flushTimer = null;
  function save(key, value) {
    if (!enabled()) return;
    pending[key] = value;
    if (flushTimer) clearTimeout(flushTimer);
    flushTimer = setTimeout(flush, 1200);
  }
  async function flush() {
    if (!enabled()) return true;
    clearTimeout(flushTimer); flushTimer = null;
    const jobs = Object.assign({}, pending);
    Object.keys(pending).forEach(k => delete pending[k]);
    if (!Object.keys(jobs).length) return true;
    sync(true);
    let allOK = true;
    for (const entry of Object.entries(jobs)) {
      try { await writeKey(entry[0], entry[1]); }
      catch (e) { allOK = false; console.warn("[TLH API] บันทึกไม่สำเร็จ:", entry[0], e.message); }
    }
    sync(false);
    return allOK;
  }

  async function uploadPhoto(dataUrl, name, folder = "checkin") {
    const blob = await (await fetch(dataUrl)).blob();
    const folderName = folder === "profile" ? "profile" : "checkin";
    const path = folderName + "/" + name;
    const up = await sb.storage.from("photos").upload(path, blob, {
      contentType: "image/jpeg", upsert: true
    });
    if (up.error) throw new Error(up.error.message);
    const pub = sb.storage.from("photos").getPublicUrl(path);
    return pub.data.publicUrl;
  }

  function photoObjectPath(photoUrl) {
    if (!photoUrl || String(photoUrl).startsWith("data:")) return null;
    try {
      const pathname = new URL(photoUrl).pathname;
      const marker = "/storage/v1/object/public/photos/";
      const index = pathname.indexOf(marker);
      if (index < 0) return null;
      const path = decodeURIComponent(pathname.slice(index + marker.length));
      return /^(checkin|profile)\//.test(path) ? path : null;
    } catch (_) { return null; }
  }

  async function deleteUploadedPhoto(photoUrl) {
    const path = photoObjectPath(photoUrl);
    if (!path) return false;
    const { error } = await sb.storage.from("photos").remove([path]);
    if (error) throw new Error(error.message);
    return true;
  }

  async function cleanOldAttendance(days = 90) {
    if (!enabled()) return 0;
    const retentionDays = Math.max(0, Math.floor(Number(days) || 0));
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - retentionDays);
    const cutoffDate = cutoff.toLocaleDateString("sv-SE");
    const { data, error } = await sb.from("attendance")
      .select("rid, date, photo")
      .lt("date", cutoffDate);
    if (error) throw new Error(error.message);

    const oldRecords = data || [];
    let checkouts = { data: [], error: null };
    if (checkoutTableAvailable && oldRecords.length) {
      checkouts = await sb.from("attendance_checkout").select("rid, photoOut")
        .in("rid", oldRecords.map(record => record.rid));
      if (checkouts.error) throw new Error(checkouts.error.message);
    }
    const paths = [...new Set([
      ...oldRecords.map(record => photoObjectPath(record.photo)),
      ...(checkouts.data || []).map(record => photoObjectPath(record.photoOut))
    ].filter(Boolean))];

    for (let i = 0; i < paths.length; i += 100) {
      const { error: storageError } = await sb.storage.from("photos").remove(paths.slice(i, i + 100));
      if (storageError) throw new Error(storageError.message);
    }

    if (oldRecords.length) {
      const { error: deleteError } = await sb.from("attendance").delete().lt("date", cutoffDate);
      if (deleteError) throw new Error(deleteError.message);
    }

    const keepRecent = records => Array.isArray(records)
      ? records.filter(record => String(record.date || "") >= cutoffDate)
      : [];
    if (Array.isArray(pending.tlh_attendance))
      pending.tlh_attendance = keepRecent(pending.tlh_attendance);
    try {
      const localRecords = JSON.parse(localStorage.getItem("tlh_attendance") || "[]");
      localStorage.setItem("tlh_attendance", JSON.stringify(keepRecent(localRecords)));
    } catch (_) {}
    return oldRecords.length;
  }

  return { enabled, boot, save, flush, uploadPhoto, deleteUploadedPhoto, onCloud,
           cleanOldAttendance, clearAttendance, deleteAttendance };
})();