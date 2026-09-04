import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pptxgen = require("pptxgenjs");

export default async function handler(req, res) {
  try {
    const pres = new pptxgen();
    pres.layout = "LAYOUT_16x9";
    const slide = pres.addSlide();
    slide.addText("Test Vercel Require", { x: 1, y: 1, fontSize: 18 });
    const buf = await pres.write({ outputType: "nodebuffer" });
    return res.status(200).json({
      ok: true,
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
