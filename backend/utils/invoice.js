import PDFDocument from "pdfkit";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FONT_REGULAR = path.join(__dirname, "..", "assets", "fonts", "DejaVuSans.ttf");
const FONT_BOLD = path.join(__dirname, "..", "assets", "fonts", "DejaVuSans-Bold.ttf");

const BRAND_GREEN = "#15803d";
const DARK = "#1f2937";
const MUTED = "#6b7280";
const LINE = "#e5e7eb";

// Streams a PDF invoice for `order` directly to `res`. Returns nothing -
// the caller should have already set up the response as a file download.
export function streamInvoicePDF(order, res) {
  const doc = new PDFDocument({ size: "A4", margin: 50 });
  doc.registerFont("Regular", FONT_REGULAR);
  doc.registerFont("Bold", FONT_BOLD);

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=SMT-Grocery-Invoice-${order.orderId}.pdf`
  );
  doc.pipe(res);

  // Header
  doc.font("Bold").fontSize(22).fillColor(BRAND_GREEN).text("SMT GROCERY", 50, 50);
  doc
    .font("Regular")
    .fontSize(9)
    .fillColor(MUTED)
    .text("Fresh groceries delivered to your door", 50, 78);

  doc
    .font("Bold")
    .fontSize(14)
    .fillColor(DARK)
    .text("TAX INVOICE", 400, 50, { width: 145, align: "right" });
  doc
    .font("Regular")
    .fontSize(9)
    .fillColor(MUTED)
    .text(`Invoice No: INV-${order.orderId}`, 350, 72, { width: 195, align: "right" })
    .text(`Order ID: ${order.orderId}`, 350, 86, { width: 195, align: "right" })
    .text(`Order Date: ${new Date(order.createdAt).toLocaleString("en-IN")}`, 350, 100, {
      width: 195,
      align: "right",
    });

  doc.moveTo(50, 125).lineTo(545, 125).strokeColor(LINE).stroke();

  // Customer block
  const addr = order.shippingAddress;
  doc.font("Bold").fontSize(11).fillColor(DARK).text("Billed To", 50, 140);
  doc
    .font("Regular")
    .fontSize(10)
    .fillColor(DARK)
    .text(addr.fullName, 50, 158)
    .fillColor(MUTED)
    .text(addr.mobile, 50, 173)
    .text(addr.email, 50, 188)
    .text(addr.address, 50, 203, { width: 260 })
    .text(`${addr.city}, ${addr.state} - ${addr.pincode}`, 50, 232);

  doc
    .font("Bold")
    .fontSize(11)
    .fillColor(DARK)
    .text("Payment", 350, 140, { width: 195, align: "right" });
  doc
    .font("Regular")
    .fontSize(10)
    .fillColor(MUTED)
    .text(`Method: ${order.paymentMethod.toUpperCase()}`, 350, 158, { width: 195, align: "right" })
    .text(`Payment Status: ${order.paymentStatus}`, 350, 173, { width: 195, align: "right" })
    .text(`Order Status: ${order.orderStatus}`, 350, 188, { width: 195, align: "right" });

  // Product table
  let y = 265;
  doc.rect(50, y, 495, 22).fill("#f0fdf4");
  doc
    .font("Bold")
    .fontSize(10)
    .fillColor(BRAND_GREEN)
    .text("Product", 60, y + 6)
    .text("Qty", 330, y + 6, { width: 50, align: "right" })
    .text("Price", 385, y + 6, { width: 70, align: "right" })
    .text("Total", 460, y + 6, { width: 75, align: "right" });

  y += 22;
  doc.font("Regular").fontSize(10).fillColor(DARK);

  order.products.forEach((item, idx) => {
    const rowHeight = 22;
    if (idx % 2 === 1) {
      doc.rect(50, y, 495, rowHeight).fill("#fafafa");
      doc.fillColor(DARK);
    }
    doc
      .text(item.name, 60, y + 6, { width: 260 })
      .text(String(item.quantity), 330, y + 6, { width: 50, align: "right" })
      .text(`Rs. ${item.price.toFixed(2)}`, 385, y + 6, { width: 70, align: "right" })
      .text(`Rs. ${(item.price * item.quantity).toFixed(2)}`, 460, y + 6, {
        width: 75,
        align: "right",
      });
    y += rowHeight;
  });

  doc.moveTo(50, y).lineTo(545, y).strokeColor(LINE).stroke();
  y += 15;

  // Summary
  const summaryRow = (label, value, opts = {}) => {
    doc
      .font(opts.bold ? "Bold" : "Regular")
      .fontSize(opts.bold ? 12 : 10)
      .fillColor(opts.bold ? BRAND_GREEN : MUTED)
      .text(label, 330, y, { width: 120, align: "right" })
      .fillColor(opts.bold ? BRAND_GREEN : DARK)
      .text(value, 460, y, { width: 75, align: "right" });
    y += opts.bold ? 22 : 18;
  };

  summaryRow("Subtotal", `Rs. ${order.subtotal.toFixed(2)}`);
  if (order.discount > 0) {
    summaryRow(
      `Discount${order.coupon ? ` (${order.coupon})` : ""}`,
      `- Rs. ${order.discount.toFixed(2)}`
    );
  }
  summaryRow(
    "Delivery",
    order.deliveryCharge === 0 ? "FREE" : `Rs. ${order.deliveryCharge.toFixed(2)}`
  );
  doc.moveTo(330, y).lineTo(545, y).strokeColor(LINE).stroke();
  y += 8;
  summaryRow("Grand Total", `Rs. ${order.total.toFixed(2)}`, { bold: true });

  if (order.gift) {
    // Strip emoji - the PDF's embedded text font (DejaVu Sans) has no glyphs
    // for them and would render a missing-glyph box instead.
    const giftText = order.gift.replace(/[^\x00-\x7F]/g, "").trim();
    y += 6;
    doc.font("Regular").fontSize(10).fillColor(BRAND_GREEN).text(`Gift included: ${giftText}`, 50, y);
    y += 18;
  }

  // Footer
  doc
    .font("Regular")
    .fontSize(9)
    .fillColor(MUTED)
    .text(
      "Thank you for shopping with SMT Grocery! For any questions about this order, please contact our support team.",
      50,
      720,
      { width: 495, align: "center" }
    );

  doc.end();
}
