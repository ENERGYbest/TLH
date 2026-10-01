/* ═══ profile — ข้อมูล/รูป/PIN/ปุ่มติดตั้งถาวร · user+admin+tlh ใช้ร่วมกัน ═══ */
(async function () {
  if (document.body.dataset.page !== "profile")
    throw new Error("[TLH] profile.js ถูกโหลดผิดหน้า — ตรวจ <script> ท้าย profile.html");

  if (!Auth.require()) return;
  API.boot();
  Toast.init(); Modal.init();

  const me = Auth.user();
  const myStaff = () => DATA.staff.find(s => String(s.empId) === String(me.empId)) || null;
  const KEY = "tlh_attendance";
  const saveStaff = () => U.store("tlh_staff", DATA.staff);
  const backHref = me.role === "user" ? "timesheet.html" : "index.html";

  U.$("#user-topbar").innerHTML = `
    <img class="brand-logo" src="${DATA.company.logo}" alt="" onerror="this.style.display='none'">
    <div class="min-w-0">
      <div class="b-name truncate">${DATA.company.name}</div>
      <div class="b-sub">${me.role === "user" ? "ระบบรายงานการเข้างาน" : "ผู้ดูแลระบบ"}</div>
    </div>
    <div class="spacer"></div>
    <span id="install-slot"></span>
    <button class="back-btn" id="pf-back" title="กลับ">
      ${Icons.get("chev-left", 17)}<span>กลับ</span>
    </button>`;

  U.$("#pf-back").onclick = () => location.href = backHref;

  function myAvatarHTML() {
    const s = myStaff();
    const img = s && s.photo;
    if (img) return `<img class="pimg" src="${img}" alt="รูปโปรไฟล์">`;
    const PAL = ["#D01B22","#2E6FD8","#1FA97C","#E89B18","#7C4DD8","#0FA3B1","#C2410C","#4E5563"];
    const color = s ? PAL[Number(s.empId) % PAL.length] : "#9AA1B0";
    return `<span class="avatar" style="background:${color};width:86px;height:86px;font-size:26px">
      ${U.esc(U.initials(me.name))}</span>`;
  }

  function render() {
    const s = myStaff();
    const records = U.store(KEY) || [];
    const my = records.filter(r => String(r.empId) === String(me.empId));

    const ym = U.todayISO().slice(0, 7);
    const month = my.filter(r => r.date.startsWith(ym));
    const days = new Set(month.map(r => r.date)).size;
    const sites = new Set(month.map(r => r.location)).size;

    U.$("#page-root").innerHTML = `
    <div class="card profile-head mt-2">
      <div class="profile-avatar">
        ${myAvatarHTML()}
        <button class="cam-edit" id="pf-photo" title="เปลี่ยนรูปโปรไฟล์">
          ${Icons.get("camera", 15)}
        </button>
      </div>
      <div class="min-w-0">
        <div class="profile-name">${U.esc(me.name)}</div>
        <div class="profile-sub">รหัสพนักงาน <b>${me.empId}</b> · ${U.esc(me.position || (s ? s.position : ""))}</div>
        <div class="profile-stats">
          <span class="badge ${me.role === "admin" ? "b-red" : me.role === "tlh" ? "b-amber" : "b-blue"}">
            ${me.role === "admin" ? "Admin" : me.role === "tlh" ? "หัวหน้างาน" : "พนักงาน"}</span>
          <span class="badge b-green">เช็คอิน ${month.length} ครั้ง (เดือนนี้)</span>
        </div>
      </div>
    </div>

    <div class="pstat">
      <div class="card"><div class="v">${days}</div><div class="l">วันที่เช็คอิน (เดือนนี้)</div></div>
      <div class="card"><div class="v">${month.length}</div><div class="l">ครั้งที่เช็คอิน</div></div>
      <div class="card"><div class="v">${sites}</div><div class="l">ไซต์ที่ไป</div></div>
    </div>

    <div class="card card-pad mt-3">
      <div class="section-title" style="margin-bottom:8px">
        <h2>${Icons.get("user", 17)} เปลี่ยน PIN</h2>
      </div>
      <div class="field">
        <label>PIN ปัจจุบัน *</label>
        <input class="input pin-mask" id="pw-old" type="text" inputmode="numeric" maxlength="6"
               placeholder="ใส่ PIN เดิม" autocomplete="off">
      </div>
      <div class="form-2col">
        <div class="field">
          <label>PIN ใหม่ *</label>
          <input class="input pin-mask" id="pw-new" type="text" inputmode="numeric" maxlength="6"
                 placeholder="4–6 หลัก" autocomplete="off">
        </div>
        <div class="field">
          <label>ยืนยัน PIN ใหม่ *</label>
          <input class="input pin-mask" id="pw-new2" type="text" inputmode="numeric" maxlength="6"
                 placeholder="พิมพ์ซ้ำ" autocomplete="off">
        </div>
      </div>
      <button class="btn btn-primary" id="pw-save" style="width:100%">
        ${Icons.get("check-circle", 16)} เปลี่ยน PIN
      </button>
    </div>

    <div class="card card-pad mt-3">
      <div class="section-title" style="margin-bottom:8px">
        <h2>${Icons.get("camera", 17)} สิทธิ์การใช้กล้อง</h2>
      </div>
      <p class="small muted" id="camera-permission-status" aria-live="polite">
        กดปุ่มเพื่อตรวจสอบและอนุญาตการใช้กล้องสำหรับเช็คอิน
      </p>
      <button class="btn btn-outline" id="camera-permission-btn" style="width:100%">
        ${Icons.get("camera", 16)} ตรวจสอบ / ขอสิทธิ์กล้อง
      </button>
      <p class="small muted mt-2">
        หากเคยกดปฏิเสธแล้ว browser ไม่ถามอีก ให้เปลี่ยนสิทธิ์กล้องเป็นอนุญาตในการตั้งค่าเว็บไซต์ แล้วกดปุ่มนี้ใหม่
      </p>
    </div>

    <div class="card install-forever">
      <div class="section-title" style="margin-bottom:10px;justify-content:center">
        <h2>📲 ติดตั้งแอปบนมือถือ</h2>
      </div>
      <button class="btn btn-primary btn-checkin" id="pf-install">
        ${Icons.get("download", 18)} ติดตั้งแอป TLH เช็คอิน
      </button>
      <p class="note">กดได้ตลอดเวลา — เผื่อเผลอลบแอปไป กดติดตั้งใหม่ได้ที่นี่</p>
    </div>`;

    bind();
  }

  function bind() {
    U.$("#pf-install").onclick = () => Install.prompt();
    U.$("#camera-permission-btn").onclick = async e => {
      const button = e.currentTarget;
      const status = U.$("#camera-permission-status");
      button.disabled = true;
      status.textContent = "กำลังตรวจสอบสิทธิ์กล้อง…";
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia)
          throw new Error("เบราว์เซอร์นี้ไม่รองรับกล้อง");
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" }, audio: false
        });
        stream.getTracks().forEach(track => track.stop());
        status.textContent = "อนุญาตใช้กล้องแล้ว พร้อมถ่ายรูปเช็คอิน";
        status.style.color = "var(--success)";
        Toast.show("อนุญาตใช้กล้องแล้ว", "success");
      } catch (error) {
        status.textContent = error.name === "NotAllowedError" || error.name === "PermissionDeniedError"
          ? "ยังไม่ได้รับอนุญาต หากเคยปฏิเสธ ให้เปลี่ยนสิทธิ์กล้องในตั้งค่าเว็บไซต์แล้วลองอีกครั้ง"
          : error.message || "ตรวจสอบกล้องไม่สำเร็จ";
        status.style.color = "var(--red-600)";
      } finally {
        button.disabled = false;
      }
    };

    U.$("#pf-photo").onclick = () => {
      Modal.open({
        title: "เปลี่ยนรูปโปรไฟล์",
        body: `
          <div class="pv-choice">
            <button class="pv-btn" id="pv-cam">
              <span class="ic">${Icons.get("camera", 20)}</span>
              <span><span class="t">ถ่ายรูปใหม่</span><br><span class="d">เปิดกล้องหน้าถ่ายเลย</span></span>
            </button>
            ${myStaff() && myStaff().photo ? `
            <button class="pv-btn" id="pv-del">
              <span class="ic" style="background:var(--gray-100);color:var(--text-3)">${Icons.get("trash", 20)}</span>
              <span><span class="t">ลบรูปโปรไฟล์</span><br><span class="d">กลับเป็นอวตารตัวอักษร</span></span>
            </button>` : ""}
          </div>`,
        foot: `<button class="btn btn-outline" data-close>ยกเลิก</button>`
      });
      U.$("#pv-cam").onclick = () => {
        Modal.close();
        Camera.open({
          title: "ถ่ายรูปโปรไฟล์",
          guidance: ["ถ่ายให้เห็นใบหน้าชัดเจน เพื่อใช้ยืนยันตัวตนในโปรไฟล์"],
          onCapture: async photo => {
            const s = myStaff();
            if (!s) { Toast.show("ไม่พบข้อมูลบัญชี", "error"); return; }
            const oldPhoto = s.photo || null;
            let url = null;
            const cloudEnabled = API.enabled();
            if (cloudEnabled) {
              Toast.show("⏳ กำลังอัปโหลดรูป…", "info", 6000);
              try {
                url = await API.uploadPhoto(photo, "profile_" + me.empId + "_" + Date.now() + ".jpg", "profile");
              } catch (e) { Toast.show("อัปโหลดไม่สำเร็จ ลองใหม่", "error"); return; }
            }
            s.photo = url || photo;
            saveStaff();
            if (cloudEnabled && !await API.flush()) {
              s.photo = oldPhoto;
              saveStaff();
              await API.flush();
              if (url) await API.deleteUploadedPhoto(url).catch(() => {});
              render();
              Toast.show("บันทึกรูปไม่สำเร็จ รูปเดิมยังอยู่", "error");
              return;
            }
            if (cloudEnabled && oldPhoto && oldPhoto !== s.photo) {
              try { await API.deleteUploadedPhoto(oldPhoto); }
              catch (e) {
                console.warn("[TLH] ลบรูปโปรไฟล์เดิมไม่สำเร็จ:", e.message);
                render();
                Toast.show("อัปเดตรูปแล้ว แต่ลบรูปเก่าไม่สำเร็จ", "error");
                return;
              }
            }
            render();
            Toast.show("อัปเดตรูปโปรไฟล์แล้ว ✨", "success");
          }
        });
      };
      const del = U.$("#pv-del");
      if (del) del.onclick = async () => {
        const s = myStaff();
        if (!s) { Toast.show("ไม่พบข้อมูลบัญชี", "error"); return; }
        const oldPhoto = s.photo || null;
        delete s.photo;
        saveStaff();
        if (API.enabled() && !await API.flush()) {
          s.photo = oldPhoto;
          saveStaff();
          await API.flush();
          render();
          Toast.show("ลบรูปไม่สำเร็จ รูปเดิมยังอยู่", "error");
          return;
        }
        Modal.close();
        render();
        if (API.enabled() && oldPhoto) {
          try { await API.deleteUploadedPhoto(oldPhoto); }
          catch (error) {
            console.warn("[TLH] ลบรูปโปรไฟล์ไม่สำเร็จ:", error.message);
            Toast.show("ลบรูปจากโปรไฟล์แล้ว แต่ลบไฟล์เก่าไม่สำเร็จ", "error");
            return;
          }
        }
        Toast.show("ลบรูปโปรไฟล์แล้ว", "success");
      };
    };

    U.$("#pw-save").onclick = () => {
      const s = myStaff();
      if (!s) { Toast.show("ไม่พบข้อมูลบัญชี", "error"); return; }
      const oldPin = U.$("#pw-old").value.trim();
      const newPin = U.$("#pw-new").value.trim();
      const newPin2 = U.$("#pw-new2").value.trim();

      if (!oldPin || !newPin || !newPin2) {
        Toast.show("กรุณากรอกให้ครบทั้ง 3 ช่อง", "error"); return;
      }
      if (String(s.pin) !== oldPin) {
        Toast.show("PIN ปัจจุบันไม่ถูกต้อง", "error");
        U.$("#pw-old").select();
        return;
      }
      if (!/^\d{4,6}$/.test(newPin)) {
        Toast.show("PIN ใหม่ต้องเป็นตัวเลข 4–6 หลัก", "error"); return;
      }
      if (newPin !== newPin2) {
        Toast.show("PIN ใหม่ไม่ตรงกัน", "error");
        U.$("#pw-new2").select();
        return;
      }

      Modal.open({
        title: "ยืนยันการเปลี่ยน PIN",
        body: `<p>เปลี่ยน PIN เป็น <b>••••</b> แน่ใจหรือไม่?
               <br><span class="small muted">ใช้ PIN ใหม่ตั้งแต่ครั้งเข้าสู่ระบบถัดไป</span></p>`,
        foot: `<button class="btn btn-outline" data-close>ยกเลิก</button>
               <button class="btn btn-primary" id="pw-yes">เปลี่ยน PIN</button>`
      });
      U.$("#pw-yes").onclick = () => {
        s.pin = newPin;
        saveStaff();
        API.flush();
        Modal.close(); render();
        Toast.show("เปลี่ยน PIN เรียบร้อย 🎉", "success");
      };
    };


    Install.mount("#install-slot");
  }

  render();
  API.onCloud(render);
})();