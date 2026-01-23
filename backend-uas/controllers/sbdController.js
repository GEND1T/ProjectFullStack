const db = require('../config/database');

  
exports.getBestSellingProductLastYear = async (req, res) => {
    try {
    const query = `
      SELECT PRODUCT_NAME, total_beli
  FROM (
      SELECT 
          p.PRODUCT_NAME,
          SUM(od.QTY) AS total_beli
      FROM orders o
      INNER JOIN order_details od ON o.ORDER_ID = od.ORDER_ID
      INNER JOIN products p ON od.PRODUCT_ID = p.PRODUCT_ID
      WHERE YEAR(o.ORDER_DATE) = YEAR(CURDATE()) - 1
      GROUP BY p.PRODUCT_ID, p.PRODUCT_NAME
  ) AS subquery_produk
  WHERE total_beli = (
      SELECT MAX(total_beli)
      FROM (
          SELECT 
              SUM(od.QTY) AS total_beli
          FROM orders o
          INNER JOIN order_details od ON o.ORDER_ID = od.ORDER_ID
          WHERE YEAR(o.ORDER_DATE) = YEAR(CURDATE()) - 1
          GROUP BY od.PRODUCT_ID
      ) AS max_produk
  );
    `;
  
    const [rows] = await db.query(query);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error });
    }
};

exports.getTopCustomersLastYear = async (req, res) => {
    try {
    const query = `
      SELECT CUST_NAME, total_order
  FROM (
      SELECT 
          c.CUST_NAME,
          COUNT(o.ORDER_ID) AS total_order
      FROM orders o
      INNER JOIN customers c ON o.CUST_ID = c.CUST_ID
      WHERE YEAR(o.ORDER_DATE) = YEAR(CURDATE()) - 1
      GROUP BY c.CUST_ID, c.CUST_NAME
  ) AS subquery_order
  WHERE total_order = (
      SELECT MAX(total_order)
      FROM (
          SELECT 
              COUNT(ORDER_ID) AS total_order
          FROM orders
          WHERE YEAR(ORDER_DATE) = YEAR(CURDATE()) - 1
          GROUP BY CUST_ID
      ) AS max_order
  );
    `;
  
    const [rows] = await db.query(query);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error });
    }
};


exports.getTopOrderValueLastYear = async (req, res) => {
    try {
    const query = `
      SELECT CUST_NAME, total_belanja
  FROM (
      SELECT 
          c.CUST_NAME,
          SUM(o.TOTAL) AS total_belanja
      FROM orders o
      INNER JOIN customers c ON o.CUST_ID = c.CUST_ID
      WHERE YEAR(o.ORDER_DATE) = YEAR(CURDATE()) - 1
      GROUP BY c.CUST_ID, c.CUST_NAME
  ) AS subquery_belanja
  WHERE total_belanja = (
      SELECT MAX(total_belanja)
      FROM (
          SELECT 
              SUM(TOTAL) AS total_belanja
          FROM orders
          WHERE YEAR(ORDER_DATE) = YEAR(CURDATE()) - 1
          GROUP BY CUST_ID
      ) AS max_belanja
  );
    `;
  
    const [rows] = await db.query(query);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error });
    }
};

exports.getTopItemBuyersLastYear = async (req, res) => {
    try {
    const query = `
      SELECT CUST_NAME, total_item
  FROM (
      SELECT 
          c.CUST_NAME,
          SUM(od.QTY) AS total_item
      FROM orders o
      INNER JOIN order_details od ON o.ORDER_ID = od.ORDER_ID
      INNER JOIN customers c ON o.CUST_ID = c.CUST_ID
      WHERE YEAR(o.ORDER_DATE) = YEAR(CURDATE()) - 1
      GROUP BY c.CUST_ID, c.CUST_NAME
  ) AS subquery_item
  WHERE total_item = (
      SELECT MAX(total_item)
      FROM (
          SELECT 
              SUM(od.QTY) AS total_item
          FROM orders o
          INNER JOIN order_details od ON o.ORDER_ID = od.ORDER_ID
          WHERE YEAR(o.ORDER_DATE) = YEAR(CURDATE()) - 1
          GROUP BY o.CUST_ID
      ) AS max_item);
    `;
  
    const [rows] = await db.query(query);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error });
    }
};

