window.addEventListener('message', function(event) {
    if (event.source === window && event.data.type === 'chatCommandInjection') {
        var options = Object.assign({}, globals2.game.options);
        options["variantName"] = event.data.payload;
        delete options["variantID"];
        globals2.conn.send("tableUpdate", {"maxPlayers":globals2.game.maxPlayers, "name":globals2.game.name, "options":options, "tableID":globals2.tableID});
    }
});