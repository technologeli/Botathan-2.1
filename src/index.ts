import { TextChannel } from 'discord.js';
import Commando from 'discord.js-commando';
import { join } from 'path';

const client = new Commando.Client({
  commandPrefix: '-',
  owner: process.env.OWNER,
});

client.registry
  .registerGroups([
    ['common', 'Common commands'],
    ['eli', "Eli's commands"],
  ])
  .registerDefaultTypes()
  .registerDefaultGroups()
  .registerDefaultCommands({
    eval: false,
  })
  .registerCommandsIn(join(__dirname, 'commands'));

interface response {
  readonly user?: string;
  readonly input: string;
  readonly output: string;
  readonly caseSensitive?: boolean;
  readonly punctuationSensitive?: boolean;
}

const responses: response[] = require('../data/responses.json');

client.once('ready', () => {
  console.log(`Logged in as ${client.user?.tag}! (${client.user?.id})`);
  console.log(
    `Current Servers: ${client.guilds.cache.map((guild) => guild.toString())}`
  );
  client.user?.setActivity("Eli's Bidding");
});

client.on('guildMemberAdd', (member) => {
  member.guild.systemChannel?.send(`Hello, ${member}!`);
});

client.on('guildMemberRemove', (member) => {
  // check audit logs for kick
  member.guild.fetchAuditLogs({ limit: 1 }).then((auditLogs) => {
    auditLogs.entries.forEach((entry) => {
      if (entry.action === 'MEMBER_KICK' && entry.target === member) {
        member.guild.systemChannel?.send(`${member} was kicked.`);
      } else {
        member.guild.systemChannel?.send(`Goodbye, ${member}.`);
      }
    });
  });
});

client.on('guildBanAdd', (guild, user) => {
  guild.systemChannel?.send(`${user} was banned.`);
});

client.on('guildBanRemove', (guild, user) => {
  guild.systemChannel?.send(`${user} was unbanned.`);
});

client.on('error', console.error);

client.on('voiceStateUpdate', (oldState, newState) => {
  if (newState.channelID === newState.guild.afkChannelID) {
    newState.member?.send(process.env.AFK as string);
  }
});

client.on('channelPinsUpdate', (channel, date) => {
  const textChannel = channel as TextChannel;
  textChannel.messages
    .fetchPinned()
    .then((pins) => textChannel.send(`Pins: ${pins.size}`));
});

client.on('message', (msg) => {
  if (msg.author === client.user) return;

  responses.forEach((response) => {
    let content = msg.content;

    if (!response.caseSensitive) content = content.toLowerCase();
    if (!response.punctuationSensitive)
      content = content.replace(/[^a-z0-9 ]+/, '');

    const validMessage = response.input === content;
    if (!validMessage) return;

    const validUser =
      response.user === undefined || response.user === msg.author.id;
    if (!validUser) return;

    msg.channel.send(response.output);
  });
});

client.login(process.env.TOKEN);
