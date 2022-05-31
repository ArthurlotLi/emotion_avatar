/*
  app.tsx

  Primary script for front-facing web application functionality.
  Apologies for any bad practices - this is a quickie deployment
  website. -Arthur
*/

const React = require('react');
const ReactDOM = require('react-dom');

// Get webserver address to make API requests to it. apiURL should
// therefore contain http://192.168.0.197 (regardless of subpage).
const currentURL = window.location.href;
const splitURL = currentURL.split("/");
const apiURL = splitURL[0] + "//" + splitURL[2]; 

const defaultIntroductionPage1Style = {
  width: "100%",
  height: "fit-content",
  display: "block",
  visibility: "visible",
  pointerEvents: "auto",
  overflow: "hidden",
}

const defaultIntroductionPage2Style = {
  width: "100%",
  height: "fit-content",
  display: "none",
  visibility: "hidden",
  pointerEvents: "none",
  overflow: "hidden",
}

// Vague numbers. Don't mind them. 
const nightEndHours = 7;
const sunsetEndHours = 8;
const sunsetBeginHours = 18;
const nightBeginHours = 19

const jsonLocation = "../../../assets/test_annotated.json";
const sampleLocation = "../../../assets/test_annotated";

// Classes and objects that will dynamically define the contents of
// the page. 
class Emotion {
  categoryID = null;
  category = null;
  nightlight = null;
  sunlight = null;
  sunset = null;
  constructor(categoryID, category){
    this.categoryID = categoryID
    this.category = category
    if(categoryID == 10){
      this.nightlight = `nightlight_${category}0000-0240.gif`,
      this.sunlight = `sunlight_${category}0000-0240.gif`,
      this.sunset = `sunset_${category}0000-0240.gif`
    }
    else{
      this.nightlight = `nightlight_${category}0000-0120.gif`,
      this.sunlight = `sunlight_${category}0000-0120.gif`,
      this.sunset = `sunset_${category}0000-0120.gif`
    }
  }

  getGifByTimeOfDay(){
    let today = new Date();
    let hours = today.getHours()
    if(hours < nightEndHours || hours > nightBeginHours){
      return this.nightlight;
    }
    if(hours < sunsetEndHours || hours > sunsetBeginHours){
      return this.sunset;
    }
    return this.sunlight;
  }
}

// Copied verbatim from the Emotion Detection project. 
const solutionStringMap = {
  0 : "joy",
  1 :"sadness",
  2 : "fear",
  3 : "anger",
  4 : "disgust",
  5 : "surprise",
  6 : "neutral",
  10 : "idle1",
  11 : "listen",
}

var emotionObjects = {}
for (let [key, value] of Object.entries(solutionStringMap)) {
  emotionObjects[key] = new Emotion(key, value);
}

console.log(emotionObjects)

const audioEndedChecking = 50; // in ms.
const audioWaitBetweenUtterances = 0; // in ms
const audioEllipseWait = 1500; // in ms.

const defaultEmotion = 10;
const defaultSubtitles = "Play a random sample...";

export class App extends React.Component {

  playedSamples = [];
  totalSamplesList = [];
  totalSamples = 0;
  sampleJson = null;

  state = {
    emotion: defaultEmotion,
    currentSample: -1,
    currentAudio: null,
    showingPage1: true,
    introductionPage1Style: defaultIntroductionPage1Style,
    introductionPage2Style: defaultIntroductionPage2Style,
    defaultSkit: "",
    skitSubtitles: defaultSubtitles
  };

  constructor(){
    super();
  }

  // Executed only once upon startup.
  async componentDidMount(){
    let response = await fetch(jsonLocation,{
      headers : { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
       }})
    this.sampleJson = await response.json();
    this.totalSamples = this.sampleJson.length;
    for(var i = 0; i < this.totalSamples; i++){
      this.totalSamplesList.push(i);
    }
    console.log(`Total samples: ${this.totalSamples}`)
  }

