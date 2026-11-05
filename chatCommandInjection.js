window.addEventListener('message', function(event) {
    if (event.source === window && event.data.type === 'chatCommandInjection') {
        globals2.conn.send("tableSetVariant", {"tableID":globals2.tableID, "options":{"variantName":event.data.payload} });
    }
});