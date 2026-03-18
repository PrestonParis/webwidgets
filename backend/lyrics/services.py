# Eminem Most popular Lyrics Fetch 
# DATA_PATH = Path("eminem_lyrics/ALL_eminem.txt")

from collections import Counter
from pathlib import Path
import re
from typing import Dict
import plotly.graph_objects as go

class LyricAnalysis: 
    def __init__(self, path=None, filter_common=True) -> None:
        if path is None:
            # /backend/
            BASE_DIR = Path(__file__).resolve().parent.parent
            # backend/lyrics/data/ALL_eminem.txt
            self.DATA_PATH = BASE_DIR / "lyrics" / "data" / "ALL_eminem.txt"
        else:
            self.DATA_PATH = Path(path)
        
        self.filter_common = filter_common
        self.COMMON_WORDS = {"the", "a", "and", "is", "it", "in", "to", "of", "i", "you", "my", "me", "that"}

    def get_wordcount(self, limit) -> Dict[go.Figure, int]:
        '''Clean all lyrics (punctuation) and Generate a Counter Object for them'''
        if limit < 0 or limit > 500:
            limit = 10
        
        if not self.DATA_PATH.exists():
            print(f"Error: File {self.DATA_PATH} not found")
            return None, 0
        
        with open(self.DATA_PATH, 'r', encoding='utf-8') as f:
            text = f.read().lower()
        # [Chorus]
        text = re.sub(r'\[.*?\]', '', text)
        # Words only
        words = re.findall(r'\b\w+\b', text)

        if self.filter_common:
            filtered_words = [w for w in words if w not in self.COMMON_WORDS]
            counts = Counter(filtered_words).most_common(limit)
        else:
            counts = Counter(words)
        
        word_list = [item[0] for item in counts]
        freq_list = [item[1] for item in counts]

        # Plotly Bar Chart
        fig = go.Figure(data=[
            go.Bar(x=word_list, y=freq_list, marker_color='indianred')
            ])
        
        fig.update_layout(
            title=f"Top {limit} Words in Eminem's Discography",
            xaxis_title="Words",
            yaxis_title="Frequency",
            template="plotly_white"
        )

        return fig, len(words)