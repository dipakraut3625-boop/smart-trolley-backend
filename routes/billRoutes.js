const express = require("express");
const router = express.Router();

const { generatePDF } = require("../services/pdfService");
const { sendWhatsApp } = require("../services/whatsappService");

// 🔥 TEMP DATABASE
let bills = [];

// ================= TROLLEY TRACKING =================
let trolleys = {};

/* =========================
   CREATE BILL (FINAL)
========================= */
router.post("/create-bill", async (req, res) => {
  try {
    const { items } = req.body;

    const bill = {
      id: Date.now(),
      time: new Date(),
      items
    };

    // ✅ SAVE BILL
    bills.push(bill);

    console.log("Saved Bills:", bills);

    // ✅ GENERATE PDF
    const filePath = await generatePDF(bill);
    console.log("PDF Generated:", filePath);

    // ✅ LIVE UPDATE
    req.app.get("io").emit("new-bill", bill);

    res.json({
      success: true,
      billId: bill.id,
      url: `/bill/${bill.id}`,
      pdf: `/bills/bill-${bill.id}.pdf`
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Failed to create bill" });
  }
});

/* =========================
   GET SINGLE BILL
========================= */
router.get("/bill/:id", (req, res) => {
  const bill = bills.find(b => b.id == req.params.id);

  if (!bill) {
    return res.status(404).json({ error: "Bill not found" });
  }

  res.json(bill);
});

/* =========================
   GET ALL BILLS (ADMIN)
========================= */
router.get("/bills", (req, res) => {
  res.json(bills);
});

/* =========================
   SEND WHATSAPP BILL
========================= */
router.post("/send-whatsapp", async (req, res) => {
  try {
    const { id, phone, name } = req.body;

    const bill = bills.find(b => b.id == id);

    if (!bill) {
      return res.status(404).json({ error: "Bill not found" });
    }

    // ✅ attach customer name
    bill.customerName = name;

    // ✅ generate fresh PDF with name
    const filePath = await generatePDF(bill);

    const path = require("path");
    const fileName = path.basename(filePath);

    // ✅ send WhatsApp
    await sendWhatsApp(phone, fileName);

    res.json({ success: true });

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Failed to send WhatsApp" });
  }
});

/* =========================
   TROLLEY UPDATE
========================= */
router.get("/trolley-update", (req, res) => {
  const { trolleyId } = req.query;

  trolleys[trolleyId] = {
    lastActive: new Date()
  };

  req.app.get("io").emit("trolley-update", trolleys);

  res.send("Trolley Updated");
});

/* =========================
   GET TROLLEYS
========================= */
router.get("/trolleys", (req, res) => {
  res.json(trolleys);
});

module.exports = router;