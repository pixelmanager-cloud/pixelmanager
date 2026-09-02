// Mux an audio track into a finished mp4 without re-encoding either stream.
//
// AVAssetExportPresetPassthrough copies the H.264 video and the AAC audio as they are, so the trailer
// master keeps exactly the picture that was rendered — muxing music in should not cost a generation of
// video quality.
//
// Build: swiftc -O tools/trailer/MuxAudio.swift -o /tmp/mux_audio
// Run:   /tmp/mux_audio <video.mp4> <audio.m4a> <out.mp4>
import Foundation
import AVFoundation

let args = CommandLine.arguments
guard args.count == 4 else {
    FileHandle.standardError.write("usage: mux_audio <video.mp4> <audio.m4a> <out.mp4>\n".data(using: .utf8)!)
    exit(2)
}
let videoURL = URL(fileURLWithPath: args[1])
let audioURL = URL(fileURLWithPath: args[2])
let outURL = URL(fileURLWithPath: args[3])
try? FileManager.default.removeItem(at: outURL)

let sem = DispatchSemaphore(value: 0)
var failure: String?

Task {
    do {
        let vAsset = AVURLAsset(url: videoURL), aAsset = AVURLAsset(url: audioURL)
        let comp = AVMutableComposition()
        guard let vSrc = try await vAsset.loadTracks(withMediaType: .video).first,
              let aSrc = try await aAsset.loadTracks(withMediaType: .audio).first else {
            failure = "missing a video or audio track"; sem.signal(); return
        }
        let vDur = try await vAsset.load(.duration), aDur = try await aAsset.load(.duration)
        // The music is cut to the picture, so a mismatch means one of them is not what it should be —
        // better to say so than to silently ship a trailer whose music stops early.
        let delta = abs(CMTimeGetSeconds(vDur) - CMTimeGetSeconds(aDur))
        if delta > 0.15 { FileHandle.standardError.write("warning: video \(CMTimeGetSeconds(vDur))s vs audio \(CMTimeGetSeconds(aDur))s\n".data(using: .utf8)!) }

        let vTrack = comp.addMutableTrack(withMediaType: .video, preferredTrackID: kCMPersistentTrackID_Invalid)
        let aTrack = comp.addMutableTrack(withMediaType: .audio, preferredTrackID: kCMPersistentTrackID_Invalid)
        try vTrack?.insertTimeRange(CMTimeRange(start: .zero, duration: vDur), of: vSrc, at: .zero)
        // Audio is trimmed to the picture rather than the other way round.
        try aTrack?.insertTimeRange(CMTimeRange(start: .zero, duration: min(vDur, aDur)), of: aSrc, at: .zero)

        guard let export = AVAssetExportSession(asset: comp, presetName: AVAssetExportPresetPassthrough) else {
            failure = "could not create the export session"; sem.signal(); return
        }
        export.outputURL = outURL
        export.outputFileType = .mp4
        await export.export()
        if export.status != .completed { failure = export.error?.localizedDescription ?? "export failed" }
        sem.signal()
    } catch {
        failure = "\(error)"; sem.signal()
    }
}
sem.wait()
if let f = failure {
    FileHandle.standardError.write("mux failed: \(f)\n".data(using: .utf8)!); exit(1)
}
let size = (try? FileManager.default.attributesOfItem(atPath: outURL.path)[.size] as? Int) ?? 0
print("  wrote \(outURL.path) — \(size / 1_048_576) MB")
