const video = document.getElementById("video");
// sound FX
const sound = {
    pop         : new Howl({ src:['sfx/pop.mp3']}),
    snapshot    : new Howl({ src:['sfx/snapshot.mp3']}),
    gallery_open: new Howl({ src:['sfx/gallery_open.mp3']}),
}
// the time interval for playing the image sequence
let timeInterval_imageSequence = 0;
// flag for gallery open/close status
let galleryStatus = 'close';
// flag for voice command open/close status
let voiceCommandStatus = 'close';
// flag for image sequence show/hide status
let imageSequenceStatus = 'close';
// list for keeping track of all the selfies
let imageList = [];

/* -----------------
/* CREATEJS CANVAS
/* ----------------- */
const stage = new createjs.Stage(document.getElementById('my-draw-canvas'));
createjs.Ticker.addEventListener("tick", stage);
createjs.Ticker.setFPS(30);
const containerWidth = 235;
const containerHeight = 235;//300;
const offset = {x:0, y:0}
// the loading spinner
let loading = new createjs.Container();
loading.img = new createjs.Bitmap("img/loading.png");
loading.img.regX = loading.img.regY = 56;
loading.img.x = 320;
loading.img.y = 240;
loading.addChild(loading.img);
createjs.Tween.get(loading.img, {loop:true}).to({  rotation: 360 }, 1000);
// the target container searching for the faces in the video stream
const targetContainer = new createjs.Container();
targetContainer.target = new createjs.Shape();
targetContainer.target.graphics.setStrokeStyle(10,"round").beginStroke("white").drawRoundRect( 0, 0, containerWidth, containerHeight,20);
targetContainer.snapshot = new createjs.Shape();
targetContainer.snapshot.graphics.beginFill("white").drawRoundRect( 0, 0, containerWidth, containerHeight,20);
targetContainer.snapshot.alpha = 0;
targetContainer.expression = new createjs.Text("", "25px Rubik", "white");
targetContainer.expression.textAlign = 'center';
targetContainer.expression.x = 118;
targetContainer.expression.y = 13;
targetContainer.hat = new createjs.Bitmap("img/hat.png");
targetContainer.hat.y = -160;
targetContainer.hat.visible = false;
targetContainer.coord_x = new createjs.Text("X: ", "16px Rubik", "white");
targetContainer.coord_y = new createjs.Text("Y: ", "16px Rubik", "white");
targetContainer.coord_x.x = 20;
targetContainer.coord_y.x = 115;
targetContainer.coord_x.y = targetContainer.coord_y.y = containerHeight - 28;
targetContainer.alpha = 0;
targetContainer.addChild(targetContainer.hat, targetContainer.target, targetContainer.snapshot, targetContainer.coord_x, targetContainer.coord_y, targetContainer.expression);
stage.addChild(loading, targetContainer);
//
//
Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
    faceapi.nets.faceExpressionNet.loadFromUri("/models"),
    faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
    faceapi.nets.faceRecognitionNet.loadFromUri("/models")
]).then(
    () => { 
        console.log('---- READY')
        gsap.timeline().to('.transcript-container', { opacity:1, duration:2} )
    }
);

function removeDisclaimerScreen(){
    gsap.timeline()
    .to('#disclaimer', { opacity:0, onComplete: () => {
        let element = document.getElementById("disclaimer");
        element.parentNode.removeChild(element);
    }})
}

function initApp(){
    gsap.timeline()
    .to('#intro', {opacity: 0, duration:2, onComplete: () => {
        let element = document.getElementById("intro");
        element.parentNode.removeChild(element);
    }})
    .to('.transcript-container', {top: 28, duration: .5})
    .set('#my-draw-canvas', {visibility:'visible'})
    .add( () => { sound.pop.play(); })
    .to('#image-gallery', {bottom: -170, duration: .3})
    .add( () => { sound.pop.play(); openVoiceCommand()})
    //.to('#voice-command', {top: -460, duration: .3})
    .add( () => {
        startVideo();
        transcriptContainer.innerText = 'Just say "Open Commands List"';
    });
}

