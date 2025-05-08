// Global variables
let currentSection = null;
const sections = [];
let isReading = false;
let speechSynthesis = window.speechSynthesis;
let utterance = null;
let recognition = null;
let isListeningForAssistant = false;
let isSpeechEnabled = true;

// DOM elements
const voiceStatus = document.getElementById('voiceStatus');
const assistantPanel = document.getElementById('mathAssistant');
const assistantMessages = document.getElementById('assistantMessages');
const assistantInput = document.getElementById('assistantInput');
const contentSections = document.querySelectorAll('.content-section');
const fontIncreaseBtn = document.getElementById('fontIncrease');
const highContrastBtn = document.getElementById('highContrast');
const readAloudBtn = document.getElementById('readAloud');
const pauseReadingBtn = document.getElementById('pauseReading');
const openAssistantBtn = document.getElementById('openAssistant');
const closeAssistantBtn = document.getElementById('closeAssistant');
const sendAssistantMsgBtn = document.getElementById('sendAssistantMsg');
const voiceInputAssistantBtn = document.getElementById('voiceInputAssistant');
const showKeyboardShortcutsBtn = document.getElementById('showKeyboardShortcuts');
const keyboardShortcuts = document.getElementById('keyboardShortcuts');
const closeShortcutsBtn = document.getElementById('closeShortcuts');
const quizOptions = document.querySelectorAll('.quiz-option');

// Initialize the application
function initApp() {
    // Get all sections and store them for navigation
    contentSections.forEach((section, index) => {
        sections.push(section);
        // Add focus handler for each section
        section.addEventListener('focus', function() {
            currentSection = this;
        });
    });
    
    // Set the first section as current
    if (sections.length > 0) {
        currentSection = sections[0];
        currentSection.focus();
    }
    
    // Initialize Speech Recognition
    initSpeechRecognition();
    
    // Initialize event listeners
    initEventListeners();
    
    // Initialize quiz functionality
    initQuiz();
    
    // Announce that the page is ready
    setTimeout(() => {
        speak("Fractions learning page loaded. Say 'help' for voice commands or press H for keyboard shortcuts.");
    }, 1000);
}

// Initialize speech recognition
function initSpeechRecognition() {
    try {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-IN'; // Set to Indian English
        
        recognition.onresult = handleSpeechResult;
        recognition.onerror = handleSpeechError;
        recognition.onend = handleSpeechEnd;
        
        // Start recognition
        startRecognition();
    } catch (e) {
        console.error("Speech recognition not supported", e);
        updateVoiceStatus("Voice Assistant: Not Available", "error");
        isSpeechEnabled = false;
    }
}

// Handle speech recognition results
function handleSpeechResult(event) {
    const results = event.results;
    const lastResultIndex = results.length - 1;
    const transcript = results[lastResultIndex][0].transcript.trim().toLowerCase();
    
    // Only process final results
    if (results[lastResultIndex].isFinal) {
        console.log("Final transcript:", transcript);
        
        if (isListeningForAssistant) {
            // Input for math assistant
            if (transcript.includes('exit assistant') || 
                transcript.includes('close assistant')) {
                closeAssistant();
                speak("Assistant closed. You can now use navigation commands.");
            } else {
                assistantInput.value = transcript;
                sendAssistantMessage();
            }
        } else {
            // Process voice commands for navigation
            processVoiceCommand(transcript);
        }
    }
}

// Handle speech recognition errors
function handleSpeechError(event) {
    console.error('Speech recognition error', event.error);
    updateVoiceStatus("Voice Assistant: Error - " + event.error, "error");
    
    // Restart recognition after a delay
    setTimeout(startRecognition, 1000);
}

// Handle speech recognition end
function handleSpeechEnd() {
    console.log("Recognition ended, restarting...");
    setTimeout(startRecognition, 500);
}

// Start or restart speech recognition
function startRecognition() {
    if (!recognition || !isSpeechEnabled) return;
    
    try {
        recognition.abort();
        recognition.start();
        updateVoiceStatus(isListeningForAssistant ? 
            "Voice Assistant: Listening for assistant input..." : 
            "Voice Assistant: Listening for commands", "active");
    } catch (e) {
        console.error("Error starting recognition:", e);
    }
}

