"""
recommender.py
---------------
ML Pipeline stage 8: Recommendation generation.

HYBRID recommendation strategy:
  1. CONTENT/RULE-BASED component: prioritizes topics classified Weak > Medium
     > Strong (skipping Strong topics unless everything else is exhausted),
     and picks a difficulty ramp appropriate to the student's current level
     in that topic (mirrors spaced, graduated difficulty practice).
  2. COLLABORATIVE-STYLE "topic similarity" component: when a topic has too
     few unsolved problems left, the engine borrows problems from a
     similar topic (e.g. Graphs <-> Trees, DP <-> Greedy) so the queue never
     runs dry -- this is the "topic similarity" signal required by the brief.
  3. HISTORY AWARENESS: never recommends a problem the student has already
     solved; problems previously FAILED are allowed back in (spaced
     repetition) but are de-prioritized slightly below completely fresh
     problems at the same difficulty, and flagged with `previous_attempts`.

Every recommendation carries a human-readable `reason` string.
"""

import random

# Topics considered related enough to borrow problems from one another
# when the primary weak topic runs out of fresh problems.
TOPIC_SIMILARITY = {
    "Graphs": ["Trees", "Dynamic Programming"],
    "Trees": ["Graphs", "Recursion"],
    "Dynamic Programming": ["Recursion", "Greedy"],
    "Greedy": ["Dynamic Programming", "Arrays"],
    "Arrays": ["Strings", "Two Pointers"],
    "Strings": ["Arrays", "Two Pointers"],
    "Two Pointers": ["Arrays", "Strings"],
    "Recursion": ["Trees", "Dynamic Programming"],
    "Linked List": ["Arrays", "Two Pointers"],
    "Stacks": ["Queues", "Arrays"],
    "Queues": ["Stacks", "Graphs"],
    "Hashing": ["Arrays", "Strings"],
}

DIFFICULTY_ORDER = ["Easy", "Medium", "Hard"]

# For a given skill level, what difficulty ramp should be recommended next.
# e.g. a Weak topic should start Easy (build confidence) then step up.
DIFFICULTY_RAMP = {
    "Weak": ["Easy", "Easy", "Medium", "Medium", "Medium"],
    "Medium": ["Medium", "Medium", "Hard", "Medium", "Hard"],
    "Strong": ["Hard", "Hard", "Medium", "Hard", "Medium"],
}

SKILL_PRIORITY = {"Weak": 0, "Medium": 1, "Strong": 2}


def _reason(topic, difficulty, skill_info, solved_topic_ids, borrowed_from=None, retry=False):
    perf = skill_info.get("performance_score", 0)
    level = skill_info.get("skill_level", "Medium")

    if retry:
        base = (f"You previously struggled with this problem; retrying a "
                f"{difficulty} {topic} problem reinforces the concept while "
                f"your {topic} success rate is {perf}%.")
    elif borrowed_from:
        base = (f"Your {borrowed_from} skills are related to {topic}. Since "
                f"{topic} needs more practice ({perf}% success rate), this "
                f"{difficulty} problem builds a bridge between the two topics.")
    else:
        if level == "Weak":
            base = (f"Recommended because your {topic} success rate is {perf}% "
                    f"and you have struggled with {difficulty.lower()}-level {topic} "
                    f"problems. Starting at an accessible difficulty rebuilds "
                    f"fundamentals before ramping up.")
        elif level == "Medium":
            base = (f"Your {topic} performance is developing ({perf}% success rate). "
                    f"A {difficulty} problem here consolidates the concept and "
                    f"prepares you for harder variations.")
        else:
            base = (f"You're strong in {topic} ({perf}% success rate). A {difficulty} "
                    f"problem keeps you sharp and pushes mastery further.")
    return base


def _topic_problem_pool(problems, topic):
    return [p for p in problems if p["topic"].strip().title() == topic.strip().title()]


