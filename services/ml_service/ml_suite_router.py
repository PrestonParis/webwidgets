"""Routes: ML suite endpoints (news ranking, health trends, tasks, etc.)."""
import logging

import numpy as np
import pandas as pd
from scipy import stats as scipy_stats
from fastapi import APIRouter

import model_store
from schemas import (
    NewsRankRequest, NewsRankResponse, RankedNewsItem,
    HealthTrendRequest, HealthTrendResponse,
    DocumentClassifyRequest, DocumentClassifyResponse,
    TaskRankRequest, TaskRankResponse, RankedTaskItem,
    ContextSummarizeRequest, ContextSummarizeResponse,
    ChatIntentRequest, ChatIntentResponse,
    FinanceAnomalyRequest, FinanceAnomalyResponse, AnomalousTransaction,
    CommandRankRequest, CommandRankResponse, RankedCommandWorkstream,
    GenerateMemoryCardsRequest, GenerateMemoryCardsResponse, GeneratedMemoryCard,
    AccessibilityRemediationRequest, AccessibilityRemediationResponse, AccessibilityRemediation,
    CollaborationRiskRequest, CollaborationRiskResponse, CollaborationRiskItem,
    CreativeCanvasAnalyzeRequest, CreativeCanvasAnalyzeResponse, CreativeCanvasIssue,
)
from memory_card_generator import generate_cards, generate_drill_cards
from accessibility_advisor import advise as advise_accessibility
from collaboration_risk import detect_risks as detect_collaboration_risks
from creative_canvas_analyzer import analyze as analyze_canvas

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/rank-news")
async def rank_news(data: NewsRankRequest) -> NewsRankResponse:
    if model_store.news_ranker_model is None or not data.items:
        return NewsRankResponse(ranked=[RankedNewsItem(id=item.id, relevance_score=0.5) for item in data.items])
    try:
        topic_count = len(data.user_topics)
        rows = pd.DataFrame({"text": [f"{i.title} {i.description}" for i in data.items], "category": [i.category for i in data.items], "topic_count": [topic_count] * len(data.items), "cat_match": [1 if i.category in data.user_topics else 0 for i in data.items]})
        scores = model_store.news_ranker_model.predict(rows)
        ranked = sorted([RankedNewsItem(id=item.id, relevance_score=float(min(1.0, max(0.0, s)))) for item, s in zip(data.items, scores)], key=lambda r: r.relevance_score, reverse=True)
        return NewsRankResponse(ranked=ranked)
    except Exception as exc:
        logger.error(f"[rank-news] {exc}")
        return NewsRankResponse(ranked=[RankedNewsItem(id=item.id, relevance_score=0.5) for item in data.items])


@router.post("/analyze-trends")
async def analyze_trends(data: HealthTrendRequest) -> HealthTrendResponse:
    values = data.values
    if len(values) < 3:
        return HealthTrendResponse(metric=data.metric, trend_direction="stable", trend_strength=0.0, slope=0.0, r_value=0.0, significant=False)
    try:
        slope, _, r_value, p_value, _ = scipy_stats.linregress(range(len(values)), values)
        significant = p_value < 0.05
        direction = "up" if slope > 0.01 else ("down" if slope < -0.01 else "stable")
        if model_store.health_trend_model is not None:
            cv = float(np.std(values) / (abs(float(np.mean(values))) or 1))
            row = pd.DataFrame([{"slope": slope, "r_value": abs(r_value), "p_value": p_value, "std": float(np.std(values)), "cv": cv, "n_days": len(values), "metric": data.metric}])
            strength = float(min(1.0, max(0.0, model_store.health_trend_model.predict(row)[0])))
        else:
            strength = min(1.0, abs(float(r_value)))
        return HealthTrendResponse(metric=data.metric, trend_direction=direction, trend_strength=round(strength, 4), slope=round(float(slope), 6), r_value=round(float(abs(r_value)), 4), significant=significant)
    except Exception as exc:
        logger.error(f"[analyze-trends] {exc}")
        return HealthTrendResponse(metric=data.metric, trend_direction="stable", trend_strength=0.0, slope=0.0, r_value=0.0, significant=False)


