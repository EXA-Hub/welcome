import { REST, Routes } from 'discord.js';
import { token, botId } from './data.js';

// https://autocode.com/tools/discord/command-builder/

const commands = [
    {
        name: 'ping',
        description: 'Replies with Pong!',
    }, {
        "name": "test",
        "description": "Tests the welcome message",
        "options": []
    },
];

const rest = new REST({ version: '10' }).setToken(token);

try {
    console.log('Started refreshing application (/) commands.');

    await rest.put(Routes.applicationCommands(botId), { body: commands });

    console.log('Successfully reloaded application (/) commands.');
} catch (error) {
    console.error(error);
}
