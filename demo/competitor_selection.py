import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from xray_sdk import XRay
from xray_sdk.storage import JSONFileStorage

MOCK_PRODUCTS = [
    {"asin": "B0COMP01", "title": "HydroFlask 32oz Wide Mouth", "price": 44.99, "rating": 4.5, "reviews": 8932, "category": "Sports & Outdoors"},
    {"asin": "B0COMP02", "title": "Yeti Rambler 26oz", "price": 34.99, "rating": 4.4, "reviews": 5621, "category": "Sports & Outdoors"},
    {"asin": "B0COMP03", "title": "Replacement Lid for HydroFlask", "price": 12.99, "rating": 4.6, "reviews": 3421, "category": "Accessories"},
]

PRODUCT_TYPE_KEYWORDS = {
    "yoga mat": ["yoga mat", "exercise mat", "fitness mat", "yoga equipment", "workout mat"],
    "laptop stand": ["laptop stand", "desk stand", "laptop riser", "desk accessory", "computer stand"],
    "smartwatch": ["smartwatch", "activity tracker", "smart watch", "wearable device", "health monitor"],
    "water bottle": ["water bottle", "reusable bottle", "hydration bottle", "sports bottle"],
    "keyboard": ["keyboard", "gaming keyboard", "backlit keyboard", "wired keyboard", "typing keyboard"],
    "earbuds": ["earbuds", "wireless earbuds", "bluetooth earbuds", "audio earbuds", "portable headphones"],
    "headphones": ["headphones", "audio headphones", "studio headphones", "on-ear headphones", "bluetooth audio"],
    "lamp": ["desk lamp", "desk lighting", "table lamp", "office lamp", "task lighting"],
}

CATEGORY_KEYWORDS = {
    "Electronics": ["electronics", "electronic device", "tech product"],
    "Computer Accessories": ["computer accessories", "tech accessories", "desk accessories"],
    "Sports & Outdoors": ["sports equipment", "outdoor gear", "fitness products"],
    "Home & Office": ["home office", "office supplies", "desk accessories"],
}


def _deduplicate_keywords(keywords: list) -> list:
    seen = set()
    return [kw for kw in keywords if kw and (kw.lower() not in seen and not seen.add(kw.lower()))]


def _extract_capacity(words: list) -> str:
    for word in words:
        if any(unit in word.lower() for unit in ["oz", "ml", "liter"]):
            return word.lower()
    return None


def generate_keywords(title: str, category: str) -> tuple:
    title_lower = title.lower()
    words = title.split()
    keywords = [title_lower]
    matched_type = None
    matched_category = None
    extraction_method = None
    
    for product_type, base_keywords in PRODUCT_TYPE_KEYWORDS.items():
        if product_type in title_lower:
            matched_type = product_type
            keywords.extend(base_keywords)
            
            if product_type == "water bottle":
                material = "stainless steel" if "stainless" in title_lower else ("titanium" if "titanium" in title_lower else "plastic")
                capacity = _extract_capacity(words)
                keywords[1] = "insulated bottle" if "insulated" in title_lower else keywords[1]
                if material not in keywords:
                    keywords.insert(2, material)
                if capacity:
                    keywords.insert(3, capacity)
            
            extraction_method = "product_type_match"
            break
    
    if not extraction_method and category in CATEGORY_KEYWORDS:
        matched_category = category
        keywords.extend(CATEGORY_KEYWORDS[category])
        extraction_method = "category_match"
    
    if not extraction_method:
        extraction_method = "generic_word_combinations"
        for n in range(2, min(5, len(words) + 1)):
            keywords.append(" ".join(words[:n]))
    
    unique_keywords = _deduplicate_keywords(keywords)
    
    return unique_keywords, {
        "extraction_method": extraction_method,
        "matched_product_type": matched_type,
        "matched_category": matched_category,
        "keyword_count_before_dedup": len(keywords),
        "keyword_count_after_dedup": len(unique_keywords)
    }


def search_products(keyword: str, category: str = None, limit: int = 50) -> list:
    time.sleep(0.1)
    return MOCK_PRODUCTS[:limit]


