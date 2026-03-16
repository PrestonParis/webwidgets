from django.shortcuts import render
from django.http import JsonResponse
from .services import get_avax_data
import plotly.io as pio

# Create your views here.

def avax_chart_data(request) -> JsonResponse:
    fig, correlation = get_avax_data()

    # Convert Plotly figure into dict/JSON
    graph_json = pio.to_json(fig)

    return JsonResponse({
        "plot": graph_json,
        "correlation": correlation
    })