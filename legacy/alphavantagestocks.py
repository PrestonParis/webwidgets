import json
from typing import Any
import requests

myKey="HRSRZ7Q2ZCT82TEA"

def fetch(func="TIME_SERIES_INTRADAY", symbol="AAPL", interval="5min", api_key=myKey) -> Any:
    url = f'https://www.alphavantage.co/query?function={func}&symbol={symbol}&interval={interval}&apikey={api_key}'
    r = requests.get(url)
    return r.json()

def main() -> json:
    try:
        output = fetch(func="TIME_SERIES_WEEKLY", symbol="BTC")
    except Exception as e:
        print(e)
    else:
        parse(output)

def parse(data) -> None:
    dataDict = dict(data["Weekly Time Series"])
    first_key, first_value = next(iter(dataDict.items()))
    print(first_key, first_value)

main()