export default async function handler(req, res) {
  try {
    const mod = await import("pptxgenjs/dist/pptxgen.cjs.js");
    const PptxGen = mod.default || mod;
    const pres = new PptxGen();
    pres.layout = "LAYOUT_16x9";
    const slide = pres.addSlide();
    slide.addText("Test Vercel", { x: 1, y: 1, fontSize: 18 });
    const buf = await pres.write({ outputType: "nodebuffer" });
    return res.status(200).json({
      ok: true,
      type: typeof PptxGen,
      buffer_length: buf.length
    });
  } catch (err) {
    return res.status(200).json({
      ok: false,
      error: err.message,
      stack: err.stack
    });
  }
}
