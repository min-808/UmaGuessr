import re
from collections import defaultdict

# regex patterns for the different log lines
start_pattern = re.compile(r"started a game with the correct answer being (.+)")
correct_pattern = re.compile(r"Answered by .* with .* \d+ hints, .* sec, \d+/\d+ points")
skip_pattern = re.compile(r"Skipped with .* points")
timeout_pattern = re.compile(r"No one answered, .* points")

def normalize_uma(name: str) -> str:
    """Remove extra markers like '(slash command)' from uma name."""
    return re.sub(r"\s*\*\*?\(slash command\)\*\*?", "", name).strip()

# dictionary to track stats
stats = defaultdict(lambda: {"total": 0, "wins": 0})

with open("bot (5).log", "r", encoding="utf-8") as f:
    current_uma = None
    for line in f:
        # check if game started
        start_match = start_pattern.search(line)
        if start_match:
            current_uma = normalize_uma(start_match.group(1).strip())
            stats[current_uma]["total"] += 1
            continue

        # check if correct
        if correct_pattern.search(line) and current_uma:
            stats[current_uma]["wins"] += 1
            current_uma = None
            continue

        # check if skipped or timed out -> still counts as played, but no win
        if (skip_pattern.search(line) or timeout_pattern.search(line)) and current_uma:
            current_uma = None
            continue

# print results
# print results sorted by descending win %
print(f"{'Uma':30} {'Total':>5} {'Wins':>5} {'Win %':>7}")
print("-" * 50)

# sort by win rate (wins/total)
sorted_stats = sorted(
    stats.items(),
    key=lambda item: (item[1]["wins"] / item[1]["total"]) if item[1]["total"] > 0 else 0,
    reverse=True
)

for uma, data in sorted_stats:
    total = data["total"]
    wins = data["wins"]
    win_rate = (wins / total * 100) if total > 0 else 0
    print(f"{uma:30} {total:5} {wins:5} {win_rate:7.2f}")

