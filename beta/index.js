require("dotenv").config();
const {
    Client,
    GatewayIntentBits,
    ActionRowBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    EmbedBuilder,
    ButtonBuilder,
    ButtonStyle,
    StringSelectMenuBuilder,
    Events,
    SlashCommandBuilder,
} = require("discord.js");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.DirectMessages, // Если планируете взаимодействия в личных сообщениях
    ],
});

const TOKEN = process.env.DISCORD_TOKEN;
const targetChannelNameModeffzia = "moderator-only";
const sendChannelNameModeffzia = "moderator-only";
const targetChannelNameCats = "🚧・верификация";
const sendChannelNameVerify = "🧾・анкеты";
const sendChannelName = "присоединится-к-рп";
const targetChannelName = "📇・анкеты-рп";
const roleMap = {
    "1286797732354195556": "1316727278956187689",
    "1316745136482418688": "1316744812472438834",
    "1316745202022617181": "1316744957352087613",
    "1261087264868401233": "1316747490728480769",
};

const targetCategoryId = "1261087209222574243";

const ball = new SlashCommandBuilder()
    .setName('8ball')
    .setDescription('Узнайте вашу судьбу задав вопрос :3')
    .addStringOption(option =>
        option.setName('вопрос')
            .setDescription('Ваш вопросик для меня :3')
            .setRequired(true));

client.once("ready", async () => {
    console.log(`Bot is starting with a name ${client.user.tag}`);
    await client.application.commands.create(ball);
    client.user.setPresence({
        activities: [{ name: "указания modeffz", type: 2 }], // 0 = Играет
        status: "dnd", // online | idle | dnd | invisible
    });
    client.guilds.cache.forEach(async (guild) => {
        try {
            const botMember = await guild.members.fetchMe();
            console.log(`Bot is present in guild: ${guild.name}`);
            console.log("Bot permissions:", botMember.permissions.toArray());
            console.log(
                "Bot roles:",
                botMember.roles.cache.map((role) => role.name).join(", "),
            );
        } catch (error) {
            console.error(
                `Ошибка при загрузке данных о боте на сервере ${guild.name}:`,
                error,
            );
        }
    });
});

client.on('interactionCreate', async interaction => {
    if(!interaction.isCommand()) return;

    const { commandName, options } = interaction;
    if(commandName === '8ball') {
        const res = [
            'Да, конечно :3',
            'Да!',
            'Возможно, да',
            'Хотел бы знать...',
            'Скорее всего, нет',
            'Нет!',
            'Не могу сказать',
            'Спроси позже',
            'Вероятно, да',
            'Абсоллютно нет!'
        ];
        const chance = Math.floor(Math.random() * res.length);
        const why = options.getString('вопрос')
        await interaction.reply(`Вопрос: ${why} \n${res[chance]}`);
    }
});