@router.post("/classify-document")
async def classify_document(data: DocumentClassifyRequest) -> DocumentClassifyResponse:
    if model_store.document_classifier_model is None:
        return DocumentClassifyResponse(doc_type="unknown", confidence=0.0)
    try:
        proba = model_store.document_classifier_model.predict_proba([data.text])[0]
        classes = model_store.document_classifier_model.classes_
        top_idx = int(np.argmax(proba))
        alternatives = [{"doc_type": str(classes[i]), "confidence": round(float(proba[i]), 4)} for i in np.argsort(proba)[::-1][1:3]]
        return DocumentClassifyResponse(doc_type=str(classes[top_idx]), confidence=round(float(proba[top_idx]), 4), alternatives=alternatives)
    except Exception as exc:
        logger.error(f"[classify-document] {exc}")
        return DocumentClassifyResponse(doc_type="unknown", confidence=0.0)


@router.post("/rank-tasks")
async def rank_tasks(data: TaskRankRequest) -> TaskRankResponse:
    if model_store.task_priority_model is None or not data.tasks:
        return TaskRankResponse(ranked=[RankedTaskItem(id=t.id, urgency_score=0.5) for t in data.tasks])
    try:
        rows = pd.DataFrame({"title": [t.title for t in data.tasks], "category": [t.category for t in data.tasks], "priority": [t.priority for t in data.tasks], "days_until_due": [t.days_until_due for t in data.tasks], "is_blocked": [int(t.is_blocked) for t in data.tasks], "has_dependencies": [int(t.has_dependencies) for t in data.tasks]})
        scores = model_store.task_priority_model.predict(rows)
        ranked = sorted([RankedTaskItem(id=t.id, urgency_score=float(min(1.0, max(0.0, s)))) for t, s in zip(data.tasks, scores)], key=lambda r: r.urgency_score, reverse=True)
        return TaskRankResponse(ranked=ranked)
    except Exception as exc:
        logger.error(f"[rank-tasks] {exc}")
        return TaskRankResponse(ranked=[RankedTaskItem(id=t.id, urgency_score=0.5) for t in data.tasks])


@router.post("/summarize-context")
async def summarize_context(data: ContextSummarizeRequest) -> ContextSummarizeResponse:
    name = data.user_name or "you"
    topics = list(set(data.widget_types[:6]))
    topic_str = ", ".join(topics) if topics else "your workspace"
    summary = f"Context for {name}: active widgets include {topic_str}."
    if data.recent_queries:
        summary += f" Recent focus: {data.recent_queries[0]}."
    return ContextSummarizeResponse(summary=summary, topics=topics)


@router.post("/classify-intent")
async def classify_intent(data: ChatIntentRequest) -> ChatIntentResponse:
    if model_store.chat_intent_model is None:
        return ChatIntentResponse(intent="help", confidence=0.5)
    try:
        proba = model_store.chat_intent_model.predict_proba([data.text])[0]
        classes = model_store.chat_intent_model.classes_
        top_idx = int(np.argmax(proba))
        alternatives = [{"intent": str(classes[i]), "confidence": round(float(proba[i]), 4)} for i in np.argsort(proba)[::-1][1:3]]
        return ChatIntentResponse(intent=str(classes[top_idx]), confidence=round(float(proba[top_idx]), 4), alternatives=alternatives)
    except Exception as exc:
        logger.error(f"[classify-intent] {exc}")
        return ChatIntentResponse(intent="help", confidence=0.5)


@router.post("/detect-finance-anomalies")
async def detect_finance_anomalies(data: FinanceAnomalyRequest) -> FinanceAnomalyResponse:
    if model_store.finance_anomaly_model is None or not data.transactions:
        return FinanceAnomalyResponse(anomalies=[], anomaly_count=0)
    try:
        rows = pd.DataFrame({"merchant": [t.merchant for t in data.transactions], "category": [t.category for t in data.transactions], "amount": [t.amount for t in data.transactions]})
        scores = model_store.finance_anomaly_model.predict(rows)
        results = [AnomalousTransaction(id=txn.id, anomaly_score=round(float(min(1.0, max(0.0, s))), 4), is_anomaly=float(min(1.0, max(0.0, s))) > 0.6) for txn, s in zip(data.transactions, scores)]
        return FinanceAnomalyResponse(anomalies=results, anomaly_count=sum(1 for r in results if r.is_anomaly))
    except Exception as exc:
        logger.error(f"[detect-finance-anomalies] {exc}")
        return FinanceAnomalyResponse(anomalies=[], anomaly_count=0)


