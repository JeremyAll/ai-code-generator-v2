// app/api/status/route.js - Version and features status endpoint
export async function GET() {
  return Response.json({
    version: "2.0.0",
    lastUpdate: "2024-09-13",
    features: {
      bamlPragmatic: true,
      streaming: true,
      cache: true,
      scotEnhancement: true
    }
  });
}