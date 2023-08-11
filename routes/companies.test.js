"use strict";

const request = require("supertest");

const app = require("../app");
const db = require("../db");

let testCompany;

beforeEach(async function () {
  await db.query("DELETE FROM companies");
  let result = await db.query(`
    INSERT INTO companies (code, name, description)
    VALUES ('twitter', 'Twitter', 'Elon Musk')
    RETURNING code, name, description`);
  testCompany = result.rows[0];
});

// console.log('*****testCompany', testCompany);

describe("GET /companies", function () {

  test("Gets list of companies", async function () {
    const resp = await request(app).get(`/companies`);
    expect(resp.body).toEqual({
      companies: [testCompany],
    });
  });
});


/**  */
describe("GET /companies/:code", function () {
  test("Gets single company", async function () {
    const resp = await request(app).get(`/companies/${testCompany.code}`);
    expect(resp.body).toEqual({
      company: {
        code: "twitter",
        name: "Twitter",
        description: "Elon Musk",
        invoices: [],
      }
    });
  });

  test("404 if not found", async function () {
    const resp = await request(app).get(`/companies/0`);
    expect(resp.statusCode).toEqual(404);
  });
});


afterAll(async function () {
  // close db connection --- if you forget this, Jest will hang
  await db.end();
});
