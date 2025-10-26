window.addEventListener('message', function(event) {
    if (event.source === window && event.data.type === 'chatCommandInjection') {
        var options = Object.assign({}, globals2.game.options);
        options["variantName"] = event.data.payload;
        globals2.conn.send("tableUpdate", {"maxPlayers":globals2.game.maxPlayers, "name":globals2.game.name, "options":options, "tableId":globals2.tableID});
    }
});