import { Router } from 'express';
import { generateCsvSalesReport, getCsvOrderStats } from '../controllers/csvReportController.js';

const router = Router();

// Generate filtered CSV sales report from CSV file
router.get('/generate', generateCsvSalesReport);

// Get CSV order statistics
router.get('/stats', getCsvOrderStats);

// List all available CSV files
router.get('/files', async (req, res) => {
  try {
    const fs = await import('fs');
    const path = await import('path');
    
    const dataDir = path.join(process.cwd(), 'data');
    
    if (!fs.existsSync(dataDir)) {
      return res.status(200).json({
        success: true,
        data: [],
        message: 'No CSV files found'
      });
    }

    const files = fs.readdirSync(dataDir)
      .filter(file => file.endsWith('.csv'))
      .map(file => {
        const filePath = path.join(dataDir, file);
        const stats = fs.statSync(filePath);
        
        return {
          filename: file,
          fileUrl: `http://localhost:3001/data/${file}`,
          size: stats.size,
          createdAt: stats.birthtime,
          modifiedAt: stats.mtime
        };
      })
      .sort((a, b) => b.createdAt - a.createdAt);

    res.status(200).json({
      success: true,
      data: files,
      message: 'CSV files retrieved successfully'
    });
  } catch (error) {
    console.error('Error listing CSV files:', error.message);
    
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to list CSV files'
    });
  }
});

export default router;
