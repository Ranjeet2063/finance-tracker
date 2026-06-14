const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const Transaction = require('../models/Transaction');

const exportToPDF = async (userId, filters = {}) => {
  return new Promise(async (resolve, reject) => {
    try {
      const query = { user: userId };
      if (filters.type) query.type = filters.type;
      if (filters.startDate || filters.endDate) {
        query.date = {};
        if (filters.startDate) query.date.$gte = new Date(filters.startDate);
        if (filters.endDate) query.date.$lte = new Date(filters.endDate);
      }

      const transactions = await Transaction.find(query).sort({ date: -1 }).lean();

      const doc = new PDFDocument({ margin: 50 });
      const chunks = [];

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.fontSize(20).text('Finance Report', { align: 'center' });
      doc.moveDown();
      doc.fontSize(10).text(`Generated: ${new Date().toLocaleDateString()}`, { align: 'center' });
      doc.moveDown(2);

      const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

      doc.fontSize(14).text(`Total Income: $${totalIncome.toFixed(2)}`);
      doc.text(`Total Expenses: $${totalExpenses.toFixed(2)}`);
      doc.text(`Net Savings: $${(totalIncome - totalExpenses).toFixed(2)}`);
      doc.moveDown(2);

      doc.fontSize(12).text('Transactions', { underline: true });
      doc.moveDown();

      transactions.forEach(t => {
        doc.fontSize(9)
          .text(`${t.date.toISOString().slice(0, 10)} | ${t.type.toUpperCase()} | ${t.category} | $${t.amount.toFixed(2)}${t.description ? ' | ' + t.description : ''}`);
      });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

const exportToExcel = async (userId, filters = {}) => {
  const query = { user: userId };
  if (filters.type) query.type = filters.type;
  if (filters.startDate || filters.endDate) {
    query.date = {};
    if (filters.startDate) query.date.$gte = new Date(filters.startDate);
    if (filters.endDate) query.date.$lte = new Date(filters.endDate);
  }

  const transactions = await Transaction.find(query).sort({ date: -1 }).lean();

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Finance Report');

  sheet.columns = [
    { header: 'Date', key: 'date', width: 15 },
    { header: 'Type', key: 'type', width: 10 },
    { header: 'Category', key: 'category', width: 15 },
    { header: 'Amount', key: 'amount', width: 12 },
    { header: 'Description', key: 'description', width: 40 },
    { header: 'Tags', key: 'tags', width: 20 }
  ];

  transactions.forEach(t => {
    sheet.addRow({
      date: t.date.toISOString().slice(0, 10),
      type: t.type,
      category: t.category,
      amount: t.amount,
      description: t.description,
      tags: (t.tags || []).join(', ')
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
};

module.exports = { exportToPDF, exportToExcel };