def apply_filters(candidates: list, reference: dict) -> tuple:
    price_min = reference["price"] * 0.5
    price_max = reference["price"] * 2.0
    min_rating = 3.8
    min_reviews = 100
    
    evaluations = []
    qualified = []
    
    for candidate in candidates:
        passed_price = price_min <= candidate["price"] <= price_max
        passed_rating = candidate["rating"] >= min_rating
        passed_reviews = candidate["reviews"] >= min_reviews
        
        filter_results = {
            "price_range": {
                "passed": passed_price,
                "detail": f"${candidate['price']:.2f} {'is within' if passed_price else 'is outside'} ${price_min:.2f}-${price_max:.2f}"
            },
            "min_rating": {
                "passed": passed_rating,
                "detail": f"{candidate['rating']} {'>=' if passed_rating else '<'} {min_rating} threshold"
            },
            "min_reviews": {
                "passed": passed_reviews,
                "detail": f"{candidate['reviews']} {'>=' if passed_reviews else '<'} {min_reviews} minimum"
            }
        }
        
        is_qualified = passed_price and passed_rating and passed_reviews
        
        evaluations.append({
            "asin": candidate["asin"],
            "title": candidate["title"],
            "metrics": {"price": candidate["price"], "rating": candidate["rating"], "reviews": candidate["reviews"]},
            "filter_results": filter_results,
            "qualified": is_qualified
        })
        
        if is_qualified:
            qualified.append(candidate)
    
    return qualified, evaluations


def llm_relevance_evaluation(candidates: list, reference: dict) -> tuple:
    time.sleep(0.2)
    confirmed = []
    evaluations = []
    rejected = []
    
    reference_category = reference.get("category", "Sports & Outdoors")
    rejection_patterns = [
        ("accessory", "title contains 'accessory' - likely an accessory, not a main product"),
        ("replacement", "title contains 'replacement' - likely a replacement part, not a main product"),
    ]
    
    for candidate in candidates:
        title_lower = candidate["title"].lower()
        rejection_reasons = [
            reason for pattern, reason in rejection_patterns if pattern in title_lower
        ]
        
        if candidate["category"] != reference_category:
            rejection_reasons.append(f"category mismatch: '{candidate['category']}' != '{reference_category}'")
        
        is_competitor = not rejection_reasons
        eval_data = {
            "asin": candidate["asin"],
            "title": candidate["title"],
            "category": candidate["category"],
            "is_competitor": is_competitor,
            "confidence": 0.95 if is_competitor else 0.85
        }
        
        if rejection_reasons:
            eval_data["rejection_reasons"] = rejection_reasons
            rejected.append({"asin": candidate["asin"], "title": candidate["title"], "rejection_reasons": rejection_reasons})
        else:
            eval_data["accepted_reason"] = f"Passed all checks: main product in category '{reference_category}'"
        
        evaluations.append(eval_data)
        if is_competitor:
            confirmed.append(candidate)
    
    return confirmed, evaluations, rejected


def rank_and_select(candidates: list, reference: dict) -> tuple:
    if not candidates:
        return None, []
    
    RANKING_WEIGHTS = {"review_count": 0.5, "rating": 0.3, "price_proximity": 0.2}
    
    ranked = []
    for candidate in candidates:
        review_score = min(candidate["reviews"] / 10000.0, 1.0)
        rating_score = (candidate["rating"] - 3.0) / 2.0
        price_score = max(0, 1.0 - (abs(candidate["price"] - reference["price"]) / reference["price"]))
        total_score = RANKING_WEIGHTS["review_count"] * review_score + RANKING_WEIGHTS["rating"] * rating_score + RANKING_WEIGHTS["price_proximity"] * price_score
        
        ranked.append({
            "asin": candidate["asin"],
            "title": candidate["title"],
            "metrics": {"price": candidate["price"], "rating": candidate["rating"], "reviews": candidate["reviews"]},
            "score_breakdown": {"review_count_score": review_score, "rating_score": rating_score, "price_proximity_score": price_score},
            "total_score": total_score
        })
    
    ranked.sort(key=lambda x: x["total_score"], reverse=True)
    for i, item in enumerate(ranked, 1):
        item["rank"] = i
    
    return ranked[0] if ranked else None, ranked


def _build_keyword_reasoning(keywords: list, metadata: dict) -> str:
    method = metadata.get("extraction_method", "unknown")
    reasoning = f"Generated {len(keywords)} keywords using {method}"
    
    if metadata.get("matched_product_type"):
        reasoning += f" - matched product type: {metadata['matched_product_type']}"
    elif metadata.get("matched_category"):
        reasoning += f" - matched category: {metadata['matched_category']}"
    else:
        reasoning += " - used generic word combinations from title"
    
    return reasoning


