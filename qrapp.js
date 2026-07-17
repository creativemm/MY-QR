const themeToggle = document.getElementById("theme-toggle");
const generateBtn = document.getElementById("generate-btn");
const qrContainer = document.getElementById("qrcode");
const downloadBtn = document.getElementById("download-btn");
const qrColorInput = document.getElementById("qr-color");
const qrLogo = document.getElementById("qr-logo");

const qrType = document.getElementById("qr-type");
const inputTextGroup = document.getElementById("input-text-group");
const inputVcardGroup = document.getElementById("input-vcard-group");
const inputWifiGroup = document.getElementById("input-wifi-group");
const qrInput = document.getElementById("qr-input");
const clearBtn = document.getElementById("clear-btn");

const qrFrameStyle = document.getElementById("qr-frame-style");
const qrOuterFrame = document.getElementById("qr-outer-frame");

const tabGenerate = document.getElementById("tab-generate");
const tabScan = document.getElementById("tab-scan");
const generateSection = document.getElementById("generate-section");
const scanSection = document.getElementById("scan-section");
const scanResultBox = document.getElementById("scan-result-box");
const scanResultLink = document.getElementById("scan-result-link");
const copyBtn = document.getElementById("copy-btn");
const switchCameraBtn = document.getElementById("switch-camera-btn");

// --- Camera အတွက် ပြင်ဆင်ချက် ---
let html5QrCode;
let currentFacingMode = "environment"; // အနောက်ကင်မရာ (Rear Camera) ကို ပုံသေထားမည်

themeToggle.addEventListener("change", () => {
    if (themeToggle.checked) document.body.classList.add("dark-mode");
    else document.body.classList.remove("dark-mode");
});

qrType.addEventListener("change", () => {
    inputTextGroup.style.display = "none";
    inputVcardGroup.style.display = "none";
    inputWifiGroup.style.display = "none";
    if (qrType.value === "text") inputTextGroup.style.display = "block";
    else if (qrType.value === "vcard") inputVcardGroup.style.display = "block";
    else if (qrType.value === "wifi") inputWifiGroup.style.display = "block";
});

generateBtn.addEventListener("click", () => {
    try {
        let finalData = "";
        let logoUrl = null;
        let selectedColor = qrColorInput ? qrColorInput.value : "#000000"; 
        let qrLevel = QRCode.CorrectLevel.H;

        if (qrType.value === "text") {
            finalData = qrInput.value.trim();
            if (finalData === "") { alert("Enter text or URL!"); return; }
            try {
                let urlString = finalData;
                if (!urlString.startsWith('http://') && !urlString.startsWith('https://')) {
                    if (urlString.includes('.')) urlString = 'https://' + urlString;
                }
                let parsedUrl = new URL(urlString);
                logoUrl = `https://www.google.com/s2/favicons?domain=${parsedUrl.hostname}&sz=128`;
            } catch (error) { logoUrl = null; }
        } 
        else if (qrType.value === "vcard") {
            let name = document.getElementById("vcard-name").value.trim();
            let phone = document.getElementById("vcard-phone").value.trim();
            let email = document.getElementById("vcard-email").value.trim();
            let company = document.getElementById("vcard-company").value.trim();
            
            if (name === "" || phone === "") { alert("Enter name and phone number!"); return; }
            finalData = `BEGIN:VCARD\nVERSION:3.0\nFN:${name}\nORG:${company}\nTEL:${phone}\nEMAIL:${email}\nEND:VCARD`;
            logoUrl = null; 
            qrLevel = QRCode.CorrectLevel.M;
        } 
        else if (qrType.value === "wifi") {
            let ssid = document.getElementById("wifi-ssid").value.trim();
            let pass = document.getElementById("wifi-pass").value.trim();
            let type = document.getElementById("wifi-type").value;
            
            if (ssid === "") { alert("Enter WiFi name!"); return; }
            finalData = `WIFI:S:${ssid};T:${type};P:${pass};;`;
            logoUrl = null;
            qrLevel = QRCode.CorrectLevel.M;
        }

        qrContainer.innerHTML = "";
        if (downloadBtn) downloadBtn.style.display = "none";

        if (logoUrl) {
            qrLogo.src = logoUrl;
            qrLogo.onerror = () => { qrLogo.style.display = "none"; };
            qrLogo.style.display = "block"; 
        } else {
            qrLogo.style.display = "none"; 
        }

        if (qrFrameStyle.value === "scan-me") {
            qrOuterFrame.className = "frame-scan-me";
            qrOuterFrame.style.backgroundColor = selectedColor; 
        } else {
            qrOuterFrame.className = "frame-none";
            qrOuterFrame.style.backgroundColor = "transparent";
        }

        new QRCode(qrContainer, {
            text: finalData,
            width: 200, height: 200,
            colorDark : selectedColor, colorLight : "#ffffff",
            correctLevel : qrLevel
        });

        setTimeout(() => { if (downloadBtn) downloadBtn.style.display = "block"; }, 300);
    } catch (error) {
        console.error(error);
        alert("An error occurred!");
    }
});

