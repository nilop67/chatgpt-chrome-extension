var saveButton = document.querySelector('.copperfield-setting-save-button');
var openaiInput = document.querySelector('.copperfield-openai-input');
var openaiError = document.querySelector('.copperfield-openai-input-error');

chrome.storage.local.get('copperfield-openai-key', function (oldOpenAIKey) {
    if(oldOpenAIKey['copperfield-openai-key']) {
        openaiInput.value = oldOpenAIKey['copperfield-openai-key'];
        openaiInput.disabled = true;
        saveButton.innerHTML = "Update Key";
    }
});

function openAIKeyValidator (openaiKey) {
    if(openaiKey.match(/^sk-[a-zA-Z0-9]{48}$/))
    {
        return true;
    }

    return false;
}

saveButton.addEventListener("click", function () {
    if(openaiInput.disabled) {
        openaiInput.disabled = false;
        saveButton.innerHTML = "Save Key";
    }
    else {
        if(openaiInput.value) {
            if(openAIKeyValidator(openaiInput.value))
            {
                openaiError.innerHTML = "";
                chrome.storage.local.set({
                    'copperfield-openai-key': openaiInput.value
                }, function () {
                    openaiInput.disabled = true;
                    saveButton.innerHTML = "Update Key";
                });
            }
            else
            {
                openaiError.innerHTML = 'Please double check that you entered the correct API key';
            }
        }
        else
        {
            openaiError.innerHTML = 'Please enter your OpenAI key';
        }
    }
});