def _build_filter_reasoning(total: int, passed: int, failed_by_filter: dict) -> str:
    failed = total - passed
    reasoning = f"Applied 3 filters to {total} candidates: {passed} passed, {failed} failed"
    
    summary = [f"{count} failed {name}" for name, count in failed_by_filter.items() if count > 0]
    if summary:
        reasoning += f" ({', '.join(summary)})"
    
    return reasoning


def _build_llm_reasoning(total: int, confirmed: int, rejection_summary: dict) -> str:
    removed = total - confirmed
    if removed > 0:
        reasons = [f"{count} due to {reason}" for reason, count in rejection_summary.items()]
        return f"Evaluated {total} candidates, removed {removed} false positives: {', '.join(reasons)}"
    return f"All {total} candidates passed relevance evaluation - no false positives detected"


def _build_ranking_reasoning(selected: dict, ranked_count: int) -> str:
    if selected:
        return f"Selected '{selected['title']}' (rank #{selected['rank']}, score: {selected['total_score']:.3f}) from {ranked_count} ranked candidates. Scoring weights: review_count 50%, rating 30%, price_proximity 20%"
    return f"No competitor selected: empty candidate list"


def _extract_failed_filters(evaluations: list) -> tuple:
    failed_by_filter = {"price_range": 0, "min_rating": 0, "min_reviews": 0}
    failed_candidates = []
    
    for eval_item in evaluations:
        if not eval_item["qualified"]:
            failed_filters = [name for name, result in eval_item["filter_results"].items() if not result["passed"]]
            for name in failed_filters:
                failed_by_filter[name] = failed_by_filter.get(name, 0) + 1
            failed_candidates.append({
                "asin": eval_item["asin"],
                "title": eval_item["title"],
                "failed_filters": failed_filters,
                "metrics": eval_item["metrics"]
            })
    
    return failed_by_filter, failed_candidates


def _extract_rejection_summary(rejected: list) -> dict:
    summary = {}
    for r in rejected:
        for reason in r["rejection_reasons"]:
            reason_key = reason.split(":")[0] if ":" in reason else reason
            summary[reason_key] = summary.get(reason_key, 0) + 1
    return summary


def _get_reference_summary(reference: dict, fields: list) -> dict:
    return {field: reference.get(field) for field in fields}


