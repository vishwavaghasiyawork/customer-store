import reportService from '../services/reportService.js';
import fs from 'fs';
import path from 'path';

export const generateSalesReport = async (req, res) => {
  try {
    const { startDate, endDate, status, format = 'csv' } = req.query;

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

    // Always return JSON with download link
    res.status(200).json({
      success: true,
      data: {
        filename: report.filename,
        totalOrders: report.totalOrders,
        summary: report.summary,
        generatedAt: report.generatedAt,
        downloadUrl: `http://localhost:3001/api/reports/download/${report.filename}`,
        fileSize: fs.statSync(report.filePath).size
      },
      message: 'Sales report generated successfully'
    });
  } catch (error) {
    console.error('Error generating sales report:', error.message);
    
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate sales report'
    });
  }
};

export const downloadReport = async (req, res) => {
  try {
    const { filename } = req.params;

    if (!filename) {
      return res.status(400).json({
        success: false,
        error: 'Filename is required'
      });
    }

    // Security: Validate filename to prevent directory traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid filename'
      });
    }

    const filePath = path.join(process.cwd(), 'reports', filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: 'Report file not found'
      });
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Error downloading report:', error.message);
    
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to download report'
    });
  }
};

export const getReportList = async (req, res) => {
  try {
    const reports = await reportService.getReportList();
    
    res.status(200).json({
      success: true,
      data: reports,
      message: 'Report list retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting report list:', error.message);
    
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get report list'
    });
  }
};

export const deleteReport = async (req, res) => {
  try {
    const { filename } = req.params;

    if (!filename) {
      return res.status(400).json({
        success: false,
        error: 'Filename is required'
      });
    }

    // Security: Validate filename
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid filename'
      });
    }

    const deleted = await reportService.deleteReport(filename);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Report file not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Report deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting report:', error.message);
    
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete report'
    });
  }
};

// Helper function for date validation
function isValidDate(dateString) {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
}
