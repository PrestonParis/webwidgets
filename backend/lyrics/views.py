from django.shortcuts import render
from django.http import JsonResponse
from .services import LyricAnalysis
import plotly.io as pio

# api/lyrics/?limit=x
analysis = LyricAnalysis()
def lyric_chart_data(request) -> JsonResponse:
    # Get lmit from query params
    try:
        limit = int(request.GET.get('lmit', 10))
    except:
        limit = 10

    fig, total_words = analysis.get_wordcount(limit)

    if fig is None:
        return JsonResponse({"error": "Lyrics file not found"}, status=404)
    
    return JsonResponse({
        "plot": pio.to_json(fig),
        "total_vocabulary_size": total_words
    })