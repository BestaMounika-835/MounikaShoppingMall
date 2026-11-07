
const express = require("express");
const mysql = require("mysql8");
const path = require("path");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// DATABASE CONNECTION
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "Mounika",
    database: "mounika_shopping"
});

db.connect((err) => {
    if (err) {
        console.log("Database connection failed:", err.message);
    } else {
        console.log("MySQL Connected Successfully!");
    }
});

// HOME
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ================= USERS =================

// GET USERS
app.get("/api/users", (req, res) => {
    db.query(
        "SELECT user_id,name,email,phone,role FROM users",
        (err, result) => {
            if (err) return res.status(500).json({ message: err.message });
            res.json(result);
        }
    );
});

// REGISTER USER
app.post("/api/users", (req, res) => {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ message: "Fill all required fields" });
    }

    const sql = `INSERT INTO users
    (name,email,password,phone,role)
    VALUES (?,?,?,?, 'Customer')`;

    db.query(sql, [name, email, password, phone], (err, result) => {
        if (err) return res.status(400).json({ message: err.message });

        res.json({ message: "Registration successful!" });
    });
});

// ================= PRODUCTS =================

// GET ALL PRODUCTS
app.get("/api/products", (req, res) => {
    db.query("SELECT * FROM products ORDER BY product_id DESC",
        (err, result) => {
            if (err) return res.status(500).json({ message: err.message });
            res.json(result);
        }
    );
});

// GET PRODUCT BY ID
app.get("/api/products/:id", (req, res) => {
    db.query(
        "SELECT * FROM products WHERE product_id=?",
        [req.params.id],
        (err, result) => {
            if (err) return res.status(500).json({ message: err.message });

            if (result.length === 0) {
                return res.status(404).json({ message: "Product not found" });
            }

            res.json(result[0]);
        }
    );
});

// ADD PRODUCT
app.post("/api/products", (req, res) => {
    const { product_name, category, price, description, stock } = req.body;

    const sql = `INSERT INTO products
    (product_name,category,price,description,stock)
    VALUES (?,?,?,?,?)`;

    db.query(sql, [
        product_name, category, price, description, stock
    ], (err, result) => {
        if (err) return res.status(400).json({ message: err.message });

        res.json({ message: "Product added successfully!" });
    });
});

// UPDATE PRODUCT
app.put("/api/products/:id", (req, res) => {
    const { product_name, category, price, description, stock } = req.body;

    const sql = `UPDATE products SET
    product_name=?, category=?, price=?,
    description=?, stock=?
    WHERE product_id=?`;

    db.query(sql, [
        product_name, category, price,
        description, stock, req.params.id
    ], (err, result) => {
        if (err) return res.status(400).json({ message: err.message });

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Product not found" });
        }

        res.json({ message: "Product updated successfully!" });
    });
});

// DELETE PRODUCT
app.delete("/api/products/:id", (req, res) => {
    db.query(
        "DELETE FROM products WHERE product_id=?",
        [req.params.id],
        (err, result) => {
            if (err) return res.status(400).json({ message: err.message });

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: "Product not found" });
            }

            res.json({ message: "Product deleted successfully!" });
        }
    );
});

// ================= CART =================

// GET CART
app.get("/api/cart/:userId", (req, res) => {
    const sql = `SELECT
        c.cart_id, c.user_id, c.product_id, c.quantity,
        c.added_date, p.product_name, p.category,
        p.price, (p.price * c.quantity) AS subtotal
        FROM cart c
        JOIN products p ON c.product_id=p.product_id
        WHERE c.user_id=?`;

    db.query(sql, [req.params.userId], (err, result) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json(result);
    });
});

// ADD TO CART
app.post("/api/cart", (req, res) => {
    const { user_id, product_id, quantity } = req.body;

    if (!user_id || !product_id || !quantity || quantity < 1) {
        return res.status(400).json({ message: "Invalid cart details" });
    }

    db.query(
        "SELECT stock FROM products WHERE product_id=?",
        [product_id],
        (err, product) => {
            if (err) return res.status(500).json({ message: err.message });

            if (!product.length) {
                return res.status(404).json({ message: "Product not found" });
            }

            if (quantity > product[0].stock) {
                return res.status(400).json({ message: "Insufficient stock" });
            }

            db.query(
                `INSERT INTO cart (user_id,product_id,quantity)
                 VALUES (?,?,?)`,
                [user_id, product_id, quantity],
                (err, result) => {
                    if (err) return res.status(400).json({ message: err.message });

                    res.json({ message: "Product added to cart!" });
                }
            );
        }
    );
});

