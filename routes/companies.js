const express = require("express")
const db = require("../db")
const router = new express.Router()
const slugify = require('slugify')

// GET /companies - Get list of companies
router.get("/", async(req,res,next) => {
  try {
    const result = await db.query("SELECT code, name FROM companies")
    return res.json({ companies: result.rows })
  } catch(err){
    return next(err)
  }
})

// GET /companies/:code - Get specific company
router.get("/:code", async (req,res,next) => {
  try {
    const { code } = req.params
    const companyResult = await db.query(
      "SELECT code, name, description FROM companies WHERE code = $1",
      [code]
    );

    if (companyResult.row.length === 0){
      return res.status(404).json({ error: "Company not found"})
    }

    const industriesResult = await db.query(
      `SELECT i.industry FROM industries AS i JOIN companies_industries AS ci ON i.code = ci.industry_code WHERE ci.company_code = $1`,
      [code]
    )

    const compnay = companyResult.row[0]
    const industries = industriesResult.rows.map((row) => row.industry)

    return res.json({ ...company, industries })
  } catch (err) {
    return next(err)
  }
})

// GET industries - List all industries
router.get("/", async (req,res, next) => {
  try {
    const result = await db.query(
      `SELECT i.code, i.industry, ARRAY_AGG(ci.company_code) AS companies FROM industries AS i LEFT JOIN companies_industries AS ci ON i.code = ci.industry_code GROUP BY i.code, i.industry`
    );

    return res.json({ industries: result.rows })
  } catch(err) {
    return next(err)
  }
})

// POST /companies = Add a new company
router.post("/", async (req,res, next) => {
  try {
    const { name, description } = req.body

    if (!name || !description) {
      return res.status(400).json({ error: "Name and description are required"})
    }

    const code = slugify(name, {
      lower: true,
      strict: true,
      replacement: "-",
    })

    const result = await db.query(
      "INSERT INTO companies (code, name, description) VALUES ($1, $2, $3) RETURNING code, name, description",
      [code, name, description]
    )

    return res.status(201).json({ company: result.rows[0] })
  } catch(err) {
    return next(err)
  }
})

// POST /industries - Add a new industry
router.post("/",async (req,res, next) => {
  try {
    const { code, industry } = req.body

    if (!code || !industry) {
      return res.status(400).json({ error: "Code and industry are required" })
    }

    const result = await db.query(
      `INSERT INTO industries (code, industry) VALUES ($1,$2) RETURNING code, industry`,
      [code, industry]
    );

    return res.status(201).json({ industry: result.rows[0] })
  } catch(err) {
    return next(err)
  }
})

// POST /industries/:code/companies - Associate an industry with a company
router.post("/:code/companies", async (req,res, next) => {
  try {
    const { code } = req.params
    const { company_code } = req.body

    if (!company_code){
      return res.status(400).json({ error: "Company code is required" })
    }

    const result = await db.query(
      `INSERT INTO companies_industries (industry_code, company_code) VALUES ($1,$2) RETURNING industry_code, company_code`,
      [code, company_code]
    );

    return res.status(201).json({ association: result.rows[0] })
  } catch(err){
    return next(err)
  }
})

// PUT /companies/:code - Edit existing company
router.put("/:code", async(req,res,next) => {
  try {
    const { code } = req.params
    const { name, description } = req.body

    const result = await db.query(
      "UPDATE companies SET name=$1, description=$2 WHERE code=$3 RETURNING code, name, description",
      [name, description, code]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Company not found" })
    }

    return res.json({ company: result.row[0] })
  } catch(err){
    return next(err)
  }
})

// DELETE /companies/:code - Delete a company
router.delete("/:code", async (req,res, next) => {
  try {
    const { code } = req.params

    const result = await db.query(
      "DELETE FROM companies WHERE code = $1 RETURNING code",
      [code]
    )

    if (result.rows.length === 0){
      return res.status(404).json({ error: "Company not found" })
    }

    return res.json({ status: "deleted" })
  } catch(err){
    return next(err)
  }
})

module.exports = router