exports.getTop10BestSellingProductsLastYear = async (req, res) => {
    try {
    const query = `
      SELECT PRODUCT_NAME, total_beli
      FROM (
          SELECT 
              p.PRODUCT_NAME,
              SUM(od.QTY) AS total_beli
          FROM orders o
          INNER JOIN order_details od 
              ON o.ORDER_ID = od.ORDER_ID
          INNER JOIN products p 
              ON od.PRODUCT_ID = p.PRODUCT_ID
          WHERE YEAR(o.ORDER_DATE) = YEAR(CURDATE()) - 1
          GROUP BY p.PRODUCT_ID, p.PRODUCT_NAME
          ORDER BY total_beli DESC
          LIMIT 10
      ) AS subquery_produk
    `;
  
    const [rows] = await db.query(query);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error });
    }
};

exports.getMonthlyProfitByProduct = async (req, res) => {
    try {
    const query = `
      SELECT product_name,
  
      SUM(CASE WHEN MONTH(o.order_date) = 1  THEN od.qty * od.price END) AS Januari,
      SUM(CASE WHEN MONTH(o.order_date) = 2  THEN od.qty * od.price END) AS Februari,
      SUM(CASE WHEN MONTH(o.order_date) = 3  THEN od.qty * od.price END) AS Maret,
      SUM(CASE WHEN MONTH(o.order_date) = 4  THEN od.qty * od.price END) AS April,
      SUM(CASE WHEN MONTH(o.order_date) = 5  THEN od.qty * od.price END) AS Mei,
      SUM(CASE WHEN MONTH(o.order_date) = 6  THEN od.qty * od.price END) AS Juni,
      SUM(CASE WHEN MONTH(o.order_date) = 7  THEN od.qty * od.price END) AS Juli,
      SUM(CASE WHEN MONTH(o.order_date) = 8  THEN od.qty * od.price END) AS Agustus,
      SUM(CASE WHEN MONTH(o.order_date) = 9  THEN od.qty * od.price END) AS September,
      SUM(CASE WHEN MONTH(o.order_date) = 10 THEN od.qty * od.price END) AS Oktober,
      SUM(CASE WHEN MONTH(o.order_date) = 11 THEN od.qty * od.price END) AS November,
      SUM(CASE WHEN MONTH(o.order_date) = 12 THEN od.qty * od.price END) AS Desember
  
      FROM orders o
      INNER JOIN order_details od ON o.order_id = od.order_id
      INNER JOIN products p ON od.product_id = p.product_id
      INNER JOIN product_categories pc ON p.category_id = pc.category_id
      WHERE YEAR(o.order_date) = YEAR(CURDATE()) - 1
      GROUP BY p.product_id, p.product_name
      ORDER BY p.product_name;
    `;
  
    const [rows] = await db.query(query);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error });
    }
};
  


