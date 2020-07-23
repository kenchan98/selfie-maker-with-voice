const transcriptContainer = document.getElementById('transcript')

// setting up the speech recognition - seems only work in Chrome at the moment
window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const speechRecognition = new SpeechRecognition();
if(speechRecognition){
    speechRecognition.addEventListener('result', e => {
        //pick out the transcripts from the objects
        const transcript = Array.from(e.results)
        .map( result => result[0])
        .map( result => result.transcript)
        .join('')

        console.log(transcript)
        transcriptContainer.innerText = (transcript);
        //
        // when the sentence is finished, start checking the command
        if(e.results[0].isFinal){
            const transcript_upper = transcript.toUpperCase();
            if(transcript_upper.includes('TAKE A PICTURE') || transcript_upper.includes('TAKE ANOTHER PICTURE')){
                takePicture();
            }
            if(transcript_upper.includes('OPEN GALLERY')){
                openGallery();
            }else if(transcript_upper.includes('GALLERY')){
                checkGalleryStatus();
            }
            if(transcript_upper.includes('CLOSE GALLERY')){
                closeGallery();
            }
            if(transcript_upper.includes('GIVE ME A HAT')){
                showHat();
            }
            if(transcript_upper.includes('REMOVE THE HAT') || transcript_upper.includes('TAKE OFF THE HAT')){
                removeHat();
            }
            if(transcript_upper.includes('OPEN COMMAND') || transcript_upper.includes('OPEN COMMANDS')){
                openVoiceCommand();
            }
            if(transcript_upper.includes('CLOSE COMMAND') || transcript_upper.includes('CLOSE COMMANDS')){
                closeVoiceCommand();
            }
            if(transcript_upper.includes('I AM READY') || transcript_upper.includes("I'M READY")){
                initApp();
            }
            if(transcript_upper.includes('PLAY IMAGE SEQUENCE')){
                openImageSequence();
            }else if(transcript_upper.includes('IMAGE SEQUENCE')){
                checkImageSequenceStatus();
            }
            if(transcript_upper.includes('CLOSE IMAGE SEQUENCE') || transcript_upper.includes('CLOSED IMAGE SEQUENCE') || transcript_upper.includes('STOP IMAGE SEQUENCE')){
                closeImageSequence();
            }
            if(transcript_upper.includes('CLEAR ALL IMAGES') || transcript_upper.includes('REMOVE ALL IMAGES')){
                removeAllImages();
            }
        }
    });
    // will keep picking up words as I speak
    speechRecognition.interimResults = true;
    //speechRecognition.continuous = true;
    //
    //
    // restart the recognition at the end of each sentence
    speechRecognition.onend = function () {
        console.log('----- SPEECH RECOGN has stopped.');
        speechRecognition.start();
    }
    //
    //
    speechRecognition.start();
}else{
    alert('your browser does not support speech recognition, try Chrome?')
}
