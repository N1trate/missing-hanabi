# This is you, the player for which table you want to find some missing variants (surrounded by quotes)
player=""
# How many variants to send you through Personal/Direct messages (Don't use quotes)
# The player declared in the "player" variable will receive those direct messages on the hanabi website
SEND_PM=0
# How many variants to print to the console/terminal (Don't use quotes)
PRINT_OPTIONS=10
# Do you want to show variants in the order that the server returns, or randomly (True or False)
RANDOM_VARIANTS=True

# Please set your own secondary username and password (surrounded by quotes)
username=""
password=""

# Minimum and Maximum required efficiency wanted
# Those values are inclusive : [MIN_EFF, MAX_EFF]
MIN_EFF=0
MAX_EFF=1.24

# Configure this array of elements to hold any variant that you want to exclude
# The code is going to skip any variant which contain any of these strings (case-insensitive)
# You can add as many as you want as long as they are separated by a comma (,)
EXCLUDE=[
    "Null", 
    "Omni", 
    "Blind", 
    "Mute", 
    "Clue Starved", 
    "Up or Down", 
    "Throw It in a Hole", 
    "Cow & Pig", 
    "Duck"
]

# The following is not used for the execution of the script, but showcase other possible exclusions
# You can copy/paste them to the previous array if you want to use them
POSSIBLE_EXCLUSION=[
    "3 Suits", 
    "-Fives", 
    "-Ones", 
    "Pink", 
    "Mix", 
    "Ambiguous", 
    "Dual-Color", 
    "Alternating Clues", 
    "Synesthesia", 
    "Reversed", 
    "Critical Fours", 
    "Odds And Evens", 
    "Dark"
]
