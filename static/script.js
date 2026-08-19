function showTab(tabId) {
    document.querySelectorAll(".tab-content").forEach(el => {
        el.classList.remove("active");
    });

    document.querySelectorAll(".tab-btn").forEach(el => {
        el.classList.remove("active");
    });

    document.getElementById(tabId).classList.add("active");
    event.target.classList.add("active");
}


async function generateImage() {
    const prompt = document.getElementById("promptInput").value;
    const statusEl = document.getElementById("imageStatus");
    const imgEl = document.getElementById("resultImage");

    if (!prompt.trim()) {
        statusEl.innerText = "Pehle prompt likho.";
        return;
    }

    statusEl.innerText = "Image ban rahi hai, thora wait karo...";
    imgEl.style.display = "none";

    try {
        const response = await fetch("/api/generate-image", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                prompt: prompt
            })
        });

        const data = await response.json();

        if (data.error) {
            statusEl.innerText =
                "Error: " + data.error + " | " + (data.details || "");

            console.error("IMAGE GENERATION BACKEND ERROR:", data);
            return;
        }

        imgEl.src = data.image;
        imgEl.style.display = "block";
        statusEl.innerText = "Image ban gayi!";

    } catch (err) {
        statusEl.innerText =
            "Kuch ghalat hua: " + err.message;

        console.error("IMAGE GENERATION ERROR:", err);
    }
}


async function describeImage() {
    const fileInput = document.getElementById("imageInput");
    const statusEl = document.getElementById("descStatus");
    const resultEl = document.getElementById("resultDescription");

    if (!fileInput.files.length) {
        statusEl.innerText = "Pehle image select karo.";
        return;
    }

    const formData = new FormData();

    formData.append(
        "image",
        fileInput.files[0]
    );

    statusEl.innerText =
        "Description nikaali ja rahi hai...";

    resultEl.innerText = "";

    try {
        const response = await fetch("/api/describe-image", {
            method: "POST",
            body: formData
        });

        const data = await response.json();

        alert(JSON.stringify(data, null, 2));

        console.log("DESCRIBE IMAGE RESPONSE:", data);

        if (data.error) {
            statusEl.innerText =
                "Error: " +
                data.error +
                " | " +
                (data.details || "No additional details");

            console.error(
                "BACKEND ERROR:",
                data
            );

            return;
        }

        resultEl.innerText =
            data.description;

        statusEl.innerText =
            "Ho gaya!";

    } catch (err) {
        statusEl.innerText =
            "Kuch ghalat hua: " +
            err.message;

        console.error(
            "IMAGE DESCRIPTION ERROR:",
            err
        );
    }
}