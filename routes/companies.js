"use strict";

const express = require("express");
const db = require("../db");

const { BadRequestError, NotFoundError } = require("../expressError");

const router = express.Router();

/** returns list of companies {companies: [{code, name}]} */

router.get('/', async function(req, res, next) {
  const results = await db.query(`
    SELECT code, name, description
      FROM companies
      ORDER BY name
  `);
  const companies = results.rows;

  return res.json({companies});

});


/** return obj of company and it's related invoices:
 * {company: {code, name, description, invoices: [id, ...]}}
 * return a 404 status if the company cannot be found.
 */

router.get('/:code', async function(req, res, next) {
  const code = req.params.code;

  const cResults = await db.query(`
    SELECT code, name, description
      FROM companies
      WHERE code = $1`,
      [code]
  );

  const iResults = await db.query(`
    SELECT c.code, c.name, c.description, i.id
      FROM invoices AS i
        JOIN companies AS c ON i.comp_code = c.code
        WHERE i.comp_code = $1`,
        [code]
  );

  const invoices = iResults.rows.map(r => r.id);
  const company = cResults.rows[0];
  company.invoices = invoices;

  if (company === undefined) throw new NotFoundError(`No matching company: ${code}`);

  return res.json({ company });

});


/** adds a company, needs to give JSON like: {code, name, description}
 * returns obj of new company: {company: {code, name, description}}
 */

router.post('/', async function(req, res, next) {
  if (req.body === undefined) throw new BadRequestError();
  const { code, name, description } = req.body;

  const results = await db.query(
    `INSERT INTO companies (code, name, description)
         VALUES ($1, $2, $3)
         RETURNING code, name, description`,
    [code, name, description]);

  const company = results.rows[0];

  return res.status(201).json({ company });

});

/** edits existing company. returns a 404 if company cannot be found.
 * needs to give JSON like: {name, description}
 * returns updated company object: {company: {code, name, description}}
 */

router.put('/:code', async function(req, res, next) {
  if (req.body === undefined) throw new BadRequestError();

  const {name, description } = req.body;
  const code = req.params.code;

  const results = await db.query(
    `UPDATE companies
        SET name = $1, description = $2
        WHERE code = $3
        RETURNING code, name, description`,
        [name, description, code]
  )

  const company = results.rows[0];

  if (company === undefined) {
    throw new NotFoundError(`No matching company: ${code}`);
  }

  return res.json({ company });

});


/** deletes company. should return 404 if company cannot be found.
 * returns {status: "deleted"} */

router.delete('/:code', async function(req, res, next) {

  const code = req.params.code;

  const results = await db.query(`
    DELETE FROM companies
    WHERE code = $1
    RETURNING code, name, description`,
    [code]
  )

  const company = results.rows[0];

  if (!company) throw new NotFoundError(`No matching company: ${code}`);

  return res.json({status: "Deleted!"})

});


module.exports = router;