import { CommandInteraction, SlashCommandBuilder } from 'discord.js';
import { deleteStreamer, getSubsriptionIdByStreamerName } from '../../database/announcer-db';
import { removeSubscription } from '../../twitch';
import { ReplyStatus } from '../../utils/discordUtils';

export const data = new SlashCommandBuilder()
  .setName('remove-streamer')
  .setDescription('Remove a streamer from the stream announcer.')
  .addStringOption((option) =>
    option.setName('twitch-name').setDescription("The streamer's Twitch name").setRequired(true)
  );

export async function execute(interaction: CommandInteraction) {

  if (!interaction.isChatInputCommand()) return;
  await interaction.reply('Removing streamer ... this may take a few seconds.');

  const name: string | null = interaction.options.getString('twitch-name');
  if (name) {
    const subscriptionId = await getSubsriptionIdByStreamerName(name);

    if (subscriptionId === 'notFound') {
      await interaction.editReply(`${name} was not found in the announcer.`);
      return;
    }
    // unsubscribe from twitch events
    if (subscriptionId) {
      const deleteSubSuccess = await removeSubscription(subscriptionId);

      // remove from DB
      if (deleteSubSuccess) {
        const removeSuccess = await deleteStreamer(name);
        await interaction.editReply(selectResponse(name, removeSuccess));
        return;
      }
    }
  }
  await interaction.editReply(`Ooops something went wrong. Ask Lisa about it.`);
}

function selectResponse(name: string, status: ReplyStatus) {
  
  switch(status) {
    case ReplyStatus.notFound: {
      return `${name} was not found. They were either not added yet or their name is misspelled.`
    };
    case ReplyStatus.success: {
      return `${name} was successfully removed.`
    }
    default: {
      return `${name} could not be removed. Ask Lisa about it.`
    }
  }
}