exports.getMonthlySalesByProduct = async (req, res) => {
    try {
    const query = `
      SELECT product_name,
  
       SUM(CASE WHEN MONTH(o.order_date) = 1  THEN od.qty END) AS Januari,
       SUM(CASE WHEN MONTH(o.order_date) = 2  THEN od.qty END) AS Februari,
       SUM(CASE WHEN MONTH(o.order_date) = 3  THEN od.qty END) AS Maret,
       SUM(CASE WHEN MONTH(o.order_date) = 4  THEN od.qty END) AS April,
       SUM(CASE WHEN MONTH(o.order_date) = 5  THEN od.qty END) AS Mei,
       SUM(CASE WHEN MONTH(o.order_date) = 6  THEN od.qty END) AS Juni,
       SUM(CASE WHEN MONTH(o.order_date) = 7  THEN od.qty END) AS Juli,
       SUM(CASE WHEN MONTH(o.order_date) = 8  THEN od.qty END) AS Agustus,
       SUM(CASE WHEN MONTH(o.order_date) = 9  THEN od.qty END) AS September,
       SUM(CASE WHEN MONTH(o.order_date) = 10 THEN od.qty END) AS Oktober,
       SUM(CASE WHEN MONTH(o.order_date) = 11 THEN od.qty END) AS November,
       SUM(CASE WHEN MONTH(o.order_date) = 12 THEN od.qty END) AS Desember,
       SUM(od.qty) AS Total_Tahunan
       FROM orders o
       INNER JOIN order_details od ON o.order_id = od.order_id
       INNER JOIN products p ON od.product_id = p.product_id
       INNER JOIN product_categories pc ON p.category_id = pc.category_id
       WHERE YEAR(o.order_date) = YEAR(CURDATE()) - 1
       GROUP BY p.product_id, p.product_name
       ORDER BY p.product_name;
    `;
  
    const [rows] = await db.query(query);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error });
    }
};


exports.getMonthlyOrdersByCustomer = async (req, res) => {
    try {
    const query = `
      SELECT 
      c.CUST_NAME AS customer_name,
  
      SUM(CASE WHEN MONTH(o.order_date) = 1  THEN 1 ELSE 0 END) AS Januari,
      SUM(CASE WHEN MONTH(o.order_date) = 2  THEN 1 ELSE 0 END) AS Februari,
      SUM(CASE WHEN MONTH(o.order_date) = 3  THEN 1 ELSE 0 END) AS Maret,
      SUM(CASE WHEN MONTH(o.order_date) = 4  THEN 1 ELSE 0 END) AS April,
      SUM(CASE WHEN MONTH(o.order_date) = 5  THEN 1 ELSE 0 END) AS Mei,
      SUM(CASE WHEN MONTH(o.order_date) = 6  THEN 1 ELSE 0 END) AS Juni,
      SUM(CASE WHEN MONTH(o.order_date) = 7  THEN 1 ELSE 0 END) AS Juli,
      SUM(CASE WHEN MONTH(o.order_date) = 8  THEN 1 ELSE 0 END) AS Agustus,
      SUM(CASE WHEN MONTH(o.order_date) = 9  THEN 1 ELSE 0 END) AS September,
      SUM(CASE WHEN MONTH(o.order_date) = 10 THEN 1 ELSE 0 END) AS Oktober,
      SUM(CASE WHEN MONTH(o.order_date) = 11 THEN 1 ELSE 0 END) AS November,
      SUM(CASE WHEN MONTH(o.order_date) = 12 THEN 1 ELSE 0 END) AS Desember,
      COUNT(o.order_id) AS Total_Tahunan
  
      FROM orders o
      INNER JOIN customers c ON o.cust_id = c.cust_id
      WHERE YEAR(o.order_date) = YEAR(CURDATE()) - 1
      GROUP BY c.cust_id, c.CUST_NAME
      ORDER BY c.CUST_NAME;
    `;
  
    const [rows] = await db.query(query);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error });
    }
};


