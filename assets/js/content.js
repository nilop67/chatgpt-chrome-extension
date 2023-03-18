$(document).ready(function () {
  var resultView;
  var isRecording = false;
  var isSearching = false;
  var oSpeechRecognizer = null;

  var $searchInput, $pre, $chatView, $contentView, $recordIcon, $searchIcon;

  function registerEvents() {

    window.addEventListener("keydown", (event) => {
      if (event.key == "Escape") {
        disappearExtensionUI();
      }
    }, false);

    $searchInput = $(".copperfield-search-input");
    $pre = $("pre.copperfield-result-content");
    $chatView = $(".copperfield-chat-view");
    $contentView = $(".copperfield-content-view");
    $recordIcon = $(".copperfield-record-icon");
    $searchIcon = $(".copperfield-search-icon");

    if (window.getSelection().toString()) {
      $searchInput.val(window.getSelection().toString());
      $pre.html("");
    }

    $(".copperfield-container-close").click(() => {
      disappearExtensionUI();
    });

    // handle rows of textarea
    $searchInput.on("input", () => {
      const lineCount = $searchInput.val().split(/\n/).length;
      $searchInput.prop("rows", Math.min(lineCount, 10));
    });

    $searchInput.keypress((e) => {
      let userInputStr = $searchInput.val();

      if (e.which === 13 && !e.shiftKey) {
        e.preventDefault();

        if (userInputStr) {
          displayLoading();

          if ($(resultView).css('display') == 'none') {
            $(resultView).css('display', 'flex');
          }

          $searchInput.attr("disabled", true);
          sendRequestAndReceiveResponse(userInputStr);
        }
      }
    });

    $searchIcon.click(() => {
      let userInputStr = $searchInput.val();

      if (userInputStr) {
        displayLoading();

        if ($(resultView).css('display') == 'none') {
          $(resultView).css('display', 'flex');
        }

        $searchInput.attr("disabled", true);
        sendRequestAndReceiveResponse(userInputStr);
      }
    });

    $recordIcon.click(() => {
      speechToText(!isRecording);
    });

    $(".regenerate-button").click(() => {
      $searchIcon.click();
    });

    $(".clip-copy-button").click(() => {
      copyToClipboard();
    });
  }

  function popupMainModal() {
    var oldBandDiv = document.querySelector("#copperfield");
    if (oldBandDiv) {
      $(oldBandDiv).fadeIn(200);
    }
    else {
      var bandDiv = document.createElement("div");
      bandDiv.setAttribute("id", "copperfield");

      let mainModalHTML = `
        <div class="copperfield-container">
          <div class="copperfield-close-botton-view">
            <div class="copperfield-container-close" aria-label="Close">
              <img src="${chrome.runtime.getURL('assets/img/ic_lose.png')}"></img>
            </div>
          </div>

          <div class="copperfield-main-view">
            <div class="copperfield-search-view">
              <img class="copperfield-search-icon" src="${chrome.runtime.getURL('assets/img/ic_search 3.png')}"></img>
              <textarea autofocus rows="1" class="copperfield-search-input" placeholder="What can I help you with today?"></textarea>
              <img class="copperfield-record-icon" width="24" height="24" src="${chrome.runtime.getURL('assets/img/mic/mic@3x.png')}"></img>
            </div>

            <div class="copperfield-search-result-view">
              <div class="copperfield-content-view">
                <div class="copperfield-chat-view">
                  <img src="${chrome.runtime.getURL('assets/img/logo/logo-48.png')}" width="36" height="36">
                  <pre class="copperfield-result-content">
                  </pre>
                </div>

                <button class="copperfield-button regenerate-button">
                  <img class="copperfield-toggle-button-image" src="${chrome.runtime.getURL('assets/img/refresh.png')}">
                  Regenerate response
                </button>
              </div>

              <div class="copperfield-button-view">
                <div class="copperfield-training-button-view">
                  <button class="copperfield-button copperfield-disabled-button">
                    <img class="copperfield-toggle-button-image" src="${chrome.runtime.getURL('assets/img/toggle_off.png')}">
                    Save as Training Set
                  </button>
                </div>

                <div class="copperfield-insert-button-view">
                  <button class="copperfield-button clip-copy-button">
                    Copy to Clipboard
                  </button>
                  <button class="copperfield-button exit-button">
                    <img class="copperfield-toggle-button-image" src="${chrome.runtime.getURL('assets/img/toggle.png')}">
                    Insert
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>`;

      bandDiv.innerHTML = mainModalHTML;

      document.body.append(bandDiv);

      resultView = document.querySelector('.copperfield-search-result-view');
      $(resultView).fadeOut(0);
      $(bandDiv).fadeIn(0);
    }

    registerEvents();
  }

  function disappearExtensionUI() {
    const e = document.querySelector('#copperfield');
    $(e).fadeOut(200);
  }

  function sendRequestAndReceiveResponse(searchStr) {
    if (isSearching) return;
    isSearching = true;
    chrome.storage.local.get('copperfield-openai-key', function (savedOpenAIKey) {
      var postData = {
        "model": "gpt-3.5-turbo",
        "messages": [{ role: "user", content: searchStr }],
        "temperature": 0.1,
        "max_tokens": 1024,
        "stream": true
      };

      if (savedOpenAIKey['copperfield-openai-key']) {
        $pre.html("");
        fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Accept': 'application/json, text/plain, */*',
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + savedOpenAIKey['copperfield-openai-key']
          },
          body: JSON.stringify(postData)
        }
        ).then((response) => response.body)
          .then((body) => {

            const reader = body.getReader();
            displayResult();

            let tokenCount = 0;

            return pump();

            function pump() {
              return reader.read().then(({ done, value }) => {
                if (done) { 
                  isSearching = false;
                  return; 
                }

                var streamStr = new TextDecoder().decode(value);

                var convertStream = streamStr.replace(/data: /g, ",").replace(',', "").replace(/\n/g, '');

                if (convertStream.includes(',[DONE]')) {
                  convertStream = convertStream.replace(',[DONE]', "");
                  $searchInput.removeAttr("disabled");
                }

                var streams = JSON.parse("[" + convertStream + "]");

                streams.map((stream) => {
                  if (stream.choices[0].delta.hasOwnProperty('content')) {
                    if (stream.choices[0].delta.content != '\n\n') {
                      $pre.html($pre.html() + stream.choices[0].delta.content).promise().done(function () {
                        $contentView.scrollTop($contentView.prop("scrollHeight"));
                      });
                    }
                    tokenCount++;
                  }
                });

                return pump();
              });
            }
          });
      }
    });
  }

  function displayLoading() {

    var svgURL = chrome.runtime.getURL('assets/img/search-in-progress.gif');

    $(".copperfield-search-icon").attr("src", svgURL);
    $(".copperfield-search-view").css("background-color", "#CFCED8");
    $searchInput.css("background-color", "#CFCED8");
    $searchInput.css("color", "#4F4F53");
    $(".copperfield-content-view").hide();
    $(".copperfield-button-view").hide();
  }

  function displayResult() {

    var pngURL = chrome.runtime.getURL('assets/img/ic_search 3.png');

    $(".copperfield-search-icon").attr("src", pngURL);
    $(".copperfield-search-view").css("background-color", "white");
    $searchInput.css("background-color", "white");
    $searchInput.css("color", "black");
    $(".copperfield-content-view").show();
    $(".copperfield-button-view").show();
  }

  function copyToClipboard() {
    navigator.clipboard.writeText($pre.html());
  }

  function speechToText(bRecord) {
    isRecording = bRecord;
    if (oSpeechRecognizer) {

      if (bRecord) {
        $searchInput.val("");
        $recordIcon.attr("src", chrome.runtime.getURL('assets/img/mic/mic-recording-on.gif'));
        $searchInput.attr("disabled", true);
        oSpeechRecognizer.start();
      } else {
        $searchInput.attr("disabled", false);
        $recordIcon.attr("src", chrome.runtime.getURL('assets/img/mic/mic@3x.png'));
        oSpeechRecognizer.stop();
      }

      return;
    }

    oSpeechRecognizer = new webkitSpeechRecognition();
    oSpeechRecognizer.continuous = true;
    oSpeechRecognizer.interimResults = true;
    oSpeechRecognizer.lang = "en-US";
    oSpeechRecognizer.start();
    $recordIcon.attr("src", chrome.runtime.getURL('assets/img/mic/mic-recording-on.gif'));
    $searchInput.attr("disabled", true);

    oSpeechRecognizer.onresult = function (event) {
      var interimTranscripts = "";
      for (var i = event.resultIndex; i < event.results.length; i++) {
        var transcript = event.results[i][0].transcript;

        if (event.results[i].isFinal) {
          $searchIcon.click();
        } else {
          transcript.replace("\n", "<br>");
          interimTranscripts += transcript;
          $searchInput.val(interimTranscripts);
        }
      }
    };

    oSpeechRecognizer.onerror = function (_event) {
      $recordIcon.attr("src", chrome.runtime.getURL('assets/img/mic/mic@3x.png'));
      $searchInput.attr("disabled", false);
      alert("Audio device not found.");
    };
  }

  popupMainModal();
});
