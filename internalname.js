list = require("./src/assets/global-list.json");

// API endpoint
const API_URL = "https://umapyoi.net/api/v1/character/list";

async function getIdByInternalName(nameEnInternal) {
    try {
        const fetch = (await import("node-fetch")).default; // dynamic import
        const res = await fetch(API_URL);
        const data = await res.json();

        const char = data.find(c => c.name_en_internal.toLowerCase() === nameEnInternal.toLowerCase());

        if (!char) {
            console.log(`No character found with name_en_internal: ${nameEnInternal}`);
            return;
        }

        console.log(nameEnInternal + ": " + char.id);
    } catch (err) {
        console.error("Error fetching character:", err);
    }
}

async function main() {
  for (let i = 0; i < list.length; i++) {
    if ("number" in list[i]) {
      console.log("ok v");
    } else {
        console.log("bad v")
    }
    await getIdByInternalName(list[i].names[0]);
  }
}

main();
