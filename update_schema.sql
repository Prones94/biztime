-- update_schema.sql

-- Create the industries table
CREATE TABLE industries (
  code TEXT PRIMARY KEY,
  industry TEXT NOT NULL
);

CREATE TABLE companies_industries (
  company_code TEXT NOT NULL REFERENCES companies(code) ON DELETE CASCADE,
  industry_code TEXT NOT NULL REFERENCES industries(code) ON DELETE CASCADE,
  PRIMARY KEY (company_code, industry_code)
);