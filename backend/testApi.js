async function testApi() {
    try {
        const audioBlob = new Blob([Buffer.from('RIFF$dummy-wave-data', 'utf-8')], { type: 'audio/webm' });
        const form = new FormData();
        form.append('audio', audioBlob, 'audio.webm');
        form.append('question', 'test');

        const res = await fetch('http://localhost:5000/api/voice-interview', {
            method: 'POST',
            body: form
        });

        const data = await res.text();
        console.log("Status:", res.status, "Body:", data);
    } catch (e) {
        console.error("Test failed", e);
    }
}
testApi();
