import alasql from 'alasql';

export const initSQLSandbox = () => {
  // Create a new fresh database instance
  const db = new alasql.Database();

  // Create POLICY_HOLDER table
  db.exec(`
    CREATE TABLE POLICY_HOLDER (
      POLICY_ID INT,
      CUSTOMER_NAME STRING,
      GENDER STRING,
      AGE INT,
      CITY STRING,
      POLICY_TYPE STRING,
      PREMIUM_AMOUNT INT,
      START_DATE STRING
    )
  `);

  // Insert seed data into POLICY_HOLDER based on the provided image
  db.exec(`
    INSERT INTO POLICY_HOLDER VALUES 
    (101, 'Rahul Sharma', 'Male', 35, 'Hyderabad', 'Health', 18000, '15-Jan-2024'),
    (102, 'Priya Reddy', 'Female', 29, 'Bengaluru', 'Vehicle', 15000, '10-Feb-2024'),
    (103, 'Arjun Kumar', 'Male', 42, 'Chennai', 'Life', 25000, '20-Mar-2024'),
    (104, 'Sneha Patel', 'Female', 31, 'Mumbai', 'Health', 22000, '05-Apr-2024'),
    (105, 'Kiran Rao', 'Male', 38, 'Pune', 'Vehicle', 17000, '18-May-2024'),
    (106, 'Anjali Verma', 'Female', 27, 'Delhi', 'Life', 28000, '25-Jun-2024'),
    (107, 'Vikram Singh', 'Male', 45, 'Hyderabad', 'Health', 30000, '12-Jul-2024'),
    (108, 'Meera Nair', 'Female', 33, 'Kochi', 'Vehicle', 16000, '01-Aug-2024')
  `);

  // Create INSURANCE_CLAIMS table
  db.exec(`
    CREATE TABLE INSURANCE_CLAIMS (
      CLAIM_ID INT,
      POLICY_ID INT,
      CLAIM_DATE STRING,
      CLAIM_AMOUNT INT,
      CLAIM_STATUS STRING,
      APPROVED_AMOUNT INT,
      CLAIM_REASON STRING
    )
  `);

  // Insert seed data into INSURANCE_CLAIMS based on the provided image
  db.exec(`
    INSERT INTO INSURANCE_CLAIMS VALUES 
    (201, 101, '20-Feb-2024', 120000, 'Approved', 110000, 'Hospitalization'),
    (202, 102, '15-Mar-2024', 80000, 'Rejected', 0, 'Accident'),
    (203, 103, '05-Apr-2024', 500000, 'Approved', 480000, 'Death Benefit'),
    (204, 104, '25-May-2024', 95000, 'Pending', NULL, 'Surgery'),
    (205, 105, '10-Jun-2024', 150000, 'Approved', 145000, 'Vehicle Damage'),
    (206, 106, '20-Jul-2024', 700000, 'Approved', 680000, 'Critical Illness'),
    (207, 107, '15-Aug-2024', 300000, 'Rejected', 0, 'Fire'),
    (208, 108, '01-Sep-2024', 90000, 'Approved', 85000, 'Accident')
  `);

  return db;
};
