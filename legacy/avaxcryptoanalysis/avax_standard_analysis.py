import pandas as pd
from datetime import datetime
import plotly.graph_objects as go
from plotly.subplots import make_subplots

avaxPath = "AVAX_All_graph_coinmarketcap.csv"
avaxDF = pd.read_csv(avaxPath, sep=';')

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
    avaxDF['timestamp'] = avaxDF['timestamp'].apply(convert_date)
    # Add market cap/volume ratio
    avaxDF['marketCap/volume'] = avaxDF['marketCap'] / avaxDF['volume']
clean_data()

def plot_data() -> None:
    # Create the Candlestick Chart
    fig1 = go.Figure(data=[go.Candlestick(
        x=avaxDF['timestamp'],
        open=avaxDF['open'],
        high=avaxDF['high'],
        low=avaxDF['low'],
        close=avaxDF['close'],
        name='Candlestick'
    )])

    # Update layout for Candlestick chart
    fig1.update_layout(
        title='Candlestick Chart',
        xaxis_title='Date',
        yaxis_title='Price (USD)',
        template='plotly_dark'
    )

    # Show the Candlestick chart
    fig1.show()

    # Create the MarketCap/Volume Ratio Chart
    fig2 = go.Figure(
        go.Scatter(
            x=avaxDF['timestamp'],
            y=avaxDF['marketCap/volume'],
            mode='lines+markers',
            name='MarketCap/Volume Ratio',
        )
    )

    # Update layout for MarketCap/Volume Ratio chart
    fig2.update_layout(
        title='MarketCap/Volume Ratio',
        xaxis_title='Date',
        yaxis_title='MarketCap/Volume Ratio',
        template='plotly_dark'
    )

    # Show the MarketCap/Volume Ratio chart
    fig2.show()

plot_data()

def analyze_data() -> None:
    # Calculate correlation coefficient
    correlation = avaxDF[['marketCap/volume', 'high']].corr().iloc[0, 1]
    print(f"Correlation between marketCap/volume and price: {correlation}")
analyze_data()