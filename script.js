(function () {
  "use strict";

  /* ---------- Storage helpers ---------- */
  var DON_KEY = "ffds_donations";
  var REQ_KEY = "ffds_requests";
  var SESSION_KEY = "ffds_session";

  function load(key) {
    try { return JSON.parse(localStorage.getItem(key)) || []; }
    catch (e) { return []; }
  }
  function save(key, val) { localStorage.setItem(key, JSON.stringify(val)); }
  function getDonations() { return load(DON_KEY); }
  function setDonations(arr) { save(DON_KEY, arr); }
  function getRequests() { return load(REQ_KEY); }
  function setRequests(arr) { save(REQ_KEY, arr); }
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

  function getCurrentUser() {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY)); }
    catch (e) { return null; }
  }

  /* ---------- Item types & categories ---------- */
  var TYPE_ICONS = { Food: "🍽️", Books: "📚", Clothes: "👕", Electronics: "🔌", Other: "🎁" };
  var DONATION_CATEGORIES = {
    Food: ["Cooked Meal", "Grains and Staples", "Vegetables and Fruits", "Packaged Food", "Bakery", "Beverages", "Other"],
    Books: ["Textbooks", "Story Books", "Comics", "Educational", "Religious", "Magazines", "Other"],
    Clothes: ["Men", "Women", "Kids", "Winter Wear", "Footwear", "Uniforms", "Other"],
    Electronics: ["Mobile", "Laptop", "Tablet", "TV", "Kitchen Appliance", "Accessories", "Other"],
    Other: ["Furniture", "Toys", "Household", "Medical", "Stationery", "Other"]
  };

  window.updateDonationCategories = function () {
    var typeSel = document.getElementById("donateItemType");
    var catSel = document.getElementById("donateCategory");
    if (!typeSel || !catSel) return;
    var type = typeSel.value || "Food";
    var cats = DONATION_CATEGORIES[type] || ["Other"];
    catSel.innerHTML = cats.map(function (c) {
      return '<option value="' + c + '">' + c + "</option>";
    }).join("");
  };

  /* ---------- Seed sample data on first visit ---------- */
  function seed() {
    if (!localStorage.getItem(DON_KEY)) {
      setDonations([
        { id: uid(), itemType: "Food", donorName: "Sunrise Bakery", donorContact: "555-0101", foodName: "Bread & buns", quantity: "Serves 30", location: "Downtown, Food City", expiry: "", category: "Bakery", condition: "", description: "Fresh from this morning, untouched.", status: "available", createdAt: Date.now() - 3600000 },
        { id: uid(), itemType: "Food", donorName: "Anita Sharma", donorContact: "555-0102", foodName: "Veg biryani", quantity: "Serves 15", location: "Sector 12, Food City", expiry: "", category: "Cooked Meal", condition: "", description: "Cooked for an event, leftovers sealed.", status: "available", createdAt: Date.now() - 7200000 },
        { id: uid(), itemType: "Books", donorName: "City Library", donorContact: "555-0103", foodName: "Children's story books", quantity: "50 books", location: "Central Library, Food City", expiry: "", category: "Story Books", condition: "Good", description: "Leftovers from a reading drive.", status: "available", createdAt: Date.now() - 10800000 },
        { id: uid(), itemType: "Clothes", donorName: "Meera Singh", donorContact: "555-0104", foodName: "Winter jackets", quantity: "12 jackets", location: "Hill Road, Food City", expiry: "", category: "Winter Wear", condition: "Like New", description: "Kids sizes, washed and packed.", status: "available", createdAt: Date.now() - 14400000 }
      ]);
    }
    if (!localStorage.getItem(REQ_KEY)) {
      setRequests([
        { id: uid(), receiverName: "Ravi Kumar", receiverContact: "555-0201", foodNeeded: "Meals for a family of 5", peopleCount: 5, location: "Old Town, Food City", urgency: "High", description: "Lost work this week, any help appreciated.", status: "open", createdAt: Date.now() - 1800000 }
      ]);
    }
  }

  /* ---------- DOM helpers ---------- */
  function $(sel) { return document.querySelector(sel); }
  function el(tag, attrs, html) {
    var n = document.createElement(tag);
    if (attrs) { for (var k in attrs) { n.setAttribute(k, attrs[k]); } }
    if (html != null) { n.innerHTML = html; }
    return n;
  }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function timeAgo(ts) {
    var d = Math.floor((Date.now() - ts) / 1000);
    if (d < 60) return "just now";
    if (d < 3600) return Math.floor(d / 60) + " min ago";
    if (d < 86400) return Math.floor(d / 3600) + " hr ago";
    return Math.floor(d / 86400) + " day ago";
  }

  /* ---------- Navigation ---------- */
  function initNav() {
    var toggle = $("#navToggle");
    var nav = $("#mainNav");

    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.classList.toggle("open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });

    Array.prototype.forEach.call(nav.querySelectorAll(".nav-link"), function (link) {
      link.addEventListener("click", function () {
        nav.classList.remove("open");
        toggle.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });

    var header = $("#siteHeader");
    window.addEventListener("scroll", function () {
      header.classList.toggle("scrolled", window.scrollY > 8);
    });

    var links = Array.prototype.slice.call(nav.querySelectorAll(".nav-link"));
    var sections = links.map(function (l) { return document.querySelector(l.getAttribute("href")); }).filter(Boolean);
    window.addEventListener("scroll", function () {
      var pos = window.scrollY + 90;
      var current = sections[0];
      for (var i = 0; i < sections.length; i++) {
        if (sections[i].offsetTop <= pos) current = sections[i];
      }
      links.forEach(function (l) {
        l.classList.toggle("active", l.getAttribute("href") === "#" + current.id);
      });
    });
  }

  /* ---------- Auth UI ---------- */
  function updateAuthUI() {
    var area = $("#authArea");
    if (!area) return;
    var u = getCurrentUser();
    if (u) {
      area.innerHTML =
        '<span class="user-chip">👤 ' + esc(u.name) + '</span>' +
        '<button class="btn btn-ghost btn-small" onclick="logout()">Logout</button>';
    } else {
      area.innerHTML = '<a href="login.html" class="btn btn-primary btn-small">Login</a>';
    }
  }
  window.logout = function () {
    localStorage.removeItem(SESSION_KEY);
    location.reload();
  };

  /* ---------- Modals ---------- */
  window.openModal = function (id) {
    var m = document.getElementById(id);
    if (m) { m.classList.add("active"); document.body.style.overflow = "hidden"; }
    if (id === "donateModal") { updateDonationCategories(); }
  };
  window.closeModal = function (id) {
    var m = document.getElementById(id);
    if (m) { m.classList.remove("active"); document.body.style.overflow = ""; }
  };
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") { closeModal("donateModal"); closeModal("requestModal"); }
  });

  /* ---------- Toast ---------- */
  var toastTimer;
  function toast(msg) {
    var t = $("#toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove("show"); }, 2600);
  }

  /* ---------- Stats ---------- */
  function updateStats() {
    var dons = getDonations();
    var reqs = getRequests();
    $("#statDonations").textContent = dons.length;
    $("#statRequests").textContent = reqs.length;
    $("#statFulfilled").textContent =
      dons.filter(function (d) { return d.status === "claimed"; }).length +
      reqs.filter(function (r) { return r.status === "fulfilled"; }).length;
  }

  /* ---------- Action buttons ---------- */
  function actionBtns(item, type) {
    if (type === "donation") {
      if (item.status === "available") {
        return '<button class="btn btn-ghost btn-small" onclick="claimDonation(\'' + item.id + '\')">✓ Claim</button>' +
          '<button class="btn btn-danger btn-small" onclick="deleteDonation(\'' + item.id + '\')">Delete</button>';
      }
      return '<button class="btn btn-ghost btn-small" onclick="reopenDonation(\'' + item.id + '\')">↺ Reopen</button>' +
        '<button class="btn btn-danger btn-small" onclick="deleteDonation(\'' + item.id + '\')">Delete</button>';
    } else {
      if (item.status === "open") {
        return '<button class="btn btn-ghost btn-small" onclick="fulfillRequest(\'' + item.id + '\')">✓ Fulfill</button>' +
          '<button class="btn btn-danger btn-small" onclick="deleteRequest(\'' + item.id + '\')">Delete</button>';
      }
      return '<button class="btn btn-ghost btn-small" onclick="reopenRequest(\'' + item.id + '\')">↺ Reopen</button>' +
        '<button class="btn btn-danger btn-small" onclick="deleteRequest(\'' + item.id + '\')">Delete</button>';
    }
  }

  /* ---------- Render donations ---------- */
  window.renderDonations = function () {
    var list = getDonations();
    var q = ($("#donationSearch").value || "").toLowerCase();
    var typeFilter = ($("#donationTypeFilter") ? $("#donationTypeFilter").value : "all");
    var filter = $("#donationFilter").value;
    var filtered = list.filter(function (d) {
      var dtype = d.itemType || "Food";
      var matchQ = !q || (d.foodName + " " + d.location + " " + d.donorName + " " + d.category + " " + dtype).toLowerCase().indexOf(q) !== -1;
      var matchT = typeFilter === "all" || dtype === typeFilter;
      var matchF = filter === "all" || d.status === filter;
      return matchQ && matchT && matchF;
    });
    var wrap = $("#donationList");
    wrap.innerHTML = "";
    if (!filtered.length) {
      wrap.appendChild(el("div", { class: "empty-state" },
        '<div class="big">🎁</div><h3>No donations found</h3><p>Be the first to share extra items!</p>'));
      return;
    }
    filtered.sort(function (a, b) { return b.createdAt - a.createdAt; });
    filtered.forEach(function (d) {
      var dtype = d.itemType || "Food";
      var icon = TYPE_ICONS[dtype] || "🎁";
      var card = el("div", { class: "item-card" + (d.status === "claimed" ? " claimed" : "") });
      card.innerHTML =
        '<div class="card-top"><span class="card-title">' + esc(d.foodName) + '</span>' +
        '<span class="card-cat">' + esc(d.category) + '</span></div>' +
        '<span class="badge badge-type">' + icon + ' ' + esc(dtype) + '</span>' +
        '<span class="badge ' + (d.status === "available" ? "badge-available" : "badge-claimed") + '">' +
        (d.status === "available" ? "Available" : "Claimed") + '</span>' +
        '<div class="card-meta">' +
        '<span><b>Donor:</b> ' + esc(d.donorName) + '</span>' +
        '<span><b>Contact:</b> ' + esc(d.donorContact) + '</span>' +
        '<span><b>Quantity:</b> ' + esc(d.quantity) + '</span>' +
        (d.condition ? '<span><b>Condition:</b> ' + esc(d.condition) + '</span>' : '') +
        '<span><b>Location:</b> ' + esc(d.location) + '</span>' +
        (d.expiry ? '<span><b>Best before:</b> ' + esc(d.expiry) + '</span>' : '') +
        (d.description ? '<span><b>Notes:</b> ' + esc(d.description) + '</span>' : '') +
        '<span><b>Posted:</b> ' + timeAgo(d.createdAt) + '</span>' +
        '</div><div class="card-actions">' + actionBtns(d, "donation") + '</div>';
      wrap.appendChild(card);
    });
  };

  /* ---------- Render requests ---------- */
  window.renderRequests = function () {
    var list = getRequests();
    var q = ($("#requestSearch").value || "").toLowerCase();
    var filter = $("#requestFilter").value;
    var filtered = list.filter(function (r) {
      var matchQ = !q || (r.foodNeeded + " " + r.location + " " + r.receiverName + " " + r.urgency).toLowerCase().indexOf(q) !== -1;
      var matchF = filter === "all" || r.status === filter;
      return matchQ && matchF;
    });
    var wrap = $("#requestList");
    wrap.innerHTML = "";
    if (!filtered.length) {
      wrap.appendChild(el("div", { class: "empty-state" },
        '<div class="big">🙏</div><h3>No requests found</h3><p>If you need food, send a request!</p>'));
      return;
    }
    filtered.sort(function (a, b) { return b.createdAt - a.createdAt; });
    filtered.forEach(function (r) {
      var urgClass = r.urgency === "Critical" ? " badge-critical" : "";
      var card = el("div", { class: "item-card" + (r.status === "fulfilled" ? " claimed" : "") });
      card.innerHTML =
        '<div class="card-top"><span class="card-title">' + esc(r.foodNeeded) + '</span>' +
        '<span class="badge' + urgClass + '">' + esc(r.urgency) + '</span></div>' +
        '<span class="badge ' + (r.status === "open" ? "badge-open" : "badge-fulfilled") + '">' +
        (r.status === "open" ? "Open" : "Fulfilled") + '</span>' +
        '<div class="card-meta">' +
        '<span><b>Requester:</b> ' + esc(r.receiverName) + '</span>' +
        '<span><b>Contact:</b> ' + esc(r.receiverContact) + '</span>' +
        '<span><b>People to feed:</b> ' + esc(r.peopleCount) + '</span>' +
        '<span><b>Location:</b> ' + esc(r.location) + '</span>' +
        (r.description ? '<span><b>Notes:</b> ' + esc(r.description) + '</span>' : '') +
        '<span><b>Posted:</b> ' + timeAgo(r.createdAt) + '</span>' +
        '</div><div class="card-actions">' + actionBtns(r, "request") + '</div>';
      wrap.appendChild(card);
    });
  };

  /* ---------- Dashboard (all data, login required) ---------- */
  function dashStat(num, label) {
    return '<div class="dash-stat"><span class="n">' + num + '</span><span class="l">' + esc(label) + '</span></div>';
  }

  function donationTable(dons, u) {
    if (!dons.length) return '<p class="empty-inline">No donations submitted yet.</p>';
    var admin = u && u.role === "Admin";
    var h = '<div class="table-wrap"><table class="data-table"><thead><tr>' +
      '<th>Type</th><th>Item</th><th>Donor</th><th>Contact</th><th>Quantity</th><th>Condition</th><th>Location</th><th>Category</th><th>Status</th><th>Posted</th>' +
      (admin ? '<th>Action</th>' : '') + '</tr></thead><tbody>';
    dons.forEach(function (d) {
      h += '<tr>' +
        '<td>' + esc(d.itemType || "Food") + '</td>' +
        '<td>' + esc(d.foodName) + '</td>' +
        '<td>' + esc(d.donorName) + '</td>' +
        '<td>' + esc(d.donorContact) + '</td>' +
        '<td>' + esc(d.quantity) + '</td>' +
        '<td>' + esc(d.condition || "—") + '</td>' +
        '<td>' + esc(d.location) + '</td>' +
        '<td>' + esc(d.category) + '</td>' +
        '<td class="status-cell">' + (d.status === "available" ? "Available" : "Claimed") + '</td>' +
        '<td>' + timeAgo(d.createdAt) + '</td>' +
        (admin ? '<td><button class="btn btn-danger btn-small" onclick="deleteDonation(\'' + d.id + '\')">Delete</button></td>' : '') +
        '</tr>';
    });
    h += '</tbody></table></div>';
    return h;
  }

  function requestTable(reqs, u) {
    if (!reqs.length) return '<p class="empty-inline">No requests submitted yet.</p>';
    var admin = u && u.role === "Admin";
    var h = '<div class="table-wrap"><table class="data-table"><thead><tr>' +
      '<th>Food Needed</th><th>Requester</th><th>Contact</th><th>People</th><th>Location</th><th>Urgency</th><th>Status</th><th>Posted</th>' +
      (admin ? '<th>Action</th>' : '') + '</tr></thead><tbody>';
    reqs.forEach(function (r) {
      h += '<tr>' +
        '<td>' + esc(r.foodNeeded) + '</td>' +
        '<td>' + esc(r.receiverName) + '</td>' +
        '<td>' + esc(r.receiverContact) + '</td>' +
        '<td>' + esc(r.peopleCount) + '</td>' +
        '<td>' + esc(r.location) + '</td>' +
        '<td>' + esc(r.urgency) + '</td>' +
        '<td class="status-cell">' + (r.status === "open" ? "Open" : "Fulfilled") + '</td>' +
        '<td>' + timeAgo(r.createdAt) + '</td>' +
        (admin ? '<td><button class="btn btn-danger btn-small" onclick="deleteRequest(\'' + r.id + '\')">Delete</button></td>' : '') +
        '</tr>';
    });
    h += '</tbody></table></div>';
    return h;
  }

  function renderDashboard() {
    var lock = $("#dashLock");
    var content = $("#dashContent");
    if (!lock || !content) return;
    var u = getCurrentUser();
    if (!u) {
      lock.classList.remove("hidden");
      content.classList.add("hidden");
      return;
    }
    lock.classList.add("hidden");
    content.classList.remove("hidden");

    var dons = getDonations();
    var reqs = getRequests();
    var donAvail = dons.filter(function (d) { return d.status === "available"; }).length;
    var reqOpen = reqs.filter(function (r) { return r.status === "open"; }).length;

    var html = '';
    html += '<p class="dash-welcome">Logged in as <b>' + esc(u.name) + '</b> (' + esc(u.role) + ')</p>';
    html += '<div class="dash-stats">';
    html += dashStat(dons.length, "Total Donations");
    html += dashStat(donAvail, "Available Now");
    html += dashStat(dons.length - donAvail, "Claimed");
    html += dashStat(reqs.length, "Total Requests");
    html += dashStat(reqOpen, "Open Requests");
    html += dashStat(reqs.length - reqOpen, "Fulfilled");
    html += '</div>';
    html += '<h3 class="dash-h">All Donations</h3>';
    html += donationTable(dons, u);
    html += '<h3 class="dash-h">All Requests</h3>';
    html += requestTable(reqs, u);
    content.innerHTML = html;
  }

  /* ---------- Donation actions ---------- */
  window.claimDonation = function (id) {
    var arr = getDonations();
    arr.forEach(function (d) { if (d.id === id) d.status = "claimed"; });
    setDonations(arr); renderDonations(); updateStats(); renderDashboard(); toast("Donation claimed — thank you!");
  };
  window.reopenDonation = function (id) {
    var arr = getDonations();
    arr.forEach(function (d) { if (d.id === id) d.status = "available"; });
    setDonations(arr); renderDonations(); updateStats(); renderDashboard(); toast("Donation reopened.");
  };
  window.deleteDonation = function (id) {
    if (!confirm("Delete this donation?")) return;
    setDonations(getDonations().filter(function (d) { return d.id !== id; }));
    renderDonations(); updateStats(); renderDashboard(); toast("Donation deleted.");
  };

  /* ---------- Request actions ---------- */
  window.fulfillRequest = function (id) {
    var arr = getRequests();
    arr.forEach(function (r) { if (r.id === id) r.status = "fulfilled"; });
    setRequests(arr); renderRequests(); updateStats(); renderDashboard(); toast("Request fulfilled — great work!");
  };
  window.reopenRequest = function (id) {
    var arr = getRequests();
    arr.forEach(function (r) { if (r.id === id) r.status = "open"; });
    setRequests(arr); renderRequests(); updateStats(); renderDashboard(); toast("Request reopened.");
  };
  window.deleteRequest = function (id) {
    if (!confirm("Delete this request?")) return;
    setRequests(getRequests().filter(function (r) { return r.id !== id; }));
    renderRequests(); updateStats(); renderDashboard(); toast("Request deleted.");
  };

  /* ---------- Form handlers ---------- */
  window.handleDonateSubmit = function (e) {
    e.preventDefault();
    var f = e.target;
    var item = {
      id: uid(),
      itemType: f.itemType.value,
      donorName: f.donorName.value.trim(),
      donorContact: f.donorContact.value.trim(),
      foodName: f.foodName.value.trim(),
      quantity: f.quantity.value.trim(),
      location: f.location.value.trim(),
      expiry: f.expiry.value,
      category: f.category.value,
      condition: f.condition.value,
      description: f.description.value.trim(),
      status: "available",
      createdAt: Date.now()
    };
    var arr = getDonations(); arr.push(item); setDonations(arr);
    f.reset(); closeModal("donateModal");
    updateDonationCategories();
    renderDonations(); updateStats(); renderDashboard();
    toast("Thank you! Your donation is now listed.");
  };

  window.handleRequestSubmit = function (e) {
    e.preventDefault();
    var f = e.target;
    var item = {
      id: uid(),
      receiverName: f.receiverName.value.trim(),
      receiverContact: f.receiverContact.value.trim(),
      foodNeeded: f.foodNeeded.value.trim(),
      peopleCount: f.peopleCount.value,
      location: f.location.value.trim(),
      urgency: f.urgency.value,
      description: f.description.value.trim(),
      status: "open",
      createdAt: Date.now()
    };
    var arr = getRequests(); arr.push(item); setRequests(arr);
    f.reset(); closeModal("requestModal");
    renderRequests(); updateStats(); renderDashboard();
    toast("Your request has been posted. Donors will see it.");
  };

  window.handleContactSubmit = function (e) {
    e.preventDefault();
    var f = e.target;
    $("#contactMsg").textContent = "Thanks, " + f.cname.value.trim() + "! We'll get back to you soon.";
    f.reset();
  };

  /* ---------- Init ---------- */
  document.addEventListener("DOMContentLoaded", function () {
    seed();
    $("#year").textContent = new Date().getFullYear();
    initNav();
    updateAuthUI();
    updateDonationCategories();
    renderDonations();
    renderRequests();
    renderDashboard();
    updateStats();
  });
})();