client.on(Events.InteractionCreate, async (interaction) => {
    try {
        if (interaction.isButton() && interaction.customId === "RolePlay") {
            const modal = new ModalBuilder()
                .setCustomId("RoleModal")
                .setTitle("Анкета рп");

            const nameRow = new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId("user_name")
                    .setLabel("Имя вашего персонажа")
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true),
            );

            const descriptionRow = new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId("description_user")
                    .setLabel("Описание внешности персонажа")
                    .setStyle(TextInputStyle.Paragraph)
                    .setRequired(true),
            );

            const skillsRow = new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId("skill_user")
                    .setLabel("Способности и умения")
                    .setStyle(TextInputStyle.Paragraph)
                    .setRequired(true),
            );

            const RPRow = new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId("RP")
                    .setLabel("Рп к которому хотите присоединится")
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true),
            );

            modal.addComponents(nameRow, descriptionRow, skillsRow, RPRow);

            await interaction.showModal(modal);
        }

        if (
            interaction.isModalSubmit() &&
            interaction.customId === "RoleModal"
        ) {
            const name = interaction.fields.getTextInputValue("user_name");
            const description =
                interaction.fields.getTextInputValue("description_user");
            const skill = interaction.fields.getTextInputValue("skill_user");
            const RP = interaction.fields.getTextInputValue("RP");

            const embed = new EmbedBuilder()
                .setColor("#FF0037")
                .setTitle("Анкета для РП")
                .setThumbnail(
                    interaction.user.displayAvatarURL({
                        dynamic: true,
                        size: 1024,
                    }),
                )
                .addFields(
                    { name: "Имя персонажа", value: name },
                    {
                        name: "Описание внешности персонажа",
                        value: description,
                    },
                    { name: "Способности и умения", value: skill },
                    { name: "Категория рп", value: RP },
                )
                .setFooter({ text: `ID Пользователя: ${interaction.user.id}` });

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`accept_${interaction.user.id}`)
                    .setLabel("Принять")
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId(`reject_${interaction.user.id}`)
                    .setLabel("Отклонить")
                    .setStyle(ButtonStyle.Danger),
            );

            const targetChannel = interaction.guild.channels.cache.find(
                (ch) => ch.name === targetChannelName,
            );

            if (!targetChannel) {
                await interaction.reply({
                    content: `Канал "${targetChannelName}" не найден.`,
                    ephemeral: true,
                });
                return;
            }

            await targetChannel.send({ embeds: [embed], components: [row] });
            await interaction.reply({
                content: "Ваша анкета отправлена на рассмотрение!",
                ephemeral: true,
            });
        }

        if (
            interaction.isButton() &&
            interaction.customId.startsWith("reject_")
        ) {
            const userId = interaction.customId.split("_")[1];

            let member;
            try {
                member = await interaction.guild.members.fetch(userId);

                if (!member) {
                    return interaction.reply({
                        content: "Пользователь не найден.",
                        ephemeral: true,
                    });
                }

                await member.send("К сожалению, ваша анкета отклонена.");

                await interaction.reply({
                    content: `Анкета пользователя ${member.user.tag} отклонена.`,
                    ephemeral: true,
                });
            } catch (error) {
                console.error("Ошибка:", error);
                await interaction.reply({
                    content: "Ошибка при обработке анкеты.",
                    ephemeral: true,
                });
            }
        }

        if (
            interaction.isButton() &&
            interaction.customId.startsWith("accept_")
        ) {
            const userId = interaction.customId.split("_")[1];
            const user = await interaction.guild.members.fetch(userId);

            if (!user) {
                return interaction.reply({
                    content: "Пользователь не найден.",
                    ephemeral: true,
                });
            }

            const channels = interaction.guild.channels.cache
                .filter(
                    (ch) => ch.type === 0 && ch.parentId === targetCategoryId,
                )
                .map((ch) => ({
                    label: ch.name,
                    value: ch.id,
                }));

            if (!channels.length) {
                return interaction.reply({
                    content: "Нет доступных каналов в указанной категории.",
                    ephemeral: true,
                });
            }

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId(`select_channel_${userId}`) // Сохраняем ID пользователя
                .setPlaceholder("Выберите канал для доступа")
                .addOptions(channels);

            const row = new ActionRowBuilder().addComponents(selectMenu);

            await interaction.reply({
                content: "Выберите канал для выдачи доступа:",
                components: [row],
                ephemeral: true,
            });
        }

        if (
            interaction.isStringSelectMenu() &&
            interaction.customId.startsWith("select_channel_")
        ) {
            const userId = interaction.customId.split("_")[2];
            const user = await interaction.guild.members.fetch(userId);

            if (!user) {
                return interaction.reply({
                    content: "Пользователь не найден.",
                    ephemeral: true,
                });
            }

            const selectedChannelId = interaction.values[0];
            const roleId = roleMap[selectedChannelId];

            if (!roleId) {
                return interaction.reply({
                    content: "Ошибка: Роль не найдена для выбранного канала.",
                    ephemeral: true,
                });
            }

            try {
                const botMember = await interaction.guild.members.fetchMe();

                if (!botMember.permissions.has("ManageRoles")) {
                    return interaction.reply({
                        content: "Ошибка: Боту не хватает прав.",
                        ephemeral: true,
                    });
                }

                await user.roles.add(roleId);
                await interaction.reply({
                    content: `Роль успешно выдана пользователю ${user.user.username}!`,
                    ephemeral: true,
                });
            } catch (error) {
                console.error("Ошибка при выдаче роли:", error);
                await interaction.reply({
                    content: "Ошибка при выдаче доступа.",
                    ephemeral: true,
                });
            }
        }
    } catch (error) {
        console.error("Ошибка обработки:", error);
        if (!interaction.replied) {
            await interaction.reply({
                content: "Произошла ошибка.",
                ephemeral: true,
            });
        }
    }
});

