let hastebin = require('hastebin');
const config = require('../config.json');


module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
    if (!interaction.isButton()) return;
    if (interaction.customId == "open-ticket") {
      if (client.guilds.cache.get(interaction.guildId).channels.cache.find(c => c.topic == interaction.user.id)) {
        return interaction.reply({
            content: 'You have already created a ticket !',
          ephemeral: true
        });
      };

      interaction.guild.channels.create(`ticket-${interaction.user.username}`, {
        parent: client.config.parentOpened,
        topic: interaction.user.id,
        permissionOverwrites: [{
            id: interaction.user.id,
            allow: ['SEND_MESSAGES', 'VIEW_CHANNEL'],
          },
          {
            id: client.config.roleSupport,
            allow: ['SEND_MESSAGES', 'VIEW_CHANNEL'],
          },
          {
            id: interaction.guild.roles.everyone,
            deny: ['VIEW_CHANNEL'],
          },
        ],
        type: 'text',
      }).then(async c => {
        interaction.reply({
          content: `Ticket created! <#${c.id}>`,
          ephemeral: true
        });

        const embed = new client.discord.MessageEmbed()
          .setColor('000000')
          .setAuthor('Ticket')
            .setDescription('Select a ticket category')
            .setFooter(`${config.footerText}`)
          .setTimestamp();

          const row = new client.discord.MessageActionRow()
              .addComponents(
                  new client.discord.MessageSelectMenu()
                      .setCustomId('category')
                      .setPlaceholder('Select a ticket category')
                      .addOptions([

              {
                    label: config.catName1,
                    value: config.catName1,
              },
              {
                    label: config.catName2,
                    value: config.catName2,
              },
              {
                    label: config.catName3,
                    value: config.catName3,
              },
              {
                    label: config.catName4,
                    value: config.catName4,
              },
            ]),
          );

        msg = await c.send({
          content: `<@!${interaction.user.id}>`,
          embeds: [embed],
          components: [row]
        });

        const collector = msg.createMessageComponentCollector({
          componentType: 'SELECT_MENU',
          time: 300000
        });

        collector.on('collect', i => {
          if (i.user.id === interaction.user.id) {
            if (msg.deletable) {
              msg.delete().then(async () => {
                const embed = new client.discord.MessageEmbed()
                  .setColor('000000')
                  .setAuthor('Ticket')
                    .setDescription(`<@!${interaction.user.id}> created a ticket ${i.values[0]}`)
                    .setFooter(`${ config.footerText }`)
                  .setTimestamp();

                const row = new client.discord.MessageActionRow()
                  .addComponents(
                    new client.discord.MessageButton()
                    .setCustomId('close-ticket')
                    .setLabel('Close ticket')
                    .setStyle('DANGER'),
                  );

                const opened = await c.send({
                  content: `<@&${client.config.roleSupport}>`,
                  embeds: [embed],
                  components: [row]
                });

                opened.pin().then(() => {
                  opened.channel.bulkDelete(1);
                });
              });
              };
              if (i.values[0] == config.catName1) {
              c.edit({
                  parent: client.config.parentCat1
              });
            };
              if (i.values[0] == config.catName2) {
              c.edit({
                  parent: client.config.parentCat2
              });
            };
              if (i.values[0] == config.catName3) {
              c.edit({
                  parent: client.config.parentCat3
              });
            };
              if (i.values[0] == config.catName4) {
              c.edit({
                  parent: client.config.parentCat4
              });
            };
          };
        });

        collector.on('end', collected => {
          if (collected.size < 1) {
              c.send("No category selected. Closing the ticket...").then(() => {
              setTimeout(() => {
                if (c.deletable) {
                  c.delete();
                };
              }, 600);
            });
          };
        });
      });
    };

    if (interaction.customId == "close-ticket") {
      const guild = client.guilds.cache.get(interaction.guildId);
      const chan = guild.channels.cache.get(interaction.channelId);

      const row = new client.discord.MessageActionRow()
        .addComponents(
          new client.discord.MessageButton()
          .setCustomId('confirm-close')
          .setLabel('Close ticket')
          .setStyle('DANGER'),
          new client.discord.MessageButton()
          .setCustomId('no')
          .setLabel('Cancel closing')
          .setStyle('SECONDARY'),
        );

      const verif = await interaction.reply({
        content: 'Are you sure you want to close the ticket ?',
        components: [row]
      });

      const collector = interaction.channel.createMessageComponentCollector({
        componentType: 'BUTTON',
        time: 10000
      });

      collector.on('collect', i => {
        if (i.customId == 'confirm-close') {
          interaction.editReply({
            content: `Ticket closed by <@!${interaction.user.id}>`,
            components: []
          });

          chan.edit({
              name: `closed-${chan.name}`,
              permissionOverwrites: [
                {
                  id: client.users.cache.get(chan.topic),
                  deny: ['SEND_MESSAGES', 'VIEW_CHANNEL'],
                },
                {
                  id: client.config.roleSupport,
                  allow: ['SEND_MESSAGES', 'VIEW_CHANNEL'],
                },
                {
                  id: interaction.guild.roles.everyone,
                  deny: ['VIEW_CHANNEL'],
                },
              ],
            })
            .then(async () => {
              const embed = new client.discord.MessageEmbed()
                .setColor('6d6ee8')
                .setAuthor('Ticket')
                .setDescription('```Ticket control```')
                .setFooter(`${config.footerText}`)
                .setTimestamp();

              const row = new client.discord.MessageActionRow()
                .addComponents(
                  new client.discord.MessageButton()
                  .setCustomId('delete-ticket')
                  .setLabel('Delete ticket')
                  .setStyle('DANGER'),
                );

              chan.send({
                embeds: [embed],
                components: [row]
              });
            });

          collector.stop();
        };
        if (i.customId == 'no') {
          interaction.editReply({
            content: 'Closing the canceled ticket !',
            components: []
          });
          collector.stop();
        };
      });

      collector.on('end', (i) => {
        if (i.size < 1) {
          interaction.editReply({
            content: 'Closing the canceled ticket !',
            components: []
          });
        };
      });
    };

    if (interaction.customId == "delete-ticket") {
      const guild = client.guilds.cache.get(interaction.guildId);
      const chan = guild.channels.cache.get(interaction.channelId);

      interaction.reply({
          content: 'Saving messages...'
      });

      chan.messages.fetch().then(async (messages) => {
        let a = messages.filter(m => m.author.bot !== true).map(m =>
          `${new Date(m.createdTimestamp).toLocaleString('nl-NL')} - ${m.author.username}#${m.author.discriminator}: ${m.attachments.size > 0 ? m.attachments.first().proxyURL : m.content}`
        ).reverse().join('\n');
        if (a.length < 1) a = "Nothing"
        hastebin.createPaste(a, {
            contentType: 'text/plain',
            server: 'https://hastebin.com/documents'
          }, {})
          .then(function (urlToPaste) {
            const embed = new client.discord.MessageEmbed()
              .setAuthor('Logs Ticket')
                .setDescription(`Ticket logs \`${chan.id}\` created by <@!${chan.topic}> and deleted by <@!${interaction.user.id}>\n\nLogs: [**Click here to see the logs**](${urlToPaste})`)
              .setColor('000000')
              .setTimestamp();

            const embed2 = new client.discord.MessageEmbed()
              .setAuthor('Logs Ticket')
                .setDescription(`Ticket logs \`${chan.id}\`: [**Click here to see the logs**](${urlToPaste})`)
              .setColor('00000')
              .setTimestamp();

            client.channels.cache.get(client.config.logsTicket).send({
              embeds: [embed]
            });
            client.users.cache.get(chan.topic).send({
              embeds: [embed2]
            }).catch(() => {console.log('I can\'t dm him :(')});
              chan.send('Channel deletion...');

            setTimeout(() => {
              chan.delete();
            }, 5000);
          });
      });
    };
  },
};