@router.post("/rank-command-workstreams")
async def rank_command_workstreams(data: CommandRankRequest) -> CommandRankResponse:
    if model_store.command_center_ranker_model is None or not data.workstreams:
        return CommandRankResponse(ranked=[RankedCommandWorkstream(id=w.id, attention_score=0.5) for w in data.workstreams])
    try:
        rows = pd.DataFrame({"title": [w.title for w in data.workstreams], "domain": [w.domain for w in data.workstreams], "status": [w.status for w in data.workstreams], "priority": [w.priority for w in data.workstreams], "progress": [w.progress for w in data.workstreams], "blockers": [w.blockers for w in data.workstreams], "automations": [w.automations for w in data.workstreams], "confidence": [w.confidence for w in data.workstreams], "due_hours": [w.due_hours for w in data.workstreams]})
        scores = model_store.command_center_ranker_model.predict(rows)
        ranked = sorted([RankedCommandWorkstream(id=w.id, attention_score=float(min(1.0, max(0.0, s)))) for w, s in zip(data.workstreams, scores)], key=lambda r: r.attention_score, reverse=True)
        return CommandRankResponse(ranked=ranked)
    except Exception as exc:
        logger.error(f"[rank-command-workstreams] {exc}")
        return CommandRankResponse(ranked=[RankedCommandWorkstream(id=w.id, attention_score=0.5) for w in data.workstreams])


@router.post("/generate-memory-cards")
async def generate_memory_cards(data: GenerateMemoryCardsRequest) -> GenerateMemoryCardsResponse:
    all_cards = []
    for item in data.items:
        cards = generate_drill_cards(item.steps, item.topic) if item.steps and item.topic else generate_cards(item.text, item.source_type, data.max_cards_per_item)
        for card in cards[:data.max_cards_per_item]:
            quality = None
            if model_store.memory_card_quality_model is not None:
                try:
                    quality = str(model_store.memory_card_quality_model.predict([f"{card['front']} [SEP] {card['back']}"])[0])
                except Exception:
                    pass
            all_cards.append({**card, "quality": quality})
    return GenerateMemoryCardsResponse(cards=[GeneratedMemoryCard(**c) for c in all_cards], total=len(all_cards))


@router.post("/advise-accessibility")
async def advise_accessibility_endpoint(data: AccessibilityRemediationRequest) -> AccessibilityRemediationResponse:
    if not data.issues:
        return AccessibilityRemediationResponse(remediations=[], total=0)
    try:
        results = advise_accessibility([i.model_dump() for i in data.issues])
        return AccessibilityRemediationResponse(remediations=[AccessibilityRemediation(**r) for r in results], total=len(results))
    except Exception as exc:
        logger.error(f"[advise-accessibility] {exc}")
        return AccessibilityRemediationResponse(remediations=[], total=0)


@router.post("/detect-collaboration-risk")
async def detect_collaboration_risk(data: CollaborationRiskRequest) -> CollaborationRiskResponse:
    try:
        risk_items = [CollaborationRiskItem(**r) for r in detect_collaboration_risks([h.model_dump() for h in data.handoffs], [w.model_dump() for w in data.workspaces])]
        return CollaborationRiskResponse(risks=risk_items, high_risk_count=sum(1 for r in risk_items if r.risk_score >= 0.6))
    except Exception as exc:
        logger.error(f"[detect-collaboration-risk] {exc}")
        return CollaborationRiskResponse(risks=[], high_risk_count=0)


@router.post("/analyze-creative-canvas")
async def analyze_creative_canvas(data: CreativeCanvasAnalyzeRequest) -> CreativeCanvasAnalyzeResponse:
    try:
        result = analyze_canvas([l.model_dump() for l in data.layers], data.canvas_width, data.canvas_height)
        return CreativeCanvasAnalyzeResponse(issues=[CreativeCanvasIssue(**i) for i in result["issues"]], recommended_format=result["recommended_format"], ready=result["ready"], visible_layer_count=result["visible_layer_count"], total_layer_count=result["total_layer_count"], export_blocked_count=result["export_blocked_count"])
    except Exception as exc:
        logger.error(f"[analyze-creative-canvas] {exc}")
        return CreativeCanvasAnalyzeResponse(issues=[], recommended_format="png", ready=False, visible_layer_count=0, total_layer_count=len(data.layers), export_blocked_count=0)
