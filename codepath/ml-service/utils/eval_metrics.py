"""
eval_metrics.py
---------------
Optional recommendation-quality metrics: Precision@K and Recall@K.

Definition used here (offline evaluation against a held-out set of problems
the student LATER solved, i.e. "relevant" items):
    Precision@K = (# recommended-and-later-solved) / K
    Recall@K    = (# recommended-and-later-solved) / (# relevant items total)

This is exposed via POST /evaluate/recommendations for demo/report purposes.
"""


def precision_at_k(recommended_ids, relevant_ids, k):
    if k <= 0:
        return 0.0
    top_k = recommended_ids[:k]
    hits = len(set(top_k) & set(relevant_ids))
    return round(hits / k, 4)


def recall_at_k(recommended_ids, relevant_ids, k):
    if not relevant_ids:
        return 0.0
    top_k = recommended_ids[:k]
    hits = len(set(top_k) & set(relevant_ids))
    return round(hits / len(relevant_ids), 4)


def evaluate(recommended_ids, relevant_ids, k_values=(3, 5, 10)):
    return {
        f"precision_at_{k}": precision_at_k(recommended_ids, relevant_ids, k)
        for k in k_values
    } | {
        f"recall_at_{k}": recall_at_k(recommended_ids, relevant_ids, k)
        for k in k_values
    }
