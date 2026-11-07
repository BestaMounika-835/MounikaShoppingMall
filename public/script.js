
// COMMON API FUNCTION

async function api(url, method = "GET", data = null) {
    const options = { method };

    if (data !== null) {
        options.headers = { "Content-Type": "application/json" };
        options.body = JSON.stringify(data);
    }

    const response = await fetch(url, options);
    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.message || "Something went wrong");
    }

    return result;
}

function showError(error) {
    alert(error.message || "Something went wrong!");
}

function categoryImage(category) {
    const images = {
        "Clothing": "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=500",
        "Footwear": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500",
        "Accessories": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500",
        "Beauty": "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=500",
        "Home & Kitchen": "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=500",
        "Kids": "https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=500"
    };

    return images[category] ||
        "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=500";
}

// LOAD USERS INTO DROPDOWNS

async function loadUsers(ids) {
    const users = await api("/api/users");

    ids.forEach(id => {
        const select = document.getElementById(id);
        if (!select) return;

        select.innerHTML = '<option value="">Select Customer ID</option>';

        users.forEach(user => {
            const option = document.createElement("option");
            option.value = user.user_id;
            option.textContent = user.user_id + " - " + user.name;
            select.appendChild(option);
        });
    });

    return users;
}

// LOAD PRODUCTS INTO DROPDOWNS

async function loadProductOptions(ids) {
    const products = await api("/api/products");

    ids.forEach(id => {
        const select = document.getElementById(id);
        if (!select) return;

        select.innerHTML = '<option value="">Select Product ID</option>';

        products.forEach(product => {
            const option = document.createElement("option");
            option.value = product.product_id;
            option.textContent =
                product.product_id + " - " + product.product_name;
            select.appendChild(option);
        });
    });

    return products;
}

// ================= HOME PAGE =================

const registerForm = document.getElementById("registerForm");

if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const data = {
            name: document.getElementById("name").value,
            email: document.getElementById("email").value,
            password: document.getElementById("password").value,
            phone: document.getElementById("phone").value
        };

        try {
            const result = await api("/api/users", "POST", data);
            alert(result.message);
            registerForm.reset();
        } catch (error) {
            showError(error);
        }
    });
}

// ================= PRODUCTS PAGE =================

const productList = document.getElementById("productList");

let allProducts = [];

async function displayProducts() {
    if (!productList) return;

    try {
        allProducts = await api("/api/products");
        renderProducts(allProducts);
    } catch (error) {
        showError(error);
    }
}

function renderProducts(products) {
    productList.innerHTML = "";

    if (products.length === 0) {
        productList.innerHTML = "<p>No products available.</p>";
        return;
    }

    products.forEach(product => {
        const card = document.createElement("div");
        card.className = "product-card";

        const img = document.createElement("img");
        img.src = categoryImage(product.category);
        img.alt = product.product_name;

        const info = document.createElement("div");
        info.className = "product-info";

        const title = document.createElement("h3");
        title.textContent = product.product_name;

        const category = document.createElement("p");
        category.textContent = "Category: " + product.category;

        const price = document.createElement("p");
        price.className = "price";
        price.textContent = "₹" + Number(product.price).toFixed(2);

        const stock = document.createElement("p");
        stock.textContent = "Stock: " + product.stock;

        const button = document.createElement("button");
        button.className = "btn";
        button.textContent = "Select Product";

        button.addEventListener("click", () => {
            document.getElementById("shopProductId").value =
                product.product_id;

            fillShopProduct();
            document.getElementById("shopQuantity").value = 1;

            document.getElementById("shopUserId").focus();
            document.getElementById("addCartForm").scrollIntoView();
        });

        info.append(title, category, price, stock, button);
        card.append(img, info);
        productList.appendChild(card);
    });
}

const categoryFilter = document.getElementById("categoryFilter");

if (categoryFilter) {
    categoryFilter.addEventListener("change", () => {
        const category = categoryFilter.value;

        const filtered = category
            ? allProducts.filter(p => p.category === category)
            : allProducts;

        renderProducts(filtered);
    });
}

