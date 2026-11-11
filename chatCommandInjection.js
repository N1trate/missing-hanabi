window.addEventListener('message', function(event) {
    if (event.source === window && event.data.type === 'chatCommandInjection') {
        var game = globals2.game;
        var seated = game && game.players && game.players.some(function(player) { return player.you; });
        if (seated) {
            var options = Object.assign({}, game.settings.options);
            options.variantName = event.data.payload;
            var settings = Object.assign({}, game.settings, {"options": options});
            delete settings.replayGameId;
            delete settings.replayTurn;
            globals2.conn.send("tableUpdate", {"tableId":game.tableId, "settings":settings});
        } else {
            globals2.conn.send("chat", {"text": "@/sv " + event.data.payload + "@", "tableId": game? game.tableId : globals2.tableId});
        }
    }
});