// Update the voice status display
function updateVoiceStatus(message, status = "active") {
    if (!voiceStatus) return;
    
    const statusText = voiceStatus.querySelector('.status-text');
    const statusIcon = voiceStatus.querySelector('.status-icon i');
    
    if (statusText) statusText.textContent = message;
    
    if (statusIcon) {
        statusIcon.className = 'fas';
        
        switch (status) {
            case "active":
                statusIcon.classList.add('fa-microphone');
                voiceStatus.className = 'voice-control-status active';
                break;
            case "listening":
                statusIcon.classList.add('fa-microphone-alt');
                voiceStatus.className = 'voice-control-status listening';
                break;
            case "speaking":
                statusIcon.classList.add('fa-volume-up');
                voiceStatus.className = 'voice-control-status speaking';
                break;
            case "paused":
                statusIcon.classList.add('fa-pause');
                voiceStatus.className = 'voice-control-status paused';
                break;
            case "error":
                statusIcon.classList.add('fa-exclamation-circle');
                voiceStatus.className = 'voice-control-status error';
                break;
            default:
                statusIcon.classList.add('fa-microphone');
                voiceStatus.className = 'voice-control-status';
        }
    }
}

// Process voice commands
function processVoiceCommand(command) {
    console.log("Processing command:", command);

    
    // Help command
    if (command.includes('help')) {
        speakHelp();
        return;
    }
    
    // Stop reading
    if (command.includes('stop') || command.includes('stop reading')) {
        stopSpeaking();
        speak("Stopped reading.");
        return;
    }
    
    // Open assistant
    if (command.includes('open assistant') || command.includes('help me') || 
        command.includes('ask question') || command.includes('assistant')) {
        openAssistant();
        return;
    }

    if (command.includes('assignment') || command.includes('go to assignment')) {
        redirectToAssignment();
        return;
    }
    
    // Navigation: Next section
    if (command.includes('next') || command.includes('next section') || 
        command.includes('move forward')) {
        navigateToSection(1);
        return;
    }

    // AI explain section
    if (command.includes('explain this section') || command.includes('explain section') || 
        command.includes('ai explain')) {
        if (currentSection) {
            explainSectionWithAI(currentSection);
        } else {
            speak("Please navigate to a section first.");
        }
        return;
    }
    
    // Navigation: Previous section
    if (command.includes('previous') || command.includes('previous section') || 
        command.includes('move back') || command.includes('go back')) {
        navigateToSection(-1);
        return;
    }
    
    // Navigation: Go to specific section
    if (command.includes('go to') || command.includes('navigate to')) {
        if (command.includes('introduction')) {
            navigateToSectionById('introduction');
        } else if (command.includes('understanding') || command.includes('understand fractions')) {
            navigateToSectionById('understanding-fractions');
        } else if (command.includes('types') || command.includes('types of fractions')) {
            navigateToSectionById('types-of-fractions');
        } else if (command.includes('comparing') || command.includes('compare fractions')) {
            navigateToSectionById('comparing-fractions');
        } else if (command.includes('operations') || command.includes('adding') || 
                  command.includes('adding fractions')) {
            navigateToSectionById('operations');
        } else if (command.includes('real life') || command.includes('examples')) {
            navigateToSectionById('real-life');
        } else if (command.includes('assessment') || command.includes('quiz')) {
            navigateToSectionById('self-assessment');
        }
        return;
    }
    
    // Read current section
    if (command.includes('read') || command.includes('read this') || 
        command.includes('explain') || command.includes('repeat')) {
        if (currentSection) {
            readSection(currentSection);
        } else {
            speak("Please navigate to a section first.");
        }
        return;
    }
    
    // Toggle high contrast
    if (command.includes('contrast') || command.includes('high contrast')) {
        toggleHighContrast();
        return;
    }
    
    // Increase font size
    if (command.includes('larger') || command.includes('bigger') || 
        command.includes('increase font')) {
        increaseFontSize();
        return;
    }
    
    // Show keyboard shortcuts
    if (command.includes('keyboard') || command.includes('shortcuts')) {
        showKeyboardShortcuts();
        return;
    }
}

