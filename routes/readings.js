const express = require("express");
const router = express.Router();
const Customer = require("../models/Customer");
const Reading = require("../models/Reading");
const puppeteer = require("puppeteer");
const TelegramBot = require("node-telegram-bot-api");

// Initialize Telegram Bot
const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: false });

// មុខងារបង្កើត PDF ជាភាសាខ្មែរ
const generatePDF = async (htmlContent) => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();
  await page.setContent(htmlContent, { waitUntil: "networkidle0" });
  const pdfBuffer = await page.pdf({ format: "A5", printBackground: true });
  await browser.close();
  return pdfBuffer;
};

// API សម្រាប់កត់កុងទ័រ និងគណនាលុយ (Record & Bill)
router.post("/record", async (req, res, next) => {
  try {
    const { customerId, newReading } = req.body;

    // Validation
    if (!customerId || newReading === undefined) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Please provide customerId and newReading",
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
    if (newReading < oldReading) {
      return res.status(400).json({
        success: false,
        message: "New reading cannot be strictly lower than old reading",
        details: { old: oldReading, new: newReading },
      });
    }

    // 2. គណនា Logic < 5 unit ឬ >= 5 unit
    const usage = newReading - oldReading;
    const pricePerUnit = usage < 5 ? 4000 : 3000;
    const totalAmount = usage * pricePerUnit;

    // 3. រក្សាទុកប្រវត្តិការកត់ត្រា
    const newRecord = new Reading({
      customer: customerId,
      old_reading: oldReading,
      new_reading: newReading,
      usage: usage,
      total_price: totalAmount,
      // date will be auto-set by default
    });
    await newRecord.save();

    // 4. Update លេខកុងទ័រចុងក្រោយរបស់អតិថិជនសម្រាប់ខែក្រោយ
    customer.last_reading = newReading;
    await customer.save();

    // 5. បង្កើត PDF និងផ្ញើទៅ Telegram
    const htmlLayout = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body {
                        font-family: 'Khmer OS Battambang', 'Khmer OS Siemreap', sans-serif;
                        padding: 20px;
                    }
                    h2 {
                        text-align: center;
                        color: #333;
                        border-bottom: 2px solid #4CAF50;
                        padding-bottom: 10px;
                    }
                    .info {
                        margin: 15px 0;
                        font-size: 14px;
                    }
                    .total {
                        margin-top: 20px;
                        padding: 15px;
                        background-color: #f0f0f0;
                        border-radius: 5px;
                    }
                    .total h3 {
                        color: #d32f2f;
                        margin: 0;
                        font-size: 18px;
                    }
                    .date {
                        text-align: right;
                        font-size: 12px;
                        color: #666;
                    }
                </style>
            </head>
            <body>
                <h2>វិក្កយបត្របង់ប្រាក់</h2>
                <div class="date">កាលបរិច្ឆេទ៖ ${new Date().toLocaleDateString(
      "km-KH"
    )}</div>
                <div class="info">
                    <p><strong>អតិថិជន៖</strong> ${customer.name}</p>
                    <p><strong>លេខកុងទ័រចាស់៖</strong> ${oldReading} Unit</p>
                    <p><strong>លេខកុងទ័រថ្មី៖</strong> ${newReading} Unit</p>
                    <p><strong>ប្រើអស់៖</strong> ${usage} Unit</p>
                    <p><strong>តម្លៃក្នុងមួយ Unit៖</strong> ${pricePerUnit.toLocaleString()} រៀល</p>
                </div>
                <div class="total">
                    <h3>សរុប៖ ${totalAmount.toLocaleString()} រៀល</h3>
                </div>
            </body>
            </html>
        `;

    try {
      const pdfFile = await generatePDF(htmlLayout);

      // ផ្ញើឯកសារ PDF ទៅ Telegram
      await bot.sendDocument(
        process.env.MOM_CHAT_ID,
        pdfFile,
        {
          caption: `វិក្កយបត្ររបស់៖ ${customer.name
            }\nសរុប៖ ${totalAmount.toLocaleString()} រៀល`,
        },
        {
          filename: `Receipt_${customer.name}_${Date.now()}.pdf`,
          contentType: "application/pdf",
        }
      );

      console.log(`✅ PDF sent to Telegram for ${customer.name}`);
    } catch (telegramError) {
      console.error("⚠️ Failed to send to Telegram:", telegramError.message);
      // Continue even if Telegram fails
    }

    res.json({
      success: true,
      message: "ជោគជ័យ! PDF បានផ្ញើទៅ Telegram រួចរាល់!",
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

// ទាញយកវិក្កយបត្រចុងក្រោយបង្អស់សម្រាប់ Print
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
