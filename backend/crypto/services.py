from typing import Any
import pandas as pd
import os
from django.conf import settings
from datetime import datetime
import plotly.graph_objects as go

def get_avax_data() -> tuple[go.Figure, float]:
    # Find CSV regardless of where server starts
    csv_path = os.path.join(settings.BASE_DIR, 'crypto', 'data', 'AVAX_All_graph_coinmarketcap.csv')
    df = pd.read_csv(csv_path, sep=';')

    # Cleaning Logic
    def convert_date(date: str) -> str:
        try:
            # With fractional seconds
            date_obj = datetime.strptime(date, "%Y-%m-%dT%H:%M:%S.%fZ")
        except ValueError:
            # Without fractional seconds
            date_obj = datetime.strptime(date, "%Y-%m-%dT%H:%M:%SZ")
        
        # Format: Jan 06, '25
        formatted_date = date_obj.strftime("%b %d, '%y")
        return formatted_date

    def clean_data() -> None:
        # Convert times col according to convert_date()
        df['timestamp'] = df['timestamp'].apply(convert_date)
        # Add market cap/volume ratio
        df['marketCap/volume'] = df['marketCap'] / df['volume']
    clean_data()

    # Create the Candlestick Chart
    fig = go.Figure(data=[go.Candlestick(
        x=df['timestamp'],open=df['open'],
        high=df['high'], low=df['low'],
        close=df['close'], name='Candlestick'
    )])

    # Calculate Correlation
    correlation = df[['marketCap/volume', 'high']].corr().iloc[0, 1]

    return fig, correlation