// Read the current section aloud
function readSection(section) {
    if (!section) return;
    
    stopSpeaking();
    isReading = true;
    
    const title = section.querySelector('h2').textContent;
    let content = '';
    
    // Get all text content from the section, excluding interactive elements
    const elements = section.querySelectorAll('p, li, h3:not(.quiz-heading):not(.solution-heading), .fraction-caption');
    elements.forEach(el => {
        if (el.tagName === 'H3') {
            content += 'Heading: ' + el.textContent + '. ';
        } else {
            content += el.textContent + ' ';
        }
    });
    
    speak(`Section: ${title}. ${content}`);
    
    updateVoiceStatus("Voice Assistant: Reading aloud", "speaking");
    
    // Reset reading flag when speech ends
    const checkReadingStatus = setInterval(() => {
        if (!speechSynthesis.speaking) {
            isReading = false;
            updateVoiceStatus("Voice Assistant: Listening for commands", "active");
            clearInterval(checkReadingStatus);
        }
    }, 500);
}

// Navigate to a different section
function navigateToSection(direction) {
    if (!currentSection || sections.length === 0) return;
    
    const currentIndex = sections.indexOf(currentSection);
    let newIndex = currentIndex + direction;
    
    // Wrap around navigation
    if (newIndex < 0) newIndex = sections.length - 1;
    if (newIndex >= sections.length) newIndex = 0;
    
    const newSection = sections[newIndex];
    newSection.focus();
    currentSection = newSection;
    
    // Announce the new section
    const title = newSection.querySelector('h2').textContent;
    speak(`Navigated to ${title}`);
    
    // Scroll to the section
    newSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Navigate to a specific section by ID
function navigateToSectionById(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.focus();
        currentSection = section;
        
        // Announce the section
        const title = section.querySelector('h2').textContent;
        speak(`Navigated to ${title}`);
        
        // Scroll to the section
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
        speak("Section not found.");
    }
}

// Function to redirect to the assignment page
function redirectToAssignment() {
    // Inform the user about the redirection
    speak("Redirecting you to the assignment page.");
    
    // Add a small delay before redirecting to allow the speech to be heard
    setTimeout(() => {
        // Use the placeholder URL you provided
        window.location.href = "https://www.mathsisfun.com/";
    }, 2000); // 2-second delay
}

// Explain the current section using AI
function explainSectionWithAI(section) {
    if (!section) return;
    
    stopSpeaking();
    
    // Show a loading indicator
    updateVoiceStatus("Voice Assistant: Getting AI explanation", "speaking");
    speak("Getting an easier explanation. Please wait.");
    
    // Extract section content
    const title = section.querySelector('h2').textContent;
    let content = '';
    
    // Get all text content from the section
    const elements = section.querySelectorAll('p, li, h3:not(.quiz-heading):not(.solution-heading)');
    elements.forEach(el => {
        content += el.textContent + ' ';
    });
    
    // Create the query for AI
    const query = `${title}: ${content}`;
    
    // Call the AI service
    callGeminiAPI(query).then(explanation => {
        if (explanation) {
            speak("AI explanation: " + explanation);
            
            // Add to assistant panel if it's open
            if (assistantPanel.classList.contains('open')) {
                addAssistantMessage('assistant-message', "AI Explanation: " + explanation);
            }
        } else {
            speak("Sorry, I couldn't get an AI explanation at this time.");
        }
    }).catch(error => {
        console.error("AI explanation error:", error);
        speak("Sorry, there was an error getting the AI explanation.");
    }).finally(() => {
        updateVoiceStatus("Voice Assistant: Listening for commands", "active");
    });
}

// Call the Gemini API
function callGeminiAPI(query) {
    return new Promise((resolve, reject) => {
        // API endpoint from your Flask server
        const apiUrl = 'http://127.0.0.1:5000/get-answer';
        
        fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ question: query })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if (data.error) {
                reject(data.error);
            } else {
                resolve(data.answer);
            }
        })
        .catch(error => {
            console.error('Error calling AI API:', error);
            // Try fallback explanation
            const fallbackExplanation = getFallbackExplanation(query);
            if (fallbackExplanation) {
                resolve(fallbackExplanation);
            } else {
                reject(error);
            }
        });
    });
}

