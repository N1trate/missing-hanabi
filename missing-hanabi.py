#!/usr/bin/env python3
import requests
import websocket
import json
from bs4 import BeautifulSoup
import sys
import re
import json
import random

import config

def get_players():
    s = requests.Session()
    r = s.get("https://hanab.live/")
    for line in r.text.split('\n'):
        if line.startswith("<script"):
            info = re.search('<script type="text/javascript" src="/public/js/bundles/main.(\\d*).min.js"></script>', line)
            if info:
                version = str(info.group(1))
    r = s.post('https://hanab.live/login', data={"username":config.username,"password":config.password,"version":version})
    cookies = s.cookies.get_dict()

    players = []
    def on_message(ws, message):
        if not message.startswith("tableList "):
            return
        nonlocal players
        table_list = json.loads(message[10:])
        backup_table = [] 
        for table in table_list:
            if config.player in table['players']:
                if table['running'] == False:
                    players = table['players']
                    break
                else:
                    # Only keep the last of the backup tables
                    # Could keep the last based on the timestamp of the table to be more precise
                    backup_table = table['players']
        if not players:
            players = backup_table
        ws.close()

    ws = websocket.WebSocketApp("wss://hanab.live/ws",
                              cookie="; ".join(["%s=%s" %(i, j) for i, j in cookies.items()]),
                              on_message=on_message)

    ws.run_forever()
    return players, cookies

def augment_players(players, add_players, remove_players, ignore_players):
    replacement_players = ["n1trate", "n2trate", "n3trate", "n4trate", "n5trate", "n6trate"]
    
    [players.append(p) for p in add_players if p not in players]
    [players.remove(p) for p in remove_players if p in players]
    if len(players) > 6:
        print(f"Got too many players : {players}")
        exit()

    for p in ignore_players:
        if p in players:
            players.remove(p)
            players.append(replacement_players.pop(0))

    return players

def get_missing(players):
    r = requests.get(f"https://hanab.live/shared-missing-scores/{len(players)}/{'/'.join(players)}")

    soup = BeautifulSoup(r.text, features="html.parser")
    missings = []
    missings_html = soup.find_all("tr", {"class": "missing-scores-row"})
    for missing in missings_html:
        new_var = [x for x in [row.text.strip() for row in missing] if x != '']
        missings.append((new_var[0], float(new_var[-1])))
    return missings

def filter_missings(missings):
    exclusions = [x.lower() for x in config.EXCLUDE]
    filtered_missings = []
    for name, eff in missings:
        if eff < config.MIN_EFF or eff > config.MAX_EFF:
            continue
        name_lower = name.lower()
        if any([x in name_lower for x in exclusions]):
            continue
        filtered_missings.append((name, eff))
    return filtered_missings

def send_pm(variants, cookies):
    def on_open(ws):
        nonlocal variants
        for v in variants:
            msg = {"msg":f"@/sv {v[0]}@", "recipient":config.player, "room":""}
            ws.send(f"chatPM {json.dumps(msg)}")
        ws.close()
    ws = websocket.WebSocketApp("wss://hanab.live/ws",
                              cookie="; ".join(["%s=%s" %(i, j) for i, j in cookies.items()]),
                              on_open=on_open)
    ws.run_forever()

def main(add_players=[], remove_players=[], ignore_players=[]):
    valid = True
    if config.player == "": 
        print("Player name not found, please configure your player name")
        valid = False
    if config.username == "":
        print("Secondary account username not found, please configure your secondary account username")
        valid = False
    if config.password == "":
        print("Secondary account password not found, please configure your secondary account password")
        valid = False
    if not valid:
        exit()

    players, cookies = get_players()
    if add_players or remove_players or ignore_players:
        players = augment_players(players, add_players, remove_players, ignore_players)

    if not players:
        print(f"{config.player} not found, are you currently waiting in a pre-game? Did you use too many options?")
        exit()

    print(f"Using {players}")
    missings = get_missing(players)
    filtered_missings = filter_missings(missings)
    
    # May be better to send that to the table owner instead of the player, but that's a start
    # Also doesn't have to handle if the player isn't in a pre-game
    if type(config.SEND_PM) == int and config.SEND_PM != 0:
        if config.RANDOM_VARIANTS:
            selected_variants = random.sample(filtered_missings, config.SEND_PM)
        else:
            selected_variants = filtered_missings[:config.SEND_PM]
        send_pm(selected_variants, cookies)

    if type(config.PRINT_OPTIONS) == int and config.PRINT_OPTIONS != 0:
        if config.RANDOM_VARIANTS:
            selected_variants = random.sample(filtered_missings, config.PRINT_OPTIONS)
        else:
            selected_variants = filtered_missings[:config.PRINT_OPTIONS]
        for missing in selected_variants:
            print(missing[0])

if __name__ == "__main__":
    add_players = []
    remove_players = []
    ignore_players = []
    for p in sys.argv[1:]:
        if p[0] == '+':
            add_players.append(p[1:])
        elif p[0] == '-':
            remove_players.append(p[1:])
        else:
            ignore_players.append(p)
    main(add_players, remove_players, ignore_players)
