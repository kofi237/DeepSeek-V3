const video = document.getElementById('video');
const overlay = document.getElementById('overlay');
const ctx = overlay.getContext('2d');
const startBtn = document.getElementById('start');
const captureBtn = document.getElementById('capture');
const resetBtn = document.getElementById('reset');
const statusEl = document.getElementById('status');
const actualHeightInput = document.getElementById('actual-height');
const fovInput = document.getElementById('fov');
const distanceOutput = document.getElementById('distance');

let stream = null;
let capturedFrame = null;
let points = [];

const toRadians = (deg) => (deg * Math.PI) / 180;

function setStatus(message = '', type = 'info') {
  statusEl.textContent = message;
  statusEl.classList.remove('ok', 'error');
  if (type === 'ok') {
    statusEl.classList.add('ok');
  } else if (type === 'error') {
    statusEl.classList.add('error');
  }
}

function syncCanvasSize() {
  if (!video.videoWidth || !video.videoHeight) {
    return;
  }
  overlay.width = video.videoWidth;
  overlay.height = video.videoHeight;
}

function clearMeasurement() {
  points = [];
  if (capturedFrame) {
    renderOverlay();
  } else {
    ctx.clearRect(0, 0, overlay.width, overlay.height);
  }
  updateMeasurement();
}

function renderOverlay() {
  if (!capturedFrame) {
    ctx.clearRect(0, 0, overlay.width, overlay.height);
    return;
  }

  ctx.clearRect(0, 0, overlay.width, overlay.height);
  ctx.drawImage(capturedFrame, 0, 0, overlay.width, overlay.height);

  const radius = Math.max(overlay.width, overlay.height) / 120;
  ctx.lineWidth = Math.max(overlay.width, overlay.height) / 360;
  ctx.strokeStyle = '#38bdf8';
  ctx.fillStyle = '#22d3ee';

  points.forEach((point, index) => {
    ctx.beginPath();
    ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#0f172a';
    ctx.font = `${radius * 1.2}px/1 'Inter', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(index === 0 ? '1' : '2', point.x, point.y);
    ctx.fillStyle = '#22d3ee';
  });

  if (points.length === 2) {
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    ctx.lineTo(points[1].x, points[1].y);
    ctx.stroke();
  }
}

function updateMeasurement() {
  if (!capturedFrame || points.length !== 2) {
    distanceOutput.textContent = '–';
    return;
  }

  const actualHeight = Number.parseFloat(actualHeightInput.value);
  const fov = Number.parseFloat(fovInput.value);

  if (!(actualHeight > 0)) {
    setStatus('Enter the actual height of the object in centimetres.', 'error');
    distanceOutput.textContent = '–';
    return;
  }

  if (!(fov > 0)) {
    setStatus('Enter a valid field-of-view between 10° and 120°.', 'error');
    distanceOutput.textContent = '–';
    return;
  }

  const imageHeight = overlay.height;
  const pixelDistance = Math.abs(points[0].y - points[1].y);

  if (pixelDistance < 5) {
    setStatus('The selected points are too close together to estimate the distance.', 'error');
    distanceOutput.textContent = '–';
    return;
  }

  const angle = toRadians(fov);
  const denominator = pixelDistance * 2 * Math.tan(angle / 2);

  if (denominator <= 0) {
    setStatus('Unable to compute the distance with the current parameters.', 'error');
    distanceOutput.textContent = '–';
    return;
  }

  const distanceCm = (actualHeight * imageHeight) / denominator;

  if (!Number.isFinite(distanceCm) || distanceCm <= 0) {
    setStatus('The calculation produced an invalid distance. Adjust your inputs and try again.', 'error');
    distanceOutput.textContent = '–';
    return;
  }

  const distanceMeters = distanceCm / 100;
  distanceOutput.textContent = `${distanceMeters.toFixed(2)} m (${distanceCm.toFixed(0)} cm)`;
  setStatus('Distance estimate updated. Calibrate the FOV for higher accuracy.', 'ok');
}

async function startCamera() {
  if (!navigator.mediaDevices?.getUserMedia) {
    setStatus('Camera access is not supported in this browser.', 'error');
    return;
  }

  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: 'environment' },
        width: { ideal: 1080 },
        height: { ideal: 1920 },
      },
      audio: false,
    });

    video.srcObject = stream;
    await video.play();
    syncCanvasSize();
    capturedFrame = null;
    overlay.classList.remove('interactive');
    clearMeasurement();
    startBtn.disabled = true;
    captureBtn.disabled = false;
    resetBtn.disabled = true;
    setStatus('Camera ready. Capture a frame to start measuring.', 'ok');
  } catch (error) {
    console.error(error);
    setStatus(`Could not access the camera: ${error.message}`, 'error');
  }
}

function stopCamera() {
  if (!stream) {
    return;
  }
  stream.getTracks().forEach((track) => track.stop());
  stream = null;
}

async function captureFrame() {
  if (!stream || !video.videoWidth) {
    setStatus('Start the camera and wait for it to initialise before capturing.', 'error');
    return;
  }

  syncCanvasSize();
  capturedFrame = document.createElement('canvas');
  capturedFrame.width = overlay.width;
  capturedFrame.height = overlay.height;
  const snapshotContext = capturedFrame.getContext('2d');
  snapshotContext.drawImage(video, 0, 0, overlay.width, overlay.height);

  overlay.classList.add('interactive');
  clearMeasurement();
  renderOverlay();
  resetBtn.disabled = false;
  setStatus('Frame captured. Tap the bottom (1) then the top (2) of the object.', 'info');
}

function handlePointer(event) {
  if (!capturedFrame) {
    return;
  }

  event.preventDefault();
  const rect = overlay.getBoundingClientRect();
  const scaleX = overlay.width / rect.width;
  const scaleY = overlay.height / rect.height;
  const x = (event.clientX - rect.left) * scaleX;
  const y = (event.clientY - rect.top) * scaleY;

  if (points.length >= 2) {
    points = [];
  }
  points.push({ x, y });

  if (points.length === 1) {
    setStatus('Now tap the top of the object.', 'info');
  } else if (points.length === 2) {
    setStatus('Distance estimate updated. Adjust FOV if needed.', 'ok');
  }

  renderOverlay();
  updateMeasurement();
}

function resetPoints() {
  if (!capturedFrame) {
    return;
  }
  points = [];
  renderOverlay();
  updateMeasurement();
  setStatus('Points cleared. Tap the frame to pick them again.', 'info');
}

startBtn.addEventListener('click', startCamera);
captureBtn.addEventListener('click', captureFrame);
resetBtn.addEventListener('click', resetPoints);
overlay.addEventListener('pointerdown', handlePointer);
actualHeightInput.addEventListener('input', updateMeasurement);
fovInput.addEventListener('input', updateMeasurement);

video.addEventListener('loadedmetadata', syncCanvasSize);

window.addEventListener('beforeunload', stopCamera);

setStatus('Allow camera access, capture a frame, then mark the object to measure the distance.');
