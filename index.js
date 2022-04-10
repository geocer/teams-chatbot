// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

// index.js is used to setup and configure your bot

// Import required pckages
const path = require('path');
const restify = require('restify');
const logger = require('./metrics/logger');

// Import required bot services.
// See https://aka.ms/bot-services to learn more about the different parts of a bot.
const { BotFrameworkAdapter, MessageFactory, CardFactory, ActionTypes } = require('botbuilder');

const { TeamsConversationBot } = require('./bots/teamsConversationBot');

// Read botFilePath and botFileSecret from .env file.
const ENV_FILE = path.join(__dirname, '.env');
require('dotenv').config({ path: ENV_FILE });

//Trustservice url
const BotConnector = require("botframework-connector");

BotConnector.MicrosoftAppCredentials.trustServiceUrl(
    "https://smba.trafficmanager.net/amer/"
  );

// Create the bot that will handle incoming messages.
const bot = new TeamsConversationBot();
//const bot = new TeamsStartNewThreadInChannel();

// Create HTTP server.
const server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function() {
    console.log(`\n${ server.name } listening to ${ server.url }`);
    console.log('\nDevopsChatbot v1.0');
});
server.use(restify.plugins.queryParser());
server.use(restify.plugins.bodyParser({ mapParams: false }));

//Listen for incoming requests.
server.post('/api/messages', (req, res) => {
    // Create adapter.
// See https://aka.ms/about-bot-adapter to learn more about adapters.
const adapter = new BotFrameworkAdapter({
    appId: process.env.MicrosoftAppId,
    appPassword: process.env.MicrosoftAppPassword
});

adapter.onTurnError = async (context, error) => {
    // This check writes out errors to console log .vs. app insights.
    // NOTE: In production environment, you should consider logging this to Azure
    //       application insights.
    console.error(`\n [onTurnError] unhandled error: ${ error }`);

    // Send a trace activity, which will be displayed in Bot Framework Emulator
    await context.sendTraceActivity(
        'OnTurnError Trace',
        `${ error }`,
        'https://www.botframework.com/schemas/error',
        'TurnError'
    );

    // Send a message to the user
    await context.sendActivity('The bot encountered an error or bug.');
    await context.sendActivity('To continue to run this bot, please fix the bot source code.');
};
    adapter.processActivity(req, res, async (context) => {
        await bot.run(context);
    });
});

server.post('/api/notify', async (req, res) => {

// Create adapter.
// See https://aka.ms/about-bot-adapter to learn more about adapters.
const adapter = new BotFrameworkAdapter({
    appId: process.env.MicrosoftAppId,
    appPassword: process.env.MicrosoftAppPassword
});

adapter.onTurnError = async (context, error) => {
    // This check writes out errors to console log .vs. app insights.
    // NOTE: In production environment, you should consider logging this to Azure
    //       application insights.
    console.error(`\n [onTurnError] unhandled error: ${ error }`);

    // Send a trace activity, which will be displayed in Bot Framework Emulator
    await context.sendTraceActivity(
        'OnTurnError Trace',
        `${ error }`,
        'https://www.botframework.com/schemas/error',
        'TurnError'
    );

    // Send a message to the user
    await context.sendActivity('The bot encountered an error or bug.');
    await context.sendActivity('To continue to run this bot, please fix the bot source code.');
};

    console.log(req.body.project);
    const msgobj = req.body.message;
    //const teamsChannelId = "19:681e98467ae14aad96a41f4fafa0e9c9@thread.tacv2";
    const teamsChannelId = req.body.teamsChannelId    
    const message = MessageFactory.text(`${msgobj}`);
    const conversationParameters = {
        isGroup: true,
        channelData: {
            channel: {
                id: teamsChannelId
            }
        },
        activity: message
    };
    const connectorClient1 = adapter.createConnectorClient("https://smba.trafficmanager.net/amer/");
    await connectorClient1.conversations.createConversation(conversationParameters);
    res.setHeader('Content-Type', 'text/html');
    res.writeHead(200);
    res.write('<html><body><h1>Proactive messages have been sent.</h1></body></html>');
    res.end();
});

server.post('/api/adaptive', async (req, res) => {
    
    logger.log('info', '/api/adaptive');

// Create adapter.
// See https://aka.ms/about-bot-adapter to learn more about adapters.
const adapter = new BotFrameworkAdapter({
    appId: process.env.MicrosoftAppId,
    appPassword: process.env.MicrosoftAppPassword
});

adapter.onTurnError = async (context, error) => {
    // This check writes out errors to console log .vs. app insights.
    // NOTE: In production environment, you should consider logging this to Azure
    //       application insights.
    console.error(`\n [onTurnError] unhandled error: ${ error }`);

    // Send a trace activity, which will be displayed in Bot Framework Emulator
    await context.sendTraceActivity(
        'OnTurnError Trace',
        `${ error }`,
        'https://www.botframework.com/schemas/error',
        'TurnError'
    );

    // Send a message to the user
    await context.sendActivity('The bot encountered an error or bug.');
    await context.sendActivity('To continue to run this bot, please fix the bot source code.');
};

    const pipelineValues = {
        project: req.body.project,
        project_id: req.body.project_id,
        job_id: req.body.job_id,
        ref: req.body.ref,
        created_at: req.body.created_at,
        committer_name: req.body.committer_name,
        committer_email: req.body.committer_email,
        releasenotes: req.body.releasenotes
    };
    
    logger.log('info', 'objeto json recebido', pipelineValues);
    
    const ACData = require('adaptivecards-templating');
    const templatePayload = require('./resources/templateCard1.json');
    let cardTemplate = new ACData.Template(templatePayload);
    let card = cardTemplate.expand({
        $root: pipelineValues
    });
    
    //console.log(JSON.stringify(card))
    logger.log('info', 'objeto adaptive card');
    //const teamsChannelId = "19:681e98467ae14aad96a41f4fafa0e9c9@thread.tacv2";
    const teamsChannelId = req.body.teamsChannelId
    logger.log('info', teamsChannelId);
    const message = MessageFactory.attachment(CardFactory.adaptiveCard(card))
        
        const conversationParameters = {
            isGroup: true,
            channelData: {
                channel: {
                    id: teamsChannelId
                }
            },
            activity: message
        };

        try {

            logger.log('info', 'adapter.createConnectorClient');
            const connectorClient = adapter.createConnectorClient("https://smba.trafficmanager.net/amer/");
            
            logger.log('info', 'connectorClient.conversations.createConversation');
            await connectorClient.conversations.createConversation(conversationParameters);
            
            res.setHeader('Content-Type', 'text/html');
            res.writeHead(200);
            res.write('<html><body><h1>Proactive messages have been sent.</h1></body></html>');
            res.end();
            //logger.log('info', 'Finalizar connectorClient');
            //delete connectorClient;
            logger.log('info', 'connectorClient.obj', connectorClient);
            logger.log('info', 'OK');
            console.log("\n")

        } 
        catch (e) {
            console.error(e);
            res.setHeader('Content-Type', 'text/html');
            res.writeHead(500);
            res.write('<html><body><h1>Algo deu errado.</h1></body></html>');
            res.end();
            logger.log('info', 'NOK');
            console.log("\n")
        }    
});