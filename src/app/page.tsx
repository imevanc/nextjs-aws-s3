'use client';
import React, { FormEvent, useMemo, useState } from "react";
import Image from "next/image";

type UploadPayload = {
  uploadUrl: string;
  fields: Record<string, string>;
  s3ObjectUrl: string;
  cdnObjectUrl: string | null;
};

type BenchmarkResult = {
  label: string;
  samples: number[];
  averageMs: number;
};

const BENCHMARK_REQUESTS = 5;

const formatMs = (value: number): string => `${value.toFixed(1)} ms`;

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [s3PreviewUrl, setS3PreviewUrl] = useState<string | null>(null);
  const [cdnPreviewUrl, setCdnPreviewUrl] = useState<string | null>(null);
  const [benchmarking, setBenchmarking] = useState(false);
  const [benchmarkResults, setBenchmarkResults] = useState<BenchmarkResult[]>([]);

  const canRunBenchmark = useMemo(() => Boolean(s3PreviewUrl && cdnPreviewUrl), [s3PreviewUrl, cdnPreviewUrl]);

  const benchmarkUrl = async (label: string, url: string): Promise<BenchmarkResult> => {
    const samples: number[] = [];

    for (let i = 0; i < BENCHMARK_REQUESTS; i += 1) {
      const startedAt = performance.now();
      const response = await fetch(url, { cache: "no-store" });
      await response.blob();
      const endedAt = performance.now();

      if (!response.ok) {
        throw new Error(`Request failed for ${label} with status ${response.status}.`);
      }

      samples.push(endedAt - startedAt);
    }

    const averageMs = samples.reduce((acc, current) => acc + current, 0) / samples.length;
    return { label, samples, averageMs };
  };

  const runBenchmark = async () => {
    if (!s3PreviewUrl || !cdnPreviewUrl) return;

    setBenchmarking(true);
    setMessage("Running benchmark (5 requests per source)...");

    try {
      const [s3Result, cdnResult] = await Promise.all([
        benchmarkUrl("S3 Direct", s3PreviewUrl),
        benchmarkUrl("CloudFront CDN", cdnPreviewUrl),
      ]);

      setBenchmarkResults([s3Result, cdnResult]);
      setMessage("Benchmark complete. CloudFront should show lower average latency after warmup.");
    } catch (error) {
      console.error("Benchmark error", error);
      setMessage("Benchmark failed. Verify bucket/object CORS and CloudFront domain settings.");
    } finally {
      setBenchmarking(false);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!file) {
      setMessage("Please select a file to upload.");
      return;
    }

    setUploading(true);
    setBenchmarkResults([]);

    const response = await fetch(
      `/api?filename=${encodeURIComponent(file.name)}&contentType=${encodeURIComponent(file.type)}`
    );

    if (response.ok) {
      const payload: UploadPayload = await response.json();
      const { uploadUrl, fields, s3ObjectUrl, cdnObjectUrl } = payload;

      const formData = new FormData();
      Object.entries(fields).forEach(([key, value]) => {
        formData.append(key, value);
      });
      formData.append("file", file);

      const uploadResponse = await fetch(uploadUrl, {
        method: "POST",
        body: formData,
      });

      if (uploadResponse.ok) {
        setS3PreviewUrl(s3ObjectUrl);
        setCdnPreviewUrl(cdnObjectUrl);
        setMessage(cdnObjectUrl ? "Upload successful. Preview now loads from CloudFront." : "Upload successful. Add CLOUDFRONT_DOMAIN to enable CDN preview.");
      } else {
        console.error("S3 Upload Error:", uploadResponse);
        setMessage("Upload failed.");
      }
    } else {
      setMessage("Failed to get pre-signed URL.");
    }

    setUploading(false);
  };

  return (
      <main>
        <div className="bg-white h-screen sm:h-full sm:py-24">
          <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
            <div className="relative isolate overflow-hidden bg-gray-900 px-6 py-24 shadow-2xl sm:rounded-3xl sm:px-24 xl:py-32">
              <h2 className="mx-auto max-w-2xl text-center text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Upload to S3 + Serve via CloudFront
              </h2>
              <form
                  onSubmit={handleSubmit}
                  className="mx-auto mt-10 flex max-w-md gap-x-4"
              >
                <input
                    id="file"
                    type="file"
                    className="cursor-pointer min-w-0 flex-auto rounded-md border-0 bg-white/5 px-3.5 py-2 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-white sm:text-sm sm:leading-6"
                    onChange={(e) => {
                      const files = e.target.files;
                      if (files) {
                        setFile(files[0]);
                      }
                    }}
                    accept="image/png, image/jpeg, image/jpg"
                />
                <button
                    className="flex-none rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                    type="submit"
                    disabled={uploading}
                >
                  {uploading ? "Uploading..." : "Upload"}
                </button>
              </form>
              {message && (
                <div className="pt-6 text-center">
                  <div className="mx-auto inline-block rounded-md bg-white/10 px-3.5 py-3 text-sm text-white">
                  {message}
                  </div>
                </div>
              )}

              {(cdnPreviewUrl || s3PreviewUrl) && (
                <div className="mx-auto mt-8 grid max-w-4xl gap-4 sm:grid-cols-2">
                  {cdnPreviewUrl && (
                    <div className="rounded-md bg-white/10 p-4 text-white">
                      <h3 className="font-semibold">CloudFront Preview</h3>
                      <Image
                        src={cdnPreviewUrl}
                        alt="CloudFront preview"
                        width={640}
                        height={320}
                        className="mt-3 h-52 w-full rounded-md object-cover"
                        unoptimized
                      />
                    </div>
                  )}
                  {s3PreviewUrl && (
                    <div className="rounded-md bg-white/10 p-4 text-white">
                      <h3 className="font-semibold">S3 Direct Preview</h3>
                      <Image
                        src={s3PreviewUrl}
                        alt="S3 preview"
                        width={640}
                        height={320}
                        className="mt-3 h-52 w-full rounded-md object-cover"
                        unoptimized
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="mx-auto mt-8 max-w-4xl rounded-md bg-white/10 p-4 text-white">
                <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="font-semibold">CDN Showcase Demo</h3>
                    <p className="text-sm text-white/80">Runs {BENCHMARK_REQUESTS} uncached browser requests to S3 and CloudFront and compares average latency.</p>
                  </div>
                  <button
                    type="button"
                    onClick={runBenchmark}
                    disabled={!canRunBenchmark || benchmarking}
                    className="rounded-md bg-white px-3.5 py-2 text-sm font-semibold text-gray-900 disabled:cursor-not-allowed disabled:bg-white/50"
                  >
                    {benchmarking ? "Running demo..." : "Run CDN demo"}
                  </button>
                </div>

                {benchmarkResults.length > 0 && (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {benchmarkResults.map((result) => (
                      <div key={result.label} className="rounded-md bg-black/20 p-3">
                        <h4 className="font-medium">{result.label}</h4>
                        <p className="text-sm text-white/80">Average: {formatMs(result.averageMs)}</p>
                        <p className="text-xs text-white/70">Samples: {result.samples.map((sample) => formatMs(sample)).join(", ")}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <svg
                  viewBox="0 0 1024 1024"
                  className="absolute left-1/2 top-1/2 -z-10 sm:h-[64rem] w-[64rem] -translate-x-1/2"
                  aria-hidden="true"
              >
                <circle
                    cx={512}
                    cy={512}
                    r={512}
                    fill="url(#759c1415-0410-454c-8f7c-9a820de03641)"
                    fillOpacity="0.7"
                />
                <defs>
                  <radialGradient
                      id="759c1415-0410-454c-8f7c-9a820de03641"
                      cx={0}
                      cy={0}
                      r={1}
                      gradientUnits="userSpaceOnUse"
                      gradientTransform="translate(512 512) rotate(90) scale(512)"
                  >
                    <stop stopColor="#7775D6" />
                    <stop offset={1} stopColor="#E935C1" stopOpacity={0} />
                  </radialGradient>
                </defs>
              </svg>
            </div>
          </div>
        </div>
      </main>
  );
}