const express = require("express")
const db = require("../db")
const router = new express.Router()

// GET /invoices -- Get list of invoices
router.get("/", async (req,res, next) => {
  try {
    const result = await db.query("SELECT id, comp_code FROM invoices")
    return res.json({ invoices: result.rows })
  } catch(err){
    return next(err)
  }
})

// GET /invoices/:id - Get specific invoice
router.get("/:id", async (req,res, next) => {
  try {
    const { id } = req.params

    const invoiceResult = await db.query(
      "SELECT * FROM invoices WHERE id = $1",
      [id]
    )

    if (invoiceResult.rows.length === 0){
      return res.status(404).json({ error: "Invoice not found" })
    }

    const companyResult = await db.query(
      "SELECT code, name, description FROM companies WHERE code=$1",
      [invoiceResult.rows[0].comp_code]
    )

    const invoice = invoiceResult.row[0]
    invoice.company = companyResult.row[0]

    return res.json({ invoice })
  } catch(err){
    return next(err)
  }
})

// POST /invoices - Add a new invoice
router.post("/", async(req,res,next) => {
  try {
    const { comp_code, amt } = req.body

    const result = await db.query(
      "INSERT INTO invoices (comp_code, amt) VALUES ($1,$2) RETURNING id, comp_code, amt, paid, add_date, paid_date",
      [comp_code,amt]
    )

    return res.status(201).json({ invoice: result.row[0] })
  } catch(err){
    return next(err)
  }
})

// PUT /invoices/:id - Update an invoice
router.put("/:id", async (req,res, next) => {
  try {
    const { id } = req.params
    const { amt } = req.body

    if (amt === undefined || paid === undefined){
      return res.status(400).json({ error: "Amount and paid status are required" })
    }

    const invoiceResult = await db.query(
      "SELECT paid, paid_date FROM invoice WHERE id = $1",
      [id]
    )

    if (invoiceResult.rows.length === 0) {
      return res.status(404).json({ error: "Invoice not found" })
    }

    const currentInvoice = invoiceResult.rows[0]
    let paidDate

    if (!currentInvoice.paid && paid) {
      paidDate = new Date()
    } else if (currentInvoice.paid && !paid){
      paidDate = null
    } else {
      paidDate = currentInvoice.paid_date
    }

    const result = await db.query(
      `UPDATE invoices SET amt = $1, paid=$2, paid_date=$3 WHERE id = $4 RETURNING id, comp_code, amt, paid, add_date, paid_date`,
      [amt, paid, paidDate, id]
    )

    return res.json({ invoice: result.row[0] })
  } catch(err){
    return next(err)
  }
})

// DELETE /invoices/:id - Delete an invoice
router.delete("/:id", async (req,res,next) => {
  try {
    const { id } = req.params

    const result = await db.query(
      "DELETE FROM invoices WHERE id = $1 RETURNING id",
      [id]
    );

    if (result.rows.length === 0){
      return res.status(404).json({ error: "Invoice not found" })
    }

    return res.json({ status: "deleted" })
  } catch(err){
    return next(err)
  }
})

module.exports = router;