// PRODUCT DROPDOWN AUTOMATIC FILL

async function fillShopProduct() {
    const id = document.getElementById("shopProductId")?.value;
    if (!id) return;

    try {
        const p = await api("/api/products/" + id);

        document.getElementById("shopProductName").value = p.product_name;
        document.getElementById("shopPrice").value = p.price;
        document.getElementById("shopStock").value = p.stock;

        document.getElementById("shopQuantity").max = p.stock;
    } catch (error) {
        showError(error);
    }
}

const shopProductId = document.getElementById("shopProductId");

if (shopProductId) {
    shopProductId.addEventListener("change", fillShopProduct);
}

// ADD PRODUCT TO CART FROM PRODUCTS PAGE

const addCartForm = document.getElementById("addCartForm");

if (addCartForm) {
    addCartForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        try {
            const result = await api("/api/cart", "POST", {
                user_id: document.getElementById("shopUserId").value,
                product_id: document.getElementById("shopProductId").value,
                quantity: Number(document.getElementById("shopQuantity").value)
            });

            alert(result.message);
            addCartForm.reset();

            document.getElementById("shopProductName").value = "";
            document.getElementById("shopPrice").value = "";
            document.getElementById("shopStock").value = "";
        } catch (error) {
            showError(error);
        }
    });
}

// ================= CART PAGE =================

// CUSTOMER DETAILS

async function fillCustomer(userId, nameId, emailId) {
    if (!userId) return;

    try {
        const users = await api("/api/users");
        const user = users.find(u => String(u.user_id) === String(userId));

        if (user) {
            if (nameId) document.getElementById(nameId).value = user.name;
            if (emailId) document.getElementById(emailId).value = user.email;
        }
    } catch (error) {
        showError(error);
    }
}

const cartUserId = document.getElementById("cartUserId");

if (cartUserId) {
    cartUserId.addEventListener("change", () => {
        fillCustomer(
            cartUserId.value,
            "cartCustomerName",
            "cartCustomerEmail"
        );
    });
}

// CART PRODUCT DETAILS

const cartProductId = document.getElementById("cartProductId");

if (cartProductId) {
    cartProductId.addEventListener("change", async () => {
        const id = cartProductId.value;
        if (!id) return;

        try {
            const p = await api("/api/products/" + id);

            document.getElementById("cartProductName").value = p.product_name;
            document.getElementById("cartPrice").value = p.price;
            document.getElementById("cartQuantity").max = p.stock;
        } catch (error) {
            showError(error);
        }
    });
}

// ADD CART ITEM

const cartForm = document.getElementById("cartForm");

if (cartForm) {
    cartForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        try {
            const result = await api("/api/cart", "POST", {
                user_id: cartUserId.value,
                product_id: cartProductId.value,
                quantity: Number(document.getElementById("cartQuantity").value)
            });

            alert(result.message);
            cartForm.reset();

            document.getElementById("cartCustomerName").value = "";
            document.getElementById("cartCustomerEmail").value = "";
            document.getElementById("cartProductName").value = "";
            document.getElementById("cartPrice").value = "";
        } catch (error) {
            showError(error);
        }
    });
}

// VIEW CART

const viewCartUserId = document.getElementById("viewCartUserId");

