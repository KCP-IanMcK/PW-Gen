const masterInput = document.getElementById("master");
const websiteInput = document.getElementById("url");
const submitBtn = document.getElementById("btn1");
const toggleBtn = document.getElementById("btn2");

const specialChars = ['?', '!', '*', '+', '&', '=', '/', '@', '#', '$', '<', '>', '(', ')', '-', '_', '.', '%'];

masterInput.addEventListener("submit", handleEvent);
websiteInput.addEventListener("submit", handleEvent);
submitBtn.addEventListener("click", handleEvent);

toggleBtn.addEventListener("click", function(event) {
    event.preventDefault();
    const hashField = document.getElementById("password");
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
                showBanner("Copied to Clipboard");
                })
                .catch(err => {
                    console.error("Error when copying to clipboard:", err);
                });
}

async function runGeneration(event) {
    const masterPW = getMasterPW();
    const websiteURL = getWebsiteURL();

    if (!masterPW || !websiteURL) return;

    const hashText = await getPasswordHash(masterPW + websiteURL);

    const outputField = document.getElementById("password");
    outputField.value = hashText;

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
    const specialCharPos = hashArray[0] % 24;
    let lowerCaseCharPos = hashArray[1] % 24;
    let upperCaseCharPos = hashArray[2] % 24;
    let numberCharPos = hashArray[3] % 16;
    const specialChar = specialChars[hashArray[15] % 18];

    let hashText = btoa(String.fromCharCode(...hashArray));
    hashText = hashText.slice(0, 24);

    while (!/[+=\/!?*&@#$<>()_.%-]/.test(hashText) || !/[a-z]/.test(hashText) || !/[A-Z]/.test(hashText) || !/[0-9]/.test(hashText)) {
        if (!/[+=\/!]/.test(hashText)) {
            hashText = replaceAt(hashText, specialCharPos , specialChar);
        }

        if (!/[a-z]/.test(hashText)) {
            if(lowerCaseCharPos === specialCharPos) {
                lowerCaseCharPos = lowerCaseCharPos === 23 ? 0 : lowerCaseCharPos + 1;
            }
            hashText = replaceAt(hashText, lowerCaseCharPos , "a");
        }

        if (!/[A-Z]/.test(hashText)) {
            if(upperCaseCharPos === lowerCaseCharPos || upperCaseCharPos === specialCharPos) {
                upperCaseCharPos = upperCaseCharPos === 23 ? 0 : upperCaseCharPos + 1;
            }
            hashText = replaceAt(hashText, upperCaseCharPos , "A");
        }

        if (!/[0-9]/.test(hashText)) {
             if(numberCharPos === lowerCaseCharPos || numberCharPos === specialCharPos || numberCharPos === upperCaseCharPos) {
                numberCharPos = numberCharPos === 23 ? 0 : numberCharPos + 1;
             }
             hashText = replaceAt(hashText, numberCharPos , "1");
        }
    }
    return hashText;
}

function showBanner(message, duration = 2000) {
  const banner = document.getElementById("banner");
  banner.textContent = message;
  banner.classList.remove("hidden");

  setTimeout(() => {
    banner.classList.add("hidden");
  }, duration);
}

function replaceAt(str, index, replacement) {
  return str.substring(0, index) + replacement + str.substring(index + 1);
}