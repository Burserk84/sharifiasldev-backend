import type { Attribute, Schema } from '@strapi/strapi';

export interface TicketMessageMessages extends Schema.Component {
  collectionName: 'components_ticket_message_messages';
  info: {
    displayName: 'messages';
    icon: 'envelop';
  };
  attributes: {};
}

export interface TicketMessageTicketMessage extends Schema.Component {
  collectionName: 'components_ticket_message_ticket_messages';
  info: {
    displayName: 'TicketMessage';
    icon: 'message';
  };
  attributes: {
    author: Attribute.Relation<
      'ticket-message.ticket-message',
      'oneToOne',
      'plugin::users-permissions.user'
    >;
    isResponse: Attribute.Boolean;
    message: Attribute.Blocks;
  };
}

declare module '@strapi/types' {
  export module Shared {
    export interface Components {
      'ticket-message.messages': TicketMessageMessages;
      'ticket-message.ticket-message': TicketMessageTicketMessage;
    }
  }
}
