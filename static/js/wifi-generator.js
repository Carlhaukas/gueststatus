// wifi-generator.js
// Version using the Cloning Method for PDF generation
// WITH Cloudflare Function counter integration AND enhanced error logging

document.addEventListener('DOMContentLoaded', () => {
    console.log("WiFi Generator Script Loaded");

    // --- Get references to HTML elements ---
    const wifiForm = document.getElementById('wifiForm');
    const resultDiv = document.getElementById('result');
    const qrCodeDiv = document.getElementById('qrcode'); // Ensure this element exists!
    const resultSSIDSpan = document.getElementById('resultSSID');
    const resultPassSpan = document.getElementById('resultPass');
    const feedbackSection = document.getElementById('feedback-section');
    const printButton = document.querySelector('.print-btn');
    const downloadButton = document.querySelector('.download-btn');
    // Note: We get printableCardElement later inside the click listener for cloning

    let currentQRCode = null; // To store the qrcode.js instance

    // --- Essential Element Checks ---
    if (!wifiForm) {
        console.error('Critical Error: WiFi Form (#wifiForm) not found!');
        return; // Stop script execution if critical elements are missing
    }
    if (!resultDiv) {
         console.error('Critical Error: Result area (#result) not found!');
         return;
    }
    // CRITICAL CHECK: Ensure the QR code container exists on load
    if (!qrCodeDiv) {
         console.error('Critical Error: QR Code container (#qrcode) not found! Cannot generate QR codes.');
         return; // Stop if the QR code div is missing
    }
    if (!resultSSIDSpan || !resultPassSpan) {
         console.error('Critical Error: Result display spans (#resultSSID or #resultPass) not found!');
         return;
    }
    // Check for #printable-card existence early for warnings, but get it fresh later
    if (!document.getElementById('printable-card')) {
         console.error('Error: Printable card element (#printable-card) not initially found. PDF/Print might fail.');
         // Don't return here, maybe only QR generation is needed
    }
    if (!printButton) console.warn('Print button (.print-btn) not found. Print functionality disabled.');
    if (!downloadButton) console.warn('Download button (.download-btn) not found. PDF download functionality disabled.');
    if (!feedbackSection) console.warn('Feedback section (#feedback-section) not found.');


    // --- Form Submission Handler ---
    wifiForm.addEventListener('submit', (event) => {
        event.preventDefault();
        console.log('Form submitted');

        const ssid = document.getElementById('ssid').value.trim();
        const password = document.getElementById('password').value;
        const encryption = document.getElementById('encryption').value;

        // --- Input Validation ---
        if (!ssid) {
            alert('Network Name (SSID) cannot be empty.');
            return;
        }
        if ((encryption === 'WPA' || encryption === 'WEP') && !password) {
            alert(`A password is required for ${encryption} encryption.`);
            return;
        }
        if (encryption === 'nopass' && password) {
            alert('Password should be empty when Encryption Type is "No Password". Please clear the password field.');
            return;
        }

        // --- Construct WiFi QR Code String ---
        const escapeValue = (val) => val.replace(/([\\;,":])/g, '\\$1');
        let wifiString = '';
        if (encryption === 'nopass') {
            wifiString = `WIFI:T:nopass;S:${escapeValue(ssid)};;`;
        } else {
            wifiString = `WIFI:T:${encryption};S:${escapeValue(ssid)};P:${escapeValue(password)};;`;
        }
        console.log('Generated WiFi String:', wifiString);

        // --- Generate QR Code ---
        // Re-get the element reference here in case something dynamic happened, though unlikely needed
        // const currentQrCodeDiv = document.getElementById('qrcode'); // Optional re-get
        qrCodeDiv.innerHTML = ''; // Clear previous QR code
        currentQRCode = null; // Reset instance

        // --- MODIFIED TRY...CATCH BLOCK ---
        try {
            // --- ADDED LOG: Check element right before use ---
            console.log('Element check before new QRCode: ', qrCodeDiv);
            // Also check if it's still attached to the DOM (it shouldn't be detached, but good sanity check)
            if (!qrCodeDiv || !qrCodeDiv.parentNode) {
                 console.error("!!! CRITICAL: qrCodeDiv element lost or detached before QR Code generation !!!");
                 // Throw a custom error to make it clear in the catch block
                 throw new Error("QR Code container element (#qrcode) is missing or detached from the DOM.");
            }
            // --- END ADDED LOG ---

            console.log('Attempting: new QRCode(qrCodeDiv, {...})'); // Log right before the potentially failing line

            // Generate the QR Code
            currentQRCode = new QRCode(qrCodeDiv, { // This is the line most likely causing issues if logs stop here
                text: wifiString,
                width: 180,
                height: 180,
                colorDark: "#000000",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.H // Ensure QRCode.CorrectLevel.H is valid
            });

            // If the above line succeeded, this log WILL appear
            console.log('QR Code generated successfully.');

            // --- INCREMENT COUNTER ---
            // Call the Cloudflare Function endpoint to increment the counter
            // This happens asynchronously in the background.
            console.log('Calling counter API: /api/increment-count'); // You weren't seeing this before
            fetch('/api/increment-count', {
                    method: 'POST'
                })
                .then(response => {
                    if (!response.ok && response.status !== 204) { // 204 No Content is a success response here
                        console.error('Failed to increment counter. Status:', response.status, response.statusText);
                    } else {
                         console.log('Counter API call successful (Status: ' + response.status + ').');
                    }
                })
                .catch(error => {
                    // Handle network errors or other issues with the fetch itself
                    console.error('Error calling counter API:', error);
                });
            // --- END OF COUNTER INCREMENT ---


            // --- Display Results ---
            resultSSIDSpan.textContent = ssid;
            resultPassSpan.textContent = (encryption === 'nopass' || !password) ? 'None' : password;

            // --- Show Result Section ---
            if (resultDiv) resultDiv.classList.remove('hidden');
            if (feedbackSection) feedbackSection.classList.remove('hidden');

            // Scroll to the results
            resultDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });

        } catch (err) {
            // --- ENHANCED CATCH BLOCK LOGGING ---
            console.error('!!! ERROR CAUGHT during QR Code generation or subsequent steps !!!');
            console.error('Error Message:', err.message); // The specific error text
            console.error('Error Stack:', err.stack); // Where the error occurred in the code
            console.error('WiFi String causing error was:', wifiString); // The input string
            console.error('Element `qrCodeDiv` at time of error:', qrCodeDiv); // Check the state of the element
            // Check if QRCode library object exists
            if (typeof QRCode === 'undefined') {
                 console.error('!!! QRCode library object itself seems to be undefined. Check script loading. !!!');
            }
            // --- END ENHANCED LOGGING ---

            alert('Could not generate QR code. Please check the browser console for details.'); // Updated alert message
            if (resultDiv) resultDiv.classList.add('hidden'); // Hide results on failure
            if (feedbackSection) feedbackSection.classList.add('hidden'); // Hide feedback on failure
            currentQRCode = null; // Ensure it's null on failure
        }
        // --- END MODIFIED TRY...CATCH BLOCK ---
    });

    // --- Print Button Event Listener ---
    if (printButton) {
        printButton.addEventListener('click', () => {
            console.log('Print button clicked');
            if (!currentQRCode || (resultDiv && resultDiv.classList.contains('hidden'))) {
                alert('Please generate a QR code first before printing.');
                console.warn('Print aborted: No QR code or results hidden.');
                return;
            }
            window.print();
            console.log('window.print() called.');
        });
    }

    // --- Download PDF Button Event Listener (Using Cloning Method) ---
    if (downloadButton) { // Check only for the button here
        console.log("Download button listener attached.");
        downloadButton.addEventListener('click', () => {
            console.log('Download PDF button clicked (Cloning Method)');

            // --- Basic Checks ---
            if (!currentQRCode || (resultDiv && resultDiv.classList.contains('hidden'))) {
                alert('Please generate a QR code first before downloading.');
                console.warn('Download aborted: No QR code or results hidden.');
                return;
            }
            if (typeof html2pdf === 'undefined') {
                console.error('html2pdf library is not loaded!');
                alert('Error: PDF generation library missing.');
                return;
            }
            // Get the element fresh, just before cloning
            const originalElement = document.getElementById('printable-card');
            if (!originalElement) {
                 console.error('Cannot find element #printable-card at the time of download click.');
                 alert('Error: Could not find the card element for PDF generation.');
                 return;
            }

            console.log('Attempting PDF generation via cloning element:', originalElement);

            // --- Prepare Filename ---
            const ssid = resultSSIDSpan.textContent || 'wifi';
            const safeSSID = ssid.replace(/[^a-z0-9]/gi, '_').toLowerCase();
            const filename = `wifi_card_${safeSSID}.pdf`;

            // --- Options for html2pdf.js ---
             const options = {
                margin:       [10, 10, 10, 10], // PDF margins [top, left, bottom, right] in mm
                filename:     filename,
                image:        { type: 'png', quality: 0.98 }, // PNG for QR clarity
                html2canvas:  {
                                scale: 3, // Increased scale for potentially better QR quality in PDF
                                useCORS: true,
                                logging: false // Keep false unless debugging the canvas itself
                              },
                jsPDF:        { unit: 'mm', orientation: 'portrait', putOnlyUsedFonts: true, compress: true }, // Added compression
                pagebreak:    { mode: ['avoid-all'] }
            };

            // --- Provide UI Feedback ---
            downloadButton.disabled = true;
            downloadButton.textContent = 'Generating PDF...';
            console.log(`Generating PDF: ${filename}`);

            // --- Generate PDF using the CLONING METHOD ---
            let clone = null; // Variable to hold the clone
            try {
                console.log('Cloning element #printable-card...');
                clone = originalElement.cloneNode(true); // Deep clone

                // --- Style the clone to be off-screen ---
                clone.style.position = 'absolute';
                clone.style.left = '-9999px'; // Position far off the left screen edge
                clone.style.top = '0px';
                clone.style.width = originalElement.offsetWidth + 'px'; // Match original width
                clone.style.height = 'auto'; // Allow height to adjust
                clone.style.visibility = 'visible'; // Must be visible for html2canvas
                clone.style.display = 'block'; // Ensure it's treated as block

                // Append clone to body TEMPORARILY
                document.body.appendChild(clone);
                console.log('Clone appended off-screen.');

                // Delay might still be beneficial for complex rendering
                setTimeout(() => {
                    console.log('Initiating html2pdf generation on CLONE...');
                    html2pdf().set(options).from(clone).save() // *** CAPTURE FROM CLONE ***
                        .then(() => {
                            console.log('PDF generation promise resolved successfully.');
                        })
                        .catch(err => {
                            console.error('PDF generation failed (promise catch):', err);
                            alert('Sorry, there was an error generating the PDF file. Please check the browser console for more details.');
                        })
                        .finally(() => {
                            // This block ALWAYS runs (after then or catch)
                            console.log('Restoring download button state and removing clone.');
                            downloadButton.disabled = false;
                            downloadButton.textContent = 'Download PDF';
                            // *** IMPORTANT: Remove the clone ***
                            if (clone && document.body.contains(clone)) {
                                document.body.removeChild(clone);
                                console.log('Clone removed.');
                            } else {
                                console.warn("Could not remove clone (already removed or never appended?).");
                            }
                        });
                }, 250); // Keep a small delay

            } catch (error) {
                 console.error('PDF generation failed (synchronous error during cloning/setup):', error);
                 alert('An unexpected error occurred while starting the PDF generation. Please check the browser console.');
                 // Restore button state
                 downloadButton.disabled = false;
                 downloadButton.textContent = 'Download PDF';
                 // Attempt to remove clone if it exists and an error happened before finally
                 if (clone && document.body.contains(clone)) {
                     try { document.body.removeChild(clone); console.log('Clone removed after error.'); } catch (e) {}
                 }
            }
        });
    } else {
        // Log reason if listener not attached (button missing)
        if (!downloadButton) {
            console.warn("Download button logic skipped: Button (.download-btn) not found.");
        }
    }

    console.log("WiFi Generator Script Initialized Successfully.");

}); // End of DOMContentLoaded listener