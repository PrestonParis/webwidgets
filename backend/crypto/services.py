from typing import Any, Dict
import pandas as pd
import os
from dotenv import load_dotenv
from django.conf import settings
from datetime import datetime
import plotly.graph_objects as go
import requests
from pathlib import Path

# Fetch for crypto data, correlation between market cap and volume
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

# AlphaVantage Crypto Fetch
load_dotenv()
class AlphaVantageFetch:
    def __init__(self) -> None:
        self.myKey = os.getenv("ALPHA_VANTAGE_KEY")

    def fetch(self, func="TIME_SERIES_INTRADAY", symbol="AAPL", interval="5min") -> Dict[str, Any]:
        url = f'https://www.alphavantage.co/query?function={func}&symbol={symbol}&interval={interval}&apikey={self.myKey}'
        response = requests.get(url)
        response.raise_for_status() # Catch bad responses
        return response.json()

    def get_weekly_data(self,  symbol: str) -> Dict[str, Any]:
        data = self.fetch(func="TIME_SERIES_INTRADAY", symbol=symbol)
        # Handle API Errors
        if "Weekly Time Series" not in data:
            raise ValueError(f"API Error: {data.get('Note', 'Data Not Found')}")
        return self.parse(data)

    def parse(self, data) -> None:
        dataDict = dict(data["Weekly Time Series"])
        # Return the first entry as a dict
        first_key, first_value = next(iter(dataDict.items()))
        return {"date": first_key, "values": first_value}


