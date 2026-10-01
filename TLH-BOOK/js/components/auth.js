/* ═══ auth — login/session/สิทธิ์ (admin/tlh/user) + กันวนลูป ═══ */
const Auth = (() => {
  const KEY    = "tlh_session";
  const BOUNCE = "_tlh_bounce";
  const ROLES = new Set(["admin", "tlh", "user"]);
  const TLH_KEYS = ["tlh_session", "tlh_staff", "tlh_settings",
                    "tlh_company", "tlh_attendance", "tlh_members",
                    "tlh_clients", "tlh_projects", "tlh_cache"];

  const ls = {
    get(k)    { try { return localStorage.getItem(k); }    catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); return true; } catch { return false; } },
    del(k)    { try { localStorage.removeItem(k); }        catch {} }
  };
  const ss = {
    get(k)    { try { return sessionStorage.getItem(k); }  catch { return null; } },
    set(k, v) { try { sessionStorage.setItem(k, v); }      catch {} },
    del(k)    { try { sessionStorage.removeItem(k); }      catch {} }
  };

  const here = () => (location.pathname.split("/").pop() || "index.html").toLowerCase();
  const norm = url => String(url || "").replace(/^\.\//, "").toLowerCase();

  function storageOK() {
    try { localStorage.setItem("__tlh_t", "1"); localStorage.removeItem("__tlh_t"); return true; }
    catch { return false; }
  }

  function user() {
    let u = null;
    try { u = JSON.parse(ls.get(KEY)); } catch { u = null; }
    if (!u || !u.empId) return null;
    if (!u.role || !u.name) {
      const s = ((typeof DATA !== "undefined" && DATA.staff) || [])
        .find(x => String(x.empId) === String(u.empId));
      if (!s) { ls.del(KEY); return null; }
      u.name = u.name || s.name;
      u.position = u.position || s.position;
      u.role = s.role || "user";
      ls.set(KEY, JSON.stringify(u));
    }
    if (!ROLES.has(u.role)) {
      u.role = "user";
      ls.set(KEY, JSON.stringify(u));
    }
    return u;
  }

  function login(empId, pin) {
    if (!storageOK())
      return { ok: false, msg: "เบราว์เซอร์บล็อก localStorage — เปิดผ่าน Chrome/Edge ปกติ หรือ localhost" };
    const s = ((typeof DATA !== "undefined" && DATA.staff) || [])
      .find(x => String(x.empId) === String(empId).trim());
    if (!s)                 return { ok: false, msg: "ไม่พบรหัสพนักงานนี้" };
    if (s.active === false) return { ok: false, msg: "บัญชีถูกปิดใช้งาน — ติดต่อผู้ดูแล" };
    if (String(s.pin) !== String(pin).trim()) return { ok: false, msg: "PIN ไม่ถูกต้อง" };
    if (!s.role) s.role = "user";
    const sess = { empId: s.empId, name: s.name, position: s.position, role: s.role, t: Date.now() };
    if (!ls.set(KEY, JSON.stringify(sess)))
      return { ok: false, msg: "บันทึก session ไม่สำเร็จ" };
    ss.del(BOUNCE);
    return { ok: true, user: sess };
  }

  const home = () => (user()?.role === "user" ? "timesheet.html" : "index.html");

  function go(url) {
    const target = norm(url);
    if (!target) return;
    if (target === here()) {
      diag("หน้านี้พยายามเปลี่ยนไปหน้าตัวเอง (self-redirect) — เกิดจากไฟล์ JS ตัวเก่าหรือโหลดผิดหน้า");
      return;
    }
    const now = Date.now();
    let log = [];
    try { log = JSON.parse(ss.get(BOUNCE) || "[]"); } catch {}
    log = (Array.isArray(log) ? log : []).filter(t => now - t < 15000);
    log.push(now);
    ss.set(BOUNCE, JSON.stringify(log));
    if (log.length > 3) {
      diag("เปลี่ยนหน้าวนเกิน 3 ครั้งใน 15 วินาที (login ↔ หน้าอื่น ตีกัน)");
      return;
    }
    location.replace(url);
  }

  function require(roles) {
    const u = user();
    if (!u) {
      if (here() === "login.html") return false;
      go("login.html");
      return false;
    }
    if (roles && !roles.includes(u.role)) {
      const h = home();
      if (here() === norm(h)) return false;
      go(h);
      return false;
    }
    return true;
  }

  function logout() {
    ls.del(KEY);
    ss.del(BOUNCE);
    location.replace("login.html");
  }

  function clearAll() {
    TLH_KEYS.forEach(ls.del);
    ss.del(BOUNCE);
  }

  function diag(reason) {
    const u = user();
    const staff = (typeof DATA !== "undefined" && DATA.staff) || [];
    const admins = staff.filter(s => s.role === "admin").map(s => s.empId).join(", ") || "—";
    const page = here();
    const scripts = [...document.scripts].map(s => (s.src || "").split("/").pop()).filter(Boolean);
    document.title = "⚠️ วินิจฉัยระบบ — T.L.H. Engineering";
    document.body.innerHTML = `
    <div style="min-height:100vh;background:#F4F5F7;display:flex;align-items:center;
         justify-content:center;padding:20px;font-family:Kanit,sans-serif">
      <div style="max-width:640px;width:100%;background:#fff;border-radius:18px;
           box-shadow:0 16px 48px rgba(0,0,0,.15);padding:28px;border-top:6px solid #D01B22">
        <h1 style="font-size:19px;color:#A8141A;margin:0">⚠️ ระบบหยุดการเปลี่ยนหน้าอัตโนมัติ</h1>
        <p style="color:#5A6272;font-size:13.5px;margin:8px 0 14px;line-height:1.7">
          <b>สาเหตุ:</b> ${reason || "การเปลี่ยนหน้าผิดปกติ"}</p>
        <div style="background:#FDE3E4;border-radius:12px;padding:14px 16px;
             font-size:13px;line-height:2;color:#383E4A">
          <b>🔍 การวินิจฉัย</b><br>
          • localStorage: ${storageOK() ? "✅ ใช้งานได้" : "❌ ถูกบล็อก"}<br>
          • Session: ${u ? `✅ ${u.name} (รหัส ${u.empId}) · สิทธิ์ <b>${u.role}</b>` : "❌ ไม่มี session"}<br>
          • พนักงาน: ${staff.length} คน · Admin: ${admins}<br>
          • หน้าปัจจุบัน: ${page} · data-page: <b>${document.body.dataset.page || "(ไม่มี!)"}</b>
        </div>
        <div style="background:#EEF0F4;border-radius:12px;padding:14px 16px;margin-top:12px;
             font-size:12.5px;line-height:1.9;color:#383E4A">
          <b>📂 ไฟล์ JS ที่โหลดอยู่ (${scripts.length}):</b><br>
          ${scripts.map(s => "• " + s).join("<br>")}
        </div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:6px">
          <button id="dg-fix" style="flex:1;min-width:220px;background:#D01B22;color:#fff;border:0;
              border-radius:10px;padding:13px 16px;font-size:14px;cursor:pointer;font-family:inherit">
              🧹 ล้างข้อมูลแล้วเข้าสู่ระบบใหม่</button>
          <button id="dg-retry" style="flex:1;min-width:160px;background:#fff;color:#383E4A;
              border:1.5px solid #CBD0DA;border-radius:10px;padding:13px 16px;font-size:14px;
              cursor:pointer;font-family:inherit">🔄 โหลดหน้านี้ใหม่</button>
        </div>
        <p style="color:#9AA1B0;font-size:11.5px;margin:12px 0 0">Admin = รหัส 1001 · PIN 1234</p>
      </div>
    </div>`;
    document.getElementById("dg-fix").onclick = () => { clearAll(); location.href = "login.html"; };
    document.getElementById("dg-retry").onclick = () => { ss.del(BOUNCE); location.reload(); };
  }

  return { user, login, logout, require, home, go, clearAll };
})();