/* ═══ camera — ถ่ายเซลฟี่เท่านั้น (300×400 JPEG 60% ≈ 18KB) ═══ */
const Camera = (() => {
  let stream = null;

  function stop() {
    if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null; }
  }

  function open({ title = "ถ่ายรูปยืนยันตัวตน", onCapture, guidance = [] }) {
    Modal.open({
      title,
      body: `
        ${guidance.length ? `<div class="cam-guidance"><b>ก่อนถ่ายรูป</b><ul>${guidance.map(text => `<li>${U.esc(text)}</li>`).join("")}</ul></div>` : ""}
        <div class="cam-box">
          <video id="cam-video" autoplay playsinline muted></video>
          <div class="cam-error hidden" id="cam-error"></div>
        </div>
        <div class="cam-actions">
          <button class="btn btn-outline" data-close>ยกเลิก</button>
          <button class="cam-shutter" id="cam-shot" aria-label="ถ่ายรูป"></button>
          <span style="width:90px"></span>
        </div>`,
      foot: ""
    });
    Modal.setOnClose(stop);
    U.$("#cam-shot").onclick = shoot;

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return fail("เบราว์เซอร์นี้ไม่สามารถเปิดกล้องได้", "กรุณาลองเปิดด้วยเบราว์เซอร์อื่น");
    }
    navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
      audio: false
    })
      .then(s => { stream = s; const v = U.$("#cam-video"); if (v) v.srcObject = s; })
      .catch(error => {
        if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError")
          return fail("ยังไม่ได้อนุญาตให้ใช้กล้อง", "เปิดการตั้งค่าเว็บไซต์ เลือก กล้อง > อนุญาต แล้วลองใหม่");
        fail("เปิดกล้องไม่สำเร็จ", "กรุณาให้สิทธิ์การใช้กล้อง แล้วลองอีกครั้ง");
      });

    function fail(msg, hint) {
      const e = U.$("#cam-error");
      if (!e) return;
      e.innerHTML = `${U.esc(msg)}${hint ? `<br><small>${U.esc(hint)}</small>` : ""}`;
      e.classList.remove("hidden");
      const b = U.$("#cam-shot"); if (b) b.disabled = true;
    }

    function shoot() {
      const v = U.$("#cam-video");
      if (!v || !v.videoWidth) return;
      const W = 300, H = 400;
      const c = document.createElement("canvas");
      c.width = W; c.height = H;
      const ctx = c.getContext("2d");
      const sv = Math.min(v.videoWidth / W, v.videoHeight / H);
      const sx = (v.videoWidth - W * sv) / 2, sy = (v.videoHeight - H * sv) / 2;
      ctx.setTransform(-1, 0, 0, 1, W, 0);
      ctx.drawImage(v, sx, sy, W * sv, H * sv, 0, 0, W, H);
      const data = c.toDataURL("image/jpeg", 0.6);
      stop();
      confirmShot(data);
    }

    function confirmShot(data) {
      Modal.open({
        title: "ยืนยันรูปถ่าย",
        body: `
          <div class="cam-preview"><img src="${data}" alt="รูปที่ถ่าย"></div>
          <p class="small muted" style="text-align:center;margin-top:10px">ใช้รูปนี้ยืนยันหรือไม่?</p>`,
        foot: `
          <button class="btn btn-outline" id="cam-retake">${Icons.get("x", 15)} ถ่ายใหม่</button>
          <button class="btn btn-primary" id="cam-use">${Icons.get("check-circle", 16)} ใช้รูปนี้</button>`
      });
      Modal.setOnClose(stop);
      U.$("#cam-retake").onclick = () => { Modal.close(); open({ title, onCapture, guidance }); };
      U.$("#cam-use").onclick = () => { Modal.close(); onCapture(data); };
    }
  }

  return { open, stop };
})();
window.Camera = Camera;