async function displayCart() {
    if (!viewCartUserId?.value) {
        document.getElementById("cartTable").innerHTML = "";
        document.getElementById("cartTotal").textContent = "Total: ₹0";
        return;
    }

    try {
        const items = await api("/api/cart/" + viewCartUserId.value);
        const table = document.getElementById("cartTable");

        table.innerHTML = "";

        let total = 0;

        items.forEach(item => {
            total += Number(item.subtotal);

            const row = document.createElement("tr");

            const values = [
                item.cart_id,
                item.product_name,
                item.category,
                "₹" + item.price,
                item.quantity,
                "₹" + Number(item.subtotal).toFixed(2)
            ];

            values.forEach(value => {
                const td = document.createElement("td");
                td.textContent = value;
                row.appendChild(td);
            });

            const action = document.createElement("td");

            const update = document.createElement("button");
            update.textContent = "Update";
            update.className = "btn update";

            update.onclick = async () => {
                const quantity = prompt("Enter new quantity:", item.quantity);
                if (quantity === null) return;

                const qty = Number(quantity);
                if (!Number.isInteger(qty) || qty < 1) {
                    alert("Enter a valid quantity");
                    return;
                }

                try {
                    const result = await api(
                        "/api/cart/" + item.cart_id,
                        "PUT",
                        { quantity: qty }
                    );
                    alert(result.message);
                    displayCart();
                } catch (error) {
                    showError(error);
                }
            };

            const remove = document.createElement("button");
            remove.textContent = "Delete";
            remove.className = "btn delete";

            remove.onclick = async () => {
                if (!confirm("Delete this cart item?")) return;

                try {
                    const result = await api(
                        "/api/cart/" + item.cart_id,
                        "DELETE"
                    );
                    alert(result.message);
                    displayCart();
                } catch (error) {
                    showError(error);
                }
            };

            action.append(update, remove);
            row.appendChild(action);
            table.appendChild(row);
        });

        document.getElementById("cartTotal").textContent =
            "Total: ₹" + total.toFixed(2);

    } catch (error) {
        showError(error);
    }
}

if (viewCartUserId) {
    viewCartUserId.addEventListener("change", displayCart);
}

// ================= ORDERS PAGE =================

const orderUserId = document.getElementById("orderUserId");

if (orderUserId) {
    orderUserId.addEventListener("change", () => {
        fillCustomer(
            orderUserId.value,
            "orderCustomerName",
            "orderCustomerEmail"
        );
    });
}

// PLACE ORDER

const orderForm = document.getElementById("orderForm");

if (orderForm) {
    orderForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        if (!confirm("Do you want to place this order?")) return;

        try {
            const result = await api("/api/orders", "POST", {
                user_id: orderUserId.value
            });

            alert(
                result.message +
                "\nOrder ID: " + result.order_id +
                "\nTotal: ₹" + Number(result.total_amount).toFixed(2)
            );

            orderForm.reset();
            document.getElementById("orderCustomerName").value = "";
            document.getElementById("orderCustomerEmail").value = "";

            displayOrders();
        } catch (error) {
            showError(error);
        }
    });
}

// DISPLAY ORDERS

async function displayOrders() {
    const table = document.getElementById("orderTable");
    if (!table) return;

    try {
        const orders = await api("/api/orders");
        table.innerHTML = "";

        orders.forEach(order => {
            const row = document.createElement("tr");

            const values = [
                order.order_id,
                order.name,
                order.email,
                "₹" + Number(order.total_amount).toFixed(2),
                new Date(order.order_date).toLocaleString(),
                order.status
            ];

            values.forEach(value => {
                const td = document.createElement("td");
                td.textContent = value;
                row.appendChild(td);
            });

            table.appendChild(row);
        });

    } catch (error) {
        showError(error);
    }
}

// ================= ADMIN PAGE =================

// LOAD EXISTING PRODUCT INTO FORM

const productId = document.getElementById("productId");

if (productId) {
    productId.addEventListener("change", async () => {
        if (!productId.value) return;

        try {
            const p = await api("/api/products/" + productId.value);

            document.getElementById("productName").value = p.product_name;
            document.getElementById("productCategory").value = p.category;
            document.getElementById("productPrice").value = p.price;
            document.getElementById("productDescription").value = p.description;
            document.getElementById("productStock").value = p.stock;

        } catch (error) {
            showError(error);
        }
    });
}

// DISPLAY ADMIN PRODUCT TABLE

async function displayAdminProducts() {
    const table = document.getElementById("adminProductTable");
    if (!table) return;

    try {
        const products = await api("/api/products");
        table.innerHTML = "";

        products.forEach(p => {
            const row = document.createElement("tr");

            [
                p.product_id,
                p.product_name,
                p.category,
                "₹" + p.price,
                p.stock
            ].forEach(value => {
                const td = document.createElement("td");
                td.textContent = value;
                row.appendChild(td);
            });

            table.appendChild(row);
        });

    } catch (error) {
        showError(error);
    }
}

