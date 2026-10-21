/* Owner dashboard: login, analytics, charts, lead management, CSV export, settings, feasibility calculator. */
(function (M) {
  const S = M.Store, esc = M.esc, inr = M.inr, $ = M.$;
  const A = { view: "real", data: null, tab: "overview", f: {}, sel: null, msg: "" };
  const LUNCH = ["daily_lunch", "monthly_lunch"], DINNER = ["daily_dinner", "monthly_dinner"];

  /* ---------- derived helpers ---------- */
  const ans = s => s.answers || {};
  const servicesOf = s => s.kind === "catering" ? ["catering"] : (ans(s).services || []).filter(k => k !== "none");
  const roleOf = s => s.kind === "catering" ? "event" : ans(s).role || "";
  const bandsOf = s => s.kind === "catering" ? (ans(s).budget ? [ans(s).budget] : []) : Object.values(ans(s).prices || {});
  const contactable = s => s.consent_followup && !["contact_requested_to_stop", "deleted"].includes(s.status) && !s.is_deleted;
  function qualified(s, st) {
    const q = st.qualify; if (s.is_deleted) return false;
    if (q.requireService && !servicesOf(s).length) return false;
    if (q.requireConsent && !contactable(s)) return false;
    if (q.requirePrice && !bandsOf(s).some(b => M.bandIdx(b) >= 2)) return false;
    if (q.minLikelihood && s.kind === "survey" && (ans(s).likelihood || 0) < q.minLikelihood) return false;
    if ((q.servedLocalities || []).length && !q.servedLocalities.some(l => (s.locality || "").toLowerCase().includes(l.toLowerCase()))) return false;
    return true;
  }
  const highIntent = s => s.kind === "survey" && (ans(s).likelihood || 0) >= 4 && contactable(s);
  const pilotWilling = s => s.answers && (ans(s).pilot === "yes" || ["pilot_invitation_requested", "pilot_confirmed"].includes(s.status)) && !s.is_deleted;
  const count = (arr, fn) => { const m = {}; arr.forEach(x => { const r = fn(x); (Array.isArray(r) ? r : [r]).forEach(k => { if (k !== undefined && k !== null && k !== "") m[k] = (m[k] || 0) + 1; }); }); return m; };
  const sorted = m => Object.entries(m).sort((a, b) => b[1] - a[1]);
  const pct = (a, b) => b ? Math.round(a / b * 100) + "%" : "—";

  function filtered() {
    const f = A.f, subs = A.data.subs;
    return subs.filter(s => {
      const d = (s.created_at || "").slice(0, 10);
      if (f.from && d < f.from) return false; if (f.to && d > f.to) return false;
      if (f.loc && (s.locality || "") !== f.loc && !(f.loc === "Other" && (s.locality || "").startsWith("Other"))) return false;
      if (f.svc && !servicesOf(s).includes(f.svc)) return false;
      if (f.price && !bandsOf(s).includes(f.price)) return false;
      if (f.role && roleOf(s) !== f.role) return false;
      if (f.status && s.status !== f.status) return false;
      return true;
    });
  }

  /* ---------- entry ---------- */
  M.renderAdmin = async function (app) {
    app.innerHTML = `<section><div class="wrap"><p class="muted">Loading…</p></div></section>`;
    let st; try { st = await S.authStatus(); } catch (e) { app.innerHTML = `<section><div class="wrap"><div class="err">Could not reach the database: ${esc(e.message)}</div></div></section>`; return; }
    if (!st.ok) return loginView(app, st);
    try { A.real = await S.loadReal(); } catch (e) { app.innerHTML = `<section><div class="wrap"><div class="err">${esc(e.message)}</div></div></section>`; return; }
    A.email = st.email; setView(A.view); draw(app);
  };
  function setView(v) { A.view = v; A.data = v === "demo" ? S.demo() : A.real; A.f = {}; A.sel = null; }

  function loginView(app, st) {
    const live = S.live;
    app.innerHTML = `<section><div class="wrap" style="max-width:460px"><h1>Owner login</h1>
      ${live ? (st.notAdmin ? `<div class="err">You are signed in as ${esc(st.email)} but are not on the administrator list.</div>` : "") : `<div class="note">${st.needsSetup ? "<strong>Demo mode — first time:</strong> choose a passcode for this browser." : "<strong>Demo mode:</strong> enter the passcode you chose."} This passcode only guards this browser's demo data and is <strong>not real security</strong>. Production uses Supabase Auth.</div>`}
      <form id="lg" class="form" style="margin-top:14px">${live ? `<div class="field"><label for="le">Email</label><input id="le" type="email" autocomplete="username" required></div>` : ""}
      <div class="field"><label for="lp">${live ? "Password" : "Passcode"}</label><input id="lp" type="password" autocomplete="${live ? "current-password" : "new-password"}" required></div>
      <div id="le-err"></div><button class="btn" type="submit">${live || !st.needsSetup ? "Sign in" : "Set passcode & sign in"}</button></form></div></section>`;
    $("#lg").onsubmit = async e => { e.preventDefault(); try { await S.login(live ? $("#le").value.trim() : null, $("#lp").value); M.renderAdmin(app); } catch (ex) { $("#le-err").innerHTML = `<div class="err">${esc(ex.message)}</div>`; } };
  }

  /* ---------- chart helper ---------- */
  function bars(title, pairs, cls, labelFn) {
    const max = Math.max(1, ...pairs.map(p => p[1]));
    return `<div class="card"><h3 style="font-size:1.05rem">${esc(title)}</h3>${pairs.length ? pairs.map(p => `<div class="bar ${cls || ""}"><span>${esc(labelFn ? labelFn(p[0]) : p[0])}</span><div class="t"><i style="width:${p[1] / max * 100}%"></i></div><b>${p[1]}</b></div>`).join("") : `<p class="muted small">No data yet.</p>`}</div>`;
  }

  /* ---------- main draw ---------- */
  function draw(app) {
    app = app || $("#app");
    const d = A.data, st = d.settings, demo = A.view === "demo";
    const tabs = [["overview", "Overview"], ["leads", "Leads"], ["analytics", "Analytics"], ["settings", "Criteria & spend"], ["calc", "Feasibility calculator"]];
    app.innerHTML = `<section><div class="wrap"><div class="row" style="justify-content:space-between"><h1 style="margin:0">Owner dashboard</h1>
      <div class="row"><span class="small muted">${esc(A.email || (S.live ? "" : "Demo mode"))}</span><button class="btn sm ghost" id="out">Sign out</button></div></div>
      ${!S.live ? `<div class="note" style="margin-top:10px"><strong>Demo mode:</strong> this dashboard reads only submissions saved in <em>this browser</em>. It is not a live database.</div>` : ""}
      <div class="row" style="margin:12px 0"><span class="lbl">Data shown:</span><div class="chips" role="radiogroup"><label class="chip"><input type="radio" name="vw" value="real" ${!demo ? "checked" : ""}><span>Real submissions</span></label><label class="chip"><input type="radio" name="vw" value="demo" ${demo ? "checked" : ""}><span>Labelled demo preview</span></label></div></div>
      ${demo ? `<div class="demo-tag">⚠ DEMO PREVIEW — fictional sample records generated to preview the charts. They are not real people, not real demand and are never mixed with real submissions.</div>` : ""}
      <div class="tabs" role="tablist">${tabs.map(t => `<button role="tab" aria-selected="${A.tab === t[0]}" data-tab="${t[0]}">${t[1]}</button>`).join("")}</div>
      <div id="tab"></div></div></section>`;
    $("#out").onclick = async () => { await S.logout(); M.renderAdmin(app); };
    app.querySelectorAll("[name=vw]").forEach(r => r.onchange = () => { setView(r.value); draw(app); });
    app.querySelectorAll("[data-tab]").forEach(b => b.onclick = () => { A.tab = b.dataset.tab; A.sel = null; draw(app); });
    ({ overview: tabOverview, leads: tabLeads, analytics: tabAnalytics, settings: tabSettings, calc: tabCalc })[A.tab]($("#tab"));
  }

  function filterBar() {
    const f = A.f, d = A.data;
    const locs = Array.from(new Set(d.subs.map(s => s.locality).filter(Boolean))).sort();
    const allSvc = M.SERVICES.filter(s => s.k !== "none").map(s => [s.k, s.l]);
    const allBands = [].concat(M.BANDS.thali, M.BANDS.monthly, M.BANDS.event);
    return `<div class="filters" id="fl"><div><label for="f-from">From</label><input id="f-from" type="date" value="${f.from || ""}"></div><div><label for="f-to">To</label><input id="f-to" type="date" value="${f.to || ""}"></div>
      <div><label for="f-loc">Locality</label><select id="f-loc"><option value="">All</option>${locs.map(l => `<option ${f.loc === l ? "selected" : ""}>${esc(l)}</option>`).join("")}</select></div>
      <div><label for="f-svc">Service</label><select id="f-svc">${'<option value="">All</option>' + allSvc.map(o => `<option value="${o[0]}" ${f.svc === o[0] ? "selected" : ""}>${esc(o[1])}</option>`).join("")}</select></div>
      <div><label for="f-price">Price band</label><select id="f-price"><option value="">All</option>${allBands.map(b => `<option value="${b[0]}" ${f.price === b[0] ? "selected" : ""}>${esc(b[1])}</option>`).join("")}</select></div>
      <div><label for="f-role">Customer type</label><select id="f-role"><option value="">All</option>${M.ROLES.map(r => `<option value="${r[0]}" ${f.role === r[0] ? "selected" : ""}>${esc(r[1])}</option>`).join("")}</select></div>
      <div><label for="f-status">Lead status</label><select id="f-status"><option value="">All</option>${M.STATUSES.map(r => `<option value="${r[0]}" ${f.status === r[0] ? "selected" : ""}>${esc(r[1])}</option>`).join("")}</select></div>
      <div style="align-self:end"><button class="btn sm ghost" id="f-clear" type="button">Clear filters</button></div></div>`;
  }
  function bindFilters(rerender) {
    const map = { "f-from": "from", "f-to": "to", "f-loc": "loc", "f-svc": "svc", "f-price": "price", "f-role": "role", "f-status": "status" };
    Object.keys(map).forEach(id => { const el = $("#" + id); if (el) el.onchange = () => { A.f[map[id]] = el.value; rerender(); }; });
    const c = $("#f-clear"); if (c) c.onclick = () => { A.f = {}; rerender(); };
  }

  /* ---------- overview ---------- */
  function funnel(subs, st) {
    const ev = A.data.events; const n = t => ev.filter(e => e.type === t).length;
    const interest = subs.filter(s => s.consent_followup && !s.is_deleted || s.kind === "launch_interest");
    const uniqPhones = new Set(subs.filter(contactable).map(s => s.phone_norm || s.phone || s.id));
    return { views: n("page_view"), starts: n("survey_start"), completed: n("survey_complete"), surveys: subs.filter(s => s.kind === "survey").length,
      interest: interest.length, unique: uniqPhones.size, qualified: subs.filter(s => qualified(s, st)).length, pilot: subs.filter(pilotWilling).length, paid: Number(st.paidOrders || 0), contactable: subs.filter(contactable).length };
  }
  function tabOverview(el) {
    const st = A.data.settings, subs = filtered(), fu = funnel(subs, st);
    const k = (v, l, z) => `<div class="kpi ${z ? "zero" : ""}"><b>${v}</b><span>${l}</span></div>`;
    const sv = subs.filter(s => s.kind !== "launch_interest");
    const svcCount = count(subs, s => servicesOf(s));
    const thaliBands = count(subs, s => Object.entries(ans(s).prices || {}).filter(([k]) => (M.svc(k).type === "thali")).map(([, v]) => v));
    const subsBy = pairs => pairs;
    el.innerHTML = `${filterBar()}<p class="small muted" style="margin:8px 0">Filters apply to submissions. Page views / survey starts are site-wide event counts and are not filtered. All figures are <strong>self-reported stated interest, not confirmed demand</strong>.</p>
    <h2 style="font-size:1.3rem">Funnel — what is measured vs. what is not</h2>
    <div class="kpis">${k(fu.views, "Page views (sessions)")}${k(fu.starts, "Survey starts")}${k(fu.completed, "Completed surveys (events)")}${k(fu.interest, "People who expressed interest")}${k(fu.qualified, "Qualified leads")}${k(fu.pilot, "Willing to join a pilot")}${k(fu.paid, "Actual paid orders", fu.paid === 0)}</div>
    <p class="small muted">Paid orders stay at 0 until real transactions are recorded. Nothing on this page predicts orders.</p>
    <div class="kpis" style="margin-top:12px">${k(subs.filter(s => s.kind === "survey").length, "Survey submissions")}${k(fu.unique, "Unique contactable people")}${k(fu.contactable, "Consent-based contactable leads")}${k(subs.filter(s => s.kind === "catering").length, "Catering enquiries")}${k(subs.filter(highIntent).length, "High-intent leads (likely ≥4 + consent)")}</div>
    <h2 style="font-size:1.3rem;margin-top:22px">Demand charts</h2><div class="charts">
      ${bars("Demand by service category", sorted(svcCount), "", k => M.svc(k).l)}
      ${bars("Preferred thali prices", M.BANDS.thali.map(b => [b[0], thaliBands[b[0]] || 0]), "terra", M.bandLabel)}
      ${bars("Intended order frequency", sorted(count(sv, s => ans(s).frequency)), "", k => (M.FREQ.find(x => x[0] === k) || [k, k])[1])}
      ${bars("Demand by locality", sorted(count(subs, s => s.locality)).slice(0, 12), "terra")}
      ${bars("Customer type", sorted(count(subs, s => roleOf(s))), "", k => (M.ROLES.find(x => x[0] === k) || [k, k])[1])}
      ${bars("Catering guest-count categories", M.GUESTS.map(g => [g[0], subs.filter(s => s.kind === "catering" && ans(s).guests === g[0]).length]), "terra", k => (M.GUESTS.find(x => x[0] === k) || [k, k])[1] + " guests")}</div>`;
    bindFilters(() => tabOverview(el));
  }

  /* ---------- analytics ---------- */
  function tabAnalytics(el) {
    const st = A.data.settings, subs = filtered(), fu = funnel(subs, st), svs = subs.filter(s => s.kind === "survey");
    const withMeals = svs.filter(s => ans(s).meals_per_week);
    const weekly = list => list.reduce((a, s) => a + (ans(s).people || 1) * ans(s).meals_per_week, 0);
    const hi = withMeals.filter(s => (ans(s).likelihood || 0) >= 4);
    const sub = subs.filter(s => servicesOf(s).some(k => M.svc(k).sub)).length, one = subs.filter(s => servicesOf(s).some(k => !M.svc(k).sub && k !== "none")).length;
    const spend = (st.spend || []).reduce((a, r) => a + Number(r.amount || 0), 0);
    const lunch = subs.filter(s => servicesOf(s).some(k => LUNCH.includes(k))).length, dinner = subs.filter(s => servicesOf(s).some(k => DINNER.includes(k))).length, both = subs.filter(s => servicesOf(s).includes("lunch_dinner")).length;
    const lik = count(svs, s => ans(s).likelihood);
    const exp = {}; svs.forEach(s => { const e = ans(s).experiment; if (e) { const r = exp[e.offer_id] = exp[e.offer_id] || { n: 0, yes: 0, maybe: 0, no: 0, price: e.shown_price }; r.n++; r[e.response]++; } });
    const chan = {}; subs.forEach(s => { const key = s.campaign || s.source || "unknown"; const c = chan[key] = chan[key] || { leads: 0, q: 0 }; if (contactable(s)) c.leads++; if (qualified(s, st)) c.q++; });
    const rowSp = r => Number(r.amount || 0);
    const tr = (a, b) => `<tr><th>${a}</th><td>${b}</td></tr>`;
    el.innerHTML = `${filterBar()}<div class="note info" style="margin:10px 0">Every number below is <strong>stated interest</strong> from self-selected respondents. It does not mean that many people will buy, and respondents are not a random sample of Mathura.</div>
    <div class="tbl"><table><tbody>
      ${tr("Survey completion rate", fu.starts ? pct(fu.completed, fu.starts) + ` <span class="muted">(${fu.completed} of ${fu.starts} starts; site-wide)</span>` : "— (no survey starts recorded)")}
      ${tr("High-intent leads", subs.filter(highIntent).length + ` <span class="muted">(answered “probably/definitely would” and consented)</span>`)}
      ${tr("Subscription vs one-time interest", `${sub} subscription-type · ${one} one-time-type <span class="muted">(a person can pick both)</span>`)}
      ${tr("Lunch vs dinner interest", `Lunch ${lunch} · Dinner ${dinner} · Lunch+dinner package ${both}`)}
      ${tr("Average stated meals per week (per person)", withMeals.length ? (withMeals.reduce((a, s) => a + ans(s).meals_per_week, 0) / withMeals.length).toFixed(1) + ` <span class="muted">(n=${withMeals.length})</span>` : "—")}
      ${tr("Potential weekly meals requested (stated)", `${weekly(withMeals)} all respondents · <strong>${weekly(hi)}</strong> from high-likelihood respondents only`)}
      ${tr("Potential monthly meal volume (stated)", `${Math.round(weekly(withMeals) * 4.33)} all · <strong>${Math.round(weekly(hi) * 4.33)}</strong> high-likelihood only <span class="muted">(weekly × 4.33; compare with your 30 meals/day plan = ~780/month)</span>`)}
      ${tr("Stated purchase likelihood", M.LIKELY.map(o => `${o[1]}: ${lik[o[0]] || 0}`).join(" · "))}
      ${tr("Campaign spend entered", spend ? inr(spend) : "None entered")}
      ${tr("Lead acquisition cost", spend && fu.contactable ? inr(Math.round(spend / fu.contactable)) + " per contactable lead" : "— (needs spend and leads)")}
      ${tr("Cost per qualified lead", spend && fu.qualified ? inr(Math.round(spend / fu.qualified)) : "— (needs spend and qualified leads)")}
      ${tr("Enquiry → pilot participation", fu.contactable ? pct(subs.filter(s => s.status === "pilot_confirmed").length, fu.contactable) + ` <span class="muted">(${subs.filter(s => s.status === "pilot_confirmed").length} confirmed of ${fu.contactable} contactable)</span>` : "—")}
      ${tr("Repeat purchase rate", fu.paid ? "Enter real order data to calculate" : "Not measurable — no real paid orders exist yet")}</tbody></table></div>
    <div class="charts" style="margin-top:18px">
      ${bars("Monthly plan price bands (26 meals)", M.BANDS.monthly.map(b => [b[0], count(subs, s => Object.entries(ans(s).prices || {}).filter(([k]) => M.svc(k).type === "monthly").map(([, v]) => v))[b[0]] || 0]), "terra", M.bandLabel)}
      ${bars("Catering budget per guest", M.BANDS.event.map(b => [b[0], count(subs, s => bandsOf(s).filter(x => x[0] === "e"))[b[0]] || 0]), "", M.bandLabel)}
      ${bars("Household size (people needing meals)", sorted(count(svs, s => { const p = ans(s).people; return p ? (p >= 5 ? "5+" : String(p)) : null; })))}
      ${bars("Intended launch timing", sorted(count(svs, s => ans(s).start)), "terra", k => (M.START.find(x => x[0] === k) || [k, k])[1])}
      ${bars("Lead source", sorted(count(subs, s => s.source)), "", k => (M.SOURCES.find(x => x[0] === k) || [k, k])[1])}</div>
    <h3 style="margin-top:20px">Price experiment (opt-in respondents only)</h3>
    <div class="tbl"><table><thead><tr><th>Offer shown</th><th>Respondents</th><th>Yes</th><th>Maybe</th><th>No</th><th>Yes %</th></tr></thead><tbody>${Object.keys(exp).sort().map(id => { const r = exp[id]; return `<tr><td>${esc(id)} (${inr(r.price)})</td><td>${r.n}</td><td>${r.yes}</td><td>${r.maybe}</td><td>${r.no}</td><td>${pct(r.yes, r.n)}</td></tr>`; }).join("") || `<tr><td colspan="6" class="muted">No experiment responses yet.</td></tr>`}</tbody></table></div>
    <p class="small muted">Small samples are noisy — treat differences as hints, not proof. Offers are randomly assigned and always shown as proposals, never guaranteed prices.</p>
    <h3 style="margin-top:20px">Cost by channel</h3>
    <div class="tbl"><table><thead><tr><th>Campaign / source</th><th>Contactable leads</th><th>Qualified</th><th>Spend</th><th>Cost / lead</th></tr></thead><tbody>${Object.keys(chan).map(key => { const sp = (st.spend || []).filter(r => (r.campaign || "").toLowerCase() === key.toLowerCase()).reduce((a, r) => a + rowSp(r), 0); return `<tr><td>${esc(key)}</td><td>${chan[key].leads}</td><td>${chan[key].q}</td><td>${sp ? inr(sp) : "—"}</td><td>${sp && chan[key].leads ? inr(Math.round(sp / chan[key].leads)) : "—"}</td></tr>`; }).join("") || `<tr><td colspan="5" class="muted">No data.</td></tr>`}</tbody></table></div>`;
    bindFilters(() => tabAnalytics(el));
  }

  /* ---------- leads ---------- */
  function tabLeads(el) {
    const st = A.data.settings, subs = filtered().slice().sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));
    const sel = A.sel && A.data.subs.find(s => s.id === A.sel);
    el.innerHTML = `${filterBar()}<div class="row" style="margin:12px 0;justify-content:space-between"><span><strong>${subs.length}</strong> record(s) · <strong>${subs.filter(contactable).length}</strong> contactable</span>
      <button class="btn sm" id="exp" ${A.view === "demo" ? "disabled" : ""}>Export consented leads (CSV)</button></div>
      ${A.view === "demo" ? `<p class="small muted">Export is disabled for demo preview data.</p>` : ""}
      ${A.msg ? `<div class="ok" style="margin-bottom:10px">${esc(A.msg)}</div>` : ""}
      <div class="tbl"><table><thead><tr><th>Date</th><th>Type</th><th>Name</th><th>Phone</th><th>Area</th><th>Interest</th><th>Likely</th><th>Status</th><th>Source</th><th></th></tr></thead><tbody>
      ${subs.slice(0, 300).map(s => `<tr class="click" data-id="${esc(s.id)}" tabindex="0" aria-label="Open lead"><td>${esc((s.created_at || "").slice(0, 10))}</td><td>${esc(s.kind)}${s.is_demo ? " (demo)" : ""}</td><td>${esc(s.name || "— anonymous —")}</td><td>${esc(s.phone || "")}</td><td>${esc(s.locality || "")}</td><td>${esc(servicesOf(s).map(k => M.svc(k).l).join(", "))}</td><td>${s.kind === "survey" ? esc(ans(s).likelihood || "") : ""}</td><td><span class="st">${esc(M.statusLabel(s.status))}</span>${s.duplicate_of ? ` <span class="st" title="Another submission with this phone number exists">dup</span>` : ""}${qualified(s, st) ? ` <span class="st" style="background:#E3F0E8">qualified</span>` : ""}</td><td>${esc(s.source || "")}${s.campaign ? " / " + esc(s.campaign) : ""}</td><td>›</td></tr>`).join("") || `<tr><td colspan="10" class="muted">No records match.</td></tr>`}</tbody></table></div>
      ${subs.length > 300 ? `<p class="small muted">Showing the latest 300. Use filters to narrow down.</p>` : ""}
      <div id="detail">${sel ? detail(sel) : ""}</div>`;
    bindFilters(() => tabLeads(el));
    el.querySelectorAll("tr[data-id]").forEach(r => { const open = () => { A.sel = r.dataset.id; A.msg = ""; tabLeads(el); const d = $("#detail"); if (d) d.scrollIntoView({ behavior: "smooth" }); }; r.onclick = open; r.onkeydown = e => { if (e.key === "Enter") open(); }; });
    const ex = $("#exp"); if (ex) ex.onclick = exportCsv;
    if (sel) bindDetail(sel, el);
  }
  function detail(s) {
    const a = ans(s), demo = A.view === "demo";
    return `<div class="card" style="margin-top:16px"><h3>${esc(s.name || "Anonymous respondent")} <span class="muted small">· ${esc(s.kind)} · ${esc((s.created_at || "").slice(0, 16).replace("T", " "))}</span></h3>
      <p class="small">Consent: ${s.consent_followup ? `<strong>yes</strong> (${esc((s.consent_at || "").slice(0, 16).replace("T", " "))}, privacy ${esc(s.privacy_version || "")}), promo: ${s.consent_promo ? "yes" : "no"}` : "<strong>no</strong> — do not contact"} ${s.duplicate_of ? " · ⚠ duplicate phone number — an earlier record exists" : ""}</p>
      <details><summary>Survey / enquiry answers</summary><pre style="white-space:pre-wrap;font-size:.8rem">${esc(JSON.stringify(a, null, 2))}</pre></details>
      <div class="form" style="margin-top:12px">
        <div class="field"><label for="d-st">Status</label><select id="d-st" ${demo ? "disabled" : ""}>${M.STATUSES.map(x => `<option value="${x[0]}" ${s.status === x[0] ? "selected" : ""}>${x[1]}</option>`).join("")}</select></div>
        <div class="field"><label for="d-lc">Last contact date</label><input id="d-lc" type="date" value="${esc(s.last_contact || "")}" ${demo ? "disabled" : ""}></div>
        <div class="field"><label for="d-na">Next action</label><input id="d-na" type="text" maxlength="200" value="${esc(s.next_action || "")}" ${demo ? "disabled" : ""}></div>
        <div class="field"><label for="d-nt">Notes</label><textarea id="d-nt" maxlength="1000" ${demo ? "disabled" : ""}>${esc(s.notes || "")}</textarea></div>
        <div class="row"><button class="btn" id="d-save" ${demo ? "disabled" : ""}>Save changes</button><button class="btn ghost" id="d-close">Close</button>
        <button class="btn danger sm" id="d-del" ${demo || s.is_deleted ? "disabled" : ""}>Process deletion request</button></div>
        <p class="small muted">Deletion removes name, phone, email, notes and free-text answers and marks the record “Deleted upon valid request”. Anonymous answers remain so counts stay honest. Choosing “Contact requested to stop” excludes the person from exports.</p></div></div>`;
  }
  function bindDetail(s, el) {
    $("#d-close").onclick = () => { A.sel = null; tabLeads(el); };
    $("#d-save").onclick = async () => {
      try { await S.update(s.id, { status: $("#d-st").value, last_contact: $("#d-lc").value || null, next_action: $("#d-na").value.trim() || null, notes: $("#d-nt").value.trim() || null });
        Object.assign(s, { status: $("#d-st").value, last_contact: $("#d-lc").value || null, next_action: $("#d-na").value.trim() || null, notes: $("#d-nt").value.trim() || null }); A.msg = "Saved."; tabLeads(el);
      } catch (e) { A.msg = "Could not save: " + e.message; tabLeads(el); }
    };
    $("#d-del").onclick = async () => {
      if (!confirm("Remove this person's personal details permanently? This cannot be undone.")) return;
      const a = Object.assign({}, ans(s)); delete a.barrier_text; delete a.menu_req; delete a.special;
      try { await S.anonymise(s.id, a); Object.assign(s, { name: null, phone: null, phone_norm: null, email: null, notes: null, next_action: null, consent_followup: false, consent_promo: false, status: "deleted", is_deleted: true, answers: a }); A.msg = "Personal details removed."; A.sel = null; tabLeads(el); } catch (e) { A.msg = "Could not delete: " + e.message; tabLeads(el); }
    };
  }
  function exportCsv() {
    const rows = filtered().filter(contactable);
    if (!rows.length) { alert("No consented, contactable leads match the current filters."); return; }
    if (!confirm(`Export ${rows.length} lead(s) containing personal contact details? Use them only for this pilot, store the file securely and delete it when no longer needed.`)) return;
    const cols = ["created_at", "kind", "name", "phone", "email", "contact_method", "locality", "source", "campaign", "services", "likelihood", "frequency", "start", "status", "last_contact", "next_action", "notes", "consent_promo"];
    const cell = v => { v = v == null ? "" : String(v); if (/^[=+\-@\t\r]/.test(v)) v = "'" + v; return '"' + v.replace(/"/g, '""') + '"'; };   // blocks spreadsheet formula injection
    const out = [cols.join(",")].concat(rows.map(s => cols.map(c => cell(c === "services" ? servicesOf(s).map(k => M.svc(k).l).join("; ") : c === "likelihood" || c === "frequency" || c === "start" ? ans(s)[c] : s[c])).join(",")));
    const blob = new Blob(["﻿" + out.join("\r\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "mathura-meal-market-leads-" + new Date().toISOString().slice(0, 10) + ".csv"; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }

  /* ---------- settings: qualified lead criteria, spend, paid orders ---------- */
  function tabSettings(el) {
    const st = A.data.settings, q = st.qualify, demo = A.view === "demo";
    el.innerHTML = `${demo ? `<p class="muted">Settings are not editable in the demo preview.</p>` : ""}
    <div class="card"><h3>What counts as a qualified lead?</h3><p class="muted small">Transparent rules, applied to every record. Change them and the dashboard updates.</p><div class="form">
      <label class="chk"><input type="checkbox" id="q-svc" ${q.requireService ? "checked" : ""}><span>Chose at least one service</span></label>
      <label class="chk"><input type="checkbox" id="q-price" ${q.requirePrice ? "checked" : ""}><span>Chose a plausible price range (not the lowest band)</span></label>
      <label class="chk"><input type="checkbox" id="q-con" ${q.requireConsent ? "checked" : ""}><span>Gave permission to follow up</span></label>
      <div class="field"><label for="q-lik">Minimum stated likelihood (surveys), 0 = ignore</label><select id="q-lik">${[0, 1, 2, 3, 4, 5].map(n => `<option ${q.minLikelihood === n ? "selected" : ""}>${n}</option>`).join("")}</select></div>
      <div class="field"><label for="q-loc">Localities you can serve (comma-separated; blank = any)</label><input id="q-loc" type="text" value="${esc((q.servedLocalities || []).join(", "))}" placeholder="Krishna Nagar, Holi Gate, Civil Lines"></div></div></div>
    <div class="card" style="margin-top:14px"><h3>Campaign spend</h3><p class="muted small">Enter what you spend. Use the same name as the campaign tag (e.g. <code>wa_groups</code>, <code>poster</code>, <code>insta_story</code>) to see cost per lead by channel.</p>
      <div id="sp-rows">${(st.spend || []).map((r, i) => spendRow(r, i)).join("")}</div><button class="btn sm ghost" id="sp-add" type="button">+ Add spend row</button></div>
    <div class="card" style="margin-top:14px"><h3>Actual paid orders</h3><p class="muted small">Keep this at 0 until real customers have really paid. It is deliberately separate from stated interest.</p><div class="field"><label for="po">Paid orders recorded</label><input id="po" type="number" min="0" value="${Number(st.paidOrders || 0)}"></div></div>
    <div class="row" style="margin-top:14px"><button class="btn" id="s-save" ${demo ? "disabled" : ""}>Save settings</button><span id="s-msg" class="small"></span></div>`;
    $("#sp-add").onclick = () => { st.spend = readSpend(); st.spend.push({ campaign: "", amount: "" }); tabSettings(el); };
    el.querySelectorAll("[data-rm]").forEach(b => b.onclick = () => { st.spend = readSpend(); st.spend.splice(Number(b.dataset.rm), 1); tabSettings(el); });
    $("#s-save").onclick = async () => {
      st.qualify = { requireService: $("#q-svc").checked, requirePrice: $("#q-price").checked, requireConsent: $("#q-con").checked, minLikelihood: Number($("#q-lik").value), servedLocalities: $("#q-loc").value.split(",").map(x => x.trim()).filter(Boolean) };
      st.spend = readSpend().filter(r => r.campaign || r.amount); st.paidOrders = Math.max(0, Number($("#po").value) || 0);
      try { await S.saveSettings(st); $("#s-msg").textContent = "Saved ✓"; } catch (e) { $("#s-msg").textContent = "Could not save: " + e.message; }
    };
  }
  const spendRow = (r, i) => `<div class="row sp" style="margin-bottom:8px"><input type="text" placeholder="campaign tag" value="${esc(r.campaign)}" data-c aria-label="Campaign tag" style="max-width:220px"><input type="number" min="0" placeholder="₹ spent" value="${esc(r.amount)}" data-a aria-label="Amount spent" style="max-width:140px"><button class="btn sm ghost" type="button" data-rm="${i}">Remove</button></div>`;
  const readSpend = () => Array.from(document.querySelectorAll(".sp")).map(r => ({ campaign: r.querySelector("[data-c]").value.trim(), amount: r.querySelector("[data-a]").value }));

  /* ---------- feasibility calculator ---------- */
  const CALC_FIELDS = [["meals", "Meals sold per day", 1], ["days", "Operating days per month", 1], ["price", "Average selling price (₹/meal)", 1], ["ingr", "Ingredients per meal (₹)", 1], ["pack", "Packaging per meal (₹)", 1], ["waste", "Wastage (% of ingredients)", 1], ["deliv", "Delivery expense per meal (₹)", 1],
    ["cook", "Cook salary (₹/month)", 1], ["helper", "Helper salary (₹/month)", 1], ["gas", "Gas & electricity (₹/month)", 1], ["rent", "Rent (₹/month)", 1], ["mkt", "Marketing (₹/month)", 1], ["other", "Other overheads (₹/month)", 1], ["buffer", "Working-capital buffer (months of costs)", 0.5]];
  const CALC_DEFAULT = {
    conservative: { meals: 20, days: 26, price: 105, ingr: 45, pack: 8, waste: 12, deliv: 8, cook: 15000, helper: 8000, gas: 4000, rent: 6000, mkt: 3000, other: 2000, buffer: 1 },
    base: { meals: 30, days: 26, price: 110, ingr: 45, pack: 8, waste: 8, deliv: 8, cook: 15000, helper: 8000, gas: 4000, rent: 6000, mkt: 3000, other: 2000, buffer: 1 },
    optimistic: { meals: 40, days: 26, price: 115, ingr: 44, pack: 8, waste: 6, deliv: 8, cook: 15000, helper: 8000, gas: 4000, rent: 6000, mkt: 3000, other: 2000, buffer: 1 } };
  function calc(v) {
    const varMeal = v.ingr * (1 + v.waste / 100) + v.pack + v.deliv, contrib = v.price - varMeal, monthlyMeals = v.meals * v.days;
    const revenue = monthlyMeals * v.price, variable = monthlyMeals * varMeal, fixed = v.cook + v.helper + v.gas + v.rent + v.mkt + v.other, profit = revenue - variable - fixed;
    return { varMeal, contrib, revenue, variable, fixed, profit, be: contrib > 0 ? fixed / (contrib * v.days) : Infinity, wc: v.buffer * (variable + fixed) };
  }
  function tabCalc(el) {
    let sc = S.ls.get("mmm_calc", null) || JSON.parse(JSON.stringify(CALC_DEFAULT)); let cur = A.calcScenario || "base";
    const draw = () => {
      const v = sc[cur]; const R = { conservative: calc(sc.conservative), base: calc(sc.base), optimistic: calc(sc.optimistic) };
      const rs = (n, f) => `<td class="${f ? (n >= 0 ? "res-good" : "res-bad") : ""}">${f === "m" ? inr(Math.round(n)) : f ? inr(Math.round(n)) : inr(Math.round(n))}</td>`;
      const be = x => isFinite(x) ? x.toFixed(1) + " meals/day" : "never (price below cost)";
      el.innerHTML = `<div class="note">All values are <strong>illustrative estimates</strong> for a 30-meal-per-day Mathura kitchen — replace them with your own quotes. This calculator is deliberately separate from customer data: it never uses survey responses as revenue.</div>
      <div class="chips" style="margin:14px 0" role="radiogroup" aria-label="Scenario">${["conservative", "base", "optimistic"].map(n => `<label class="chip"><input type="radio" name="sc" value="${n}" ${cur === n ? "checked" : ""}><span style="text-transform:capitalize">${n}</span></label>`).join("")}</div>
      <div class="calc">${CALC_FIELDS.map(f => `<div class="field"><label for="c-${f[0]}" class="small">${f[1]}</label><input id="c-${f[0]}" data-f="${f[0]}" type="number" inputmode="decimal" min="0" step="${f[2]}" value="${v[f[0]]}"></div>`).join("")}</div>
      <div class="row" style="margin:10px 0"><button class="btn sm ghost" id="c-reset">Reset to illustrative defaults</button></div>
      <div class="tbl"><table><thead><tr><th>Result (estimate)</th><th>Conservative</th><th>Base</th><th>Optimistic</th></tr></thead><tbody>
        <tr><th>Monthly revenue</th>${["conservative", "base", "optimistic"].map(n => rs(R[n].revenue)).join("")}</tr>
        <tr><th>Variable costs</th>${["conservative", "base", "optimistic"].map(n => rs(R[n].variable)).join("")}</tr>
        <tr><th>Fixed costs</th>${["conservative", "base", "optimistic"].map(n => rs(R[n].fixed)).join("")}</tr>
        <tr><th>Contribution per meal</th>${["conservative", "base", "optimistic"].map(n => `<td>${"₹" + R[n].contrib.toFixed(1)}</td>`).join("")}</tr>
        <tr><th>Monthly operating profit / (loss)</th>${["conservative", "base", "optimistic"].map(n => rs(R[n].profit, 1)).join("")}</tr>
        <tr><th>Break-even meals per day</th>${["conservative", "base", "optimistic"].map(n => `<td>${be(R[n].be)}</td>`).join("")}</tr>
        <tr><th>Working-capital requirement</th>${["conservative", "base", "optimistic"].map(n => rs(R[n].wc)).join("")}</tr></tbody></table></div>
      <p class="small muted">Working capital = buffer months × (variable + fixed costs). It excludes one-time equipment, deposits and licences. Edits are saved in this browser only.</p>`;
      el.querySelectorAll("[name=sc]").forEach(r => r.onchange = () => { cur = r.value; A.calcScenario = cur; draw(); });
      el.querySelectorAll("[data-f]").forEach(i => i.oninput = () => { sc[cur][i.dataset.f] = Number(i.value) || 0; S.ls.set("mmm_calc", sc); const keep = i.id, pos = i.selectionStart; draw(); const n = $("#" + keep); if (n) { n.focus(); try { n.setSelectionRange(pos, pos); } catch (e) {} } });
      $("#c-reset").onclick = () => { sc = JSON.parse(JSON.stringify(CALC_DEFAULT)); S.ls.set("mmm_calc", sc); draw(); };
    };
    draw();
  }
})(window.MMM);
