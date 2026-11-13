var missingHanabiVariantsPromise = null;

function missingHanabiVariantId(name) {
    if (!missingHanabiVariantsPromise) {
        missingHanabiVariantsPromise = fetch('/api/v1/variants')
            .then(function(response) { return response.json(); })
            .then(function(variants) {
                var byName = {};
                Object.keys(variants).forEach(function(id) {
                    byName[variants[id]] = Number(id);
                });
                return byName;
            })
            .catch(function(error) {
                missingHanabiVariantsPromise = null;
                console.warn('missing-hanabi: fetching the variants failed', error);
            });
    }
    return missingHanabiVariantsPromise.then(function(byName) { return byName[name]; });
}

window.addEventListener('message', function(event) {
    if (event.source === window && event.data.type === 'chatCommandInjection') {
        var game = globals2.game;
        var seated = game && game.players && game.players.some(function(player) { return player.userId === globals2.userId; });
        if (seated) {
            missingHanabiVariantId(event.data.payload).then(function(variantId) {
                if (variantId === undefined) {
                    console.warn('missing-hanabi: unknown variant name', event.data.payload);
                    return;
                }
                var options = Object.assign({}, game.settings.options, {"variantId": variantId});
                var settings = Object.assign({}, game.settings, {"options": options});
                globals2.conn.send("tableUpdate", {"tableId":game.tableId, "settings":settings});
            });
        } else {
            globals2.conn.send("chat", {"text": "@/sv " + event.data.payload + "@", "tableId": game? game.tableId : globals2.tableId});
        }
    }
});