import { Router } from 'express';
import { generateSalesReport, downloadReport, getReportList, deleteReport } from '../controllers/reportController.js';
import reportService from '../services/reportService.js';
import fs from 'fs';

// Helper function for date validation
function isValidDate(dateString) {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
}

const router = Router();

// Generate sales report (returns JSON with download link)
router.get('/sales/generate', generateSalesReport);

// Generate and download CSV directly
router.get('/sales/download', async (req, res) => {
  try {
    const { startDate, endDate, status } = req.query;
    
    // Validate dates
    if (startDate && !isValidDate(startDate)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid start date format. Use YYYY-MM-DD format.'
      });
    }

    if (endDate && !isValidDate(endDate)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid end date format. Use YYYY-MM-DD format.'
      });
    }

    const report = await reportService.generateSalesReport(startDate, endDate, status);
    
    // Read the CSV file for direct download
    const csvData = fs.readFileSync(report.filePath, 'utf8');
    
    // Set appropriate headers for CSV download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${report.filename}"`);
    return res.send(csvData);
    
  } catch (error) {
    console.error('Error generating sales report for download:', error.message);
    
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate sales report'
    });
  }
});

// Download report file
router.get('/download/:filename', downloadReport);

// Get list of all reports
router.get('/list', getReportList);

// Delete a report
router.delete('/:filename', deleteReport);

export default router;
