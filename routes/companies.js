"use strict";

const express = require("express");
const db = require("../db");

const { BadRequestError, NotFoundError } = require("../expressError");

const router = express.Router();

router.get('/', async function(req, res, next) {
  const results = await db.query(`
    SELECT code, name, description
      FROM companies
  `);

  return res.json({companies: results.rows});
});


router.get('/:code', async function(req, res, next) {
  const compCode = req.params.code;

  const results = await db.query(`
    SELECT code, name, description
      FROM companies
      WHERE code = $1
  `, [compCode]);

  const company = results.rows[0];

  if (!company) throw new NotFoundError(`No matching company: ${compCode}`);

  return res.json({ company });
});


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


// router.put('/:code', async function(req, res, next) {

// });


// router.delete('/:code', async function(req, res, next) {

// });


module.exports = router;