// Fallback explanations if API is unavailable
function getFallbackExplanation(query) {
    const title = query.split(':')[0].toLowerCase();
    
    const fallbacks = {
        "introduction": "Fractions are parts of a whole. Think of cutting a pizza into slices - each slice is a fraction of the whole pizza. Fractions have a top number called the numerator and a bottom number called the denominator. The denominator tells you how many equal parts make the whole, and the numerator tells you how many of those parts you have.",
        
        "understanding fractions": "Fractions are like sharing things fairly. If you share one chocolate bar equally between 4 friends, each friend gets 1/4 (one-fourth) of the chocolate. The bottom number (4) tells you how many equal pieces, and the top number (1) tells you how many pieces you have.",
        
        "types of fractions": "There are three main types of fractions. Proper fractions are less than 1, like 1/2 or 3/4. Improper fractions are 1 or more, like 5/4 or 3/2. Mixed numbers have a whole number and a fraction together, like 1 1/2, which means one and a half.",
        
        "comparing fractions": "To compare fractions with the same bottom number, just look at the top numbers - the bigger top number means a bigger fraction. For fractions with different bottom numbers, you need to find similar fractions with the same bottom number first.",
        
        "operations": "To add or subtract fractions with the same bottom number, just add or subtract the top numbers and keep the same bottom number. For fractions with different bottom numbers, you need to find equivalent fractions with the same denominator first.",
        
        "real-life": "Fractions are everywhere! When you measure 1/2 cup of sugar for cooking, share half a sandwich with a friend, or fill your water bottle halfway, you're using fractions. We use fractions to tell time too - 15 minutes is 1/4 of an hour.",
        
        "self-assessment": "Let's see how well you understand fractions! Remember that the top number (numerator) tells you how many parts you have, and the bottom number (denominator) tells you the total number of equal parts. Good luck with your practice!"
    };
    
    // Try to match the section title with our fallbacks
    for (const [key, explanation] of Object.entries(fallbacks)) {
        if (title.includes(key)) {
            return explanation;
        }
    }
    
    // Default fallback
    return "Fractions are parts of a whole. The bottom number tells you how many equal parts make up the whole, and the top number tells you how many of those parts you have. For example, in 3/4, the whole is divided into 4 equal parts, and you have 3 of those parts.";
}

// Speak text aloud
function speak(text) {
    if (!isSpeechEnabled) return;
    
    stopSpeaking();
    
    utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;
    
    // Use a female voice if available (better for many classroom settings)
    const voices = speechSynthesis.getVoices();
    const indianVoice = voices.find(voice => voice.lang.includes('en-IN'));
    const femaleVoice = voices.find(voice => voice.name.includes('Female') || voice.name.includes('female'));
    
    if (indianVoice) {
        utterance.voice = indianVoice;
    } else if (femaleVoice) {
        utterance.voice = femaleVoice;
    }
    
    speechSynthesis.speak(utterance);
    updateVoiceStatus("Voice Assistant: Speaking", "speaking");
}

// Stop all speaking
function stopSpeaking() {
    if (speechSynthesis) {
        speechSynthesis.cancel();
    }
    isReading = false;
}

// Speak the help information
function speakHelp() {
    const helpText = `Here are the available voice commands: 
    Say "next section" to move to the next section, 
    "previous section" to move to the previous section, 
    "read this" to read the current section, 
    "stop reading" to stop the voice narration, 
    "open assistant" to open the math assistant, 
    "go to" followed by a section name to navigate to that section, 
    "high contrast" to toggle high contrast mode, 
    and "help" to hear these commands again.`;
    
    speak(helpText);
}

// Open the math assistant panel
function openAssistant() {
    stopSpeaking();
    assistantPanel.classList.add('open');
    assistantInput.focus();
    
    // Switch to assistant voice input mode
    isListeningForAssistant = true;
    updateVoiceStatus("Voice Assistant: Listening for assistant input", "listening");
    
    speak("Math Assistant is open. Please ask your question about fractions. Say 'exit assistant' to close the assistant.");
}

// Close the math assistant panel
function closeAssistant() {
    assistantPanel.classList.remove('open');
    
    // Switch back to navigation voice input mode
    isListeningForAssistant = false;
    updateVoiceStatus("Voice Assistant: Listening for commands", "active");
}

// Send a message to the math assistant
function sendAssistantMessage() {
    const message = assistantInput.value;
    if (!message.trim()) return;
    
    addAssistantMessage('user-message', message);
    assistantInput.value = '';
    
    // Process the message and generate a response
    const response = generateAssistantResponse(message);
    
    // Add a slight delay for a more natural interaction
    setTimeout(() => {
        addAssistantMessage('assistant-message', response);
        speak("Math assistant says: " + response);
    }, 800);
}

