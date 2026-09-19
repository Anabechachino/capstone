<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>QR Attendance Station</title>
  <script src="https://unpkg.com/html5-qrcode" type="text/javascript"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  
  <style>
    :root {
      --bg: #0f172a;
      --card-bg: rgba(30, 41, 59, 0.85);
      --text: #f8fafc;
      --subtext: #94a3b8;
      --checkin: #10b981;
      --checkout: #f59e0b;
      --error: #ef4444;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; font-family: system-ui, -apple-system, sans-serif; }

    body {
      background: linear-gradient(135deg, #0f172a, #1e1b4b);
      color: var(--text);
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 16px;
    }

    .container {
      background: var(--card-bg);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 20px;
      padding: 24px;
      width: 100%;
      max-width: 440px;
      text-align: center;
      box-shadow: 0 20px 40px rgba(0,0,0,0.5);
    }

    h2 { font-size: 1.4rem; margin-bottom: 4px; }
    p.subtitle { color: var(--subtext); font-size: 0.85rem; margin-bottom: 20px; }

    .scanner-wrapper {
      position: relative;
      border-radius: 16px;
      overflow: hidden;
      background: #000;
      min-height: 260px;
      border: 2px dashed rgba(255,255,255,0.2);
    }

    #reader { width: 100%; border: none !important; }
    #reader video { object-fit: cover !important; border-radius: 14px; }

    /* Scanner Laser Animation */
    .scanner-wrapper::after {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0; height: 3px;
      background: linear-gradient(90deg, transparent, #06b6d4, transparent);
      box-shadow: 0 0 12px #06b6d4;
      animation: scan 2s infinite linear;
    }

    @keyframes scan { 0% { top: 5%; } 50% { top: 95%; } 100% { top: 5%; } }

    /* Result Card */
    .status-card {
      display: none;
      margin-top: 20px;
      padding: 16px;
      border-radius: 12px;
      text-align: left;
      animation: slideUp 0.3s ease;
    }

    .status-card.check-in { background: rgba(16, 185, 129, 0.15); border: 1px solid var(--checkin); color: #34d399; }
    .status-card.check-out { background: rgba(245, 158, 11, 0.15); border: 1px solid var(--checkout); color: #fbbf24; }
    .status-card.error { background: rgba(239, 68, 68, 0.15); border: 1px solid var(--error); color: #f87171; }

    @keyframes slideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

    .status-title { font-weight: 700; font-size: 1.1rem; display: flex; align-items: center; gap: 8px; }
    .status-details { font-size: 0.85rem; margin-top: 6px; color: var(--text); }

    .loader {
      display: none;
      margin-top: 15px;
      font-size: 0.9rem;
      color: var(--subtext);
    }
  </style>
</head>
<body>

  <div class="container">
    <h2><i class="fa-solid fa-qrcode"></i> Attendance Station</h2>
    <p class="subtitle">Scan QR to Check In / Check Out</p>

    <div class="scanner-wrapper">
      <div id="reader"></div>
    </div>

    <div class="loader" id="loader">
      <i class="fa-solid fa-spinner fa-spin"></i> Processing & sending to Google Sheets...
    </div>

    <div class="status-card" id="status-card">
      <div class="status-title" id="status-title"></div>
      <div class="status-details" id="status-details"></div>
    </div>
  </div>

  <script>
    // PALITAN ITO ng nakuha mong Web App URL mula sa Google Apps Script
    const GOOGLE_SCRIPT_URL = "YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE"; 
    
    let html5QrcodeScanner;
    let isProcessing = false;

    function onScanSuccess(decodedText) {
      if (isProcessing) return;
      isProcessing = true;

      document.getElementById('loader').style.display = 'block';
      document.getElementById('status-card').style.display = 'none';

      // Send scanned QR code to Google Sheets API
      fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors', // Handled as background post
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrData: decodedText })
      })
      .then(() => {
        // Since no-cors hides response, we assume successful transmission
        showStatus('CHECK_IN / CHECK_OUT SENT', `Scanned ID: ${decodedText}`, 'check-in');
      })
      .catch(err => {
        showStatus('Error', 'Failed to communicate with Google Sheets', 'error');
      })
      .finally(() => {
        document.getElementById('loader').style.display = 'none';
        setTimeout(() => { isProcessing = false; }, 2500); // Resume scanner after 2.5s delay
      });
    }

    function showStatus(title, details, type) {
      const card = document.getElementById('status-card');
      const titleEl = document.getElementById('status-title');
      const detailsEl = document.getElementById('status-details');

      card.className = `status-card ${type}`;
      titleEl.innerHTML = type === 'check-in' 
        ? `<i class="fa-solid fa-circle-check"></i> ${title}`
        : `<i class="fa-solid fa-triangle-exclamation"></i> ${title}`;

      detailsEl.textContent = details;
      card.style.display = 'block';
    }

    window.onload = () => {
      html5QrcodeScanner = new Html5QrcodeScanner(
        "reader", { fps: 10, qrbox: { width: 220, height: 220 } }, false
      );
      html5QrcodeScanner.render(onScanSuccess, () => {});
    };
  </script>
</body>
</html># capstone