// ADD PRODUCT

const productForm = document.getElementById("productForm");

if (productForm) {
    productForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        try {
            const data = {
                product_name: document.getElementById("productName").value,
                category: document.getElementById("productCategory").value,
                price: Number(document.getElementById("productPrice").value),
                description: document.getElementById("productDescription").value,
                stock: Number(document.getElementById("productStock").value)
            };

            const result = await api("/api/products", "POST", data);

            alert(result.message);
            productForm.reset();

            await loadProductOptions(["productId"]);
            displayAdminProducts();
        } catch (error) {
            showError(error);
        }
    });
}

// UPDATE PRODUCT

const updateProduct = document.getElementById("updateProduct");

if (updateProduct) {
    updateProduct.addEventListener("click", async () => {
        const id = productId.value;

        if (!id) {
            alert("Select Product ID first!");
            return;
        }

        try {
            const data = {
                product_name: document.getElementById("productName").value,
                category: document.getElementById("productCategory").value,
                price: Number(document.getElementById("productPrice").value),
                description: document.getElementById("productDescription").value,
                stock: Number(document.getElementById("productStock").value)
            };

            const result = await api("/api/products/" + id, "PUT", data);

            alert(result.message);
            productForm.reset();

            await loadProductOptions(["productId"]);
            displayAdminProducts();
        } catch (error) {
            showError(error);
        }
    });
}

// DELETE PRODUCT

const deleteProduct = document.getElementById("deleteProduct");

if (deleteProduct) {
    deleteProduct.addEventListener("click", async () => {
        const id = productId.value;

        if (!id) {
            alert("Select Product ID first!");
            return;
        }

        if (!confirm("Are you sure you want to delete this product?")) return;

        try {
            const result = await api("/api/products/" + id, "DELETE");

            alert(result.message);
            productForm.reset();

            await loadProductOptions(["productId"]);
            displayAdminProducts();
        } catch (error) {
            showError(error);
        }
    });
}

// ORDER STATUS MANAGEMENT

const adminOrderId = document.getElementById("adminOrderId");

async function loadAdminOrders() {
    if (!adminOrderId) return;

    try {
        const orders = await api("/api/orders");

        adminOrderId.innerHTML = '<option value="">Select Order ID</option>';

        orders.forEach(order => {
            const option = document.createElement("option");
            option.value = order.order_id;
            option.textContent = "Order " + order.order_id +
                " - " + order.name + " - " + order.status;
            adminOrderId.appendChild(option);
        });
    } catch (error) {
        showError(error);
    }
}

const updateOrderStatus = document.getElementById("updateOrderStatus");

if (updateOrderStatus) {
    updateOrderStatus.addEventListener("click", async () => {
        const id = adminOrderId.value;
        const status = document.getElementById("adminOrderStatus").value;

        if (!id) {
            alert("Select Order ID!");
            return;
        }

        try {
            const result = await api(
                "/api/orders/" + id,
                "PUT",
                { status }
            );

            alert(result.message);
            await loadAdminOrders();
            displayOrders();
        } catch (error) {
            showError(error);
        }
    });
}

// ================= INITIAL PAGE LOADING =================

async function initializePage() {
    const page = document.body.dataset.page;

    try {
        if (page === "products") {
            await loadUsers(["shopUserId"]);
            await loadProductOptions(["shopProductId"]);
            await displayProducts();
        }

        if (page === "cart") {
            await loadUsers(["cartUserId", "viewCartUserId"]);
            await loadProductOptions(["cartProductId"]);
        }

        if (page === "orders") {
            await loadUsers(["orderUserId"]);
            await displayOrders();
        }

        if (page === "admin") {
            await loadProductOptions(["productId"]);
            await displayAdminProducts();
            await loadAdminOrders();
        }

    } catch (error) {
        showError(error);
    }
}

initializePage();