// Add a message to the assistant panel
function addAssistantMessage(sender, text) {
    const messageDiv = document.createElement('div');
    messageDiv.className = sender;
    
    const paragraph = document.createElement('p');
    paragraph.textContent = text;
    messageDiv.appendChild(paragraph);
    
    assistantMessages.appendChild(messageDiv);
    assistantMessages.scrollTop = assistantMessages.scrollHeight;
}

// Generate a response from the math assistant
function generateAssistantResponse(message) {
    const lowerMessage = message.toLowerCase();
    
    // Map of keywords to responses
    const responses = {
        "what is a fraction": "A fraction represents a part of a whole. It has two parts: the numerator (top number) which tells how many parts we're talking about, and the denominator (bottom number) which tells how many equal parts the whole is divided into.",
        
        "proper fraction": "A proper fraction is one where the numerator (top number) is less than the denominator (bottom number). For example, 1/2, 3/4, and 5/8 are all proper fractions. They represent less than one whole.",
        
        "improper fraction": "An improper fraction is one where the numerator (top number) is greater than or equal to the denominator (bottom number). For example, 5/4, 7/3, and 8/8 are improper fractions. They represent one whole or more than one whole.",
        
        "mixed number": "A mixed number has a whole number part and a proper fraction part, like 1 3/4. It's another way to write improper fractions. For example, 1 3/4 is the same as 7/4.",
        
        "equivalent fraction": "Equivalent fractions are different fractions that represent the same value. For example, 1/2, 2/4, 3/6, and 4/8 are all equivalent fractions. To find equivalent fractions, you can multiply or divide both the numerator and denominator by the same number.",
        
        "add fraction": "To add fractions with the same denominator, add the numerators and keep the denominator the same. For example, 1/4 + 2/4 = 3/4. For fractions with different denominators, you need to find a common denominator first.",
        
        "subtract fraction": "To subtract fractions with the same denominator, subtract the numerators and keep the denominator the same. For example, 3/4 - 1/4 = 2/4 = 1/2. For fractions with different denominators, find a common denominator first.",
        
        "compare fraction": "To compare fractions with the same denominator, just compare the numerators. The fraction with the larger numerator is greater. For fractions with different denominators, convert them to equivalent fractions with a common denominator first.",
        
        "like fraction": "Like fractions (or fractions with like denominators) are fractions that have the same denominator. For example, 1/5 and 3/5 are like fractions because they both have 5 as the denominator.",
        
        "unlike fraction": "Unlike fractions (or fractions with unlike denominators) are fractions with different denominators. For example, 1/2 and 1/3 are unlike fractions because they have different denominators (2 and 3).",
        
        "convert improper": "To convert an improper fraction to a mixed number: 1) Divide the numerator by the denominator, 2) The quotient becomes the whole number part, 3) The remainder becomes the new numerator, 4) Keep the same denominator. For example, 7/4 = 1 3/4 (7 ÷ 4 = 1 with remainder 3).",
        
        "convert mixed": "To convert a mixed number to an improper fraction: 1) Multiply the whole number by the denominator, 2) Add the numerator to this product, 3) Put this sum over the original denominator. For example, 1 3/4 = 7/4 (1 × 4 + 3 = 7, so 7/4).",
        
        "real life example": "Fractions are used everyday! In cooking (1/2 cup of sugar), in time (quarter-hour = 15 minutes), in money (50 paise = 1/2 rupee), and in measurements (500ml = 1/2 liter). When we share food like a roti or pizza equally, we use fractions to describe each person's portion.",
        
        "help": "You can ask me questions about fractions like 'What is a fraction?', 'How do I add fractions?', 'What's an improper fraction?', 'Give me real-life examples of fractions', etc. I'm here to help you understand NCERT Class 4 fractions!"
    };
    
    // Check for keywords in the message
    for (const [keyword, response] of Object.entries(responses)) {
        if (lowerMessage.includes(keyword)) {
            return response;
        }
    }
    
    // Additional specific patterns to check
    if (lowerMessage.includes("half") || lowerMessage.includes("1/2")) {
        return "Half (1/2) means one part out of two equal parts. It is one of the most common fractions we use in daily life. Half an hour is 30 minutes, half a rupee is 50 paise, and half a meter is 50 centimeters.";
    }
    
    if (lowerMessage.includes("quarter") || lowerMessage.includes("1/4")) {
        return "A quarter (1/4) means one part out of four equal parts. In time, a quarter of an hour is 15 minutes. When we divide something into four equal parts, each part is one quarter.";
    }
    
    if (lowerMessage.includes("third") || lowerMessage.includes("1/3")) {
        return "One-third (1/3) means one part out of three equal parts. When we divide something into three equal parts, each part is one-third of the whole.";
    }
    
    // Default response if no keywords match
    return "I understand you're asking about fractions. Could you please rephrase your question? You can ask about what fractions are, types of fractions, adding fractions, or real-life examples of fractions.";
}

