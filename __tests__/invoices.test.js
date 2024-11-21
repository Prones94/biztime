const request = require("supertest")
const app = require("../app")
const db = require("../db")

beforeEach(async () => {
  await db.query("DELETE FROM invoices")
  await db.query("DELETE FROM companies")
  await db.query(`
      INSERT INTO companies (code, name, description)
      VALUES ('apple', 'Apple Inc.', 'Maker of iPhones');
  `);
  await db.query(`
      INSERT INTO invoices (comp_code, amt, paid, add_date, paid_date)
      VALUES ('apple', 100, false, '2023-01-01', null);
  `)
})

afterAll(async () => {
  await db.end()
})

describe("GET /invoices", () => {
  test("Gets a list of invoices", async () => {
    const resp = await request(app).get("/invoices")
    expect(resp.statusCode).toBe(200)
    expect(resp.body).toEqual({
      invoices: [{ id: expect.any(Number), comp_code: "apple"}]
    })
  })
})

describe("GET /invoices/:id", () => {
  test("Gets a single invoice", async () => {
    const invoice = await db.query("SELECT id FROM invoices LIMIT 1")
    const id = invoice.rows[0].id

    const resp = await request(app).get(`/invoices/${id}`)
    expect(resp.statusCode).toBe(200)
    expect(resp.body.invoice).toMatchObject({
      id,
      comp_code: "apple",
      amt: 100,
      paid: false,
    })
  })

  test("Responds with 404 if invoice not found", async () => {
    const resp = await request(app).get("/invoices/9999")
    expect(resp.statusCode).toBe(404)
  })
})

describe("POST /invoices", () => {
  test("Creates a new invice", async () => {
    const resp = await request(app)
      .post("/invoices")
      .send({ comp_code: "apple", amt: 200 })
    expect(resp.statusCode).toBe(201)
    expect(resp.body.invoice).toMatchObject({
      comp_code: "apple",
      amt: 200,
    })
  })
})

describe("PUT /invoices/:id", () => {
  test("updates an invoice", async () => {
    const invoice = await db.query("SELECT id FROM invoices LIMIT")
    const id = invoice.rows[0].id

    const resp = await request(app).put(`/invoices/${id}`).send({ amt: 300 })
    expect(resp.statusCode).toBe(200)
    expect(resp.body.invoice).toMatchObject({
      id,
      amt: 300,
    })
  })
})

describe("DELETE /invoices/:id", () => {
  test("Deletes an invoice", async () => {
    const invoice = await db.query("SELECT id FROM invoices LIMIT 1")
    const id = invoice.rows[0].id

    const resp = await request(app).delete(`/invioces/${id}`)
    expect(resp.statusCode).toBe(200)
    expect(resp.body).toEqual({ status: "deleted" })
  })

  test("Responds with 404 if invoice not found", async () => {
    const resp = await request(app).delete("/invoices/9999")
    expect(resp.statusCode).toBe(404)
  })
})