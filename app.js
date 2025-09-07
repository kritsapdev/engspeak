document.addEventListener('DOMContentLoaded', () => {
    const video = document.getElementById('video-player');
    const transcriptText = document.getElementById('transcript-text');
    const translationText = document.getElementById('translation-text');
    const scoreEl = document.getElementById('score');
    const startBtn = document.getElementById('start-btn');
    const recordBtn = document.getElementById('record-btn');

    let subtitles = [];
    let currentSubtitleIndex = 0;
    let practiceMode = false;

    // Function to parse SRT content
    function parseSRT(data) {
        const srtRegex = /(\d+)\s+(\d{2}:\d{2}:\d{2},\d{3}) --> (\d{2}:\d{2}:\d{2},\d{3})\s+([\s\S]+?)(?=\n\n|\n*$)/g;
        let match;
        const parsedSubtitles = [];
        while ((match = srtRegex.exec(data)) !== null) {
            parsedSubtitles.push({
                index: parseInt(match[1], 10),
                startTime: timeToSeconds(match[2]),
                endTime: timeToSeconds(match[3]),
                text: match[4].replace(/(\r\n|\n|\r)/gm, " ").trim()
            });
        }
        return parsedSubtitles;
    }

    // Function to convert SRT time to seconds
    function timeToSeconds(time) {
        const parts = time.split(/[:,]/);
        return parseInt(parts[0], 10) * 3600 + parseInt(parts[1], 10) * 60 + parseInt(parts[2], 10) + parseInt(parts[3], 10) / 1000;
    }

    // Fetch and parse the SRT file
    fetch('captions.srt')
        .then(response => response.text())
        .then(data => {
            subtitles = parseSRT(data);
            console.log('Subtitles parsed:', subtitles);
        })
        .catch(error => console.error('Error loading subtitles:', error));

    // Start practice mode
    startBtn.addEventListener('click', () => {
        if (subtitles.length === 0) {
            alert('Subtitles not loaded yet.');
            return;
        }
        practiceMode = true;
        currentSubtitleIndex = 0; // Start from the first subtitle
        video.currentTime = subtitles[currentSubtitleIndex].startTime;
        video.play();
        startBtn.textContent = 'Next Sentence';
        transcriptText.textContent = '...';
    });

    // Main logic on video time update
    video.addEventListener('timeupdate', () => {
        if (!practiceMode || subtitles.length === 0) return;

        const currentTime = video.currentTime;
        const currentSubtitle = subtitles[currentSubtitleIndex];

        // Check if the current subtitle text is not already displayed
        if (currentTime >= currentSubtitle.startTime && currentTime <= currentSubtitle.endTime) {
            if (transcriptText.textContent !== currentSubtitle.text) {
                transcriptText.textContent = currentSubtitle.text;
                // Call translation API placeholder
                translationText.textContent = 'กำลังแปล...'; // Show loading state
                getTranslation(currentSubtitle.text).then(translation => {
                    translationText.textContent = translation;
                });
            }
        }

        if (currentTime >= currentSubtitle.endTime) {
            video.pause();
            recordBtn.disabled = false; // Enable recording button
            // Move to next subtitle for the next "play"
            if (currentSubtitleIndex < subtitles.length - 1) {
                currentSubtitleIndex++;
            } else {
                // End of practice
                practiceMode = false;
                startBtn.textContent = 'Start Practice';
                transcriptText.textContent = 'Practice complete!';
            }
        }
    });

    video.addEventListener('pause', () => {
        if (practiceMode) {
           // To prevent disabling record button when user manually pauses
           const subtitleThatJustEnded = subtitles[currentSubtitleIndex - 1];
           // A small buffer to account for timing inaccuracies
           if (subtitleThatJustEnded && Math.abs(video.currentTime - subtitleThatJustEnded.endTime) < 0.5) {
                recordBtn.disabled = false;
           }
        }
    });

    // --- API Placeholder Functions ---

    /**
     * Simulates calling a translation API.
     * @param {string} text The text to translate.
     * @returns {Promise<string>} A promise that resolves with the translated text.
     */
    function getTranslation(text) {
        console.log(`Translating: "${text}"`);
        return new Promise(resolve => {
            // In a real app, this would be an actual API call.
            setTimeout(() => {
                resolve(`[คำแปลตัวอย่าง] ${text}`);
            }, 500); // Simulate network delay
        });
    }

    /**
     * Simulates calling a pronunciation assessment API.
     * @param {Blob} audioBlob The user's recorded audio.
     * @param {string} originalText The original transcript text for comparison.
     * @returns {Promise<number>} A promise that resolves with a similarity score.
     */
    function getPronunciationScore(audioBlob, originalText) {
        console.log(`Getting score for audio against text: "${originalText}"`);
        return new Promise(resolve => {
            // In a real app, this would send the blob and text to a service.
            setTimeout(() => {
                const randomScore = Math.floor(Math.random() * 30) + 70; // Score between 70 and 99
                resolve(randomScore);
            }, 1000); // Simulate network delay
        });
    }


    // --- Audio Recording Logic ---
    let mediaRecorder;
    let audioChunks = [];

    recordBtn.addEventListener('click', () => {
        if (mediaRecorder && mediaRecorder.state === 'recording') {
            // Stop recording
            mediaRecorder.stop();
            recordBtn.textContent = 'Speak Now';
            recordBtn.disabled = true; // Disable until the next sentence
            startBtn.disabled = false; // Allow user to proceed
        } else {
            // Start recording
            navigator.mediaDevices.getUserMedia({ audio: true })
                .then(stream => {
                    mediaRecorder = new MediaRecorder(stream);
                    mediaRecorder.start();
                    audioChunks = []; // Reset chunks

                    mediaRecorder.addEventListener('dataavailable', event => {
                        audioChunks.push(event.data);
                    });

                    mediaRecorder.addEventListener('stop', () => {
                        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                        const originalText = subtitles[currentSubtitleIndex - 1].text; // Get the text for the sentence that was just spoken

                        // Call pronunciation assessment API placeholder
                        scoreEl.textContent = '...'; // Show processing state
                        getPronunciationScore(audioBlob, originalText).then(score => {
                            scoreEl.textContent = score;
                            console.log(`Received score: ${score}`);
                        });
                    });

                    recordBtn.textContent = 'Stop Recording';
                    startBtn.disabled = true; // Prevent moving to next sentence while recording
                })
                .catch(err => {
                    console.error('Error getting user media:', err);
                    alert('Could not access the microphone. Please allow microphone access.');
                });
        }
    });
});