function startVideo(){
    navigator.getUserMedia(
        {video: {}},
        stream  => (video.srcObject = stream),
        error   => (console.error(error))
    );
}

video.addEventListener('playing', async () => {
    /*const displaySize = { width: video.width, height: video.height};
    const canvas = faceapi.createCanvasFromMedia(video);
    document.getElementById('video-content').append(canvas);*/

    setInterval( async () => {
        const detections = await faceapi.detectAllFaces(
            video, 
            new faceapi.TinyFaceDetectorOptions() //{inputSize:128}
        ).withFaceLandmarks().withFaceExpressions();


        /*const resizedDetections = faceapi.resizeResults(detections, displaySize);
        canvas.getContext('2d').clearRect(0,0, canvas.width, canvas.height);
        faceapi.draw.drawDetections(canvas, resizedDetections);
        faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);*/


        if(detections.length > 0){
            if(loading){
                stage.removeChild(loading);
                loading = null;
            }
            //console.log(detections[0].landmarks.imageWidth)
            var diffW = (detections[0].landmarks.imageWidth - containerWidth)/2;
            var diffH = (detections[0].landmarks.imageHeight - containerHeight)/2;
            //
            //
            const targetData = detections[0].detection.box;
            //console.log(' diffW : '+diffW)
            //console.log(' targetData x : '+targetData.x)
            let _x = Math.round(targetData.x + offset.x + diffW);
            let _y = Math.round(targetData.y + offset.y + diffH);
            //
            // restrict targetContainer bounding area
            if( _x >= 403 ) { _x = 403; }else if( _x <= 1 ) { _x = 1; }
            if( _y >= 243 ) { _y = 243; }else if( _y <= 0 ) { _y = 0; }
            //
            // display targetContainer x & y coordinates
            const off = 118;
            targetContainer.coord_x.text = 'X : ' + (_x + off);
            targetContainer.coord_y.text = 'Y : ' + (_y + off);
            //
            //
            createjs.Tween.get(targetContainer, {override:true}).to({ x: _x, y:_y, alpha:1}, 300);
            //
            // getting the highest value of either 
            const expressions = detections[0].expressions;
            const expression = Object.keys(expressions).reduce((a, b) => expressions[a] > expressions[b] ? a : b);
            targetContainer.expression.text = expression;
            /*const targetData = detections[0].landmarks;
            target.graphics.clear();
            target.graphics.setStrokeStyle(3,"round").beginStroke("white").drawRoundRect( targetData.shift.x, targetData.shift.y, targetData.imageWidth, targetData.imageHeight,20)*/
        }else{
            createjs.Tween.get(targetContainer, {override:true}).to({ alpha:0}, 200);
        }
        
    }, 100);
});

function takePicture(){
    // grab image data from video and store it in a canvas
    let canvas = document.createElement('canvas');
    canvas.width = containerWidth;
    canvas.height = containerHeight;
    canvas.getContext('2d').drawImage(video, targetContainer.x - offset.x, targetContainer.y + offset.y, containerWidth, containerHeight, 0, 0, containerWidth, containerHeight,); 
    // remove the message inside the image gallery when its nothing inside,
    // - 'Nothing in here yet. Say "Take A Picture" and your taken selfie will be stored in here.'
    if(document.getElementById('place-holder')){
        let element = document.getElementById("place-holder");
        element.parentNode.removeChild(element);
    }
    //the flash as snapshot taken inside the target container
    targetContainer.snapshot.alpha = 1;
    sound.snapshot.play();
    createjs.Tween.get(targetContainer.snapshot, {override:true}).to({alpha:0}, 300).call(
        () => {
            const img = new Image( 200, 200);
            // animation sequence of opening up the image gallery, 
            // put the image in there and then close the gallery
            gsap.timeline()
            .to('#image-gallery', {bottom: 0 , duration:.3, ease: Back.easeOut.config(1.7)})
            .add( () => { 
                img.src = canvas.toDataURL('image/png');
                document.getElementById('image-gallery-content').appendChild(img);
                imageList.push(img)})
            .from(img, { alpha: 0 , duration:1 })
            .to(img, { alpha: 1 , duration:1 })
            .add( () => { sound.gallery_open.play();})
            .to('#image-gallery', {bottom: -170 , duration:.3, ease: Power4.easeOut})
        }
    );
    //
    //canvas.getContext('2d').drawImage(video, 0, 0, video.videoWidth, video.videoHeight);  
    /*const img = new Image( 200, 200);
    img.src = canvas.toDataURL('image/png');
    document.getElementById('image-gallery').appendChild(img);*/
    //
    
}

