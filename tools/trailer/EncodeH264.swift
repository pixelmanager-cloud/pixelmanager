// A JPEG sequence -> H.264 mp4 encoder, built on AVFoundation.
//
// Playwright ships an ffmpeg, which is how the WebM gets made, but it is a deliberately stripped build:
// VP8 and WebM only, no H.264 and no mp4 muxer. Steam wants H.264. Rather than add a system-wide ffmpeg
// dependency for one encode, this uses the AVFoundation that is already on every Mac.
//
// Build: swiftc -O tools/trailer/EncodeH264.swift -o /tmp/encode_h264
// Run:   /tmp/encode_h264 <framesDir> <out.mp4> <fps> [bitrateMbps]
import Foundation
import AVFoundation
import CoreGraphics
import ImageIO

let args = CommandLine.arguments
guard args.count >= 4 else {
    FileHandle.standardError.write("usage: encode_h264 <framesDir> <out.mp4> <fps> [bitrateMbps]\n".data(using: .utf8)!)
    exit(2)
}
let dir = args[1], outPath = args[2]
let fps = Int32(args[3]) ?? 30
let mbps = Double(args.count > 4 ? args[4] : "12") ?? 12

let fm = FileManager.default
let frames = ((try? fm.contentsOfDirectory(atPath: dir)) ?? [])
    .filter { $0.hasSuffix(".jpg") }.sorted()
guard let first = frames.first,
      let probe = CGImageSourceCreateWithURL(URL(fileURLWithPath: dir).appendingPathComponent(first) as CFURL, nil),
      let probeImg = CGImageSourceCreateImageAtIndex(probe, 0, nil) else {
    FileHandle.standardError.write("no frames in \(dir)\n".data(using: .utf8)!); exit(1)
}
let W = probeImg.width, H = probeImg.height
try? fm.removeItem(atPath: outPath)

let writer = try AVAssetWriter(outputURL: URL(fileURLWithPath: outPath), fileType: .mp4)
let input = AVAssetWriterInput(mediaType: .video, outputSettings: [
    AVVideoCodecKey: AVVideoCodecType.h264,
    AVVideoWidthKey: W, AVVideoHeightKey: H,
    AVVideoCompressionPropertiesKey: [
        AVVideoAverageBitRateKey: Int(mbps * 1_000_000),
        AVVideoMaxKeyFrameIntervalKey: Int(fps) * 2,
        AVVideoProfileLevelKey: AVVideoProfileLevelH264HighAutoLevel,
        AVVideoAllowFrameReorderingKey: true,
    ],
])
input.expectsMediaDataInRealTime = false
let adaptor = AVAssetWriterInputPixelBufferAdaptor(assetWriterInput: input, sourcePixelBufferAttributes: [
    kCVPixelBufferPixelFormatTypeKey as String: Int(kCVPixelFormatType_32BGRA),
    kCVPixelBufferWidthKey as String: W, kCVPixelBufferHeightKey as String: H,
])
writer.add(input)
writer.startWriting()
writer.startSession(atSourceTime: .zero)

let cs = CGColorSpaceCreateDeviceRGB()
var i = 0
for name in frames {
    let url = URL(fileURLWithPath: dir).appendingPathComponent(name)
    guard let src = CGImageSourceCreateWithURL(url as CFURL, nil),
          let img = CGImageSourceCreateImageAtIndex(src, 0, nil) else { continue }
    var pb: CVPixelBuffer?
    CVPixelBufferPoolCreatePixelBuffer(nil, adaptor.pixelBufferPool!, &pb)
    guard let buf = pb else { continue }
    CVPixelBufferLockBaseAddress(buf, [])
    if let ctx = CGContext(data: CVPixelBufferGetBaseAddress(buf), width: W, height: H,
                           bitsPerComponent: 8, bytesPerRow: CVPixelBufferGetBytesPerRow(buf), space: cs,
                           bitmapInfo: CGImageAlphaInfo.noneSkipFirst.rawValue | CGBitmapInfo.byteOrder32Little.rawValue) {
        ctx.draw(img, in: CGRect(x: 0, y: 0, width: W, height: H))
    }
    CVPixelBufferUnlockBaseAddress(buf, [])
    // Back-pressure: the writer is slower than the decoder, so wait rather than buffering the whole film.
    while !input.isReadyForMoreMediaData { usleep(2000) }
    adaptor.append(buf, withPresentationTime: CMTime(value: CMTimeValue(i), timescale: fps))
    i += 1
    if i % 300 == 0 { print("  \(i)/\(frames.count) frames") }
}
input.markAsFinished()
let done = DispatchSemaphore(value: 0)
writer.finishWriting { done.signal() }
done.wait()
if writer.status == .completed {
    let size = (try? fm.attributesOfItem(atPath: outPath)[.size] as? Int) ?? 0
    print("  wrote \(outPath) — \(i) frames, \(Double(i) / Double(fps)) s, \(size / 1_048_576) MB")
} else {
    FileHandle.standardError.write("encode failed: \(writer.error?.localizedDescription ?? "unknown")\n".data(using: .utf8)!)
    exit(1)
}
