export type MCQ = {
  id: string;
  question: string;
  options: string[];
  answer: string;
};

export type ShortAnswer = {
  id: string;
  question: string;
  answer: string;
};

export type SQLQuery = {
  id: string;
  topic?: string;
  question: string;
};

export type AssessmentData = {
  mcqs: MCQ[];
  shortAnswers: ShortAnswer[];
  sqlQueries: SQLQuery[];
};

export const batch1Questions: AssessmentData = {
  mcqs: [
    { id: 'b1_m1', question: 'Which statement is auto-committed?', options: ['UPDATE', 'INSERT', 'CREATE TABLE', 'DELETE'], answer: 'CREATE TABLE' },
    { id: 'b1_m2', question: 'Which command removes all rows but keeps structure?', options: ['DROP', 'TRUNCATE', 'DELETE', 'REMOVE'], answer: 'TRUNCATE' },
    { id: 'b1_m3', question: 'Which constraint uniquely identifies each row?', options: ['UNIQUE', 'CHECK', 'PRIMARY KEY', 'NOT NULL'], answer: 'PRIMARY KEY' },
    { id: 'b1_m4', question: 'Which command allows partial rollback?', options: ['COMMIT', 'SAVEPOINT', 'GRANT', 'ALTER'], answer: 'SAVEPOINT' },
    { id: 'b1_m5', question: 'HAVING works with:', options: ['WHERE', 'GROUP BY', 'DISTINCT', 'ORDER BY'], answer: 'GROUP BY' },
    { id: 'b1_m6', question: 'Which aggregate returns highest value?', options: ['AVG', 'SUM', 'MAX', 'COUNT'], answer: 'MAX' },
    { id: 'b1_m7', question: 'LIKE operator is used for:', options: ['Ranges', 'Patterns', 'Nulls', 'Sorting'], answer: 'Patterns' },
    { id: 'b1_m8', question: 'Which statement changes a table structure?', options: ['ALTER', 'UPDATE', 'INSERT', 'DELETE'], answer: 'ALTER' },
    { id: 'b1_m9', question: 'Which DML statement changes existing data?', options: ['CREATE', 'UPDATE', 'DROP', 'TRUNCATE'], answer: 'UPDATE' },
    { id: 'b1_m10', question: 'Which clause filters rows before grouping?', options: ['HAVING', 'GROUP BY', 'WHERE', 'ORDER BY'], answer: 'WHERE' },
    { id: 'b1_m11', question: 'Which statement creates a virtual table?', options: ['VIEW', 'INDEX', 'TRIGGER', 'SEQUENCE'], answer: 'VIEW' },
    { id: 'b1_m12', question: 'Materialized View stores:', options: ['Only query', 'Physical data', 'Constraints', 'Indexes'], answer: 'Physical data' },
    { id: 'b1_m13', question: 'ROLLBACK is used to:', options: ['Save changes', 'Undo changes', 'Delete table', 'Create table'], answer: 'Undo changes' },
    { id: 'b1_m14', question: 'Which statement renames a column?', options: ['ALTER...RENAME COLUMN', 'UPDATE', 'MODIFY', 'CHANGE'], answer: 'ALTER...RENAME COLUMN' },
    { id: 'b1_m15', question: 'Which command permanently saves a transaction?', options: ['SAVEPOINT', 'COMMIT', 'DELETE', 'ALTER'], answer: 'COMMIT' }
  ],
  shortAnswers: [
    { id: 'b1_s1', question: 'Differentiate DELETE and TRUNCATE.', answer: 'DELETE removes selected/all rows and can be rolled back before COMMIT. TRUNCATE removes all rows, keeps the table structure and is auto-committed.' },
    { id: 'b1_s2', question: 'Why is PRIMARY KEY important?', answer: 'It uniquely identifies each row and prevents duplicate or NULL key values.' },
    { id: 'b1_s3', question: 'What is SAVEPOINT?', answer: 'A checkpoint within a transaction used for partial rollback.' },
    { id: 'b1_s4', question: 'Why is COMMIT necessary?', answer: 'It permanently saves transaction changes.' },
    { id: 'b1_s5', question: 'Difference between VIEW and Materialized View.', answer: 'VIEW stores only the query; Materialized View stores the query result physically.' },
    { id: 'b1_s6', question: 'Explain HAVING.', answer: 'HAVING filters grouped records after GROUP BY.' },
    { id: 'b1_s7', question: 'What is CHECK constraint?', answer: 'It allows only values satisfying a specified condition.' },
    { id: 'b1_s8', question: 'Why is ROLLBACK useful?', answer: 'It undoes uncommitted changes after an error.' },
    { id: 'b1_s9', question: 'Difference between DDL and DML.', answer: 'DDL changes structure; DML manipulates data.' },
    { id: 'b1_s10', question: 'Why is TRUNCATE faster than DELETE?', answer: 'It removes all rows in one operation and is auto-committed.' }
  ],
  sqlQueries: [
    { id: 'b1_q1', topic: 'SUBQUERY', question: 'Display the details of the policy holder whose premium amount is the highest.' },
    { id: 'b1_q2', topic: 'SUBQUERY', question: 'Find the customers whose claim amount is greater than the average claim amount.' },
    { id: 'b1_q3', topic: 'SUBQUERY', question: 'Display the details of policy holders whose premium amount is less than the minimum premium of Health policy holders.' },
    { id: 'b1_q4', topic: 'SUBQUERY', question: 'Find the policy holders who have the second highest premium amount.' },
    { id: 'b1_q5', topic: 'SUBQUERY', question: 'Display the policy holders whose approved amount is greater than the average approved amount.' },
    
    { id: 'b1_q6', topic: 'CORRELATED SUBQUERY', question: 'Display the policy holders whose claim amount is greater than the average claim amount of customers from the same city.' },
    { id: 'b1_q7', topic: 'CORRELATED SUBQUERY', question: 'Find the policy holders whose premium amount is higher than the average premium of the same policy type.' },
    { id: 'b1_q8', topic: 'CORRELATED SUBQUERY', question: 'Display customers whose approved claim amount is the maximum within their policy type.' },
    { id: 'b1_q9', topic: 'CORRELATED SUBQUERY', question: 'Find policy holders who have more claims than any other customer in the same city.' },
    { id: 'b1_q10', topic: 'CORRELATED SUBQUERY', question: 'Display customers whose latest claim amount is greater than all their previous claim amounts.' },

    { id: 'b1_q11', topic: 'NESTED SUBQUERY', question: 'Find the customer name who received the highest approved claim amount.' },
    { id: 'b1_q12', topic: 'NESTED SUBQUERY', question: 'Display the policy holders whose policy ID belongs to customers who have an approved claim greater than 100000.' },
    { id: 'b1_q13', topic: 'NESTED SUBQUERY', question: 'Find the customer whose premium amount is equal to the premium of the customer having the highest approved claim.' },
    { id: 'b1_q14', topic: 'NESTED SUBQUERY', question: 'Display policy holders whose claim amount is greater than the average claim amount of customers whose premium is above 20000.' },
    { id: 'b1_q15', topic: 'NESTED SUBQUERY', question: 'Find the customer names whose approved amount is equal to the second highest approved amount.' },

    { id: 'b1_q16', topic: 'JOINS', question: 'Display customer name, city, policy type, claim amount, approved amount, and claim status.' },
    { id: 'b1_q17', topic: 'JOINS', question: 'Display the customers who have not filed any claim.' },
    { id: 'b1_q18', topic: 'JOINS', question: 'Find the customer who received the maximum approved amount.' },
    { id: 'b1_q19', topic: 'JOINS', question: 'Display the total claim amount for each policy type.' },
    { id: 'b1_q20', topic: 'JOINS', question: 'Find the cities where the total approved claim amount is greater than 200000.' },

    { id: 'b1_q21', topic: 'SELECTION QUERIES', question: 'Display all policy holders whose age is between 30 and 45 years.' },
    { id: 'b1_q22', topic: 'SELECTION QUERIES', question: 'Display all claims whose claim amount is greater than 150000.' },
    { id: 'b1_q23', topic: 'SELECTION QUERIES', question: 'Display all approved claims filed after 01-JUN-2024.' },
    { id: 'b1_q24', topic: 'SELECTION QUERIES', question: 'Display customers whose city starts with "H" and whose policy type is Health.' },
    { id: 'b1_q25', topic: 'SELECTION QUERIES', question: 'Display all claims where the claim reason contains "Accident" or approved amount is NULL.' }
  ]
};

