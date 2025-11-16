// index.js
require('dotenv').config();
const { Client, GatewayIntentBits, Partials, ActionRowBuilder, ButtonBuilder, ButtonStyle, Events } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Channel]
});

// In-memory database (for testing; later use JSON or DB)
const users = {}; // { userId: { wallet: 50000, vault: 0, ghost: false } }
const adminIDs = ["1116246961650143273"]; // replace with your Discord ID

function getUser(id) {
  if (!users[id]) users[id] = { wallet: 50000, vault: 0, ghost: false };
  return users[id];
}

// Bot ready
client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

// Commands
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  const args = message.content.trim().split(/\s+/);
  const cmd = args.shift().toLowerCase();
  const user = getUser(message.author.id);

  // ----- .bal command -----
  if (cmd === '.bal') {
    const balText = `💰 Wallet: ${user.wallet}\n🏦 Vault: ${user.vault}`;
    if (user.ghost) {
      await message.reply({ content: balText, ephemeral: true }).catch(() => message.channel.send(balText));
    } else {
      await message.channel.send({ content: balText });
    }

    const buttons = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder().setCustomId('deposit').setLabel('Deposit').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('withdraw').setLabel('Withdraw').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('ghost').setEmoji('🕵️‍♂️').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('give').setEmoji('⭐').setStyle(ButtonStyle.Secondary)
      );

    await message.channel.send({ content: '💵 Wallet Actions:', components: [buttons] });
  }

  // ----- .bet command -----
  else if (cmd === '.bet') {
    if (args.length < 2) return message.reply('Usage: .bet <amount> <color>');
    const amount = parseInt(args[0]);
    const color = args[1].toLowerCase();

    if (isNaN(amount) || amount < 10000) return message.reply('Minimum bet is 10,000.');
    if (user.wallet < amount) return message.reply(`❌ Not enough money. Use .unvault <amount> to move from vault.`);
    if (!['red','black','green'].includes(color)) return message.reply('Colors: red, black, green');

    user.wallet -= amount;

    const roll = Math.floor(Math.random() * 37); // 0-36
    let resultColor = roll === 0 ? 'green' : roll % 2 === 0 ? 'black' : 'red';
    let win = 0;
    if (color === resultColor) {
      win = color === 'green' ? amount * 14 : amount * 2;
      user.wallet += win;
      message.reply(`🎉 Rolled ${resultColor.toUpperCase()}! You won ${win}!`);
    } else {
      message.reply(`😢 Rolled ${resultColor.toUpperCase()}. You lost ${amount}.`);
    }

    // Admin ephemeral message
    for (let adminId of adminIDs) {
      const admin = await client.users.fetch(adminId);
      if (admin) admin.send(`🎲 Player ${message.author.tag} bet ${amount} on ${color}. Roll: ${resultColor}.`);
    }
  }
});

// Button interactions
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isButton()) return;
  const user = getUser(interaction.user.id);

  if (interaction.customId === 'ghost') {
    user.ghost = !user.ghost;
    await interaction.reply({ content: `Ghost mode ${user.ghost ? 'enabled' : 'disabled'}!`, ephemeral: true });
  }
  else if (interaction.customId === 'deposit') {
    await interaction.reply({ content: 'Deposit is under development.', ephemeral: true });
  }
  else if (interaction.customId === 'withdraw') {
    await interaction.reply({ content: 'Withdraw is under development.', ephemeral: true });
  }
  else if (interaction.customId === 'give') {
    await interaction.reply({ content: 'Give chips is under development.', ephemeral: true });
  }
});

// Login
client.login(process.env.DISCORD_TOKEN);
