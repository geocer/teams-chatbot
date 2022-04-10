// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const {
    TurnContext,
    MessageFactory,
    TeamsInfo,
    TeamsActivityHandler,
    CardFactory,
    ActionTypes
} = require('botbuilder');
const TextEncoder = require('util').TextEncoder;
const WebHookCD = require('../services/webhookGitlab');
const logger = require('../metrics/logger');

class TeamsConversationBot extends TeamsActivityHandler {
    constructor() {
        super();
        this.onMessage(async (context, next) => {
            TurnContext.removeRecipientMention(context.activity);
            const text = context.activity.text.trim().toLocaleLowerCase();
            if (text.includes('mention')) {
                await this.mentionActivityAsync(context);
            } else if (text.includes('update')) {
                await this.cardActivityAsync(context, true);
            } else if (text.includes('delete')) {
                await this.deleteCardActivityAsync(context);
            } else if (text.includes('message')) {
                await this.messageAllMembersAsync(context);
            } else if (text.includes('play')) {
                await this.getSingleMember(context, "aprovado"); 
            } else if (text.includes('cancel')) {
                await this.getSingleMember(context, "reprovado"); 
            } else {
                await this.cardActivityAsync(context, false);
            }
        });

        this.onMembersAddedActivity(async (context, next) => {
            context.activity.membersAdded.forEach(async (teamMember) => {
                if (teamMember.id !== context.activity.recipient.id) {
                    await context.sendActivity(`Welcome to the team ${ teamMember.givenName } ${ teamMember.surname }`);
                }
            });
            await next();
        });
    }

    async cardActivityAsync(context, isUpdate) {

        //console.log("cardActivityAsync")
        logger.log('info', 'cardActivityAsync');
        //console.log(JSON.stringify(context))
      
        // console.log("CONTEXT.TEXT:" +context.activity.text)
        // const pipeline = JSON.parse(context.activity.text);
        // console.log("PIPELINE.JSON:" +pipeline)
        // console.log("PROJECT_ID.JSON:" +pipeline.project_id)
        // console.log("CONTEXT.JSON:" +JSON.stringify(context))
        
        // const pipelineValues = {
        //     project: pipeline.project,
        //     project_id: pipeline.project_id,
        //     job_id: pipeline.job_id
        // };

        // const cardActions = [
        //     {
        //         type: ActionTypes.MessageBack,
        //         title: 'Aprovar',
        //         value: pipelineValues,
        //         text: '{"action": "play"}'
        //     },
        //     {
        //         type: ActionTypes.MessageBack,
        //         title: 'Rejeitar',
        //         value: pipelineValues,
        //         text: '{"action": "cancel"}'
        //     }
        // ];

        if (isUpdate) {
            //await this.sendUpdateCard(context, cardActions);
            await this.sendUpdateCard(context);
        } else {
            //await this.sendWelcomeCard(context, cardActions);
            await this.sendWelcomeCard(context);
        }
    }

    //async sendUpdateCard(context, cardActions) {
    async sendUpdateCard(context) { 

        //console.log("sendUpdateCard")
        logger.log('info', 'sendUpdateCard');
        //console.log(JSON.stringify(context))
      
        const data = context.activity.value;
        //console.log("Data.project:" +data.project)
        //console.log("Data:" +JSON.stringify(data))
        const action = JSON.parse(context.activity.text);

        const ACData = require('adaptivecards-templating');
        const templatePayload = require('../resources/updatedCard.json');
        let cardTemplate = new ACData.Template(templatePayload);
        let card = cardTemplate.expand({
           $root: data
        });

        console.log(JSON.stringify(card))
        
        // cardActions.push({
        //     type: ActionTypes.MessageBack,
        //     title: 'Update Card',
        //     value: data,
        //     text: '{"action": "UpdateCardAction"}'
        // });

        // const card = CardFactory.heroCard(
        //     'Done!',
        //     `Projeto: ${ data.project }`,
        //     null
        // );
        
        await WebHookCD.WebHookCD(data, action.action);

        card.id = context.activity.replyToId;
        //const message = MessageFactory.attachment(card);
        const message = MessageFactory.attachment(CardFactory.adaptiveCard(card))
        message.id = context.activity.replyToId;
        await context.updateActivity(message);
    }

    async sendWelcomeCard(context, cardActions) {

        const pipeline = JSON.parse(context.activity.text);
        //console.log("PROJECT_ID:" +pipeline.project_id)
        
        const card = CardFactory.heroCard(
            'Notificação de release em produção',
            `Projeto: ${ pipeline.project } `,
            null,
            cardActions
        );
        
        
        await context.sendActivity(MessageFactory.attachment(card));
    }

    async getSingleMember(context, status) {
        //console.log("getSingleMember")
        //console.log(context)
        var member;
        try {
            member = await TeamsInfo.getMember(context, context.activity.from.id);
        } catch (e) {
            if (e.code === 'MemberNotFoundInConversation') {
                context.sendActivity(MessageFactory.text('Member not found.'));
                return;
            } else {
                console.log(e);
                throw e;
            }
        }
        member = await TeamsInfo.getMember(context, context.activity.from.id);
        const pValue = context.activity.value;
        const message = MessageFactory.text(`Release ${ pValue.project } ${ status } por ${ member.name } em ${ new Date() }`);
        await this.cardActivityAsync(context, true);
        await context.sendActivity(message);
    }

    async mentionActivityAsync(context) {
        const mention = {
            mentioned: context.activity.from,
            text: `<at>${ new TextEncoder().encode(context.activity.from.name) }</at>`,
            type: 'mention'
        };

        const replyActivity = MessageFactory.text(`Hi ${ mention.text }`);
        replyActivity.entities = [mention];
        await context.sendActivity(replyActivity);
    }

    async deleteCardActivityAsync(context) {
        await context.deleteActivity(context.activity.replyToId);
    }

    // If you encounter permission-related errors when sending this message, see
    // https://aka.ms/BotTrustServiceUrl
    async messageAllMembersAsync(context) {
        const members = await this.getPagedMembers(context);

        members.forEach(async (teamMember) => {
            const message = MessageFactory.text(`Hello ${ teamMember.givenName } ${ teamMember.surname }. I'm a Teams conversation bot.`);

            var ref = TurnContext.getConversationReference(context.activity);
            ref.user = teamMember;

            await context.adapter.createConversation(ref,
                async (t1) => {
                    const ref2 = TurnContext.getConversationReference(t1.activity);
                    await t1.adapter.continueConversation(ref2, async (t2) => {
                        await t2.sendActivity(message);
                    });
                });
        });

        await context.sendActivity(MessageFactory.text('All messages have been sent.'));
    }

    async getPagedMembers(context) {
        var continuationToken;
        var members = [];
        do {
            var pagedMembers = await TeamsInfo.getPagedMembers(context, 100, continuationToken);
            continuationToken = pagedMembers.continuationToken;
            members.push(...pagedMembers.members);
        } while (continuationToken !== undefined);
        return members;
    }
}

module.exports.TeamsConversationBot = TeamsConversationBot;
