document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM fully loaded and parsed"); // <--- ADD THIS

    const form = document.getElementById('wifiForm');
    const resultDiv = document.getElementById('result');
    // ... (other const declarations) ...

    if (!form) {
        console.error("ERROR: wifiForm not found!"); // <--- ADD THIS
        return;
    }
    console.log("wifiForm found:", form); // <--- ADD THIS

    form.addEventListener('submit', (e) => {
        console.log("Submit button clicked"); // <--- ADD THIS
        e.preventDefault(); // Prevent default form submission
        console.log("Default form submission prevented"); // <--- ADD THIS

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('wifiForm');
    const resultDiv = document.getElementById('result');
    const qrDiv = document.getElementById('qrcode');
    const resultSSIDSpan = document.getElementById('resultSSID');
    const resultPassSpan = document.getElementById('resultPass');
    const feedbackSection = document.getElementById('feedback-section');

    let qrCodeInstance = null; // To hold the QRCode object

    form.addEventListener('submit', (e) => {
        e.preventDefault(); // Prevent default form submission

        // Get form values
        const ssid = document.getElementById('ssid').value.trim();
        const password = document.getElementById('password').value; // Don't trim password
        const encryption = document.getElementById('encryption').value;

        // Basic validation
        if (!ssid) {
            alert('Please enter the Network Name (SSID).');
            return;
        }

        // --- Generate QR Code ---

        // Clear previous QR code if it exists
        qrDiv.innerHTML = '';
        qrCodeInstance = null;

        // Format the WiFi string based on encryption type
        // Escaping special characters: \, ;, ,, :, "
        const escape = (str) => str.replace(/([\\;,":])/g, '\\$1');
        let wifiString;

        if (encryption === 'nopass') {
            // Network has no password
             if (!password) { // Only generate if password field is truly empty
                wifiString = `WIFI:T:nopass;S:${escape(ssid)};H:false;`; // H:false indicates not hidden, adjust if needed
             } else {
                 alert('Encryption is "No Password", but you entered a password. Please clear the password field or choose WPA/WEP.');
                 return;
             }
        } else if (encryption === 'WEP') {
             // WEP encryption
             if (!password) {
                 alert('WEP encryption requires a password.');
                 return;
             }
             wifiString = `WIFI:T:WEP;S:${escape(ssid)};P:${escape(password)};H:false;`;
        } else { // WPA/WPA2 is the default
            if (!password) {
                alert('WPA/WPA2 encryption requires a password.');
                return;
            }
            wifiString = `WIFI:T:WPA;S:${escape(ssid)};P:${escape(password)};H:false;`;
        }

        // Generate the QR code using the library
        try {
            qrCodeInstance = new QRCode(qrDiv, {
                text: wifiString,
                width: 200, // Adjust size as needed
                height: 200,
                colorDark: "#000000",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.H // High correction level
            });
        } catch (error) {
             console.error("QR Code generation failed:", error);
             alert("Failed to generate QR Code. Check console for details.");
             return; // Stop if QR code fails
        }


        // --- Display Results ---

        // Update the displayed credentials
        resultSSIDSpan.textContent = ssid;
        resultPassSpan.textContent = (encryption === 'nopass' || !password) ? 'None' : password; // Show 'None' or the actual password

        // Show the result section and feedback
        resultDiv.classList.remove('hidden');
        feedbackSection.classList.remove('hidden');

        // Scroll to the result smoothly
        resultDiv.scrollIntoView({ behavior: 'smooth' });
    });

    // Function to reset the form and hide results (linked in HTML)
    window.resetForm = () => {
        form.reset(); // Resets form fields to default
        resultDiv.classList.add('hidden'); // Hide results
        feedbackSection.classList.add('hidden'); // Hide feedback
        qrDiv.innerHTML = ''; // Clear the QR code display
        qrCodeInstance = null; // Clear the instance
        window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll back to top
    };

});