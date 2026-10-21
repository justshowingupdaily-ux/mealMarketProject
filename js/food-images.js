/* =========================================================
   Mathura Meal Market — Food Image Catalogue
   Purpose: Map stable food IDs to individual images.
   ========================================================= */

(function (window) {
  "use strict";

  const IMAGE_BASE = "https://images.unsplash.com/";

  const image = (photoId, alt) => ({
    src: `${IMAGE_BASE}${photoId}?auto=format&fit=crop&w=800&q=80`,
    alt
  });

  const FOOD_IMAGES = {
    /* ---------------- DAILY THALIS ---------------- */

    "regular-thali": image(
      "photo-1546833999-b9f581a1996d",
      "Indian home-style vegetarian thali with traditional dishes"
    ),

    "special-thali": image(
      "photo-1547592180-85f173990554",
      "Special vegetarian meal with a variety of colourful dishes"
    ),

    /* ---------------- RICE MEALS ---------------- */

    "chole-chawal": {
      src: "https://plus.unsplash.com/premium_photo-1712678280102-2ca5d468020a?q=80&w=800&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D",
      alt: "Chole chawal served as an Indian vegetarian meal"
    },

    "rajma-chawal": image(
      "photo-1512621776951-a57141f2eefd",
      "Colourful meal presentation for the rajma chawal concept"
    ),

    "kadhi-chawal": image(
      "photo-1540420773420-3366772f4999",
      "Vegetarian meal presentation for the kadhi chawal concept"
    ),

    "dal-chawal": image(
      "photo-1547592180-85f173990554",
      "Simple Indian meal concept for dal chawal"
    ),

    "dal-tadka-rice": image(
      "photo-1546833999-b9f581a1996d",
      "Traditional Indian meal concept for dal tadka and rice"
    ),

    "paneer-rice": image(
      "photo-1512621776951-a57141f2eefd",
      "Vegetarian meal concept for paneer curry with rice"
    ),

    /* ---------------- LIGHT MEALS ---------------- */

    "curd-rice": image(
      "photo-1540420773420-3366772f4999",
      "Light vegetarian meal concept for curd rice"
    ),

    "ghee-khichdi": image(
      "photo-1547592180-85f173990554",
      "Comforting Indian meal concept for desi ghee khichdi"
    ),

    "moong-khichdi": image(
      "photo-1546833999-b9f581a1996d",
      "Indian vegetarian meal concept for moong dal khichdi"
    ),

    "simple-dal-rice": image(
      "photo-1512621776951-a57141f2eefd",
      "Simple vegetarian meal concept for dal and rice"
    ),

    /* ---------------- MONTHLY TIFFIN PLANS ---------------- */

    "breakfast-dinner-plan": image(
      "photo-1547592180-85f173990554",
      "Vegetarian meal concept for a breakfast and dinner tiffin plan"
    ),

    "lunch-dinner-plan": image(
      "photo-1546833999-b9f581a1996d",
      "Home-style vegetarian meal concept for a lunch and dinner plan"
    ),

    /* ---------------- VRAT & FESTIVALS ---------------- */

    "navratri-nine-day": image(
      "photo-1540420773420-3366772f4999",
      "Illustrative vegetarian meal presentation for a Navratri meal plan"
    ),

    "vrat-thali": image(
      "photo-1546833999-b9f581a1996d",
      "Illustrative Indian vegetarian thali for fasting days"
    ),

    "karwa-chauth": image(
      "photo-1547592180-85f173990554",
      "Illustrative vegetarian meal concept for Karwa Chauth"
    ),

    "ekadashi-meal": image(
      "photo-1512621776951-a57141f2eefd",
      "Illustrative meal concept for an Ekadashi fasting menu"
    ),

    "festival-meal": image(
      "photo-1540420773420-3366772f4999",
      "Illustrative vegetarian food concept for festival meals"
    ),

    /* ---------------- BULK & EVENT CATERING ---------------- */

    "pre-wedding": image(
      "photo-1546833999-b9f581a1996d",
      "Illustrative vegetarian food presentation for pre-wedding functions"
    ),

    "sundarkand": image(
      "photo-1547592180-85f173990554",
      "Illustrative vegetarian food concept for a Sundarkand gathering"
    ),

    "katha": image(
      "photo-1512621776951-a57141f2eefd",
      "Illustrative vegetarian food concept for religious gatherings"
    ),

    "birthday": image(
      "photo-1540420773420-3366772f4999",
      "Illustrative vegetarian food concept for birthdays and celebrations"
    ),

    "karwa-chauth-event": image(
      "photo-1546833999-b9f581a1996d",
      "Illustrative vegetarian food concept for a Karwa Chauth gathering"
    ),

    "navratri-event": image(
      "photo-1547592180-85f173990554",
      "Illustrative vegetarian food concept for a Navratri gathering"
    ),

    "family-function": image(
      "photo-1512621776951-a57141f2eefd",
      "Illustrative vegetarian food concept for family functions"
    )
  };

  /*
   * Freeze the catalogue to prevent accidental reassignment.
   * Existing food IDs are the keys; array positions are irrelevant.
   */
  window.MMM_FOOD_IMAGES = Object.freeze(FOOD_IMAGES);

})(window);