// Initialize all event listeners
function initEventListeners() {
    // Accessibility panel buttons
    if (fontIncreaseBtn) {
        fontIncreaseBtn.addEventListener('click', toggleFontSize);
    }
    
    if (highContrastBtn) {
        highContrastBtn.addEventListener('click', toggleHighContrast);
    }
    
    if (readAloudBtn) {
        readAloudBtn.addEventListener('click', function() {
            if (currentSection) readSection(currentSection);
        });
    }
    
    if (pauseReadingBtn) {
        pauseReadingBtn.addEventListener('click', stopSpeaking);
    }
    
    // Assistant panel buttons
    if (openAssistantBtn) {
        openAssistantBtn.addEventListener('click', openAssistant);
    }
    
    if (closeAssistantBtn) {
        closeAssistantBtn.addEventListener('click', closeAssistant);
    }
    
    if (sendAssistantMsgBtn) {
        sendAssistantMsgBtn.addEventListener('click', sendAssistantMessage);
    }
    
    if (voiceInputAssistantBtn) {
        voiceInputAssistantBtn.addEventListener('click', function() {
            isListeningForAssistant = true;
            updateVoiceStatus("Voice Assistant: Listening for assistant input", "listening");
            speak("Please speak your question.");
        });
    }
    
    if (assistantInput) {
        assistantInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendAssistantMessage();
            }
        });
    }
    
    // Keyboard shortcuts panel
    if (showKeyboardShortcutsBtn) {
        showKeyboardShortcutsBtn.addEventListener('click', showKeyboardShortcuts);
    }
    
    if (closeShortcutsBtn) {
        closeShortcutsBtn.addEventListener('click', hideKeyboardShortcuts);
    }
    
    // Global keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);
    
    // Quiz option clicks
    quizOptions.forEach(option => {
        option.addEventListener('click', handleQuizOptionClick);
    });
    
    // Load voices for speech synthesis
    speechSynthesis.addEventListener('voiceschanged', function() {
        console.log("Voices loaded:", speechSynthesis.getVoices().length);
    });
}

// Toggle font size
function toggleFontSize() {
    const html = document.documentElement;
    const currentSize = parseInt(window.getComputedStyle(html).fontSize);
    
    if (currentSize >= 20) {
        html.style.fontSize = '16px';
        speak("Font size reset to normal.");
    } else {
        html.style.fontSize = (currentSize + 2) + 'px';
        speak("Font size increased.");
    }
}

// Increase font size
function increaseFontSize() {
    const html = document.documentElement;
    const currentSize = parseInt(window.getComputedStyle(html).fontSize);
    
    if (currentSize < 24) {
        html.style.fontSize = (currentSize + 2) + 'px';
        speak("Font size increased.");
    } else {
        speak("Maximum font size reached.");
    }
}

// Toggle high contrast mode
function toggleHighContrast() {
    document.body.classList.toggle('high-contrast');
    
    if (document.body.classList.contains('high-contrast')) {
        speak("High contrast mode enabled.");
    } else {
        speak("High contrast mode disabled.");
    }
}

// Show keyboard shortcuts panel
function showKeyboardShortcuts() {
    if (keyboardShortcuts) {
        keyboardShortcuts.classList.add('show');
        keyboardShortcuts.focus();
    }
}

// Hide keyboard shortcuts panel
function hideKeyboardShortcuts() {
    if (keyboardShortcuts) {
        keyboardShortcuts.classList.remove('show');
    }
}

