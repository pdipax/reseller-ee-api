"use strict";

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use("Schema");

class ContractTypesSchema extends Schema {
  up() {
    this.create("contract_types", table => {
      table.string("code", 16).primary()
      table.string("name", 128).notNullable();
    });
  }

  down() {
    this.drop("contract_types");
  }
}

module.exports = ContractTypesSchema;
