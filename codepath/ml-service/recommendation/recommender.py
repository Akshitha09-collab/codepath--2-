
import random

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

DIFFICULTY_RAMP = {
    "Weak": ["Easy", "Easy", "Medium", "Medium", "Medium"],
    "Medium": ["Medium", "Medium", "Hard", "Medium", "Hard"],
    "Strong": ["Hard", "Hard", "Medium", "Hard", "Medium"],
}

SKILL_PRIORITY = {"Weak": 0, "Medium": 1, "Strong": 2}


def _norm(value):
    return str(value or "").strip().casefold()


def _problem_id(problem):
    return problem.get(
        "problem_id",
        problem.get("problemId", problem.get("_id"))
    )


def _topic_problem_pool(problems, topic):
    return [
        p for p in problems
        if _norm(p.get("topic")) == _norm(topic)
    ]


def _difficulty_matches(problem, difficulty):
    return _norm(problem.get("difficulty")) == _norm(difficulty)


def _reason(topic, difficulty, skill_info, borrowed_from=None, retry=False):
    score = skill_info.get("performance_score", 0)
    level = skill_info.get("skill_level", "Medium")

    if retry:
        return (
            f"You previously struggled with this problem. "
            f"Retrying this {difficulty} {topic} problem helps "
            f"reinforce your skills. Performance score: {score}%."
        )

    if borrowed_from:
        return (
            f"Your {borrowed_from} skills are related to {topic}. "
            f"This {difficulty} problem helps you practise "
            f"connected concepts."
        )

    if level == "Weak":
        return (
            f"Your {topic} performance score is {score}%. "
            f"This {difficulty} problem helps strengthen "
            f"your fundamentals."
        )

    if level == "Medium":
        return (
            f"Your {topic} performance is developing "
            f"({score}%). This {difficulty} problem helps "
            f"consolidate the concept."
        )

    return (
        f"You're strong in {topic} ({score}%). "
        f"This {difficulty} problem helps extend your skills."
    )


def _make_recommendation(
    problem, topic, difficulty, skill_info,
    solved_ids, failed_ids, borrowed_from=None, retry=False
):
    pid = _problem_id(problem)

    return {
        "problem_id": pid,
        "title": problem.get("title", "Untitled problem"),
        "topic": problem.get("topic", topic),
        "difficulty": problem.get("difficulty", difficulty),
        "link": problem.get("link", ""),
        "tags": problem.get("tags", []),
        "previous_attempts": 1 if str(pid) in failed_ids else 0,
        "reason": _reason(
            topic, difficulty, skill_info,
            borrowed_from=borrowed_from,
            retry=retry
        ),
        "source_topic": topic,
        "is_retry": retry,
        "borrowed_from_topic": borrowed_from,
    }


