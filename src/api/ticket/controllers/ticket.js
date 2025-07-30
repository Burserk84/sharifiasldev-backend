"use strict";
const { createCoreController } = require("@strapi/strapi").factories;

module.exports = createCoreController("api::ticket.ticket", ({ strapi }) => ({
  async findMe(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized("You must be logged in.");
    const tickets = await strapi.entityService.findMany("api::ticket.ticket", {
      filters: { user: { id: user.id } },
      fields: ["id", "title", "status", "createdAt"],
      sort: { createdAt: "desc" },
    });
    const sanitized = await this.sanitizeOutput(tickets, ctx);
    return this.transformResponse(sanitized);
  },

  /**
   * Fetch a single ticket and its messages for the logged-in user.
   */
  async findOneMe(ctx) {
    const user = ctx.state.user;
    const { ticketId } = ctx.params;
    if (!user) return ctx.unauthorized("You must be logged in.");

    try {
      const [ticket] = await strapi.entityService.findMany(
        "api::ticket.ticket",
        {
          filters: { id: ticketId, user: { id: user.id } },

          populate: {
            messages: {
              fields: ["message", "isResponse", "createdAt"],
              populate: {
                author: {
                  fields: ["id", "username"],
                },
              },
            },
          },
        }
      );

      if (!ticket) {
        return ctx.notFound("Ticket not found.");
      }

      const sanitized = await this.sanitizeOutput(ticket, ctx);
      return this.transformResponse(sanitized);
    } catch (err) {
      console.error(`--- A CRITICAL ERROR OCCURRED IN findOneMe ---`, err);
      ctx.internalServerError(
        "A critical error occurred while fetching the ticket."
      );
    }
  },

  async createMe(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized("You must be logged in.");
    const { title, department, message } = ctx.request.body;
    if (!title || !department || !message) {
      return ctx.badRequest(
        "Missing title, department, or message in request."
      );
    }
    const entity = await strapi.entityService.create("api::ticket.ticket", {
      data: {
        title,
        department,
        status: "Open",
        user: user.id,
        messages: [{ message, isResponse: false, author: user.id }], // Message is now a plain string
        publishedAt: new Date(),
      },
    });
    const sanitized = await this.sanitizeOutput(entity, ctx);
    return this.transformResponse(sanitized);
  },

  async reply(ctx) {
    const user = ctx.state.user;
    const { ticketId } = ctx.params;
    const { message } = ctx.request.body;
    if (!user || !message) return ctx.badRequest("Missing user or message.");
    const [ticketToUpdate] = await strapi.entityService.findMany(
      "api::ticket.ticket",
      {
        filters: { id: ticketId, user: { id: user.id } },
        populate: { messages: true },
      }
    );
    if (!ticketToUpdate) return ctx.notFound("Ticket not found.");
    const newMessageComponent = { message, isResponse: false, author: user.id };
    const updatedTicket = await strapi.entityService.update(
      "api::ticket.ticket",
      ticketId,
      {
        data: {
          messages: [...(ticketToUpdate.messages || []), newMessageComponent],
        },
      }
    );
    const sanitized = await this.sanitizeOutput(updatedTicket, ctx);
    return this.transformResponse(sanitized);
  },
}));
