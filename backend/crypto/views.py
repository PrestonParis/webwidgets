from django.shortcuts import render
from django.http import JsonResponse
from .services import get_avax_data, AlphaVantageFetch
import plotly.io as pio

# Create your views here.

# api/avax-stats/
def avax_chart_data(request) -> JsonResponse:
    fig, correlation = get_avax_data()

    # Convert Plotly figure into dict/JSON
    graph_json = pio.to_json(fig)

    return JsonResponse({
        "plot": graph_json,
        "correlation": correlation
    })

# api/alpha-vantage/
def get_alpha_vantage_data(request) -> JsonResponse:
    fetcher = AlphaVantageFetch()
    try:
        # Fetch Parsed data
        crypto_info = fetcher.get_weekly_data(symbol="BTC")
        return JsonResponse(crypto_info)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)