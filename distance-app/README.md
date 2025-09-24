# Camera Distance Measure

This is a lightweight web app that uses the phone (or desktop) camera to estimate the distance from the camera to an object of known height. It works entirely in the browser using the MediaDevices API, so no native installation is required.

## How it works

1. Start the camera (ideally the rear camera on a phone) and grant permission when prompted.
2. Capture a frame to freeze the current view.
3. Tap or click the bottom of the object and then its top.
4. Enter the real-world height of the object and the camera's vertical field-of-view (FOV). The FOV defaults to 60°, which is a good starting point for many smartphone cameras. You can calibrate this value using an object at a known distance.
5. The app calculates the distance using a simple pinhole camera model:

   \[
   \text{distance} = \frac{\text{actual height} \times \text{image height}}{\text{pixel height} \times 2 \tan(\text{FOV} / 2)}
   \]

The output is displayed in metres and centimetres.

## Running locally

You can open `index.html` directly in a modern mobile browser, but serving it over `https://` (or `http://localhost`) is required for camera access. The simplest option is to run a static file server inside this folder:

```bash
cd distance-app
python -m http.server 8000
```

Then browse to [http://localhost:8000](http://localhost:8000) from your desktop or mobile device. If you are testing on a phone, ensure that the device is on the same network and replace `localhost` with your machine's IP address.

## Notes and limitations

- Estimation accuracy depends heavily on the correctness of the FOV value and how precisely you tap the object's top and bottom.
- Tall objects produce more reliable readings because they occupy more pixels in the frame.
- To improve accuracy, calibrate the FOV by measuring a known distance and adjusting the FOV input until the displayed result matches reality.
- Browsers require a secure context (HTTPS or localhost) for camera access. Opening the file directly from disk may prevent the camera from working.
- The app stops camera tracks when the page is closed, but you can also revoke access from the browser's privacy settings if needed.