  // Select a random sample that we haven't played before. 
  async onPlaySample(){
    // Reset the played samples if we've gone through them all. 
    if(this.playedSamples.length >= this.totalSamples){
      this.playedSamples = []
    }

    // Select a random sample that we haven't gotten before. 
    let array = this.totalSamplesList.filter(e => !this.playedSamples.includes(e));
    let randomElement = array[Math.floor(Math.random() * array.length)];

    console.log(randomElement);
    this.playedSamples.push(randomElement);

    // Play the sample. 
    let sampleIndex = randomElement;
    this.playSample(sampleIndex);
  }

  async playSample(sampleIndex) {
    let sampleSolution = this.sampleJson[sampleIndex][0];
    let samplePrediction = this.sampleJson[sampleIndex][1];
    let sampleText = this.sampleJson[sampleIndex][2];

    let utteranceSubtitles = sampleText as string;
    let utteranceWavFilename = `${sampleIndex}.wav`
    
    console.log(`[${utteranceWavFilename}]: [${sampleSolution} - ${samplePrediction}] \"${utteranceSubtitles}\"`)

    // Display image and text. 
    this.setState({
      emotion: parseInt(samplePrediction),
      skitSubtitles: "Sample: \"" + sampleText + "\"",
      currentSample: sampleIndex
    });
    

    // Load the audio
    let audio = new Audio(sampleLocation + "/" + utteranceWavFilename);
    let currentAudio = this.state.currentAudio;
    if(currentAudio != null){
      currentAudio.pause();
      currentAudio = null;
    }
    await this.setState({
      currentAudio: audio,
      playingAudio: true
    });

    if(utteranceSubtitles == "..."){
      await new Promise(r => setTimeout(r, audioEllipseWait));
    }
    else{
      audio.play();
      // Wait 50 ms until the audio is done. 
      while(!audio.paused){
        await new Promise(r => setTimeout(r, audioEndedChecking));
      }
    }
    fetch(apiURL +"/listenSample");

    // An extra pause between utterances. 
    if(audioWaitBetweenUtterances > 0){
      await new Promise(r => setTimeout(r, audioWaitBetweenUtterances));
    }
    
    if(this.state.currentSample == sampleIndex)
      this.resetEmotion();
  }

  resetEmotion(){
    this.setState({
      emotion: defaultEmotion,
      skitSubtitles: defaultSubtitles,
      sampleIndex: -1,
    });
  }

  async toggleAbout() {
    var modifiedPage1Style = Object.assign({}, this.state.introductionPage1Style);
    var modifiedPage2Style = Object.assign({}, this.state.introductionPage2Style);

    if(this.state.showingPage1){
      modifiedPage2Style["display"] = "block";
      modifiedPage2Style["visibility"] = "visible";
      modifiedPage2Style["pointerEvents"] = "auto";
      modifiedPage1Style["display"] = "none";
      modifiedPage1Style["visibility"] = "hidden";
      modifiedPage1Style["pointerEvents"] = "none";

      await this.setState({
        introductionPage1Style : modifiedPage1Style,
        introductionPage2Style : modifiedPage2Style,
        showingPage1: false,
      });
      this.scrollToBottom();
    }
    else {
      modifiedPage1Style["display"] = "block";
      modifiedPage1Style["visibility"] = "visible";
      modifiedPage1Style["pointerEvents"] = "auto";
      modifiedPage2Style["display"] = "none";
      modifiedPage2Style["visibility"] = "hidden";
      modifiedPage2Style["pointerEvents"] = "none";

      await this.setState({
        introductionPage1Style : modifiedPage1Style,
        introductionPage2Style : modifiedPage2Style,
        showingPage1: true,
      });
      this.scrollToBottom();
    }
  }

  scrollToBottom = () => {
    this.endOfPage.scrollIntoView({ behavior: "auto" });
  }