def find_competitor(reference_product: dict, xray: XRay) -> dict:
    exec_id = xray.start_execution(
        "competitor_selection",
        metadata={"reference_product_id": reference_product.get("asin", "UNKNOWN")}
    )
    
    try:
        step_start = time.time()
        keywords, keyword_metadata = generate_keywords(reference_product["title"], reference_product["category"])
        step_duration = (time.time() - step_start) * 1000
        
        xray.add_step(
            exec_id, "keyword_generation",
            inputs={"product_title": reference_product["title"], "category": reference_product["category"]},
            outputs={"keywords": keywords, "model": "gpt-4 (simulated)", "keyword_count": len(keywords)},
            reasoning=_build_keyword_reasoning(keywords, keyword_metadata),
            metadata=keyword_metadata,
            duration_ms=step_duration
        )
        
        step_start = time.time()
        all_candidates = []
        for keyword in keywords[:1]:
            all_candidates.extend(search_products(keyword, category=reference_product.get("category"), limit=3))
        
        unique_candidates = []
        seen = set()
        for c in all_candidates:
            if c["asin"] not in seen:
                seen.add(c["asin"])
                unique_candidates.append(c)
        step_duration = (time.time() - step_start) * 1000
        
        xray.add_step(
            exec_id, "candidate_search",
            inputs={"search_keyword": keywords[0], "category_filter": reference_product.get("category"), "limit": 3},
            outputs={
                "total_results_available": 2847,
                "candidates_fetched": len(unique_candidates),
                "status": "success" if unique_candidates else "no_results",
                "candidates": unique_candidates
            },
            reasoning=f"Searched using keyword '{keywords[0]}' in category '{reference_product.get('category')}': found {len(unique_candidates)} unique candidates (2847 total matches available - mock data)",
            duration_ms=step_duration
        )
        
        step_start = time.time()
        qualified, evaluations = apply_filters(unique_candidates, reference_product)
        step_duration = (time.time() - step_start) * 1000
        failed_by_filter, failed_candidates = _extract_failed_filters(evaluations)
        
        xray.add_step(
            exec_id, "apply_filters",
            inputs={
                "candidates_count": len(unique_candidates),
                "reference_product": _get_reference_summary(reference_product, ["asin", "title", "price", "category"]),
                "filter_criteria": {"price_range": {"min": reference_product["price"] * 0.5, "max": reference_product["price"] * 2.0}, "min_rating": 3.8, "min_reviews": 100}
            },
            outputs={
                "total_evaluated": len(unique_candidates),
                "passed": len(qualified),
                "failed": len(unique_candidates) - len(qualified),
                "status": "success" if qualified else "all_failed"
            },
            reasoning=_build_filter_reasoning(len(unique_candidates), len(qualified), failed_by_filter),
            metadata={
                "filters_applied": {
                    "price_range": {"min": reference_product["price"] * 0.5, "max": reference_product["price"] * 2.0, "rule": "0.5x - 2x of reference price"},
                    "min_rating": {"value": 3.8, "rule": "Must be at least 3.8 stars"},
                    "min_reviews": {"value": 100, "rule": "Must have at least 100 reviews"}
                },
                "evaluations": evaluations,
                "failed_by_filter": failed_by_filter,
                "failed_candidates": failed_candidates
            },
            duration_ms=step_duration
        )
        
        step_start = time.time()
        confirmed, llm_evaluations, rejected = llm_relevance_evaluation(qualified, reference_product)
        step_duration = (time.time() - step_start) * 1000
        rejection_summary = _extract_rejection_summary(rejected) if rejected else {}
        
        xray.add_step(
            exec_id, "llm_relevance_evaluation",
            inputs={
                "candidates_count": len(qualified),
                "reference_category": reference_product.get("category"),
                "model": "gpt-4 (simulated)"
            },
            outputs={
                "total_evaluated": len(qualified),
                "confirmed_competitors": len(confirmed),
                "false_positives_removed": len(qualified) - len(confirmed),
                "status": "success" if confirmed else "no_competitors_found"
            },
            reasoning=_build_llm_reasoning(len(qualified), len(confirmed), rejection_summary),
            metadata={"evaluations": llm_evaluations, "rejected_candidates": rejected, "rejection_summary": rejection_summary},
            duration_ms=step_duration
        )
        
        step_start = time.time()
        selected, ranked = rank_and_select(confirmed, reference_product)
        step_duration = (time.time() - step_start) * 1000
        RANKING_WEIGHTS = {"review_count": 0.5, "rating": 0.3, "price_proximity": 0.2}
        
        xray.add_step(
            exec_id, "rank_and_select",
            inputs={
                "candidates_count": len(confirmed),
                "reference_product": _get_reference_summary(reference_product, ["asin", "title", "price"]),
                "ranking_weights": RANKING_WEIGHTS
            },
            outputs={
                "selected_competitor": selected,
                "ranked_count": len(ranked),
                "status": "competitor_selected" if selected else "no_competitor_found"
            } if selected else {
                "selected_competitor": None,
                "ranked_count": 0,
                "status": "no_competitor_found",
                "reason": "no_candidates_available" if not confirmed else "ranking_failed"
            },
            reasoning=_build_ranking_reasoning(selected, len(ranked)),
            metadata={
                "ranking_criteria": {"primary": "review_count", "secondary": "rating", "tertiary": "price_proximity"},
                "ranking_weights": RANKING_WEIGHTS,
                "ranked_candidates": ranked
            },
            duration_ms=step_duration
        )
        
        return selected
        
    finally:
        xray.end_execution(exec_id)


if __name__ == "__main__":
    project_root = Path(__file__).parent.parent
    storage_path = str(project_root / "xray_storage")
    xray = XRay(storage=JSONFileStorage(storage_path=storage_path))
    
    reference_product = {
        "asin": "B0XYZ123",
        "title": "Stainless Steel Water Bottle 32oz Insulated",
        "price": 29.99,
        "rating": 4.2,
        "reviews": 1247,
        "category": "Sports & Outdoors"
    }
    
    competitor = find_competitor(reference_product, xray)
    
    if competitor:
        print(f"Selected Competitor: {competitor['title']}")
        print(f"Price: ${competitor['metrics']['price']:.2f}, Rating: {competitor['metrics']['rating']}★, Reviews: {competitor['metrics']['reviews']:,}, Score: {competitor['total_score']:.2f}")
    else:
        print("No qualified competitor found")