client.on("messageCreate", async (message) => {
    if (message.content === "/RPMOD") {
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("RolePlay")
                .setLabel("Создать")
                .setStyle(ButtonStyle.Success),
        );
        const sendChannel = message.guild.channels.cache.find(
            (ch) => ch.name === sendChannelName,
        );
        if (!sendChannel) {
            console.error("err");
            return;
        }
        try {
            await sendChannel.send({
                content: "Нажмите на кнопку ниже, чтобы создать РП-анкету:",
                components: [row],
            });
        } catch (error) {
            console.error("err_2", error);
        }
    }
});





client.on(Events.InteractionCreate, async (interaction) => {
    try {
        if (interaction.isButton() && interaction.customId === "verifyCats") {
            const modal = new ModalBuilder()
                .setCustomId("verifmodal")
                .setTitle("Verify");

            const firstVerifQuestionCats = new TextInputBuilder()
                .setCustomId("firstVerifQuestionCats")
                .setLabel("Имя")
                .setPlaceholder("(По желанию)")
                .setStyle(TextInputStyle.Short)
                .setRequired(false);

            const secondVerifQuestionCats = new TextInputBuilder()
                .setCustomId("secondVerifQuestionCats")
                .setLabel("Возраст")
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            const thirdVerifQuestionCats = new TextInputBuilder()
                .setCustomId("thirdVerifQuestionCats")
                .setLabel("Как вы попали на сервер?")
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true);

            const fourthVerifQuestionCats = new TextInputBuilder()
                .setCustomId("fourthVerifQuestionCats")
                .setLabel("Знакомые в администрации?")
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true);


            const firstQuestionCats = new ActionRowBuilder().addComponents(firstVerifQuestionCats);
            modal.addComponents(firstQuestionCats);

            const secondQuestionCats = new ActionRowBuilder().addComponents(secondVerifQuestionCats);
            modal.addComponents(secondQuestionCats);

            const thirdQuestionCats = new ActionRowBuilder().addComponents(thirdVerifQuestionCats);
            modal.addComponents(thirdQuestionCats);

            const fourthQuestionCats = new ActionRowBuilder().addComponents(fourthVerifQuestionCats);
            modal.addComponents(fourthQuestionCats);

            await interaction.showModal(modal);
        }

        if (interaction.isModalSubmit() && interaction.customId === "verifmodal") {
            const firstQuestionCats_1 = interaction.fields.getTextInputValue("firstVerifQuestionCats") || "Предпочел не указывать";
            const secondQuestionCats_1 = interaction.fields.getTextInputValue("secondVerifQuestionCats");
            const thirdQuestionCats_1 = interaction.fields.getTextInputValue("thirdVerifQuestionCats");
            const fourthQuestionCats_1 = interaction.fields.getTextInputValue("fourthVerifQuestionCats");

            const embed = new EmbedBuilder()
                .setColor("#FF0037")
                .setTitle("Анкета")
                .setThumbnail(
                    interaction.user.displayAvatarURL({
                        dynamic: true,
                        size: 1024,
                    })
                )
                .setAuthor({ name: interaction.user.username })
                .addFields({ name: "Имя", value: firstQuestionCats_1 })
                .addFields({ name: "Возраст", value: secondQuestionCats_1 })
                .addFields({ name: "Как вы попали на сервер?", value: thirdQuestionCats_1 })
                .addFields({ name: "Имеете ли вы связи с кем либо из администрации?", value: fourthQuestionCats_1 })
                .setFooter({ text: `ID Пользователя: ${interaction.user.id}` });


            const sendChannel = interaction.guild.channels.cache.find(
                (ch) => ch.name === sendChannelNameVerify
            );
            if (sendChannel) {
                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId("accept_2")
                        .setLabel("Принять")
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId("reject_2")
                        .setLabel("Отклонить")
                        .setStyle(ButtonStyle.Danger)
                );

                const message = await sendChannel.send({ embeds: [embed], components: [row] });

                interaction.client.savedMessageId = message.id;
            } else {
                console.error("Канал для отправки анкеты не найден.");
            }

            await interaction.reply({ content: "Ваша анкета успешно отправлена!", ephemeral: true });
        }

        if (interaction.isButton() && (interaction.customId === "accept_2" || interaction.customId === "reject_2")) {
            if (!interaction.message.embeds[0]?.footer?.text) {
                return interaction.reply({
                    content: "Не удалось получить информацию о пользователе.",
                    ephemeral: true
                });
            }
            
            const memberId = interaction.message.embeds[0].footer.text.split(": ")[1];
            const member = await interaction.guild.members.fetch(memberId).catch(() => null);

            if (!member) {
                return interaction.reply({
                    content: "Пользователь не найден на сервере.",
                    ephemeral: true,
                });
            }

            if (interaction.customId === "accept_2") {
                const roleId = "1324373740082954331";
                const roleRemoveId = "1324373601188577321";
                const role = interaction.guild.roles.cache.get(roleId);
                const roleRemove = interaction.guild.roles.cache.get(roleRemoveId);
                if (role) {
                    await member.roles.add(role);
                    await member.roles.remove(roleRemove);
                    await interaction.reply({ content: "Пользователь успешно верифицирован!", ephemeral: true });

                    const message = await interaction.channel.messages.fetch(interaction.message.id);
                    const updatedEmbed = new EmbedBuilder()
                        .setColor("#00FF00")
                        .setTitle("Анкета")
                        .setDescription("Пользователь успешно верифицирован!")
                        .setFooter({ text: `ID Пользователя: ${interaction.user.id}` });

                    await message.edit({ embeds: [updatedEmbed] });
                } else {
                    console.error("Роль по ID не найдена.");
                    await interaction.reply({
                        content: "Роль не найдена, верификация не может быть выполнена.",
                        ephemeral: true,
                    });
                }
            }

            if (interaction.customId === "reject_2") {
                try {
                    await member.send("Ваша заявка была отклонена, вы покидаете сервер.");
                    await member.kick("Анкета отклонена.");
                    await interaction.reply({ content: "Пользователь успешно удален с сервера.", ephemeral: true });

                    const message = await interaction.channel.messages.fetch(interaction.message.id);
                    const updatedEmbed = new EmbedBuilder()
                        .setColor("#FF0000")
                        .setTitle("Анкета")
                        .setDescription("Пользователь был отклонен и покинул сервер.")
                        .setFooter({ text: `ID Пользователя: ${interaction.user.id}` });

                    await message.edit({ embeds: [updatedEmbed] });
                } catch (error) {
                    console.error("Ошибка при удалении пользователя:", error);
                    await interaction.reply({
                        content: "Не удалось удалить пользователя с сервера.",
                        ephemeral: true,
                    });
                }
            }
        }
    } catch (error) {
        console.error("Ошибка обработки взаимодействия:", error);
    }
});

