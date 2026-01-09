const express = require("express");
const router = express.Router();
const multer = require("multer");
const TelegramBot = require("node-telegram-bot-api");
const Customer = require("../models/Customer");
const Reading = require("../models/Reading");

// Configure Multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Initialize Telegram Bot
const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: false });

// API សម្រាប់កត់កុងទ័រ និងគណនាលុយ (Record & Bill)
// Now accepts multipart/form-data with a 'pdfFile'
router.post("/record", upload.single("pdfFile"), async (req, res, next) => {
  try {
    const { customerId, newReading } = req.body;
    const pdfFile = req.file;

    // Validation
    if (!customerId || newReading === undefined) {
      return res.status(400).json({
        success: false,
        message: "Please provide customerId and newReading",
      });
    }

    if (!pdfFile) {
      return res.status(400).json({
        success: false,
        message: "Please attach the generated PDF file (field name: 'pdfFile')",
      });
    }

    // 1. រកអតិថិជន
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res
        .status(404)
        .json({ success: false, message: "រកមិនឃើញអតិថិជន" });
    }
    const oldReading = customer.last_reading;

    // Validation: New reading cannot be less than old reading
    // Note: parsed as float just in case, though usually mongoose handles usage
    const newReadingNum = parseFloat(newReading);

    if (newReadingNum < oldReading) {
      return res.status(400).json({
        success: false,
        message: "New reading cannot be strictly lower than old reading",
        details: { old: oldReading, new: newReadingNum },
      });
    }

    // 2. គណនា Logic < 5 unit ឬ >= 5 unit
    const usage = newReadingNum - oldReading;
    const pricePerUnit = usage < 5 ? 4000 : 3000;
    const totalAmount = usage * pricePerUnit;

    // 3. រក្សាទុកប្រវត្តិការកត់ត្រា
    const newRecord = new Reading({
      customer: customerId,
      old_reading: oldReading,
      new_reading: newReadingNum,
      usage: usage,
      total_price: totalAmount,
      // date will be auto-set by default
    });
    await newRecord.save();

    // 4. Update លេខកុងទ័រចុងក្រោយរបស់អតិថិជនសម្រាប់ខែក្រោយ
    customer.last_reading = newReadingNum;
    await customer.save();

    // 5. ផ្ញើ PDF ទៅ Telegram
    if (pdfFile) {
      try {
        console.log("Sending received PDF to Telegram...");

        // bot.sendDocument accepts a Buffer directly if specified with filename options
        await bot.sendDocument(
          process.env.MOM_CHAT_ID,
          pdfFile.buffer,
          {
            caption: `វិក្កយបត្ររបស់៖ ${customer.name}\nសរុប៖ ${totalAmount.toLocaleString()} រៀល`,
          },
          {
            filename: `Receipt_${customer.name}_${Date.now()}.pdf`,
            contentType: "application/pdf",
          }
        );

        console.log(`✅ PDF sent to Telegram for ${customer.name}`);
      } catch (telegramError) {
        console.error("⚠️ Failed to send to Telegram:", telegramError);
        // We continue even if Telegram fails, as the record is saved
      }
    }

    res.json({
      success: true,
      message: "ជោគជ័យ! ទិន្នន័យត្រូវបានរក្សាទុក និង PDF ត្រូវបានផ្ញើ (ប្រសិនបើមាន)!",
      data: newRecord,
    });
  } catch (err) {
    next(err);
  }
});

// មើលប្រវត្តិប្រើប្រាស់របស់អតិថិជនម្នាក់ៗ (History)
router.get("/history/:customerId", async (req, res, next) => {
  try {
    const history = await Reading.find({
      customer: req.params.customerId,
    }).sort({ date: -1 });
    res.json({ success: true, data: history });
  } catch (err) {
    next(err);
  }
});

// ទាញយកវិក្កយបត្រចុងក្រោយបង្អស់សម្រាប់ Print (Client-side usage)
router.get("/receipt/:customerId", async (req, res, next) => {
  try {
    const latestReading = await Reading.findOne({
      customer: req.params.customerId,
    })
      .sort({ date: -1 }) // យកអាថ្មីបំផុត
      .populate("customer"); // ទាញឈ្មោះអតិថិជនមកជាមួយ

    if (!latestReading) {
      return res
        .status(404)
        .json({ success: false, message: "No Receipt Found" });
    }

    res.json({ success: true, data: latestReading });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