// UPDATE CART QUANTITY
app.put("/api/cart/:id", (req, res) => {
    const { quantity } = req.body;

    if (!quantity || quantity < 1) {
        return res.status(400).json({ message: "Invalid quantity" });
    }

    db.query(
        `UPDATE cart c
         JOIN products p ON c.product_id=p.product_id
         SET c.quantity=?
         WHERE c.cart_id=? AND ? <= p.stock`,
        [quantity, req.params.id, quantity],
        (err, result) => {
            if (err) return res.status(400).json({ message: err.message });

            if (!result.affectedRows) {
                return res.status(400).json({
                    message: "Cart not updated. Check quantity and stock."
                });
            }

            res.json({ message: "Cart updated successfully!" });
        }
    );
});

// DELETE CART ITEM
app.delete("/api/cart/:id", (req, res) => {
    db.query(
        "DELETE FROM cart WHERE cart_id=?",
        [req.params.id],
        (err, result) => {
            if (err) return res.status(400).json({ message: err.message });
            res.json({ message: "Cart item deleted!" });
        }
    );
});

// ================= ORDERS =================

// GET ALL ORDERS
app.get("/api/orders", (req, res) => {
    const sql = `SELECT o.*, u.name, u.email
                 FROM orders o
                 JOIN users u ON o.user_id=u.user_id
                 ORDER BY o.order_id DESC`;

    db.query(sql, (err, result) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json(result);
    });
});

// PLACE ORDER FROM CART
app.post("/api/orders", (req, res) => {
    const { user_id } = req.body;

    if (!user_id) {
        return res.status(400).json({ message: "Select customer" });
    }

    const sql = `SELECT c.cart_id, c.product_id, c.quantity,
                 p.price, p.stock
                 FROM cart c
                 JOIN products p ON c.product_id=p.product_id
                 WHERE c.user_id=?`;

    db.query(sql, [user_id], (err, items) => {
        if (err) return res.status(500).json({ message: err.message });

        if (!items.length) {
            return res.status(400).json({ message: "Your cart is empty" });
        }

        for (const item of items) {
            if (item.quantity > item.stock) {
                return res.status(400).json({
                    message: "Insufficient stock for product ID " + item.product_id
                });
            }
        }

        const total = items.reduce(
            (sum, item) => sum + Number(item.price) * item.quantity, 0
        );

        db.query(
            `INSERT INTO orders (user_id,total_amount)
             VALUES (?,?)`,
            [user_id, total],
            (err, orderResult) => {
                if (err) return res.status(400).json({ message: err.message });

                let completed = 0;
                let failed = false;

                items.forEach(item => {
                    db.query(
                        `UPDATE products
                         SET stock=stock-?
                         WHERE product_id=? AND stock>=?`,
                        [item.quantity, item.product_id, item.quantity],
                        (err, result) => {
                            if (failed) return;

                            if (err || result.affectedRows === 0) {
                                failed = true;
                                return res.status(400).json({
                                    message: "Stock update failed. Please check stock."
                                });
                            }

                            completed++;

                            if (completed === items.length) {
                                db.query(
                                    "DELETE FROM cart WHERE user_id=?",
                                    [user_id],
                                    (err) => {
                                        if (err) {
                                            return res.status(500).json({
                                                message: err.message
                                            });
                                        }

                                        res.json({
                                            message: "Order placed successfully!",
                                            order_id: orderResult.insertId,
                                            total_amount: total
                                        });
                                    }
                                );
                            }
                        }
                    );
                });
            }
        );
    });
});

// UPDATE ORDER STATUS
app.put("/api/orders/:id", (req, res) => {
    const { status } = req.body;

    const allowed = [
        "Pending", "Processing", "Shipped",
        "Delivered", "Cancelled"
    ];

    if (!allowed.includes(status)) {
        return res.status(400).json({ message: "Invalid order status" });
    }

    db.query(
        "UPDATE orders SET status=? WHERE order_id=?",
        [status, req.params.id],
        (err, result) => {
            if (err) return res.status(400).json({ message: err.message });
            res.json({ message: "Order status updated!" });
        }
    );
});

// START SERVER
app.listen(3000, () => {
    console.log("Server running at http://localhost:3000");
});
