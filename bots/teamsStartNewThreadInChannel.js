// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const {
    TurnContext,
    MessageFactory,
    TeamsActivityHandler,
    teamsGetChannelId
} = require('botbuilder');

class TeamsStartNewThreadInChannel extends TeamsActivityHandler {
    constructor() {
        super();

        this.onMessage(async (context, next) => {
            console.log(context)
            const teamsChannelId = teamsGetChannelId(context.activity);
            const message = MessageFactory.text('This will be the first message in a new thread');
            const newConversation = await this.teamsCreateConversation(context, teamsChannelId, message);

            await context.adapter.continueConversation(newConversation[0],
                async (t) => {
                    await t.sendActivity(MessageFactory.text('This will be the first response to the new thread'));
                });

            await next();
        });
    }

    //async teamsCreateConversation(context, teamsChannelId, message) {
    async teamsCreateConversation(teamsChannelId, message, serviceUrl) {  
        console.log("teamsCreateConversation")  
        const conversationParameters = {
            isGroup: true,
            channelData: {
                channel: {
                    id: teamsChannelId
                }
            },

            activity: message
        };

        //const connectorClient = context.adapter.createConnectorClient(context.activity.serviceUrl);
        const connectorClient = context.adapter.createConnectorClient(serviceUrl);
        console.log("connectorClient" +connectorClient) 
        const conversationResourceResponse = await connectorClient.conversations.createConversation(conversationParameters);
        const conversationReference = TurnContext.getConversationReference(context.activity);
        console.log("conversationReference" +conversationReference) 
        conversationReference.conversation.id = conversationResourceResponse.id;
        console.log(conversationReference)
        return [conversationReference, conversationResourceResponse.activityId];

    }
}

module.exports.TeamsStartNewThreadInChannel = TeamsStartNewThreadInChannel;
