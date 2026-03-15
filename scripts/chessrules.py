# Uppercase = White
# Lowercase = Black

board = [
    ["r","n","b","q","k","b","n","r"],
    ["p","p","p","p","p","p","p","p"],
    [None,None,None,None,None,None,None,None],
    [None,None,None,None,None,None,None,None],
    [None,None,None,None,None,None,None,None],
    [None,None,None,None,None,None,None,None],
    ["P","P","P","P","P","P","P","P"],
    ["R","N","B","Q","K","B","N","R"]
]

move = {
    "from": (6,4),
    "to": (4,4),
    "piece": "P",
    "capture": None
}

print(board)