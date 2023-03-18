var openaiKeyInput = $(".copperfield-key");
var saveKeyButton = $(".copperfield-save-key-button");

chrome.storage.local.get('copperfield-openai-key', function (oldOpenAIKey) {
    if (oldOpenAIKey['copperfield-openai-key']) {
        openaiKeyInput.val(oldOpenAIKey['copperfield-openai-key']);
        openaiKeyInput.attr("disabled", true);
        saveKeyButton.html("Update Key");
    }
});

openaiKeyInput.blur(() => {
    if (openaiKeyInput.val() == "") {
        displayKeyErrorMsg("Please enter your api key");
    }
});

$(".copperfield-save-key-button").click(() => {
    if (saveKeyButton.html() == "Save Key") {
        if (openaiKeyInput.val() == "") {
            displayKeyErrorMsg("Please enter your api key");
        }
        else {
            if (openAIKeyValidator(openaiKeyInput.val())) {
                $(".copperfield-key-error-text").html("");

                chrome.storage.local.set({
                    'copperfield-openai-key': openaiKeyInput.val()
                }, function () {
                    openaiKeyInput.attr("disabled", true);
                    saveKeyButton.html("Update Key");

                    chrome.action.setPopup({ popup: "" });
                });
            }
            else {
                displayKeyErrorMsg("Please double check that you entered the correct API key");
            }
        }
    }
    else {
        openaiKeyInput.attr("disabled", false);
        saveKeyButton.html("Save Key");
    }
});

function openAIKeyValidator(openaiKey) {
    return openaiKey.match(/^sk-[a-zA-Z0-9]{48}$/);
}

function displayKeyErrorMsg(errorMsg) {
    $(".copperfield-key-error-msg").css("display", "block");
    $(".copperfield-key-error-text").html(errorMsg);
}