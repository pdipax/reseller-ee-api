"use strict";

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use("Model");

class RemiComuni extends Model {
  static boot() {
    super.boot();
    this.addTrait("NoTimestamp");
  }

  static get table() {
    return "remi_comuni";
  }
}

module.exports = RemiComuni;
