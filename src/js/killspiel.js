const command = '!killspiel ';

const init = async () => {
    const options = {
        options: {
            debug: true
        },
        connection: {
            secure: true,
            reconnect: true
        },
        identity: {
            username: document.querySelector('#bot-username').value,
            password: document.querySelector('#oauth-token').value
        },
        channels: [ document.querySelector('#channel-name').value ]
    };

    const client = new tmi.Client(options);
    let currentGuesses = {};
    let running = false;

    const start = (channel) => {
        if (!running) {
            currentGuesses = {};
        }
        running = true;
        console.log('Awaiting guesses...');
        client.say(channel, 'Tipps werden jetzt angenommen!');
    };

    const stop = (channel) => {
        running = false;
        console.log('Guess window closed!');
        client.say(channel, 'Tipps werden nicht mehr angenmommen!');
    };

    const guess = (channel, user, args) => {
        if (args.length == 1) {
            if (running) {
                currentGuesses[user] = parseInt(args[0].trim(), 10);
                console.log(`User ${user} guessed ${currentGuesses[user]}`);
            } else {
                client.say(channel, 'Killspiel ist nicht aktiv!');
            }
        } else {
            client.say(channel, 'Ungültige Argumentzahl!');
        }
    };

    const resolve = (channel, _, args) => {
        if (args.length == 1 && !running) {
            if (!running) {
                const realKills = parseInt(args[0].trim(), 10);
                const winners = [];
                Object.entries(currentGuesses).forEach(entry => {
                    const [key, value] = entry;
                    if (value === realKills) {
                        winners.push(key);
                    }
                });
                client.say(channel, 'Gewonnen haben: ' + winners.join(', '));
            } else {
                client.say(channel, 'Killspiel läuft noch!');
            }
        } else {
            client.say(channel, 'Ungültige Argumentzahl!');
        }
    };


    const subCommands = {
        'start': { condition: user => user.mod, action: start },
        'stop': { condition: user => user.mod, action: stop },
        'tipp': { condition: () => true, action: guess },
        'kills': { condition: user => user.mod, action: resolve }
    };



    const handleCommand = async (channel, user, command) => {
        const args = command.split(' ');
        if (args.length > 0) {
            const action = subCommands[args[0]];
            if (!action) {
                client.say(channel, 'Ungültiger Befehl!');
            } else if (action.condition(user)) {
                action.action(channel, user.username, args.slice(1));
            } else {
                client.say(channel, 'Keine Berechtigung!');
            }
        } else {
            client.say(channel, 'Ungültiger Befehl!');
        }
    };


    client.on('message', async (channel, user, message) => {
        try {
            if (user.username === channel.slice(1)) {
                user.mod = true;
            }
            if (message.startsWith(command)) {
                await handleCommand(channel, user, message.slice(command.length));
            }
        } catch (e) {
            console.error(e);
            alert(e);
        }
    });

    await client.connect();
    return client;
};


const main = () => {

    let client = null;

    document.querySelector('#connect').addEventListener('click', async () => {
        try {
            if (client) {
                await client.disconnect();
            }
            client = await init();
        } catch (e) {
            console.error(e);
        }
    });

    document.querySelector('#disconnect').addEventListener('click', async () => {
        try {
            if (client) {
                await client.disconnect();
            }
        } catch (e) {
            console.error(e);
        }
    });
};


window.addEventListener('load', main);