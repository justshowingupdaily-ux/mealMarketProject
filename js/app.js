/* Public site: router, home, menu, survey, catering, share/poster, privacy. */
(function (M) {
  const S = M.Store;
  const $ = (s, r) => (r || document).querySelector(s);
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  M.$ = $; M.esc = esc;
  let lang = S.ls.get("mmm_lang", "en");
  const t = k => (M.I18N[lang] && M.I18N[lang][k]) || M.I18N.en[k] || k;
  const inr = n => "₹" + Number(n).toLocaleString("en-IN");
  M.inr = inr;
  const siteUrl = () => (window.MMM_CONFIG.SITE_URL || (location.origin + location.pathname)).replace(/#.*$/, "");

  /* ---------- source / campaign capture ---------- */
  const qs = new URLSearchParams(location.search);
  const incoming = { source: qs.get("src") || qs.get("utm_source") || qs.get("ref") || "", campaign: qs.get("utm_campaign") || qs.get("campaign") || "" };
  if (incoming.source || incoming.campaign) S.ss.set("mmm_attr", JSON.stringify(incoming));
  const attr = () => { try { return JSON.parse(S.ss.get("mmm_attr") || "{}"); } catch (e) { return {}; } };
  const srcGuess = () => { const s = (attr().source || "").toLowerCase(); const hit = M.SOURCES.find(x => x[0] === s || s.indexOf(x[0]) >= 0); return hit ? hit[0] : (s ? "other" : ""); };

  /* ---------- tiny form helpers ---------- */
  const opts = (list, cur, ph) => (ph ? `<option value="">${ph}</option>` : "") + list.map(o => `<option value="${esc(o[0])}" ${String(cur) === String(o[0]) ? "selected" : ""}>${esc(o[1])}</option>`).join("");
  const radios = (name, list, cur, k) => `<div class="chips" role="radiogroup">${list.map(o => `<label class="chip"><input type="radio" name="${name}" value="${esc(o[0])}" ${k ? `data-k="${k}"` : ""} ${String(cur) === String(o[0]) ? "checked" : ""}><span>${esc(o[1])}</span></label>`).join("")}</div>`;
  const checks = (name, list, cur, k) => `<div class="chips">${list.map(o => `<label class="chip"><input type="checkbox" name="${name}" value="${esc(o[0])}" data-multi="1" ${k ? `data-k="${k}"` : ""} ${(cur || []).includes(o[0]) ? "checked" : ""}><span>${esc(o[1])}</span></label>`).join("")}</div>`;
  const food = (kind) => {
    const col = { roti: "#E3B466", dal: "#D9A21B", sabzi: "#8AA34A", rice: "#FFF8E8", paneer: "#E8935B", rajma: "#9B3B2A", curd: "#FFFFFF", khichdi: "#EBCB6B" };
    const dishes = kind;
    const bowls = dishes.filter(d => d !== "roti" && d !== "rice");
    const bowl = (d, cx, cy) => `<circle cx="${cx}" cy="${cy}" r="19" fill="#fff" stroke="#d9c9a0" stroke-width="2"/><circle cx="${cx}" cy="${cy}" r="14" fill="${col[d] || "#ccc"}"/>${d === "curd" ? `<circle cx="${cx}" cy="${cy}" r="14" fill="#fff" stroke="#eee"/>` : ""}`;
    const pos = [[62, 42], [138, 42], [62, 98], [138, 98]];
    return `<svg viewBox="0 0 200 140" role="img" aria-label="Illustration of a vegetarian thali" style="display:block;width:100%"><ellipse cx="100" cy="72" rx="92" ry="62" fill="#e8dcc0"/><ellipse cx="100" cy="68" rx="90" ry="60" fill="#fffdf7" stroke="#d9c9a0" stroke-width="2"/>
    ${dishes.includes("roti") ? `<g><circle cx="100" cy="72" r="26" fill="#E3B466" stroke="#c48f3a" stroke-width="2"/><circle cx="100" cy="68" r="26" fill="#EDC17A" stroke="#c48f3a" stroke-width="2"/><circle cx="94" cy="64" r="3" fill="#b77e2d"/><circle cx="106" cy="72" r="3" fill="#b77e2d"/></g>` : ""}
    ${dishes.includes("rice") ? `<ellipse cx="${dishes.includes("roti") ? 100 : 100}" cy="${dishes.includes("roti") ? 108 : 72}" rx="${dishes.includes("roti") ? 22 : 30}" ry="${dishes.includes("roti") ? 12 : 20}" fill="#fff8e8" stroke="#e0d3b0" stroke-width="2"/>` : ""}
    ${bowls.map((d, i) => bowl(d, pos[i][0], pos[i][1])).join("")}</svg>`;
  };

  /* ---------- header / footer ---------- */
  const routes = [["home", "nav_home", "#/"], ["menu", "nav_menu", "#/menu"], ["survey", "nav_survey", "#/survey"], ["catering", "nav_catering", "#/catering"], ["share", "nav_share", "#/share"], ["privacy", "nav_privacy", "#/privacy"]];
  const logo = `<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="23" fill="#1F4D3A"/><path d="M12 28h24a12 12 0 0 1-24 0z" fill="#FBF6EA"/><path d="M17 24c0-5 3-8 7-8s7 3 7 8" fill="none" stroke="#C2603F" stroke-width="3" stroke-linecap="round"/><circle cx="24" cy="13" r="2.4" fill="#C2603F"/></svg>`;
  function chrome(cur) {
    $("#top").innerHTML = `<div class="wrap"><a class="brand" href="#/">${logo}<span>Mathura Meal Market</span></a>
      <button class="burger" aria-label="Menu" aria-expanded="false" id="burger">☰</button>
      <nav class="nav" id="nav" aria-label="Main">${routes.map(r => `<a href="${r[2]}" ${cur === r[0] ? 'aria-current="page"' : ""}>${t(r[1])}</a>`).join("")}<button class="lang" id="lang" aria-label="Change language">${lang === "en" ? "हिन्दी / Hinglish" : "English"}</button></nav></div>`;
    $("#burger").onclick = e => { const n = $("#nav"); n.classList.toggle("open"); e.currentTarget.setAttribute("aria-expanded", n.classList.contains("open")); };
    $("#lang").onclick = () => { lang = lang === "en" ? "hi" : "en"; S.ls.set("mmm_lang", lang); document.documentElement.lang = lang === "hi" ? "hi-Latn" : "en"; route(); };
    $("#foot").innerHTML = `<div class="wrap"><strong>Mathura Meal Market</strong><div>${esc(t("tagline"))}</div><div>Market-research pilot. No orders, payments or bookings are being accepted. Submitting a form is an expression of interest only.</div><div><a href="#/privacy">Privacy notice</a> · <a href="#/admin">Owner login</a></div></div>`;
    const b = $("#demo-banner");
    if (!S.live) { b.hidden = false; b.innerHTML = "<strong>Demo mode:</strong> this copy is not connected to a database. Responses are saved <u>only in this browser</u> and will not reach the owner from other devices. See README to connect Supabase."; } else b.hidden = true;
  }

  /* ---------- router ---------- */
  function parse() { const h = location.hash.replace(/^#/, "") || "/"; const [p, q] = h.split("?"); return { path: p.replace(/\/$/, "") || "/", q: new URLSearchParams(q || "") }; }
  function route() {
    const { path, q } = parse(); const app = $("#app");
    const map = { "/": home, "/menu": menu, "/survey": survey, "/catering": catering, "/share": share, "/poster": poster, "/privacy": privacy, "/admin": () => M.renderAdmin(app) };
    const fn = map[path] || home;
    const cur = path === "/" ? "home" : path.slice(1);
    chrome(cur);
    app.innerHTML = ""; window.scrollTo(0, 0);
    SV.active = false;
    fn(app, q);
    if (path !== "/admin") S.event("page_view", srcGuess());
    document.title = "Mathura Meal Market — Launch Research";
  }

  /* ---------- home ---------- */
  const SERVICE_CARDS = [
    ["🍛", "Daily vegetarian thalis", "Lunch or dinner thalis with rotis, dal, sabzi and rice.", "#/survey?service=daily_lunch"],
    ["📅", "Weekly & monthly tiffin subscriptions", "A regular meal at a steady, transparent price.", "#/survey?service=monthly_lunch"],
    ["🏢", "Office lunch subscriptions", "Lunch for teams, shops and small offices.", "#/survey?service=office"],
    ["🎒", "Student & PG meal plans", "Simple, filling, budget-aware plans.", "#/survey?service=student_pg"],
    ["👨‍👩‍👧", "Family meal packages", "Home-style meals for the whole household.", "#/survey?service=family"],
    ["🎉", "Small-event catering", "Birthdays, pujas and family functions.", "#/catering?type=family"],
    ["🙏", "Bulk meals for meetings & gatherings", "Meal boxes or buffet for religious and other events.", "#/catering?type=religious"]
  ];
  function home(app) {
  const photos = {
    hero: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=1400&q=85",
    thali: "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=80",
    fresh: "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=900&q=80",
    meal: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80"
  };

  app.innerHTML = `
    <section class="premium-hero">
      <div class="premium-hero-inner">

        <div class="premium-copy">
          <span class="eyebrow">
            <span class="eyebrow-dot"></span>
            MADE FOR MATHURA
          </span>

          <p class="premium-kicker">
            ${esc(t("tagline"))}
          </p>

          <h1>
            ${esc(t("hero_h"))}
          </h1>

          <p class="premium-description">
            ${esc(t("hero_p"))}
          </p>

          <div class="premium-actions">
            <a class="premium-btn premium-btn-primary"
               href="#/survey">
              ${esc(t("cta_plan"))}
              <span aria-hidden="true">↗</span>
            </a>

            <a class="premium-btn premium-btn-secondary"
               href="#/menu">
              ${esc(t("cta_explore"))}
            </a>
          </div>

          <div class="premium-trust">
            <span class="trust-icon" aria-hidden="true">✳</span>
            <span>
              Help shape a proposed home-style vegetarian
              meal service in Mathura.
            </span>
          </div>
        </div>

        <div class="premium-visual">
          <div class="hero-photo-frame">
            <img
              class="hero-photo"
              src="${photos.hero}"
              alt="A colourful meal made with fresh ingredients"
              fetchpriority="high"
            >

            <div class="photo-label">
              <span class="photo-label-icon">✳</span>
              <div>
                <strong>Everyday goodness</strong>
                <span>A proposed meal concept</span>
              </div>
            </div>
          </div>

          <div class="floating-note">
            <span class="floating-note-icon">♡</span>
            <div>
              <strong>Rooted in home-style food</strong>
              <span>Designed around local needs</span>
            </div>
          </div>

          <span class="hero-decoration hero-decoration-one">✳</span>
          <span class="hero-decoration hero-decoration-two">✿</span>
        </div>
      </div>

      <div class="hero-bottom-line">
        <span>GOOD FOOD. EVERYDAY COMFORT.</span>
        <span>MATHURA, UTTAR PRADESH</span>
      </div>
    </section>

    <section class="premium-services">
      <div class="premium-section-heading">
        <div>
          <span class="premium-overline">WHAT WE'RE EXPLORING</span>
          <h2>
            Everyday meals,<br>
            <em>thoughtfully imagined.</em>
          </h2>
        </div>

        <p>
          From a simple daily thali to meals for the whole family,
          help us understand what Mathura really needs.
        </p>
      </div>

      <div class="premium-service-grid">
        ${SERVICE_CARDS.map((c, i) => `
          <article class="premium-service-card">
            <div class="service-card-top">
              <span class="service-number">
                ${String(i + 1).padStart(2, "0")}
              </span>
              <span class="service-symbol" aria-hidden="true">
                ${c[0]}
              </span>
            </div>

            <h3>${esc(c[1])}</h3>
            <p>${esc(c[2])}</p>

            <a href="${c[3]}" class="service-link">
              Share your interest
              <span aria-hidden="true">↗</span>
            </a>
          </article>
        `).join("")}
      </div>
    </section>

    <section class="premium-food-section">
      <div class="premium-food-image">
        <img
          src="${photos.thali}"
          alt="A colourful selection of food"
          loading="lazy"
        >
      </div>

      <div class="premium-food-copy">
        <span class="premium-overline">SIMPLE. FAMILIAR. COMFORTING.</span>

        <h2>
          Food that feels<br>
          <em>a little like home.</em>
        </h2>

        <p>
          Imagine everyday vegetarian meals with familiar flavours,
          thoughtful portions and prices that make sense.
          We're researching what people in Mathura would actually want.
        </p>

        <ul class="premium-values">
          <li>
            <span>01</span>
            Familiar vegetarian meals
          </li>
          <li>
            <span>02</span>
            Clear, considered pricing
          </li>
          <li>
            <span>03</span>
            Meal plans shaped by local needs
          </li>
        </ul>

        <a class="premium-text-link" href="#/menu">
          Explore the proposed menu <span aria-hidden="true">→</span>
        </a>
      </div>
    </section>

    <section class="premium-approach">
      <div class="premium-approach-heading">
        <span class="premium-overline">OUR INTENDED APPROACH</span>
        <h2>Good intentions.<br><em>Practical details.</em></h2>
        <p>
          Before launching anything, we want to understand what matters
          most to the people who might use this service.
        </p>
      </div>

      <div class="premium-approach-grid">
        <article class="approach-card">
          <span class="approach-icon">✳</span>
          <h3>Freshness first</h3>
          <p>
            Explore expectations around freshly prepared,
            everyday vegetarian meals.
          </p>
        </article>

        <article class="approach-card">
          <span class="approach-icon">♡</span>
          <h3>Honest pricing</h3>
          <p>
            Help us understand a realistic price for the meals
            and portions you would choose.
          </p>
        </article>

        <article class="approach-card">
          <span class="approach-icon">⌂</span>
          <h3>Designed locally</h3>
          <p>
            Meal preferences, delivery needs and budgets
            should reflect real life in Mathura.
          </p>
        </article>
      </div>
    </section>

    <section class="premium-research">
      <div class="premium-research-image">
        <img
          src="${photos.fresh}"
          alt="Fresh ingredients arranged for a meal"
          loading="lazy"
        >
      </div>

      <div class="premium-research-copy">
        <span class="premium-overline">YOUR OPINION MATTERS</span>

        <h2>
          Help us get<br>
          <em>the details right.</em>
        </h2>

        <p>
          Take a short survey about your meal habits, preferred
          services and realistic budget. Your answers will help
          us evaluate whether a local pilot makes sense.
        </p>

        <a href="#/survey" class="premium-btn premium-btn-primary">
          Take the survey <span aria-hidden="true">↗</span>
        </a>

        <p class="premium-research-note">
          Approximately 3 minutes · No purchase required
        </p>
      </div>
    </section>

    <section class="premium-interest">
      <div class="premium-interest-inner">
        <div>
          <span class="premium-overline">STAY IN THE LOOP</span>
          <h2>Interested in a future pilot?</h2>
          <p>
            You can leave your details if you'd like to hear from us
            about a possible launch in Mathura.
          </p>
        </div>

        <div class="premium-interest-form" id="li-box">
          ${launchForm()}
        </div>
      </div>
    </section>

    <div class="premium-disclaimer">
      <span aria-hidden="true">ⓘ</span>
      <p>
        <strong>Currently in the research stage.</strong>
        This website is exploring demand for a proposed meal service.
        The menu and prices are illustrative. Orders, payments and
        bookings are not being accepted.
      </p>
    </div>
  `;

  bindLaunch();
}
  function consentBlock(prefix) {
    return `<label class="chk"><input type="checkbox" name="consent" required><span>${esc(M.CONSENT_TEXT)} <a href="#/privacy" target="_blank" rel="noopener">Privacy notice</a></span></label>
      <label class="chk"><input type="checkbox" name="promo"><span>${esc(M.PROMO_TEXT)}</span></label>`;
  }
  const hp = ts => `<div class="hp" aria-hidden="true"><label>Website<input type="text" name="website" tabindex="-1" autocomplete="off"></label></div><input type="hidden" name="_t" value="${ts || Date.now()}">`;
  function launchForm() {
    return `<form id="li-form" novalidate>${hp()}
      <div class="field"><label for="li-name">Your name (or preferred name)</label><input id="li-name" name="name" type="text" autocomplete="given-name" maxlength="80" required></div>
      <div class="field"><label for="li-phone">Mobile number</label><input id="li-phone" name="phone" type="tel" inputmode="numeric" autocomplete="tel" placeholder="10-digit mobile number" required><span class="hint">Used only to reach you about this pilot.</span></div>
      <div class="field"><label for="li-loc">Area of Mathura</label><select id="li-loc" name="locality" required>${opts(M.LOCALITIES.map(x => [x, x]), "", "Choose your area")}</select></div>
      ${consentBlock()}
      <div id="li-err" role="alert"></div>
      <button class="btn terra" type="submit">${esc(t("launch_btn"))}</button></form>`;
  }
  function antiSpam(f) {
    if (f.website && f.website.value) return "Could not submit.";
    if (Date.now() - Number(f._t.value) < 2500) return "Please take a moment to fill the form, then try again.";
    const times = (S.ls.get("mmm_sub_times", []) || []).filter(x => Date.now() - x < 3600e3);
    if (times.length >= 5) return "Too many submissions from this device. Please try again later.";
    return "";
  }
  const markSub = () => { const a = (S.ls.get("mmm_sub_times", []) || []).filter(x => Date.now() - x < 3600e3); a.push(Date.now()); S.ls.set("mmm_sub_times", a); };
  const validPhone = p => /^(?:\+?91[\s-]?|0)?[6-9]\d{9}$/.test(String(p || "").replace(/[\s-]/g, ""));
  const cleanPhone = p => String(p).replace(/[\s-]/g, "").replace(/^(\+?91|0)/, "");
  function bindLaunch() {
    const f = $("#li-form"); if (!f) return;
    f.onsubmit = async e => {
      e.preventDefault(); const err = $("#li-err"); err.innerHTML = "";
      const bad = antiSpam(f) || (!f.name.value.trim() ? "Please enter your name." : !validPhone(f.phone.value) ? "Please enter a valid 10-digit Indian mobile number." : !f.locality.value ? "Please choose your area." : !f.consent.checked ? "Please tick the consent box so we may contact you." : "");
      if (bad) { err.innerHTML = `<div class="err">${esc(bad)}</div>`; return; }
      const btn = f.querySelector("button"); btn.disabled = true;
      try {
        await S.insert({ kind: "launch_interest", name: f.name.value.trim(), phone: cleanPhone(f.phone.value), locality: f.locality.value, source: srcGuess() || "website", campaign: attr().campaign || null,
          consent_followup: true, consent_promo: f.promo.checked, consent_text: M.CONSENT_TEXT, consent_at: new Date().toISOString(), privacy_version: M.PRIVACY_VERSION, answers: {}, status: "new_enquiry" });
        markSub(); $("#li-box").innerHTML = `<div class="ok"><h3>Thank you!</h3><p>Your interest is recorded. This is <strong>not an order or booking</strong> — if we run a pilot, we will contact you using the details you gave. You can ask us to delete your details any time (see the <a href="#/privacy">privacy notice</a>).</p><a class="btn" href="#/survey">Also take the 3-minute survey</a></div>`;
      } catch (ex) { err.innerHTML = `<div class="err">${esc(ex.message)}</div>`; btn.disabled = false; }
    };
  }

  /* ---------- menu ---------- */
  function menu(app) {
    let filter = "all"; let picks = S.ls.get("mmm_menu_pick", []);
    const cats = [["all", "All"], ["thali", "Thalis"], ["rice", "Rice meals"], ["light", "Light meals"], ["plan", "Plans"]];
    const draw = () => {
      app.innerHTML = `<section><div class="wrap"><h1>Proposed menu</h1>
      <div class="note">Every item below is a <strong>proposal for research</strong> — not currently available to order. Prices are illustrative and may change after we hear from you.</div>
      <div style="margin:18px 0" class="chips" role="radiogroup" aria-label="Filter by meal type">${cats.map(c => `<label class="chip"><input type="radio" name="cat" value="${c[0]}" ${filter === c[0] ? "checked" : ""}><span>${c[1]}</span></label>`).join("")}</div>
      <div class="cards">${M.MENU.filter(m => filter === "all" || m.cat === filter).map(m => `<article class="card menu-card"><div class="pic">${food(m.dishes)}</div><div class="body"><span class="pill">Proposed menu — not currently available to order</span><h3>${esc(m.name)}</h3><div class="price">${inr(m.price)}${m.unit ? ` <small class="muted" style="font-size:.9rem">/ ${esc(m.unit)}</small>` : ""}</div><ul>${m.items.map(i => `<li>${esc(i)}</li>`).join("")}</ul>
        <label class="chk" style="margin-top:auto"><input type="checkbox" data-pick="${m.id}" ${picks.includes(m.id) ? "checked" : ""}><span>I would realistically consider buying this</span></label></div></article>`).join("")}</div>
      <h2 style="margin-top:34px">Compare daily, weekly and monthly</h2>
      <div class="tbl"><table><thead><tr><th>Everyday Thali style</th><th>Daily</th><th>Weekly (6 meals)</th><th>Monthly (26 meals)</th></tr></thead><tbody>
        <tr><th>Proposed price</th><td>${inr(119)} per meal</td><td>${inr(680)} <span class="muted">(≈ ₹113/meal)</span></td><td>${inr(2600)} <span class="muted">(₹100/meal)</span></td></tr>
        <tr><th>Commitment</th><td>None</td><td>1 week</td><td>1 month</td></tr><tr><th>Status</th><td colspan="3"><span class="pill">Illustrative prices requiring validation — not available to order</span></td></tr></tbody></table></div>
      <div class="card" style="margin-top:22px"><div class="row" style="justify-content:space-between"><div><strong>${picks.length}</strong> item(s) you would consider.<div class="small muted">We will attach your picks to the survey so we learn what matters.</div></div><a class="btn terra" href="#/survey">Tell us what you'd pay →</a></div></div></div></section>`;
      app.querySelectorAll("[name=cat]").forEach(i => i.onchange = () => { filter = i.value; draw(); const c = app.querySelector(`[name=cat][value=${filter}]`); if (c) c.focus(); });
      app.querySelectorAll("[data-pick]").forEach(i => i.onchange = () => { picks = i.checked ? picks.concat(i.dataset.pick) : picks.filter(x => x !== i.dataset.pick); S.ls.set("mmm_menu_pick", picks); const el = app.querySelector(".card strong"); });
    };
    draw();
  }

  /* ---------- survey ---------- */
  const SV = { active: false, step: 1, a: S.ls.get("mmm_survey_draft", null) || {}, started: false, done: false };
  const STEPS = ["Profile", "Today", "Interest", "Price", "Intent"];
  const hasSvc = k => (SV.a.services || []).includes(k);
  const picked = () => (SV.a.services || []).filter(k => k !== "none");
  const notInterested = () => hasSvc("none");
  const anyMeal = () => picked().some(k => M.svc(k).meal);
  const priceTypes = () => { const o = {}; picked().forEach(k => { const ty = M.svc(k).type; if (ty) o[ty] = 1; }); return Object.keys(o); };
  function survey(app, q) {
    SV.active = true;
    if (SV.done) { SV.done = false; SV.a = {}; SV.step = 1; }
    const pre = q.get("service"); if (pre && M.svc(pre).type !== undefined && !(SV.a.services || []).length) SV.a.services = [pre];
    if (!SV.a.menu_interest) SV.a.menu_interest = S.ls.get("mmm_menu_pick", []);
    if (!SV.a.source && srcGuess()) SV.a.source = srcGuess();
    SV.t0 = Date.now();
    if (!SV.started) { SV.started = true; S.event("survey_start", srcGuess()); }
    drawSurvey(app);
  }
  const stepsFor = () => notInterested() ? [1, 2, 3, 5] : [1, 2, 3, 4, 5];
  function drawSurvey(app, focusSel) {
    app = app || $("#app"); const a = SV.a; const order = stepsFor(); if (!order.includes(SV.step)) SV.step = 5;
    const pos = order.indexOf(SV.step) + 1; const total = order.length;
    let body = "";
    if (SV.step === 1) body = `
      <div class="field"><span class="lbl">Which best describes you?</span>${radios("role", M.ROLES, a.role, "role")}</div>
      <div class="field"><label for="loc">Which area of Mathura do you live or work in?</label><select id="loc" data-k="locality">${opts(M.LOCALITIES.map(x => [x, x]), a.locality, "Choose an area")}</select>
        ${a.locality === "Other" ? `<input type="text" data-k="locality_other" placeholder="Your area / colony" value="${esc(a.locality_other || "")}" maxlength="80" aria-label="Your area">` : ""}</div>
      <div class="field"><span class="lbl">Do you need meals for…</span>${radios("need", M.NEED_FOR, a.need_for, "need_for")}</div>
      <div class="field"><label for="ppl">How many people would potentially need food?</label><input id="ppl" type="number" inputmode="numeric" min="1" max="500" data-k="people" value="${esc(a.people || "")}" placeholder="e.g. 2"></div>`;
    if (SV.step === 2) body = `
      <div class="field"><span class="lbl">How do you arrange your daily meals now? <span class="hint">(choose all that apply)</span></span>${checks("arr", M.ARRANGE, a.arrange, "arrange")}</div>
      <div class="field"><label for="spend">Approximate spending per meal today</label><select id="spend" data-k="spend">${opts(M.SPEND, a.spend, "Choose")}</select></div>
      <div class="field"><label for="out">How many days a week do you buy food from outside?</label><select id="out" data-k="days_outside">${opts([0, 1, 2, 3, 4, 5, 6, 7].map(n => [n, n + (n === 1 ? " day" : " days")]), a.days_outside, "Choose")}</select></div>
      <div class="field"><span class="lbl">Biggest problem with your current arrangement <span class="hint">(choose up to 2)</span></span>${checks("prob", M.PROBLEMS, a.problems, "problems")}</div>`;
    if (SV.step === 3) body = `
      <div class="field"><span class="lbl">Which services would you consider? <span class="hint">(choose all that apply)</span></span>${checks("svc", M.SERVICES.map(s => [s.k, s.l]), a.services, "services")}</div>
      ${notInterested() ? `<div class="note info">No problem — thank you for telling us. We'll just ask one last optional question.</div>` : `
      ${anyMeal() ? `<div class="field"><span class="lbl">Preferred meal timing</span>${radios("mt", M.MEALTIME, a.mealtime, "mealtime")}</div>
      <div class="field"><label for="mpw">Roughly how many of these meals per week, per person?</label><input id="mpw" type="number" inputmode="numeric" min="1" max="21" data-k="meals_per_week" value="${esc(a.meals_per_week || "")}" placeholder="e.g. 6"></div>` : ""}
      <div class="field"><span class="lbl">Delivery or collection</span>${radios("dl", M.DELIVERY, a.delivery, "delivery")}</div>
      <div class="field"><span class="lbl">Dietary preferences <span class="hint">(choose all that apply)</span></span>${checks("diet", M.DIET, a.diet, "diet")}</div>`}`;
    if (SV.step === 4) body = priceStep();
    if (SV.step === 5) body = intentStep();
    const err = SV.err ? `<div class="err" role="alert">${esc(SV.err)}</div>` : "";
    app.innerHTML = `<section><div class="wrap" style="max-width:700px"><span class="badge">Market-research pilot — orders not yet accepted</span>
      <h1 style="font-size:1.9rem">Help us design the service</h1>
      <div class="progress" role="progressbar" aria-valuemin="1" aria-valuemax="${total}" aria-valuenow="${pos}" aria-label="Survey progress"><i style="width:${pos / total * 100}%"></i></div>
      <div class="steps"><span>Step <b>${pos}</b> of ${total}: <b>${STEPS[SV.step - 1]}</b></span><span>You can go back and edit</span></div>
      <form id="sv-form" class="form" novalidate>${hp(SV.t0)}${body}${err}
        <div class="row" style="justify-content:space-between">${pos > 1 ? `<button type="button" class="btn ghost" id="back">← Back</button>` : "<span></span>"}
        <button type="submit" class="btn terra" id="next">${SV.step === 5 ? "Submit my answers" : "Next →"}</button></div></form></div></section>`;
    if (focusSel) { const el = app.querySelector(focusSel); if (el) el.focus(); }
    const form = $("#sv-form");
    form.onsubmit = ev => { ev.preventDefault(); next(); };
    const b = $("#back"); if (b) b.onclick = () => { SV.err = ""; const o = stepsFor(); SV.step = o[Math.max(0, o.indexOf(SV.step) - 1)]; drawSurvey(); window.scrollTo(0, 0); };
  }
  function priceStep() {
    const a = SV.a; a.prices = a.prices || {};
    const types = priceTypes();
    const labels = { thali: "per thali / meal", monthly: "per month for 26 meals (price per meal in brackets)", event: "per guest" };
    let html = `<p class="muted" style="margin:0">For each service you picked, what price would you <em>realistically consider</em>? Your answers help us set fair prices — nothing here is a quote.</p>`;
    picked().forEach(k => { const ty = M.svc(k).type; if (!ty) return; html += `<div class="priceq"><span class="lbl">${esc(M.svc(k).l)} — ${labels[ty]}</span>${radios("price_" + k, M.BANDS[ty], a.prices[k], "price:" + k)}</div>`; });
    html += `<div class="field"><span class="lbl">Should delivery be included in the price?</span>${radios("dp", M.DELIVERY_PRICE, a.delivery_price, "delivery_price")}</div>`;
    // optional randomised price experiment
    const expType = types.includes("thali") ? "thali" : types.includes("monthly") ? "monthly" : null;
    if (expType) {
      html += `<label class="chk"><input type="checkbox" data-k="exp_opt" ${a.exp_opt ? "checked" : ""}><span>Optional: show me one sample proposed offer and let me react to it. <span class="hint">(Research only — the offer shown is not a guaranteed selling price.)</span></span></label>`;
      if (a.exp_opt) {
        if (!a.exp || a.exp.type !== expType) { const o = M.OFFERS[expType][Math.floor(Math.random() * 3)]; a.exp = { type: expType, offer_id: o.id, price: o.price, text: o.text, response: "" }; }
        html += `<div class="offer"><span class="pill">Proposed offer for research — not available to order, price not guaranteed</span><p style="font-weight:700;margin:8px 0">${esc(a.exp.text)}</p><div class="field"><span class="lbl">Would this feel fair to you?</span>${radios("expr", [["yes", "Yes, I would consider it"], ["maybe", "Maybe"], ["no", "No, too high / not for me"]], a.exp.response, "exp_response")}</div></div>`;
      }
    }
    html += `<div class="field"><span class="lbl">If the food, portions, hygiene and delivery arrangements met your expectations, how likely would you be to subscribe?</span>
      <div class="likert" role="radiogroup">${M.LIKELY.map(o => `<label class="chip"><input type="radio" name="lk" value="${o[0]}" data-k="likelihood" ${String(a.likelihood) === String(o[0]) ? "checked" : ""}><span>${o[1]}</span></label>`).join("")}</div></div>`;
    return html;
  }
  function intentStep() {
    const a = SV.a; const ni = notInterested();
    let html = "";
    if (!ni) html += `
      <div class="field"><label for="st">When would you ideally want the service to start?</label><select id="st" data-k="start">${opts(M.START, a.start, "Choose")}</select></div>
      <div class="field"><span class="lbl">How frequently would you order?</span>${radios("fq", M.FREQ, a.frequency, "frequency")}</div>
      <div class="field"><label for="bd">Estimated monthly food budget (for the people this meal would cover)</label><select id="bd" data-k="budget">${opts(M.BUDGET, a.budget, "Choose")}</select></div>
      <div class="field"><span class="lbl">Would you like to be contacted if a pilot launches?</span>${radios("cok", [["yes", "Yes, contact me"], ["no", "No, keep me anonymous"]], a.contact_ok, "contact_ok")}</div>
      <div class="field"><span class="lbl">Would you be interested in a tasting session or future pilot?</span>${radios("pl", M.PILOT, a.pilot, "pilot")}</div>`;
    html += `<div class="field"><span class="lbl">${ni ? "What is the main reason you are not interested? " : "What would prevent you from subscribing? "}<span class="hint">(optional)</span></span>${checks("bar", M.BARRIERS, a.barriers, "barriers")}
      <textarea data-k="barrier_text" maxlength="300" placeholder="Anything else? Please don't write personal details here." aria-label="Other reasons">${esc(a.barrier_text || "")}</textarea></div>`;
    const wants = !ni && (a.contact_ok === "yes");
    if (wants) html += `<div class="card" style="box-shadow:none"><h3>Your contact details</h3><p class="muted small">Only what we need to reach you about the pilot. We never collect Aadhaar, card details, passwords or GPS location.</p>
      <div class="form">
      <div class="field"><label for="cn">Name or preferred name</label><input id="cn" type="text" data-k="name" value="${esc(a.name || "")}" maxlength="80" autocomplete="given-name"></div>
      <div class="field"><label for="cp">Mobile number</label><input id="cp" type="tel" inputmode="numeric" data-k="phone" value="${esc(a.phone || "")}" placeholder="10-digit mobile number" autocomplete="tel"></div>
      <div class="field"><label for="ce">Email <span class="hint">(optional)</span></label><input id="ce" type="email" data-k="email" value="${esc(a.email || "")}" maxlength="120" autocomplete="email"></div>
      <div class="field"><label for="cm">Preferred contact method</label><select id="cm" data-k="contact_method">${opts(M.CONTACT_METHODS, a.contact_method, "Choose")}</select></div>
      <div class="field"><label for="so">How did you hear about this survey?</label><select id="so" data-k="source">${opts(M.SOURCES, a.source, "Choose")}</select></div>
      <label class="chk"><input type="checkbox" data-k="consent" ${a.consent ? "checked" : ""}><span>${esc(M.CONSENT_TEXT)} <a href="#/privacy" target="_blank" rel="noopener">Privacy notice</a></span></label>
      <label class="chk"><input type="checkbox" data-k="promo" ${a.promo ? "checked" : ""}><span>${esc(M.PROMO_TEXT)}</span></label></div></div>`;
    else html += `<div class="note info">You can submit without giving any contact details. Your answers will be counted anonymously.</div>`;
    return html;
  }
  function validate() {
    const a = SV.a;
    if (SV.step === 1) { if (!a.role) return "Please choose what best describes you."; if (!a.locality) return "Please choose your area."; if (a.locality === "Other" && !(a.locality_other || "").trim()) return "Please type your area."; if (a.people && (a.people < 1 || a.people > 500)) return "Number of people should be between 1 and 500."; }
    if (SV.step === 2) { if (!(a.arrange || []).length) return "Please choose at least one way you arrange meals now."; if ((a.problems || []).length > 2) return "Please choose up to 2 problems."; }
    if (SV.step === 3) { if (!picked().length && !notInterested()) return "Please choose at least one service (or 'Not interested at present')."; if (!notInterested()) { if (a.meals_per_week && (a.meals_per_week < 1 || a.meals_per_week > 21)) return "Meals per week should be between 1 and 21."; } }
    if (SV.step === 4) { for (const k of picked()) if (M.svc(k).type && !(a.prices || {})[k]) return `Please choose a price range for "${M.svc(k).l}".`; if (!a.likelihood) return "Please tell us how likely you would be to subscribe."; if (a.exp_opt && a.exp && !a.exp.response) return "Please react to the sample offer, or untick the optional box."; }
    return "";
  }
  async function next() {
    const f = $("#sv-form"); SV.err = "";
    const e = validate(); if (e) { SV.err = e; drawSurvey(); return; }
    S.ls.set("mmm_survey_draft", Object.assign({}, SV.a, { phone: undefined, name: undefined, email: undefined, consent: undefined }));
    const o = stepsFor();
    if (SV.step < 5) { SV.step = o[o.indexOf(SV.step) + 1]; drawSurvey(); window.scrollTo(0, 0); return; }
    // submit
    const a = SV.a; const ni = notInterested(); const wants = !ni && a.contact_ok === "yes";
    const spam = antiSpam(f); if (spam) { SV.err = spam; drawSurvey(); return; }
    if (wants) {
      if (!(a.name || "").trim()) { SV.err = "Please enter your name, or choose 'No, keep me anonymous'."; drawSurvey(); return; }
      if (!validPhone(a.phone)) { SV.err = "Please enter a valid 10-digit Indian mobile number."; drawSurvey(); return; }
      if (a.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(a.email)) { SV.err = "That email address doesn't look right."; drawSurvey(); return; }
      if (!a.contact_method) { SV.err = "Please choose how we should contact you."; drawSurvey(); return; }
      if (!a.consent) { SV.err = "Please tick the consent box so we may contact you."; drawSurvey(); return; }
    }
    $("#next").disabled = true;
    const answers = { role: a.role, need_for: a.need_for, people: a.people ? Number(a.people) : null, arrange: a.arrange || [], spend: a.spend || null, days_outside: a.days_outside === undefined ? null : Number(a.days_outside), problems: a.problems || [],
      services: a.services || [], mealtime: a.mealtime || null, meals_per_week: a.meals_per_week ? Number(a.meals_per_week) : null, delivery: a.delivery || null, diet: a.diet || [],
      prices: a.prices || {}, delivery_price: a.delivery_price || null, likelihood: a.likelihood ? Number(a.likelihood) : null,
      experiment: a.exp_opt && a.exp ? { offer_id: a.exp.offer_id, shown_price: a.exp.price, type: a.exp.type, response: a.exp.response } : null,
      start: a.start || null, frequency: a.frequency || null, budget: a.budget || null, pilot: a.pilot || null, barriers: a.barriers || [], barrier_text: (a.barrier_text || "").trim() || null, menu_interest: a.menu_interest || [] };
    try {
      await S.insert({ kind: "survey", name: wants ? a.name.trim() : null, phone: wants ? cleanPhone(a.phone) : null, email: wants && a.email ? a.email.trim() : null, contact_method: wants ? a.contact_method : null,
        locality: a.locality === "Other" ? ("Other: " + (a.locality_other || "").trim()) : a.locality, source: a.source || srcGuess() || "direct", campaign: attr().campaign || null,
        consent_followup: !!(wants && a.consent), consent_promo: !!(wants && a.promo), consent_text: wants && a.consent ? M.CONSENT_TEXT : null, consent_at: wants && a.consent ? new Date().toISOString() : null,
        privacy_version: M.PRIVACY_VERSION, answers, experiment_offer: answers.experiment ? answers.experiment.offer_id : null, status: "new_enquiry" });
      markSub(); S.event("survey_complete", srcGuess()); S.ls.set("mmm_survey_draft", null);
      SV.a = {}; SV.step = 1; SV.started = false; SV.done = true; SV.active = false;
      $("#app").innerHTML = `<section><div class="wrap" style="max-width:700px"><div class="ok"><h1 style="font-size:1.8rem">Thank you — that really helps.</h1>
        <p>Your answers are recorded as <strong>stated interest</strong>. This is a market-research pilot: <strong>no order or booking has been made</strong> and nothing is being charged.</p>
        ${wants ? "<p>Because you agreed, we may contact you if a pilot launches. You can ask us to stop or delete your details any time.</p>" : "<p>Your answers were submitted anonymously.</p>"}
        <div class="row"><a class="btn" href="#/share">Share the survey with a friend</a><a class="btn ghost" href="#/">Back to home</a></div></div></div></section>`;
      window.scrollTo(0, 0);
    } catch (ex) { SV.err = ex.message; drawSurvey(); }
  }
  // delegated survey input handling
  document.addEventListener("change", ev => {
    if (!SV.active) return; const el = ev.target; if (!el.dataset || !el.dataset.k) return;
    let k = el.dataset.k; const a = SV.a;
    if (k.startsWith("price:")) { a.prices = a.prices || {}; a.prices[k.slice(6)] = el.value; }
    else if (k === "exp_response") { a.exp.response = el.value; }
    else if (k === "exp_opt") { a.exp_opt = el.checked; if (!el.checked) a.exp = null; }
    else if (el.dataset.multi) {
      let arr = (a[k] || []).slice(); const v = el.value;
      if (el.checked) { arr.push(v); if (k === "services") arr = v === "none" ? ["none"] : arr.filter(x => x !== "none"); if (k === "problems" && arr.length > 2) { arr.shift(); } } else arr = arr.filter(x => x !== v);
      a[k] = arr;
    } else if (el.type === "checkbox") a[k] = el.checked;
    else a[k] = el.value;
    if (el.type === "radio" || el.type === "checkbox" || el.tagName === "SELECT") {
      const sel = el.type === "radio" || el.type === "checkbox" ? `[data-k="${k.replace(/"/g, "")}"][value="${(el.value || "").replace(/"/g, "")}"]` : `[data-k="${k}"]`;
      drawSurvey(null, sel);
    }
  });
  document.addEventListener("input", ev => { if (!SV.active) return; const el = ev.target; if (!el.dataset || !el.dataset.k) return; if (["text", "tel", "email", "number"].includes(el.type) || el.tagName === "TEXTAREA") SV.a[el.dataset.k] = el.value; });

  /* ---------- catering ---------- */
  function catering(app, q) {
    app.innerHTML = `<section><div class="wrap" style="max-width:720px"><span class="badge">Enquiry only — not a booking</span><h1>Vegetarian catering enquiry</h1>
      <p class="lead">Planning a family function, puja, meeting or small event? Tell us about it so we can learn what catering people in Mathura actually need.</p>
      <div class="note"><strong>Research estimates, not quotes.</strong> We are testing these illustrative per-guest ranges: ${M.CATERING_RANGES.map(r => `${esc(r[0])} ${esc(r[1])}`).join("; ")}. Submitting this form is an <strong>expression of interest, not a booking</strong>.</div>
      <div id="ct-box" style="margin-top:18px"><form id="ct-form" novalidate>${hp()}
      <div class="field"><label for="c-ev">Event type</label><select id="c-ev" name="event_type">${opts(M.EVENT_TYPES, q.get("type") || "", "Choose")}</select></div>
      <div class="field"><label for="c-dt">Approximate event date</label><input id="c-dt" name="event_date" type="date"></div>
      <div class="field"><span class="lbl">Number of guests</span>${radios("guests", M.GUESTS, "")}</div>
      <div class="field"><label for="c-mn">Vegetarian menu requirements</label><textarea id="c-mn" name="menu_req" maxlength="400" placeholder="e.g. no onion-garlic, 2 sabzis, paneer item"></textarea></div>
      <div class="field"><label for="c-sv">Preferred serving style</label><select id="c-sv" name="serving">${opts(M.SERVING, "", "Choose")}</select></div>
      <div class="field"><label for="c-bd">Budget per guest</label><select id="c-bd" name="budget">${opts(M.BANDS.event, "", "Choose")}</select></div>
      <div class="field"><label for="c-ar">Venue area</label><select id="c-ar" name="locality">${opts(M.LOCALITIES.map(x => [x, x]), "", "Choose area")}</select></div>
      <div class="field"><label for="c-dm">Delivery or on-site service</label><select id="c-dm" name="service_mode">${opts(M.SERVICE_MODE, "", "Choose")}</select></div>
      <div class="field"><label for="c-sp">Special requirements</label><textarea id="c-sp" name="special" maxlength="400" placeholder="Please don't include personal details here."></textarea></div>
      <h2 style="font-size:1.3rem;margin-top:8px">Contact details</h2>
      <div class="field"><label for="c-nm">Name</label><input id="c-nm" name="name" type="text" maxlength="80" autocomplete="name"></div>
      <div class="field"><label for="c-ph">Mobile number</label><input id="c-ph" name="phone" type="tel" inputmode="numeric" placeholder="10-digit mobile number" autocomplete="tel"></div>
      <div class="field"><label for="c-em">Email <span class="hint">(optional)</span></label><input id="c-em" name="email" type="email" maxlength="120"></div>
      <div class="field"><label for="c-cm">Preferred contact method</label><select id="c-cm" name="contact_method">${opts(M.CONTACT_METHODS, "", "Choose")}</select></div>
      ${consentBlock()}<div id="ct-err" role="alert"></div><button class="btn terra" type="submit">Send my enquiry</button></form></div></div></section>`;
    const f = $("#ct-form");
    f.onsubmit = async e => {
      e.preventDefault(); const err = $("#ct-err"); err.innerHTML = "";
      const g = f.querySelector("[name=guests]:checked");
      const bad = antiSpam(f) || (!f.event_type.value ? "Please choose the event type." : !g ? "Please choose the number of guests." : !f.locality.value ? "Please choose the venue area." : !f.name.value.trim() ? "Please enter your name." : !validPhone(f.phone.value) ? "Please enter a valid 10-digit Indian mobile number." : !f.contact_method.value ? "Please choose a contact method." : !f.consent.checked ? "Please tick the consent box so we may contact you." : "");
      if (bad) { err.innerHTML = `<div class="err">${esc(bad)}</div>`; return; }
      f.querySelector("button[type=submit]").disabled = true;
      try {
        await S.insert({ kind: "catering", name: f.name.value.trim(), phone: cleanPhone(f.phone.value), email: f.email.value.trim() || null, contact_method: f.contact_method.value, locality: f.locality.value,
          source: srcGuess() || "website", campaign: attr().campaign || null, consent_followup: true, consent_promo: f.promo.checked, consent_text: M.CONSENT_TEXT, consent_at: new Date().toISOString(), privacy_version: M.PRIVACY_VERSION, status: "new_enquiry",
          answers: { event_type: f.event_type.value, event_date: f.event_date.value || null, guests: g.value, menu_req: f.menu_req.value.trim() || null, serving: f.serving.value || null, budget: f.budget.value || null, service_mode: f.service_mode.value || null, special: f.special.value.trim() || null } });
        markSub(); $("#ct-box").innerHTML = `<div class="ok"><h3>Enquiry received — thank you!</h3><p>This is an <strong>expression of interest, not a booking</strong>. We have not confirmed any date, menu or price. If we launch catering, we may contact you using the details you gave.</p><a class="btn" href="#/">Back to home</a></div>`;
      } catch (ex) { err.innerHTML = `<div class="err">${esc(ex.message)}</div>`; f.querySelector("button[type=submit]").disabled = false; }
    };
  }

  /* ---------- share / launch kit ---------- */
  const SHARE_MSG = () => `We're researching a new home-style vegetarian meal service for Mathura. Would you prefer a daily thali, a monthly tiffin subscription, or vegetarian catering for family events? Help us design the service and pricing by completing this short survey. This is a market-research pilot; orders are not yet being accepted.`;
  const link = (src, camp) => `${siteUrl()}?src=${src}&utm_campaign=${camp || "launch"}#/survey`;
  function qrSvg(url, cell) {
    try { if (!window.qrcode) return ""; const q = window.qrcode(0, "M"); q.addData(url); q.make(); return q.createSvgTag(cell || 5, 0); } catch (e) { return ""; }
  }
  function loadQR(cb) { if (window.qrcode) return cb(); const s = document.createElement("script"); s.src = "https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.js"; s.onload = cb; s.onerror = cb; document.head.appendChild(s); }
  function share(app) {
    const wa = link("whatsapp", "wa_groups"), ig = link("instagram", "insta_story"), qr = link("poster_qr", "poster");
    const msg = SHARE_MSG() + "\n\n" + wa;
    app.innerHTML = `<section><div class="wrap" style="max-width:760px"><h1>Share the survey</h1><p class="lead">Help us reach real neighbours. Each link below tags where people came from, so the owner can see which channel works.</p>
      ${!window.MMM_CONFIG.SITE_URL && location.protocol === "file:" ? `<div class="note">You are viewing a local file. Set <code>SITE_URL</code> in config.js after deployment so links and QR codes point to your live site.</div>` : ""}
      <div class="card"><h3>WhatsApp message</h3><textarea id="wa-msg" readonly rows="8" aria-label="WhatsApp message">${esc(msg)}</textarea>
        <div class="row" style="margin-top:10px"><a class="btn" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(msg)}">Share on WhatsApp</a><button class="btn ghost" id="copy">Copy message</button></div>
        <p class="small muted">Only share with people and groups you are allowed to message. Never add people to groups without their permission.</p></div>
      <div class="card" style="margin-top:14px"><h3>Short invitation for local groups</h3><p style="margin:0">🍛 <strong>Mathura friends</strong> — daily thali, monthly tiffin or vegetarian catering? Take our 3-minute survey and shape the service. Research only, no orders yet.<br><span class="small">${esc(wa)}</span></p></div>
      <div class="card" style="margin-top:14px"><h3>Instagram story concept (4 frames)</h3><ol style="margin:0;padding-left:20px"><li><strong>Hook:</strong> “Ghar jaisa khana — kya aap roz ke liye chahenge?” with a photo of your own kitchen or thali.</li><li><strong>Poll sticker:</strong> Daily thali / Monthly tiffin / Catering.</li><li><strong>Question sticker:</strong> “Kitne rupaye mein ek achhi thali theek lagegi?”</li><li><strong>Link sticker:</strong> “3-minute survey — orders not open yet” → <span class="small">${esc(ig)}</span></li></ol></div>
      <div class="card" style="margin-top:14px"><h3>QR code &amp; poster</h3><div id="qr-box" class="row"><div id="qr" style="width:160px"></div><div><p style="margin:0 0 8px" class="small">${esc(qr)}</p><a class="btn" href="#/poster">Open printable A4 poster</a></div></div></div></div></section>`;
    $("#copy").onclick = async () => { try { await navigator.clipboard.writeText(msg); $("#copy").textContent = "Copied ✓"; } catch (e) { $("#wa-msg").select(); } };
    loadQR(() => { const el = $("#qr"); if (el) el.innerHTML = qrSvg(qr, 4) || `<p class="small muted">QR needs internet to render. Use any QR generator with the link.</p>`; });
  }
  function poster(app) {
    const qr = link("poster_qr", "poster");
    app.innerHTML = `<section><div class="wrap"><div class="row noprint" style="margin-bottom:14px"><button class="btn" onclick="window.print()">Print / Save as PDF</button><a class="btn ghost" href="#/share">← Back</a></div>
      <div class="poster"><p class="tag" style="font-size:1.2rem">Mathura Meal Market</p><h1>Help us plan a better everyday meal for Mathura</h1>
      <p style="font-size:1.25rem">Daily thali? Monthly tiffin? Vegetarian catering?<br><strong>Tell us what you'd actually want — in 3 minutes.</strong></p>
      <div class="qr" id="pqr"></div><p><strong>Scan to take the survey</strong></p><p style="font-size:.95rem">${esc(qr)}</p>
      <p style="background:#FFF1D6;padding:10px;border-radius:8px"><strong>Market-research pilot.</strong> Orders are not yet being accepted. Your answers are private and used only to plan this service.</p></div></div></section>`;
    loadQR(() => { const el = $("#pqr"); if (el) el.innerHTML = qrSvg(qr, 8) || `<p class="muted">[QR code appears here when online]</p>`; });
  }

  /* ---------- privacy ---------- */
  function privacy(app) {
    const pc = window.MMM_CONFIG.PRIVACY_CONTACT;
    app.innerHTML = `<section><div class="wrap" style="max-width:760px"><h1>Privacy notice</h1><p class="muted">Version ${esc(M.PRIVACY_VERSION)}. This notice explains how Mathura Meal Market's launch research handles your information. It is a plain-language template and should be reviewed by the owner (and a legal adviser if needed) before launch.</p>
      <div class="card"><h3>What we collect</h3><ul><li>Survey answers (meal habits, interests, price ranges, area of Mathura).</li><li>Only if you choose to be contacted: your name or preferred name, mobile number, optional email and preferred contact method.</li><li>The time you consented and the wording you agreed to, and how you found the survey (e.g. WhatsApp, poster).</li><li>Anonymous page-visit counts. No advertising trackers are used by this site.</li></ul><p>We do <strong>not</strong> collect Aadhaar, payment-card details, passwords or precise GPS location, and we never ask for them.</p></div>
      <div class="card" style="margin-top:12px"><h3>Why we collect it</h3><p style="margin:0">To judge whether there is real demand for a vegetarian home-style meal service, to set fair prices, and — only with your consent — to contact you about a possible pilot. Answers are <em>stated interest</em>, not orders. We do not sell or share your data for advertising, and we do not buy contact lists or scrape numbers.</p></div>
      <div class="card" style="margin-top:12px"><h3>Who can see it</h3><p style="margin:0">Only the business owner and administrators they authorise, through a password-protected dashboard. Other visitors can never see anyone's answers.</p></div>
      <div class="card" style="margin-top:12px"><h3>Messages</h3><p style="margin:0">We will contact you only about this pilot, and only if you ticked the consent box. Promotional messages need a separate, optional tick. Nobody is added to a WhatsApp group without their permission. Tell us to stop and we will stop.</p></div>
      <div class="card" style="margin-top:12px"><h3>How long we keep it</h3><p style="margin:0">Contact details are kept for up to 12 months after collection, or until the pilot decision is made, whichever is sooner, then deleted. Anonymous answers may be kept longer for planning because they identify no one.</p></div>
      <div class="card" style="margin-top:12px"><h3>Your choices</h3><p style="margin:0">You can ask to see, correct, stop using, or delete your details at any time, by contacting <strong>${esc(pc)}</strong> with the mobile number you used. On a valid deletion request, your personal details are removed and only anonymous counts remain.</p></div>
      <div class="card" style="margin-top:12px"><h3>Where data is stored</h3><p style="margin:0">${S.live ? "In the owner's managed database (Supabase), protected by access rules so that visitors cannot read other people's data." : "This demo copy stores answers only inside your own browser. It is not connected to any database."}</p></div>
      <h3 style="margin-top:24px">Consent wording used in forms</h3><div class="note info">${esc(M.CONSENT_TEXT)}<br><br>${esc(M.PROMO_TEXT)}</div></div></section>`;
  }

  M.start = function () { window.addEventListener("hashchange", route); route(); };
  M.route = route; M.chrome = chrome; M.attr = attr; M.t = t;
})(window.MMM);
