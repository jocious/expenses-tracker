
/*
    PERSONAL EXPENSE TRACKER
    Commit 1: Improved expense management
*/

// Load saved expenses from localStorage.
// If there are no saved expenses, start with an empty array.
let expenses = JSON.parse(localStorage.getItem("expenses")) || [];

// Get today's date in YYYY-MM-DD format using the local date.
function getTodayDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

// Set the date field to today's date when the page opens.
document.getElementById("expenseDate").value = getTodayDate();

// Format numbers as Philippine pesos.
function formatPeso(amount) {
    return Number(amount).toLocaleString("en-PH", {
        style: "currency",
        currency: "PHP"
    });
}

// Save the current expenses in the browser.
function saveExpenses() {
    localStorage.setItem("expenses", JSON.stringify(expenses));
}

// Add a new expense after checking the form.
function addExpense() {
    const nameInput = document.getElementById("expenseName");
    const amountInput = document.getElementById("expenseAmount");
    const categoryInput = document.getElementById("expenseCategory");
    const dateInput = document.getElementById("expenseDate");

    // Remove extra spaces from the beginning and end of the name.
    const name = nameInput.value.trim();
    const amount = Number(amountInput.value);
    const category = categoryInput.value;
    const date = dateInput.value;

    // Make sure the user entered an expense name.
    if (name === "") {
        alert("Please enter an expense name.");
        nameInput.focus();
        return;
    }

    // Reject missing, zero, negative, or invalid amounts.
    if (amountInput.value.trim() === "" ||
        !Number.isFinite(amount) || amount <= 0) {
        alert("Please enter an amount greater than zero.");
        amountInput.focus();
        return;
    }

    // A date is required for each expense.
    if (date === "") {
        alert("Please select the expense date.");
        dateInput.focus();
        return;
    }

    // Create an object containing the expense information.
    const expense = {
        name: name,
        amount: amount,
        category: category,
        date: date
    };

    // Add the new expense to the array.
    expenses.push(expense);

    // Save the updated array and refresh the display.
    saveExpenses();
    displayExpenses();

    // Clear the name and amount for the next entry.
    nameInput.value = "";
    amountInput.value = "";

    // Set the date back to today.
    dateInput.value = getTodayDate();

    nameInput.focus();
}

// Display the expenses and calculate the total amount.
function displayExpenses() {
    const list = document.getElementById("expenseList");
    const total = document.getElementById("total");

    // Remove the old list before displaying the updated one.
    list.innerHTML = "";

    let totalAmount = 0;

    expenses.forEach(function(expense, index) {
        // Add this expense's amount to the running total.
        totalAmount += Number(expense.amount) || 0;

        // Create a list item for the expense.
        const item = document.createElement("li");

        // Use textContent to display the name safely as plain text.
        const details = document.createElement("div");
        details.className = "expense-details";

        const expenseName = document.createElement("strong");
        expenseName.textContent = expense.name;

        const expenseInfo = document.createElement("span");
        expenseInfo.className = "expense-info";

        // Older saved expenses may not have a date yet.
        const expenseDate = expense.date || "Date not recorded";

        expenseInfo.textContent =
            `${expense.category} | ${expenseDate}`;

        const expenseAmount = document.createElement("span");
        expenseAmount.className = "expense-amount";
        expenseAmount.textContent = formatPeso(expense.amount);

        details.appendChild(expenseName);
        details.appendChild(expenseInfo);
        details.appendChild(expenseAmount);

        // Create a delete button for this expense.
        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "delete-button";
        deleteButton.textContent = "Delete";

        // Use the current array index to delete the correct expense.
        deleteButton.addEventListener("click", function() {
            deleteExpense(index);
        });

        item.appendChild(details);
        item.appendChild(deleteButton);
        list.appendChild(item);
    });

    // Show the total with two decimal places and the PHP currency symbol.
    total.textContent = formatPeso(totalAmount);
}

// Delete an expense from the array.
function deleteExpense(index) {
    // Stop if the requested index does not exist.
    if (index < 0 || index >= expenses.length) {
        return;
    }

    // Remove one expense at the selected position.
    expenses.splice(index, 1);

    // Save the change and redraw the list.
    saveExpenses();
    displayExpenses();
}

// Display any expenses that were saved from a previous visit.
displayExpenses();