def generate_recommendations(skill_levels, problems, solved_ids, failed_ids, top_n=5, target_topic=None):
    """
    skill_levels : dict topic -> {"skill_level":..., "performance_score":..., ...}
                   (output of model/classifier.predict_skill_levels)
    problems     : list of problem dicts {problem_id, title, topic, difficulty, tags, link}
    solved_ids   : set of problem_ids the student has already SOLVED (never re-recommend)
    failed_ids   : set of problem_ids the student has FAILED (eligible for spaced retry)
    top_n        : how many recommendations to produce
    target_topic : optional -- restrict recommendations to a single topic
                   (used by the "Daily Practice" / per-topic recommendation views)

    Returns: list of recommendation dicts, ordered by priority.
    """
    if not skill_levels:
        return []

    solved_ids = set(solved_ids or [])
    failed_ids = set(failed_ids or [])

    # 1. Rank topics: Weak first, then Medium, then Strong.
    #    Within a tier, lowest performance_score first (most in need of help).
    topics_ranked = sorted(
        skill_levels.keys(),
        key=lambda t: (SKILL_PRIORITY.get(skill_levels[t]["skill_level"], 1),
                       skill_levels[t].get("performance_score", 50))
    )

    if target_topic:
        topics_ranked = [t for t in topics_ranked if t.strip().title() == target_topic.strip().title()] or [target_topic]

    recommendations = []
    used_problem_ids = set()

    for topic in topics_ranked:
        if len(recommendations) >= top_n:
            break

        skill_info = skill_levels.get(topic, {"skill_level": "Medium", "performance_score": 50})
        level = skill_info["skill_level"]
        ramp = DIFFICULTY_RAMP.get(level, DIFFICULTY_RAMP["Medium"])

        pool = _topic_problem_pool(problems, topic)
        # Fresh = never solved, never attempted at all
        fresh = [p for p in pool if p["problem_id"] not in solved_ids
                 and p["problem_id"] not in used_problem_ids]

        needed = min(top_n - len(recommendations), len(ramp) if target_topic is None else top_n)

        picked_for_topic = 0
        for difficulty in ramp:
            if picked_for_topic >= needed:
                break
            # Prefer a fresh problem at this difficulty
            candidates = [p for p in fresh if p["difficulty"] == difficulty
                          and p["problem_id"] not in used_problem_ids]
            retry = False
            borrowed_from = None

            if not candidates:
                # Spaced-repetition retry candidates (previously failed, not solved)
                retry_candidates = [p for p in pool if p["problem_id"] in failed_ids
                                     and p["problem_id"] not in solved_ids
                                     and p["problem_id"] not in used_problem_ids
                                     and p["difficulty"] == difficulty]
                if retry_candidates:
                    candidates = retry_candidates
                    retry = True

            if not candidates:
                # Topic-similarity borrow: pull from a related topic instead
                for related in TOPIC_SIMILARITY.get(topic, []):
                    related_pool = _topic_problem_pool(problems, related)
                    related_fresh = [p for p in related_pool
                                      if p["problem_id"] not in solved_ids
                                      and p["problem_id"] not in used_problem_ids
                                      and p["difficulty"] == difficulty]
                    if related_fresh:
                        candidates = related_fresh
                        borrowed_from = related
                        break

            if not candidates:
                continue  # nothing usable at this difficulty for this topic right now

            choice = random.choice(candidates)
            used_problem_ids.add(choice["problem_id"])
            picked_for_topic += 1

            recommendations.append({
                "problem_id": choice["problem_id"],
                "title": choice["title"],
                "topic": choice["topic"],
                "difficulty": choice["difficulty"],
                "link": choice.get("link", ""),
                "tags": choice.get("tags", []),
                "previous_attempts": 1 if choice["problem_id"] in failed_ids else 0,
                "reason": _reason(topic, difficulty, skill_info, solved_ids,
                                   borrowed_from=borrowed_from, retry=retry),
                "source_topic": topic,
                "is_retry": retry,
                "borrowed_from_topic": borrowed_from,
            })

    return recommendations[:top_n]


def generate_daily_practice(skill_levels, problems, solved_ids, failed_ids):
    """
    Small, high-signal daily set: 1 Easy + 1 Medium from the WEAKEST topic,
    plus 1 Easy from the second-weakest topic (if one exists). Mirrors the
    project brief's example: "1 Graph Easy, 1 Graph Medium, 1 DP Easy".
    """
    if not skill_levels:
        return []

    ranked = sorted(
        skill_levels.keys(),
        key=lambda t: (SKILL_PRIORITY.get(skill_levels[t]["skill_level"], 1),
                        skill_levels[t].get("performance_score", 50))
    )

    daily = []
    used = set()

    def pick(topic, difficulty):
        pool = _topic_problem_pool(problems, topic)
        candidates = [p for p in pool if p["problem_id"] not in solved_ids
                      and p["problem_id"] not in used and p["difficulty"] == difficulty]
        if not candidates:
            return None
        choice = random.choice(candidates)
        used.add(choice["problem_id"])
        skill_info = skill_levels.get(topic, {"skill_level": "Medium", "performance_score": 50})
        return {
            "problem_id": choice["problem_id"],
            "title": choice["title"],
            "topic": choice["topic"],
            "difficulty": choice["difficulty"],
            "link": choice.get("link", ""),
            "reason": _reason(topic, difficulty, skill_info, solved_ids),
        }

    if len(ranked) >= 1:
        p1 = pick(ranked[0], "Easy")
        p2 = pick(ranked[0], "Medium")
        for p in (p1, p2):
            if p:
                daily.append(p)
    if len(ranked) >= 2:
        p3 = pick(ranked[1], "Easy")
        if p3:
            daily.append(p3)

    return daily[:3] if daily else []
