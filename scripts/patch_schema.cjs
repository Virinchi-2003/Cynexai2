const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '..', 'schema.json');
const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));

const newColumn = {
  name: 'ai_study_guide',
  type: 'TEXT',
  dflt_value: null
};

if (schema.classes && !schema.classes.find(c => c.name === 'ai_study_guide')) {
  schema.classes.push(newColumn);
  console.log("Added ai_study_guide to classes");
}

if (schema.course_classes_new && !schema.course_classes_new.find(c => c.name === 'ai_study_guide')) {
  schema.course_classes_new.push(newColumn);
  console.log("Added ai_study_guide to course_classes_new");
}

fs.writeFileSync(schemaPath, JSON.stringify(schema, null, 2));
console.log("schema.json updated successfully.");