exports.getNominalOrderCustomerLastYear = async (req, res) => {
    try {
    const query = `
      SELECT
          c.CUST_NAME,
  
          SUM(CASE WHEN MONTH(o.ORDER_DATE) = 1  THEN o.TOTAL ELSE 0 END) AS Januari,
          SUM(CASE WHEN MONTH(o.ORDER_DATE) = 2  THEN o.TOTAL ELSE 0 END) AS Februari,
          SUM(CASE WHEN MONTH(o.ORDER_DATE) = 3  THEN o.TOTAL ELSE 0 END) AS Maret,
          SUM(CASE WHEN MONTH(o.ORDER_DATE) = 4  THEN o.TOTAL ELSE 0 END) AS April,
          SUM(CASE WHEN MONTH(o.ORDER_DATE) = 5  THEN o.TOTAL ELSE 0 END) AS Mei,
          SUM(CASE WHEN MONTH(o.ORDER_DATE) = 6  THEN o.TOTAL ELSE 0 END) AS Juni,
          SUM(CASE WHEN MONTH(o.ORDER_DATE) = 7  THEN o.TOTAL ELSE 0 END) AS Juli,
          SUM(CASE WHEN MONTH(o.ORDER_DATE) = 8  THEN o.TOTAL ELSE 0 END) AS Agustus,
          SUM(CASE WHEN MONTH(o.ORDER_DATE) = 9  THEN o.TOTAL ELSE 0 END) AS September,
          SUM(CASE WHEN MONTH(o.ORDER_DATE) = 10 THEN o.TOTAL ELSE 0 END) AS Oktober,
          SUM(CASE WHEN MONTH(o.ORDER_DATE) = 11 THEN o.TOTAL ELSE 0 END) AS November,
          SUM(CASE WHEN MONTH(o.ORDER_DATE) = 12 THEN o.TOTAL ELSE 0 END) AS Desember,
          
          SUM(o.TOTAL) AS Total_Tahunan
  
      FROM orders o
      INNER JOIN customers c ON o.CUST_ID = c.CUST_ID
      WHERE YEAR(o.ORDER_DATE) = YEAR(CURDATE()) - 1
      GROUP BY c.CUST_ID, c.CUST_NAME
      ORDER BY c.CUST_NAME
    `;
  
    const [rows] = await db.query(query);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error });
    }
};


exports.getMonthlyServiceLstYear = async (req, res) => {
    try {
    const query = `
      SELECT c.USERNAME AS cashier_name,
  
      SUM(CASE WHEN MONTH(o.ORDER_DATE) = 1  THEN 1 ELSE 0 END) AS Januari,
      SUM(CASE WHEN MONTH(o.ORDER_DATE) = 2  THEN 1 ELSE 0 END) AS Februari,
      SUM(CASE WHEN MONTH(o.ORDER_DATE) = 3  THEN 1 ELSE 0 END) AS Maret,
      SUM(CASE WHEN MONTH(o.ORDER_DATE) = 4  THEN 1 ELSE 0 END) AS April,
      SUM(CASE WHEN MONTH(o.ORDER_DATE) = 5  THEN 1 ELSE 0 END) AS Mei,
      SUM(CASE WHEN MONTH(o.ORDER_DATE) = 6  THEN 1 ELSE 0 END) AS Juni,
      SUM(CASE WHEN MONTH(o.ORDER_DATE) = 7  THEN 1 ELSE 0 END) AS Juli,
      SUM(CASE WHEN MONTH(o.ORDER_DATE) = 8  THEN 1 ELSE 0 END) AS Agustus,
      SUM(CASE WHEN MONTH(o.ORDER_DATE) = 9  THEN 1 ELSE 0 END) AS September,
      SUM(CASE WHEN MONTH(o.ORDER_DATE) = 10 THEN 1 ELSE 0 END) AS Oktober,
      SUM(CASE WHEN MONTH(o.ORDER_DATE) = 11 THEN 1 ELSE 0 END) AS November,
      SUM(CASE WHEN MONTH(o.ORDER_DATE) = 12 THEN 1 ELSE 0 END) AS Desember,
      COUNT(o.ORDER_ID) AS Total_Tahunan
  
      FROM orders o
      INNER JOIN cashiers c ON o.USER_ID = c.USER_ID
      WHERE YEAR(o.ORDER_DATE) = YEAR(CURDATE()) - 1
      GROUP BY c.USER_ID, c.USERNAME
      ORDER BY c.USERNAME;
    `;
  
    const [rows] = await db.query(query);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error });
    }
};
