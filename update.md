When there's a new update, you need to update some new characters yourself
Make this list as short as possible

char-id.json - Add the new character and their ID/dId (Description ID)
characters.json - Get new file and change the name of the trailblazer to "Trailblazer" and not "{NICKNAME}" (index_new)
descriptions.json - Get new file and add this:
,
    "0": {
        "id": "0",
        "title": "None",
        "desc": "N/A"
    }

Get new:
characters.json
character_promotions.json
character_skills.json
items.json
descriptions.json
light_cones.json




elements.json - If there are new elements, add it to this