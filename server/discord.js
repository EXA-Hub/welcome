import puppeteer from 'puppeteer';
import { Client, GatewayIntentBits } from 'discord.js';
import fs from 'fs';
import axios from 'axios';
import path from 'path';
import { url, token, exec } from './data.js';

async function setStorage(browser) {
    const page = await browser.newPage();
    // Read data from 'state.json'
    const data = fs.readFileSync('state.json', 'utf8');
    const state = JSON.parse(data);
    // Navigate to your webpage
    await page.goto(url, { waitUntil: 'networkidle0' });
    // Set the local storage
    await page.evaluate((state) => {
        localStorage.setItem('state', JSON.stringify(state));
    }, state);
    await page.close();
}

/**
 * 
 * @param {puppeteer.Browser} browser 
 */
async function send(browser, { discordTag, tag, name, memberCount }) {

    const page = await browser.newPage();

    const password = 'zampx';

    // Convert data to query string
    const params = new URLSearchParams({ discordTag, tag, name, memberCount, password });

    // Navigate to your webpage
    await page.goto(`${url}?${params.toString()}`, { waitUntil: 'networkidle0' });

    // Wait for the button to appear on the page
    await page.waitForSelector('#body > div > div.card > div:nth-child(1) > button:nth-child(3)');

    // Click the button
    await page.click('#body > div > div.card > div:nth-child(1) > button:nth-child(3)');

    await page.waitForFunction(() => {
        return Array.from(document.querySelectorAll('span')).find(el => el.textContent === 'تم إرسال الترحيب');
    });

    await page.close();

    await setStorage(browser);

}


async function downloadAvatar(interaction) {
    try {
        // Get the avatar URL of the user
        const url = interaction.user.displayAvatarURL({ format: 'png', size: 4096 });

        // Use axios to download the image
        const response = await axios({
            url,
            responseType: 'stream',
        });

        // Create a write stream
        const writer = fs.createWriteStream(path.resolve(process.cwd(), 'build', 'user.png'));

        // Pipe the response data into the write stream
        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });
    } catch (err) {
        console.error(err);
        await interaction.channel.send(`${interaction.user}, an error occurred while downloading the avatar.`);
    }
}

// Usage:
// await downloadAvatar(interaction);

(async () => {
    try {

        const executablePath = exec;

        // Launch the browser in non-headless mode
        const browser = await puppeteer.launch({
            executablePath,
            headless: "new",
            args: [
                '--disable-web-security',
                "--no-sandbox",
                "--disable-setuid-sandbox",
            ]
        });

        await setStorage(browser);

        const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers] });

        client.on('ready', () => {
            console.log(`Logged in as ${client.user.tag}!`);
        });

        client.on('interactionCreate', async interaction => {
            if (![
                "1131418827637391430",
                "1149119351413297243",
                "1147649763966205993",
                "1154968634511343720",
                "",
                "",
                "",
                "",
                "",
            ].some(role => interaction.member.roles.cache.has(role))) return;
            if (interaction.isChatInputCommand()) {
                if (interaction.commandName === 'ping') {
                    const sent = await interaction.reply('Pong!', { fetchReply: true });
                    const latency = sent.createdTimestamp - interaction.createdTimestamp;
                    await interaction.followUp(`Latency: ${latency}ms`);
                } else if (interaction.commandName === 'test') {
                    await interaction.reply('Testing...');
                    await downloadAvatar(interaction);
                    const member = interaction.member;
                    const memberCount = member.guild.memberCount;
                    const name = member.displayName;
                    const tag = member.user.discriminator;
                    const discordTag = member.user.tag;
                    send(browser, { discordTag, tag, name, memberCount }).then(() => {
                        interaction.channel.send(`${interaction.user} Tested ✅`);
                    }).catch((err) => {
                        interaction.channel.send(`${interaction.user} Some errors ❌`);
                        console.log(err);
                    });
                } else {
                    await interaction.reply("UNKNOWN!");
                }
            } else {
                interaction.reply("No Interaction found!");
            }
        });

        client.on('guildMemberAdd', async (member) => {
            // Create a fake interaction object
            const interaction = { user: member.user, channel: member.guild.systemChannel };

            // Download the avatar
            await downloadAvatar(interaction);

            const memberCount = member.guild.memberCount;
            const name = member.displayName;
            const tag = member.user.discriminator;
            const discordTag = member.user.tag;

            await send(browser, { discordTag, tag, name, memberCount });
        });

        client.login(token);
    } catch (error) {
        console.error('An error occurred:', error);
    }
})();
