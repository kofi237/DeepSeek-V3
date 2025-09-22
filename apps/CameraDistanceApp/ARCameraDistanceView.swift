import SwiftUI
import ARKit

struct ARCameraDistanceView: UIViewRepresentable {
    @Binding var distanceInMeters: Double?
    @Binding var isLocked: Bool

    func makeCoordinator() -> Coordinator {
        Coordinator(distance: $distanceInMeters, isLocked: $isLocked)
    }

    func makeUIView(context: Context) -> ARSCNView {
        let view = ARSCNView(frame: .zero)
        view.delegate = context.coordinator
        view.session.delegate = context.coordinator
        view.automaticallyUpdatesLighting = true
        view.debugOptions = []
        view.scene = SCNScene()

        let configuration = ARWorldTrackingConfiguration()
        configuration.planeDetection = [.horizontal, .vertical]
        configuration.environmentTexturing = .automatic
        if ARWorldTrackingConfiguration.supportsSceneReconstruction(.mesh) {
            configuration.sceneReconstruction = .mesh
        }
        view.session.run(configuration)
        return view
    }

    func updateUIView(_ uiView: ARSCNView, context: Context) {
        context.coordinator.isLocked = isLocked
    }

    final class Coordinator: NSObject, ARSCNViewDelegate, ARSessionDelegate {
        @Binding var distance: Double?
        @Binding var isLocked: Bool
        private var lastUpdateTime: TimeInterval = 0
        private let throttlingInterval: TimeInterval = 0.05

        init(distance: Binding<Double?>, isLocked: Binding<Bool>) {
            self._distance = distance
            self._isLocked = isLocked
        }

        func renderer(_ renderer: SCNSceneRenderer, updateAtTime time: TimeInterval) {
            guard !isLocked else { return }
            guard time - lastUpdateTime >= throttlingInterval else { return }
            lastUpdateTime = time

            guard let sceneView = renderer as? ARSCNView,
                  let frame = sceneView.session.currentFrame else {
                return
            }

            let center = CGPoint(x: sceneView.bounds.midX, y: sceneView.bounds.midY)
            let hitTestTypes: ARHitTestResult.ResultType = [.existingPlaneUsingGeometry, .existingPlaneUsingExtent, .featurePoint]
            let results = sceneView.hitTest(center, types: hitTestTypes)

            guard let result = results.first else {
                DispatchQueue.main.async {
                    self.distance = nil
                }
                return
            }

            let cameraTransform = frame.camera.transform
            let cameraPosition = SIMD3<Float>(cameraTransform.columns.3.x,
                                              cameraTransform.columns.3.y,
                                              cameraTransform.columns.3.z)
            let targetTransform = result.worldTransform
            let targetPosition = SIMD3<Float>(targetTransform.columns.3.x,
                                              targetTransform.columns.3.y,
                                              targetTransform.columns.3.z)

            let distanceMeters = simd_distance(cameraPosition, targetPosition)

            DispatchQueue.main.async {
                self.distance = Double(distanceMeters)
            }
        }

        func session(_ session: ARSession, didFailWithError error: Error) {
            NSLog("ARSession failed: \(error.localizedDescription)")
        }

        func sessionWasInterrupted(_ session: ARSession) {
            NSLog("ARSession interrupted")
        }

        func sessionInterruptionEnded(_ session: ARSession) {
            NSLog("ARSession interruption ended, resetting tracking")
            let configuration = ARWorldTrackingConfiguration()
            configuration.planeDetection = [.horizontal, .vertical]
            configuration.environmentTexturing = .automatic
            if ARWorldTrackingConfiguration.supportsSceneReconstruction(.mesh) {
                configuration.sceneReconstruction = .mesh
            }
            session.run(configuration, options: [.resetTracking, .removeExistingAnchors])
        }
    }
}
