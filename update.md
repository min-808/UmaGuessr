When there's a new update, you need to update some new characters yourself
Make this list as short as possible

char-id.json - Add the new character and their ID/dId (Description ID)
characters.json - Get new file and change the name of the trailblazer to "Trailblazer" and not "{NICKNAME}" (index_new)
descriptions.json - Get new file and add this:
,
    "0": {
        "id": "0",
        "title": "None",
        "desc": "None"
    }

Get new:
character_promotions.json
character_skills.json
items.json

Add new characters to drop down menu
elements.json - If there are new elements, add it to this

Commands with an a in front of them are being edited to test on test servers