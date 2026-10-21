/* Mathura Meal Market — configuration.
   Leave SUPABASE_* empty to run in DEMO MODE (data stays in this browser only).
   The anon key is SAFE to publish (access is limited by row-level security).
   NEVER put a Supabase service_role key in this file or anywhere in browser code. */
window.MMM_CONFIG = {
  SUPABASE_URL: "https://pscnwqpjapwofsnkrgis.supabase.co",
  SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzY253cXBqYXB3b2ZzbmtyZ2lzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI1NTE5OTYsImV4cCI6MjEwODEyNzk5Nn0.K48ghZXJgKYChq5co7APFyvNWuom0LHbIp_4GZlMafs",
  // Public site address used for the QR code, poster and share message. Leave "" to use the current page address.
  SITE_URL: "https://mathura-meal-market.vercel.app/",
  // Optional: your WhatsApp number for the "Questions?" link, digits only with country code, e.g. 919XXXXXXXXX
  WHATSAPP_CONTACT: "9286077990",
  PRIVACY_CONTACT: "justshowingupdaily@gmail.com", // shown in the privacy notice for access/deletion requests
  PRIVACY_VERSION: "v1-2026-10",
  LOCALITIES: ["Krishna Nagar","Holi Gate","Dhauli Pyau","Moti Kunj","Chandanvan","Bhuteshwar","Civil Lines","Govind Nagar","Vikas Nagar","Dampier Nagar","Vrindavan Road","Masani","Chhatikara","Jaisingh Pura","Other"]
};