client.on(Events.MessageCreate, async (message) => {
    if (message.content === "/verifyCats") {
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("verifyCats")
                .setLabel("Пройти")
                .setStyle(ButtonStyle.Primary)
        );
        await message.channel.send({ content: "Нажмите на кнопку ниже, чтобы пройти верификацию:", components: [row] });
    }
});







client.on(Events.InteractionCreate, async interaction => {
    try{
        if(interaction.isButton() && interaction.customId === "modeffziaVer"){
            const modal = new ModalBuilder()
                .setCustomId('Modeffzia')
                .setTitle('Анкета для верификации');

            const modeffziaAgeInputRaw = new TextInputBuilder()
                .setCustomId('modeffziaAgeInputRaw')
                .setLabel('Bаш возраст')
                .setStyle(TextInputStyle.Short)
                .setMinLength(2)
                .setMaxLength(2)
                .setRequired(true);

            const modeffziaTargetRaw = new TextInputBuilder()
                .setCustomId('modeffziaTargetRaw')
                .setLabel('Ваша цель на сервере')
                .setStyle(TextInputStyle.Paragraph)
                .setMinLength(15)
                .setRequired(true);

            const modeffziaLanguageRaw = new TextInputBuilder()
                .setCustomId('modeffziaLanguageRaw')
                .setLabel('Какая языки программирования вы знаете')
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(false);

            const modeffziaLanguage = new ActionRowBuilder().addComponents(modeffziaLanguageRaw);
            const modeffziaAgeInput = new ActionRowBuilder().addComponents(modeffziaAgeInputRaw);
            const modeffziaTarget = new ActionRowBuilder().addComponents(modeffziaTargetRaw);

            modal.addComponents(modeffziaTarget, modeffziaAgeInput, modeffziaLanguage);

            await interaction.showModal(modal);

        } if(interaction.isModalSubmit() && interaction.customId === "Modeffzia"){
            const modeffziaTargetText = interaction.fields.getTextInputValue("modeffziaTarget");
            const modeffziaLanguageText = interaction.fields.getTextInputValue("modeffziaLanguage") || "Не указано";
            const modeffziaAgeInputText = interaction.fields.getTextInputValue("modeffziaAgeInput");

            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle("Анкета на верификацию")
                .setThumbnail(
                    interaction.user.displayAvatarURL({
                        dynamic: true, 
                        size: 1024,
                    })
                )
                .setAuthor({ name: interaction.user.username })
                .addFields({ name: "Возраст", value: modeffziaAgeInputText })
                .addFields({ name: "Цель", value: modeffziaTargetText })
                .addFields({ name: "Языки", value: modeffziaLanguageText })
                .setFooter({ name: `"Id рльзователя " ${interaction.user.id}`})

            const sendChannel = interaction.guild.channel.cache.find(
                (ch) => ch.name === sendChannelNameModeffzia
            );

            if(!sendChannel){
                await interaction.reply({
                    content: "error send",
                    ephemeral: true,
                })
            } else if(sendChannel){
                const confirm = new ButtonBuilder()
                    .setCustomId('accept_3')
                    .setLabel('Пинать')
                    .setStyle(ButtonStyle.Success);

                const cancel = new ButtonBuilder()
                    .setCustomId('reject_3')
                    .setLabel('Отклонить')
                    .setStyle(ButtonStyle.Danger);

                const row = new ActionRowBuilder()
                    .addComponents(confirm, cancel);

                const message = await sendChannel.send({ embeds: [embed], components: [row] })
                interaction.client.savedMessageId = message.id;
            } else {
                interaction.reply("Каналл отправки не найден");
            }
            await interaction.reply({ content: "Анкета успешно отправлена", ephemeral: true });

        }
        if(interaction.isButton() && interaction.customId === "accept_3" || interaction.customId === "reject_3") {
            if(!interaction.message.embeds[0]?.footer?.text) {
                return interaction.reply({ content: "Ошибка обработки взаимодействия"})
            }
        }
    } catch (error) {
        await interaction.reply({
            content: "Ошибка взаимодействия",
            ephemeral: true,
        });
    }
});

client.on(Events.MessageCreate, async (message) => {
    if(message.content === "/modeffzia"){
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("modeffziaVer")
                .setLabel("Начать верификацию")
                .setStyle(ButtonStyle.Primary)
        );
        await message.channel.send({ content: "Для начала общения пройдите верификацию :3", components: [row] });
    }
});

client.login(TOKEN);