// --- Tab များနှိပ်လျှင် Camera အဖွင့်/အပိတ် ပြုလုပ်ခြင်း ---
tabGenerate.addEventListener("click", () => {
    tabGenerate.classList.add("active"); tabScan.classList.remove("active");
    generateSection.style.display = "block"; scanSection.style.display = "none";
    stopScanner(); // Generate Tab ကိုသွားလျှင် ကင်မရာပိတ်မည်
});

tabScan.addEventListener("click", () => {
    tabScan.classList.add("active"); tabGenerate.classList.remove("active");
    generateSection.style.display = "none"; scanSection.style.display = "block";
    startScanner(); // Scan Tab ကိုသွားလျှင် ကင်မရာဖွင့်မည်
});

// --- Camera ကို ထိန်းချုပ်မည့် Functions များ ---
function startScanner() {
    if (!html5QrCode) {
        html5QrCode = new Html5Qrcode("reader");
    }
    html5QrCode.start(
        { facingMode: currentFacingMode },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        onScanSuccess,
        onScanFailure
    ).catch(err => {
        console.error("Camera Error: ", err);
        // အနောက်ကင်မရာ မရှိပါက အရှေ့ကင်မရာကို အလိုလို ပြောင်းပေးရန်
        if (currentFacingMode === "environment") {
            currentFacingMode = "user";
            startScanner();
        }
    });
}

function stopScanner() {
    if (html5QrCode) {
        html5QrCode.stop().then(() => {
            html5QrCode.clear();
        }).catch(err => {
            console.error("Failed to stop camera.", err);
        });
    }
}

// ကင်မရာ ပြောင်းရန် ခလုတ်နှိပ်လျှင် (Switch Camera)
switchCameraBtn.addEventListener("click", () => {
    if (html5QrCode) {
        html5QrCode.stop().then(() => {
            // လက်ရှိက environment ဆို user ပြောင်း၊ user ဆို environment ပြောင်းမည်
            currentFacingMode = currentFacingMode === "environment" ? "user" : "environment";
            startScanner();
        }).catch(err => {
            console.error("Error stopping camera before switch.", err);
        });
    }
});

function onScanSuccess(decodedText) {
    scanResultBox.style.display = "block"; 
    if (decodedText.startsWith("http://") || decodedText.startsWith("https://")) {
        scanResultLink.href = decodedText; scanResultLink.textContent = decodedText;
    } else {
        scanResultLink.removeAttribute("href"); scanResultLink.textContent = decodedText;
    }
}
function onScanFailure(error) {}

copyBtn.addEventListener("click", () => {
    navigator.clipboard.writeText(scanResultLink.textContent).then(() => { alert("Copied!"); });
});

clearBtn.addEventListener("click", () => {
    qrInput.value = ""; qrContainer.innerHTML = ""; 
    downloadBtn.style.display = "none"; qrColorInput.value = "#000000"; qrLogo.style.display = "none";
    qrOuterFrame.className = "frame-none"; qrOuterFrame.style.backgroundColor = "transparent";
});

downloadBtn.addEventListener("click", () => {
    let qrImage = qrContainer.querySelector("img"); let qrCanvas = qrContainer.querySelector("canvas");
    let downloadLink = document.createElement("a"); downloadLink.download = "My_QRCode.png"; 
    
    if (qrImage && qrImage.src) downloadLink.href = qrImage.src;
    else if (qrCanvas) downloadLink.href = qrCanvas.toDataURL("image/png");
    downloadLink.click();
});

// Canvas Background
const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d');
let width = canvas.width = window.innerWidth;
let height = canvas.height = window.innerHeight;
window.addEventListener('resize', () => { width = canvas.width = window.innerWidth; height = canvas.height = window.innerHeight; });

const particlesArray = [];
for (let i = 0; i < 70; i++) {
    particlesArray.push({
        x: Math.random() * width, y: Math.random() * height,
        size: Math.random() * 3 + 1,
        speedX: Math.random() * 1 - 0.5, speedY: Math.random() * 1 - 0.5,
        angle: Math.random() * 360, spin: (Math.random() < 0.5 ? -1 : 1) * (Math.random() * 0.05 + 0.01)
    });
}
function animateCanvas() {
    ctx.clearRect(0, 0, width, height);
    particlesArray.forEach(p => {
        p.angle += p.spin; p.x += p.speedX + Math.sin(p.angle) * 0.5; p.y += p.speedY + Math.cos(p.angle) * 0.5;
        if (p.x < 0) p.x = width; if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height; if (p.y > height) p.y = 0;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 150, 0.8)'; ctx.shadowBlur = 12; ctx.shadowColor = 'rgba(255, 255, 100, 1)';
        ctx.fill();
    });
    requestAnimationFrame(animateCanvas);
}
animateCanvas();