export const batch23Questions: AssessmentData = {
  mcqs: [
    { id: 'b23_m1', question: 'Which command modifies an existing column\'s datatype?', options: ['CREATE', 'ALTER...MODIFY', 'UPDATE', 'RENAME'], answer: 'ALTER...MODIFY' },
    { id: 'b23_m2', question: 'Which statement removes a table completely?', options: ['DELETE', 'TRUNCATE', 'DROP', 'UPDATE'], answer: 'DROP' },
    { id: 'b23_m3', question: 'Which constraint prevents invalid values?', options: ['CHECK', 'UNIQUE', 'FOREIGN KEY', 'PRIMARY KEY'], answer: 'CHECK' },
    { id: 'b23_m4', question: 'Which statement permanently saves a transaction?', options: ['ROLLBACK', 'SAVEPOINT', 'COMMIT', 'DELETE'], answer: 'COMMIT' },
    { id: 'b23_m5', question: 'Which statement undoes changes after a savepoint?', options: ['COMMIT', 'ROLLBACK TO SAVEPOINT', 'TRUNCATE', 'ALTER'], answer: 'ROLLBACK TO SAVEPOINT' },
    { id: 'b23_m6', question: 'UPDATE belongs to which SQL language?', options: ['DDL', 'DML', 'TCL', 'DQL'], answer: 'DML' },
    { id: 'b23_m7', question: 'Which command cannot use WHERE?', options: ['DELETE', 'UPDATE', 'TRUNCATE', 'SELECT'], answer: 'TRUNCATE' },
    { id: 'b23_m8', question: 'Which constraint enforces mandatory values?', options: ['NOT NULL', 'UNIQUE', 'CHECK', 'DEFAULT'], answer: 'NOT NULL' },
    { id: 'b23_m9', question: 'Which command changes table name?', options: ['RENAME', 'ALTER', 'UPDATE', 'CHANGE'], answer: 'RENAME' },
    { id: 'b23_m10', question: 'DDL statements are generally:', options: ['Rollback only', 'Auto-commit', 'Temporary', 'Conditional'], answer: 'Auto-commit' },
    { id: 'b23_m11', question: 'Which operation is safest before bulk UPDATE?', options: ['DROP', 'SAVEPOINT', 'TRUNCATE', 'DELETE'], answer: 'SAVEPOINT' },
    { id: 'b23_m12', question: 'Which statement keeps structure but removes all rows?', options: ['TRUNCATE', 'DROP', 'DELETE TABLE', 'REMOVE'], answer: 'TRUNCATE' },
    { id: 'b23_m13', question: 'Which language changes table structure?', options: ['DDL', 'DML', 'TCL', 'DQL'], answer: 'DDL' },
    { id: 'b23_m14', question: 'Purpose of COMMIT?', options: ['Cancel', 'Save permanently', 'Create table', 'Rename'], answer: 'Save permanently' },
    { id: 'b23_m15', question: 'Which constraint uniquely identifies each row?', options: ['CHECK', 'PRIMARY KEY', 'UNIQUE', 'NOT NULL'], answer: 'PRIMARY KEY' }
  ],
  shortAnswers: [
    { id: 'b23_s1', question: 'Explain why constraints are important.', answer: 'They enforce business rules, maintain data integrity, and prevent invalid, duplicate, or missing data.' },
    { id: 'b23_s2', question: 'Differentiate DDL and DML.', answer: 'DDL changes database structure (CREATE, ALTER, DROP, TRUNCATE). DML manipulates data (INSERT, UPDATE, DELETE).' },
    { id: 'b23_s3', question: 'Why should COMMIT be executed carefully?', answer: 'COMMIT permanently saves changes. After COMMIT, ROLLBACK cannot undo them.' },
    { id: 'b23_s4', question: 'Explain how SAVEPOINT minimizes data loss.', answer: 'SAVEPOINT creates a checkpoint so only recent changes need to be rolled back instead of the whole transaction.' },
    { id: 'b23_s5', question: 'What risks arise if PRIMARY KEY is not defined?', answer: 'Duplicate rows, inability to uniquely identify records, and poor data integrity.' },
    { id: 'b23_s6', question: 'Why is TRUNCATE risky?', answer: 'It removes all rows and, per the notes, is auto-committed and cannot be rolled back.' },
    { id: 'b23_s7', question: 'Importance of TCL in banking?', answer: 'Ensures transactions either complete fully with COMMIT or are restored using ROLLBACK if any step fails.' },
    { id: 'b23_s8', question: 'How do CHECK and NOT NULL improve quality?', answer: 'CHECK validates values; NOT NULL prevents mandatory fields from being left empty.' },
    { id: 'b23_s9', question: 'Why is ROLLBACK useful during testing?', answer: 'It undoes temporary changes safely before they become permanent.' },
    { id: 'b23_s10', question: 'Compare DELETE, TRUNCATE and DROP.', answer: 'DELETE removes rows and can be rolled back before COMMIT; TRUNCATE removes all rows but keeps structure; DROP removes both table structure and data.' }
  ],
  sqlQueries: [
    { id: 'b23_q1', topic: 'SUBQUERY', question: 'Display the policy holder(s) whose premium amount is the highest.' },
    { id: 'b23_q2', topic: 'SUBQUERY', question: 'Display the customers whose claim amount is greater than the average claim amount.' },
    { id: 'b23_q3', topic: 'SUBQUERY', question: 'Display the policy holder(s) whose premium amount is less than the minimum premium of Health policy holders.' },
    { id: 'b23_q4', topic: 'SUBQUERY', question: 'Display the policy holder(s) having the second highest premium amount.' },
    { id: 'b23_q5', topic: 'SUBQUERY', question: 'Display the customers whose approved amount is greater than the average approved amount.' },
    
    { id: 'b23_q6', topic: 'CORRELATED SUBQUERY', question: 'Display the customers whose claim amount is greater than the average claim amount of customers from the same city.' },
    { id: 'b23_q7', topic: 'CORRELATED SUBQUERY', question: 'Display the policy holders whose premium amount is greater than the average premium of the same policy type.' },
    { id: 'b23_q8', topic: 'CORRELATED SUBQUERY', question: 'Display the customer whose approved amount is the highest within their policy type.' },
    { id: 'b23_q9', topic: 'CORRELATED SUBQUERY', question: 'Display the customers whose claim amount is greater than all other claim amounts of customers from the same city.' },
    { id: 'b23_q10', topic: 'CORRELATED SUBQUERY', question: 'Display the customers whose latest claim amount is greater than their previous claim amount.' },

    { id: 'b23_q11', topic: 'NESTED SUBQUERY', question: 'Display the name of the customer who received the highest approved claim amount.' },
    { id: 'b23_q12', topic: 'NESTED SUBQUERY', question: 'Display the policy holders whose policy ID belongs to customers having an approved claim greater than 100000.' },
    { id: 'b23_q13', topic: 'NESTED SUBQUERY', question: 'Display the customer whose premium amount is equal to the premium of the customer having the highest approved claim amount.' },
    { id: 'b23_q14', topic: 'NESTED SUBQUERY', question: 'Display the policy holders whose claim amount is greater than the average claim amount of customers whose premium amount is above 20000.' },
    { id: 'b23_q15', topic: 'NESTED SUBQUERY', question: 'Display the customer(s) whose approved amount is equal to the second highest approved amount.' },

    { id: 'b23_q16', topic: 'ANY', question: 'Display the customers whose claim amount is greater than ANY approved claim amount.' },
    { id: 'b23_q17', topic: 'ANY', question: 'Display the policy holders whose premium amount is greater than ANY Health policy premium.' },
    { id: 'b23_q18', topic: 'ANY', question: 'Display the customers whose approved amount is less than ANY approved amount of Life policy holders.' },
    { id: 'b23_q19', topic: 'ANY', question: 'Display the customers whose claim amount is equal to ANY rejected claim amount.' },
    { id: 'b23_q20', topic: 'ANY', question: 'Display the customers whose age is greater than ANY customer from Hyderabad.' },

    { id: 'b23_q21', topic: 'ALL', question: 'Display the customers whose claim amount is greater than ALL rejected claim amounts.' },
    { id: 'b23_q22', topic: 'ALL', question: 'Display the policy holders whose premium amount is greater than ALL Vehicle policy premiums.' },
    { id: 'b23_q23', topic: 'ALL', question: 'Display the customers whose approved amount is greater than ALL approved amounts of Health policy holders.' },
    { id: 'b23_q24', topic: 'ALL', question: 'Display the customers whose age is greater than ALL customers from Chennai.' },
    { id: 'b23_q25', topic: 'ALL', question: 'Display the customers whose claim amount is less than ALL approved claim amounts.' },

    { id: 'b23_q26', topic: 'FUNCTIONS', question: 'Display the customer names in uppercase and their cities in lowercase.' },
    { id: 'b23_q27', topic: 'FUNCTIONS', question: 'Display the length of each customer name and the premium amount rounded to the nearest thousand.' },
    { id: 'b23_q28', topic: 'FUNCTIONS', question: 'Display the claim date, current date, and the number of days since the claim was filed.' },
    { id: 'b23_q29', topic: 'FUNCTIONS', question: 'Display the customer name, approved amount (replace NULL with 0), and total payable amount.' },
    { id: 'b23_q30', topic: 'FUNCTIONS', question: 'Display the customer name, age, and category using CASE statement (Young, Adult, Senior).' },

    { id: 'b23_q31', topic: 'SELECTION', question: 'Display all policy holders whose age is between 30 and 45 years.' },
    { id: 'b23_q32', topic: 'SELECTION', question: 'Display all approved claims whose claim amount is greater than 150000.' },
    { id: 'b23_q33', topic: 'SELECTION', question: 'Display all Health policy holders from Hyderabad.' },
    { id: 'b23_q34', topic: 'SELECTION', question: 'Display all Pending claims filed after 01-JUN-2024.' },
    { id: 'b23_q35', topic: 'SELECTION', question: 'Display all customers whose names start with "A" or end with "a".' },

    { id: 'b23_q36', topic: 'PROJECTION', question: 'Display only customer name and city.' },
    { id: 'b23_q37', topic: 'PROJECTION', question: 'Display only distinct policy types.' },
    { id: 'b23_q38', topic: 'PROJECTION', question: 'Display only claim ID, claim amount, and claim status.' },
    { id: 'b23_q39', topic: 'PROJECTION', question: 'Display only customer name, premium amount, and age.' },
    { id: 'b23_q40', topic: 'PROJECTION', question: 'Display only customer name, claim amount, and approved amount.' }
  ]
};
