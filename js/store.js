/* Storage adapter. LIVE mode = Supabase (anon key + RLS). DEMO mode = this browser's localStorage only. */
window.MMM = window.MMM || {};
(function (M) {
  const C = window.MMM_CONFIG || {};
  const live = !!(C.SUPABASE_URL && C.SUPABASE_ANON_KEY);
  let sb = null;

  const ls = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }
  };
  const ss = {
    get(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} }
  };
  const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : "id-" + Date.now() + "-" + Math.random().toString(16).slice(2));
  const normPhone = p => String(p || "").replace(/\D/g, "").slice(-10);

  function loadScript(src) {
    return new Promise((res, rej) => { const s = document.createElement("script"); s.src = src; s.onload = res; s.onerror = () => rej(new Error("Could not load " + src)); document.head.appendChild(s); });
  }
  async function client() {
    if (sb) return sb;
    await loadScript("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js");
    sb = window.supabase.createClient(C.SUPABASE_URL, C.SUPABASE_ANON_KEY);
    return sb;
  }

  const DEFAULT_SETTINGS = {
    qualify: { requireService: true, requirePrice: true, requireConsent: true, minLikelihood: 3, servedLocalities: [] },
    spend: [],           // [{campaign, amount}]
    paidOrders: 0        // stays 0 until real transactions exist
  };

  const Store = {
    live,
    mode: live ? "live" : "demo",
    sessionId() { let s = ss.get("mmm_sid"); if (!s) { s = uuid(); ss.set("mmm_sid", s); } return s; },

    async insert(rec) {
      rec.id = rec.id || uuid();
      if (live) {
        const c = await client();
        const row = Object.assign({}, rec); delete row.phone_norm; delete row.duplicate_of;
        const { error } = await c.from("submissions").insert(row);
        if (error) throw new Error(error.message === "rate_limited" ? "Too many submissions from this number today. Please try again tomorrow." : error.message);
        return rec;
      }
      const all = ls.get("mmm_real_subs", []);
      rec.created_at = new Date().toISOString();
      rec.phone_norm = rec.phone ? normPhone(rec.phone) : null;
      const first = rec.phone_norm && all.find(r => r.phone_norm === rec.phone_norm && r.kind === rec.kind);
      rec.duplicate_of = first ? first.id : null;   // duplicates are kept and linked, never silently dropped
      all.push(rec);
      ls.set("mmm_real_subs", all);
      return rec;
    },

    async event(type, source) {
      const key = "mmm_ev_" + type;
      if (type === "page_view" && ss.get(key)) return;       // one page view per session
      if (type === "page_view") ss.set(key, "1");
      try {
        if (live) { const c = await client(); await c.from("page_events").insert({ type, source: source || null, session_id: Store.sessionId() }); }
        else { const e = ls.get("mmm_real_events", []); e.push({ type, source: source || null, created_at: new Date().toISOString() }); ls.set("mmm_real_events", e); }
      } catch (e) { /* analytics must never block the visitor */ }
    },

    // ---- admin ----
    async authStatus() {
      if (live) {
        const c = await client(); const { data } = await c.auth.getSession();
        if (!data.session) return { ok: false };
        const { data: rows } = await c.from("admins").select("user_id");
        return { ok: !!(rows && rows.length), email: data.session.user.email, notAdmin: !(rows && rows.length) };
      }
      return { ok: ss.get("mmm_demo_admin") === "1", needsSetup: !ls.get("mmm_demo_pass", null) };
    },
    async login(a, b) {
      if (live) {
        const c = await client(); const { error } = await c.auth.signInWithPassword({ email: a, password: b });
        if (error) throw new Error(error.message); return;
      }
      const h = await sha(b); const saved = ls.get("mmm_demo_pass", null);
      if (!saved) { if (!b || b.length < 6) throw new Error("Choose a passcode of at least 6 characters."); ls.set("mmm_demo_pass", h); }
      else if (saved !== h) throw new Error("Incorrect passcode.");
      ss.set("mmm_demo_admin", "1");
    },
    async logout() { if (live) { const c = await client(); await c.auth.signOut(); } else { try { sessionStorage.removeItem("mmm_demo_admin"); } catch (e) {} } },

    async loadReal() {
      if (live) {
        const c = await client();
        const [s, e, st] = await Promise.all([
          c.from("submissions").select("*").order("created_at", { ascending: false }).limit(5000),
          c.from("page_events").select("type,source,created_at").limit(50000),
          c.from("app_settings").select("*").eq("key", "main")
        ]);
        if (s.error) throw new Error(s.error.message);
        return { subs: s.data, events: e.data || [], settings: Object.assign({}, DEFAULT_SETTINGS, st.data && st.data[0] ? st.data[0].value : {}) };
      }
      return { subs: ls.get("mmm_real_subs", []), events: ls.get("mmm_real_events", []), settings: Object.assign({}, DEFAULT_SETTINGS, ls.get("mmm_settings", {})) };
    },
    async saveSettings(v) {
      if (live) { const c = await client(); const { error } = await c.from("app_settings").upsert({ key: "main", value: v, updated_at: new Date().toISOString() }); if (error) throw new Error(error.message); }
      else ls.set("mmm_settings", v);
    },
    async update(id, patch) {
      if (live) { const c = await client(); const { error } = await c.from("submissions").update(patch).eq("id", id); if (error) throw new Error(error.message); return; }
      const all = ls.get("mmm_real_subs", []); const r = all.find(x => x.id === id); if (r) Object.assign(r, patch); ls.set("mmm_real_subs", all);
    },
    // Valid deletion request: remove all personal data, keep an anonymous row so aggregate counts stay honest.
    async anonymise(id, answers) {
      const cleared = { name: null, phone: null, phone_norm: null, email: null, notes: null, next_action: null, consent_followup: false, consent_promo: false,
        status: "deleted", is_deleted: true, answers: answers };
      await Store.update(id, cleared);
    },

    // ---- clearly-labelled demo preview data (never mixed with real data) ----
    demo() {
      let seed = 42; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
      const pick = a => a[Math.floor(rnd() * a.length)];
      const subs = []; const now = Date.now();
      const sv = M.SERVICES.filter(s => s.k !== "none");
      for (let i = 0; i < 46; i++) {
        const kind = i < 38 ? "survey" : i < 44 ? "catering" : "launch_interest";
        const services = [pick(sv.filter(s => s.type !== "event")).k]; if (rnd() > .6) services.push(pick(sv).k);
        const prices = {}; services.forEach(k => { const t = M.svc(k).type; if (t) prices[k] = pick(M.BANDS[t])[0]; });
        const contact = rnd() > .35;
        subs.push({
          id: "demo-" + i, is_demo: true, kind, created_at: new Date(now - rnd() * 20 * 864e5).toISOString(),
          name: contact ? "Demo Person " + (i + 1) : null, phone: contact ? "90000" + String(10000 + i) : null, email: null,
          contact_method: contact ? pick(M.CONTACT_METHODS)[0] : null, locality: pick(M.LOCALITIES.slice(0, 8)),
          source: pick(M.SOURCES)[0], campaign: pick(["diwali_wa", "poster_oct", "insta_story", ""]),
          consent_followup: contact && rnd() > .2, consent_promo: false, status: pick(M.STATUSES.slice(0, 5))[0],
          notes: null, next_action: null, last_contact: null,
          answers: kind === "catering"
            ? { guests: pick(M.GUESTS)[0], event_type: pick(M.EVENT_TYPES)[0], budget: pick(M.BANDS.event)[0] }
            : { role: pick(M.ROLES)[0], services, prices, likelihood: 1 + Math.floor(rnd() * 5), people: 1 + Math.floor(rnd() * 4), meals_per_week: pick([3, 5, 6, 10, 12]),
                frequency: pick(M.FREQ)[0], start: pick(M.START)[0], pilot: pick(["yes", "maybe", "no"]) }
        });
      }
      const events = [];
      for (let i = 0; i < 310; i++) events.push({ type: "page_view", created_at: new Date(now - rnd() * 20 * 864e5).toISOString() });
      for (let i = 0; i < 74; i++) events.push({ type: "survey_start", created_at: new Date(now - rnd() * 20 * 864e5).toISOString() });
      for (let i = 0; i < 38; i++) events.push({ type: "survey_complete", created_at: new Date(now - rnd() * 20 * 864e5).toISOString() });
      return { subs, events, settings: JSON.parse(JSON.stringify(DEFAULT_SETTINGS)) };
    },
    ls, ss, normPhone, DEFAULT_SETTINGS
  };
  async function sha(s) { const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode("mmm:" + s)); return Array.from(new Uint8Array(b)).map(x => x.toString(16).padStart(2, "0")).join(""); }
  M.Store = Store;
})(window.MMM);
