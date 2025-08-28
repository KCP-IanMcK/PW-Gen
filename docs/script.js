const masterInput = document.getElementById("master");
const websiteInput = document.getElementById("url");
const submitBtn = document.getElementById("btn1");
const toggleBtn = document.getElementById("btn2");
const hashField = document.getElementById("password");

const passwordLength = 24;

const specialChars = ['?', '!', '*', '+', '&', '=', '/', '@', '#', '$', '<', '>', '(', ')', '-', '_', '.', '%'];

masterInput.addEventListener("submit", handleEvent);
websiteInput.addEventListener("submit", handleEvent);
submitBtn.addEventListener("click", handleEvent);

toggleBtn.addEventListener("click", function(event) {
    event.preventDefault();
    if (hashField.type === "password") {
        toggleBtn.innerText = "Hide";
        hashField.type = "text";
    } else {
        toggleBtn.innerText = "Show";
        hashField.type = "password";
    }
});


async function handleEvent(event) {
    if (!event || event.key && event.key !== "Enter") return;
    event.preventDefault();

    const hashText = await runGeneration();
    navigator.clipboard.writeText(hashText)
                .then(() => {
                    showBanner("Copied to Clipboard", false);
                })
                .catch(err => {
                    showBanner("Copy to Clipboard failed", true);
                    console.error("Error when copying to clipboard:", err);
                });
}

async function runGeneration(event) {
    const masterPW = getMasterPW();
    const websiteURL = getWebsiteURL();

    if (!masterPW || !websiteURL) return;

    const hashText = await getPasswordHash(masterPW + websiteURL);

    hashField.value = hashText;

    return hashText;
}


function getMasterPW() {
    return masterInput.value;
}

function getWebsiteURL() {
    let value = websiteInput.value;

    try {
        const urlObj = new URL(value);
        let hostUrl = urlObj.hostname;
        hostUrl = hostUrl.replace("www.", "");
        hostUrl = hostUrl.replace("https://.", "");
        hostUrl = hostUrl.replace("http://.", "");
        hostUrl = hostUrl.toLowerCase();
       return hostUrl;
    } catch (error) {
        value = value.toLowerCase();
        return value;
    }
}

async function getPasswordHash(pwUrlCombination) {
    const encoder = new TextEncoder();
    const data = encoder.encode(pwUrlCombination);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const specialCharPos = hashArray[0] % passwordLength;
    let lowerCaseCharPos = hashArray[1] % passwordLength;
    let upperCaseCharPos = hashArray[2] % passwordLength;
    let numberCharPos = hashArray[3] % passwordLength;
    const specialChar = specialChars[hashArray[15] % specialChars.length];

    let hashText = btoa(String.fromCharCode(...hashArray));
    hashText = hashText.slice(0, passwordLength);

    while (!/[+=\/!?*&@#$<>()_.%-]/.test(hashText) || !/[a-z]/.test(hashText) || !/[A-Z]/.test(hashText) || !/[0-9]/.test(hashText)) {
        if (!/[+=\/!?*&@#$<>()_.%-]/.test(hashText)) {
            hashText = replaceAt(hashText, specialCharPos , specialChar);
        }

        if (!/[a-z]/.test(hashText)) {
            if(lowerCaseCharPos === specialCharPos) {
                lowerCaseCharPos = lowerCaseCharPos === passwordLength -1 ? 0 : lowerCaseCharPos + 1;
            }
            hashText = replaceAt(hashText, lowerCaseCharPos , "a");
        }

        if (!/[A-Z]/.test(hashText)) {
            if(upperCaseCharPos === lowerCaseCharPos || upperCaseCharPos === specialCharPos) {
                upperCaseCharPos = upperCaseCharPos === passwordLength -1 ? 0 : upperCaseCharPos + 1;
            }
            hashText = replaceAt(hashText, upperCaseCharPos , "A");
        }

        if (!/[0-9]/.test(hashText)) {
             if(numberCharPos === lowerCaseCharPos || numberCharPos === specialCharPos || numberCharPos === upperCaseCharPos) {
                numberCharPos = numberCharPos === passwordLength -1 ? 0 : numberCharPos + 1;
             }
             hashText = replaceAt(hashText, numberCharPos , "1");
        }
    }
    return hashText;
}

function showBanner(message, isException, duration = 2000) {
  const banner = document.getElementById("banner");
  banner.textContent = message;
  banner.classList.remove("hidden");

  if (isException) {
    banner.classList.add("exception");
  }

  setTimeout(() => {
    banner.classList.add("hidden");
    banner.classList.remove("exception");
  }, duration);
}

function replaceAt(str, index, replacement) {
  return str.substring(0, index) + replacement + str.substring(index + 1);
}