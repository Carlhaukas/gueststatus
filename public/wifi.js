document.getElementById('wifiForm').addEventListener('submit', function(e) {
  e.preventDefault();
  
  const ssid = document.getElementById('ssid').value;
  const password = document.getElementById('password').value;
  const encryption = document.getElementById('encryption').value;
  
  new QRCode(document.getElementById('qrcode'), {
    text: `WIFI:T:${encryption};S:${ssid};P:${password};;`,
    width: 200,
    height: 200
  });
});