def generate_recommendations(
    skill_levels, problems, solved_ids, failed_ids,
    top_n=5, target_topic=None
):
    if not skill_levels or not problems or top_n <= 0:
        return []

    solved_ids = {str(x) for x in (solved_ids or set())}
    failed_ids = {str(x) for x in (failed_ids or set())}

    topics_ranked = sorted(
        skill_levels.keys(),
        key=lambda topic: (
            SKILL_PRIORITY.get(
                skill_levels[topic].get("skill_level", "Medium"), 1
            ),
            skill_levels[topic].get("performance_score", 50),
        ),
    )

    if target_topic:
        matching = [
            topic for topic in topics_ranked
            if _norm(topic) == _norm(target_topic)
        ]
        topics_ranked = matching or [target_topic]

    recommendations = []
    used_ids = set()

    for topic in topics_ranked:
        if len(recommendations) >= top_n:
            break

        skill_info = skill_levels.get(
            topic,
            {"skill_level": "Medium", "performance_score": 50}
        )

        level = skill_info.get("skill_level", "Medium")
        ramp = DIFFICULTY_RAMP.get(level, DIFFICULTY_RAMP["Medium"])
        pool = _topic_problem_pool(problems, topic)

        fresh = [
            p for p in pool
            if _problem_id(p) is not None
            and str(_problem_id(p)) not in solved_ids
            and str(_problem_id(p)) not in used_ids
        ]

        needed = min(
            top_n - len(recommendations),
            len(ramp) if target_topic is None else top_n
        )

        picked = 0

        for difficulty in ramp:
            if picked >= needed or len(recommendations) >= top_n:
                break

            candidates = [
                p for p in fresh
                if _difficulty_matches(p, difficulty)
                and str(_problem_id(p)) not in used_ids
            ]

            retry = False
            borrowed_from = None

            # Retry previously failed problems when no fresh match exists.
            if not candidates:
                candidates = [
                    p for p in pool
                    if _problem_id(p) is not None
                    and str(_problem_id(p)) in failed_ids
                    and str(_problem_id(p)) not in solved_ids
                    and str(_problem_id(p)) not in used_ids
                    and _difficulty_matches(p, difficulty)
                ]
                retry = bool(candidates)

            # Borrow problems from related topics if necessary.
            if not candidates:
                related_topics = next(
                    (
                        values for key, values in TOPIC_SIMILARITY.items()
                        if _norm(key) == _norm(topic)
                    ),
                    []
                )

                for related in related_topics:
                    related_pool = _topic_problem_pool(problems, related)

                    related_candidates = [
                        p for p in related_pool
                        if _problem_id(p) is not None
                        and str(_problem_id(p)) not in solved_ids
                        and str(_problem_id(p)) not in used_ids
                        and _difficulty_matches(p, difficulty)
                    ]

                    if related_candidates:
                        candidates = related_candidates
                        borrowed_from = related
                        break

            if not candidates:
                continue

            choice = random.choice(candidates)
            pid = _problem_id(choice)

            used_ids.add(str(pid))
            picked += 1

            recommendations.append(
                _make_recommendation(
                    choice, topic, difficulty, skill_info,
                    solved_ids, failed_ids,
                    borrowed_from=borrowed_from,
                    retry=retry
                )
            )

    # Fallback: use any remaining unsolved problems if strict
    # topic/difficulty matching did not produce enough results.
    if len(recommendations) < top_n:
        remaining = [
            p for p in problems
            if _problem_id(p) is not None
            and str(_problem_id(p)) not in solved_ids
            and str(_problem_id(p)) not in used_ids
        ]

        random.shuffle(remaining)

        for problem in remaining:
            if len(recommendations) >= top_n:
                break

            topic = problem.get("topic", "General")

            skill_info = next(
                (
                    value for key, value in skill_levels.items()
                    if _norm(key) == _norm(topic)
                ),
                {"skill_level": "Medium", "performance_score": 50}
            )

            pid = _problem_id(problem)
            used_ids.add(str(pid))

            recommendations.append(
                _make_recommendation(
                    problem, topic,
                    problem.get("difficulty", "Medium"),
                    skill_info, solved_ids, failed_ids,
                    retry=str(pid) in failed_ids
                )
            )

    return recommendations[:top_n]


def generate_daily_practice(
    skill_levels, problems, solved_ids, failed_ids
):
    if not skill_levels or not problems:
        return []

    solved_ids = {str(x) for x in (solved_ids or set())}
    failed_ids = {str(x) for x in (failed_ids or set())}

    ranked = sorted(
        skill_levels.keys(),
        key=lambda topic: (
            SKILL_PRIORITY.get(
                skill_levels[topic].get("skill_level", "Medium"), 1
            ),
            skill_levels[topic].get("performance_score", 50),
        ),
    )

    daily = []
    used = set()

    def pick(topic, difficulty):
        pool = _topic_problem_pool(problems, topic)

        candidates = [
            p for p in pool
            if _problem_id(p) is not None
            and str(_problem_id(p)) not in solved_ids
            and str(_problem_id(p)) not in used
            and _difficulty_matches(p, difficulty)
        ]

        if not candidates:
            return None

        choice = random.choice(candidates)
        pid = _problem_id(choice)
        used.add(str(pid))

        skill_info = skill_levels.get(
            topic,
            {"skill_level": "Medium", "performance_score": 50}
        )

        return _make_recommendation(
            choice, topic, difficulty, skill_info,
            solved_ids, failed_ids,
            retry=str(pid) in failed_ids
        )

    if ranked:
        for difficulty in ("Easy", "Medium"):
            result = pick(ranked[0], difficulty)
            if result:
                daily.append(result)

    if len(ranked) >= 2:
        result = pick(ranked[1], "Easy")
        if result:
            daily.append(result)

    # Fallback if no exact daily topic/difficulty combination exists.
    if not daily:
        remaining = [
            p for p in problems
            if _problem_id(p) is not None
            and str(_problem_id(p)) not in solved_ids
            and str(_problem_id(p)) not in used
        ]

        random.shuffle(remaining)

        for problem in remaining[:3]:
            topic = problem.get("topic", "General")

            skill_info = next(
                (
                    value for key, value in skill_levels.items()
                    if _norm(key) == _norm(topic)
                ),
                {"skill_level": "Medium", "performance_score": 50}
            )

            daily.append(
                _make_recommendation(
                    problem, topic,
                    problem.get("difficulty", "Medium"),
                    skill_info, solved_ids, failed_ids,
                    retry=str(_problem_id(problem)) in failed_ids
                )
            )

    return daily[:3]