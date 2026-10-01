/* ═══ timesheet — เช็คอิน + ลบเช็คอินตัวเองได้ ═══ */
(async function () {
  if (document.body.dataset.page !== "timesheet")
    throw new Error("[TLH] timesheet.js ถูกโหลดผิดหน้า — ตรวจ <script> ท้าย timesheet.html");

  if (!Auth.require()) return;
  API.boot();
  Toast.init(); Modal.init();

  const me = Auth.user();
  const KEY = "tlh_attendance";
  let records = U.store(KEY) || [];
  const save = () => U.store(KEY, records);
  const myRecords = () => records.filter(r => String(r.empId) === String(me.empId));
  const todaySites = () => myRecords().filter(r => r.date === U.todayISO());

  U.$("#user-topbar").innerHTML = `
    <img class="brand-logo" src="${DATA.company.logo}" alt="" onerror="this.style.display='none'">
    <div class="min-w-0">
      <div class="b-name truncate">${DATA.company.name}</div>
      <div class="b-sub">ระบบรายงานการเข้างาน</div>
    </div>
    <div class="spacer"></div>
    <div class="u-name">${U.esc(me.name)}<div class="u-pos">${U.esc(me.position)} · ${me.empId}</div></div>
    ${U.avatar(me.empId)}
    <span id="install-slot"></span>
    <button class="btn-icon" id="ts-profile" title="โปรไฟล์ของฉัน">${Icons.get("user", 18)}</button>
    <button class="btn-icon" id="ts-logout" title="ออกจากระบบ">${Icons.get("logout", 18)}</button>`;

  U.$("#ts-logout").onclick = () => Auth.logout();
  U.$("#ts-profile").onclick = () => location.href = "profile.html";

  function render() {
    const today = todaySites();
    const checkoutWindowStart = U.addDays(U.todayISO(), -1);
    const canCheckOut = r => !r.timeOut && String(r.date || "") >= checkoutWindowStart;
    const pendingCheckouts = myRecords().filter(canCheckOut);
    const activeCheckout = pendingCheckouts[0] || null;
    const locs = DATA.settings.locations;
    const history = myRecords()
      .sort((a, b) => (b.date + b.timeIn).localeCompare(a.date + a.timeIn)).slice(0, 20);

    const ym = U.todayISO().slice(0, 7);
    const month = myRecords().filter(r => r.date.startsWith(ym));
    const days = new Set(month.map(r => r.date)).size;
    const sites = new Set(month.map(r => r.location)).size;

    const rowActions = r => `<div class="history-item-actions">
      ${r.timeOut ? `<button class="btn-icon" data-edit-checkout="${r.rid}" title="แก้ไขเวลาเช็คเอาท์" aria-label="แก้ไขเวลาเช็คเอาท์">${Icons.get("edit", 16)}</button>` : ""}
      <button class="btn-icon dx-del" data-del="${r.rid}" title="ลบรายการนี้" aria-label="ลบรายการนี้">${Icons.get("trash", 15)}</button>
    </div>`;
    const photoThumb = (r, kind) => {
      const photo = kind === "checkout" ? r.photoOut : r.photo;
      return photo
        ? `<img class="his-thumb" src="${photo}" alt="รูป${kind === "checkout" ? "เช็คเอาท์" : "เช็คอิน"}" data-big="${r.rid}" data-photo-kind="${kind}">`
        : `<span class="his-thumb-empty">${Icons.get("image", 18)}</span>`;
    };
    const eventLine = (r, kind, time) => `
      <div class="ts-event-line ${kind === "checkout" ? "is-checkout" : "is-checkin"}">
        <span class="badge ${kind === "checkout" ? "b-red" : "b-green"}">${kind === "checkout" ? "เช็คเอาท์" : "เช็คอิน"}</span>
        <span class="small muted">${U.fmtDate(kind === "checkout" ? r.dateOut || r.date : r.date)}</span>
        <b>${U.esc(time || "—")} น.</b>
        ${photoThumb(r, kind)}
      </div>`;

    U.$("#page-root").innerHTML = `
    <div class="card clock-card mt-2">
      <div class="clock-time" id="clock">${U.nowHM()}</div>
      <div class="clock-date">${U.fmtDateFull()}</div>
      <div class="ts-status">
        ${activeCheckout
          ? `<span class="badge b-green">${Icons.get("check-circle", 13)} กำลังทำงาน · รอเช็คเอาท์${pendingCheckouts.length > 1 ? ` อีก ${pendingCheckouts.length - 1} รายการ` : ""}</span>`
          : today.length
          ? `<span class="badge b-green">${Icons.get("check-circle", 13)} เช็คอินแล้ว ${today.length} ไซต์วันนี้</span>`
          : `<span class="badge b-gray">ยังไม่ได้เช็คอินวันนี้</span>`}
      </div>

      ${activeCheckout ? `
        <div class="ts-active-session">
          <span class="small muted">ไซต์งานที่ยังไม่เช็คเอาท์</span>
          <h2>${U.esc(activeCheckout.location)}</h2>
          <span class="ts-checkin-time"><span class="badge b-green">เช็คอิน</span> ${U.fmtDate(activeCheckout.date)} ${U.esc(activeCheckout.timeIn)} น.</span>
          <button class="btn btn-danger btn-checkin" id="ts-checkout-current">
            ${Icons.get("camera", 20)} ถ่ายรูปและเช็คเอาท์
          </button>
        </div>` : ""}
      <div class="ts-new-checkin">
        <div class="field mt-4" style="text-align:left">
          <label>${Icons.get("target", 14)} เลือกไซต์งานที่ไป *</label>
          <select class="select" id="ts-loc">
            <option value="">— เลือกไซต์งาน —</option>
            ${locs.map(l => {
              const done = today.some(t => t.location === l);
              return `<option value="${U.esc(l)}">${done ? "✓ " : ""}${U.esc(l)}</option>`;
            }).join("")}
          </select>
        </div>
        <button class="btn btn-primary btn-checkin" id="ts-checkin">
          ${Icons.get("camera", 20)} ถ่ายรูปและเช็คอิน
        </button>
        <p class="small muted mt-2">บันทึกเวลาเข้าแยกตามไซต์และกะงาน</p>
      </div>
    </div>

    ${today.length ? `
    <div class="section-title mt-4">
      <h2>${Icons.get("target", 17)} วันนี้ฉันไปแล้ว ${today.length} ไซต์</h2>
    </div>
    ${today.sort((a, b) => a.timeIn.localeCompare(b.timeIn)).map(r => `
      <div class="history-item">
        <div class="his-main">
          <div class="his-date">${U.esc(r.location)}</div>
          <div class="ts-event-list">
            ${eventLine(r, "checkin", r.timeIn)}
            ${r.timeOut
              ? `${eventLine(r, "checkout", r.timeOut)}<button class="btn btn-soft btn-sm ts-checkout-btn" data-checkout-again="${r.rid}">${Icons.get("camera", 15)} เช็คเอาท์ใหม่</button>`
              : r.rid === activeCheckout?.rid
                ? `<span class="badge b-gray">เช็คเอาท์ได้จากแผงด้านบน</span>`
                : `<button class="btn btn-outline btn-sm ts-checkout-btn" data-checkout="${r.rid}">${Icons.get("camera", 15)} เช็คเอาท์</button>`}
          </div>
        </div>
        ${rowActions(r)}
      </div>`).join("")}` : ""}

    <div class="stat-mini">
      <div class="card"><div class="v">${days}</div><div class="l">วันที่เช็คอิน (เดือนนี้)</div></div>
      <div class="card"><div class="v">${month.length}</div><div class="l">ครั้งที่เช็คอิน (เดือนนี้)</div></div>
      <div class="card"><div class="v">${sites}</div><div class="l">ไซต์ที่ไป (เดือนนี้)</div></div>
    </div>

    <div class="section-title mt-4">
      <h2>${Icons.get("calendar", 17)} ประวัติล่าสุดของฉัน</h2>
    </div>
    ${history.length ? history.map(r => `
      <div class="history-item">
        <div class="his-main">
          <div class="his-date">${U.fmtDate(r.date)}</div>
          <div class="his-meta">${U.esc(r.location)}</div>
          <div class="ts-event-list">
            ${eventLine(r, "checkin", r.timeIn)}
            ${r.timeOut
              ? `${eventLine(r, "checkout", r.timeOut)}<button class="btn btn-soft btn-sm ts-checkout-btn" data-checkout-again="${r.rid}">${Icons.get("camera", 15)} เช็คเอาท์ใหม่</button>`
              : r.date !== U.todayISO()
                ? canCheckOut(r)
                  ? `<div class="ts-pending-checkout"><span class="badge b-gray">ยังไม่เช็คเอาท์</span><button class="btn btn-outline btn-sm ts-checkout-btn" data-checkout="${r.rid}">${Icons.get("camera", 15)} เช็คเอาท์</button></div>`
                  : `<span class="badge b-gray">รายการก่อนใช้ระบบเช็คเอาท์</span>`
                : `<span class="badge b-gray">ยังไม่เช็คเอาท์</span>`}
          </div>
        </div>
        ${rowActions(r)}
      </div>`).join("")
    : `<div class="card card-pad center-empty">ยังไม่มีประวัติ — เริ่มเช็คอินวันนี้เลย</div>`}

    <div id="install-slot"></div>`;

    const checkinButton = U.$("#ts-checkin");
    if (checkinButton) checkinButton.onclick = doCheckIn;
    const checkoutButton = U.$("#ts-checkout-current");
    if (checkoutButton) checkoutButton.onclick = () => doCheckOut(activeCheckout.rid);
    U.$$("[data-big]").forEach(img => img.onclick = () => {
      const r = records.find(x => x.rid === Number(img.dataset.big));
      const photo = img.dataset.photoKind === "checkout" ? r?.photoOut : r?.photo;
      const eventTime = img.dataset.photoKind === "checkout" ? r?.timeOut : r?.timeIn;
      if (r && photo) Modal.open({
        title: `${img.dataset.photoKind === "checkout" ? "เช็คเอาท์" : "เช็คอิน"} · ${U.esc(r.location)} · ${U.fmtDate(img.dataset.photoKind === "checkout" ? r.dateOut || r.date : r.date)} ${eventTime} น.`,
        body: `<img src="${photo}" style="width:100%;border-radius:12px">`,
        foot: '<button class="btn btn-outline" data-close>ปิด</button>'
      });
    });
    U.$$ ("[data-checkout]").forEach(button => button.onclick = () => doCheckOut(button.dataset.checkout));
    U.$$ ("[data-checkout-again]").forEach(button => button.onclick = () => doCheckOut(button.dataset.checkoutAgain, true));
    U.$$ ("[data-edit-checkout]").forEach(button => button.onclick = () => editCheckout(records.find(r => String(r.rid) === button.dataset.editCheckout)));
    U.$$("[data-del]").forEach(b => b.onclick = e => {
      e.stopPropagation();
      deleteCheckin(records.find(x => x.rid === Number(b.dataset.del)));
    });

    Install.mount("#install-slot");
  }

  /* ลบเช็คอินของตัวเอง — ลบในเครื่อง + บนคลาวด์ + รูปใน Storage */
  function deleteCheckin(r) {
    if (!r) return;
    Modal.open({
      title: "ลบการเช็คอินนี้?",
      body: `
        <div class="flex items-center gap-3">
          <div class="delete-checkin-photos">
            ${r.photo ? `<img src="${r.photo}" alt="รูปเช็คอิน">` : ""}
            ${r.photoOut ? `<img src="${r.photoOut}" alt="รูปเช็คเอาท์">` : ""}
          </div>
          <div class="min-w-0">
            <b>${U.esc(r.location)}</b><br>
            <span class="small muted">${U.fmtDate(r.date)} · เข้า ${r.timeIn} น.${r.timeOut ? ` · ออก ${U.fmtDate(r.dateOut || r.date)} ${r.timeOut} น.` : " · ยังไม่เช็คเอาท์"}</span>
          </div>
        </div>
        <p class="small mt-3" style="color:var(--red-600)">ลบแล้วไม่สามารถย้อนกลับได้ (รวมข้อมูลและรูปเช็คอิน/เช็คเอาท์)</p>`,
      foot: `<button class="btn btn-outline" data-close>ยกเลิก</button>
             <button class="btn btn-danger" id="del-yes">${Icons.get("trash", 15)} ลบ</button>`
    });
    U.$("#del-yes").onclick = async () => {
      records = records.filter(x => Number(x.rid) !== Number(r.rid));
      save(); Modal.close(); render();
      Toast.show("ลบการเช็คอินแล้ว", "success");
      if (API.enabled()) {
        API.deleteAttendance(r.rid, r.photo, r.photoOut).catch(e =>
          Toast.show("ลบบนคลาวด์ไม่สำเร็จ: " + e.message, "error", 5000));
      }
    };
  }

  function editCheckout(record) {
    if (!record || !record.timeOut) return;
    Modal.open({
      title: "แก้ไขเวลาเช็คเอาท์",
      body: `
        <p class="small muted mt-2">${U.esc(record.location)} · ${U.esc(record.name || me.name)}</p>
        <div class="form-2col">
          <div class="field"><label for="edit-checkout-date">วันที่เช็คเอาท์</label>
            <input class="input" type="date" id="edit-checkout-date" value="${U.esc(record.dateOut || record.date)}"></div>
          <div class="field"><label for="edit-checkout-time">เวลาเช็คเอาท์</label>
            <input class="input" type="time" id="edit-checkout-time" value="${U.esc(record.timeOut)}"></div>
        </div>
        <p class="small muted">ถ้าแก้วันหรือเวลา รูปเดิมจะถูกลบและต้องถ่ายใหม่ เพื่อให้ข้อความบนภาพตรงกับข้อมูล</p>`,
      foot: `
        <button class="btn btn-danger" id="checkout-undo" style="margin-right:auto">ยกเลิกเช็คเอาท์</button>
        <button class="btn btn-outline" data-close>ปิด</button>
        <button class="btn btn-primary" id="checkout-edit-save">บันทึก</button>`
    });

    const saveChanges = async clearCheckout => {
      const old = { dateOut: record.dateOut, timeOut: record.timeOut, photoOut: record.photoOut };
      const dateOut = U.$("#edit-checkout-date").value;
      const timeOut = U.$("#edit-checkout-time").value;
      if (!clearCheckout && (!dateOut || !timeOut)) {
        Toast.show("กรุณาระบุวันที่และเวลาเช็คเอาท์", "error");
        return;
      }
      const changed = clearCheckout || dateOut !== (record.dateOut || record.date) || timeOut !== record.timeOut;
      if (clearCheckout) {
        delete record.dateOut;
        delete record.timeOut;
        delete record.photoOut;
      } else {
        record.dateOut = dateOut;
        record.timeOut = timeOut;
        if (changed) delete record.photoOut;
      }
      save();

      const cloudEnabled = API.enabled();
      if (cloudEnabled && !await API.flush()) {
        for (const key of ["dateOut", "timeOut", "photoOut"])
          old[key] === undefined ? delete record[key] : record[key] = old[key];
        save();
        await API.flush();
        render();
        Toast.show("บันทึกไม่สำเร็จ ข้อมูลเดิมยังอยู่", "error");
        return;
      }

      Modal.close();
      render();
      if (changed && old.photoOut && cloudEnabled) {
        try { await API.deleteUploadedPhoto(old.photoOut); }
        catch (error) {
          console.warn("[TLH] ลบรูปเช็คเอาท์เดิมไม่สำเร็จ:", error.message);
          Toast.show("แก้ข้อมูลแล้ว แต่ลบรูปเดิมไม่สำเร็จ", "error");
          return;
        }
      }
      Toast.show(clearCheckout ? "ยกเลิกเช็คเอาท์แล้ว ถ่ายใหม่ได้" :
        changed ? "แก้เวลาแล้ว กรุณาถ่ายรูปเช็คเอาท์ใหม่" : "ข้อมูลเช็คเอาท์ถูกต้องแล้ว", "success");
    };

    U.$("#checkout-edit-save").onclick = () => saveChanges(false);
    U.$("#checkout-undo").onclick = () => saveChanges(true);
  }

  function doCheckOut(rid, redo = false) {
    const record = records.find(item => String(item.rid) === String(rid));
    if (!record || (!redo && record.timeOut) || (!redo && String(record.date || "") < U.addDays(U.todayISO(), -1))) return;
    Camera.open({
      title: `${redo ? "เช็คเอาท์ใหม่" : "เช็คเอาท์"} · ${record.location}`,
      guidance: [
        "ห้ามเช็คอินแทนผู้อื่นด้วยบัญชีของตนเอง",
        "ถ่ายให้เห็นใบหน้าชัดเจนเพื่อยืนยันตัวตน",
        "ถ่ายให้เห็นไซต์งานเพื่อยืนยันสถานที่"
      ],
      onCapture: async photo => {
        const checkoutDate = U.todayISO();
        const checkoutTime = U.nowHM();
        let watermarkedPhoto;
        try {
          watermarkedPhoto = await U.watermarkPhoto(photo, {
            event: "เช็คเอาท์", date: checkoutDate, time: checkoutTime, location: record.location
          });
        } catch (error) {
          Toast.show(error.message || "ประทับข้อมูลลงรูปไม่สำเร็จ", "error");
          return;
        }

        const cloudEnabled = API.enabled();
        const old = { dateOut: record.dateOut, timeOut: record.timeOut, photoOut: record.photoOut };
        let photoOut = watermarkedPhoto;
        if (cloudEnabled) {
          Toast.show("กำลังบันทึกรูปเช็คเอาท์…", "info", 6000);
          try {
            photoOut = await API.uploadPhoto(watermarkedPhoto,
              "checkout_" + me.empId + "_" + record.rid + "_" + Date.now() + ".jpg");
          } catch (_) {
            Toast.show("อัปโหลดรูปเช็คเอาท์ไม่สำเร็จ ยังไม่ได้บันทึกเวลาออก", "error");
            return;
          }
        }

        record.dateOut = checkoutDate;
        record.timeOut = checkoutTime;
        record.photoOut = photoOut;
        save();
        if (cloudEnabled && !await API.flush()) {
          for (const key of ["dateOut", "timeOut", "photoOut"])
            old[key] === undefined ? delete record[key] : record[key] = old[key];
          save();
          await API.flush();
          if (photoOut !== watermarkedPhoto) await API.deleteUploadedPhoto(photoOut).catch(() => {});
          render();
          Toast.show("บันทึกเช็คเอาท์ไม่สำเร็จ ลองอีกครั้ง", "error");
          return;
        }
        if (cloudEnabled && old.photoOut && old.photoOut !== photoOut)
          await API.deleteUploadedPhoto(old.photoOut).catch(error =>
            console.warn("[TLH] ลบรูปเช็คเอาท์เดิมไม่สำเร็จ:", error.message));
        render();
        Toast.show(redo ? "บันทึกเช็คเอาท์ใหม่แล้ว" : "เช็คเอาท์เรียบร้อย", "success");
      }
    });
  }

  function doCheckIn() {
    const checkoutWindowStart = U.addDays(U.todayISO(), -1);
    if (myRecords().some(record => !record.timeOut && String(record.date || "") >= checkoutWindowStart)) {
      Toast.show("กรุณาถ่ายรูปและเช็คเอาท์ไซต์ก่อนเริ่มเช็คอินใหม่", "error");
      return;
    }
    const loc = U.$("#ts-loc").value;
    if (!loc) { Toast.show("กรุณาเลือกไซต์งานก่อน", "error"); return; }
    Camera.open({
      guidance: [
        "ห้ามเช็คอินแทนผู้อื่นด้วยบัญชีของตนเอง",
        "ถ่ายให้เห็นใบหน้าชัดเจนเพื่อยืนยันตัวตน",
        "ถ่ายให้เห็นไซต์งานเพื่อยืนยันสถานที่"
      ],
      onCapture: async photo => {
        const checkinDate = U.todayISO();
        const checkinTime = U.nowHM();
        let watermarkedPhoto;
        try {
          watermarkedPhoto = await U.watermarkPhoto(photo, {
            event: "เช็คอิน", date: checkinDate, time: checkinTime, location: loc
          });
        } catch (error) {
          Toast.show(error.message || "ประทับข้อมูลลงรูปไม่สำเร็จ", "error");
          return;
        }
        let photoVal = watermarkedPhoto;
        if (API.enabled()) {
          Toast.show("⏳ กำลังบันทึกการเช็คอิน…", "info", 6000);
          try {
            photoVal = await API.uploadPhoto(watermarkedPhoto, "checkin_" + me.empId + "_" + Date.now() + ".jpg");
          } catch (err) {
            photoVal = null;
            Toast.show("อัปโหลดรูปไม่สำเร็จ — เช็คอินโดยไม่มีรูปชั่วคราว", "error");
          }
        }
        records.push({
          rid: Date.now(), empId: me.empId, name: me.name,
          date: checkinDate, timeIn: checkinTime,
          location: loc, photo: photoVal
        });
        save(); render();
        API.flush();
        Toast.show("เช็คอินที่ " + loc + " 📸", "success");
      }
    });
  }

  setInterval(() => {
    const c = U.$("#clock");
    if (c) c.textContent = U.nowHM();
  }, 1000);

  render();
  API.onCloud(() => {
    records = U.store(KEY) || [];
    const avatar = U.$("#user-topbar .avatar");
    if (avatar) avatar.outerHTML = U.avatar(me.empId);
    render();
  });
})();