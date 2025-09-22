# Camera Distance App

This SwiftUI + ARKit sample lets you measure the distance between the iPhone/iPad camera and the object that sits under the on-screen reticle. The app continuously performs raycasts from the camera through the center of the screen and reports the closest feature or plane that it intersects. A lock button lets you freeze the current measurement so that you can reposition the device without losing the captured value.

## Requirements

- Xcode 15 or newer
- iOS 16 or newer device that supports LiDAR or at least ARKit world tracking
- Enable camera access when prompted

## Running the project

1. Create an empty SwiftUI App project in Xcode named `CameraDistanceApp` (or drag these source files into a new project).
2. Replace the template-generated SwiftUI files with `CameraDistanceApp.swift`, `ContentView.swift`, and `ARCameraDistanceView.swift` from this folder.
3. Update the app's `Info.plist` with the provided keys, especially the `NSCameraUsageDescription`.
4. Build and run on a physical device. The simulator does not provide camera or ARKit capabilities.

## How it works

- The `ARCameraDistanceView` hosts an `ARSCNView` configured with world tracking, plane detection, and (where available) scene reconstruction.
- Every few frames, the renderer performs a hit test from the center of the screen against detected planes and feature points. This gives you the 3D position of the object under the reticle.
- The camera pose comes from the current AR frame. We compute the Euclidean distance between the camera and the hit-test result to determine how far the object is from the device.
- A segmented control lets you view the result in meters, centimeters, feet, or inches. The lock button stops the AR session from updating the binding so that you can keep the measurement.

You can enhance this sample by:

- Drawing a virtual line between the camera origin and the measured point using SceneKit overlays.
- Capturing multiple measurements and storing them in a list.
- Leveraging LiDAR depth data for even more stable hits when the hardware supports it.
