import SwiftUI
import ARKit

struct ContentView: View {
    @State private var distanceInMeters: Double?
    @State private var isLocked: Bool = false
    @State private var selectedUnit: DistanceUnit = .meters

    private static let distanceFormatter: MeasurementFormatter = {
        let formatter = MeasurementFormatter()
        formatter.unitStyle = .medium
        formatter.unitOptions = .providedUnit
        return formatter
    }()

    private var formattedDistance: String {
        guard let distanceInMeters else {
            return "Align the reticle with your target"
        }
        let measurement = Measurement(value: distanceInMeters, unit: UnitLength.meters)
            .converted(to: selectedUnit.unit)
        return Self.distanceFormatter.string(from: measurement)
    }

    var body: some View {
        ZStack {
            ARCameraDistanceView(distanceInMeters: $distanceInMeters, isLocked: $isLocked)
                .edgesIgnoringSafeArea(.all)

            VStack {
                Text("Center the reticle on the object to measure how far it is from your device.")
                    .font(.footnote)
                    .padding(.top, 16)
                    .padding(.horizontal, 20)
                    .multilineTextAlignment(.center)
                    .background(Color.black.opacity(0.35).blur(radius: 0))
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                    .padding(.top, 24)

                Spacer()

                VStack(spacing: 12) {
                    Text(formattedDistance)
                        .font(.system(size: 28, weight: .semibold, design: .rounded))
                        .padding(.horizontal, 16)
                        .padding(.vertical, 10)
                        .background(Color.black.opacity(0.55))
                        .clipShape(Capsule())

                    Picker("Units", selection: $selectedUnit) {
                        ForEach(DistanceUnit.allCases) { unit in
                            Text(unit.displayName).tag(unit)
                        }
                    }
                    .pickerStyle(.segmented)
                    .padding(.horizontal)

                    Button(action: { isLocked.toggle() }) {
                        Label(isLocked ? "Unlock Live Reading" : "Lock This Distance", systemImage: isLocked ? "lock.open" : "lock")
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color.blue.opacity(0.85))
                            .foregroundStyle(.white)
                            .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
                    }
                }
                .padding(24)
                .background(Color.black.opacity(0.35))
                .clipShape(RoundedRectangle(cornerRadius: 24, style: .continuous))
                .padding()
            }

            ReticleView()
                .frame(width: 120, height: 120)
        }
        .preferredColorScheme(.dark)
    }
}

private struct ReticleView: View {
    var body: some View {
        ZStack {
            Circle()
                .stroke(Color.white.opacity(0.65), lineWidth: 2)
            Circle()
                .stroke(Color.white.opacity(0.3), lineWidth: 1)
                .scaleEffect(0.55)
            Rectangle()
                .fill(Color.white.opacity(0.65))
                .frame(width: 2, height: 20)
            Rectangle()
                .fill(Color.white.opacity(0.65))
                .frame(width: 20, height: 2)
        }
    }
}

enum DistanceUnit: String, CaseIterable, Identifiable {
    case meters
    case centimeters
    case feet
    case inches

    var id: String { rawValue }

    var unit: UnitLength {
        switch self {
        case .meters:
            return .meters
        case .centimeters:
            return .centimeters
        case .feet:
            return .feet
        case .inches:
            return .inches
        }
    }

    var displayName: String {
        switch self {
        case .meters:
            return "Meters"
        case .centimeters:
            return "Centimeters"
        case .feet:
            return "Feet"
        case .inches:
            return "Inches"
        }
    }
}

#Preview {
    ContentView()
}
