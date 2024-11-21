const request = require("supertest")
const app = require("../app")
const db = require("../db")

beforeEach(async () => {
  await db.query("DELETE FROM companies")
  await db.query(`
      INSERT INTO companies (code, name, description)
      VALUES ('apple', 'Apple Inc', 'Maker of iPhones'),
            ('ibm','IBM','Big Blue');
    `);
});

afterAll(async () => {
  await db.end();
})

describe("GET /companies", () => {
  test("Gets a list of companies", async () => {
    const resp = await request(app).get("/companies")
    expect(resp.statusCode).toBe(200)
    expect(resp.body).toEqual({
      companies: [
        { code: "apple", name: "Apple Inc." },
        { code: "ibm", name: "IBM" },
      ],
    });
  });
});

describe("GET /companies/:code", () => {
  test("Gets a single company", async () => {
    const resp = await request(app).get("/companies/apple")
    expect(resp.statusCode).toBe(200)
    expect(resp.body).toEqual({
      company: {
        code: "apple",
        name: "Apple Inc.",
        description: "Maker of iPhones",
        invoices: [],
      },
    });
  });

  test("Responds with 404 if company not found", async () => {
    const resp = await request(app).get("/companies/unknown")
    expect(resp.statusCode).toBe(404)
  });
});

describe("POST /companies", () => {
  test("Creates a new company", async () => {
    const resp = await request(app)
      .post("/companies")
      .send({ code: "msft", name: "Microsoft", description: "Windows maker"})
    expect(resp.statusCode).toBe(201)
    expect(resp.body).toEqual({
      company: {
        code: "msft",
        name: "Microsoft",
        description: "Windows maker",
      }
    })
  })
})

describe("PUT /companies/:code", () => {
  test("Updates an existing company", async () => {
    const resp = await request(app)
      .put("/companies/apple")
      .send({ name: "Apple Inc. Updated", description: "Updated description" })
    expect(resp.statusCode).toBe(200)
    expect(resp.body).toEqual({
      company: {
        code: "apple",
        name: "Apple Inc. Updated",
        description: "Updated description",
      }
    })
  })

  test("Responds with 404 if company not found", async () => {
    const resp = await request(app)
      .put("/companies/unknown")
      .send({ name: "Does Not Exist", description: "No such company" })
    expect(resp.statusCode).toBe(404)
  })
})

describe("DELETE /companies/:code", () =>  {
  test("Deletes a company", async () => {
    const resp = await request(app).delete("/companies/apple")
    expect(resp.statusCode).toBe(200)
    expect(resp.body).toEqual({ status: "deleted" })
  })

  test("Responds with 404 if company not found", async () => {
    const resp = await request(app).delete("/companies/unkown")
    expect(resp.statusCode).toBe(404)
  })
})