(function () {
  "use strict";
  var C = window.TKB_CONFIG, G = window.TKBGrid, esc = G.esc;
  var $ = function (id) { return document.getElementById(id); };
  var TABS = ["lop", "hs", "gv", "chung"];
  var state = { versions: [], data: null, curId: null, tab: "lop", sel: { lop: "", hs: "", gv: "" }, chung: { khoi: "", buoi: "S", thu: "" }, cache: {}, showAll: false };

  function norm(s) {
    return String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase().replace(/\s+/g, " ").trim();
  }
  function vnDate(iso) { var p = String(iso).split("-"); return p[2] + "/" + p[1] + "/" + p[0]; }
  function cmp(a, b) { return a.localeCompare(b, "vi", { numeric: true, sensitivity: "base" }); }
  function byGivenName(a, b) {
    var x = a.split(/[\s.]/).pop(), y = b.split(/[\s.]/).pop();
    return cmp(x, y) || cmp(a, b);
  }
  function todayCode() { var d = new Date().getDay(); return d === 0 ? 8 : d + 1; }
  function todayISO() {
    var d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 10);
  }
  // Phiên bản đang có hiệu lực hôm nay
  function effectiveId() {
    var t = todayISO();
    for (var i = 0; i < state.versions.length; i++) if (state.versions[i].date <= t) return state.versions[i].id;
    return state.versions.length ? state.versions[state.versions.length - 1].id : null;
  }

  /* ---------- Khởi tạo ---------- */
  function applyConfig() {
    $("schoolName").textContent = C.schoolName;
    $("subtitle").textContent = C.subtitle;
    $("footNote").textContent = C.contactNote;
    var logo = $("logo");
    logo.onerror = function () { logo.onerror = null; logo.src = C.logoFallback; };
    logo.src = C.logo;
  }

  function counter() {
    if (!C.counter || !C.counter.enabled) return;
    var base = "https://api.counterapi.dev/v1/" + encodeURIComponent(C.counter.namespace) + "/" + encodeURIComponent(C.counter.key);
    var counted = false;
    try { counted = sessionStorage.getItem("tkb-counted") === "1"; } catch (e) {}
    fetch(counted ? base + "/" : base + "/up")
      .then(function (r) { return r.ok ? r.json() : Promise.reject(); })
      .then(function (j) {
        if (typeof j.count !== "number") return;
        $("counterNum").textContent = j.count.toLocaleString("vi-VN");
        $("counter").hidden = false;
        try { sessionStorage.setItem("tkb-counted", "1"); } catch (e) {}
      })
      .catch(function () { /* dịch vụ đếm lỗi: ẩn bộ đếm */ });
  }

  function loadVersions() {
    return fetch(C.dataPath + "versions.json?t=" + Date.now())
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (j) {
        state.versions = (j.versions || []).filter(function (v) { return !v.hidden; })
          .sort(function (a, b) { return b.id - a.id; });
      });
  }

  function loadVersion(id) {
    var v = state.versions.filter(function (x) { return x.id === id; })[0];
    if (!v) return Promise.reject(new Error("Không có phiên bản " + id));
    if (state.cache[id]) return Promise.resolve(state.cache[id]);
    return fetch(C.dataPath + v.file + "?v=" + encodeURIComponent(v.published || v.date))
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (d) {
        d.teacherList = Object.keys(d.teachers || {}).sort(byGivenName);
        var subj = {};
        d.slots.forEach(function (s) { if (s[5]) { var m = subj[s[5]] = subj[s[5]] || {}; m[s[4]] = (m[s[4]] || 0) + 1; } });
        d.teacherSubjects = {};
        Object.keys(subj).forEach(function (t) {
          d.teacherSubjects[t] = Object.keys(subj[t]).sort(function (a, b) { return subj[t][b] - subj[t][a]; }).slice(0, 3);
        });
        d.homeroom = d.homeroom || {};
        d.studentIdx = (d.students || []).map(function (s) { return { id: s[0], name: s[1], cls: s[2], groups: s[3] || [], key: norm(s[1]) + " " + norm(s[0]) }; });
        state.cache[id] = d;
        return d;
      });
  }

  /* ---------- Phiên bản ---------- */
  function renderVersions() {
    var nav = $("versions"), vs = state.versions, limit = state.showAll ? vs.length : 4;
    nav.innerHTML = vs.slice(0, limit).map(function (v, i) {
      return '<button class="ver" data-id="' + v.id + '" aria-pressed="' + (v.id === state.curId) + '">' +
        "TKB " + v.id + (i === 0 ? ' <span class="ver__new">- Mới</span>' : "") + " · " + vnDate(v.date) + "</button>";
    }).join("") + (vs.length > 4 ? '<button class="ver ver--more" id="verMore">' +
      (state.showAll ? "Thu gọn" : "Phiên bản cũ hơn (" + (vs.length - 4) + ")") + "</button>" : "");
  }

  function selectVersion(id) {
    state.curId = id;
    renderVersions();
    $("result").innerHTML = '<div class="empty">Đang tải thời khóa biểu…</div>';
    return loadVersion(id).then(function (d) {
      state.data = d;
      fillSelectors();
      render();
    }).catch(function () {
      $("result").innerHTML = '<div class="empty">Không tải được dữ liệu TKB ' + id + '. Kiểm tra kết nối mạng rồi tải lại trang.</div>';
    });
  }

  /* ---------- Ô chọn ---------- */
  function fillSelectors() {
    var d = state.data;
    var groups = {};
    d.classes.forEach(function (c) {
      var k = (String(c).match(/^\d+/) || ["Khác"])[0];
      (groups[k] = groups[k] || []).push(c);
    });
    $("selLop").innerHTML = '<option value="">— Chọn lớp —</option>' + Object.keys(groups).sort(cmp).map(function (k) {
      return '<optgroup label="' + (k === "Khác" ? "Khác" : "Khối " + k) + '">' + groups[k].map(function (c) {
        return '<option value="' + esc(c) + '">' + esc(c) + "</option>";
      }).join("") + "</optgroup>";
    }).join("");
    $("selLop").value = d.classes.indexOf(state.sel.lop) >= 0 ? state.sel.lop : "";

    var hasGroups = d.teacherList.some(function (t) { return d.teachers[t]; });
    var html = '<option value="">— Chọn giáo viên —</option>';
    if (hasGroups) {
      var tg = {};
      d.teacherList.forEach(function (t) { var g = d.teachers[t] || "Khác"; (tg[g] = tg[g] || []).push(t); });
      html += Object.keys(tg).sort(cmp).map(function (g) {
        return '<optgroup label="Tổ ' + esc(g) + '">' + tg[g].map(function (t) {
          return '<option value="' + esc(t) + '">' + esc(t) + "</option>";
        }).join("") + "</optgroup>";
      }).join("");
    } else {
      html += d.teacherList.map(function (t) {
        var sj = (d.teacherSubjects[t] || []).map(function (x) { return (C.subjectNames || {})[x] || x; }).join(", ");
        return '<option value="' + esc(t) + '">' + esc(t) + (sj ? " – " + esc(sj) : "") + "</option>";
      }).join("");
    }
    $("selGv").innerHTML = html;
    $("selGv").value = d.teacherList.indexOf(state.sel.gv) >= 0 ? state.sel.gv : "";

    var st = findStudent(state.sel.hs);
    $("inpHs").value = st ? st.name : "";
    var noHs = !d.studentIdx.length;
    $("tab-hs").hidden = noHs;
    fillChung();
    if (noHs && state.tab === "hs") setTab("lop");
  }
  function findStudent(id) {
    if (!id || !state.data) return null;
    return state.data.studentIdx.filter(function (s) { return s.id === id; })[0] || null;
  }

  /* ---------- Tìm học sinh ---------- */
  var active = -1, matches = [];
  function suggest() {
    var q = norm($("inpHs").value), list = $("hsList");
    if (q.length < 2) { closeSuggest(); return; }
    matches = state.data.studentIdx.filter(function (s) { return s.key.indexOf(q) >= 0; }).slice(0, 30);
    active = matches.length ? 0 : -1;
    list.innerHTML = matches.length ? matches.map(function (s, i) {
      return '<li role="option" id="hs-opt-' + i + '" data-i="' + i + '" aria-selected="' + (i === active) + '"><span>' +
        esc(s.name) + '</span><span class="s-cls">Lớp ' + esc(s.cls) + "</span></li>";
    }).join("") : '<li class="s-none">Không tìm thấy học sinh phù hợp. Thử gõ tên không dấu hoặc mã học sinh.</li>';
    list.hidden = false;
    $("inpHs").setAttribute("aria-expanded", "true");
  }
  function closeSuggest() { $("hsList").hidden = true; $("inpHs").setAttribute("aria-expanded", "false"); }
  function highlight() {
    [].forEach.call($("hsList").querySelectorAll("[data-i]"), function (li) {
      var on = +li.dataset.i === active;
      li.setAttribute("aria-selected", on);
      if (on) li.scrollIntoView({ block: "nearest" });
    });
  }
  function pickStudent(i) {
    var s = matches[i]; if (!s) return;
    state.sel.hs = s.id; $("inpHs").value = s.name; closeSuggest(); render();
  }

  /* ---------- Hiển thị ---------- */
  function setTab(tab) {
    state.tab = tab;
    TABS.forEach(function (t) {
      $("tab-" + t).setAttribute("aria-selected", t === tab);
      $("tab-" + t).tabIndex = t === tab ? 0 : -1;
      $("field-" + t).hidden = t !== tab;
    });
    render();
  }

  function updateURL() {
    var p = new URLSearchParams();
    if (state.curId != null) p.set("tkb", state.curId);
    if (state.tab === "chung") {
      p.set("xem", "chung");
      if (state.chung.khoi) p.set("khoi", state.chung.khoi);
      p.set("buoi", state.chung.buoi === "C" ? "chieu" : "sang");
      if (state.chung.thu) p.set("thu", state.chung.thu);
    } else {
      var v = state.sel[state.tab];
      if (v) p.set(state.tab, v);
    }
    history.replaceState(null, "", location.pathname + "?" + p.toString());
  }

  function render() {
    var d = state.data, box = $("result"), tab = state.tab, val = state.sel[tab];
    updateURL();
    $("btnPrint").disabled = $("btnShare").disabled = true;
    if (!d) return;
    if (tab === "chung") { renderChung(); return; }
    if (!val) { box.innerHTML = '<div class="empty">Chọn một lớp, học sinh hoặc giáo viên ở trên để xem thời khóa biểu.</div>'; return; }

    var slots, title, meta = "", summary = "", mode = "class", missing = false;
    if (tab === "lop") {
      missing = d.classes.indexOf(val) < 0;
      slots = d.slots.filter(function (s) { return s[0] === val; });
      title = "Lớp " + val;
      var hr = d.homeroom[val];
      if (hr) meta = '<span class="hr">GVCN: <b>' + esc((hr[0] ? hr[0] + " " : "") + hr[1]) + "</b></span> · ";
    } else if (tab === "hs") {
      var st = findStudent(val);
      missing = !st;
      if (st) {
        slots = d.slots.filter(function (s) {
          return s[0] === st.cls && (!s[7] || !st.groups.length || st.groups.indexOf(s[7]) >= 0);
        });
        title = st.name;
        var hr2 = d.homeroom[st.cls];
        meta = "Lớp <b>" + esc(st.cls) + "</b>" + (hr2 ? ", GVCN " + esc((hr2[0] ? hr2[0] + " " : "") + hr2[1]) : "") + " · ";
      }
    } else {
      missing = d.teacherList.indexOf(val) < 0;
      mode = "teacher";
      slots = d.slots.filter(function (s) { return s[5] === val; });
      title = "GV " + val;
      if (d.teachers[val]) meta = "Tổ <b>" + esc(d.teachers[val]) + "</b> · ";
      var uniq = {}, cls = {}, byS = { S: 0, C: 0 };
      slots.forEach(function (s) { var k = s[1] + s[2] + s[3]; if (!uniq[k]) { uniq[k] = 1; byS[s[2]]++; } cls[s[0]] = 1; });
      var chu = Object.keys(d.homeroom).filter(function (c) { return d.homeroom[c][1] === val; });
      if (chu.length) meta += "Chủ nhiệm lớp <b>" + chu.map(esc).join(", ") + "</b> · ";
      summary = '<p class="summary">Tổng <b>' + Object.keys(uniq).length + " tiết/tuần</b> (sáng " + byS.S +
        ", chiều " + byS.C + "). Dạy các lớp: " + Object.keys(cls).sort(cmp).map(esc).join(", ") + ".</p>";
    }

    var v = state.versions.filter(function (x) { return x.id === state.curId; })[0];
    if (missing) {
      var latest = state.versions[0];
      box.innerHTML = '<div class="empty">TKB ' + state.curId + " không có dữ liệu cho lựa chọn này." +
        (latest && latest.id !== state.curId ? '<br><button class="btn" id="goLatest">Xem TKB ' + latest.id + " mới nhất</button>" : "") + "</div>";
      return;
    }

    var today = state.curId === effectiveId() ? todayCode() : 0;
    var hasMajor = slots.some(function (s) { return /chuy[eê]n/i.test(s[4]); });
    var hasEvent = slots.some(function (s) { return /ch[aà]o c[oờ]|^SHL|sinh ho[aạ]t/i.test(s[4]); });
    var cellSubj = {}, hasGroup = false;
    if (mode !== "teacher") slots.forEach(function (s) {
      var k = s[1] + s[2] + s[3]; cellSubj[k] = cellSubj[k] || {}; cellSubj[k][s[4]] = 1;
      if (Object.keys(cellSubj[k]).length > 1) hasGroup = true;
    });
    var future = v && v.date > todayISO();

    box.innerHTML =
      '<div class="print-head"><img src="' + esc($("logo").src) + '" alt=""><div><b>' + esc(C.schoolName) +
      "</b>Thời khóa biểu " + esc(title) + " – TKB " + state.curId + ", áp dụng từ " + (v ? vnDate(v.date) : "") + "</div></div>" +
      '<div class="result__head"><h2 class="result__title">' + esc(title) + '</h2><span class="result__meta">' + meta +
      "TKB " + state.curId + ", áp dụng từ <b>" + (v ? vnDate(v.date) : "") + "</b></span></div>" +
      (future ? '<p class="notice">Thời khóa biểu này bắt đầu áp dụng từ ' + vnDate(v.date) + ". Tuần này vẫn học theo TKB trước đó.</p>" : "") +
      (slots.length ? G.render(d.slots, slots, mode, today) : '<div class="empty">Chưa có tiết học nào trong TKB này.</div>') +
      ((hasMajor || hasEvent || hasGroup) ? '<div class="legend">' + (hasMajor ? '<span class="l-major">Tiết môn chuyên</span>' : "") +
        (hasGroup ? '<span class="l-group">Học theo nhóm / môn lựa chọn (mỗi học sinh học một môn)</span>' : "") +
        (hasEvent ? '<span class="l-event">Chào cờ, sinh hoạt lớp</span>' : "") + "</div>" : "") + summary;

    $("btnPrint").disabled = $("btnShare").disabled = false;
    document.title = title + " – Thời khóa biểu";
  }

  /* ---------- TKB chung ---------- */
  function khoiOf(c) { return (String(c).match(/^\d+/) || ["Khác"])[0]; }
  function fillChung() {
    var d = state.data, ks = {}, days = {};
    d.classes.forEach(function (c) { ks[khoiOf(c)] = 1; });
    d.slots.forEach(function (s) { days[s[1]] = 1; });
    $("selKhoi").innerHTML = '<option value="">Tất cả</option>' + Object.keys(ks).sort(cmp).map(function (k) {
      return '<option value="' + esc(k) + '">' + (k === "Khác" ? "Khác" : "Khối " + esc(k)) + "</option>";
    }).join("");
    if (!ks[state.chung.khoi]) state.chung.khoi = "";
    $("selKhoi").value = state.chung.khoi;
    $("selThu").innerHTML = '<option value="">Cả tuần</option>' + Object.keys(days).map(Number).sort().map(function (x) {
      return '<option value="' + x + '">' + G.DAY_NAMES[x] + "</option>";
    }).join("");
    if (!days[state.chung.thu]) state.chung.thu = "";
    $("selThu").value = state.chung.thu;
    $("selBuoi").value = state.chung.buoi;
  }
  function renderChung() {
    var d = state.data, box = $("result"), c = state.chung;
    var classes = d.classes.filter(function (x) { return !c.khoi || khoiOf(x) === c.khoi; });
    var today = state.curId === effectiveId() ? todayCode() : 0;
    var v = state.versions.filter(function (x) { return x.id === state.curId; })[0];
    var table = G.renderAll(d.slots, classes, c.buoi, +c.thu || 0, today, d.homeroom);
    var title = "Thời khóa biểu chung – Buổi " + (c.buoi === "C" ? "chiều" : "sáng") +
      (c.khoi ? ", khối " + c.khoi : "") + (c.thu ? ", " + G.DAY_NAMES[c.thu] : "");
    box.innerHTML =
      '<div class="print-head"><img src="' + esc($("logo").src) + '" alt=""><div><b>' + esc(C.schoolName) +
      "</b>" + esc(title) + " – TKB " + state.curId + ", áp dụng từ " + (v ? vnDate(v.date) : "") + "</div></div>" +
      '<div class="result__head"><h2 class="result__title">' + esc(title) + '</h2><span class="result__meta">' +
      classes.length + " lớp · TKB " + state.curId + ", áp dụng từ <b>" + (v ? vnDate(v.date) : "") + "</b></span></div>" +
      (table ? table + '<div class="legend legend--all"><span class="l-group">Học theo nhóm / môn lựa chọn</span>' +
        '<span class="l-event">Chào cờ, sinh hoạt lớp</span><span>Kéo ngang để xem thêm lớp</span></div>'
        : '<div class="empty">Không có tiết học nào với lựa chọn này.</div>');
    $("btnPrint").disabled = $("btnShare").disabled = !table;
    document.title = title;
  }

  /* ---------- Sự kiện ---------- */
  function bind() {
    $("versions").addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b) return;
      if (b.id === "verMore") { state.showAll = !state.showAll; renderVersions(); return; }
      selectVersion(+b.dataset.id);
    });
    document.querySelector(".tabs").addEventListener("click", function (e) {
      var b = e.target.closest(".tab"); if (b) setTab(b.dataset.tab);
    });
    document.querySelector(".tabs").addEventListener("keydown", function (e) {
      var tabs = TABS.filter(function (t) { return !$("tab-" + t).hidden; }), i = tabs.indexOf(state.tab), n = tabs.length;
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        i = (i + (e.key === "ArrowRight" ? 1 : n - 1)) % n; setTab(tabs[i]); $("tab-" + tabs[i]).focus();
      }
    });
    $("selLop").addEventListener("change", function () { state.sel.lop = this.value; render(); });
    $("selGv").addEventListener("change", function () { state.sel.gv = this.value; render(); });
    $("selKhoi").addEventListener("change", function () { state.chung.khoi = this.value; render(); });
    $("selBuoi").addEventListener("change", function () { state.chung.buoi = this.value; render(); });
    $("selThu").addEventListener("change", function () { state.chung.thu = this.value; render(); });
    $("inpHs").addEventListener("input", suggest);
    $("inpHs").addEventListener("focus", suggest);
    $("inpHs").addEventListener("keydown", function (e) {
      if ($("hsList").hidden) return;
      if (e.key === "ArrowDown") { e.preventDefault(); active = Math.min(active + 1, matches.length - 1); highlight(); }
      else if (e.key === "ArrowUp") { e.preventDefault(); active = Math.max(active - 1, 0); highlight(); }
      else if (e.key === "Enter") { e.preventDefault(); pickStudent(active); }
      else if (e.key === "Escape") closeSuggest();
    });
    $("hsList").addEventListener("mousedown", function (e) {
      var li = e.target.closest("[data-i]"); if (li) { e.preventDefault(); pickStudent(+li.dataset.i); }
    });
    $("inpHs").addEventListener("blur", function () { setTimeout(closeSuggest, 120); });
    $("btnPrint").addEventListener("click", function () { window.print(); });
    $("btnShare").addEventListener("click", function () {
      var b = this, done = function () { b.textContent = "Đã sao chép"; setTimeout(function () { b.textContent = "Sao chép link"; }, 2000); };
      if (navigator.clipboard) navigator.clipboard.writeText(location.href).then(done, function () { prompt("Sao chép liên kết:", location.href); });
      else prompt("Sao chép liên kết:", location.href);
    });
    $("result").addEventListener("click", function (e) {
      if (e.target.id === "goLatest") selectVersion(state.versions[0].id);
    });
  }

  function start() {
    applyConfig(); bind(); counter();
    var p = new URLSearchParams(location.search);
    ["lop", "hs", "gv"].forEach(function (t) { if (p.get(t)) { state.sel[t] = p.get(t); state.tab = t; } });
    if (p.get("xem") === "chung") {
      state.tab = "chung";
      state.chung = { khoi: p.get("khoi") || "", buoi: p.get("buoi") === "chieu" ? "C" : "S", thu: p.get("thu") || "" };
    }
    loadVersions().then(function () {
      if (!state.versions.length) { $("result").innerHTML = '<div class="empty">Chưa có thời khóa biểu nào được công bố.</div>'; return; }
      var want = +p.get("tkb");
      var id = state.versions.some(function (v) { return v.id === want; }) ? want : state.versions[0].id;
      if (state.versions.map(function (v) { return v.id; }).indexOf(id) >= 4) state.showAll = true;
      setTab(state.tab);
      return selectVersion(id);
    }).catch(function () {
      $("result").innerHTML = '<div class="empty">Không tải được danh sách thời khóa biểu. Nếu đang mở file trực tiếp trên máy, hãy chạy qua GitHub Pages hoặc một máy chủ web.</div>';
    });
  }
  start();
})();
