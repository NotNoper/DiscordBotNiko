import 'dotenv/config';
import express from 'express';
import {
  ButtonStyleTypes,
  InteractionResponseFlags,
  InteractionResponseType,
  InteractionType,
  MessageComponentTypes,
  verifyKeyMiddleware,
} from 'discord-interactions';
import { getRandomEmoji, DiscordRequest } from './utils.js';
import { getShuffledOptions, getResult } from './game.js';

// Create an express app
const app = express();
// Get port, or default to 3000
const PORT = process.env.PORT || 3000;
// To keep track of our active games
const activeGames = {};

/**
 * Interactions endpoint URL where Discord will send HTTP requests
 * Parse request body and verifies incoming requests using discord-interactions package
 */
app.post('/interactions', verifyKeyMiddleware(process.env.PUBLIC_KEY), async function (req, res) {
  // Interaction id, type and data
  const { id, type, data } = req.body;

  /**
   * Handle verification requests
   */
  if (type === InteractionType.PING) {
    return res.send({ type: InteractionResponseType.PONG });
  }

  /**
   * Handle slash command requests
   * See https://discord.com/developers/docs/interactions/application-commands#slash-commands
   */
  if (type === InteractionType.APPLICATION_COMMAND) {
    const { name } = data;

    if (type === InteractionType.MESSAGE_COMPONENT) {
// custom_id set in payload when sending message component
      const componentId = data.custom_id;

      if (componentId.startsWith('accept_button_')) {
    // get the associated game ID
        const gameId = componentId.replace('accept_button_', '');
    // Delete message with token in request body
        const endpoint = `webhooks/${process.env.APP_ID}/${req.body.token}/messages/${req.body.message.id}`;
        try {
          await res.send({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
              content: 'What is your object of choice?',
              // Indicates it'll be an ephemeral message
              flags: InteractionResponseFlags.EPHEMERAL,
              components: [
                {
                  type: MessageComponentTypes.ACTION_ROW,
                  components: [
                    {
                      type: MessageComponentTypes.STRING_SELECT,
                      // Append game ID
                      custom_id: `select_choice_${gameId}`,
                      options: getShuffledOptions(),
                    },
                  ],
                },
              ],
            },
          });
          // Delete previous message
          await DiscordRequest(endpoint, { method: 'DELETE' });
        } catch (err) {
          console.error('Error sending message:', err);
        }
      } else if (componentId.startsWith('select_choice_')) {
    // get the associated game ID
        const gameId = componentId.replace('select_choice_', '');

        if (activeGames[gameId]) {
      // Interaction context
          const context = req.body.context;
      // Get user ID and object choice for responding user
      // User ID is in user field for (G)DMs, and member for servers
          const userId = context === 0 ? req.body.member.user.id : req.body.user.id;

      // User's object choice
          const objectName = data.values[0];

      // Calculate result from helper function
          const resultStr = getResult(activeGames[gameId], {
            id: userId,
            objectName,
          });

      // Remove game from storage
          delete activeGames[gameId];
      // Update message with token in request body
          const endpoint = `webhooks/${process.env.APP_ID}/${req.body.token}/messages/${req.body.message.id}`;

          try {
        // Send results
            await res.send({
              type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
              data: { content: resultStr },
            });
        // Update ephemeral message
            await DiscordRequest(endpoint, {
              method: 'PATCH',
              body: {
                content: 'Nice choice ' + getRandomEmoji(),
                components: []
              },
            });
          } catch (err) {
            console.error('Error sending message:', err);
          }
        }
      }
      return;
    }


    // "test" command
    if (name === 'test') {
      // Send a message into the channel where command was triggered from
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          // Fetches a random emoji to send from a helper function
          content: `hello world ${getRandomEmoji()}`,
        },
      });
    }

    if (name === 'amihot') {
      const options = data.options;
      const attachmentId = options.find(opt => opt.name === 'image').value;
      const attachment = data.resolved.attachments[attachmentId];

  // Random hotness rating between 1 and 10
      const rating = Math.floor(Math.random() * 10) + 1;

      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: `🔥 I rate you a **${rating}/10** hotness level!`,
          embeds: [
            {
              image: {
                url: attachment.url,
              },
            },
          ],
        },
      });
    }

    if (name === 'askdarthvader') {
      const vaderResponses = [
  // YES-style responses
  "Yes. But only because the Force wills it.",
  "Indeed. Your confidence is… impressive.",
  "You may consider that a victory. For now.",
  "Even I must admit… that is correct.",
  "Yes. You show promise.",
  "It appears… you are worthy.",

  // NO-style responses
  "No. You are not as powerful as you believe.",
  "Absolutely not. Do not waste my time again.",
  "You overestimate yourself.",
  "No. And I find your question… disappointing.",
  "The Dark Side has no patience for such weakness.",

  // MAYBE / UNCLEAR
  "I sense… uncertainty.",
  "Even the Force cannot see your future clearly.",
  "That depends on your next move.",
  "The answer lies within you.",
  "You already know the truth.",

  // HUMOROUS / SARCASTIC
  "Is that what you tell yourself to sleep at night?",
  "Cool? I am surrounded by fools.",
  "You seek validation… how pathetic.",
  "You dare ask *me* that?",
  "I have crushed rebels with more style.",

  // FATE / DESTINY responses
  "Your destiny will answer that in time.",
  "Do not ask questions you fear the answer to.",
  "The future is in motion… but dark.",
  "That path leads to strength, or ruin.",
  "You will find out… when it is too late.",
];
      const randomResponse = vaderResponses[Math.floor(Math.random() * vaderResponses.length)];
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: randomResponse,
        },
      });
    }

    if (name === 'suggest') {
      const options = data.options;
      const text = options.find(opt => opt.name === 'text').value;
      // Send a message into the channel where command was triggered from
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          // Fetches a random emoji to send from a helper function
          content: `<@910815177254006814> This idiot says: `+text,
        },
      });
    }

    if (name === 'mesmerize') {
      const options = data.options;
      const text = options.find(opt => opt.name === 'text').value;
      const person = options.find(opt => opt.name === 'user').value;

      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: `${person} ${text}`,
          embeds: [
            {
              image: {
            // Use a direct .gif link here
                url: 'https://media.tenor.com/3kLxQWgbv0sAAAAC/miku-teto.gif',
              },
            },
          ],
        },
      });
    }


    if (name === 'tellpakos') {
      const options = data.options;
      const text = options.find(opt => opt.name === 'text').value;
      // Send a message into the channel where command was triggered from
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          // Fetches a random emoji to send from a helper function
          content: `<@791223140210311180>: Mr. Pakos, Niko would like to say `+text,
        },
      });
    }

    if (name === 'annoy') {
      const dioMaddenerResponses = [
  "You're like a cloud—when you disappear, it's a beautiful day.",
  "Your secrets are always safe with me. I never even listen when you tell me them.",
  "You bring everyone so much joy… when you leave the room.",
  "You have something on your chin… no, the third one down.",
  "You're as useless as the 'ueue' in 'queue'.",
  "You have the charisma of a damp rag.",
  "You're the reason the gene pool needs a lifeguard.",
  "You're like a software update that never finishes.",
  "Your brain's so small, it can't even hold a single thought.",
  "You're proof that evolution can go in reverse.",
  "You have something on your chin... no, the third one down.",
  "You are as sharp as a marble.",
  "Your face could scare the paint off a wall.",
  "If you were any slower, you'd be going backwards.",
  "You're the human version of a participation trophy.",
  "You're about as useful as a screen door on a submarine.",
  "Your personality is a black hole sucking in all the fun.",
  "You're like a puzzle with half the pieces missing.",
  "You bring as much excitement as watching paint dry.",
  "Your sense of direction is so bad, even GPS gave up.",
  "You're the reason some animals eat their young.",
  "You have the emotional range of a teaspoon.",
  "You're as bright as a burnt-out light bulb.",
  "You couldn't pour water out of a boot with instructions on the heel.",
  "You're as charming as a rattlesnake at a picnic.",
  "You’re a few fries short of a Happy Meal.",
  "You have the appeal of a soggy sandwich.",
  "You’re about as intimidating as a kitten with a nap.",
  "Your wit is so slow it has to be restarted.",
  "You're the human equivalent of a typo.",
  "You’re as relevant as floppy disks in 2025.",
  "You have the grace of a giraffe on roller skates.",
  "Your thoughts seem to be buffering… forever.",
  "You're as welcome as a mosquito at a nudist colony.",
  "Your charm could kill… off a party.",
  "You're like a broken pencil—pointless.",
  "You’re the reason why mirrors break.",
  "Your words have all the impact of a whisper in a hurricane.",
  "You're as subtle as a brick through a window.",
  "You're about as useful as a chocolate teapot.",
  "Your jokes land like a lead balloon.",
  "You have all the warmth of an ice cube.",
  "You're as coordinated as a newborn deer.",
  "Your ideas are so stale, they belong in a museum.",
  "You're the human version of a typo.",
  "You have the personality of a damp sponge.",
  "You're as interesting as a traffic jam.",
  "You’re the reason Siri answers with ‘I don’t understand’.",
  "You have the social skills of a brick wall.",
  "You're as sharp as a butter knife.",
  "Your presence is as inspiring as a Monday morning.",
  "You're about as bright as a blackout.",
  "You’re the plot twist no one asked for.",
  "Your voice is the reason mute buttons exist.",
  "You’re a walking '404 Not Found'.",
  "Your confidence is inversely proportional to your competence.",
  "You're like a car with no engine—going nowhere fast.",
  "You have the depth of a kiddie pool.",
  "You’re as consistent as a broken clock.",
  "You’re the reason coffee needs to be stronger.",
  "Your intelligence must be quarantined.",
  "You bring new meaning to 'underwhelming'.",
  "You’re about as organized as a sock drawer exploded.",
  "Your ideas are so bright, they need sunglasses.",
  "You’re a conversation killer on legs.",
  "You have the enthusiasm of a damp rag.",
  "You’re the punchline of your own jokes.",
  "You’re like a phone with no signal—completely useless.",
  "You have the sense of humor of a rock.",
  "You’re the human equivalent of spam emails.",
  "You have the elegance of a dropped watermelon.",
  "You’re as memorable as wallpaper.",
  "You’re the reason the internet invented the block button.",
  "Your brain takes longer to start than Windows 95.",
  "You’re the reason they put instructions on shampoo bottles.",
  "You have the subtlety of a fire alarm.",
  "You’re like a kite in a thunderstorm—dangerous and pointless.",
  "Your charm is about as natural as a mannequin smile.",
  "You’re a few clowns short of a circus.",
  "You’re about as useful as a one-legged stool.",
  "You’re the human equivalent of a slow-loading webpage.",
  "Your ideas make about as much sense as a screen door on a submarine.",
  "You’re as welcome as a skunk at a garden party.",
  "Your voice is like nails on a chalkboard—constantly irritating.",
  "You’re the reason GPS recalculates so often.",
  "Your sense of style is stuck in a time warp.",
  "You have the personality of a boiled potato.",
  "You’re as sharp as a marble, twice removed.",
  "Your smile could scare children.",
  "You have all the appeal of a soggy sock.",
  "You’re like a flat tire on the highway of life.",
  "You’re the reason ‘meh’ became a thing.",
  "Your wit is so dull it requires a warning label.",
  "You’re the human embodiment of a typo.",
  "Your presence causes more awkward silences than a bad joke.",
  "You’re as interesting as a blank page.",
  "Your confidence is inversely related to reality.",
  "You’re about as smooth as sandpaper.",
  "You have the charm of expired milk.",
  "You’re the reason people invented ‘ignore’ buttons."
];
      const person = data.options.find(opt => opt.name === 'user');
      const randomResponse = dioMaddenerResponses[Math.floor(Math.random() * dioMaddenerResponses.length)];
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          // Fetches a random emoji to send from a helper function
          content: `${person.value} ${randomResponse}`,
        },
      });
    }

    if (name === 'areyouagayhoe') {
const gayResponses = [
  // GAY RESPONSES 🌈
  "You're gay, and you're glowing with glitter right now. 🌈",
  "You're so gay, you probably turned this code rainbow. 🌈",
  "You're gay, and your playlist is just bangers and divas. 🌈",
  "You’re gay—your aura smells like iced coffee and confidence. 🌈",
  "You're gay, and you just involuntarily did jazz hands. 🌈",
  "You're gay, and your walk has background music. 🌈",
  "You're gay—you've made eye contact and created drama. 🌈",
  "You're gay, and that explains the flair in your typing. 🌈",
  "You're gay—rainbows follow you like a cursed RPG aura. 🌈",
  "You're gay. The glitter is legally binding. 🌈",
  "You're gay, and your browser history proves it. 🌈",
  "You're gay, and even your socks are fabulous. 🌈",
  "You're gay, and your pet knows. 🌈",
  "You're gay, and you read this in a musical theater voice. 🌈",
  "You're gay—your plants are thriving and so are you. 🌈",
  "You're gay, and you once cried over a sunset. 🌈",
  "You're gay, and yes, that *was* a vibe shift. 🌈",
  "You're gay—your eyeliner is metaphysical. 🌈",
  "You're gay. You don't just slay—you *devour*. 🌈",
  "You're gay, and your keyboard is low-key fabulous. 🌈",
  "You're gay—you brought a tote bag to a knife fight. 🌈",
  "You're gay. Even your code has a personality. 🌈",
  "You're gay—emotionally, spiritually, cosmically. 🌈",
  "You're gay. You live, laugh, and *love* aggressively. 🌈",
  "You're gay. You whispered 'slay' under your breath just now. 🌈",

  // STRAIGHT RESPONSES 🧍‍♂️
  "You're straight. You just sighed for no reason. 🧍‍♂️",
  "You're straight, and you have strong opinions about lawn care. 🧍‍♂️",
  "You're straight—you just gave a thumbs-up in real life. 🧍‍♂️",
  "You're straight. You describe pizza as 'good stuff.' 🧍‍♂️",
  "You're straight—your default dance is a head nod. 🧍‍♂️",
  "You're straight. You think 'weekend plans' means Home Depot. 🧍‍♂️",
  "You're straight—emotionally stable, but beige. 🧍‍♂️",
  "You're straight. You definitely said 'let's rock and roll' once. 🧍‍♂️",
  "You're straight—you have a deep connection to cargo shorts. 🧍‍♂️",
  "You're straight. Your Spotify Wrapped is 100% classic rock. 🧍‍♂️",
  "You're straight. You call jeans 'a nice pair of pants.' 🧍‍♂️",
  "You're straight. You refer to any drama as 'a bit much.' 🧍‍♂️",
  "You're straight—you only use emojis when you're being sarcastic. 🧍‍♂️",
  "You're straight—you've rewatched *Top Gun* sincerely. 🧍‍♂️",
  "You're straight. You said 'can't complain' to a stranger today. 🧍‍♂️",
  "You're straight—you think 'spicy' means black pepper. 🧍‍♂️",
  "You're straight. You gave a firm handshake to your own reflection. 🧍‍♂️",
  "You're straight—your idea of decorating is 'putting stuff on a shelf.' 🧍‍♂️",
  "You're straight, and you think WiFi is magic. 🧍‍♂️",
  "You're straight. You told someone to 'crack open a cold one' unironically. 🧍‍♂️",
  "You're straight—you consider khaki a power move. 🧍‍♂️",
  "You're straight. Your soul is in grayscale. 🧍‍♂️",
  "You're straight—you rate sandwiches on a 10-point scale. 🧍‍♂️",
  "You're straight—you've referred to yourself as a 'simple guy.' 🧍‍♂️",
  "You're straight. You just nodded and said, 'makes sense.' 🧍‍♂️",
];

      const person = data.options.find(opt => opt.name === 'user');
      const randomResponse = gayResponses[Math.floor(Math.random() * gayResponses.length)];
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          // Fetches a random emoji to send from a helper function
          content: `${person.value} ${randomResponse}`,
        },
      });
    }

    if (name === 'areyouatrans') {
const genderResponses = [
  // TRANS RESPONSES 🏳️‍⚧️
  "You're trans—and your gender is a finely tuned aesthetic. 🏳️‍⚧️",
  "You're trans, and your vibe is immaculate. 🏳️‍⚧️",
  "You're trans—you've unlocked gender DLC. 🏳️‍⚧️",
  "You're trans, and your existence rewrites the lore. 🏳️‍⚧️",
  "You're trans—gender just couldn’t contain you. 🏳️‍⚧️",
  "You're trans. Your pronouns have plot armor. 🏳️‍⚧️",
  "You're trans—you crafted your gender like a legendary weapon. 🏳️‍⚧️",
  "You're trans. Your reflection nods back with approval. 🏳️‍⚧️",
  "You're trans—your gender is just correct™. 🏳️‍⚧️",
  "You're trans, and your gender ray is set to 'slay.' 🏳️‍⚧️",
  "You're trans—your gender is DIY, artisan, and cooler than cis ever was. 🏳️‍⚧️",
  "You're trans. Even your vibes have transitioned. 🏳️‍⚧️",
  "You're trans, and you invented a new shade of confidence. 🏳️‍⚧️",
  "You're trans—gender envy radiates from your pores. 🏳️‍⚧️",
  "You're trans. You turned dysphoria into drip. 🏳️‍⚧️",
  "You're trans—you make mirrors question *themselves*. 🏳️‍⚧️",
  "You're trans. You changed your gender and the Wi-Fi started working better. 🏳️‍⚧️",
  "You're trans—you didn’t just transition, you evolved. 🏳️‍⚧️",
  "You're trans. You’re the main character of your gender arc. 🏳️‍⚧️",
  "You're trans—and it’s giving divine timeline energy. 🏳️‍⚧️",
  "You're trans. You customized your identity like a Sims avatar and it *slaps*. 🏳️‍⚧️",
  "You're trans. You gendered so hard you looped back into cool. 🏳️‍⚧️",
  "You're trans—you picked your pronouns like Pokémon starters. 🏳️‍⚧️",
  "You're trans. Your existence is a powerful retcon. 🏳️‍⚧️",
  "You're trans—you didn't come out, you *arrived*. 🏳️‍⚧️",

  // CIS RESPONSES 🧍
  "You're cis. You’ve never once questioned the loading screen. 🧍",
  "You're cis—your gender settings are still on factory default. 🧍",
  "You're cis. Your pronouns come pre-installed. 🧍",
  "You're cis—you looked in the mirror and said 'yeah, this'll do.' 🧍",
  "You're cis. Your gender is about as spicy as plain oatmeal. 🧍",
  "You're cis—you've never had to update your gender drivers. 🧍",
  "You're cis, and you've never experienced gender lag. 🧍",
  "You're cis—your gender identity is in the user manual. 🧍",
  "You're cis. You wear socks with your gender. 🧍",
  "You're cis—your vibes are ‘default character select.’ 🧍",
  "You're cis. You've never been asked your pronouns in good faith. 🧍",
  "You're cis. You gendered by simply existing. 🧍",
  "You're cis—you treat gender like a library book: you just keep it until someone asks. 🧍",
  "You're cis. You thought ‘cis’ was a file extension. 🧍",
  "You're cis—you use your birth certificate as personality. 🧍",
  "You're cis. You once said ‘I don’t see gender.’ 🧍",
  "You're cis—your gender identity has not been patched in years. 🧍",
  "You're cis. You skipped the character customization screen. 🧍",
  "You're cis—you've never met the Gender Goblin™. 🧍",
  "You're cis. You treat pronouns like a shrug. 🧍",
  "You're cis—you once called gender 'not that deep.' 🧍",
  "You're cis. Your idea of a gender journey is walking to the bathroom. 🧍",
  "You're cis—you still think gender reveals are a good idea. 🧍",
  "You're cis. Your gender is beige. Just beige. 🧍",
  "You're cis—you never once had to Google ‘what is gender.’ 🧍",

  // NON-BINARY RESPONSES 💫
  "You're non-binary—your gender transcends mortal understanding. 💫",
  "You're non-binary. You are the liminal space between vibes. 💫",
  "You're non-binary—your gender is a well-crafted indie game. 💫",
  "You're non-binary. Your pronouns are written in stardust. 💫",
  "You're non-binary—the binary was too basic for your taste. 💫",
  "You're non-binary. You operate on aesthetic, not rules. 💫",
  "You're non-binary—your gender is like jazz: unpredictable and brilliant. 💫",
  "You're non-binary. You skipped the gender dropdown. 💫",
  "You're non-binary—you don’t *have* a box, you *burned* it. 💫",
  "You're non-binary. Your vibe is somewhere between moonlight and mischief. 💫",
  "You're non-binary—you mix genders like potions. 💫",
  "You're non-binary. You're the secret third thing. 💫",
  "You're non-binary—your gender is coded in dream logic. 💫",
  "You're non-binary. Time, space, and pronouns bend around you. 💫",
  "You're non-binary—you exist between the notes. 💫",
  "You're non-binary. You are the glitch in the gender matrix. 💫",
  "You're non-binary—your gender floats like a cloud, unbothered. 💫",
  "You're non-binary. Your existence makes the binary nervous. 💫",
  "You're non-binary—you summoned your gender with a tarot deck. 💫",
  "You're non-binary. Your energy is ethereal and unexplained. 💫",
  "You're non-binary—you chose chaos and it looks good on you. 💫",
  "You're non-binary. Gender? You customized it. 💫",
  "You're non-binary—pronouns? You pick 'em like outfits. 💫",
  "You're non-binary. The stars spell out your gender. 💫",
  "You're non-binary. You ARE the vibe. 💫",

  // GENDERFLUID RESPONSES 🌊
  "You're genderfluid—today’s gender is ✨movement✨. 🌊",
  "You're genderfluid. Your identity updates like a playlist. 🌊",
  "You're genderfluid—your gender has patch notes. 🌊",
  "You're genderfluid. You switch it up like outfits and slay every one. 🌊",
  "You're genderfluid—your gender is a shape-shifting dragon. 🌊",
  "You're genderfluid. You walk into a room and the vibes adjust. 🌊",
  "You're genderfluid—your pronouns moonwalk. 🌊",
  "You're genderfluid. Your gender spins like a disco ball. 🌊",
  "You're genderfluid—your identity is fluid and fierce. 🌊",
  "You're genderfluid. Some days it's they/them, some days it's ‘watch me.’ 🌊",
  "You're genderfluid—your gender is in motion like a perfect transition. 🌊",
  "You're genderfluid. Your vibe is dynamic by design. 🌊",
  "You're genderfluid—your gender has a playlist and it slaps. 🌊",
  "You're genderfluid. You gender like a shapeshifter with style. 🌊",
  "You're genderfluid—your identity flows like poetry. 🌊",
  "You're genderfluid. Your gender defies gravity. 🌊",
  "You're genderfluid—each morning is a mystery box. 🌊",
  "You're genderfluid. You flex gender like a performance art piece. 🌊",
  "You're genderfluid—your gender’s got main character energy. 🌊",
  "You're genderfluid. Labels fear your power. 🌊",
  "You're genderfluid—your gender just hit shuffle. 🌊",
  "You're genderfluid. You update your gender in real time. 🌊",
  "You're genderfluid—your gender changes with the moon. 🌊",
  "You're genderfluid. Your pronouns have a wardrobe. 🌊",
  "You're genderfluid. The binary can't catch you—you’re too fast. 🌊",
];


      const person = data.options.find(opt => opt.name === 'user');
      const randomResponse = genderResponses[Math.floor(Math.random() * genderResponses.length)];
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          // Fetches a random emoji to send from a helper function
          content: `${person.value} ${randomResponse}`,
        },
      });
    }

    if (name === 'gruglove') {
      const grugResponses = [
  "you good. Grug like. Grug heart go boom.",
  "you not throw rock at Grug. You friend. Maybe more?",
  "Grug hit head on tree thinking of you.",
  "Grug see you. Brain stop. Fire start.",
  "Grug give biggest bone. That mean love.",
  "you warm. Like fire. Grug like fire.",
  "Grug smash mammoth for you. That love.",
  "you no scream when see Grug. Grug feel special.",
  "Grug grunt loud when you near. Is love noise.",
  "Grug dream of you. Also of big rock. But mostly you.",
  "you face not scary. Grug impressed.",
  "Grug no know words. Just… ugh. But ugh mean love.",
  "Grug fight sky beast for you. Sky beast scary. You worth it.",
  "you strong. Smash good. Grug swoon.",
  "Grug pick flower. Then eat. Then get new one for you.",
  "Grug draw you on cave wall. Look like potato. Still love.",
  "you give Grug weird feeling in belly. Not hunger. Maybe love?",
  "Grug fall in lava for you. Slowly. Dramatic.",
  "Grug build cave with extra moss. You live there now.",
  "you hit Grug with stick. Grug blushing (inside)."
];
      const person = data.options.find(opt => opt.name === 'user');
      const randomResponse = grugResponses[Math.floor(Math.random() * grugResponses.length)];
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          // Fetches a random emoji to send from a helper function
          content: `${person.value} ${randomResponse}`,
        },
      });
    }

    console.error(`unknown command: ${name}`);
    return res.status(400).json({ error: 'unknown command idiot' });
  }

  

  console.error('unknown interaction type', type);
  return res.status(400).json({ error: 'unknown interaction type' });
});

app.listen(PORT, () => {
  console.log('Listening on port', PORT);
});
