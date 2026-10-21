/* Static content, option lists and translations. No personal data here. */
window.MMM = window.MMM || {};
(function (M) {
  const C = window.MMM_CONFIG || {};
  M.PRIVACY_VERSION = C.PRIVACY_VERSION || "v1";
  M.LOCALITIES = C.LOCALITIES || ["Other"];

  M.CONSENT_TEXT = "I agree that my contact details and responses may be used to evaluate this proposed food service and, if I opt in, to contact me about the pilot.";
  M.PROMO_TEXT = "Optional: I also agree to receive occasional promotional messages (offers, menu updates) from Mathura Meal Market. I can opt out any time.";

  M.SERVICES = [
    { k: "daily_lunch",   l: "Daily lunch thali",           type: "thali",   sub: false, meal: true },
    { k: "daily_dinner",  l: "Daily dinner thali",          type: "thali",   sub: false, meal: true },
    { k: "monthly_lunch", l: "Monthly lunch subscription",  type: "monthly", sub: true,  meal: true },
    { k: "monthly_dinner",l: "Monthly dinner subscription", type: "monthly", sub: true,  meal: true },
    { k: "lunch_dinner",  l: "Lunch + dinner package",      type: "monthly", sub: true,  meal: true },
    { k: "family",        l: "Family meal plan",            type: "monthly", sub: true,  meal: true },
    { k: "office",        l: "Office meal supply",          type: "thali",   sub: true,  meal: true },
    { k: "student_pg",    l: "Student / PG tiffin",         type: "monthly", sub: true,  meal: true },
    { k: "catering",      l: "Small-event catering",        type: "event",   sub: false, meal: false },
    { k: "bulk",          l: "Bulk vegetarian meals",       type: "event",   sub: false, meal: false },
    { k: "none",          l: "Not interested at present",   type: null,      sub: false, meal: false }
  ];
  M.svc = k => M.SERVICES.find(s => s.k === k) || { k, l: k };

  M.BANDS = {
    thali:   [["t1","Below ₹90"],["t2","₹90–₹109"],["t3","₹110–₹129"],["t4","₹130–₹159"],["t5","₹160 or more"]],
    monthly: [["m1","Below ₹2,200 (under ₹85/meal)"],["m2","₹2,200–₹2,599 (₹85–₹99/meal)"],["m3","₹2,600–₹2,999 (₹100–₹115/meal)"],["m4","₹3,000–₹3,499 (₹115–₹134/meal)"],["m5","₹3,500 or more (₹135+/meal)"]],
    event:   [["e1","Below ₹100 per guest"],["e2","₹100–₹149"],["e3","₹150–₹199"],["e4","₹200–₹299"],["e5","₹300 or more"]]
  };
  M.bandLabel = id => { for (const t in M.BANDS) { const b = M.BANDS[t].find(x => x[0] === id); if (b) return b[1]; } return id; };
  // "Plausible" = not the lowest band (admin-tunable rule lives in settings)
  M.bandIdx = id => Number((id || "").slice(1)) || 0;

  M.ROLES = [["office","Office worker"],["shopkeeper","Shopkeeper"],["student","Student"],["pg","PG resident"],["household","Household / family"],["business","Business owner"],["event","Event organiser"],["other","Other"]];
  M.NEED_FOR = [["self","Myself"],["family","My family"],["employees","Employees / staff"],["event","An event"]];
  M.ARRANGE = [["home","Cook at home"],["cook","Hire a cook"],["tiffin","Buy tiffin meals"],["restaurant","Order from restaurants"],["mess","Mess / canteen"],["other","Other"]];
  M.SPEND = [["s1","Below ₹60"],["s2","₹60–₹89"],["s3","₹90–₹119"],["s4","₹120–₹159"],["s5","₹160 or more"]];
  M.PROBLEMS = [["price","Price"],["hygiene","Hygiene"],["taste","Taste"],["quality","Inconsistent quality"],["delivery","Delivery reliability"],["variety","Limited variety"],["portion","Portion size"],["other","Other"]];
  M.DELIVERY = [["delivery","Home / office delivery"],["pickup","I will collect"],["either","Either is fine"]];
  M.MEALTIME = [["lunch","Lunch"],["dinner","Dinner"],["both","Both"]];
  M.DIET = [["veg","Pure vegetarian"],["jain","Jain (no onion/garlic/root veg)"],["noog","No onion-garlic"],["lowoil","Low oil"],["protein","High protein"],["none","No special preference"]];
  M.DELIVERY_PRICE = [["incl","Include delivery in the price"],["sep","Charge delivery separately"],["pickup","I would collect (no delivery)"]];
  M.LIKELY = [[1,"Definitely not"],[2,"Probably not"],[3,"Not sure"],[4,"Probably would"],[5,"Definitely would"]];
  M.START = [["now","As soon as it starts"],["m1","Within 1 month"],["m3","In 1–3 months"],["explore","Just exploring"]];
  M.FREQ = [["daily","Every day"],["weekdays","Weekdays (Mon–Fri/Sat)"],["few","A few times a week"],["weekly","About once a week"],["occasional","Occasionally / events"]];
  M.BUDGET = [["b1","Below ₹1,500 / month"],["b2","₹1,500–₹2,499"],["b3","₹2,500–₹3,499"],["b4","₹3,500–₹4,999"],["b5","₹5,000 or more"]];
  M.BARRIERS = [["price","Price"],["trust","Not sure about hygiene / quality"],["taste","Taste may not suit me"],["variety","Not enough variety"],["delivery","Delivery area / timing"],["commit","Don't want a monthly commitment"],["home","Prefer home-cooked"],["other","Other"]];
  M.PILOT = [["yes","Yes"],["maybe","Maybe, tell me more"],["no","No"]];
  M.SOURCES = [["whatsapp","WhatsApp"],["instagram","Instagram"],["poster_qr","Local poster / QR code"],["direct","Direct sharing"],["referral","Referral"],["website","Website"],["other","Other"]];
  M.CONTACT_METHODS = [["whatsapp","WhatsApp"],["call","Phone call"],["sms","SMS"],["email","Email"]];
  M.STATUSES = [["new_enquiry","New enquiry"],["needs_follow_up","Needs follow-up"],["interested","Interested"],["pilot_invitation_requested","Pilot invitation requested"],["pilot_confirmed","Pilot confirmed"],["not_interested","Not interested"],["contact_requested_to_stop","Contact requested to stop"],["deleted","Deleted upon valid request"]];
  M.statusLabel = k => (M.STATUSES.find(s => s[0] === k) || [k, k])[1];
  M.GUESTS = [["g1","10–25"],["g2","26–50"],["g3","51–100"],["g4","101–200"],["g5","200+"]];
  M.EVENT_TYPES = [["family","Family function / puja"],["birthday","Birthday / small party"],["office","Office meeting / lunch"],["religious","Religious gathering"],["wedding","Wedding-related small function"],["other","Other"]];
  M.SERVING = [["boxes","Individual meal boxes"],["buffet","Buffet"],["thali","Thali service"],["undecided","Undecided"]];
  M.SERVICE_MODE = [["delivery","Delivery only"],["onsite","On-site service"],["either","Either"]];
  M.CATERING_RANGES = [
    ["Individual meal boxes","₹120–₹180 per guest (illustrative)"],
    ["Thali service","₹140–₹220 per guest (illustrative)"],
    ["Buffet","₹150–₹250 per guest (illustrative)"]
  ];

  // Price-experiment offers. Shown only to people who opt in; always described as a proposal.
  M.OFFERS = {
    thali:   [{ id: "T99", price: 99, text: "Everyday Thali (4 rotis, dal, sabzi, rice, salad, pickle) at ₹99" },
              { id: "T119", price: 119, text: "Everyday Thali (4 rotis, dal, sabzi, rice, salad, pickle) at ₹119" },
              { id: "T139", price: 139, text: "Everyday Thali (4 rotis, dal, sabzi, rice, salad, pickle) at ₹139" }],
    monthly: [{ id: "M2400", price: 2400, text: "Monthly lunch plan — 26 meals for ₹2,400 (≈₹92/meal)" },
              { id: "M2600", price: 2600, text: "Monthly lunch plan — 26 meals for ₹2,600 (₹100/meal)" },
              { id: "M2900", price: 2900, text: "Monthly lunch plan — 26 meals for ₹2,900 (≈₹112/meal)" }]
  };

  M.MENU = [
    { id: "everyday", cat: "thali", name: "Everyday Thali", price: 119, kind: "thali", items: ["4 medium whole-wheat rotis","Dal","Seasonal vegetable","Rice","Salad and pickle"], dishes: ["roti","dal","sabzi","rice"] },
    { id: "special",  cat: "thali", name: "Special Thali", price: 159, kind: "thali", items: ["4 rotis","Dal","Seasonal vegetable","Paneer or chole special","Rice, curd and salad"], dishes: ["roti","dal","paneer","rice","curd"] },
    { id: "rajma",    cat: "rice",  name: "Rajma / Chole Rice", price: 109, kind: "rice", items: ["Rice","Rajma or chole","Salad or curd"], dishes: ["rice","rajma","curd"] },
    { id: "khichdi",  cat: "light", name: "Light Khichdi Meal", price: 99, kind: "light", items: ["Moong dal khichdi","Curd","Seasonal accompaniment"], dishes: ["khichdi","curd","sabzi"] },
    { id: "monthly",  cat: "plan",  name: "Monthly Lunch Plan", price: 2600, unit: "26 meals", kind: "plan", items: ["26 lunches (Everyday Thali style)","Effective ≈ ₹100 per meal","Illustrative price — needs validation"], dishes: ["roti","dal","sabzi","rice"] }
  ];

  // ---- Hindi / Hinglish for the main interface (survey questions stay in simple English) ----
  M.I18N = {
    en: {
      nav_home: "Home", nav_menu: "Menu", nav_survey: "Survey", nav_catering: "Catering", nav_share: "Share", nav_privacy: "Privacy",
      coming: "Coming soon — currently conducting local market research.",
      hero_h: "Your Everyday Vegetarian Meal, Made Simple.",
      hero_p: "We are planning fresh, hygienic, home-style vegetarian meals for Mathura — daily thalis, monthly tiffins and small-event catering. Tell us what you actually need and what feels fair, before we open a kitchen.",
      cta_plan: "Help Us Plan Our Launch", cta_explore: "Explore Meals",
      svc_h: "What would you like to see?", svc_p: "Tap a service to tell us your interest. This is research — nothing is being sold yet.",
      why_h: "What we are planning to stand for", why_note: "These are commitments we intend to build the service around — not achievements already proven.",
      launch_h: "Get launch updates or join a future pilot", launch_btn: "Register my interest",
      tagline: "Ghar jaisa khana. Fresh, simple, dependable."
    },
    hi: {
      nav_home: "Home", nav_menu: "Menu", nav_survey: "Survey", nav_catering: "Catering", nav_share: "Share", nav_privacy: "Privacy",
      coming: "Jaldi aa raha hai — abhi hum local market research kar rahe hain.",
      hero_h: "Aapka Roz Ka Shakahari Khana, Aasaan Bana Diya.",
      hero_p: "Hum Mathura ke liye taza, saaf-suthra, ghar jaisa shakahari khana plan kar rahe hain — daily thali, monthly tiffin aur chhote events ki catering. Kitchen shuru karne se pehle bataiye aapko kya chahiye aur kaunsa daam theek lagta hai.",
      cta_plan: "Hamari Launch Planning Mein Madad Karein", cta_explore: "Menu Dekhein",
      svc_h: "Aap kya dekhna chahenge?", svc_p: "Apni ruchi batane ke liye kisi service par tap karein. Yeh research hai — abhi kuch bika nahi hai.",
      why_h: "Hum kin baaton par kaam karna chahte hain", why_note: "Yeh hamare irade hain jin par service banegi — abhi tak saabit ki hui uplabdhiyan nahi.",
      launch_h: "Launch updates payein ya pilot mein judein", launch_btn: "Meri ruchi darj karein",
      tagline: "Ghar jaisa khana. Fresh, simple, dependable."
    }
  };
})(window.MMM);
