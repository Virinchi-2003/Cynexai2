require('dotenv').config({ path: '../.env' });
const { createClient } = require('@libsql/client');

const db = createClient({
  url: process.env.VITE_TURSO_DATABASE_URL,
  authToken: process.env.VITE_TURSO_AUTH_TOKEN,
});

const rawCurriculum = `
Module 1: Python Fundamentals (Days 1–10)
Day 1
Introduction to Python
Why Python for Data Science
History of Python
Features of Python
Python Installation
Jupyter Notebook
VS Code
Python Execution Process (.py, Bytecode, PVM)
First Program
print()
Comments
Day 2
Variables
Identifiers
Keywords
Memory Allocation
Variable Initialization
Variable Reassignment
Naming Conventions
type()
id()
Practice: Student Details Program
Day 3
Data Types
Integer
Float
Complex
Boolean
None
Type Conversion
Input Function
Programs: Age Calculator BMI Calculator
Day 4
Operators
Arithmetic
Assignment
Comparison
Logical
Identity
Membership
Bitwise
Programs: Calculator Electricity Bill
Day 5
Strings
Indexing
Slicing
String Methods
Formatting
f-Strings
Programs: Palindrome Reverse String Count Vowels
Day 6
Conditional Statements
if
if else
elif
Nested if
Match Case
Programs: ATM Grade System Loan Eligibility
Day 7
Loops
for
while
range()
break
continue
pass
Programs: Prime Factorial Fibonacci Pattern Programs
Day 8
Lists
Indexing
Slicing
Methods
Nested Lists
Programs: Student Marks Analysis
Day 9
Tuple
Set
Dictionary
Dictionary Methods
Nested Dictionary
Programs: Employee Database
Day 10
Revision + Test
Module 2: Intermediate Python (Days 11–20)
Day 11
Functions
Parameters
Return
Default Arguments
Keyword Arguments
Variable Length Arguments
Day 12
Advanced Functions
Lambda
map()
filter()
reduce()
zip()
enumerate()
Day 13
Modules
math
random
datetime
os
sys
Mini Tasks
Day 14
Exception Handling
try
except
else
finally
raise
Custom Exceptions
Day 15
File Handling
Text Files
CSV Files
Read
Write
Append
Day 16
Object-Oriented Programming
Class
Object
Constructor
Methods
self
Day 17
Advanced OOP
Inheritance
Polymorphism
Encapsulation
Abstraction
Day 18
Iterators Generators yield
Day 19
List Comprehension Dictionary Comprehension Set Comprehension Generator Expressions
Day 20
Mini Project (Student Management System)
Module 3: NumPy (Days 21–24)
Day 21
Introduction to NumPy
Installation
Arrays
Dimensions
Shape
dtype
Day 22
NumPy Operations
Indexing
Slicing
Reshape
Flatten
Transpose
Arithmetic
Day 23
Statistics
Mean
Median
Mode
Sum
Min
Max
Standard Deviation
Variance
Day 24
Advanced NumPy
Broadcasting
Random Module
Matrix Operations
Linear Algebra Basics
Mini Assignment
Module 4: Pandas (Days 25–29)
Day 25
Introduction
Series
DataFrame
Reading CSV
Writing CSV
Day 26
Data Cleaning
Missing Values
fillna()
dropna()
replace()
duplicates
Day 27
Data Manipulation
loc
iloc
Sorting
Filtering
Boolean Indexing
Day 28
Advanced Pandas
groupby()
merge()
join()
concat()
Pivot Table
Crosstab
Module 5: Modern AI
Day 1 – Introduction to Modern AI
Evolution of AI
AI → ML → DL → Generative AI
Why AI changed after ChatGPT
AI Industry Trends
AI Career Opportunities
Real-world AI Applications
Activity: Identify AI applications used daily.
Day 2 – Deep Learning & Neural Networks (Revision)
Why Deep Learning after ML
Artificial Neural Networks
Neurons
Layers
Weights
Bias
Activation Functions
Forward Propagation
Backpropagation (Concept)
Day 3 – CNN, RNN & Transformers
CNN Overview
RNN Overview
LSTM
Limitations of RNN
Birth of Transformers
Attention Is All You Need
Self-Attention
Encoder & Decoder
Connection: CNN/RNN → Transformers → LLMs
Day 4 – Large Language Models (LLMs)
What is an LLM?
GPT Architecture
Tokens
Tokenization
Context Window
Parameters
Training Data
Inference
Activity: Visualize how a sentence becomes tokens.
Day 5 – Inside GPT & Modern LLMs
GPT Family
Gemini
Claude
Llama
DeepSeek
Qwen
Mistral
Grok
Open vs Closed Models
Comparison Activity
Day 6 – Prompt Engineering Fundamentals
What is Prompt Engineering?
Prompt Structure
Role
Context
Instructions
Constraints
Output Format
Best Practices
Practice: Write prompts for different business tasks.
Day 7 – Advanced Prompt Engineering
Zero-shot
One-shot
Few-shot
Chain of Thought
Persona Prompting
Self-Consistency
Prompt Chaining
Lab: Solve real-world tasks with advanced prompts.
Day 8 – AI Tools
ChatGPT
Gemini
Claude
Perplexity
NotebookLM
Grok
Microsoft Copilot
Activity: Compare outputs from multiple models.
Day 9 – AI for Productivity
AI for Coding
AI for Content Writing
AI for Research
AI for Education
AI for HR
AI for Marketing
AI for Business
Mini Project: Automate a business workflow.
Day 10 – AI APIs & Integrations (Concept)
What is an API?
AI APIs
API Keys
REST APIs
Connecting AI to Applications
AI Architecture Overview
Module 6: Building AI Systems
Day 11 – Embeddings
What are Embeddings?
Semantic Search
Vector Representation
Similarity Search
Day 12 – Vector Databases
FAISS
ChromaDB
Pinecone (Concept)
Milvus (Concept)
Chunking
Retrieval
Day 13 – Retrieval-Augmented Generation (RAG)
Why RAG?
RAG Architecture
Retrieval
Generation
Knowledge Base
Documents
PDF Chat
Activity: Design a RAG pipeline.
Day 14 – Fine-Tuning vs Prompt Engineering vs RAG
Fine-Tuning (Concept)
Prompt Engineering
RAG
When to use each approach
Cost and performance considerations
Day 15 – AI Agents
What is an AI Agent?
Components of an AI Agent
Planning
Memory
Tool Usage
Multi-Agent Systems
Agentic AI
Module 7: AI Applications
Day 16 – AI Automation
AI Workflows
MCP (Introduction)
Function Calling
Tool Calling
Workflow Automation
Day 17 – AI Application Architecture
Frontend
Backend
LLM
Vector Database
APIs
Authentication
Deployment Flow
Day 18 – Responsible AI
Hallucinations
AI Bias
Privacy
Prompt Injection
AI Security
Ethical AI
Responsible AI
Day 19 – Real-Time AI Projects
Students build one project:
AI Resume Analyzer
AI Interview Assistant
AI PDF Chatbot
AI Email Generator
AI Customer Support Assistant
Module 8: Machine Learning
Day 1
Introduction to Machine Learning, AI vs ML vs DL, Types of ML, ML Pipeline, Real-world Applications
Day 2
Supervised vs Unsupervised Learning, Regression vs Classification vs Clustering, Dataset Types
Day 3
Linear Regression - Introduction, Assumptions, Mathematics, Cost Function
Day 4
Gradient Descent, Batch/Stochastic/Mini-Batch Gradient Descent, Numerical Problems, Python
Day 5
Multiple Linear Regression, Polynomial Regression, Real-world House Price Dataset
Day 6
Overfitting, Underfitting, Bias-Variance Tradeoff, Regularization Overview
Day 7
Ridge Regression, Lasso Regression, ElasticNet, Python Implementation
Day 8
Logistic Regression, Sigmoid Function, Decision Boundary, Classification Metrics
Day 9
Decision Tree - Introduction, Tree Structure, Terminologies, Real-world Examples
Day 10
Entropy, Information Gain, Gini Index, Numerical Problems
Day 11
ID3, C4.5, CART, Gain Ratio, Tree Pruning
Day 12
Decision Tree Python Implementation, Hyperparameters, Loan Prediction Project
Day 13
Random Forest - Bagging, Bootstrap Sampling, Feature Importance, OOB Score
Day 14
Random Forest Implementation, Hyperparameter Tuning, Employee Attrition Project
Day 15
K-Nearest Neighbors (KNN), Distance Metrics, Choosing K, Python
Day 16
Support Vector Machine (SVM), Hyperplane, Kernels, Soft Margin, Python
Day 17
Naive Bayes, Bayes Theorem, Gaussian, Multinomial, Bernoulli Naive Bayes, Spam Detection
Day 18
Ensemble Learning, Voting, Bagging, Boosting, Stacking
Day 19
AdaBoost, Gradient Boosting, XGBoost, LightGBM, CatBoost
Day 20
Model Evaluation - MAE, MSE, RMSE, R², Adjusted R²
Day 21
Confusion Matrix, Accuracy, Precision, Recall, F1-Score, ROC-AUC
Day 22
Cross Validation, K-Fold, Stratified K-Fold, Leave-One-Out
Day 23
Hyperparameter Tuning - Grid Search, Random Search, Pipeline
Day 24
Feature Engineering, Scaling, Standardization, Normalization, Encoding
Day 25
Feature Selection, Correlation, VIF, Recursive Feature Elimination
Day 26
Clustering - K-Means, Elbow Method, Silhouette Score
Day 27
Hierarchical Clustering, DBSCAN, Real-world Customer Segmentation
Day 28
Principal Component Analysis (PCA), Eigenvalues, Explained Variance
Day 29
Recommendation Systems - Content-Based & Collaborative Filtering
Day 30
Time Series Basics, Trend, Seasonality, Moving Average, ARIMA Introduction
Day 31
Complete Regression Project (California Housing Dataset)
Day 32
Complete Classification Project (Loan Approval Dataset)
Day 33
Complete Customer Churn Prediction Project
Day 34
Complete Employee Attrition Prediction Project
Day 35
Complete Heart Disease Prediction Project
Day 36
Complete House Price Prediction Project (End-to-End)
Day 37
Model Saving (Pickle/Joblib), Deployment Basics, Streamlit Introduction
Day 38
Machine Learning Interview Questions, Algorithm Comparison, Common Mistakes
Day 39
Mock Interview, Coding Practice, Case Studies, Placement Preparation
Day 40
Final Revision, End-to-End Machine Learning Pipeline, Capstone Project Presentation, Assessment & Doubt Clearing
Module 9: SQL
Day 1
Introduction to Data, Database, DBMS, RDBMS, SQL, CRUD Operations
Day 2
Relational Model, E.F. Codd Rules, Tables, Rows, Columns, Metadata
Day 3
SQL Datatypes: CHAR, VARCHAR, VARCHAR2, NUMBER, DATE, CLOB, BLOB
Day 4
Constraints: NOT NULL, UNIQUE, CHECK, PRIMARY KEY, FOREIGN KEY, NULL
Day 5
SQL Statements Overview: DDL, DML, DQL, DCL, TCL
Day 6
CREATE TABLE, Data Types, Constraints, Table Design
Day 7
INSERT Statement, Single Row Insert, Multiple Row Insert
Day 8
SELECT Statement, Projection, DISTINCT, Aliases
Day 9
WHERE Clause, Operators, BETWEEN, IN, LIKE, IS NULL
Day 10
ORDER BY, FETCH FIRST, ROWNUM, Pagination
Day 11
UPDATE, DELETE, TRUNCATE, DROP, RENAME, ALTER
Day 12
Arithmetic Operators, Comparison Operators, Logical Operators
Day 13
Single Row Functions: Character Functions
Day 14
Number Functions and Date Functions
Day 15
Conversion Functions (TO_CHAR, TO_DATE, TO_NUMBER), NULL Functions
Day 16
Aggregate Functions: COUNT, SUM, AVG, MIN, MAX
Day 17
GROUP BY, HAVING Clause
Day 18
Introduction to Joins, INNER JOIN
Day 19
LEFT JOIN, RIGHT JOIN, FULL OUTER JOIN
Day 20
SELF JOIN, CROSS JOIN
Day 21
Subqueries: Single Row and Multiple Row
Day 22
Correlated Subqueries and Nested Queries
Day 23
Set Operators: UNION, UNION ALL, INTERSECT, MINUS
Day 24
Views, Sequences, Indexes
Day 25
Synonyms, Transactions (COMMIT, ROLLBACK, SAVEPOINT)
Day 26
Normalization (1NF, 2NF, 3NF, BCNF), Denormalization
Day 27
SQL Interview Questions, Scenario-Based Queries
Day 28
Oracle HR Schema Practice, EMP and DEPT Tables, 50 SQL Problems
Day 29
Mini Project: Student Management System Database
Day 30
Mock Test, Viva, Real-Time Interview Questions, Final Project Review
`;