  render() {
    return (
      <div>
        <div id = "mainBackground">
          <div id="mainBackgroundInner">
            <img id="mainBackgroundImg"/>
          </div>
        </div>

        <div id="content">
          <div id="contentInner">

            <div id="contentUpper">
              <h2 id = "title">
                Emotion Avatar
              </h2>
              <div id="speakerImageName"><b>{
                this.state.emotion == 10 || this.state.emotion == 11 ? "<Waiting>" 
                : "<" + solutionStringMap[this.state.emotion].replace(/(\w)(\w*)/g, function(g0,g1,g2){return g1.toUpperCase() + g2.toLowerCase();}).toString() + ">"}</b>
              </div>
            </div>


            <div id= "speakerImage">
              <div id="speakerImageInner">

                <div id="speakerContainer">
                  <img id = "speakerImageImg" src={require("../../../assets/avatar/"+emotionObjects[this.state.emotion].getGifByTimeOfDay()).default}/>
                </div>
                

              </div>
            </div>

            <div id="skitSelectionSection">
              <div id="skitSelectionSectionInner">
                <button id="skitSelectionButton" onClick={this.onPlaySample.bind(this)}>Play Random Sample</button>
              </div>
            </div>

            <div id = "skitSubtitles">
              <div id="skitSubtitlesInner">
                <div id = "skitSubtitlesText">{this.state.skitSubtitles}</div>
              </div>
            </div>

            <div style={{ float:"left", clear: "both" }}
              ref={(el) => { this.endOfPage = el; }}>
            </div>

            <div id="contentLower">

              <div id="introduction">
                <div id="introductionInner">

                  <div id="introductionPage1" style={this.state.introductionPage1Style}>
                    <h2 id="introductionHeader">
                      Textual Emotion Detection for AI Assistants
                    </h2>

                    <div id="overview">
                      <img id="overviewImage"/>
                    </div>

                    <br/>

                    <div>
                      Description
                    </div>
                  </div>

                  <div id="introductionPage2" style={this.state.introductionPage2Style}>
                    <br/>
                    <div>
                      Author: Arthurlot Li
                    </div>
                    <br/>
                    <div>
                      <i>Feel free to contact me:</i> <a href="mailto:ArthurlotLi@gmail.com">ArthurlotLi@gmail.com</a>
                    </div>

                    <br/>

                    <hr/>

                    <h2>Citations:</h2>
                    
                    <div>
                      <b>[1] LibriSpeech ASR Corpus</b> - <a target="_blank" href="https://www.openslr.org/12">https://www.openslr.org/12</a>
                      <div>Published Paper (2015): <a target="_blank" href="https://ieeexplore.ieee.org/document/7178964">https://ieeexplore.ieee.org/document/7178964</a></div>
                      <p>
                      <div>Panayotov, Vassil, et al. "Librispeech: an asr corpus based on public domain audio books."</div> 
                      <div>&emsp;2015 IEEE international conference on acoustics, speech and signal processing (ICASSP).</div>
                      <div>&emsp;IEEE, 2015.</div>
                      </p>
                    </div>

                    <br/>

                    <div>
                      <b>[2] Vox Celeb1 Dataset</b> - <a target="_blank" href="https://www.robots.ox.ac.uk/~vgg/data/voxceleb/">https://www.robots.ox.ac.uk/~vgg/data/voxceleb/</a>
                      <div>Published Paper (2020): <a target="_blank" href="https://www.sciencedirect.com/science/article/pii/S0885230819302712">https://www.sciencedirect.com/science/article/pii/S0885230819302712</a></div>
                      <div>Published Paper (2017): <a target="_blank" href="https://arxiv.org/abs/1706.08612">https://arxiv.org/abs/1706.08612</a></div>
                      <p>
                      <div>Nagrani, Arsha, et al. "Voxceleb: Large-scale speaker verification in the wild." Computer</div> 
                      <div>&emsp;Speech &#38; Language 60 (2020): 101027.</div>
                      </p>
                      <p>
                      <div>Nagrani, Arsha, Joon Son Chung, and Andrew Zisserman. "Voxceleb: a large-scale speaker</div> 
                      <div>&emsp;identification dataset." arXiv preprint arXiv:1706.08612 (2017).</div>
                      </p>
                    </div>
                  </div>

                  <br/>

                  <div id="about">
                    <button id="aboutButton" onClick={this.toggleAbout.bind(this)} >{this.state.showingPage1 ? "Citations" : "Main Page"}</button>
                  </div>

                  <br/>
                </div>
              </div>

              <br/>

              <br/>

            </div>

          </div>
        </div>


      </div>
    )
  };
}

ReactDOM.render(<App />, document.getElementById('app'));