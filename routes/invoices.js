"use strict";

const express = require("express");
const db = require("../db");

const { BadRequestError, NotFoundError } = require("../expressError");

const router = express.Router();


router.get('/', async function(req, res, next) {
  const results = await db.query(`
    SELECT id, comp_code, amt
      FROM invoices
      ORDER BY id
  `);

  const invoices = results.rows;

  return res.json({ invoices });

});


/** return JSON for invoice:
 *  { invoice: {code, name, description} company: {code, name, description}},
 * return a 404 status if the company cannot be found.
 */

router.get('/:id', async function(req, res, next) {
  const id = req.params.id;

  const iResults = await db.query(`
    SELECT id, amt, paid, add_date, paid_date
      FROM invoices AS i
        JOIN companies AS c ON i.comp_code = c.code
      WHERE id = $1
  `, [id]);

  const cResults = await db.query(`
    SELECT c.code, c.name, c.description
      FROM invoices AS i
        JOIN companies AS c ON i.comp_code = c.code
      WHERE id = $1
  `, [id]);

  const company = cResults.rows[0];
  const invoice = iResults.rows[0];

  if (invoice === undefined) {
    throw new NotFoundError(`No matching invoice: ${id}`)
  };

  return res.json({ invoice, company });

});


/** adds an invoice, needs to give JSON like: {comp_code, amt}
 * returns JSON for new invoice:
 *  { invoice: {id, comp_code, amt, paid, add_date, paid_date} }
 */

router.post('/', async function(req, res, next) {
  if (req.body === undefined) throw new BadRequestError();

  const compCode = req.body.comp_code;
  const amt = req.body.amt;

  const results = await db.query(
    `INSERT INTO invoices (comp_code, amt)
         VALUES ($1, $2)
         RETURNING id, comp_code, amt, paid, add_date, paid_date`,
         [compCode, amt]
  );

  const invoice = results.rows[0];

  return res.status(201).json({ invoice });

});

/** edits existing invoice. returns a 404 if company cannot be found.
 * needs to give JSON like: { amt }
 * returns updated invoice JSON:
 *  { invoice: {id, comp_code, amt, paid, add_date, paid_date} }
 */

router.put('/:id', async function(req, res, next) {
  if (req.body === undefined) throw new BadRequestError();

  const id = +req.params.id;
  const amt = req.body.amt;

  const results = await db.query(
    `UPDATE invoices
        SET amt = $1
        WHERE id = $2
        RETURNING id, comp_code, amt, paid, add_date, paid_date`,
        [amt, id]
  )

  const invoice = results.rows[0];

  if (invoice === undefined) throw new NotFoundError(`No matching invoice: ${id}`);

  return res.json({ invoice });

});


/** deletes invoice. should return 404 if invoice cannot be found.
 * returns JSON: { status: "deleted" } */

router.delete('/:id', async function(req, res, next) {

  const id = req.params.id;

  const results = await db.query(`
    DELETE FROM invoices
    WHERE id = $1
    RETURNING id, comp_code, amt, paid, add_date, paid_date`,
    [id]
  )
  const invoice = results.rows[0];

  if (invoice === undefined) throw new NotFoundError(`No matching invoice: ${id}`);

  return res.json({status: "Deleted!"})

});





module.exports = router;