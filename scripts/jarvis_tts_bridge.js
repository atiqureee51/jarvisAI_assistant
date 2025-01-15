const { spawn } = require('child_process');
const path = require('path');

class JarvisTTS {
    constructor() {
        this.pythonProcess = null;
        this.voiceModelPath = path.join(__dirname, '../resources/jarvis_voice.npz');
    }

    async initialize() {
        // Train the model if it doesn't exist
        if (!fs.existsSync(this.voiceModelPath)) {
            console.log('Training Jarvis voice model...');
            await this.trainModel();
        }
    }

    async trainModel() {
        return new Promise((resolve, reject) => {
            const pythonScript = path.join(__dirname, 'train_jarvis_voice.py');
            this.pythonProcess = spawn('python', [pythonScript]);

            this.pythonProcess.stdout.on('data', (data) => {
                console.log(`Python stdout: ${data}`);
            });

            this.pythonProcess.stderr.on('data', (data) => {
                console.error(`Python stderr: ${data}`);
            });

            this.pythonProcess.on('close', (code) => {
                if (code === 0) {
                    resolve();
                } else {
                    reject(new Error(`Python process exited with code ${code}`));
                }
            });
        });
    }

    async generateSpeech(text) {
        return new Promise((resolve, reject) => {
            const pythonScript = path.join(__dirname, 'generate_speech.py');
            const process = spawn('python', [
                pythonScript,
                '--text', text,
                '--model', this.voiceModelPath
            ]);

            let outputData = '';

            process.stdout.on('data', (data) => {
                outputData += data;
            });

            process.stderr.on('data', (data) => {
                console.error(`Python stderr: ${data}`);
            });

            process.on('close', (code) => {
                if (code === 0) {
                    resolve(outputData.trim());
                } else {
                    reject(new Error(`Python process exited with code ${code}`));
                }
            });
        });
    }
}

module.exports = new JarvisTTS();
