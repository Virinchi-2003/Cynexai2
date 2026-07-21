const { createClient } = require('@libsql/client');
const client = createClient({ 
  url: 'libsql://cynexai-portal-cynexai-new.aws-ap-south-1.turso.io', 
  authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODQxOTUyNjcsImlkIjoiMDE5ZjZhNTItN2IwMS03Mzc2LWExMGUtNTViZGRiMzAwZTdlIiwia2lkIjoieUdPOElXY1J5RC1VX2J3UFlHWUJJMmlKZEp1R21CSDY5QzJQZzJUWmZhQSIsInJpZCI6IjcxYmEzODM5LTAyZDEtNDJiNS1hNDM5LTVlOWM4MGJkNGRhNSJ9.O2do8U63KLbS_pXwqivQRIYK1SncnMa1VRuePw6UFagpIIFodykzhY2cr6C_iYE83O86fUXhErbRPKfBMZtUAA' 
});
client.execute("SELECT title, youtube_video_id FROM classes WHERE title LIKE '%Introduction%'")
  .then(r => {
    const id = r.rows[0].youtube_video_id;
    console.log(`[${id}] length: ${id.length}`);
  })
  .catch(console.error);