function checkGalleryStatus(){
    if(galleryStatus === 'open'){
        closeGallery();
    }else{
        openGallery();
    }
}

function openGallery(){
    if(galleryStatus === 'close'){
        galleryStatus = 'open';
        sound.gallery_open.play();
        gsap.to('#image-gallery', {bottom: 0 , duration:.3, ease: Back.easeOut.config(1.7)});
    }
}

function closeGallery(){
    if(galleryStatus === 'open'){
        galleryStatus = 'close';
        sound.gallery_open.play();
        gsap.to('#image-gallery', {bottom: -170 , duration:.3, ease: Power4.easeOut});
    }
}

function checkVoiceCommandStatus(){
    if(voiceCommandStatus === 'open'){
        closeVoiceCommand();
    }else{
        openVoiceCommand();
    }
}

function openVoiceCommand(){
    if(voiceCommandStatus === 'close'){
        voiceCommandStatus = 'open';
        sound.gallery_open.play();
        gsap.to('#voice-command', {top: 0 , duration:.3, ease: Back.easeOut.config(1.7)});
    }
}

function closeVoiceCommand(){
    if(voiceCommandStatus === 'open'){
        voiceCommandStatus = 'close';
        sound.gallery_open.play();
        gsap.to('#voice-command', {top: -460 , duration:.3, ease: Back.easeOut.config(1.7)});
    }
}

function openImageSequence(){
    if(imageSequenceStatus === 'close'){
        imageSequenceStatus = 'open';
        gsap.set("#image-sequence-container",{visibility: "visible"});
        gsap.set("#my-draw-canvas",{visibility: "hidden"});
        gsap.set("video",{visibility: "hidden"});
        playImageSequence();
    }
}

function closeImageSequence(){
    if(imageSequenceStatus === 'open'){
        imageSequenceStatus = 'close';
        clearInterval(timeInterval_imageSequence);
        gsap.set("#image-sequence-container",{visibility: "hidden"});
        gsap.set("#my-draw-canvas",{visibility: "visible"});
        gsap.set("video",{visibility: "visible"});
    }
}

function playImageSequence(){
    let totalNum = imageList.length;
    let currentIndex = 0;
    if(timeInterval_imageSequence) clearInterval(timeInterval_imageSequence);
    timeInterval_imageSequence = setInterval(() => {
        document.getElementById('image-place-holder').src = imageList[currentIndex].src;
        if(currentIndex < totalNum - 1 ) currentIndex++;
        else currentIndex=0;
    }, 1000);
}

function removeAllImages(){
    imageList = [];
    const myNode = document.getElementById('image-gallery-content');
    while (myNode.firstChild) {
        myNode.removeChild(myNode.lastChild);
    }
}

function checkImageSequenceStatus(){
    if(imageSequenceStatus === 'close'){
        openImageSequence();
    }else{
        closeImageSequence();
    }
}

function showHat(){
    targetContainer.hat.visible = true;
}

function removeHat(){
    targetContainer.hat.visible = false;
}