async function seedDataScience() {
  try {
    // 1. Drop old table and create new ones
    console.log('Recreating tables...');
    await db.execute('DROP TABLE IF EXISTS course_classes');
    await db.execute('DROP TABLE IF EXISTS course_modules');
    await db.execute('DROP TABLE IF EXISTS courses'); // wipe courses for clean state
    
    await db.execute(`
      CREATE TABLE courses (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT,
          instructor_id TEXT,
          price REAL,
          status TEXT CHECK(status IN ('draft', 'published', 'archived')) DEFAULT 'draft',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.execute(`
      CREATE TABLE course_modules (
          id TEXT PRIMARY KEY,
          course_id TEXT NOT NULL,
          title TEXT NOT NULL,
          order_index INTEGER NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.execute(`
      CREATE TABLE course_classes (
          id TEXT PRIMARY KEY,
          module_id TEXT NOT NULL,
          title TEXT NOT NULL,
          description TEXT,
          youtube_video_id TEXT,
          type TEXT CHECK(type IN ('video', 'reading', 'quiz', 'code', 'live', 'assignment', 'practice', 'interview')) NOT NULL,
          order_index INTEGER NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 2. Create the Course
    const courseId = 'course_' + Date.now();
    await db.execute({
      sql: 'INSERT INTO courses (id, title, description, instructor_id, status) VALUES (?, ?, ?, ?, ?)',
      args: [courseId, 'Data Science Mastery', 'Complete track covering Python, SQL, ML, and Modern AI', 'usr_teacher', 'published']
    });

    console.log('Created course:', courseId);

    // 3. Parse and insert Modules and Classes
    const lines = rawCurriculum.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    
    let currentModuleId = null;
    let moduleIndex = 0;
    
    let currentClassId = null;
    let classIndex = 0;
    let classTitle = '';
    let classDescription = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line.startsWith('Module ')) {
        // Save previous class if exists
        if (currentClassId && classTitle) {
           await db.execute({
             sql: 'INSERT INTO course_classes (id, module_id, title, description, type, order_index) VALUES (?, ?, ?, ?, ?, ?)',
             args: [currentClassId, currentModuleId, classTitle, classDescription, 'video', classIndex++]
           });
        }
        
        // Start new module
        currentModuleId = 'mod_' + Date.now() + '_' + i;
        await db.execute({
          sql: 'INSERT INTO course_modules (id, course_id, title, order_index) VALUES (?, ?, ?, ?)',
          args: [currentModuleId, courseId, line, moduleIndex++]
        });
        classIndex = 0;
        currentClassId = null;
        console.log('Added Module:', line);

      } else if (line.startsWith('Day ')) {
        // Save previous class
        if (currentClassId && classTitle) {
           await db.execute({
             sql: 'INSERT INTO course_classes (id, module_id, title, description, type, order_index) VALUES (?, ?, ?, ?, ?, ?)',
             args: [currentClassId, currentModuleId, classTitle, classDescription, 'video', classIndex++]
           });
        }

        // Start new class
        currentClassId = 'class_' + Date.now() + '_' + i;
        classTitle = line.replace('Day', 'Class'); // change Day to Class as requested
        classDescription = '';

      } else {
        // Append to class description
        if (currentClassId) {
           classDescription += (classDescription ? '\\n' : '') + line;
        }
      }
    }

    // Save final class
    if (currentClassId && classTitle) {
       await db.execute({
         sql: 'INSERT INTO course_classes (id, module_id, title, description, type, order_index) VALUES (?, ?, ?, ?, ?, ?)',
         args: [currentClassId, currentModuleId, classTitle, classDescription, 'video', classIndex++]
       });
    }

    console.log('Successfully seeded the entire Data Science curriculum!');

  } catch (err) {
    console.error('Error seeding data:', err);
  }
}

seedDataScience();
