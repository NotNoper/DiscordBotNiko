import 'dotenv/config';
import { getRPSChoices } from './game.js';
import { capitalize, InstallGlobalCommands } from './utils.js';

// Get the game choices from game.js
function createCommandChoices() {
  const choices = getRPSChoices();
  const commandChoices = [];

  for (let choice of choices) {
    commandChoices.push({
      name: capitalize(choice),
      value: choice.toLowerCase(),
    });
  }

  return commandChoices;
}

// Simple test command
const TEST_COMMAND = {
  name: 'test',
  description: 'Basic command',
  type: 1,
  integration_types: [0, 1],
  contexts: [0, 1, 2],
};

const HOT_COMMAND = {
  name: 'amihot',
  description: 'Tells you if you are hot or not based off an image',
  type: 1,
  integration_types: [0, 1],
  contexts: [0, 1, 2],
  options: [
    {
      name: 'image',
      description: 'Upload your pic 💅',
      type: 11, 
      required: true,
    },
  ],
};

const DARTH_COMMAND = {
  name: 'askdarthvader',
  description: 'Tells you the answer to your question',
  type: 1,
  integration_types: [0, 1],
  contexts: [0, 1, 2],
  options: [
    {
      name: 'text',
      description: 'Ask Darth Vader anything',
      type: 3,
      required: true,
    },
  ],
};

const SUGGESTIONS_COMMAND = {
  name: 'suggest',
  description: 'Suggest a new feature or improvement',
  type: 1,
  integration_types: [0, 1],
  contexts: [0, 1, 2],
  options: [
    {
      name: 'text',
      description: 'Your suggestion',
      type: 3,
      required: true,
    },
  ],
};

const ANNOY_COMMAND = {
  name: 'annoy',
  description: 'Annoy someone',
  type: 1,
  integration_types: [0, 1],
  contexts: [0, 1, 2],
  options: [
    {
      name: 'user',
      description: 'someone to annoy',
      type: 3,
      required: true,
    },
  ],
};

const GRUG_LOVE_COMMAND = {
  name: 'gruglove',
  description: 'Grug shows love',
  type: 1,
  integration_types: [0, 1],
  contexts: [0, 1, 2],
  options: [
    {
      name: 'user',
      description: 'someone to love',
      type: 3,
      required: true,
    },
  ],
};

const IS_GAY_HOE_COMMAND = {
  name: 'areyouagayhoe',
  description: 'Finally find out',
  type: 1,
  integration_types: [0, 1],
  contexts: [0, 1, 2],
  options: [
    {
      name: 'user',
      description: 'suspected user',
      type: 3,
      required: true,
    },
  ],
};

const IS_TRANS_COMMAND = {
  name: 'areyouatrans',
  description: 'I copy pasted the other one',
  type: 1,
  integration_types: [0, 1],
  contexts: [0, 1, 2],
  options: [
    {
      name: 'user',
      description: 'suspected user',
      type: 3,
      required: true,
    },
  ],
};

const TELL_PAKOS_COMMAND = {
  name: 'tellpakos',
  description: 'Make Leo tell Pakos something for you because you fucking suck at social interactions you twat',
  type: 1,
  integration_types: [0, 1],
  contexts: [0, 1, 2],
  options: [
    {
      name: 'text',
      description: 'what you want to tell mr pakos',
      type: 3,
      required: true,
    },
  ],
};

const MESMERIZE_COMMAND = {
  name: 'mesmerize',
  description: 'Mesmerize someone with your words',
  type: 1,
  integration_types: [0, 1],
  contexts: [0, 1, 2],
  options: [
    {
      name: 'user',
      description: 'someone to mesmerize',
      type: 3,
      required: true,
    },
    {
      name: 'text',
      description: 'what you want to say',
      type: 3,
      required: true,
    },
  ],
};

const ALL_COMMANDS = [TEST_COMMAND, HOT_COMMAND, DARTH_COMMAND, SUGGESTIONS_COMMAND, ANNOY_COMMAND, GRUG_LOVE_COMMAND, TELL_PAKOS_COMMAND, IS_GAY_HOE_COMMAND, IS_TRANS_COMMAND, MESMERIZE_COMMAND];

InstallGlobalCommands(process.env.APP_ID, ALL_COMMANDS);