// Handle keyboard shortcuts
function handleKeyboardShortcuts(e) {
    // Skip if user is typing in an input
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
    }
    
    switch (e.key) {
        case 'ArrowRight':
        case 'n':
        case 'N':
            navigateToSection(1);
            break;
            
        case 'ArrowLeft':
        case 'p':
        case 'P':
            navigateToSection(-1);
            break;
            
        case ' ':
            if (currentSection) {
                e.preventDefault(); // Prevent page scrolling
                readSection(currentSection);
            }
            break;
            
        case 'Escape':
            stopSpeaking();
            closeAssistant();
            hideKeyboardShortcuts();
            break;
            
        case 'a':
        case 'A':
            openAssistant();
            break;
            
        case 'h':
        case 'H':
            showKeyboardShortcuts();
            break;
            
        case '+':
        case '=':
            increaseFontSize();
            break;
            
        case '-':
        case '_':
            // Decrease font size (not implemented in UI buttons)
            const html = document.documentElement;
            const currentSize = parseInt(window.getComputedStyle(html).fontSize);
            if (currentSize > 16) {
                html.style.fontSize = (currentSize - 2) + 'px';
                speak("Font size decreased.");
            }
            break;
            
        case 'c':
        case 'C':
            toggleHighContrast();
            break;
    }
}

// Initialize quiz functionality
function initQuiz() {
    quizOptions.forEach(option => {
        option.addEventListener('click', handleQuizOptionClick);
    });
}

// Handle quiz option clicks
function handleQuizOptionClick(e) {
    const option = e.currentTarget;
    const question = option.closest('.quiz-question');
    const feedback = question.querySelector('.quiz-feedback');
    const options = question.querySelectorAll('.quiz-option');
    
    // Reset all options
    options.forEach(opt => {
        opt.classList.remove('correct', 'incorrect');
        opt.setAttribute('aria-selected', 'false');
    });
    
    // Set this option as selected
    option.setAttribute('aria-selected', 'true');
    
    // Check if the answer is correct
    const isCorrect = option.getAttribute('data-correct') === 'true';
    
    if (isCorrect) {
        option.classList.add('correct');
        feedback.textContent = "Correct! Well done!";
        feedback.className = 'quiz-feedback correct';
        speak("Correct! Well done!");
    } else {
        option.classList.add('incorrect');
        feedback.textContent = "Not quite right. Try again.";
        feedback.className = 'quiz-feedback incorrect';
        speak("Not quite right. Try again.");
    }
}

// Load speech synthesis voices
function loadVoices() {
    // The voices are loaded asynchronously, so we need to wait for the event
    return new Promise((resolve) => {
        let voices = speechSynthesis.getVoices();
        if (voices.length) {
            resolve(voices);
            return;
        }
        
        speechSynthesis.onvoiceschanged = () => {
            voices = speechSynthesis.getVoices();
            resolve(voices);
        };
    });
}

// Special function for fraction grid visualization
function setupFractionVisuals() {
    // Set up dynamic fraction visualizations if they exist
    const fractionGrids = document.querySelectorAll('.fraction-grid');
    
    fractionGrids.forEach(grid => {
        if (grid.classList.contains('interactive')) {
            // Setup interactive fraction grids
            setupInteractiveFractionGrid(grid);
        }
    });
}

// Setup an interactive fraction grid
function setupInteractiveFractionGrid(grid) {
    const cells = grid.querySelectorAll('.fraction-cell');
    const fractionDisplay = grid.nextElementSibling;
    
    if (!fractionDisplay || !fractionDisplay.classList.contains('fraction-caption')) {
        return;
    }
    
    cells.forEach((cell, index) => {
        cell.addEventListener('click', () => {
            cell.classList.toggle('fraction-shaded');
            
            // Count shaded cells
            const shadedCells = grid.querySelectorAll('.fraction-shaded').length;
            const totalCells = cells.length;
            
            // Update fraction display
            fractionDisplay.textContent = `${shadedCells}/${totalCells} (${shadedCells}-${getFractionWord(totalCells)})`;
            
            // Announce the change
            speak(`${shadedCells} out of ${totalCells} cells are now shaded. The fraction is ${shadedCells}/${totalCells}.`);
        });
    });
}

// Get the word form of a fraction denominator
function getFractionWord(denominator) {
    const words = {
        2: 'half',
        3: 'third',
        4: 'fourth',
        5: 'fifth',
        6: 'sixth',
        8: 'eighth',
        10: 'tenth',
        12: 'twelfth'
    };
    
    const word = words[denominator];
    if (word) {
        return word + (denominator > 1 ? 's' : '');
    }
    
    return 'parts';
}

// Call init function when document is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize the application
    initApp();
    
    // Set up fraction visualizations
    setupFractionVisuals();
    
    // Load voices for speech synthesis
    loadVoices().then(voices => {
        console.log(`Loaded ${voices.length} voices for speech synthesis`);
    });
});
