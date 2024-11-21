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

    const invoicesResult = await db.query(
      "SELECT id FROM invoices WHERE comp_code = $1",
      [code]
    );

    const compnay = companyResult.row[0]
    company.invoices = invoicesResult.rows.map((inv) => inv.id)

    return res.json({ company })
  } catch (err) {
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